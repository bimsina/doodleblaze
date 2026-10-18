import { arc, blob, circle, curve, dot, ellipse, line, rect, rotate, shape, wave } from './kit.mjs'

// --- Local helpers ---

const rad = (deg) => (deg * Math.PI) / 180
/** A point on a circle or ellipse, angle in degrees (0 right, 90 down). */
const at = (cx, cy, rx, deg, ry = rx) => [cx + Math.cos(rad(deg)) * rx, cy + Math.sin(rad(deg)) * ry]
/** The points of an arc, for splicing into a longer line. */
const arcPts = (cx, cy, rx, ry, from, to, n = 10) =>
  Array.from({ length: n + 1 }, (_, i) => at(cx, cy, rx, from + ((to - from) * i) / n, ry))
/** A rectangle with rounded corners. */
function roundRect(x, y, w, h, r) {
  return line(
    ...arcPts(x + w - r, y + r, r, r, -90, 0, 4),
    ...arcPts(x + w - r, y + h - r, r, r, 0, 90, 4),
    ...arcPts(x + r, y + h - r, r, r, 90, 180, 4),
    ...arcPts(x + r, y + r, r, r, 180, 270, 4),
    [x + w - r, y],
  )
}

/** The plain (wobble-free) points of a Catmull-Rom curve, for clipping hatch lines to a shape. */
function splinePts(points, per = 8) {
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

/** Parallel lines at `deg`, `gap` apart, clipped to the inside of a closed polygon (inset a little). */
function fill(poly, deg, gap, inset = 14) {
  const dx = Math.cos(rad(deg))
  const dy = Math.sin(rad(deg))
  const [nx, ny] = [-dy, dx]
  const offs = poly.map(([x, y]) => x * nx + y * ny)
  const out = []
  for (let o = Math.min(...offs) + gap / 2; o < Math.max(...offs); o += gap) {
    const ts = []
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i]
      const [bx, by] = poly[(i + 1) % poly.length]
      const da = ax * nx + ay * ny - o
      const db = bx * nx + by * ny - o
      if (da * db >= 0) continue
      const u = da / (da - db)
      ts.push((ax + (bx - ax) * u) * dx + (ay + (by - ay) * u) * dy)
    }
    ts.sort((a, b) => a - b)
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const [t0, t1] = [ts[i] + inset, ts[i + 1] - inset]
      if (t1 - t0 < 20) continue
      out.push(line([nx * o + dx * t0, ny * o + dy * t0], [nx * o + dx * t1, ny * o + dy * t1]))
    }
  }
  return out
}

/** A slice of bread standing in a slot: bottom edge at y, `w` wide, `h` tall, with its crust. */
function bread(x, y, w, h) {
  const top = y - h
  const outline = (d) =>
    curve(
      [x + d, y],
      [x + d, top + h * 0.42],
      [x - 28 + d * 1.6, top + h * 0.22],
      [x - 10 + d * 1.4, top + 25 + d * 0.4],
      [x + w * 0.3, top + d],
      [x + w * 0.5, top + 18 + d],
      [x + w * 0.7, top + d],
      [x + w + 10 - d * 1.4, top + 25 + d * 0.4],
      [x + w + 28 - d * 1.6, top + h * 0.22],
      [x + w - d, top + h * 0.42],
      [x + w - d, y],
    )
  return [outline(0), outline(26)]
}

/** A long stick from (x0, y0) to (x1, y1), w0 wide at the start and w1 at the end, square ends. */
function stick(x0, y0, x1, y1, w0, w1) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len]
  return shape(
    [x0 + (nx * w0) / 2, y0 + (ny * w0) / 2],
    [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2],
    [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2],
    [x0 - (nx * w0) / 2, y0 - (ny * w0) / 2],
  )
}

/** A cookie with chocolate chips. */
const cookie = (x, y, r) => [
  blob(...Array.from({ length: 9 }, (_, i) => at(x, y, r * (i % 2 ? 0.94 : 1.02), i * 40))),
  dot(x - r * 0.35, y - r * 0.3, r * 0.12),
  dot(x + r * 0.3, y - r * 0.15, r * 0.12),
  dot(x - r * 0.1, y + r * 0.35, r * 0.12),
  dot(x + r * 0.45, y + r * 0.4, r * 0.1),
]

