// Renders stroke data to a small grayscale PNG on the server, so Drishti only
// ever judges pen strokes (a client can't upload a photo instead).

import { COORD_MAX, ERASER_WIDTH, PEN_WIDTH } from '#/shared/protocol'
import type { Stroke } from '#/shared/protocol'

// Clef scales anything smaller up to ~256x256, so this is the cheapest size
// that loses nothing: (256 / 32)^2 + 3 = 67 input tokens per image.
export const RENDER_SIZE = 256

export type RenderOptions = {
  size?: number
  /** Zoom in on small doodles. Clef reads drawings best with plenty of paper around them. */
  crop?: boolean
  /** Frame side as a multiple of the ink's larger dimension when cropping. */
  margin?: number
}

export type Rendered = { dataUrl: string; bytes: number; empty: boolean }

export async function renderStrokes(
  strokes: Stroke[],
  { size = RENDER_SIZE, crop = true, margin = 2 }: RenderOptions = {},
): Promise<Rendered> {
  const view = crop ? cropView(strokes, margin) : { x: 0, y: 0, side: COORD_MAX }
  const scale = size / view.side
  const zoom = COORD_MAX / view.side
  const penRadius = clamp((PEN_WIDTH * size * zoom) / 2, 1.25, 2.75)
  const eraserRadius = (ERASER_WIDTH * size * zoom) / 2

  // 1 = white paper, 0 = black ink.
  const img = new Float32Array(size * size).fill(1)
  const mask = new Float32Array(size * size)

  for (const stroke of strokes) {
    const radius = stroke.e ? eraserRadius : penRadius
    const box = { x0: size, y0: size, x1: -1, y1: -1 }
    const p = stroke.p
    if (p.length < 2) continue
    const px = (i: number) => (p[i] - view.x) * scale
    const py = (i: number) => (p[i + 1] - view.y) * scale
    if (p.length === 2) {
      coverSegment(mask, size, px(0), py(0), px(0), py(0), radius, box)
    }
    for (let i = 2; i + 1 < p.length; i += 2) {
      coverSegment(mask, size, px(i - 2), py(i - 2), px(i), py(i), radius, box)
    }
    for (let y = box.y0; y <= box.y1; y++) {
      for (let x = box.x0; x <= box.x1; x++) {
        const k = y * size + x
        const c = mask[k]
        if (c === 0) continue
        img[k] = stroke.e ? img[k] + (1 - img[k]) * c : img[k] * (1 - c)
        mask[k] = 0
      }
    }
  }

  let empty = true
  const pixels = new Uint8Array(size * size)
  for (let k = 0; k < pixels.length; k++) {
    pixels[k] = Math.round(img[k] * 255)
    if (pixels[k] < 128) empty = false
  }
  const png = await encodeGrayPng(pixels, size, size)
  return { dataUrl: `data:image/png;base64,${toBase64(png)}`, bytes: png.length, empty }
}

function cropView(strokes: Stroke[], margin: number) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const s of strokes) {
    if (s.e) continue
    for (let i = 0; i + 1 < s.p.length; i += 2) {
      x0 = Math.min(x0, s.p[i])
      x1 = Math.max(x1, s.p[i])
      y0 = Math.min(y0, s.p[i + 1])
      y1 = Math.max(y1, s.p[i + 1])
    }
  }
  if (x0 === Infinity) return { x: 0, y: 0, side: COORD_MAX }
  // A square around the ink with some breathing room, never zoomed in so far
  // that a single dot fills the frame.
  const side = clamp(Math.max(x1 - x0, y1 - y0) * margin + PEN_WIDTH * COORD_MAX * 2, COORD_MAX * 0.3, COORD_MAX)
  return { x: (x0 + x1) / 2 - side / 2, y: (y0 + y1) / 2 - side / 2, side }
}

type Box = { x0: number; y0: number; x1: number; y1: number }

// Anti-aliased capsule coverage: 1 inside the stroke, fading over one pixel.
function coverSegment(
  mask: Float32Array,
  size: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number,
  box: Box,
) {
  const minX = Math.max(0, Math.floor(Math.min(ax, bx) - r - 1))
  const maxX = Math.min(size - 1, Math.ceil(Math.max(ax, bx) + r + 1))
  const minY = Math.max(0, Math.floor(Math.min(ay, by) - r - 1))
  const maxY = Math.min(size - 1, Math.ceil(Math.max(ay, by) + r + 1))
  if (minX > maxX || minY > maxY) return
  box.x0 = Math.min(box.x0, minX)
  box.y0 = Math.min(box.y0, minY)
  box.x1 = Math.max(box.x1, maxX)
  box.y1 = Math.max(box.y1, maxY)
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cx = x + 0.5 - ax
      const cy = y + 0.5 - ay
      const t = len2 === 0 ? 0 : clamp((cx * dx + cy * dy) / len2, 0, 1)
      const ex = cx - t * dx
      const ey = cy - t * dy
      const c = clamp(r + 0.5 - Math.sqrt(ex * ex + ey * ey), 0, 1)
      const k = y * size + x
      if (c > mask[k]) mask[k] = c
    }
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

// --- Minimal PNG encoder (8-bit grayscale, zlib via CompressionStream) ---

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array) {
  const out = new Uint8Array(12 + data.length)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function encodeGrayPng(pixels: Uint8Array, width: number, height: number) {
  const ihdr = new Uint8Array(13)
  const dv = new DataView(ihdr.buffer)
  dv.setUint32(0, width)
  dv.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 0 // grayscale
  const raw = new Uint8Array((width + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0 // filter: none
    raw.set(pixels.subarray(y * width, (y + 1) * width), y * (width + 1) + 1)
  }
  const zipped = new Uint8Array(
    await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer(),
  )
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zipped),
    chunk('IEND', new Uint8Array()),
  ]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function toBase64(bytes: Uint8Array) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(s)
}
