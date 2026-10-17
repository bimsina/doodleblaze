import { arc, circle, curve, dot, ellipse, line, rect, rotate, scale, shape, star, zigzag } from './kit.mjs'

// --- Local helpers -----------------------------------------------------------

const rad = (deg) => (deg * Math.PI) / 180
const polar = (cx, cy, r, deg) => [cx + Math.cos(rad(deg)) * r, cy + Math.sin(rad(deg)) * r]

/** A rounded rectangle as one closed stroke. */
function rrect(x, y, w, h, r = Math.min(w, h) * 0.2) {
  const pts = []
  const corner = (cx, cy, from) => {
    for (let i = 0; i <= 4; i++) pts.push(polar(cx, cy, r, from + i * 22.5))
  }
  corner(x + w - r, y + r, -90)
  corner(x + w - r, y + h - r, 0)
  corner(x + r, y + h - r, 90)
  corner(x + r, y + r, 180)
  return line(...pts, pts[0])
}

/** A solid-looking pip: a ring with a dot in it. */
const pip = (x, y, r = 22) => [circle(x, y, r), dot(x, y, r * 0.45)]

/** Points along a quadratic Bezier. */
function quad([ax, ay], [bx, by], [cx, cy], n = 12) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const u = 1 - t
    return [u * u * ax + 2 * u * t * bx + t * t * cx, u * u * ay + 2 * u * t * by + t * t * cy]
  })
}

/** A pip drawn on a face in perspective: o is the face corner, u and v its edges. */
function facePip([ox, oy], [ux, uy], [vx, vy], s, t, r = 0.09) {
  const ring = (k) =>
    line(
      ...Array.from({ length: 13 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const ss = s + Math.cos(a) * r * k
        const tt = t + Math.sin(a) * r * k
        return [ox + ss * ux + tt * vx, oy + ss * uy + tt * vy]
      }),
    )
  return [ring(1), ring(0.4)]
}

/** Parallel hatch lines filling a convex polygon, for the dark patches people shade in. */
function hatchPoly(pts, gap = 28, deg = 35) {
  const a = rad(deg)
  const [c, s] = [Math.cos(a), Math.sin(a)]
  const rot = pts.map(([x, y]) => [x * c + y * s, -x * s + y * c])
  const ys = rot.map((p) => p[1])
  const out = []
  for (let v = Math.min(...ys) + gap / 2; v < Math.max(...ys); v += gap) {
    const xs = []
    for (let i = 0; i < rot.length; i++) {
      const [ax, ay] = rot[i]
      const [bx, by] = rot[(i + 1) % rot.length]
      if ((ay <= v && by > v) || (by <= v && ay > v)) xs.push(ax + ((v - ay) / (by - ay)) * (bx - ax))
    }
    if (xs.length < 2) continue
    const u0 = Math.min(...xs) + 6
    const u1 = Math.max(...xs) - 6
    if (u1 - u0 < 12) continue
    out.push(line([u0 * c - v * s, u0 * s + v * c], [u1 * c - v * s, u1 * s + v * c]))
  }
  return out
}

/** The parts of a circle that lie outside some other circles ([x, y, r] each), e.g. ears behind a head. */
function circleOutside(cx, cy, r, others) {
  const n = 72
  const outside = (deg) => {
    const [x, y] = polar(cx, cy, r, deg)
    return others.every(([ox, oy, or]) => Math.hypot(x - ox, y - oy) > or)
  }
  let start = 0
  while (start < n && outside((start * 360) / n)) start++
  if (start === n) return [circle(cx, cy, r)]
  const runs = []
  let run = []
  for (let i = 1; i <= n; i++) {
    const deg = ((start + i) * 360) / n
    if (outside(deg)) run.push(polar(cx, cy, r, deg))
    else if (run.length) {
      runs.push(run)
      run = []
    }
  }
  if (run.length) runs.push(run)
  return runs.filter((pts) => pts.length > 1).map((pts) => curve(...pts))
}

