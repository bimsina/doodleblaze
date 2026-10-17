import {
  arc,
  blob,
  circle,
  curve,
  dot,
  ellipse,
  line,
  rotate,
  shape,
  spiral,
  wave,
} from './kit.mjs'

// --- Local helpers ---

const rad = (deg) => (deg * Math.PI) / 180
/** A point on a circle or ellipse, angle in degrees (0 right, 90 down). */
const at = (cx, cy, rx, deg, ry = rx) => [
  cx + Math.cos(rad(deg)) * rx,
  cy + Math.sin(rad(deg)) * ry,
]

/** A closed loop whose radius changes with the angle: r(deg) -> radius. */
function loop(cx, cy, r, n = 40, squash = 1) {
  const pts = Array.from({ length: n }, (_, i) => {
    const deg = (i * 360) / n
    return at(cx, cy, r(deg), deg, r(deg) * squash)
  })
  return blob(...pts)
}

/** A leaf from its base to its tip, `w` wide (as a share of its length), with a midrib. */
function leaf(x0, y0, x1, y1, w = 0.28, vein = true) {
  const dx = x1 - x0
  const dy = y1 - y0
  const m = (t, s) => [x0 + dx * t - dy * s, y0 + dy * t + dx * s]
  return [
    curve([x0, y0], m(0.3, w * 0.8), m(0.65, w * 0.6), [x1, y1]),
    curve([x0, y0], m(0.3, -w * 0.8), m(0.65, -w * 0.6), [x1, y1]),
    vein ? line([x0, y0], m(0.7, 0)) : [],
  ]
}

/** A short dash centred on (x, y), `len` long, at `deg`. */
const dash = (x, y, len, deg) =>
  line(at(x, y, -len / 2, deg), at(x, y, len / 2, deg))

/** A little teardrop seed pointing at `deg`. */
function seed(x, y, size, deg) {
  const tip = at(x, y, size, deg)
  const l = at(x, y, size * 0.45, deg + 110)
  const back = at(x, y, size * 0.55, deg + 180)
  const r = at(x, y, size * 0.45, deg - 110)
  return curve(tip, l, back, r, tip)
}

/** The two points `w` apart across a centreline c(t), at t. */
function across(c, t, w) {
  const [x, y] = c(t)
  const [x1, y1] = c(Math.max(0, t - 0.01))
  const [x2, y2] = c(Math.min(1, t + 0.01))
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const [nx, ny] = [(-(y2 - y1) / len) * (w / 2), ((x2 - x1) / len) * (w / 2)]
  return [
    [x + nx, y + ny],
    [x - nx, y - ny],
  ]
}

/** Both edges of a bendy tube: c(t) is the centreline point and w(t) its width, t from 0 to 1. */
function tube(c, w, n = 24) {
  const edges = Array.from({ length: n + 1 }, (_, i) =>
    across(c, i / n, w(i / n)),
  )
  return [edges.map((e) => e[0]), edges.map((e) => e[1])]
}

