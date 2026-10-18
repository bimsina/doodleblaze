import { arc, circle, curve, dot, ellipse, line, rect, rotate, shape, wave, zigzag } from './kit.mjs'

// --- Local helpers ---

const rad = (deg) => (deg * Math.PI) / 180

/**
 * A puffy, scalloped outline (cloud, tree crown) along part of an ellipse:
 * `n` bumps from angle `from` to `to` (degrees, 0 is right, 90 is down).
 */
function scallop(cx, cy, rx, ry, n, from = 0, to = 360) {
  const P = (deg) => [cx + Math.cos(rad(deg)) * rx, cy + Math.sin(rad(deg)) * ry]
  const pts = []
  for (let i = 0; i < n; i++) {
    const [px, py] = P(from + ((to - from) * i) / n)
    const [qx, qy] = P(from + ((to - from) * (i + 1)) / n)
    const mx = (px + qx) / 2
    const my = (py + qy) / 2
    const r = Math.hypot(qx - px, qy - py) / 2
    const start = Math.atan2(py - my, px - mx)
    const out = Math.atan2(my - cy, mx - cx)
    const d = Math.cos(start + Math.PI / 2 - out) > 0 ? 1 : -1
    for (let k = i ? 1 : 0; k <= 8; k++) {
      const a = start + (d * Math.PI * k) / 8
      pts.push([mx + Math.cos(a) * r, my + Math.sin(a) * r])
    }
  }
  return curve(...pts)
}

/** A point part-way (t from 0 to 1) along a polyline. */
function along(pts, t) {
  const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)))
  const f = t * (pts.length - 1) - seg
  const [ax, ay] = pts[seg]
  const [bx, by] = pts[seg + 1]
  return [ax + (bx - ax) * f, ay + (by - ay) * f]
}

/** A leaf-shaped blade from `base` through `mid` to `tip`, `w` wide at the middle. */
function blade(base, mid, tip, w) {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * w
  const ny = (dx / len) * w
  return [curve(base, [mid[0] + nx, mid[1] + ny], tip), curve(base, [mid[0] - nx, mid[1] - ny], tip)]
}

/** A log from (x0, y0) to (x1, y1), `w` thick, its sawn end showing at (x1, y1). */
function log(x0, y0, x1, y1, w) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const nx = ((-(y1 - y0) / len) * w) / 2
  const ny = (((x1 - x0) / len) * w) / 2
  const deg = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI
  return [
    line([x0 + nx, y0 + ny], [x1 + nx, y1 + ny]),
    line([x0 - nx, y0 - ny], [x1 - nx, y1 - ny]),
    rotate(ellipse(x1, y1, w * 0.25, w / 2), deg, x1, y1),
    rotate(arc(x0, y0, w * 0.25, w / 2, 90, 270), deg, x0, y0),
  ]
}

/** One lattice sail of a windmill, pointing at `deg` from the hub. */
function sail([cx, cy], deg, len, w) {
  const ux = Math.cos(rad(deg))
  const uy = Math.sin(rad(deg))
  const P = (d, o) => [cx + ux * d - uy * o, cy + uy * d + ux * o]
  return [
    line(P(25, 0), P(len, 0)),
    line(P(len * 0.3, 0), P(len * 0.3, w), P(len, w), P(len, 0)),
    ...[0.48, 0.65, 0.82].map((t) => line(P(len * t, 0), P(len * t, w))),
    line(P(len * 0.3, w / 2), P(len, w / 2)),
  ]
}