export default {
  toaster: () => [
    // two slices of toast popping up, browned in stripes
    bread(250, 430, 220, 300),
    bread(530, 430, 220, 260),
    ...[0, 1].map((i) => [line([300 + i * 60, 260], [330 + i * 60, 360]), line([590 + i * 60, 300], [620 + i * 60, 390])]),
    // retro body, very round on top, slots along its top edge
    curve([150, 850], [150, 560], [190, 450], [300, 420], [700, 420], [810, 450], [850, 560], [850, 850]),
    line([150, 850], [850, 850]),
    line([230, 430], [770, 430]),
    // push-down lever sticking out of the side, a chrome band and a dial
    line([850, 600], [920, 600], [920, 650], [850, 650]),
    curve([175, 700], [500, 730], [825, 700]),
    circle(260, 780, 30),
    // heat rising off the toast
    wave(360, 100, 360, 20, 1, 15),
    wave(640, 140, 640, 60, 1, 15),
  ],

  kettle: () => [
    // body, wide at the base, domed at the top
    curve([230, 860], [250, 640], [330, 470], [500, 420], [670, 470], [750, 640], [770, 860]),
    line([230, 860], [770, 860]),
    // lid with a knob
    curve([400, 440], [500, 400], [600, 440]),
    curve([400, 440], [430, 390], [500, 375], [570, 390], [600, 440]),
    ellipse(500, 352, 34, 24),
    // handle arching over the top
    curve([340, 465], [350, 270], [500, 200], [650, 270], [660, 465]),
    curve([395, 430], [410, 300], [500, 255], [590, 300], [605, 430]),
    // short spout on the left, steam billowing out of it
    line([260, 720], [120, 520], [160, 495], [300, 600]),
    wave(100, 470, 70, 150, 2, 24),
    wave(150, 460, 160, 130, 2, 24),
    wave(205, 465, 240, 190, 2, 22),
  ],

  blender: () => [
    // motor base with buttons and a dial
    shape([300, 690], [700, 690], [740, 910], [260, 910]),
    circle(370, 800, 30),
    circle(460, 800, 30),
    circle(550, 800, 30),
    circle(650, 800, 38),
    line([650, 800], [672, 772]),
    // tall jug, narrow at the bottom, with a handle
    line([345, 690], [290, 190]),
    line([655, 690], [710, 190]),
    line([690, 260], [810, 270], [790, 590], [670, 580]),
    line([690, 310], [765, 315], [750, 545], [675, 535]),
    // lid with a little cap
    rect(270, 140, 460, 50),
    rect(440, 95, 120, 45),
    // blades at the bottom of the jug
    line([500, 650], [500, 690]),
    shape([500, 640], [400, 600], [395, 625]),
    shape([500, 640], [600, 680], [605, 655]),
    shape([500, 640], [590, 595], [610, 610]),
    shape([500, 640], [410, 680], [390, 668]),
    // fruit being whizzed, and measuring ticks
    curve([350, 450], [420, 420], [500, 455], [580, 420], [665, 450]),
    circle(430, 520, 32),
    circle(560, 540, 28),
    circle(500, 485, 22),
    ...[300, 380, 460].map((y) => line([320 + (y - 300) * 0.05, y], [365 + (y - 300) * 0.05, y])),
  ],

  whisk: () =>
    rotate(
      [
        // balloon of looping wires
        ...[250, 175, 100].map((w) =>
          curve(
            [500, 560],
            [500 - w * 0.5, 470],
            [500 - w, 300],
            [500 - w * 0.75, 140],
            [500, 85],
            [500 + w * 0.75, 140],
            [500 + w, 300],
            [500 + w * 0.5, 470],
            [500, 560],
          ),
        ),
        line([500, 90], [500, 560]),
        // collar and handle with a hanging ring
        rect(465, 555, 70, 45),
        curve([470, 600], [460, 760], [462, 880], [500, 910], [538, 880], [540, 760], [530, 600]),
        circle(500, 940, 22),
      ],
      -25,
    ),

  spatula: () => [
    rotate(
      [
        // slotted turner blade carrying a burger patty
        line([330, 300], [670, 300], [620, 600], [380, 600], [330, 300]),
        ...[420, 500, 580].map((x) => roundRect(x - 14, 490, 28, 80, 14)),
        roundRect(380, 340, 240, 120, 50),
        line([420, 380], [470, 430]),
        line([480, 370], [540, 430]),
        line([550, 370], [590, 415]),
        // neck and a chunky riveted handle
        line([450, 600], [470, 680]),
        line([550, 600], [530, 680]),
        roundRect(450, 680, 100, 300, 45),
        dot(500, 750, 12),
        dot(500, 830, 12),
      ],
      20,
      500,
      600,
    ),
    // the patty is sizzling hot
    wave(470, 280, 470, 120, 1.5, 18),
    wave(560, 300, 560, 140, 1.5, 18),
  ],

  'rolling pin': () =>
    rotate(
      [
        // the barrel
        ellipse(270, 470, 38, 95),
        arc(730, 470, 38, 95, -90, 90),
        line([270, 375], [730, 375]),
        line([270, 565], [730, 565]),
        // handles on both ends
        line([232, 450], [130, 450]),
        line([232, 490], [130, 490]),
        ellipse(110, 470, 28, 38),
        line([768, 450], [870, 450]),
        line([768, 490], [870, 490]),
        ellipse(890, 470, 28, 38),
        // a sheet of dough under it, and a dusting of flour
        curve([150, 640], [300, 600], [500, 610], [700, 600], [860, 650], [820, 760], [600, 790], [380, 780], [180, 750], [150, 640]),
        dot(300, 690, 7),
        dot(420, 720, 7),
        dot(560, 690, 7),
        dot(680, 730, 7),
      ],
      -8,
    ),

  grater: () => {
    // a flat hand grater: a long plate of raised cutting holes on a handle
    const holes = []
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 410 + c * 60
        const y = 260 + r * 70
        holes.push(arc(x, y, 20, 12, 180, 360), line([x - 20, y], [x + 20, y]))
      }
    }
    return rotate([roundRect(340, 180, 320, 480, 40), holes, roundRect(440, 660, 120, 280, 50), circle(500, 880, 22)], -15)
  },

  'oven mitt': () => {
    const pts = [
      [250, 920],
      [250, 640],
      [185, 580],
      [110, 460],
      [140, 370],
      [220, 380],
      [285, 470],
      [285, 300],
      [335, 150],
      [460, 85],
      [585, 140],
      [660, 300],
      [675, 540],
      [670, 920],
    ]
    const quilted = splinePts(pts).filter(([, y]) => y < 790)
    return [
      // thick padded mitt with a quilted pattern, a cuff and a hanging loop
      curve(...pts),
      line([250, 800], [670, 800]),
      line([250, 920], [670, 920]),
      curve([440, 920], [430, 980], [460, 995], [490, 980], [480, 920]),
      fill(quilted, 45, 85),
      fill(quilted, -45, 85),
      // holding a hot pie dish, steam rising
      line([560, 460], [980, 460]),
      line([580, 460], [620, 560], [940, 560], [975, 460]),
      curve([590, 460], [700, 410], [800, 405], [960, 455]),
      wave(700, 380, 700, 240, 1.5, 18),
      wave(800, 370, 800, 210, 1.5, 18),
      wave(900, 380, 900, 240, 1.5, 18),
    ]
  },

  fridge: () => [
    // tall box, freezer door on top
    roundRect(260, 70, 480, 860, 50),
    line([260, 360], [740, 360]),
    // door handles
    roundRect(300, 170, 28, 140, 14),
    roundRect(300, 420, 28, 200, 14),
    // magnets and a note
    circle(560, 470, 30),
    rect(600, 540, 70, 55),
    shape([500, 640], [640, 640], [640, 790], [500, 790]),
    line([520, 680], [620, 680]),
    line([520, 715], [620, 715]),
    line([520, 750], [590, 750]),
    dot(570, 630, 12),
    // little feet
    rect(300, 930, 50, 30),
    rect(650, 930, 50, 30),
  ],

  microwave: () => {
    const keys = []
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(rect(705 + c * 50, 420 + r * 50, 30, 30))
    return [
      // wide box
      roundRect(90, 250, 820, 500, 40),
      // door with a window and a turntable plate
      roundRect(130, 290, 520, 420, 24),
      roundRect(175, 335, 400, 330, 18),
      ellipse(375, 620, 150, 25),
      curve([300, 615], [310, 560], [375, 540], [440, 560], [450, 615]),
      line([610, 380], [610, 620]),
      // control panel: a blank display, keypad and a start button
      rect(700, 300, 160, 70),
      keys,
      roundRect(705, 630, 130, 45, 20),
      // feet
      rect(150, 750, 70, 30),
      rect(780, 750, 70, 30),
    ]
  },

  ladle: () =>
    rotate(
      [
        // deep round bowl with soup in it
        ellipse(420, 680, 210, 55),
        arc(420, 680, 210, 230, 0, 180),
        curve([250, 700], [330, 720], [420, 710], [510, 725], [590, 700]),
        // long handle rising from the rim, hooked at the top
        line([600, 660], [700, 160]),
        line([630, 670], [735, 165]),
        curve([700, 160], [700, 90], [760, 60], [820, 90], [825, 160], [800, 200]),
        curve([735, 165], [745, 120], [775, 105], [795, 130], [790, 170], [800, 200]),
        // drips
        blob([400, 960], [385, 930], [400, 905], [415, 930]),
      ],
      -10,
    ),

  colander: () => {
    const holes = []
    for (const [y, half, n] of [
      [610, 290, 7],
      [700, 245, 6],
      [780, 185, 5],
    ]) {
      for (let i = 0; i < n; i++) holes.push(dot(500 - half + (i * 2 * half) / (n - 1), y, 13))
    }
    return [
      // bowl with a rim and a foot ring
      ellipse(500, 520, 360, 80),
      arc(500, 520, 360, 330, 0, 180),
      line([400, 845], [380, 890], [620, 890], [600, 845]),
      // handles at the sides
      curve([150, 500], [70, 470], [55, 540], [140, 575]),
      curve([850, 500], [930, 470], [945, 540], [860, 575]),
      holes,
      // water dripping out of the bottom
      ...[
        [300, 900],
        [440, 950],
        [580, 960],
        [710, 900],
      ].map(([x, y]) => blob([x, y + 30], [x - 14, y + 8], [x, y - 25], [x + 14, y + 8])),
      // pasta inside
      curve([220, 500], [300, 450], [380, 500], [450, 440], [530, 500], [610, 445], [700, 500], [780, 470]),
    ]
  },

  'salt shaker': () => [
    rotate(
      [
        // small glass body with a waist
        curve([380, 860], [360, 700], [400, 560], [380, 430]),
        curve([620, 860], [640, 700], [600, 560], [620, 430]),
        line([380, 860], [620, 860]),
        // salt inside
        line([370, 650], [630, 650]),
        // domed metal cap with holes
        line([370, 430], [630, 430]),
        rect(370, 390, 260, 40),
        curve([380, 390], [400, 300], [500, 270], [600, 300], [620, 390]),
        dot(450, 330, 10),
        dot(500, 315, 10),
        dot(550, 330, 10),
        dot(480, 360, 10),
        dot(530, 360, 10),
      ],
      140,
    ),
    // salt grains falling
    ...[
      [520, 760],
      [470, 820],
      [560, 840],
      [500, 900],
      [440, 930],
      [590, 920],
      [530, 960],
    ].map(([x, y]) => dot(x, y, 8)),
  ],

  chopsticks: () => [
    // two long square sticks, tapering to tips that pinch some noodles
    stick(760, 60, 440, 500, 50, 20),
    stick(870, 100, 470, 520, 50, 20),
    ...[0, 1, 2].map((i) => wave(445 + i * 12, 510, 430 + i * 25, 740, 2.5, 14)),
    // lifted out of a noodle bowl
    ellipse(480, 760, 280, 60),
    arc(480, 760, 280, 190, 0, 180),
    curve([250, 770], [350, 790], [480, 780], [600, 795], [710, 770]),
    line([400, 950], [560, 950]),
  ],

  teacup: () => [
    // wide, shallow cup on a saucer
    ellipse(470, 470, 260, 60),
    curve([210, 470], [225, 620], [300, 730], [470, 760], [640, 730], [715, 620], [730, 470]),
    // small looped handle
    curve([722, 520], [810, 500], [840, 570], [800, 640], [690, 660]),
    curve([716, 560], [780, 550], [790, 590], [760, 615], [700, 625]),
    // saucer
    ellipse(470, 790, 380, 75),
    arc(470, 790, 200, 35, 0, 180),
    // steam
    wave(400, 410, 390, 180, 1.5, 22),
    wave(480, 405, 490, 140, 1.5, 22),
    wave(560, 410, 555, 200, 1.5, 22),
  ],

  'cookie jar': () => [
    // round glass jar with a lid and a knob
    curve([300, 300], [220, 420], [200, 620], [240, 820], [500, 880], [760, 820], [800, 620], [780, 420], [700, 300]),
    rect(290, 250, 420, 55),
    curve([300, 250], [340, 190], [500, 175], [660, 190], [700, 250]),
    circle(500, 145, 35),
    // cookies piled inside
    cookie(380, 720, 85),
    cookie(590, 730, 90),
    cookie(480, 560, 85),
    cookie(650, 520, 70),
    cookie(330, 520, 65),
    // glass shine
    curve([255, 520], [250, 610], [270, 700]),
  ],
}
