// Checks pack words against the real judge with the test doodles in
// scripts/doodles. Needs `pnpm dev` with LAB_ENABLED=1, JUDGE_MODE=live and
// CLEF_PROVIDER=ollama in .env.local, so every check runs on a local Clef, free.
//   node --import ./scripts/ts-hooks.mjs scripts/word-check.mjs <results.json> [pack id | word ...] [--redo]
// Each word's doodle is judged twice: alone, and in one batch with doodles of
// its look-alikes (or a scribble), like a busy round. Scores shift with the
// company a drawing keeps, by 15 points or so. A word passes when its doodle
// blazes both times and no look-alike's doodle does. Results are saved after
// every word; a rerun skips words whose doodles haven't changed, unless --redo.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PACKS } from '#/shared/prompts'
import { BLAZE_THRESHOLD } from '#/shared/protocol'
import { doodleFor, SCRIBBLE } from './doodles/index.mjs'

const args = process.argv.slice(2)
const redo = args.includes('--redo')
const [outFile, ...picks] = args.filter((a) => !a.startsWith('--'))
if (!outFile) throw new Error('usage: word-check.mjs <results.json> [pack id | word ...] [--redo]')
const BASE = process.env.LAB_URL ?? 'http://localhost:3000'

const themed = PACKS.slice(1)
const packOf = new Map(themed.flatMap((p) => p.words.map((w) => [w.word, p.id])))
const words = []
for (const pick of picks.length ? picks : themed.map((p) => p.id)) {
  const pack = themed.find((p) => p.id === pick)
  if (pack) words.push(...pack.words)
  else {
    const word = PACKS[0].words.find((w) => w.word === pick)
    if (!word) throw new Error(`unknown pack or word: ${pick}`)
    words.push(word)
  }
}

const results = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {}
const hash = (drawings) => createHash('sha1').update(JSON.stringify(drawings)).digest('hex').slice(0, 12)
const pct = (v) => `${Math.round(v * 100)}`.padStart(3)

for (const prompt of words) {
  const own = doodleFor(prompt.word)
  if (!own) {
    console.log(`${prompt.word.padEnd(18)} no doodle`)
    continue
  }
  const others = prompt.distractors.filter((d) => doodleFor(d)).map((d) => ({ label: d, drawing: doodleFor(d) }))
  if (others.length < 3) others.push({ label: '(scribble)', drawing: SCRIBBLE })
  const batch = [{ label: prompt.word, drawing: own }, ...others]
  const key = hash(batch.map((b) => b.drawing))
  const prev = results[prompt.word]
  const same = prev?.key === key && (!prev.distractors || prev.distractors.join() === prompt.distractors.join())
  if (!redo && !picks.includes(prompt.word) && same) continue

  const alone = await judge(prompt.word, [own])
  const crowd = await judge(prompt.word, batch.map((b) => b.drawing))
  if (!alone || !crowd) continue
  const [solo] = alone.judgements
  const [mine, ...rest] = crowd.judgements
  const lookalikes = rest.map((j, i) => ({ word: others[i].label, meter: j.meter, top: j.top }))
  const falseBlaze = lookalikes.filter((l) => l.meter >= BLAZE_THRESHOLD)
  const meter = Math.min(solo.meter, mine.meter)
  const pass = meter >= BLAZE_THRESHOLD && falseBlaze.length === 0
  results[prompt.word] = {
    pack: packOf.get(prompt.word),
    pass,
    meter,
    alone: solo.meter,
    crowd: mine.meter,
    top: solo.meter <= mine.meter ? solo.top : mine.top,
    lookalikes,
    ms: alone.ms + crowd.ms,
    key,
    distractors: prompt.distractors,
  }
  writeFileSync(outFile, JSON.stringify(results, null, 1))
  console.log(
    `${pass ? 'pass' : 'FAIL'} ${prompt.word.padEnd(18)} alone ${pct(solo.meter)}% (${solo.top})  crowd ${pct(mine.meter)}%  |  ${lookalikes
      .map((l) => `${l.word} ${pct(l.meter)}${l.meter >= BLAZE_THRESHOLD ? '!' : ''}`)
      .join(', ')}  ${alone.ms + crowd.ms} ms`,
  )
}

async function judge(word, drawings) {
  const res = await fetch(`${BASE}/api/lab/judge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ word, drawings }),
  })
  if (!res.ok) {
    console.log(`${word.padEnd(18)} HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
    return null
  }
  const r = await res.json()
  // Never spend money by accident: this check is for a local Clef only.
  if (r.mode !== 'live' || r.provider !== 'ollama') {
    throw new Error(`The dev server judges with mode=${r.mode}, provider=${r.provider}. Set JUDGE_MODE=live and CLEF_PROVIDER=ollama.`)
  }
  return r
}

const checked = words.map((w) => results[w.word]).filter(Boolean)
const failed = words.filter((w) => results[w.word] && !results[w.word].pass)
console.log(`\n${checked.length - failed.length}/${checked.length} pass (${words.length} words asked)`)
for (const w of failed) {
  const r = results[w.word]
  const why = r.meter < BLAZE_THRESHOLD ? `own doodle ${pct(r.alone)}% alone, ${pct(r.crowd)}% in a crowd (top: ${r.top})` : ''
  const fb = r.lookalikes.filter((l) => l.meter >= BLAZE_THRESHOLD).map((l) => `${l.word} blazed ${pct(l.meter)}%`)
  console.log(`  ${w.word}: ${[why, ...fb].filter(Boolean).join('; ')}`)
}
