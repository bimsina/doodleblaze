// Drishti: asks Cloudflare's Clef decision model what a doodle depicts.

import type { PromptWord } from '#/shared/prompts'

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

const OTHER = 'something_else'
const SCRIBBLE = 'scribble'

export type Judgement = {
  /** 0..1, what the player's meter shows. */
  meter: number
  /** Raw probability Clef gave the target word. */
  target: number
  /** Probability the doodle contains written letters or numbers. */
  writing: number
  /** Drishti's top pick, as a word ("something else" and "scribble" included). */
  top: string
  /** Best non-target pick, for Drishti's "Is that... a fox?" lines. */
  guess: string | null
  probabilities: Record<string, number>
}

export type BatchResult = { judgements: Judgement[]; ms: number; inputTokens: number }

export const slug = (word: string) => word.toLowerCase().replace(/[^a-z0-9]+/g, '_')

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

function criteriaFor(words: string[]): Record<string, string> {
  const criteria: Record<string, string> = {}
  for (const word of words) criteria[slug(word)] = `a ${word}`
  criteria[OTHER] = 'something else that is recognizable but is none of the other options'
  criteria[SCRIBBLE] = 'random scribbles, abstract marks, or an almost empty canvas'
  return criteria
}

const STATE_ONE =
  'A quick black-pen doodle drawn in under a minute in a party drawing game. Judge only what the doodle visually depicts, as a friend looking over the player\'s shoulder would.'

const stateMany = (n: number) =>
  `${n} separate quick black-pen doodles, shown as image 1 to image ${n} in order, each drawn by a different player in under a minute in a party drawing game. Judge each image on its own, only by what it visually depicts.`

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
  temperature = METER_TEMPERATURE,
): Promise<BatchResult> {
  const criteria = criteriaFor(options)
  const questions: Record<string, ClefQuestion> = {}
  const many = images.length > 1
  images.forEach((_, i) => {
    const which = many ? `image ${i + 1}` : 'this doodle'
    questions[`d${i}`] = { type: 'choice', instructions: `What does ${which} depict?`, criteria }
    questions[`w${i}`] = {
      type: 'noul',
      instructions: `Does ${which} contain written letters, words, or numbers?`,
    }
  })
  const started = Date.now()
  const out = await runClef(ai, {
    model,
    state: many ? stateMany(images.length) : STATE_ONE,
    images,
    questions,
  })
  const ms = Date.now() - started
  const labels: Record<string, string> = { [OTHER]: 'something else', [SCRIBBLE]: 'scribble' }
  for (const word of options) labels[slug(word)] = word
  const targetKey = slug(prompt.word)

  const judgements = images.map((_, i): Judgement => {
    const d = out.answers[`d${i}`]
    const wr = out.answers[`w${i}`]
    const raw = d.type === 'choice' ? d.probabilities : {}
    const probs = temper(raw, temperature)
    const writing = wr.type === 'noul' ? wr.noul : 0
    const target = probs[targetKey] ?? 0
    const ranked = Object.entries(probs).sort((a, b) => b[1] - a[1])
    const first = ranked.at(0)?.[0] ?? SCRIBBLE
    const top = first in labels ? labels[first] : first
    const guessKey = ranked.find(([k]) => k !== targetKey && k !== OTHER && k !== SCRIBBLE)?.[0]
    const probabilities: Record<string, number> = {}
    for (const [k, v] of ranked) probabilities[labels[k] ?? k] = round3(v)
    return {
      meter: round3(target * (1 - writing)),
      target: round3(raw[targetKey] ?? 0),
      writing: round3(writing),
      top,
      guess: guessKey ? labels[guessKey] : null,
      probabilities,
    }
  })
  return { judgements, ms, inputTokens: out.usage.input_tokens }
}

/**
 * Drishti's best guess against its whole vocabulary, for the reveal gallery.
 * No catch-all option here: even a scribble gets compared to a real thing,
 * which is where the funny guesses come from.
 */
export async function verdict(ai: Ai, model: ClefModel, image: string, vocabulary: string[]) {
  const criteria: Record<string, string> = {}
  for (const word of vocabulary) criteria[slug(word)] = `a ${word}`
  const out = await runClef(ai, {
    model,
    state: STATE_ONE,
    images: [image],
    questions: { v: { type: 'choice', instructions: 'What does this doodle depict?', criteria } },
  })
  const a = out.answers.v
  if (a.type !== 'choice') return { label: vocabulary[0], p: 0 }
  const label = vocabulary.find((word) => slug(word) === a.choice) ?? a.choice.replaceAll('_', ' ')
  return { label, p: round3(a.probabilities[a.choice] ?? 0) }
}

function runClef(ai: Ai, input: ClefInput): Promise<ClefOutput> {
  // Clef isn't in the generated Workers AI model types yet.
  const run = ai.run.bind(ai) as unknown as (model: string, input: ClefInput) => Promise<ClefOutput>
  return run(`@cf/cloudflare/${input.model}`, input)
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
