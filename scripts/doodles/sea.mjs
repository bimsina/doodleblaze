import { arc, blob, circle, curve, dot, ellipse, line, rect, shape, star, wave, zigzag } from './kit.mjs'

// --- Local helpers -----------------------------------------------------------

const rad = (deg) => (deg * Math.PI) / 180

/** A point on an ellipse; angles in degrees, 0 is right, 90 is down. */
const at = (cx, cy, rx, ry, deg) => [cx + Math.cos(rad(deg)) * rx, cy + Math.sin(rad(deg)) * ry]

/** Points along a Catmull-Rom path, densely sampled. */
function path(points, per = 12) {
  const P = [points[0], ...points, points.at(-1)]
  const out = []
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]]
    for (let k = 0; k < per; k++) {
      const t = k / per
      const f = (a, b, c, d) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(points.at(-1))
  return out
}

/** The two edges of a tube along a path, from half-width w0 to w1; plus the dense centre line. */
function tubeEdges(points, w0, w1) {
  const c = path(points)
  const left = []
  const right = []
  c.forEach(([x, y], i) => {
    const [ax, ay] = c[Math.max(0, i - 1)]
    const [bx, by] = c[Math.min(c.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    const w = w0 + ((w1 - w0) * i) / (c.length - 1)
    left.push([x + nx * w, y + ny * w])
    right.push([x - nx * w, y - ny * w])
  })
  return { left, right, centre: c }
}

/** Thins a dense point list so curve() can smooth it with a hand's wobble. */
const thin = (pts, every = 4) => pts.filter((_, i) => i % every === 0 || i === pts.length - 1)

/** A tapering tentacle drawn as one closed outline (both edges, round at the base). */
function tentacle(points, w0, w1 = 4) {
  const { left, right } = tubeEdges(points, w0, w1)
  return curve(...thin(left), ...thin(right).reverse())
}

/** An ellipse turned by `deg` degrees. */
function tilted(cx, cy, rx, ry, deg) {
  const pts = []
  for (let a = 0; a < 360; a += 30) {
    const [x, y] = [Math.cos(rad(a)) * rx, Math.sin(rad(a)) * ry]
    pts.push([cx + x * Math.cos(rad(deg)) - y * Math.sin(rad(deg)), cy + x * Math.sin(rad(deg)) + y * Math.cos(rad(deg))])
  }
  return blob(...pts)
}

/** A pincer: a round claw with a wedge bitten out, opening towards `deg`. */
function claw(cx, cy, r, deg, gape = 32) {
  const pts = []
  for (let a = deg + gape; a <= deg + 360 - gape; a += 24) pts.push(at(cx, cy, r, r * 0.8, a))
  pts.push(at(cx, cy, r, r * 0.8, deg + 360 - gape), [cx + (Math.cos(rad(deg)) * r) / 6, cy + (Math.sin(rad(deg)) * r) / 6], at(cx, cy, r, r * 0.8, deg + gape))
  return curve(...pts)
}

/** A long lobster claw from its wrist at (x, y), pointing towards `deg`: a big hand split into two fingers. */
function longClaw(x, y, len, wid, deg) {
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  const P = ([u, v]) => [x + u * len * c - v * wid * s, y + u * len * s + v * wid * c]
  return [
    curve(...[[0, -0.22], [0.3, -0.5], [0.7, -0.48], [1, -0.18], [0.62, -0.04], [0.92, 0.22], [0.68, 0.46], [0.3, 0.46], [0, 0.22]].map(P)),
    line(P([0, -0.22]), P([0, 0.22])),
  ]
}

/** Fish-scale arcs, open to the left. */
const scales = (pts, r = 30) => pts.map(([x, y]) => arc(x, y, r, r, -80, 80))

/** A small bubble. */
const bubble = (x, y, r) => [circle(x, y, r), arc(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, 190, 260)]

// --- Doodles -------------------------------------------------------------------

export default {
  fish: () => [
    // Oval body, forked tail, fins, gill and scales, blowing bubbles.
    blob([200, 500], [320, 385], [510, 350], [690, 430], [750, 500], [690, 570], [510, 650], [320, 615]),
    line([745, 500], [880, 385], [855, 500], [880, 615], [745, 500]),
    curve([470, 358], [530, 285], [640, 300], [650, 405]),
    curve([480, 642], [520, 700], [590, 690], [600, 610]),
    circle(300, 465, 24),
    dot(305, 465, 10),
    curve([395, 395], [365, 500], [395, 605]),
    curve([210, 520], [235, 535], [255, 522]),
    ...scales([
      [480, 450],
      [560, 450],
      [640, 480],
      [480, 540],
      [560, 540],
    ]),
    ...bubble(150, 430, 18),
    ...bubble(110, 350, 25),
  ],

  octopus: () => {
    // Four arms on the left, fanned out and curling outwards, mirrored on the right.
    const left = [168, 145, 122, 100].map((deg, i) => {
      const d = [Math.cos(rad(deg)), Math.sin(rad(deg))]
      const r = [-d[1], d[0]]
      const base = [500 + 165 * d[0], 480 + 55 * d[1]]
      const len = 250 + i * 25
      const tip = [base[0] + d[0] * len, base[1] + d[1] * len]
      return [
        base,
        [base[0] + d[0] * len * 0.45 - r[0] * 20, base[1] + d[1] * len * 0.45 - r[1] * 20],
        tip,
        [tip[0] + d[0] * 25 + r[0] * 45, tip[1] + d[1] * 25 + r[1] * 45],
        [tip[0] + r[0] * 70, tip[1] + r[1] * 70],
      ]
    })
    const right = left.map((pts) => pts.map(([x, y]) => [1000 - x, y]))
    return [
      // A round head with eyes, and eight curling, tapering arms with suckers.
      curve([335, 500], [300, 380], [360, 230], [500, 175], [640, 230], [700, 380], [665, 500]),
      ...[...left, ...right].map((pts) => tentacle(pts, 30, 6)),
      circle(430, 400, 34),
      dot(438, 408, 13),
      circle(570, 400, 34),
      dot(562, 408, 13),
      curve([455, 465], [500, 485], [545, 465]),
    ]
  },

  crab: () => [
    // Wide shell, raised pincers, eyes on stalks, bent legs.
    ellipse(500, 580, 215, 135),
    line([450, 450], [440, 345]),
    circle(440, 330, 20),
    dot(440, 330, 8),
    line([550, 450], [560, 345]),
    circle(560, 330, 20),
    dot(560, 330, 8),
    curve([440, 610], [500, 640], [560, 610]),
    curve([310, 520], [250, 450], [235, 360]),
    curve([345, 480], [290, 420], [280, 360]),
    claw(245, 270, 85, -60),
    curve([690, 520], [750, 450], [765, 360]),
    curve([655, 480], [710, 420], [720, 360]),
    claw(755, 270, 85, -120),
    ...[
      [[305, 590], [200, 600], [150, 690]],
      [[320, 640], [225, 690], [205, 775]],
      [[365, 685], [295, 760], [300, 840]],
    ].flatMap((pts) => [line(...pts), line(...pts.map(([x, y]) => [1000 - x, y]))]),
  ],

  penguin: () => [
    // Upright body, white belly patch, flippers, beak and feet.
    blob([500, 140], [600, 175], [645, 300], [685, 500], [680, 700], [600, 830], [500, 850], [400, 830], [320, 700], [315, 500], [355, 300], [400, 175]),
    curve([500, 300], [545, 255], [595, 285], [605, 390], [625, 560], [600, 720], [540, 800], [460, 800], [400, 720], [375, 560], [395, 390], [405, 285], [455, 255], [500, 300]),
    dot(448, 230, 13),
    dot(552, 230, 13),
    shape([468, 290], [532, 290], [500, 340]),
    curve([335, 380], [262, 500], [222, 625], [255, 645], [325, 560]),
    curve([665, 380], [738, 500], [778, 625], [745, 645], [675, 560]),
    curve([410, 838], [355, 880], [480, 890], [482, 846]),
    curve([590, 838], [645, 880], [520, 890], [518, 846]),
  ],

  anchor: () => [
    // Ring, crossbar, shank and two curved arms with barbed tips.
    circle(500, 165, 55),
    line([484, 220], [484, 818]),
    line([516, 220], [516, 818]),
    rect(340, 285, 320, 36),
    dot(338, 303, 16),
    dot(662, 303, 16),
    arc(500, 590, 290, 250, 12, 168),
    arc(500, 590, 250, 205, 15, 165),
    line([165, 640], [210, 525], [292, 625]),
    line([835, 640], [790, 525], [708, 625]),
  ],

  shark: () => [
    // Pointed snout, tall dorsal fin, gill slits, toothy grin, crescent tail.
    curve([125, 505], [250, 440], [420, 412], [600, 415], [760, 455], [830, 490]),
    curve([830, 515], [700, 560], [470, 592], [280, 575], [170, 535], [125, 505]),
    curve([430, 414], [490, 330], [560, 235], [560, 330], [605, 418]),
    line([830, 490], [935, 345], [890, 500], [925, 625], [830, 515]),
    curve([380, 585], [430, 650], [480, 690], [470, 590]),
    curve([330, 455], [315, 500], [330, 545]),
    curve([365, 450], [350, 500], [365, 550]),
    curve([400, 448], [385, 500], [400, 552]),
    dot(235, 480, 12),
    zigzag(175, 535, 300, 560, 5, 14),
    curve([700, 455], [730, 410], [740, 460]),
  ],

  whale: () => [
    // Big round head, a spout from the blowhole, upturned tail flukes.
    curve([150, 520], [165, 390], [290, 305], [480, 300], [650, 355], [770, 440], [830, 455], [790, 345], [835, 330], [870, 400], [915, 325], [960, 340], [905, 455], [830, 490], [760, 520], [600, 600], [400, 630], [230, 610], [150, 520]),
    curve([155, 520], [270, 545], [400, 520]),
    dot(305, 470, 13),
    curve([230, 585], [330, 600], [440, 590]),
    curve([290, 615], [350, 640], [400, 625]),
    line([360, 300], [360, 195]),
    curve([360, 200], [320, 140], [265, 160]),
    curve([360, 200], [400, 140], [455, 160]),
    curve([360, 200], [360, 150], [370, 110]),
    dot(250, 190, 10),
    dot(470, 190, 10),
    curve([480, 520], [540, 590], [600, 545]),
  ],

  dolphin: () => [
    // Arched leap: rounded forehead, short bottle-nose beak, swept-back fin, flukes, over a wave.
    curve([145, 562], [200, 552], [238, 535], [250, 495], [310, 425], [470, 345], [620, 360], [760, 430], [850, 530], [880, 600]),
    curve([880, 600], [940, 620], [960, 680], [900, 660], [870, 640], [840, 700], [800, 710], [825, 640], [835, 615]),
    curve([835, 615], [760, 540], [620, 490], [470, 500], [340, 545], [260, 590], [200, 600], [160, 585], [145, 562]),
    curve([150, 572], [200, 575], [245, 565]),
    dot(285, 495, 12),
    curve([455, 352], [480, 280], [540, 225], [540, 310], [600, 368]),
    curve([360, 535], [375, 610], [420, 650], [435, 540]),
    curve([100, 800], [250, 760], [400, 800], [550, 760], [700, 800], [850, 760], [950, 790]),
  ],

  jellyfish: () => [
    // Dome bell with a frilly rim and long trailing tentacles.
    arc(500, 450, 260, 250, 180, 360),
    ...[0, 1, 2, 3, 4, 5].map((i) => arc(283 + i * 87, 450, 43, 30, 0, 180)),
    ...[300, 390, 610, 700].map((x, i) => wave(x, 485, x + (i % 2 ? 20 : -20), 900, 3, 22)),
    curve([470, 480], [430, 560], [500, 620], [440, 700], [500, 780], [460, 860]),
    curve([530, 480], [570, 560], [510, 640], [570, 720], [520, 800], [560, 880]),
    curve([350, 330], [400, 270], [470, 250]),
  ],

  starfish: () => {
    // Five fat, soft arms, each bent a little, around a central disc; bumpy dots; lying on the sand.
    const arms = [
      [-90, 9],
      [-14, -8],
      [56, 11],
      [128, -9],
      [196, 8],
    ]
    const pts = []
    for (const [a, bend] of arms) {
      pts.push(at(500, 500, 165, 165, a - 36))
      pts.push(at(500, 500, 280, 280, a - 13 + bend * 0.4))
      pts.push(at(500, 500, 355, 355, a - 6 + bend))
      pts.push(at(500, 500, 382, 382, a + bend))
      pts.push(at(500, 500, 355, 355, a + 6 + bend))
      pts.push(at(500, 500, 280, 280, a + 13 + bend * 0.4))
    }
    return [
      blob(...pts),
      circle(500, 500, 58),
      ...arms.flatMap(([a, bend]) => [
        dot(...at(500, 500, 125, 125, a + bend * 0.1), 10),
        dot(...at(500, 500, 195, 195, a + bend * 0.3 - 7), 9),
        dot(...at(500, 500, 195, 195, a + bend * 0.3 + 7), 9),
        dot(...at(500, 500, 265, 265, a + bend * 0.5), 9),
        dot(...at(500, 500, 325, 325, a + bend * 0.8), 8),
      ]),
      curve([60, 900], [250, 880], [500, 905], [750, 885], [940, 900]),
      ...[
        [200, 935],
        [420, 940],
        [690, 932],
      ].map(([x, y]) => dot(x, y, 6)),
    ]
  },

  seahorse: () => [
    // Snout tube, crown, round belly with ridges, curled tail.
    curve([440, 225], [470, 160], [540, 140], [600, 175], [615, 260], [640, 350], [660, 450], [640, 560], [580, 650], [540, 720], [535, 790], [580, 840], [630, 815], [620, 765], [580, 770]),
    curve([435, 280], [455, 335], [440, 400], [430, 480], [460, 570], [500, 630], [480, 700], [480, 780], [520, 860], [600, 880], [670, 840], [670, 760], [610, 730]),
    curve([440, 226], [380, 236], [322, 224]),
    curve([436, 280], [380, 266], [322, 274]),
    ellipse(318, 249, 12, 26),
    dot(505, 210, 12),
    zigzag(520, 145, 600, 160, 3, 18),
    curve([642, 355], [725, 365], [750, 430], [668, 470]),
    line([648, 385], [720, 390]),
    line([655, 415], [735, 425]),
    line([660, 445], [715, 455]),
    ...[
      [450, 340, 520, 345],
      [440, 400, 520, 410],
      [438, 460, 525, 470],
      [455, 520, 540, 530],
      [480, 580, 560, 590],
    ].map(([x0, y0, x1, y1]) => line([x0, y0], [x1, y1])),
  ],

  lobster: () => [
    // Long body: shell, segmented tail ending in a fan, two big two-fingered claws, long feelers.
    ellipse(500, 420, 85, 135),
    line([440, 520], [450, 760]),
    line([560, 520], [550, 760]),
    ...[0, 1, 2, 3, 4].map((i) => {
      const y = 575 + i * 46
      const w = 62 - i * 2.5
      return curve([500 - w, y], [500, y + 18], [500 + w, y])
    }),
    line([450, 760], [385, 870], [445, 890], [472, 830], [500, 895], [528, 830], [555, 890], [615, 870], [550, 760]),
    line([472, 830], [480, 770]),
    line([528, 830], [520, 770]),
    line([475, 300], [468, 268]),
    dot(466, 262, 11),
    line([525, 300], [532, 268]),
    dot(534, 262, 11),
    curve([485, 290], [470, 160], [420, 40]),
    curve([515, 290], [530, 160], [580, 40]),
    line([432, 350], [340, 345], [300, 275]),
    line([440, 385], [325, 375], [278, 290]),
    ...longClaw(290, 280, 220, 120, -100),
    line([568, 350], [660, 345], [700, 275]),
    line([560, 385], [675, 375], [722, 290]),
    ...longClaw(710, 280, 220, 120, -80),
    ...[430, 470, 510].flatMap((y) => [line([418, y], [350, y + 30], [325, y + 80]), line([582, y], [650, y + 30], [675, y + 80])]),
  ],

  squid: () => {
    const arms = [0, 1, 2, 3, 4, 5].map((i) => {
      const y = 415 + i * 22
      const end = 335 + i * 60
      const w = i % 2 ? 16 : -16
      return curve([608, y], [690, y + (end - y) * 0.35 + w], [770, y + (end - y) * 0.7 - w], [850, end + w * 0.5])
    })
    return [
      // Swimming sideways: long soft mantle with round fins at the tip, a big eye,
      // wavy arms and two long tentacles with clubbed ends trailing behind.
      curve([110, 470], [200, 405], [350, 372], [480, 382], [545, 400]),
      curve([110, 470], [200, 535], [350, 565], [480, 552], [545, 532]),
      curve([150, 440], [165, 330], [255, 325], [295, 390]),
      curve([150, 500], [165, 610], [255, 615], [295, 548]),
      curve([545, 400], [600, 405], [622, 465], [600, 525], [545, 532]),
      circle(570, 455, 27),
      dot(576, 455, 11),
      ...[
        [330, 440],
        [400, 480],
        [460, 430],
        [380, 520],
      ].map(([x, y]) => dot(x, y, 8)),
      ...arms,
      curve([608, 425], [740, 330], [860, 265], [925, 245]),
      blob([915, 245], [950, 215], [990, 235], [955, 265]),
      curve([608, 512], [740, 610], [860, 670], [925, 690]),
      blob([915, 690], [955, 665], [990, 695], [950, 720]),
    ]
  },

  shrimp: () => {
    const { left, right, centre } = tubeEdges(
      [
        [270, 430],
        [400, 330],
        [560, 315],
        [690, 385],
        [745, 510],
        [700, 625],
        [610, 680],
      ],
      70,
      26,
    )
    const ribs = []
    for (let i = 14; i < centre.length - 6; i += 11) ribs.push(curve(left[i], centre[i], right[i]))
    const end = centre.at(-1)
    return [
      // Curled, segmented body with a fan tail, long feelers and little legs.
      curve(...thin(left)),
      curve(...thin(right)),
      line(left[0], [180, 395], right[0]),
      ...ribs,
      line(left.at(-1), [end[0] - 60, end[1] + 70], [end[0] - 10, end[1] + 40], [end[0] + 20, end[1] + 90], right.at(-1)),
      dot(285, 410, 12),
      curve([250, 395], [200, 280], [260, 160], [420, 110]),
      curve([270, 385], [250, 290], [330, 200], [470, 170]),
      ...[
        [350, 470],
        [420, 420],
        [500, 400],
        [570, 410],
        [630, 440],
      ].map(([x, y]) => line([x, y], [x - 10, y + 60])),
    ]
  },

  seal: () => [
    // A seal pup facing us: smooth plump body, big round eyes, a little nose,
    // whiskery muzzle, flippers out to the sides, lying on the ice.
    blob([500, 175], [620, 205], [680, 330], [700, 520], [690, 700], [600, 800], [500, 820], [400, 800], [310, 700], [300, 520], [320, 330], [380, 205]),
    dot(430, 320, 22),
    dot(570, 320, 22),
    ellipse(500, 385, 30, 18),
    ellipse(465, 420, 38, 28),
    ellipse(535, 420, 38, 28),
    ...[
      [455, 415],
      [475, 430],
      [525, 430],
      [545, 415],
    ].map(([x, y]) => dot(x, y, 5)),
    line([430, 410], [320, 385]),
    line([430, 425], [315, 430]),
    line([432, 440], [325, 475]),
    line([570, 410], [680, 385]),
    line([570, 425], [685, 430]),
    line([568, 440], [675, 475]),
    curve([315, 600], [220, 660], [180, 730], [300, 720]),
    curve([685, 600], [780, 660], [820, 730], [700, 720]),
    curve([440, 810], [400, 860], [470, 860], [490, 820]),
    curve([560, 810], [600, 860], [530, 860], [510, 820]),
    line([140, 860], [860, 860]),
  ],

  walrus: () => [
    // A big walrus face: tiny eyes, a bushy two-lobed moustache with bristles,
    // two huge tusks hanging down, wrinkly neck folds and flippers.
    blob([500, 160], [650, 190], [760, 320], [800, 520], [790, 720], [700, 830], [500, 860], [300, 830], [210, 720], [200, 520], [240, 320], [350, 190]),
    dot(420, 285, 12),
    dot(580, 285, 12),
    curve([390, 255], [420, 245], [450, 255]),
    curve([550, 255], [580, 245], [610, 255]),
    dot(482, 340, 7),
    dot(518, 340, 7),
    ellipse(425, 410, 92, 66),
    ellipse(575, 410, 92, 66),
    ...[
      [390, 390],
      [425, 410],
      [460, 390],
      [400, 430],
      [450, 432],
      [540, 390],
      [575, 410],
      [610, 390],
      [550, 432],
      [600, 430],
    ].map(([x, y]) => dot(x, y, 5)),
    ...[360, 390, 420, 580, 610, 640].map((x) => line([x, 470], [x - (x < 500 ? 4 : -4), 500])),
    curve([440, 465], [425, 600], [415, 760], [430, 830], [470, 760], [482, 600], [478, 470]),
    curve([522, 470], [518, 600], [530, 760], [570, 830], [585, 760], [575, 600], [560, 465]),
    curve([250, 560], [280, 620], [270, 690]),
    curve([750, 560], [720, 620], [730, 690]),
    curve([230, 700], [140, 790], [170, 850], [280, 800]),
    curve([770, 700], [860, 790], [830, 850], [720, 800]),
  ],

  stingray: () => [
    // Seen from below: wide rounded wings, smiling face, two rows of gill slits,
    // little fins by the tail, a long whip tail with a spiky barb.
    blob([500, 250], [600, 262], [720, 320], [880, 450], [760, 560], [640, 640], [560, 680], [440, 680], [360, 640], [240, 560], [120, 450], [280, 320], [400, 262]),
    dot(450, 345, 13),
    dot(550, 345, 13),
    curve([440, 400], [500, 432], [560, 400]),
    ...[0, 1, 2, 3, 4].flatMap((i) => [line([430 - i * 4, 470 + i * 28], [460 - i * 4, 470 + i * 28]), line([540 + i * 4, 470 + i * 28], [570 + i * 4, 470 + i * 28])]),
    curve([450, 670], [420, 730], [478, 725]),
    curve([550, 670], [580, 730], [522, 725]),
    curve([490, 690], [492, 800], [515, 890], [560, 970]),
    curve([510, 690], [512, 800], [530, 880], [560, 970]),
    zigzag(512, 780, 528, 860, 3, 14),
    // Gliding over the sandy sea floor, bubbles rising.
    ...bubble(840, 230, 22),
    ...bubble(890, 150, 16),
    ...bubble(800, 120, 12),
    curve([80, 960], [300, 935], [600, 975], [960, 945]),
    curve([180, 950], [165, 880], [195, 820], [175, 760]),
    curve([210, 945], [235, 880], [215, 830]),
  ],

  pufferfish: () => {
    const spikes = []
    for (let a = -150; a <= 150; a += 20) {
      if (a > -30 && a < 30) continue
      const b = 180 + a
      spikes.push(line(at(480, 500, 225, 225, b - 5), at(480, 500, 285, 285, b), at(480, 500, 225, 225, b + 5)))
    }
    return [
      // A puffed-up round fish covered in spikes, with fins, tail and pout.
      circle(480, 500, 225),
      ...spikes,
      line([700, 480], [800, 400], [790, 600], [700, 520]),
      curve([520, 520], [580, 560], [600, 620], [540, 600]),
      circle(390, 430, 42),
      dot(380, 435, 16),
      circle(270, 540, 20),
    ]
  },

  narwhal: () => {
    // A long, thick, twisted tusk from the forehead of a spotted little whale with flukes.
    const B = [245, 445]
    const T = [30, 235]
    const len = Math.hypot(T[0] - B[0], T[1] - B[1])
    const d = [(T[0] - B[0]) / len, (T[1] - B[1]) / len]
    const n = [-d[1], d[0]]
    const P = (t, side) => {
      const w = 26 * (1 - t)
      return [B[0] + (T[0] - B[0]) * t + n[0] * w * side, B[1] + (T[1] - B[1]) * t + n[1] * w * side]
    }
    return [
      curve([235, 480], [285, 385], [480, 360], [680, 415], [800, 470], [835, 435], [905, 400], [948, 428], [880, 500], [948, 572], [905, 600], [835, 565], [800, 530], [680, 590], [480, 625], [285, 595], [235, 480]),
      line(P(0, 1), T, P(0, -1)),
      ...[0.1, 0.24, 0.38, 0.52, 0.66, 0.8].map((t) => line(P(t, 1), P(t + 0.07, -1))),
      dot(305, 468, 13),
      curve([248, 520], [285, 540], [330, 528]),
      curve([440, 575], [470, 660], [550, 600]),
      ...[
        [430, 420],
        [510, 400],
        [590, 420],
        [670, 445],
        [550, 470],
        [740, 470],
        [470, 470],
      ].map(([x, y]) => circle(x, y, 11)),
    ]
  },

  seashell: () => {
    const n = 7
    const valleys = []
    const pts = []
    for (let i = 0; i <= n; i++) {
      const a = 205 + (130 * i) / n
      valleys.push(at(500, 800, 360, 400, a))
      if (i < n) {
        const m = 205 + (130 * (i + 0.5)) / n
        pts.push(at(500, 800, 360, 400, a), at(500, 800, 410, 455, m))
      } else pts.push(at(500, 800, 360, 400, a))
    }
    return [
      // Scallop shell: scalloped rim, ridges fanning from the hinge, two little ears.
      curve(...pts),
      line(valleys[0], [440, 800]),
      line(valleys.at(-1), [560, 800]),
      ...valleys.slice(1, -1).map((v) => curve(v, [(v[0] + 500) / 2 + (v[0] - 500) * 0.08, (v[1] + 800) / 2], [500 + (v[0] - 500) * 0.12, 790])),
      shape([440, 800], [380, 830], [390, 880], [610, 880], [620, 830], [560, 800]),
      line([440, 800], [450, 878]),
      line([560, 800], [550, 878]),
    ]
  },

  lighthouse: () => [
    // Striped tapering tower, lantern room with light beams, on rocks by waves.
    line([380, 840], [420, 360]),
    line([620, 840], [580, 360]),
    ...[460, 560, 660, 760].map((y) => {
      const inset = ((840 - y) / 480) * 40
      return curve([380 + inset, y], [500, y + 15], [620 - inset, y])
    }),
    rect(385, 330, 230, 32),
    rect(430, 225, 140, 105),
    line([477, 225], [477, 330]),
    line([523, 225], [523, 330]),
    shape([415, 225], [500, 150], [585, 225]),
    dot(500, 138, 13),
    line([428, 250], [190, 185]),
    line([428, 305], [190, 365]),
    line([572, 250], [810, 185]),
    line([572, 305], [810, 365]),
    curve([470, 840], [470, 760], [500, 740], [530, 760], [530, 840]),
    curve([300, 860], [340, 810], [430, 820], [500, 845], [580, 815], [670, 810], [710, 860]),
    wave(120, 880, 880, 880, 4, 16),
  ],

  sandcastle: () => [
    // Three towers with battlements, a flag, an arched door, on a sandy mound.
    line([220, 800], [220, 440], [250, 440], [250, 405], [290, 405], [290, 440], [330, 440], [330, 405], [370, 405], [370, 440], [390, 440], [390, 800]),
    line([610, 800], [610, 440], [630, 440], [630, 405], [670, 405], [670, 440], [710, 440], [710, 405], [750, 405], [750, 440], [780, 440], [780, 800]),
    line([390, 560], [410, 560], [410, 300], [430, 300], [430, 260], [470, 260], [470, 300], [530, 300], [530, 260], [570, 260], [570, 300], [590, 300], [590, 560], [610, 560]),
    line([500, 300], [500, 150]),
    shape([500, 150], [600, 180], [500, 210]),
    curve([450, 800], [450, 700], [500, 660], [550, 700], [550, 800]),
    rect(285, 520, 40, 55),
    rect(675, 520, 40, 55),
    rect(480, 400, 40, 60),
    curve([120, 840], [250, 800], [500, 790], [750, 800], [880, 840]),
    line([120, 840], [880, 840]),
    ...[
      [230, 820],
      [320, 812],
      [620, 812],
      [740, 822],
    ].map(([x, y]) => dot(x, y, 6)),
  ],

  'beach ball': () => [
    // Ball with curved panels meeting at a little cap, every other panel striped in,
    // sitting on the sand.
    circle(500, 500, 330),
    ellipse(500, 300, 60, 32),
    curve([440, 305], [300, 400], [220, 560], [255, 680]),
    curve([475, 330], [420, 500], [400, 700], [430, 828]),
    curve([525, 330], [580, 500], [600, 700], [570, 828]),
    curve([560, 305], [700, 400], [780, 560], [745, 680]),
    curve([460, 275], [380, 220], [300, 230]),
    curve([540, 275], [620, 220], [700, 230]),
    ...[
      [430, 600, 400],
      [418, 588, 480],
      [410, 590, 560],
      [406, 594, 640],
      [410, 590, 720],
    ].map(([x0, x1, y]) => curve([x0 + 10, y], [500, y + 12], [x1 - 10, y])),
    ...[
      [240, 345, 370, 335],
      [200, 420, 290, 412],
      [185, 495, 245, 490],
    ].flatMap(([x0, y0, x1, y1]) => [line([x0, y0], [x1, y1]), line([1000 - x0, y0], [1000 - x1, y1])]),
    curve([80, 835], [300, 820], [500, 840], [700, 820], [920, 835]),
  ],

  surfboard: () => [
    // Long board, pointed nose, rounded tail, centre stringer, stripe and fin.
    blob([500, 80], [590, 220], [620, 420], [612, 650], [575, 840], [500, 915], [425, 840], [388, 650], [380, 420], [410, 220]),
    line([500, 110], [500, 890]),
    curve([392, 320], [500, 345], [602, 320]),
    curve([386, 380], [500, 405], [610, 380]),
    shape([598, 760], [680, 800], [690, 830], [588, 830]),
    wave(240, 900, 760, 900, 2, 18),
  ],

  island: () => [
    // Sandy mound with a palm tree and coconuts, waves all around.
    arc(500, 720, 320, 120, 180, 360),
    wave(60, 725, 940, 725, 6, 14),
    wave(200, 800, 800, 800, 4, 12),
    curve([470, 610], [450, 470], [415, 330], [390, 260]),
    curve([530, 610], [510, 470], [470, 330], [430, 255]),
    ...[560, 490, 420, 350].map((y) => {
      const x = 455 + (610 - y) * -0.25
      return curve([x + 20 - (610 - y) * 0.05, y], [x + 40, y + 12], [x + 60 - (610 - y) * 0.09, y])
    }),
    curve([410, 255], [330, 210], [240, 230], [180, 300]),
    curve([410, 255], [330, 250], [260, 290]),
    curve([410, 255], [470, 190], [570, 185], [640, 240]),
    curve([410, 255], [500, 230], [580, 280]),
    curve([410, 255], [380, 170], [300, 130], [230, 150]),
    curve([410, 255], [470, 270], [540, 330], [560, 400]),
    curve([410, 255], [360, 300], [330, 380]),
    circle(395, 285, 22),
    circle(435, 290, 22),
  ],

  'fishing rod': () => [
    // A long rod with a reel near the handle, line down to a float and hook.
    line([170, 880], [780, 130]),
    line([190, 893], [790, 140]),
    line([170, 880], [190, 893]),
    line([215, 815], [245, 835]),
    line([300, 712], [325, 730]),
    circle(325, 805, 62),
    circle(325, 805, 20),
    line([325, 805], [395, 830]),
    circle(408, 835, 13),
    line([785, 135], [840, 150], [840, 520]),
    ellipse(840, 560, 30, 40),
    line([810, 560], [870, 560]),
    line([840, 600], [840, 740]),
    curve([840, 740], [845, 820], [800, 840], [775, 800]),
    line([775, 800], [800, 785]),
    ...[
      [440, 550],
      [590, 368],
    ].map(([x, y]) => circle(x, y, 8)),
  ],

  snorkel: () => [
    // A one-window dive mask with a nose pocket and strap, and a tall J-shaped tube
    // with a striped top poking up out of the water.
    curve([300, 440], [310, 380], [400, 365], [500, 375], [600, 365], [690, 380], [700, 440], [690, 520], [600, 545], [540, 545], [520, 515], [480, 515], [460, 545], [400, 545], [310, 520], [300, 440]),
    curve([335, 445], [345, 400], [500, 395], [655, 400], [665, 445], [650, 492], [565, 502], [535, 478], [465, 478], [435, 502], [350, 492], [335, 445]),
    curve([395, 420], [420, 410], [445, 412]),
    line([300, 430], [180, 420]),
    line([300, 460], [180, 455]),
    line([700, 430], [740, 425]),
    line([700, 460], [740, 455]),
    line([740, 90], [740, 640]),
    line([800, 90], [800, 650]),
    curve([740, 90], [770, 75], [800, 90]),
    ...[130, 170, 210].map((y) => line([740, y], [800, y])),
    curve([740, 640], [720, 700], [640, 715], [560, 700]),
    curve([800, 650], [780, 750], [660, 770], [560, 750]),
    rect(505, 688, 55, 74),
    line([505, 700], [480, 700], [480, 750], [505, 750]),
    rect(725, 335, 90, 36),
    wave(120, 280, 900, 280, 4, 14),
    circle(620, 600, 14),
    circle(650, 540, 18),
  ],

  pelican: () => [
    // Standing on a pier post: a very long bill with a huge saggy throat pouch,
    // S-curved neck, big body, short legs and webbed feet.
    circle(470, 235, 55),
    dot(478, 222, 11),
    line([425, 215], [110, 400], [92, 432], [118, 425], [432, 262]),
    curve([118, 428], [150, 540], [270, 580], [390, 520], [440, 400], [455, 290]),
    // A fish caught in the pouch, its tail flipping out of the bill.
    blob([200, 470], [250, 440], [320, 450], [345, 480], [320, 510], [250, 515]),
    line([345, 480], [395, 445], [390, 515], [345, 480]),
    dot(230, 472, 7),
    curve([520, 260], [560, 330], [540, 420], [570, 470]),
    curve([455, 290], [470, 360], [460, 430], [490, 480]),
    blob([490, 480], [600, 430], [760, 450], [880, 520], [820, 620], [680, 680], [540, 660], [470, 580]),
    curve([600, 520], [700, 520], [800, 570]),
    line([600, 670], [600, 720]),
    line([680, 675], [680, 720]),
    shape([600, 720], [550, 735], [610, 738]),
    shape([680, 720], [630, 735], [690, 738]),
    ellipse(640, 740, 90, 22),
    line([550, 740], [555, 960]),
    line([730, 740], [725, 960]),
    curve([590, 800], [600, 860], [585, 920]),
    curve([690, 790], [680, 850], [695, 910]),
  ],

  submarine: () => [
    // Capsule hull, tower with periscope, round portholes, propeller.
    blob([150, 560], [200, 460], [400, 430], [700, 440], [820, 490], [850, 560], [820, 630], [700, 680], [400, 690], [200, 660]),
    line([420, 435], [445, 310], [610, 310], [630, 440]),
    line([520, 310], [520, 190], [600, 190]),
    line([545, 310], [545, 215], [600, 215]),
    line([600, 190], [600, 215]),
    ...[300, 420, 540, 660].flatMap((x) => [circle(x, 565, 34), circle(x, 565, 20)]),
    line([850, 560], [890, 560]),
    tilted(900, 505, 16, 48, 10),
    tilted(900, 615, 16, 48, -10),
    shape([800, 480], [840, 400], [870, 410], [840, 500]),
    ...bubble(950, 480, 15),
    ...bubble(960, 400, 20),
  ],

  'ship wheel': () => {
    const spokes = [0, 45, 90, 135, 180, 225, 270, 315]
    return [
      // Wooden wheel: double rim, hub, eight spokes poking out as handles.
      circle(500, 500, 250),
      circle(500, 500, 210),
      circle(500, 500, 55),
      dot(500, 500, 15),
      ...spokes.flatMap((a) => {
        const [x0, y0] = at(500, 500, 55, 55, a)
        const [x1, y1] = at(500, 500, 250, 250, a)
        const [hx, hy] = at(500, 500, 330, 330, a)
        return [line([x0, y0], [x1, y1]), line([x1, y1], at(500, 500, 280, 280, a)), tilted(hx, hy, 52, 18, a)]
      }),
    ]
  },

  'treasure chest': () => [
    // Open chest: lid flung back, coins and gems heaped up, lock and straps.
    rect(220, 520, 560, 300),
    line([220, 600], [780, 600]),
    line([300, 520], [300, 820]),
    line([700, 520], [700, 820]),
    rect(465, 570, 70, 80),
    dot(500, 600, 11),
    line([500, 608], [500, 632]),
    line([240, 520], [260, 350]),
    line([760, 520], [740, 350]),
    curve([260, 350], [350, 255], [500, 235], [650, 255], [740, 350]),
    line([260, 350], [740, 350]),
    curve([220, 520], [300, 440], [380, 470], [440, 430], [520, 455], [600, 425], [680, 465], [780, 520]),
    ...[
      [330, 480],
      [420, 500],
      [560, 485],
      [650, 500],
      [480, 460],
    ].map(([x, y]) => ellipse(x, y, 34, 16)),
    shape([380, 420], [405, 390], [430, 420], [405, 450]),
    shape([600, 410], [625, 380], [650, 410], [625, 440]),
    star(860, 300, 40, 12, 4),
    star(150, 380, 30, 9, 4),
  ],
}
