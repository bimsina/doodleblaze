// Renders test doodles exactly as Drishti sees them (the game's own rasterizer),
// so you can look at them before asking Clef.
//   node --import ./scripts/ts-hooks.mjs scripts/doodles/preview.mjs <outDir> [pack id | word ...]
// Writes <outDir>/<word>.png for each word and <outDir>/<pack>-sheet.png, a
// grid of the pack's doodles in pack order (6 per row, listed in the output).
import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync, inflateSync } from 'node:zlib'
import { PACKS } from '#/shared/prompts'
import { renderStrokes } from '#/server/raster'
import { doodleFor, keyOf } from './index.mjs'

const [outDir, ...picks] = process.argv.slice(2)
if (!outDir) throw new Error('usage: preview.mjs <outDir> [pack id | word ...]')
mkdirSync(outDir, { recursive: true })

const themed = PACKS.slice(1)
const groups = []
for (const pick of picks.length ? picks : themed.map((p) => p.id)) {
  const pack = themed.find((p) => p.id === pick)
  if (pack) groups.push({ name: pack.id, words: pack.words.map((w) => w.word) })
  else groups.push({ name: keyOf(pick), words: [pick] })
}

const CELL = 192
const COLS = 6
for (const group of groups) {
  const cells = []
  const missing = []
  for (const word of group.words) {
    const doodle = doodleFor(word)
    if (!doodle) {
      missing.push(word)
      continue
    }
    const big = await renderStrokes(doodle)
    writeFileSync(`${outDir}/${keyOf(word)}.png`, Buffer.from(big.dataUrl.split(',')[1], 'base64'))
    const small = await renderStrokes(doodle, { size: CELL })
    cells.push({ word, pixels: decodeGray(Buffer.from(small.dataUrl.split(',')[1], 'base64'), CELL) })
  }
  if (cells.length > 1) {
    const rows = Math.ceil(cells.length / COLS)
    const w = COLS * CELL + (COLS + 1) * 4
    const h = rows * CELL + (rows + 1) * 4
    const sheet = new Uint8Array(w * h).fill(160)
    cells.forEach((c, i) => {
      const ox = 4 + (i % COLS) * (CELL + 4)
      const oy = 4 + Math.floor(i / COLS) * (CELL + 4)
      for (let y = 0; y < CELL; y++) sheet.set(c.pixels.subarray(y * CELL, (y + 1) * CELL), (oy + y) * w + ox)
    })
    writeFileSync(`${outDir}/${group.name}-sheet.png`, encodeGray(sheet, w, h))
    console.log(`${group.name}-sheet.png, row by row:`)
    for (let r = 0; r < rows; r++) console.log(`  ${r + 1}: ${cells.slice(r * COLS, (r + 1) * COLS).map((c) => c.word).join(' | ')}`)
  }
  if (missing.length) console.log(`  missing doodles: ${missing.join(', ')}`)
}

/** Reads the 8-bit grayscale, unfiltered PNGs the game's rasterizer writes. */
function decodeGray(png, size) {
  const idat = []
  for (let o = 8; o < png.length; ) {
    const len = png.readUInt32BE(o)
    if (png.toString('latin1', o + 4, o + 8) === 'IDAT') idat.push(png.subarray(o + 8, o + 8 + len))
    o += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const out = new Uint8Array(size * size)
  for (let y = 0; y < size; y++) out.set(raw.subarray(y * (size + 1) + 1, (y + 1) * (size + 1)), y * size)
  return out
}

function encodeGray(pixels, w, h) {
  const raw = Buffer.alloc((w + 1) * h)
  for (let y = 0; y < h; y++) raw.set(pixels.subarray(y * w, (y + 1) * w), y * (w + 1) + 1)
  const chunk = (type, data) => {
    const head = Buffer.alloc(8)
    head.writeUInt32BE(data.length)
    head.write(type, 4, 'latin1')
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])))
    return Buffer.concat([head, data, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
