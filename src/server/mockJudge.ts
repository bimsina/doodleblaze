// A free stand-in for Clef, used when JUDGE_MODE=mock (the local dev default).
// It never calls the API. Meters climb with how much ink is on the page, plus
// some noise, so you can still play and win rounds while testing. The same
// drawing always gets the same answer, like the real judge.

import { toJudgement } from '#/server/judge'
import type { BatchResult } from '#/server/judge'
import { OTHER, SCRIBBLE, slug, WRITING } from '#/shared/prompts'
import type { PromptWord } from '#/shared/prompts'

/** A blank 256px PNG is ~560 bytes; a finished doodle is 3–6 KB. */
const BLANK_BYTES = 700
const FULL_BYTES = 4_500

export async function mockBatch(prompt: PromptWord, options: string[], images: string[]): Promise<BatchResult> {
  const started = Date.now()
  await delay(150 + Math.random() * 300)
  const judgements = images.map((image) => {
    const rand = seeded(image)
    const ink = Math.min(1, Math.max(0, (bytesOf(image) - BLANK_BYTES) / (FULL_BYTES - BLANK_BYTES)))
    // Noise grows with the ink, so a near-empty page stays near 0.
    const target = Math.min(0.97, Math.max(0.005, ink * 0.9 + (rand() - 0.45) * 0.35 * Math.min(1, ink * 2)))
    // Share what's left: mostly "scribble" while the page is nearly empty, look-alikes later.
    const others = [...options.filter((o) => o !== prompt.word).map(slug), OTHER, SCRIBBLE, WRITING]
    const weights = others.map((k) => (k === SCRIBBLE ? 3 * (1 - ink) : k === WRITING ? 0.05 : rand() + 0.1))
    const total = weights.reduce((a, b) => a + b, 0)
    const raw: Record<string, number> = { [slug(prompt.word)]: target }
    others.forEach((k, i) => (raw[k] = ((1 - target) * weights[i]) / total))
    // Raw probabilities are already in meter units here, so skip the sharpening.
    return toJudgement(raw, prompt.word, options, 1)
  })
  return { judgements, ms: Date.now() - started, inputTokens: 0 }
}

export async function mockVerdict(image: string, vocabulary: string[]) {
  await delay(150 + Math.random() * 300)
  const rand = seeded(image)
  return { label: vocabulary[Math.floor(rand() * vocabulary.length)], p: Math.round((0.05 + rand() * 0.6) * 1000) / 1000 }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const bytesOf = (dataUrl: string) => ((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4

/** A small deterministic random generator seeded from the image. */
function seeded(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 7) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
