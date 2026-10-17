// Every test doodle, keyed by the word's answer key (slug). One module per
// pack, named after the pack id, each a map of word -> () => strokes.
// kit.mjs is the pen they draw with.
import { readdirSync } from 'node:fs'
import { line, reseed, strokes } from './kit.mjs'

const dir = new URL('./', import.meta.url)
const NOT_PACKS = new Set(['kit.mjs', 'index.mjs', 'preview.mjs'])

/** Same rule as slug() in src/shared/prompts.ts, for the ASCII words the packs use. */
export const keyOf = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, '_')

export const DOODLES = {}
for (const file of readdirSync(dir).filter((f) => f.endsWith('.mjs') && !NOT_PACKS.has(f)).sort()) {
  try {
    const { default: doodles } = await import(new URL(file, dir).href)
    for (const [word, draw] of Object.entries(doodles)) {
      reseed(word)
      DOODLES[keyOf(word)] = strokes(draw())
    }
  } catch (err) {
    // One broken pack shouldn't stop the others from being checked.
    console.warn(`skipping ${file}: ${err.message}`)
  }
}

export const doodleFor = (word) => DOODLES[keyOf(word)]

/** A messy scribble: should never blaze for anything. */
reseed('scribble')
export const SCRIBBLE = strokes([
  line(...Array.from({ length: 40 }, (_, i) => [250 + ((i * 137) % 500), 250 + ((i * 251) % 500)])),
])
