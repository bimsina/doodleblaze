// A tiny pen for drawing test doodles in the game's stroke format: a square
// canvas, x and y from 0 to 1000, y pointing down. Every helper returns one
// stroke ({ e: false, p: [x, y, x, y, ...] }) or an array of strokes; doodles
// can nest arrays freely. Lines wobble a little, like a real hand.

let seed = 1
/** Same doodle, same wobble: index.mjs reseeds before drawing each word. */
export function reseed(text) {
  seed = 2166136261
  for (const ch of text) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0
  seed ||= 1
}
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const wobble = (amount = 5) => (rand() - 0.5) * 2 * amount

const R = Math.round
const clampC = (v) => Math.min(1000, Math.max(0, R(v)))

/** Fills long straight runs with extra points, so the wobble reads as a hand, not a ruler. */
function resample(points, step = 30) {
  const out = []
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i]
    if (i > 0) {
      const [px, py] = points[i - 1]
      const n = Math.floor(Math.hypot(x - px, y - py) / step)
      for (let k = 1; k < n; k++) out.push([px + ((x - px) * k) / n, py + ((y - py) * k) / n])
    }
    out.push([x, y])
  }
  return out
}

/** A stroke through these points, as drawn: straight segments with a slight wobble. */
export function line(...points) {
  return { e: false, p: resample(points).flatMap(([x, y]) => [clampC(x + wobble()), clampC(y + wobble())]) }
}

/** A closed outline through these points. */
export const shape = (...points) => line(...points, points[0])

/** A smooth curve through these points (Catmull-Rom). */
export function curve(...points) {
  if (points.length < 3) return line(...points)
  const out = []
  const P = [points[0], ...points, points.at(-1)]
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]]
    const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 20))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const t2 = t * t
      const t3 = t2 * t
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(points.at(-1))
  return { e: false, p: out.flatMap(([x, y]) => [clampC(x + wobble(3)), clampC(y + wobble(3))]) }
}

/** A smooth closed loop through these points. */
export const blob = (...points) => curve(...points, points[0], points[1])

/**
 * An ellipse, or part of one. Angles in degrees: 0 is right, 90 is down
 * (y points down), so arc(500, 500, 100, 100, 0, 180) is the bottom half.
 */
export function arc(cx, cy, rx, ry = rx, from = 0, to = 360) {
  const n = Math.max(12, Math.ceil((Math.abs(to - from) / 360) * Math.max(rx, ry) * 0.25))
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return { e: false, p: pts.flatMap(([x, y]) => [clampC(x + wobble(3)), clampC(y + wobble(3))]) }
}

export const circle = (cx, cy, r) => arc(cx, cy, r, r)
export const ellipse = (cx, cy, rx, ry) => arc(cx, cy, rx, ry)
export const dot = (x, y, r = 10) => arc(x, y, r, r)
export const rect = (x, y, w, h) => shape([x, y], [x + w, y], [x + w, y + h], [x, y + h])

/** A star with `n` points. */
export function star(cx, cy, outer, inner = outer * 0.45, n = 5, turn = -90) {
  const pts = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer
    const a = ((turn + (i * 180) / n) * Math.PI) / 180
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return shape(...pts)
}

/** A spiral from the centre outwards. */
export function spiral(cx, cy, r, turns = 3) {
  const pts = []
  const n = turns * 36
  for (let i = 0; i <= n; i++) {
    const a = (i / 36) * Math.PI * 2
    const d = (r * i) / n
    pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d])
  }
  return curve(...pts)
}

/** A zigzag between two points, `n` teeth of height `amp`. */
export function zigzag(x0, y0, x1, y1, n = 6, amp = 30) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const pts = []
  for (let i = 0; i <= n * 2; i++) {
    const t = i / (n * 2)
    const o = i % 2 ? amp : -amp
    pts.push([x0 + dx * t + nx * o * (i === 0 || i === n * 2 ? 0 : 1), y0 + dy * t + ny * o * (i === 0 || i === n * 2 ? 0 : 1)])
  }
  return line(...pts)
}

/** A wavy line between two points. */
export function wave(x0, y0, x1, y1, n = 3, amp = 30) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const pts = []
  for (let i = 0; i <= n * 8; i++) {
    const t = i / (n * 8)
    const o = Math.sin(t * n * Math.PI * 2) * amp
    pts.push([x0 + dx * t + (-dy / len) * o, y0 + dy * t + (dx / len) * o])
  }
  return curve(...pts)
}

/** Several short parallel hatch lines across a box, for texture. */
export function hatch(x, y, w, h, n = 5, slant = 0.4) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n
    return line([x + w * t - h * slant * 0.5, y + h], [x + w * t + h * slant * 0.5, y])
  })
}

// --- Moving whole groups of strokes ---

const mapPoints = (strokes, f) =>
  [strokes].flat(Infinity).map((s) => {
    const p = []
    for (let i = 0; i < s.p.length; i += 2) {
      const [x, y] = f(s.p[i], s.p[i + 1])
      p.push(clampC(x), clampC(y))
    }
    return { e: s.e, p }
  })

export const shift = (strokes, dx, dy) => mapPoints(strokes, (x, y) => [x + dx, y + dy])
export const scale = (strokes, k, cx = 500, cy = 500) => mapPoints(strokes, (x, y) => [cx + (x - cx) * k, cy + (y - cy) * k])
export const flipX = (strokes, cx = 500) => mapPoints(strokes, (x, y) => [2 * cx - x, y])
export function rotate(strokes, deg, cx = 500, cy = 500) {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return mapPoints(strokes, (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])
}

/** Flattens a doodle (nested arrays of strokes) into the plain list the game sends. */
export const strokes = (doodle) => [doodle].flat(Infinity).filter((s) => s && s.p.length >= 2)