export default {
  pizza: () => [
    // slice, tip down, with a puffy crust along the top
    line([175, 255], [500, 905], [825, 255]),
    curve([175, 255], [300, 170], [500, 135], [700, 170], [825, 255]),
    curve([200, 300], [340, 245], [500, 225], [660, 245], [800, 300]),
    // pepperoni
    circle(390, 400, 52),
    circle(610, 420, 52),
    circle(495, 575, 46),
    circle(500, 745, 28),
  ],

  banana: () => {
    // a thick curved fruit: blunt dark tip on the left, stem on the right
    const c = (t) => at(500, 260, 360, 160 - 135 * t)
    const w = (t) => 34 + 230 * Math.sin(Math.PI * t) ** 0.75
    const [outer, inner] = tube(c, w)
    const [ridge] = tube(c, (t) => w(t) * 0.25)
    const [s0, s1] = across(c, 1, 46)
    const tip = c(1)
    const [e0, e1] = across((t) => [tip[0] + 55 * t, tip[1] - 90 * t], 1, 46)
    return rotate(
      [
        curve(...outer),
        curve(...inner),
        curve(...ridge.slice(2, -2)),
        // blunt end with its dark nub
        curve(outer[0], at(...c(0), 22, 200), inner[0]),
        dot(...at(...c(0), 14, 200), 12),
        // stem
        line(s0, e0, e1, s1),
      ],
      -20,
    )
  },

  apple: () => [
    blob(
      [500, 305],
      [610, 255],
      [750, 275],
      [835, 400],
      [830, 590],
      [740, 770],
      [610, 860],
      [500, 830],
      [390, 860],
      [260, 770],
      [170, 590],
      [165, 400],
      [250, 275],
      [390, 255],
    ),
    // stem and a single leaf
    curve([500, 305], [490, 230], [515, 140]),
    leaf(505, 215, 700, 150, 0.25),
    // shine
    curve([270, 430], [285, 370], [320, 330]),
  ],

  'ice cream': () => {
    const [xl, xr, top, tx, ty] = [345, 655, 520, 500, 925]
    const w = xr - xl
    const hatch = []
    for (const k of [1, 2, 3]) {
      const d = (w * k) / 4
      const s = (w - d) / w
      hatch.push(
        line([xl + d, top], [xl + d + (tx - xl) * s, top + (ty - top) * s]),
      )
      hatch.push(
        line([xr - d, top], [xr - d + (tx - xr) * s, top + (ty - top) * s]),
      )
    }
    return [
      // waffle cone
      line([xl, top], [tx, ty], [xr, top]),
      hatch,
      // scoop with a drippy rim
      curve(
        [300, 500],
        [300, 360],
        [390, 230],
        [500, 200],
        [610, 230],
        [700, 360],
        [700, 500],
      ),
      curve(
        [300, 500],
        [325, 545],
        [365, 530],
        [400, 520],
        [425, 580],
        [455, 610],
        [480, 570],
        [500, 520],
        [550, 525],
        [585, 565],
        [615, 560],
        [640, 520],
        [680, 530],
        [700, 500],
      ),
      // cherry on top
      circle(500, 160, 40),
      curve([505, 122], [520, 80], [560, 55]),
    ]
  },

  burger: () => [
    // top bun with sesame seeds
    curve(
      [170, 420],
      [200, 270],
      [340, 185],
      [500, 165],
      [660, 185],
      [800, 270],
      [830, 420],
    ),
    curve([170, 420], [500, 440], [830, 420]),
    dash(330, 290, 36, 20),
    dash(450, 240, 36, -15),
    dash(570, 260, 36, 15),
    dash(680, 320, 36, -25),
    dash(400, 350, 36, 10),
    dash(560, 360, 36, -10),
    // lettuce
    wave(150, 465, 850, 465, 7, 18),
    // cheese with two drips
    line([180, 500], [820, 500]),
    line([300, 500], [340, 575], [380, 500]),
    line([600, 500], [645, 585], [690, 500]),
    // patty
    blob(
      [190, 520],
      [500, 510],
      [810, 520],
      [830, 580],
      [810, 640],
      [500, 650],
      [190, 640],
      [170, 580],
    ),
    // bottom bun
    curve(
      [185, 675],
      [500, 665],
      [815, 675],
      [810, 750],
      [700, 775],
      [300, 775],
      [190, 750],
      [185, 675],
    ),
  ],

  donut: () => {
    // seen from a little above: icing dripping over the puffy ring, sprinkles on top
    const icing = []
    for (let deg = 0; deg < 360; deg += 5) {
      const drip =
        deg > 15 && deg < 165
          ? 85 * Math.max(0, Math.sin(rad(deg * 6))) ** 2
          : 0
      const [x, y] = at(
        500,
        445,
        318 + 10 * Math.sin(rad(deg * 7)),
        deg,
        192 + 6 * Math.sin(rad(deg * 7)),
      )
      icing.push([x, y + drip])
    }
    const sprinkles = []
    for (let i = 0; i < 16; i++) {
      const deg = i * 22.5 + 8
      const r = i % 2 ? 0.62 : 0.8
      const [x, y] = at(500, 440, 250 * r + 40, deg, 150 * r + 25)
      sprinkles.push(dash(x, y, 40, deg * 2.9 + i * 37))
    }
    return [
      ellipse(500, 440, 370, 220),
      arc(500, 530, 362, 220, 0, 180),
      curve([130, 440], [122, 490], [138, 530]),
      curve([870, 440], [878, 490], [862, 530]),
      blob(...icing),
      ellipse(500, 430, 105, 55),
      sprinkles,
    ]
  },

  carrot: () =>
    rotate(
      [
        // tapering root with a rounded top
        curve([395, 330], [415, 560], [460, 780], [500, 915]),
        curve([605, 330], [585, 560], [540, 780], [500, 915]),
        curve([395, 330], [500, 300], [605, 330]),
        // ridges
        line([408, 430], [470, 440]),
        line([600, 520], [535, 530]),
        line([425, 620], [480, 628]),
        line([565, 720], [520, 726]),
        // leafy top
        leaf(470, 315, 330, 110, 0.22),
        leaf(500, 310, 505, 60, 0.2),
        leaf(530, 315, 680, 120, 0.22),
      ],
      30,
    ),

  cupcake: () => [
    // pleated paper cup
    line([250, 570], [335, 890], [665, 890], [750, 570]),
    ...[0.2, 0.4, 0.6, 0.8].map((t) =>
      line([250 + 500 * t, 590], [335 + 330 * t, 885]),
    ),
    // piped frosting, three puffy tiers, cherry on top
    curve(
      [230, 575],
      [290, 605],
      [360, 585],
      [430, 608],
      [500, 590],
      [570, 608],
      [640, 585],
      [710, 605],
      [770, 575],
    ),
    curve(
      [230, 575],
      [195, 500],
      [260, 440],
      [500, 425],
      [740, 440],
      [805, 500],
      [770, 575],
    ),
    curve(
      [285, 445],
      [260, 370],
      [380, 335],
      [500, 330],
      [620, 335],
      [740, 370],
      [715, 445],
    ),
    curve(
      [370, 340],
      [360, 270],
      [440, 240],
      [500, 235],
      [560, 240],
      [640, 270],
      [630, 340],
    ),
    circle(500, 195, 42),
    curve([505, 155], [520, 110], [560, 85]),
    // sprinkles
    dash(330, 500, 34, 30),
    dash(470, 480, 34, -20),
    dash(630, 495, 34, 40),
    dash(420, 390, 34, 70),
    dash(580, 385, 34, -40),
    dash(700, 530, 34, 10),
  ],

  watermelon: () => {
    const seeds = []
    for (const [r, deg] of [
      [150, 45],
      [150, 95],
      [150, 140],
      [230, 30],
      [235, 70],
      [235, 110],
      [230, 150],
    ]) {
      const [x, y] = at(500, 330, r, deg)
      seeds.push(seed(x, y, 26, deg))
    }
    return [
      // half-moon slice, flat side up
      line([130, 330], [870, 330]),
      arc(500, 330, 370, 370, 0, 180),
      arc(500, 330, 315, 315, 0, 180),
      arc(500, 330, 290, 290, 5, 175),
      seeds,
    ]
  },

  'hot dog': () =>
    rotate(
      [
        // long sausage with round ends poking out of a soft, split bun
        blob(
          [90, 500],
          [130, 435],
          [500, 425],
          [870, 435],
          [910, 500],
          [870, 565],
          [500, 575],
          [130, 565],
        ),
        curve(
          [200, 450],
          [190, 380],
          [260, 330],
          [500, 320],
          [740, 330],
          [810, 380],
          [800, 450],
        ),
        curve(
          [195, 555],
          [180, 640],
          [260, 700],
          [500, 715],
          [740, 700],
          [820, 640],
          [805, 555],
        ),
        // squiggle of mustard
        wave(190, 500, 810, 500, 7, 26),
      ],
      -12,
    ),

  'fried egg': () => {
    const bumps = [0, 40, -25, 30, -10, 45, -30, 20, -15]
    return [
      // runny white, uneven edge
      loop(
        500,
        510,
        (deg) =>
          330 + bumps[Math.floor(deg / 40)] * Math.sin(rad((deg % 40) * 4.5)),
        54,
        0.88,
      ),
      // yolk with a shine
      circle(450, 470, 135),
      arc(450, 470, 90, 90, 195, 260),
    ]
  },

  grapes: () => {
    const rows = [
      [300, [320, 440, 560, 680]],
      [415, [380, 500, 620]],
      [530, [440, 560]],
      [645, [500]],
    ]
    const grapes = rows.flatMap(([y, xs]) => xs.map((x) => circle(x, y, 64)))
    return [
      grapes,
      // stem and leaf
      curve([505, 240], [500, 170], [530, 110]),
      leaf(515, 160, 690, 140, 0.3),
    ]
  },

  taco: () => [
    // folded shell standing on its fold, the far half showing inside
    curve(
      [130, 470],
      [150, 650],
      [300, 800],
      [500, 845],
      [700, 800],
      [850, 650],
      [870, 470],
    ),
    curve(
      [185, 505],
      [220, 650],
      [345, 755],
      [500, 790],
      [655, 755],
      [780, 650],
      [815, 505],
    ),
    // a big heap of frilly lettuce, with tomato and meat on top
    curve(
      [110, 475],
      [150, 420],
      [190, 450],
      [220, 380],
      [270, 410],
      [300, 340],
      [350, 380],
      [390, 310],
      [440, 350],
      [500, 290],
      [555, 345],
      [600, 310],
      [650, 380],
      [700, 345],
      [740, 410],
      [790, 390],
      [820, 450],
      [860, 425],
      [890, 475],
    ),
    curve([110, 475], [300, 505], [500, 510], [700, 505], [890, 475]),
    shape([280, 410], [340, 390], [360, 445], [295, 460]),
    shape([500, 370], [570, 365], [575, 425], [505, 430]),
    shape([660, 420], [720, 430], [705, 480], [645, 470]),
    curve([395, 430], [420, 360], [460, 345], [480, 430]),
    // cheese shreds hanging over the shell
    line([240, 500], [250, 560]),
    line([420, 505], [425, 575]),
    line([600, 505], [595, 570]),
    line([760, 495], [750, 550]),
    // toasty spots on the shell
    dot(300, 650, 9),
    dot(700, 640, 9),
  ],

  popcorn: () => {
    const puff = (cx, cy, r) =>
      loop(
        cx,
        cy,
        (deg) => r * (0.8 + 0.25 * Math.abs(Math.sin(rad(deg * 2.5)))),
        30,
      )
    return [
      // striped bucket
      line([250, 470], [330, 900], [670, 900], [750, 470]),
      line([250, 470], [750, 470]),
      line([360, 470], [400, 900]),
      line([500, 470], [500, 900]),
      line([640, 470], [600, 900]),
      // heap of popped kernels
      puff(300, 400, 75),
      puff(430, 370, 85),
      puff(580, 380, 80),
      puff(700, 410, 70),
      puff(370, 260, 75),
      puff(520, 230, 85),
      puff(650, 280, 70),
      // one that jumped out
      puff(830, 250, 55),
    ]
  },

  cherry: () => [
    circle(355, 690, 140),
    circle(650, 650, 140),
    curve([365, 552], [400, 380], [490, 240], [570, 160]),
    curve([645, 512], [620, 360], [590, 240], [570, 160]),
    leaf(570, 165, 780, 120, 0.28),
    arc(355, 690, 95, 95, 200, 250),
    arc(650, 650, 95, 95, 200, 250),
  ],

  pineapple: () => {
    const [cx, cy, rx, ry] = [500, 630, 220, 290]
    // diamond pattern: chords of the body ellipse along both diagonals
    const chords = []
    for (const dir of [1, -1]) {
      for (let k = -3; k <= 3; k++) {
        const c = k * 140
        const pts = []
        for (let x = cx - rx; x <= cx + rx; x += 4) {
          const y = cy + dir * (x - cx) * 1.1 + c
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 0.97)
            pts.push([x, y])
        }
        if (pts.length > 4) chords.push(line(pts[0], pts.at(-1)))
      }
    }
    return [
      ellipse(cx, cy, rx, ry),
      chords,
      // spiky crown
      line(
        [400, 365],
        [330, 200],
        [430, 300],
        [440, 110],
        [500, 260],
        [560, 80],
        [570, 290],
        [670, 170],
        [610, 365],
      ),
    ]
  },

  mushroom: () => [
    // spotted dome cap
    curve(
      [140, 540],
      [170, 360],
      [310, 220],
      [500, 180],
      [690, 220],
      [830, 360],
      [860, 540],
    ),
    curve([140, 540], [300, 590], [500, 600], [700, 590], [860, 540]),
    circle(330, 400, 55),
    circle(540, 300, 65),
    circle(710, 430, 50),
    circle(480, 480, 40),
    // stalk
    curve([400, 590], [390, 740], [370, 870]),
    curve([600, 590], [610, 740], [630, 870]),
    curve([370, 870], [500, 900], [630, 870]),
  ],

  broccoli: () => {
    // a floret lying on its side: bumpy head packed with little buds, short fat stalk
    const head = loop(
      500,
      360,
      (deg) => 300 * (0.8 + 0.24 * Math.abs(Math.sin(rad(deg * 4.5)))),
      72,
      0.62,
    )
    const buds = [
      [300, 340],
      [400, 270],
      [520, 245],
      [640, 280],
      [720, 370],
      [360, 420],
      [470, 350],
      [590, 360],
      [500, 450],
      [640, 450],
      [250, 440],
    ].map(([x, y]) => arc(x, y, 36, 28, 160, 380))
    return rotate(
      [
        head,
        buds,
        // stalk splitting into three branches under the head
        line([340, 540], [420, 640], [425, 800]),
        line([660, 540], [580, 640], [575, 800]),
        ellipse(500, 800, 75, 26),
        line([410, 560], [465, 640], [490, 565]),
        line([510, 565], [535, 640], [590, 560]),
      ],
      55,
    )
  },

  'birthday cake': () => {
    const candles = [370, 500, 630].map((x, i) => [
      line([x - 18, 470], [x - 18, 300], [x + 18, 300], [x + 18, 470]),
      line([x - 18, 360], [x + 18, 330]),
      line([x - 18, 420], [x + 18, 390]),
      line([x, 300], [x, 270]),
      curve([x, 265], [x - 28, 225], [x, 165 - i * 0], [x + 28, 225], [x, 265]),
    ])
    return [
      // one-tier cake with icing dripping down the side
      ellipse(500, 470, 300, 75),
      line([200, 470], [200, 780]),
      line([800, 470], [800, 780]),
      arc(500, 780, 300, 75, 0, 180),
      curve(
        [200, 500],
        [240, 600],
        [280, 560],
        [330, 620],
        [380, 570],
        [430, 640],
        [500, 580],
        [570, 640],
        [620, 570],
        [670, 620],
        [720, 560],
        [760, 600],
        [800, 500],
      ),
      // plate
      arc(500, 790, 370, 105, 0, 180),
      line([130, 790], [200, 780]),
      line([870, 790], [800, 780]),
      candles,
    ]
  },

  pear: () =>
    rotate(
      [
        blob(
          [500, 205],
          [590, 240],
          [625, 340],
          [630, 440],
          [720, 530],
          [770, 650],
          [740, 800],
          [610, 885],
          [500, 895],
          [390, 885],
          [260, 800],
          [230, 650],
          [280, 530],
          [370, 440],
          [375, 340],
          [410, 240],
        ),
        curve([500, 210], [505, 150], [535, 90]),
        leaf(515, 140, 690, 110, 0.28),
        curve([300, 640], [310, 580], [340, 540]),
      ],
      12,
    ),

  strawberry: () => {
    const seeds = [
      [300, 470],
      [420, 520],
      [580, 520],
      [700, 470],
      [300, 580],
      [420, 580],
      [540, 580],
      [660, 560],
      [370, 680],
      [490, 690],
      [610, 670],
      [440, 790],
      [560, 790],
    ].map(([x, y]) => seed(x, y, 20, -90))
    return [
      // berry: round shoulders tapering to a blunt tip, taller than wide
      blob(
        [500, 290],
        [630, 285],
        [740, 320],
        [790, 420],
        [770, 580],
        [690, 740],
        [580, 870],
        [500, 905],
        [420, 870],
        [310, 740],
        [230, 580],
        [210, 420],
        [260, 320],
        [370, 285],
      ),
      // star of green leaves draped over the top, and the stem
      leaf(500, 300, 230, 370, 0.3, false),
      leaf(500, 300, 340, 450, 0.3, false),
      leaf(500, 300, 500, 480, 0.3, false),
      leaf(500, 300, 660, 450, 0.3, false),
      leaf(500, 300, 770, 370, 0.3, false),
      curve([500, 300], [505, 220], [530, 150]),
      seeds,
    ]
  },

  pumpkin: () => [
    // ribbed body
    curve(
      [500, 300],
      [350, 280],
      [200, 340],
      [130, 500],
      [150, 700],
      [290, 830],
      [500, 850],
    ),
    curve(
      [500, 300],
      [650, 280],
      [800, 340],
      [870, 500],
      [850, 700],
      [710, 830],
      [500, 850],
    ),
    curve([440, 305], [320, 400], [290, 580], [330, 760], [440, 845]),
    curve([560, 305], [680, 400], [710, 580], [670, 760], [560, 845]),
    curve([470, 305], [440, 500], [440, 680], [470, 848]),
    curve([530, 305], [560, 500], [560, 680], [530, 848]),
    // stubby stem and a curly vine
    line(
      [455, 305],
      [450, 230],
      [470, 195],
      [545, 200],
      [555, 235],
      [545, 305],
    ),
    curve(
      [545, 220],
      [610, 200],
      [660, 160],
      [640, 120],
      [600, 140],
      [620, 190],
      [690, 210],
      [740, 170],
    ),
  ],

  avocado: () => {
    const outline = [
      [500, 110],
      [600, 150],
      [650, 270],
      [690, 420],
      [780, 580],
      [790, 760],
      [660, 895],
      [500, 920],
      [340, 895],
      [210, 760],
      [220, 580],
      [310, 420],
      [350, 270],
      [400, 150],
    ]
    const inner = outline.map(([x, y]) => [
      500 + (x - 500) * 0.84,
      560 + (y - 560) * 0.88,
    ])
    return [
      blob(...outline),
      blob(...inner),
      // big round pit
      circle(500, 665, 150),
      arc(500, 665, 105, 105, 200, 260),
    ]
  },

  corn: () => {
    const [cx, cy, rx, ry] = [500, 440, 150, 360]
    const kernels = []
    // columns of kernels follow the cob's curve
    for (const k of [-0.6, -0.2, 0.2, 0.6]) {
      kernels.push(
        k < 0
          ? arc(cx, cy, -k * rx, ry * 0.98, 110, 250)
          : arc(cx, cy, k * rx, ry * 0.98, -70, 70),
      )
    }
    for (let y = cy - ry + 90; y < cy + ry * 0.5; y += 80) {
      const half = rx * Math.sqrt(1 - ((y - cy) / ry) ** 2)
      kernels.push(line([cx - half + 8, y], [cx + half - 8, y]))
    }
    return rotate(
      [
        ellipse(cx, cy, rx, ry),
        kernels,
        // husk leaves wrapping the bottom
        curve([500, 930], [380, 860], [300, 700], [290, 520]),
        curve([500, 930], [420, 800], [380, 660], [290, 520]),
        curve([500, 930], [620, 860], [700, 720], [720, 560]),
        curve([500, 930], [580, 800], [620, 680], [720, 560]),
        curve([500, 930], [470, 850], [470, 760]),
      ],
      35,
    )
  },

  cheese: () => [
    // wedge: triangular top, tall front face, short back face
    line([140, 520], [640, 270], [860, 380], [140, 520]),
    line([140, 520], [140, 760], [860, 640], [860, 380]),
    // holes, some cut by the edges
    circle(300, 640, 42),
    circle(480, 600, 55),
    circle(690, 560, 38),
    circle(600, 680, 28),
    ellipse(600, 360, 50, 22),
    ellipse(420, 450, 36, 16),
    arc(760, 650, 45, 45, 180, 340),
  ],

  sandwich: () => [
    // the other half, peeking out behind
    line([556, 252], [650, 110], [905, 470], [905, 650], [850, 650]),
    wave(850, 500, 925, 500, 1, 14),
    // front half: a triangle of bread with its crust...
    line([110, 560], [470, 170], [840, 560], [110, 560]),
    line([195, 530], [470, 235], [760, 530]),
    // ...over frilly lettuce, tomato, cheese and the bottom slice
    wave(95, 590, 860, 590, 9, 20),
    line([120, 625], [835, 625]),
    ...[250, 450, 650].map((x) => arc(x, 625, 60, 28, 0, 180)),
    line([300, 655], [330, 700], [360, 655]),
    line([560, 655], [590, 705], [620, 655]),
    line([115, 655], [840, 655]),
    line([115, 655], [115, 740], [840, 740], [840, 655]),
  ],

  'french fries': () => {
    const rimY = (x) => 470 + 70 * (1 - ((x - 500) / 270) ** 2)
    const fries = [
      [300, 280, -12],
      [370, 190, -7],
      [440, 230, -3],
      [510, 150, 0],
      [580, 210, 4],
      [650, 170, 8],
      [715, 270, 13],
    ].map(([x, top, tilt]) => {
      const lean = Math.tan(rad(tilt)) * (rimY(x) - top)
      return line(
        [x - 24, rimY(x - 24)],
        [x - 24 + lean, top],
        [x + 24 + lean, top],
        [x + 24, rimY(x + 24)],
      )
    })
    return [
      fries,
      // carton with a scooped top edge
      curve([230, 470], [500, 545], [770, 470]),
      line([230, 470], [320, 900], [680, 900], [770, 470]),
      curve([290, 760], [500, 790], [710, 760]),
    ]
  },

  'chicken leg': () =>
    rotate(
      [
        // meaty drumstick, tapering into the bone
        curve(
          [600, 475],
          [520, 420],
          [420, 345],
          [300, 320],
          [190, 360],
          [135, 470],
          [160, 590],
          [260, 660],
          [400, 650],
          [520, 575],
          [600, 525],
        ),
        line([600, 475], [780, 478]),
        line([600, 525], [780, 522]),
        // knobbly bone end
        curve(
          [780, 478],
          [790, 425],
          [840, 410],
          [875, 445],
          [858, 500],
          [875, 555],
          [840, 590],
          [790, 575],
          [780, 522],
        ),
        // crispy skin lines
        curve([230, 430], [270, 400], [320, 400]),
        curve([300, 540], [350, 520], [400, 530]),
      ],
      35,
    ),

  pancakes: () => {
    // a tall stack of thin, puffy-edged pancakes, a bit uneven
    const offsets = [0, 14, -10, 12, -6]
    const layers = offsets.map((dx, i) => {
      const [cx, y] = [500 + dx, 330 + i * 62]
      return [
        curve([cx - 320, y], [cx - 342, y + 31], [cx - 318, y + 62]),
        curve([cx + 320, y], [cx + 342, y + 31], [cx + 318, y + 62]),
        arc(cx, y + 62, 318, 70, 0, 180),
      ]
    })
    return [
      // plate
      arc(500, 700, 430, 100, 0, 180),
      line([70, 700], [180, 690]),
      line([930, 700], [820, 690]),
      // top pancake and the stack below it
      ellipse(500, 330, 320, 70),
      layers,
      // pat of butter and syrup running down the side
      shape([440, 300], [560, 285], [600, 325], [470, 345]),
      line([470, 345], [470, 365], [600, 345], [600, 325]),
      curve(
        [300, 350],
        [330, 400],
        [345, 470],
        [360, 520],
        [380, 470],
        [400, 400],
        [450, 395],
        [560, 395],
        [620, 400],
        [640, 450],
        [650, 560],
        [670, 590],
        [690, 560],
        [690, 430],
        [700, 380],
      ),
    ]
  },

  croissant: () => {
    // a fat crescent of five puffy rolled segments, pointy tips curling in
    const c = (t) => at(500, 620, 370, 165 + 210 * t, 240)
    const w = (t) => 24 + 270 * Math.sin(Math.PI * t) ** 1.1
    const puff = (t) => Math.abs(Math.sin(5 * Math.PI * t)) ** 0.5
    const [outer] = tube(
      c,
      (t) => w(t) + 170 * puff(t) * Math.sin(Math.PI * t) ** 0.6,
      100,
    )
    const [, inner] = tube(
      c,
      (t) => w(t) + 60 * puff(t) * Math.sin(Math.PI * t),
      80,
    )
    // each segment tucks behind the one nearer the middle
    const dividers = [0.2, 0.4, 0.6, 0.8].map((t) => {
      const [o, i] = across(c, t, w(t) * 1.05)
      const mid = c(t)
      return curve(
        o,
        [mid[0] + (t - 0.5) * 230, mid[1] - Math.abs(t - 0.5) * 40],
        i,
      )
    })
    return [
      curve(...outer),
      curve(...inner),
      line(outer[0], inner[0]),
      line(outer.at(-1), inner.at(-1)),
      dividers,
    ]
  },

  cookie: () => {
    // round cookie with a bite out of the top right
    const pts = []
    for (let deg = -20; deg <= 290; deg += 10)
      pts.push(at(500, 500, 340 + 10 * Math.sin(rad(deg * 5)), deg))
    for (let deg = 290; deg <= 340; deg += 2.5) {
      const t = (deg - 290) / 50
      pts.push(
        at(
          500,
          500,
          340 -
            95 * Math.abs(Math.sin(t * Math.PI * 3)) -
            20 * Math.sin(t * Math.PI),
          deg,
        ),
      )
    }
    pts.push(at(500, 500, 340, -20))
    const chip = (x, y, s) =>
      blob(
        [x - s, y - s * 0.6],
        [x + s * 0.4, y - s],
        [x + s, y + s * 0.2],
        [x - s * 0.1, y + s * 0.9],
        [x - s, y + s * 0.4],
      )
    return [
      line(...pts),
      chip(380, 330, 30),
      chip(560, 380, 28),
      chip(300, 520, 30),
      chip(470, 520, 32),
      chip(640, 560, 30),
      chip(390, 690, 30),
      chip(560, 720, 28),
      chip(720, 420, 26),
      // crumbs
      dot(800, 150, 12),
      dot(860, 210, 9),
    ]
  },

  lollipop: () => [
    circle(500, 360, 260),
    spiral(500, 360, 245, 3),
    line([485, 620], [485, 940], [515, 940], [515, 620]),
  ],

  candy: () => [
    // round sweet in the middle, striped
    ellipse(500, 500, 200, 150),
    curve([360, 395], [420, 500], [380, 615]),
    curve([470, 355], [530, 500], [480, 650]),
    curve([580, 360], [640, 500], [600, 640]),
    // twisted wrapper ends
    line([305, 455], [265, 480], [265, 520], [305, 545]),
    line(
      [265, 480],
      [140, 360],
      [170, 420],
      [110, 450],
      [160, 500],
      [110, 550],
      [170, 580],
      [140, 640],
      [265, 520],
    ),
    line([255, 500], [165, 460]),
    line([255, 500], [165, 540]),
    line([695, 455], [735, 480], [735, 520], [695, 545]),
    line(
      [735, 480],
      [860, 360],
      [830, 420],
      [890, 450],
      [840, 500],
      [890, 550],
      [830, 580],
      [860, 640],
      [735, 520],
    ),
    line([745, 500], [835, 460]),
    line([745, 500], [835, 540]),
  ],
}
