// Tunes Drishti against synthetic doodles. Needs `pnpm dev` with LAB_ENABLED=1 in .env.local.
// Usage: node scripts/judge-lab.mjs <outDir> '<json-spec>'
// spec: [{ word, drawings: [names], model, crop, temperature, verdict }]
import { writeFileSync, mkdirSync } from 'node:fs'
import { DRAWINGS } from './lab-drawings.mjs'

const [outDir, specJson] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
for (const spec of JSON.parse(specJson)) {
  const res = await fetch('http://localhost:3000/api/lab/judge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...spec, drawings: spec.drawings.map((n) => DRAWINGS[n]) }),
  })
  if (!res.ok) {
    console.log(spec.word, spec.drawings.join('+'), 'HTTP', res.status, (await res.text()).slice(0, 300))
    continue
  }
  const r = await res.json()
  r.judgements.forEach((jg, i) => {
    const name = spec.drawings[i]
    const top3 = Object.entries(jg.probabilities).slice(0, 3).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}`).join(', ')
    const v = r.verdicts?.[i]
    console.log(
      `${r.model.padEnd(10)} ${spec.word.padEnd(9)} ${name.padEnd(16)} meter ${(jg.meter * 100).toFixed(0).padStart(3)}  target ${(jg.target * 100).toFixed(0).padStart(3)}  text ${(jg.writing * 100).toFixed(0).padStart(3)}  [${top3}]${v ? `  verdict ${v.label} ${(v.p * 100).toFixed(0)}` : ''}`,
    )
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.images[i].dataUrl.split(',')[1], 'base64'))
  })
  console.log(`   -> ${r.ms} ms, ${r.inputTokens} tokens, render ${r.renderMs} ms, ${r.images.map((i) => i.bytes).join('/')} bytes`)
}