/** A bow on a kite tail: two little triangles meeting at a point. */
const bow = (x, y, s = 50) => [shape([x, y], [x - s, y - s * 0.7], [x - s, y + s * 0.7]), shape([x, y], [x + s, y - s * 0.7], [x + s, y + s * 0.7])]

/** A boot in side view, toe to the right, for the skates. */
const skateBoot = () => [
  line([300, 110], [290, 600]),
  curve([290, 600], [300, 640], [340, 650], [760, 650], [810, 630], [815, 570], [770, 520], [650, 470], [580, 420]),
  line([580, 420], [570, 110]),
  line([300, 110], [570, 110]),
  line([300, 170], [572, 170]),
  // laces
  ...[0, 1, 2, 3].map((i) => line([560 - i * 4, 220 + i * 60], [620 + i * 20, 250 + i * 60])),
  ...[0, 1, 2, 3].map((i) => line([620 + i * 20, 220 + i * 60], [560 - i * 4, 250 + i * 60])),
  line([300, 600], [800, 600]),
]

// --- Doodles -----------------------------------------------------------------

export default {
  kite: () => [
    shape([450, 80], [660, 300], [450, 620], [240, 300]),
    line([450, 80], [450, 620]),
    line([240, 300], [660, 300]),
    curve([450, 620], [520, 700], [440, 790], [530, 880], [480, 960]),
    bow(495, 690),
    bow(455, 800),
    bow(515, 895),
  ],

  'soccer ball': () => {
    const c = [500, 500]
    const out = [circle(500, 500, 360)]
    const inner = [0, 1, 2, 3, 4].map((k) => polar(...c, 115, -90 + 72 * k))
    out.push(shape(...inner), ...hatchPoly(inner, 36))
    for (let k = 0; k < 5; k++) {
      const a = -90 + 72 * k
      const tip = polar(...c, 215, a)
      out.push(line(inner[k], tip))
      const patch = [polar(...c, 357, a - 15), polar(...c, 285, a - 21), tip, polar(...c, 285, a + 21), polar(...c, 357, a + 15)]
      out.push(line(...patch), ...hatchPoly(patch, 36))
      // the hexagon edges out to the rim between two outer patches
      out.push(line(polar(...c, 285, a + 21), polar(...c, 340, a + 36)))
      out.push(line(polar(...c, 285, a + 51), polar(...c, 340, a + 36)))
    }
    return out
  },

  basketball: () => {
    // the seams are wide black channels, so each one gets drawn twice
    const seam = (pts, dx, dy) => [curve(...pts.map(([x, y]) => [x - dx, y - dy])), curve(...pts.map(([x, y]) => [x + dx, y + dy]))]
    return [
      circle(500, 500, 360),
      ...seam([[500, 141], [500, 500], [500, 859]], 11, 0),
      ...seam([[141, 500], [500, 500], [859, 500]], 0, 11),
      ...seam([[285, 210], [400, 500], [285, 790]], 11, 0),
      ...seam([[715, 210], [600, 500], [715, 790]], 11, 0),
    ]
  },

  baseball: () => {
    const out = [circle(500, 500, 350)]
    for (const side of [-1, 1]) {
      const seam = quad([500 + side * 230, 235], [500 + side * 90, 500], [500 + side * 230, 765], 10)
      out.push(curve(...seam))
      for (let i = 1; i < seam.length - 1; i++) {
        const [x, y] = seam[i]
        out.push(line([x - side * 30, y - 22], [x + side * 30, y - 6]))
      }
    }
    return out
  },

  'rugby ball': () =>
    rotate(
      [
        ...scale(
          [
            curve([100, 500], [250, 345], [500, 290], [750, 345], [900, 500]),
            curve([100, 500], [250, 655], [500, 710], [750, 655], [900, 500]),
            curve([100, 500], [300, 430], [500, 410], [700, 430], [900, 500]),
            curve([100, 500], [300, 580], [500, 600], [700, 580], [900, 500]),
            // laces along the top seam, and the stripes near each end
            line([340, 418], [660, 418]),
            ...[390, 445, 500, 555, 610].map((x) => line([x, 375], [x, 460])),
            curve([215, 380], [232, 500], [215, 620]),
            curve([268, 340], [287, 500], [268, 660]),
            curve([785, 380], [768, 500], [785, 620]),
            curve([732, 340], [713, 500], [732, 660]),
          ],
          0.78,
          620,
          500,
        ),
        // flying: speed lines trailing off the back
        line([250, 400], [80, 400]),
        line([230, 500], [40, 500]),
        line([250, 600], [80, 600]),
      ],
      -25,
    ),

  'bowling ball': () => [
    circle(500, 500, 350),
    ellipse(530, 320, 34, 40),
    ellipse(625, 335, 34, 40),
    ellipse(590, 465, 42, 46),
    arc(500, 500, 290, 290, 160, 215),
    arc(500, 500, 250, 250, 165, 190),
  ],

  'bowling pin': () => {
    // a round head on a thin neck, a fat belly, a small flat foot
    const right = [
      [500, 80],
      [565, 95],
      [595, 160],
      [580, 240],
      [540, 305],
      [550, 360],
      [630, 480],
      [690, 620],
      [670, 770],
      [610, 880],
      [585, 915],
    ]
    const left = right.map(([x, y]) => [1000 - x, y]).reverse()
    return [
      curve(...left, ...right.slice(1)),
      line([415, 915], [585, 915]),
      // two stripes round the neck
      curve([459, 318], [500, 330], [541, 318]),
      curve([456, 340], [500, 352], [544, 340]),
      curve([450, 370], [500, 382], [550, 370]),
      curve([440, 392], [500, 404], [560, 392]),
    ]
  },

  'tennis racket': () => {
    const cx = 500
    const cy = 330
    const rx = 200
    const ry = 260
    const out = [ellipse(cx, cy, rx, ry), ellipse(cx, cy, rx - 30, ry - 30)]
    const irx = rx - 30
    const iry = ry - 30
    for (let dx = -120; dx <= 120; dx += 60) {
      const h = iry * Math.sqrt(1 - (dx / irx) ** 2)
      out.push(line([cx + dx, cy - h], [cx + dx, cy + h]))
    }
    for (let dy = -180; dy <= 180; dy += 60) {
      const h = irx * Math.sqrt(1 - (dy / iry) ** 2)
      out.push(line([cx - h, cy + dy], [cx + h, cy + dy]))
    }
    out.push(line([400, 555], [478, 680], [478, 940]))
    out.push(line([600, 555], [522, 680], [522, 940]))
    out.push(line([478, 940], [522, 940]))
    out.push(line([478, 760], [522, 790]), line([478, 820], [522, 850]), line([478, 880], [522, 910]))
    return rotate(out, 30)
  },

  shuttlecock: () => {
    const out = [
      arc(500, 760, 95, 115, 0, 180),
      line([405, 760], [595, 760]),
      line([410, 720], [590, 720]),
      line([410, 720], [405, 760]),
      line([590, 720], [595, 760]),
    ]
    // the open end of the feather skirt, seen a little from above
    const n = 9
    const rim = (t) => [500 - 260 * Math.cos(t * Math.PI), 230 + 55 * Math.sin(t * Math.PI)]
    out.push(arc(500, 230, 260, 55, 180, 360))
    for (let i = 0; i <= n; i++) {
      const [x, y] = rim(i / n)
      out.push(line([420 + (160 * i) / n, 720], [x, y]))
    }
    for (let i = 0; i < n; i++) {
      const [ax, ay] = rim(i / n)
      const [bx, by] = rim((i + 1) / n)
      out.push(curve([ax, ay], [(ax + bx) / 2, (ay + by) / 2 - 35], [bx, by]))
    }
    out.push(curve([345, 500], [500, 535], [655, 500]))
    return rotate(out, -35)
  },

  'hockey stick': () => [
    line([630, 70], [418, 790], [190, 815], [140, 805]),
    curve([140, 805], [118, 840], [150, 875]),
    line([150, 875], [470, 875], [478, 830], [672, 82], [630, 70]),
    ...[230, 290, 350].map((x) => line([x, 818], [x - 10, 870])),
    line([612, 135], [654, 147]),
    line([600, 175], [643, 187]),
    // the puck
    ellipse(760, 860, 90, 30),
    arc(760, 890, 90, 30, 0, 180),
    line([670, 860], [670, 890]),
    line([850, 860], [850, 890]),
  ],

  'basketball hoop': () => {
    const out = [rect(200, 80, 600, 380), rect(410, 230, 180, 140), line([450, 460], [450, 500]), line([550, 460], [550, 500])]
    out.push(ellipse(500, 510, 140, 34))
    const top = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => [500 + t * 140, 510 + Math.sqrt(1 - t * t) * 34])
    const bottom = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => [500 + t * 80, 790])
    out.push(line(top[0], bottom[0]), line(top[5], bottom[5]))
    for (let i = 0; i < 5; i++) {
      out.push(line(top[i], bottom[i + 1]))
      out.push(line(top[i + 1], bottom[i]))
    }
    out.push(curve(bottom[0], [500, 805], bottom[5]))
    return out
  },

  'boxing glove': () => [
    // the fist, with the thumb bulging out on the left
    curve([340, 645], [280, 580], [240, 480], [250, 390], [305, 345], [295, 285], [340, 195], [450, 130], [600, 130], [720, 215], [775, 380], [755, 540], [690, 645]),
    curve([305, 345], [380, 375], [430, 460], [448, 560], [445, 645]),
    rrect(320, 640, 370, 250, 30),
    line([320, 700], [690, 700]),
    line([470, 720], [540, 770], [470, 820], [540, 870]),
    line([540, 720], [470, 770], [540, 820], [470, 870]),
  ],

  dumbbell: () => [
    line([310, 480], [690, 480]),
    line([310, 520], [690, 520]),
    rrect(250, 300, 60, 400, 15),
    rrect(190, 350, 60, 300, 15),
    rrect(150, 450, 40, 100, 10),
    rrect(690, 300, 60, 400, 15),
    rrect(750, 350, 60, 300, 15),
    rrect(810, 450, 40, 100, 10),
  ],

  'jump rope': () => [
    rrect(190, 120, 70, 240, 30),
    rrect(740, 120, 70, 240, 30),
    line([205, 360], [245, 360], [235, 395], [215, 395], [205, 360]),
    line([755, 360], [795, 360], [785, 395], [765, 395], [755, 360]),
    ...[180, 230, 280].map((y) => line([195, y], [255, y])),
    ...[180, 230, 280].map((y) => line([745, y], [805, y])),
    curve([225, 395], [210, 600], [330, 820], [500, 880], [670, 820], [790, 600], [775, 395]),
  ],

  'roller skate': () => [
    ...skateBoot(),
    rrect(320, 665, 460, 40, 15),
    circle(395, 770, 65),
    dot(395, 770, 14),
    circle(700, 770, 65),
    dot(700, 770, 14),
    rrect(795, 640, 60, 80, 20),
  ],

  'ice skate': () => [
    ...skateBoot(),
    line([370, 650], [370, 760]),
    line([420, 650], [420, 760]),
    line([700, 650], [700, 760]),
    line([750, 640], [750, 760]),
    line([230, 760], [820, 760]),
    curve([230, 760], [215, 785], [240, 800]),
    line([240, 800], [840, 800]),
    curve([840, 800], [900, 770], [890, 700], [850, 710], [820, 760]),
  ],

  trophy: () => [
    ellipse(500, 150, 190, 40),
    curve([310, 150], [320, 330], [400, 470], [500, 510]),
    curve([690, 150], [680, 330], [600, 470], [500, 510]),
    curve([320, 210], [210, 200], [190, 300], [250, 380], [360, 420]),
    curve([680, 210], [790, 200], [810, 300], [750, 380], [640, 420]),
    line([470, 510], [470, 640]),
    line([530, 510], [530, 640]),
    shape([420, 640], [580, 640], [610, 700], [390, 700]),
    rect(330, 700, 340, 160),
    star(500, 320, 85, 38),
  ],

  medal: () => [
    shape([300, 80], [420, 80], [540, 440], [460, 470]),
    shape([700, 80], [580, 80], [460, 440], [540, 470]),
    line([360, 80], [500, 455]),
    line([640, 80], [500, 455]),
    circle(500, 470, 30),
    circle(500, 680, 210),
    circle(500, 680, 160),
    star(500, 685, 110, 48),
  ],

  stopwatch: () => {
    const c = [500, 590]
    const out = [circle(...c, 300), circle(...c, 255)]
    // the winder on top with its ring, and one push button off to the side
    out.push(rect(470, 245, 60, 48), rrect(420, 200, 160, 48, 18), ellipse(500, 165, 42, 36))
    out.push(rotate([rect(482, 238, 36, 55), rrect(458, 205, 84, 38, 12)], 45, ...c))
    for (let k = 0; k < 12; k++) {
      const a = -90 + k * 30
      out.push(line(polar(...c, k % 3 === 0 ? 200 : 225, a), polar(...c, 248, a)))
    }
    // one long sweep hand, with the time it has run shaded in
    out.push(line(c, polar(...c, 225, -20)))
    const wedge = [c, ...[-90, -75, -60, -45, -30, -20].map((a) => polar(...c, 190, a))]
    out.push(...hatchPoly(wedge, 30, -20))
    out.push(dot(...c, 16))
    out.push(circle(500, 720, 45), line([500, 720], [525, 690]))
    return out
  },

  dartboard: () => {
    const c = [460, 540]
    const out = [circle(...c, 360), circle(...c, 335), circle(...c, 230), circle(...c, 205), circle(...c, 70), circle(...c, 30)]
    for (let k = 0; k < 20; k++) {
      const a = 9 + k * 18
      out.push(line(polar(...c, 70, a), polar(...c, 335, a)))
    }
    // a dart stuck near the middle
    out.push(line([480, 520], [700, 300]))
    out.push(line([700, 300], [745, 255]))
    out.push(rrect(690, 270, 30, 30, 8))
    out.push(shape([745, 255], [860, 220], [800, 175]))
    out.push(shape([745, 255], [780, 140], [825, 200]))
    return out
  },

  dice: () => {
    const o = [230, 400]
    const front = [
      [230, 400],
      [630, 400],
      [630, 800],
      [230, 800],
    ]
    const out = [
      shape(...front),
      shape([230, 400], [400, 230], [800, 230], [630, 400]),
      shape([630, 400], [800, 230], [800, 630], [630, 800]),
    ]
    const fu = [400, 0]
    const fv = [0, 400]
    for (const [s, t] of [
      [0.22, 0.22],
      [0.78, 0.22],
      [0.5, 0.5],
      [0.22, 0.78],
      [0.78, 0.78],
    ])
      out.push(...facePip(o, fu, fv, s, t, 0.075))
    // top face: one pip in the middle; right face: two
    out.push(...facePip([230, 400], [400, 0], [170, -170], 0.5, 0.5, 0.075))
    for (const [s, t] of [
      [0.25, 0.25],
      [0.75, 0.75],
    ])
      out.push(...facePip([630, 400], [170, -170], [0, 400], s, t, 0.075))
    return out
  },

  domino: () => {
    // one long tile standing up: two square halves split by a line and a pin
    const out = [rrect(330, 100, 340, 680, 40), line([350, 440], [650, 440]), line([350, 460], [650, 460]), dot(500, 450, 14)]
    for (const x of [410, 590]) for (const y of [180, 270, 360]) out.push(...pip(x, y, 20))
    for (const [x, y] of [
      [410, 540],
      [500, 620],
      [590, 700],
    ])
      out.push(...pip(x, y, 20))
    return rotate(out, 15, 500, 440)
  },

  'chess knight': () => [
    curve(
      [650, 740],
      [680, 600],
      [670, 420],
      [610, 270],
      [520, 170],
      [500, 100],
      [450, 160],
      [380, 200],
      [290, 290],
      [220, 380],
      [235, 440],
      [300, 455],
      [380, 430],
      [420, 450],
      [370, 560],
      [340, 660],
      [340, 740],
    ),
    zigzag(530, 200, 660, 520, 5, 18),
    dot(400, 260, 14),
    dot(260, 400, 8),
    rrect(300, 740, 400, 60, 20),
    rrect(250, 800, 500, 90, 25),
  ],

  'puzzle piece': () => {
    // An edge from a to b with a knob (out = 1) or a hole (out = -1), normal to the left of travel.
    const edge = ([ax, ay], [bx, by], out) => {
      const dx = bx - ax
      const dy = by - ay
      const nx = dy * out
      const ny = -dx * out
      const at = (u, v) => [ax + dx * u + nx * v, ay + dy * u + ny * v]
      return [
        line(at(0, 0), at(0.38, 0)),
        curve(at(0.38, 0), at(0.42, 0.05), at(0.37, 0.15), at(0.42, 0.24), at(0.5, 0.27), at(0.58, 0.24), at(0.63, 0.15), at(0.58, 0.05), at(0.62, 0)),
        line(at(0.62, 0), at(1, 0)),
      ]
    }
    return [
      edge([250, 250], [750, 250], 1),
      edge([750, 250], [750, 750], 1),
      edge([750, 750], [250, 750], -1),
      edge([250, 750], [250, 250], -1),
    ]
  },

  'teddy bear': () => [
    ...circleOutside(375, 165, 65, [[500, 290, 168]]),
    ...circleOutside(625, 165, 65, [[500, 290, 168]]),
    arc(385, 175, 30, 30, 150, 330),
    arc(615, 175, 30, 30, 210, 390),
    circle(500, 290, 165),
    ellipse(500, 350, 75, 55),
    ellipse(500, 325, 24, 16),
    curve([500, 342], [500, 370], [475, 385]),
    curve([500, 370], [525, 385]),
    dot(440, 260, 14),
    dot(560, 260, 14),
    ...circleOutside(500, 640, 180, [[500, 290, 168], [340, 810, 95], [660, 810, 95]]),
    ellipse(500, 650, 95, 105),
    curve([355, 520], [280, 540], [230, 620], [250, 670], [310, 660], [345, 610]),
    curve([645, 520], [720, 540], [770, 620], [750, 670], [690, 660], [655, 610]),
    circle(340, 810, 95),
    circle(340, 815, 48),
    circle(660, 810, 95),
    circle(660, 815, 48),
    shape([500, 470], [420, 430], [420, 510]),
    shape([500, 470], [580, 430], [580, 510]),
  ],

  'yo-yo': () => [
    // the back half peeks out behind the front one
    ...circleOutside(560, 610, 260, [[480, 650, 262]]),
    circle(480, 650, 260),
    circle(480, 650, 185),
    circle(480, 650, 45),
    curve([480, 605], [500, 480], [460, 340], [510, 210], [490, 130]),
    circle(490, 100, 32),
  ],

  balloon: () => [
    curve([500, 660], [370, 600], [270, 460], [270, 290], [370, 130], [500, 100], [630, 130], [730, 290], [730, 460], [630, 600], [500, 660]),
    shape([500, 660], [465, 705], [535, 705]),
    curve([500, 705], [540, 780], [470, 850], [530, 920], [500, 970]),
    curve([340, 300], [355, 220], [410, 170]),
  ],

  'spinning top': () => [
    rrect(470, 90, 60, 170, 20),
    curve([480, 260], [330, 290], [200, 420]),
    curve([520, 260], [670, 290], [800, 420]),
    curve([200, 420], [300, 560], [430, 750], [500, 850]),
    curve([800, 420], [700, 560], [570, 750], [500, 850]),
    curve([200, 420], [500, 470], [800, 420]),
    curve([250, 500], [500, 545], [750, 500]),
    line([500, 850], [500, 905]),
    line([380, 915], [620, 915]),
    arc(500, 470, 380, 140, 150, 205),
    arc(500, 470, 380, 140, -25, 30),
  ],

  'rocking horse': () => [
    ellipse(540, 430, 210, 90),
    // neck and head in one go: chest, jaw, muzzle, forehead, ear, back of the neck
    curve([360, 470], [330, 380], [300, 300], [270, 270], [200, 285], [160, 270], [165, 225], [230, 170], [290, 140]),
    line([290, 140], [300, 90], [325, 145]),
    curve([325, 145], [370, 200], [410, 290], [440, 350]),
    dot(255, 195, 10),
    dot(185, 250, 7),
    zigzag(340, 160, 420, 330, 4, 22),
    curve([745, 400], [810, 420], [840, 520], [810, 620]),
    curve([745, 420], [790, 480], [790, 560]),
    line([400, 490], [330, 725]),
    line([440, 510], [400, 740]),
    line([640, 510], [680, 726]),
    line([690, 490], [750, 704]),
    curve([480, 360], [540, 380], [600, 355]),
    arc(500, 50, 700, 700, 55, 125),
    arc(500, 50, 740, 740, 57, 123),
    line(polar(500, 50, 700, 55), polar(500, 50, 740, 57)),
    line(polar(500, 50, 700, 125), polar(500, 50, 740, 123)),
  ],

  pinwheel: () => {
    const c = [500, 380]
    const out = []
    // Each blade: a straight cut from the pin to its corner, the square's edge
    // back towards the next corner, then the folded flap curling into the pin.
    for (let k = 0; k < 4; k++) {
      const a = -45 + k * 90
      const tip = polar(...c, 330, a)
      const edge = polar(...c, 245, a + 45)
      out.push(line(polar(...c, 22, a), tip, edge))
      out.push(curve(edge, polar(...c, 150, a + 55), polar(...c, 70, a + 30), polar(...c, 22, a + 10)))
    }
    out.push(circle(...c, 22))
    out.push(line([490, 590], [490, 960]))
    out.push(line([515, 590], [515, 960]))
    out.push(line([490, 960], [515, 960]))
    return out
  },

  trampoline: () => {
    const cy = 640
    const out = [ellipse(500, cy, 400, 115), ellipse(500, cy, 310, 78), arc(500, cy + 25, 400, 115, 0, 180)]
    for (let k = 0; k < 16; k++) {
      const a = k * 22.5
      const [cs, sn] = [Math.cos(rad(a)), Math.sin(rad(a))]
      out.push(line([500 + 315 * cs, cy + 80 * sn], [500 + 395 * cs, cy + 112 * sn]))
    }
    // short splayed legs
    for (const x of [150, 370, 630, 850]) {
      const top = cy + 25 + 115 * Math.sqrt(1 - ((x - 500) / 400) ** 2)
      out.push(line([x, top], [x + (x - 500) * 0.12, top + 130]))
    }
    // somebody bouncing high above the mat
    out.push(circle(500, 120, 45), line([500, 165], [500, 330]))
    out.push(line([500, 210], [420, 130]), line([500, 210], [580, 130]))
    out.push(line([500, 330], [445, 410]), line([500, 330], [555, 410]))
    out.push(arc(500, 520, 70, 22, 200, 340), arc(500, 490, 110, 30, 205, 335))
    return out
  },
}
