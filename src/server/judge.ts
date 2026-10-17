// Drishti: asks Cloudflare's Clef decision model what a doodle depicts.

import { env } from 'cloudflare:workers'
import type { PromptWord } from '#/shared/prompts'
import { mockBatch, mockVerdict } from '#/server/mockJudge'

export type ClefModel = 'clef' | 'clef-flash'

type ClefQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }

type ClefInput = {
  model: ClefModel
  state: string
  images?: string[]
  questions: Record<string, ClefQuestion>
}

type ClefAnswer =
  | { type: 'noul'; noul: number }
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }

type ClefOutput = {
  answers: Record<string, ClefAnswer>
  usage: { input_tokens: number; output_tokens: number }
}

export const OTHER = 'something_else'
export const SCRIBBLE = 'scribble'
export const WRITING = 'writing'

export type Judgement = {
  /** 0..1, what the player's meter shows. */
  meter: number
  /** Raw probability Clef gave the target word. */
  target: number
  /** Probability the doodle is written words rather than a drawing. */
  writing: number
  /** Drishti's top pick as a label: a word, "something else", "scribble" or "writing". */
  top: string
  /** How sure Drishti is of its top pick. */
  topP: number
  /** Best look-alike pick, for Drishti's "Is that... a fox?" lines. */
  guess: string | null
  probabilities: Record<string, number>
}

export type BatchResult = { judgements: Judgement[]; ms: number; inputTokens: number }

export const slug = (word: string) => word.toLowerCase().replace(/[^a-z0-9]+/g, '_')

/** `JUDGE_MODE=mock` (the local default) makes up judgements for free instead of calling Clef. */
export const judgeMode = () => (env.JUDGE_MODE === 'mock' ? 'mock' : 'live')

/** Labels in the order Clef sees them. Shuffle once per round and reuse it, so every player gets the same question. */
export function optionsFor(prompt: PromptWord, shuffle = true): string[] {
  const words = [prompt.word, ...prompt.distractors]
  if (shuffle) {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }
  }
  return words
}

// Prompt text is kept terse on purpose: every token is paid for on every
// check. Measured on the lab doodles, this costs 290 tokens for one drawing
// (242 per drawing in a batch of 4) against 414 for the wordy first version,
// with the same or better scores.
function criteriaFor(words: string[]): Record<string, string> {
  const criteria: Record<string, string> = {}
  for (const word of words) criteria[slug(word)] = word
  criteria[OTHER] = 'something else'
  criteria[SCRIBBLE] = 'scribbles or blank'
  // An answer option rather than a separate yes/no question: cheaper, and
  // writing the word scores 0 because "writing" wins outright.
  criteria[WRITING] = 'written words or letters'
  return criteria
}

const STATE_ONE = 'A quick doodle from a drawing game.'

const stateMany = (n: number) => `${n} quick doodles from a drawing game, images 1 to ${n}. Judge each separately.`

// Below 1 sharpens Clef's probabilities: a doodle that is clearly the target
// (cat 63%, fox 15%, dog 10%) reads as a confident 85%, while scribbles stay near 0.
export const METER_TEMPERATURE = 0.7

/** Judges up to 4 doodles of the same prompt in one Clef request (batching measured fine, and cheaper per image). */
export async function judgeBatch(
  ai: Ai,
  model: ClefModel,
  prompt: PromptWord,
  options: string[],
  images: string[],
  room: string,
  temperature = METER_TEMPERATURE,
): Promise<BatchResult> {
  if (judgeMode() === 'mock') return mockBatch(prompt, options, images)
  const criteria = criteriaFor(options)
  const questions: Record<string, ClefQuestion> = {}
  const many = images.length > 1
  images.forEach((_, i) => {
    questions[`d${i}`] = { type: 'choice', instructions: `What is ${many ? `image ${i + 1}` : 'it'}?`, criteria }
  })
  const started = Date.now()
  const out = await runClef(
    ai,
    { model, state: many ? stateMany(images.length) : STATE_ONE, images, questions },
    { room, kind: 'judge', drawings: images.length },
  )
  const ms = Date.now() - started
  const judgements = images.map((_, i) => {
    const d = out.answers[`d${i}`]
    return toJudgement(d.type === 'choice' ? d.probabilities : {}, prompt.word, options, temperature)
  })
  return { judgements, ms, inputTokens: out.usage.input_tokens }
}

