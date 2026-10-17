// Synthetic doodles in the game's stroke format (coords 0..1000).
const R = (n) => Math.round(n)
const jitter = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s / 2147483647 - 0.5) * 8
  }
}
const j = jitter(42)
const pts = (arr) => ({ e: false, p: arr.flatMap(([x, y]) => [R(x + j()), R(y + j())]) })
const circle = (cx, cy, r, ry = r, a0 = 0, a1 = Math.PI * 2, n = 36) =>
  pts(Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * ry]
  }))
const line = (...xy) => pts(xy)
const dot = (x, y) => circle(x, y, 8, 8, 0, Math.PI * 2, 8)

const catHead = [circle(500, 540, 230, 200)]
const catEars = [line([330, 400], [300, 170], [440, 350]), line([560, 350], [700, 170], [670, 400])]
const catFace = [dot(420, 500), dot(580, 500), line([480, 570], [520, 570], [500, 595], [480, 570]),
  line([500, 595], [470, 630]), line([500, 595], [530, 630])]
const catWhiskers = [line([440, 590], [260, 560]), line([440, 605], [260, 620]), line([440, 620], [280, 680]),
  line([560, 590], [740, 560]), line([560, 605], [740, 620]), line([560, 620], [720, 680])]

export const DRAWINGS = {
  cat_1_head: catHead,
  cat_2_ears: [...catHead, ...catEars],
  cat_3_face: [...catHead, ...catEars, ...catFace],
  cat_4_whiskers: [...catHead, ...catEars, ...catFace, ...catWhiskers],
  house: [line([250, 450], [250, 800], [750, 800], [750, 450], [250, 450]), line([200, 470], [500, 200], [800, 470]),
    line([450, 800], [450, 650], [550, 650], [550, 800]), line([300, 520], [400, 520], [400, 600], [300, 600], [300, 520])],
  sun: [circle(500, 500, 150), ...Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2
    return line([500 + Math.cos(a) * 190, 500 + Math.sin(a) * 190], [500 + Math.cos(a) * 300, 500 + Math.sin(a) * 300])
  })],
  fish: [circle(450, 500, 220, 130), line([660, 500], [820, 380], [820, 620], [660, 500]), dot(320, 470),
    line([400, 380], [430, 620])],
  tiny_cat_corner: [...catHead, ...catEars, ...catFace, ...catWhiskers].map((s) => ({
    e: false, p: s.p.map((v, i) => (i % 2 === 0 ? 60 + v * 0.25 : 60 + v * 0.25)),
  })),
  giraffe: [circle(450, 600, 170, 90), line([330, 650], [320, 900]), line([400, 680], [400, 900]),
    line([500, 680], [500, 900]), line([570, 650], [580, 900]), line([560, 540], [640, 180]), line([610, 560], [690, 200]),
    circle(690, 170, 70, 40), line([670, 130], [660, 80]), line([710, 130], [720, 80]), dot(400, 590), dot(480, 620), dot(640, 330),
    line([290, 600], [220, 700])],
  written_cat: [line([380, 400], [260, 400], [260, 600], [380, 600]), line([430, 600], [500, 400], [570, 600]), line([455, 530], [545, 530]),
    line([610, 400], [770, 400]), line([690, 400], [690, 600])],
  cat_plus_label: [...catHead, ...catEars, ...catFace, ...catWhiskers,
    line([380, 800], [300, 800], [300, 900], [380, 900]), line([420, 900], [460, 800], [500, 900]), line([540, 800], [640, 800]), line([590, 800], [590, 900])],
  scribble: [pts(Array.from({ length: 60 }, (_, i) => [200 + ((i * 137) % 600), 200 + ((i * 251) % 600)]))],
  blank: [],
  pizza: [line([300, 250], [700, 250], [500, 850], [300, 250]), circle(500, 250, 200, 40, Math.PI, Math.PI * 2),
    circle(450, 380, 40), circle(560, 400, 40), circle(500, 560, 35)],
  umbrella: [circle(500, 450, 300, 220, Math.PI, Math.PI * 2), line([200, 450], [300, 410], [400, 450], [500, 410], [600, 450], [700, 410], [800, 450]),
    line([500, 230], [500, 780]), circle(450, 780, 50, 50, 0, Math.PI)],
}