export default {
  house: () => [
    rect(220, 450, 560, 420),
    shape([170, 460], [500, 150], [830, 460]),
    line([650, 291], [650, 190], [720, 190], [720, 357]),
    curve([690, 165], [660, 125], [705, 90], [675, 45]),
    line([440, 870], [440, 680], [560, 680], [560, 870]),
    dot(538, 780, 9),
    ...[280, 600].flatMap((x) => [rect(x, 520, 120, 110), line([x + 60, 520], [x + 60, 630]), line([x, 575], [x + 120, 575])]),
  ],

  tent: () => [
    // front, ridge and side of an A-frame tent
    curve([330, 260], [220, 520], [80, 800]),
    curve([330, 260], [450, 520], [590, 800]),
    line([80, 800], [590, 800]),
    curve([330, 260], [530, 240], [730, 190]),
    curve([730, 190], [840, 430], [950, 690]),
    line([590, 800], [950, 690]),
    // open door with its flaps tied back
    curve([330, 330], [290, 560], [230, 800]),
    curve([330, 330], [380, 560], [440, 800]),
    curve([330, 330], [330, 560], [330, 800]),
    // poles, guy ropes and pegs
    line([330, 260], [330, 190]),
    line([730, 190], [730, 120]),
    line([330, 200], [20, 680]),
    line([730, 130], [990, 520]),
    line([20, 660], [20, 705]),
    line([990, 500], [990, 545]),
  ],

  tree: () => [
    scallop(500, 320, 330, 240, 12),
    curve([380, 900], [445, 860], [455, 700], [460, 590]),
    curve([620, 900], [555, 860], [545, 700], [540, 590]),
    curve([470, 600], [440, 520], [380, 470]),
    curve([530, 600], [560, 520], [630, 480]),
    line([250, 900], [750, 900]),
    line([480, 800], [487, 740]),
    line([520, 720], [514, 660]),
  ],

  'palm tree': () => {
    const left = [[420, 910], [440, 700], [490, 500], [565, 320]]
    const right = [[515, 910], [520, 700], [555, 500], [615, 330]]
    const crown = [590, 310]
    return [
      curve(...left),
      curve(...right),
      ...[0.12, 0.25, 0.38, 0.51, 0.64, 0.77].map((t) => {
        const a = along(left, t)
        const b = along(right, t)
        return curve(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 14], b)
      }),
      // drooping fronds
      ...blade(crown, [380, 200], [170, 380], 45),
      ...blade(crown, [470, 110], [320, 90], 35),
      ...blade(crown, [700, 110], [850, 140], 35),
      ...blade(crown, [800, 230], [900, 420], 45),
      ...blade(crown, [460, 330], [380, 480], 30),
      ...blade(crown, [730, 340], [790, 490], 30),
      // coconuts
      circle(568, 352, 26),
      circle(620, 348, 26),
      circle(594, 392, 26),
      arc(470, 950, 280, 60, 180, 360),
    ]
  },

  cactus: () => [
    // trunk
    line([420, 880], [420, 620]),
    line([420, 545], [420, 250]),
    arc(500, 250, 80, 80, 180, 360),
    line([580, 250], [580, 465]),
    line([580, 535], [580, 880]),
    line([500, 200], [500, 860]),
    // left arm
    curve([420, 620], [300, 620], [250, 570], [250, 430]),
    arc(300, 430, 50, 50, 180, 360),
    curve([350, 430], [350, 530], [420, 545]),
    // right arm
    curve([580, 535], [700, 535], [750, 490], [750, 330]),
    arc(700, 330, 50, 50, 180, 360),
    curve([650, 330], [650, 455], [580, 465]),
    // spines
    ...[320, 430, 700, 800].map((y) => line([420, y], [392, y - 14])),
    ...[330, 400, 640, 770].map((y) => line([580, y], [608, y - 14])),
    line([250, 490], [222, 478]),
    line([750, 410], [778, 398]),
    line([465, 185], [450, 158]),
    line([535, 185], [550, 158]),
    line([300, 900], [700, 880]),
  ],

  flower: () => [
    ...Array.from({ length: 8 }, (_, i) => rotate(ellipse(650, 330, 78, 44), i * 45, 500, 330)),
    circle(500, 330, 75),
    curve([500, 405], [490, 600], [510, 920]),
    curve([500, 730], [430, 650], [330, 630]),
    curve([500, 730], [410, 735], [330, 630]),
    curve([504, 620], [590, 545], [690, 540]),
    curve([504, 620], [600, 625], [690, 540]),
  ],

  leaf: () =>
    rotate(
      [
        curve([500, 820], [330, 650], [300, 420], [500, 120]),
        curve([500, 820], [690, 640], [700, 400], [500, 120]),
        curve([495, 940], [500, 820], [505, 500], [500, 160]),
        line([502, 700], [380, 620]),
        line([503, 560], [340, 470]),
        line([503, 420], [370, 320]),
        line([502, 630], [640, 540]),
        line([503, 490], [670, 400]),
        line([503, 350], [630, 260]),
      ],
      35,
    ),

  nest: () => {
    // a rough, twiggy cup: rim and bowl as bumpy ellipse halves
    const rough = (cx, cy, rx, ry, from, to, n, amp) =>
      line(
        ...Array.from({ length: n + 1 }, (_, k) => {
          const a = rad(from + ((to - from) * k) / n)
          const o = k % 2 ? amp : -amp
          return [cx + Math.cos(a) * (rx + o), cy + Math.sin(a) * (ry + o)]
        }),
      )
    return [
      // a little bird sitting in it
      curve([330, 500], [320, 380], [400, 300], [520, 300], [600, 380], [640, 500]),
      circle(560, 260, 70),
      dot(580, 245, 10),
      shape([625, 250], [690, 270], [625, 285]),
      curve([360, 420], [300, 360], [230, 330]),
      curve([380, 450], [300, 420], [240, 400]),
      // the nest
      rough(500, 500, 330, 70, 0, 180, 16, 10),
      arc(500, 500, 330, 70, 180, 222),
      arc(500, 500, 330, 70, 318, 360),
      rough(500, 500, 330, 240, 0, 180, 22, 16),
      ...[
        [[210, 560], [400, 640], [600, 600], [790, 560]],
        [[260, 650], [430, 610], [600, 690], [740, 640]],
        [[190, 520], [340, 680], [420, 735]],
        [[810, 520], [660, 680], [580, 735]],
      ].map((pts) => curve(...pts)),
      line([175, 510], [70, 450]),
      line([825, 510], [940, 460]),
      line([210, 640], [100, 700]),
      line([790, 640], [900, 710]),
      // the branch it sits in
      curve([30, 820], [300, 760], [700, 760], [970, 700]),
      ...blade([880, 720], [920, 640], [970, 590], 25),
    ]
  },

  sun: () => [
    circle(500, 500, 200),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = rad(i * 30)
      const r1 = i % 2 ? 340 : 390
      return line([500 + Math.cos(a) * 250, 500 + Math.sin(a) * 250], [500 + Math.cos(a) * r1, 500 + Math.sin(a) * r1])
    }),
  ],

  cloud: () => [scallop(500, 560, 390, 300, 7, 170, 370), curve([116, 612], [300, 650], [700, 650], [884, 612])],

  rainbow: () => [
    ...[400, 340, 280, 220, 160].map((r) => arc(500, 700, r, r, 192, 348)),
    scallop(225, 720, 170, 75, 7),
    scallop(775, 720, 170, 75, 7),
  ],

  lightning: () => [shape([560, 70], [290, 530], [480, 530], [370, 930], [730, 400], [530, 400], [680, 70])],

  snowflake: () => {
    const out = [shape(...Array.from({ length: 6 }, (_, i) => [500 + Math.cos(rad(i * 60)) * 55, 500 + Math.sin(rad(i * 60)) * 55]))]
    for (let i = 0; i < 6; i++) {
      const a = rad(i * 60 - 90)
      const P = (d) => [500 + Math.cos(a) * d, 500 + Math.sin(a) * d]
      out.push(line(P(55), P(390)))
      for (const [d, len] of [
        [180, 110],
        [290, 80],
      ]) {
        const [bx, by] = P(d)
        for (const s of [-1, 1]) out.push(line([bx, by], [bx + Math.cos(a + s * 0.75) * len, by + Math.sin(a + s * 0.75) * len]))
      }
    }
    return out
  },

  tornado: () => {
    const pts = []
    const K = 7 * 18
    for (let k = 0; k <= K; k++) {
      const t = k / K
      const ang = t * 7 * Math.PI * 2
      const rx = 360 * (1 - t) ** 1.3 + 25
      const cx = 500 + 90 * Math.sin(t * 3.4)
      pts.push([cx + Math.cos(ang) * rx, 120 + t * 700 + Math.sin(ang) * rx * 0.17])
    }
    return [
      curve(...pts),
      // dust and flying bits at the base
      scallop(470, 890, 170, 40, 5, 180, 360),
      rotate(rect(180, 640, 40, 25), 30, 200, 652),
      rotate(rect(770, 520, 35, 22), -20, 787, 531),
      dot(250, 780, 10),
      dot(760, 740, 10),
      curve([90, 300], [160, 270], [230, 290]),
      curve([780, 220], [860, 190], [930, 215]),
    ]
  },

  snowman: () => [
    circle(500, 730, 190),
    circle(500, 412, 130),
    circle(500, 200, 92),
    // top hat
    line([390, 115], [610, 115]),
    rect(435, 15, 130, 100),
    // face
    dot(468, 182, 11),
    dot(532, 182, 11),
    shape([500, 205], [590, 222], [500, 232]),
    ...[455, 480, 520, 545].map((x, i) => dot(x, i === 0 || i === 3 ? 245 : 258, 7)),
    // buttons
    dot(500, 360, 12),
    dot(500, 420, 12),
    dot(500, 480, 12),
    // stick arms
    line([385, 380], [200, 280]),
    line([250, 307], [235, 245]),
    line([250, 307], [190, 320]),
    line([615, 380], [800, 280]),
    line([750, 307], [765, 245]),
    line([750, 307], [810, 320]),
  ],

  mountain: () => [
    line([60, 850], [430, 170], [600, 480], [720, 360], [940, 850]),
    line([60, 850], [940, 850]),
    // snow caps
    line([332, 350], [380, 395], [420, 345], [465, 400], [529, 350]),
    line([640, 440], [670, 470], [700, 435], [730, 470], [756, 440]),
    curve([440, 420], [470, 560], [440, 700]),
  ],

  volcano: () => [
    line([80, 880], [385, 340]),
    line([615, 340], [920, 880]),
    line([80, 880], [920, 880]),
    ellipse(500, 335, 120, 30),
    // lava spilling over the rim
    curve([385, 345], [395, 430], [440, 445], [455, 540], [495, 560], [520, 470], [565, 480], [600, 410], [615, 345]),
    curve([330, 440], [310, 520], [330, 560]),
    curve([680, 450], [700, 520], [680, 570]),
    // smoke plume and flying rocks
    scallop(500, 225, 95, 60, 5),
    scallop(600, 100, 130, 75, 6),
    dot(320, 230, 12),
    dot(720, 250, 12),
    dot(360, 110, 10),
  ],

  waterfall: () => {
    const pine = (x, y) => [shape([x, y - 170], [x - 60, y - 25], [x + 60, y - 25]), line([x, y - 25], [x, y])]
    return [
      // high cliff on the left, a river running off its edge
      line([30, 330], [460, 330], [440, 450], [475, 580], [450, 700], [470, 830]),
      line([30, 830], [970, 830]),
      wave(30, 300, 440, 300, 4, 10),
      line([60, 480], [250, 470], [330, 490]),
      line([90, 650], [300, 640], [380, 660]),
      ...pine(150, 330),
      // water arcing over the lip and falling
      ...[0, 40, 80, 120].map((d) => curve([450, 300 + d * 0.2], [520 + d * 0.5, 350], [560 + d * 0.7, 520], [570 + d * 0.8, 800])),
      // splash and the river below
      scallop(620, 815, 150, 40, 5, 180, 360),
      wave(700, 880, 960, 880, 2, 10),
      wave(520, 940, 900, 940, 3, 10),
      dot(500, 760, 9),
      dot(740, 740, 9),
      dot(720, 690, 7),
    ]
  },

  campfire: () => [
    // flames
    curve([330, 770], [280, 640], [300, 520], [350, 420]),
    curve([350, 420], [390, 500], [420, 520]),
    curve([420, 520], [440, 380], [490, 200]),
    curve([490, 200], [560, 380], [570, 480]),
    curve([570, 480], [600, 420], [645, 360]),
    curve([645, 360], [705, 500], [695, 620], [660, 770]),
    curve([420, 770], [390, 660], [440, 560], [485, 450]),
    curve([485, 450], [530, 560], [575, 660], [580, 770]),
    // sparks
    dot(340, 300, 9),
    dot(660, 260, 9),
    dot(590, 140, 7),
    // crossed logs
    ...log(170, 880, 790, 720, 80),
    ...log(830, 880, 210, 720, 80),
  ],

  barn: () => [
    // gambrel roof with a trim line, on a farm fence
    line([150, 860], [150, 450], [250, 260], [500, 130], [750, 260], [850, 450], [850, 860], [150, 860]),
    line([180, 450], [270, 290], [500, 170], [730, 290], [820, 450]),
    line([150, 450], [850, 450]),
    // big double doors with cross braces
    rect(320, 560, 360, 300),
    line([500, 560], [500, 860]),
    line([320, 560], [500, 860]),
    line([500, 560], [320, 860]),
    line([500, 560], [680, 860]),
    line([680, 560], [500, 860]),
    // hayloft door
    rect(430, 280, 140, 120),
    line([430, 280], [570, 400]),
    line([570, 280], [430, 400]),
    // fence either side
    ...[30, 90].map((x) => line([x, 860], [x, 700])),
    ...[910, 970].map((x) => line([x, 860], [x, 700])),
    line([10, 740], [150, 740]),
    line([10, 800], [150, 800]),
    line([850, 740], [990, 740]),
    line([850, 800], [990, 800]),
  ],

  igloo: () => {
    const R = 400
    const H = 460
    const base = 760
    const half = (y) => R * Math.sqrt(Math.max(0, 1 - ((base - y) / H) ** 2))
    const tunnel = (y) => (base - y < 170 ? 150 * Math.sqrt(1 - ((base - y) / 170) ** 2) : 0)
    const rows = [660, 560, 460, 370]
    const out = [arc(500, base, R, H, 180, 360), line([60, base], [940, base])]
    for (const y of rows) {
      const w = half(y)
      const t = tunnel(y)
      if (t) {
        out.push(line([500 - w, y], [500 - t, y]))
        out.push(line([500 + t, y], [500 + w, y]))
      } else out.push(curve([500 - w, y], [500, y + 18], [500 + w, y]))
    }
    // staggered joints between the rows
    const bands = [base, ...rows, base - H]
    for (let i = 0; i < bands.length - 2; i++) {
      const y0 = bands[i]
      const y1 = bands[i + 1]
      const w = half(y1)
      const n = 4 - Math.floor(i / 2)
      for (let k = 0; k < n; k++) {
        const x = 500 - w + ((k + (i % 2 ? 0.5 : 0.75)) * (2 * w)) / (n + 0.5)
        if (Math.abs(x - 500) > tunnel(y1) + 20 && Math.abs(x - 500) < w - 20) out.push(line([x, y0 - 4], [x, y1 + 4]))
      }
    }
    // entrance tunnel
    out.push(arc(500, base, 150, 170, 180, 360), arc(500, base, 90, 110, 180, 360))
    // snowdrifts and falling snow
    out.push(curve([20, base + 40], [200, base + 10], [400, base + 50], [600, base + 20], [800, base + 50], [980, base + 20]))
    for (const [x, y] of [[120, 200], [250, 110], [800, 140], [900, 260], [150, 420], [860, 450]]) {
      out.push(line([x - 18, y], [x + 18, y]), line([x - 10, y - 15], [x + 10, y + 15]), line([x + 10, y - 15], [x - 10, y + 15]))
    }
    return out
  },

  'tree house': () => [
    // crown of the tree around the hut
    scallop(500, 360, 410, 300, 11, 160, 380),
    curve([115, 465], [200, 560], [300, 610]),
    curve([885, 465], [800, 560], [700, 610]),
    // hut
    shape([320, 450], [500, 300], [680, 450]),
    rect(350, 450, 300, 170),
    rect(470, 520, 60, 100),
    rect(380, 480, 60, 50),
    rect(560, 480, 60, 50),
    // platform and trunk
    rect(260, 620, 480, 30),
    line([455, 650], [440, 940]),
    line([545, 650], [560, 940]),
    // ladder
    line([300, 650], [250, 940]),
    line([350, 650], [300, 940]),
    ...[700, 760, 820, 880].map((y) => line([300 - ((y - 650) * 50) / 290, y], [350 - ((y - 650) * 50) / 290, y])),
    line([150, 940], [850, 940]),
  ],

  windmill: () => {
    const hub = [500, 380]
    return [
      shape([370, 900], [420, 420], [580, 420], [630, 900]),
      arc(500, 420, 100, 90, 180, 360),
      ...[45, 135, 225, 315].flatMap((a) => sail(hub, a, 400, 80)),
      circle(...hub, 22),
      line([460, 900], [460, 810]),
      arc(500, 810, 40, 40, 180, 360),
      line([540, 810], [540, 900]),
      rect(475, 600, 50, 60),
      line([280, 900], [720, 900]),
    ]
  },

  pyramid: () => {
    const A = [500, 150]
    const L = [90, 800]
    const M = [620, 870]
    const R = [910, 770]
    const on = (P, t) => [A[0] + (P[0] - A[0]) * t, A[1] + (P[1] - A[1]) * t]
    const ts = [0.25, 0.42, 0.58, 0.74, 0.88]
    const out = [shape(A, L, M), line(A, R, M)]
    for (const t of ts) {
      out.push(line(on(L, t), on(M, t)))
      out.push(line(on(M, t), on(R, t)))
    }
    // staggered joints on the front face
    const bands = [...ts, 1]
    for (let i = 0; i < bands.length - 1; i++) {
      const n = i + 1
      for (let k = 0; k < n; k++) {
        const s = (k + (i % 2 ? 0.3 : 0.7)) / (n + 0.2)
        const top = along([on(L, bands[i]), on(M, bands[i])], s)
        const bot = along([on(L, bands[i + 1]), on(M, bands[i + 1])], s)
        out.push(line(top, bot))
      }
    }
    return out
  },

  skyscraper: () => [
    rect(330, 380, 340, 540),
    rect(380, 230, 240, 150),
    rect(430, 130, 140, 100),
    line([500, 130], [500, 20]),
    ...[370, 470, 570].flatMap((x) => [420, 500, 580, 660, 740].map((y) => rect(x, y, 60, 45))),
    ...[420, 530].flatMap((x) => [260, 320].map((y) => rect(x, y, 50, 35))),
    rect(460, 830, 80, 90),
    line([250, 920], [750, 920]),
  ],

  bridge: () => {
    const sag = Array.from({ length: 9 }, (_, i) => {
      const x = 305 + (390 * i) / 8
      return [x, 220 + 300 * (1 - ((x - 500) / 195) ** 2)]
    })
    const cableY = (x) => 220 + 300 * (1 - ((x - 500) / 195) ** 2)
    return [
      line([40, 600], [960, 600]),
      line([40, 640], [960, 640]),
      // towers
      ...[280, 670].flatMap((x) => [line([x, 640], [x, 210]), line([x + 50, 640], [x + 50, 210]), line([x, 300], [x + 50, 300]), line([x, 440], [x + 50, 440])]),
      // main cables and hangers
      curve([40, 560], [170, 400], [305, 215]),
      curve(...sag),
      curve([695, 215], [830, 400], [960, 560]),
      ...[360, 420, 480, 540, 600, 645].map((x) => line([x, cableY(x)], [x, 600])),
      ...[110, 170, 230].map((x) => line([x, 560 - ((x - 40) * 345) / 265], [x, 600])),
      ...[770, 830, 890].map((x) => line([x, 215 + ((x - 695) * 345) / 265], [x, 600])),
      // water
      wave(40, 760, 960, 760, 6, 15),
      wave(140, 840, 860, 840, 5, 12),
    ]
  },

  fountain: () => {
    // a jet of water: dashes along a curve, like spray
    const spray = (pts) => {
      const path = Array.from({ length: 13 }, (_, k) => along(pts, k / 12))
      return path.flatMap((p, k) => (k % 2 ? [] : [line(p, path[k + 1] ?? p)]))
    }
    return [
      // low round pool
      ellipse(500, 770, 400, 60),
      line([100, 770], [108, 840]),
      line([900, 770], [892, 840]),
      curve([108, 840], [500, 890], [892, 840]),
      // slim pedestal and a small bowl
      line([480, 760], [480, 560]),
      line([520, 760], [520, 560]),
      ellipse(500, 545, 120, 22),
      curve([380, 547], [440, 595], [560, 595], [620, 547]),
      // water shooting up and splashing down in arcs
      line([500, 540], [500, 230]),
      ...[-1, 1].flatMap((d) => [
        spray([[500, 230], [500 + d * 120, 170], [500 + d * 220, 230], [500 + d * 270, 380], [500 + d * 290, 540]]),
        spray([[500, 240], [500 + d * 80, 230], [500 + d * 140, 300], [500 + d * 160, 420]]),
        curve([500 + d * 120, 550], [500 + d * 180, 600], [500 + d * 210, 700], [500 + d * 220, 760]),
      ]),
      ...[[500, 180], [440, 160], [560, 160]].map(([x, y]) => dot(x, y, 10)),
      wave(300, 785, 700, 785, 3, 8),
    ]
  },

  fence: () => {
    const out = []
    for (let i = 0; i < 6; i++) {
      const x = 110 + i * 135
      out.push(shape([x, 850], [x, 330], [x + 45, 250], [x + 90, 330], [x + 90, 850]))
    }
    // rails between the pickets
    for (let i = -1; i < 6; i++) {
      const a = i < 0 ? 50 : 110 + i * 135 + 90
      const b = i === 5 ? a + 50 : i < 0 ? 110 : a + 45
      for (const y of [420, 465, 700, 745]) out.push(line([a, y], [b, y]))
    }
    out.push(zigzag(50, 870, 950, 870, 22, 22))
    return out
  },

  bench: () => [
    // backrest slats
    rect(140, 250, 720, 55),
    rect(140, 335, 720, 55),
    line([190, 390], [190, 520]),
    line([810, 390], [810, 520]),
    // seat
    shape([110, 520], [890, 520], [930, 600], [70, 600]),
    line([90, 560], [910, 560]),
    // legs and arms
    line([130, 600], [130, 830]),
    line([870, 600], [870, 830]),
    line([200, 600], [205, 780]),
    line([800, 600], [795, 780]),
    line([190, 440], [95, 450]),
    line([110, 450], [118, 520]),
    line([810, 440], [905, 450]),
    line([890, 450], [882, 520]),
  ],

  swing: () => [
    line([140, 180], [860, 180]),
    line([140, 180], [60, 900]),
    line([140, 180], [230, 900]),
    line([860, 180], [770, 900]),
    line([860, 180], [940, 900]),
    // ropes and seat
    line([420, 185], [420, 690]),
    line([580, 185], [580, 690]),
    rect(380, 690, 240, 35),
    line([30, 900], [970, 900]),
  ],

  seesaw: () => [
    // tilted plank
    line([100, 370], [900, 610]),
    line([100, 400], [900, 640]),
    line([100, 370], [100, 400]),
    line([900, 610], [900, 640]),
    // pivot
    shape([500, 520], [390, 800], [610, 800]),
    circle(500, 520, 18),
    // handles
    line([210, 403], [210, 290]),
    line([175, 290], [245, 290]),
    line([790, 577], [790, 465]),
    line([755, 465], [825, 465]),
    line([40, 800], [960, 800]),
  ],

  hammock: () => {
    const top = (x) => 460 + 100 * (1 - ((x - 500) / 230) ** 2)
    const bot = (x) => 460 + 210 * (1 - ((x - 500) / 230) ** 2)
    const xs = [330, 415, 500, 585, 670]
    return [
      // two trees
      line([110, 930], [120, 260]),
      line([180, 930], [175, 260]),
      scallop(145, 170, 150, 115, 8),
      line([820, 930], [825, 260]),
      line([890, 930], [880, 260]),
      scallop(855, 170, 150, 115, 8),
      // ropes and the sagging net
      line([178, 400], [270, 460]),
      line([822, 400], [730, 460]),
      curve(...[270, 385, 500, 615, 730].map((x) => [x, top(x)])),
      curve(...[270, 385, 500, 615, 730].map((x) => [x, bot(x)])),
      ...xs.slice(0, -1).flatMap((x, i) => [line([x, top(x)], [xs[i + 1], bot(xs[i + 1])]), line([xs[i + 1], top(xs[i + 1])], [x, bot(x)])]),
      line([40, 930], [960, 930]),
    ]
  },
}