/** Turns Clef's probabilities (keyed by option slug) into a meter reading. Shared with the mock judge. */
export function toJudgement(
  raw: Record<string, number>,
  word: string,
  options: string[],
  temperature = METER_TEMPERATURE,
): Judgement {
  const labels: Record<string, string> = { [OTHER]: 'something else', [SCRIBBLE]: 'scribble', [WRITING]: 'writing' }
  for (const option of options) labels[slug(option)] = option
  const targetKey = slug(word)
  const probs = temper(raw, temperature)
  const ranked = Object.entries(probs).sort((a, b) => b[1] - a[1])
  const [firstKey, firstP] = ranked.at(0) ?? [SCRIBBLE, 0]
  const guessKey = ranked.find(([k]) => k !== targetKey && k !== OTHER && k !== SCRIBBLE && k !== WRITING)?.[0]
  const probabilities: Record<string, number> = {}
  for (const [k, v] of ranked) probabilities[labels[k] ?? k] = round3(v)
  return {
    meter: round3(probs[targetKey] ?? 0),
    target: round3(raw[targetKey] ?? 0),
    writing: round3(raw[WRITING] ?? 0),
    top: labels[firstKey] ?? firstKey,
    topP: round3(firstP),
    guess: guessKey ? labels[guessKey] : null,
    probabilities,
  }
}

/**
 * Drishti's best guess against a list of words, for reveal cards the live
 * judgement can't explain ("something else"). No catch-all option here: even
 * a scribble gets compared to a real thing, which is where the funny guesses
 * come from. 150 words cost 3,370 tokens (14 judged drawings), so keep the list short.
 */
export async function verdict(ai: Ai, model: ClefModel, image: string, vocabulary: string[], room: string) {
  if (judgeMode() === 'mock') return mockVerdict(image, vocabulary)
  const criteria: Record<string, string> = {}
  for (const word of vocabulary) criteria[slug(word)] = word
  const out = await runClef(
    ai,
    { model, state: STATE_ONE, images: [image], questions: { v: { type: 'choice', instructions: 'What is it?', criteria } } },
    { room, kind: 'verdict', drawings: 1 },
  )
  const a = out.answers.v
  if (a.type !== 'choice') return { label: vocabulary[0], p: 0 }
  const label = vocabulary.find((word) => slug(word) === a.choice) ?? a.choice.replaceAll('_', ' ')
  return { label, p: round3(a.probabilities[a.choice] ?? 0) }
}

/** Every call goes through the AI Gateway, tagged so its logs and spend can be split by room and kind. */
function runClef(ai: Ai, input: ClefInput, metadata: Record<string, string | number>): Promise<ClefOutput> {
  // Clef isn't in the generated Workers AI model types yet.
  const run = ai.run.bind(ai) as unknown as (model: string, input: ClefInput, options: AiOptions) => Promise<ClefOutput>
  return run(`@cf/cloudflare/${input.model}`, input, { gateway: { id: env.AI_GATEWAY, metadata } })
}

// Re-tempering probabilities is equivalent to dividing Clef's logits by T.
function temper(probs: Record<string, number>, t: number) {
  if (t === 1) return probs
  const out: Record<string, number> = {}
  let sum = 0
  for (const [k, v] of Object.entries(probs)) {
    out[k] = Math.pow(Math.max(v, 1e-9), 1 / t)
    sum += out[k]
  }
  for (const k in out) out[k] /= sum
  return out
}

const round3 = (v: number) => Math.round(v * 1000) / 1000
