import { arc, circle, curve, dot, ellipse, line, rect, rotate, shape, star, wave } from './kit.mjs'

// --- Local helpers ---

/** A rounded rectangle. */
function rrect(x, y, w, h, r) {
  const pts = []
  const corners = [
    [x + w - r, y + r, -90],
    [x + w - r, y + h - r, 0],
    [x + r, y + h - r, 90],
    [x + r, y + r, 180],
  ]
  for (const [cx, cy, a0] of corners) {
    for (let k = 0; k <= 4; k++) {
      const a = ((a0 + k * 22.5) * Math.PI) / 180
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
  }
  return shape(...pts)
}

/** A body's bottom edge at height y from x0 to x1, arching up over each wheel. */
function underside(x0, x1, y, wheels, r) {
  const out = []
  let x = x0
  for (const w of wheels) {
    out.push(line([x, y], [w - r, y]))
    out.push(arc(w, y, r, r, 180, 360))
    x = w + r
  }
  out.push(line([x, y], [x1, y]))
  return out
}

/** A tyre with a hub. */
const wheel = (x, y, r) => [circle(x, y, r), circle(x, y, r * 0.38)]

/** A spoke across a wheel at angle a (degrees). */
function spoke([cx, cy], r, a) {
  const c = Math.cos((a * Math.PI) / 180) * r
  const s = Math.sin((a * Math.PI) / 180) * r
  return line([cx - c, cy - s], [cx + c, cy + s])
}

/** Short rays fanning out from a point, for a flashing light. */
function rays(cx, cy, r0, r1, angles) {
  return angles.map((a) => {
    const c = Math.cos((a * Math.PI) / 180)
    const s = Math.sin((a * Math.PI) / 180)
    return line([cx + c * r0, cy + s * r0], [cx + c * r1, cy + s * r1])
  })
}

/**
 * Dense points along a smooth path through `pts`, each with the unit normal
 * pointing to the path's right-hand side: [x, y, nx, ny].
 */
function trace(pts) {
  const P = [pts[0], ...pts, pts.at(-1)]
  const out = []
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]]
    const n = Math.max(3, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 25))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(pts.at(-1))
  return out.map(([x, y], i) => {
    const [ax, ay] = out[Math.max(0, i - 1)]
    const [bx, by] = out[Math.min(out.length - 1, i + 1)]
    const len = Math.hypot(bx - ax, by - ay) || 1
    return [x, y, -(by - ay) / len, (bx - ax) / len]
  })
}

/** A small cloud: three round bumps on a flat bottom, `w` wide, sitting on (x, y). */
function puff(x, y, w) {
  const k = w / 220
  const pts = []
  for (const [cx, cy, r, a0, a1] of [
    [50, -35, 45, 160, 300],
    [115, -60, 55, 210, 330],
    [180, -35, 42, 240, 380],
  ]) {
    for (let i = 0; i <= 6; i++) {
      const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180
      pts.push([x + (cx + Math.cos(a) * r) * k, y + (cy + Math.sin(a) * r) * k])
    }
  }
  return line(...pts, [x + 225 * k, y], [x, y], pts[0])
}

/** A side-view car body facing right, shared by car and police car. */
function carBody() {
  return [
    line([185, 640], [110, 640], [110, 530], [150, 505], [290, 495], [360, 380], [610, 380], [700, 490], [860, 515], [895, 560], [895, 640], [815, 640]),
    arc(720, 640, 95, 95, 180, 360),
    arc(280, 640, 95, 95, 180, 360),
    line([375, 640], [625, 640]),
    ...wheel(280, 650, 75),
    ...wheel(720, 650, 75),
    shape([360, 400], [480, 400], [480, 485], [315, 485]),
    shape([500, 400], [600, 400], [670, 485], [500, 485]),
    line([490, 495], [490, 625]),
    line([520, 520], [555, 520]),
    ellipse(870, 545, 14, 12),
  ]
}

export default {
  bicycle: () => {
    const rw = [250, 640]
    const fw = [750, 640]
    const R = 170
    const crank = [470, 650]
    const seat = [420, 380]
    const head = [650, 390]
    return [
      circle(...rw, R),
      circle(...fw, R),
      ...[0, 60, 120].flatMap((a) => [spoke(rw, R - 8, a), spoke(fw, R - 8, a)]),
      line(rw, crank, seat, rw),
      line(seat, head, crank),
      line([640, 340], fw),
      line([640, 340], [625, 295]),
      curve([585, 300], [625, 295], [690, 280], [700, 310]),
      line(seat, [405, 330]),
      shape([345, 325], [455, 318], [440, 340], [360, 342]),
      circle(...crank, 30),
      line(crank, [510, 735]),
      line([480, 738], [545, 735]),
    ]
  },

  car: () => carBody(),

  bus: () => [
    line([165, 680], [90, 680], [90, 300], [130, 260], [870, 260], [910, 300], [910, 680], [765, 680]),
    arc(250, 680, 85, 85, 180, 360),
    arc(680, 680, 85, 85, 180, 360),
    line([335, 680], [595, 680]),
    ...wheel(250, 690, 68),
    ...wheel(680, 690, 68),
    ...[130, 235, 340, 445, 550, 655].map((x) => rect(x, 320, 90, 120)),
    rect(790, 320, 90, 300),
    line([835, 320], [835, 620]),
    line([90, 500], [780, 500]),
    ellipse(890, 640, 12, 14),
  ],

  truck: () => [
    rect(100, 250, 540, 400),
    line([640, 650], [640, 380], [780, 380], [880, 510], [895, 530], [895, 650], [855, 650]),
    shape([665, 405], [770, 405], [850, 505], [665, 505]),
    line([700, 540], [735, 540]),
    underside(100, 640, 650, [], 0),
    underside(640, 855, 650, [770], 85),
    line([100, 650], [140, 650]),
    ...wheel(230, 690, 68),
    ...wheel(400, 690, 68),
    ...wheel(770, 690, 68),
    ellipse(882, 560, 10, 14),
  ],

  train: () => [
    // cab
    rect(150, 320, 230, 310),
    line([120, 320], [410, 320]),
    rect(190, 370, 140, 110),
    // boiler
    rect(380, 430, 420, 200),
    line([520, 430], [520, 630]),
    line([660, 430], [660, 630]),
    arc(590, 430, 50, 40, 180, 360),
    // chimney and smoke
    shape([705, 430], [695, 340], [665, 305], [785, 305], [755, 340], [745, 430]),
    circle(700, 235, 45),
    circle(610, 175, 60),
    circle(490, 130, 70),
    // cowcatcher
    shape([800, 590], [890, 690], [800, 690]),
    // wheels
    line([150, 630], [800, 630]),
    ...wheel(265, 690, 62),
    ...wheel(480, 690, 62),
    ...wheel(630, 690, 62),
    circle(760, 710, 42),
    line([480, 700], [630, 700]),
    // track
    line([70, 755], [930, 755]),
    ...[110, 230, 350, 470, 590, 710, 830].map((x) => line([x, 755], [x - 20, 800])),
  ],

  'fire truck': () => [
    // body and cab
    line([175, 670], [90, 670], [90, 420], [650, 420], [650, 670]),
    line([650, 670], [650, 360], [790, 360], [880, 480], [900, 500], [900, 670], [870, 670]),
    shape([675, 385], [780, 385], [850, 475], [675, 475]),
    underside(175, 870, 670, [260, 520, 780], 85),
    ...wheel(260, 690, 68),
    ...wheel(520, 690, 68),
    ...wheel(780, 690, 68),
    // ladder on the roof
    line([80, 300], [700, 300]),
    line([80, 345], [700, 345]),
    ...[120, 180, 240, 300, 360, 420, 480, 540, 600, 660].map((x) => line([x, 300], [x, 345])),
    line([170, 345], [170, 420]),
    line([560, 345], [560, 420]),
    // siren light
    arc(760, 360, 32, 32, 180, 360),
    ...rays(760, 345, 50, 85, [-150, -90, -30]),
    // hose reel
    circle(270, 545, 75),
    curve([270, 545], [300, 530], [300, 575], [250, 585], [225, 530], [275, 495], [330, 520], [340, 575]),
    // locker
    rect(390, 470, 200, 140),
    line([390, 520], [590, 520]),
    line([390, 565], [590, 565]),
    ellipse(890, 560, 10, 14),
  ],

  ambulance: () => [
    line([165, 660], [100, 660], [100, 300], [640, 300], [640, 660]),
    line([640, 410], [760, 410], [870, 520], [890, 540], [890, 660], [855, 660]),
    shape([665, 430], [750, 430], [835, 520], [665, 520]),
    underside(165, 855, 660, [250, 770], 85),
    ...wheel(250, 680, 68),
    ...wheel(770, 680, 68),
    // red cross
    shape([330, 360], [410, 360], [410, 430], [480, 430], [480, 510], [410, 510], [410, 580], [330, 580], [330, 510], [260, 510], [260, 430], [330, 430]),
    // siren light
    line([530, 300], [630, 300]),
    arc(580, 300, 38, 34, 180, 360),
    ...rays(580, 282, 55, 95, [-160, -120, -90, -60, -20]),
    line([560, 340], [560, 640]),
    ellipse(878, 570, 10, 14),
  ],

  'police car': () => [
    ...carBody(),
    // light bar on the roof
    line([400, 380], [400, 355], [580, 355], [580, 380]),
    arc(445, 355, 38, 32, 180, 360),
    arc(535, 355, 38, 32, 180, 360),
    ...rays(445, 330, 50, 90, [-170, -130, -95]),
    ...rays(535, 330, 50, 90, [-85, -50, -10]),
    // badge on the door
    star(595, 560, 48, 22),
  ],

  'race car': () => [
    // rear wing on two struts
    shape([90, 320], [320, 320], [320, 380], [90, 380]),
    line([90, 290], [90, 420]),
    line([190, 380], [205, 530]),
    line([240, 380], [255, 525]),
    // body: engine cover, cockpit, long nose
    line([160, 650], [160, 560], [330, 520], [430, 440], [470, 490]),
    line([470, 490], [600, 495], [700, 545]),
    line([865, 600], [940, 620], [940, 660], [880, 660]),
    line([375, 660], [690, 660]),
    line([380, 585], [680, 585]),
    // driver's helmet
    arc(535, 470, 48, 48, 180, 360),
    line([487, 470], [583, 470]),
    line([535, 445], [583, 455]),
    // front wing
    line([850, 685], [965, 685]),
    // big bare wheels
    ...wheel(270, 650, 105),
    ...wheel(785, 655, 92),
    // speed lines
    line([10, 560], [100, 560]),
    line([0, 620], [90, 620]),
    line([20, 680], [110, 680]),
  ],

  tractor: () => [
    // big back wheel with tread lugs
    circle(320, 650, 200),
    circle(320, 650, 85),
    dot(320, 650, 18),
    ...Array.from({ length: 16 }, (_, i) => {
      const a = (i * 22.5 * Math.PI) / 180
      return line([320 + Math.cos(a) * 200, 650 + Math.sin(a) * 200], [320 + Math.cos(a) * 228, 650 + Math.sin(a) * 228])
    }),
    // small front wheel
    circle(790, 740, 110),
    circle(790, 740, 42),
    // engine hood
    line([520, 470], [860, 470], [890, 500], [890, 610], [520, 610]),
    ...[810, 845].map((x) => line([x, 490], [x, 590])),
    // exhaust with a puff
    line([720, 470], [720, 330]),
    line([705, 330], [735, 325]),
    circle(745, 270, 28),
    // cab
    line([210, 430], [230, 160], [560, 160], [540, 470]),
    line([190, 160], [580, 160]),
    line([520, 470], [540, 470]),
    shape([265, 200], [510, 200], [500, 400], [255, 400]),
    arc(320, 650, 225, 225, 205, 335),
  ],

  bulldozer: () => [
    // crawler track
    rrect(130, 640, 580, 190, 92),
    circle(220, 735, 58),
    circle(620, 735, 58),
    circle(355, 770, 34),
    circle(485, 770, 34),
    ...[260, 340, 420, 500, 580].map((x) => line([x, 640], [x, 660])),
    // body and cab
    line([170, 640], [170, 480], [660, 480], [690, 520], [690, 640]),
    shape([220, 480], [240, 250], [470, 250], [490, 480]),
    shape([265, 280], [445, 280], [455, 400], [260, 400]),
    line([590, 480], [590, 380]),
    line([575, 380], [605, 375]),
    // arms and blade
    line([690, 545], [790, 545]),
    line([660, 720], [790, 760]),
    curve([840, 440], [800, 560], [795, 680], [820, 790], [880, 855]),
    line([840, 440], [770, 450], [770, 855], [880, 855]),
  ],

  excavator: () => [
    // crawler track
    rrect(110, 720, 520, 150, 75),
    circle(185, 795, 48),
    circle(555, 795, 48),
    circle(310, 810, 30),
    circle(430, 810, 30),
    // body and cab
    line([140, 720], [140, 590], [180, 560], [600, 560], [600, 720]),
    shape([380, 560], [390, 330], [530, 330], [580, 560]),
    shape([410, 360], [515, 360], [545, 460], [405, 460]),
    // boom
    line([500, 580], [680, 240]),
    line([560, 600], [750, 260]),
    circle(720, 235, 28),
    // stick
    line([700, 260], [810, 560]),
    line([745, 250], [855, 545]),
    // bucket with teeth
    curve([830, 555], [915, 585], [950, 670], [905, 750]),
    line([905, 750], [885, 795], [860, 752], [835, 795], [810, 750], [785, 790], [765, 740]),
    curve([765, 740], [775, 640], [830, 555]),
    // ram
    line([560, 520], [650, 360]),
  ],

  motorcycle: () => [
    // chunky tyres
    ...[220, 780].flatMap((x) => [circle(x, 680, 145), circle(x, 680, 108), circle(x, 680, 32)]),
    arc(780, 680, 170, 170, 215, 320),
    arc(220, 680, 170, 170, 220, 290),
    // front fork, headlight and handlebar
    line([770, 680], [690, 420]),
    line([800, 672], [720, 415]),
    ellipse(765, 440, 30, 42),
    line([705, 410], [655, 330], [575, 322]),
    // fuel tank, seat and tail
    curve([430, 480], [480, 405], [620, 390], [700, 435], [690, 500], [430, 500], [430, 480]),
    curve([430, 455], [330, 430], [200, 440], [130, 470]),
    line([130, 470], [180, 505], [430, 505]),
    // engine block
    rrect(425, 525, 200, 135, 25),
    line([445, 570], [605, 570]),
    line([445, 615], [605, 615]),
    line([220, 680], [425, 610]),
    // exhaust pipe sweeping back
    line([470, 665], [330, 670], [140, 610]),
    line([470, 695], [330, 700], [140, 640]),
    ellipse(132, 625, 12, 20),
  ],

  scooter: () => [
    // deck and wheels
    rrect(200, 715, 520, 45, 22),
    circle(240, 815, 55),
    circle(240, 815, 15),
    arc(240, 815, 72, 72, 195, 300),
    circle(805, 815, 55),
    circle(805, 815, 15),
    line([720, 735], [775, 700]),
    // tall handle stem and T bar
    line([795, 815], [690, 205]),
    line([822, 808], [717, 200]),
    line([600, 200], [800, 190]),
    shape([590, 185], [640, 182], [642, 212], [592, 215]),
    shape([760, 178], [810, 176], [812, 206], [762, 208]),
  ],

  unicycle: () => [
    // one wheel on the ground
    circle(500, 700, 180),
    circle(500, 700, 150),
    dot(500, 700, 16),
    ...[30, 90, 150].map((a) => spoke([500, 700], 145, a)),
    line([230, 885], [770, 885]),
    // fork, seat post and saddle
    line([450, 470], [550, 470]),
    line([450, 470], [492, 700]),
    line([550, 470], [508, 700]),
    line([500, 470], [500, 270]),
    curve([380, 270], [420, 225], [580, 220], [640, 245], [600, 290], [400, 292], [380, 270]),
    // pedals on cranks
    line([500, 700], [395, 800]),
    shape([345, 790], [445, 790], [445, 818], [345, 818]),
    line([500, 700], [605, 600]),
    shape([555, 586], [655, 586], [655, 614], [555, 614]),
  ],

  skateboard: () => [
    // deck with kicked-up nose and tail
    curve([90, 410], [150, 470], [260, 480], [740, 480], [850, 470], [910, 410]),
    curve([100, 440], [160, 505], [260, 512], [740, 512], [840, 505], [900, 440]),
    line([90, 410], [100, 440]),
    line([910, 410], [900, 440]),
    // trucks and wheels
    shape([225, 512], [305, 512], [290, 550], [240, 550]),
    shape([695, 512], [775, 512], [760, 550], [710, 550]),
    circle(265, 595, 50),
    circle(735, 595, 50),
    dot(265, 595, 10),
    dot(735, 595, 10),
  ],

  sled: () => {
    const runner = (dx, dy) =>
      curve(...[[120, 760], [450, 762], [700, 760], [820, 740], [885, 650], [870, 545], [800, 525], [780, 585], [830, 605]].map(([x, y]) => [x + dx, y + dy]))
    return [
      // two runners curling right up at the front
      runner(0, 0),
      runner(70, -85),
      // thin slatted seat on short struts
      shape([170, 690], [700, 690], [770, 605], [240, 605]),
      line([205, 648], [735, 648]),
      ...[220, 450, 660].map((x) => line([x, 760], [x, 690])),
      ...[290, 520, 730].map((x) => line([x, 675], [x, 605])),
      // pull rope
      curve([830, 600], [920, 560], [960, 640], [920, 720]),
    ]
  },

  'shopping cart': () => [
    // wire basket
    shape([250, 300], [860, 300], [770, 600], [330, 600]),
    ...[1, 2, 3, 4, 5].map((i) => line([250 + (610 * i) / 6, 300], [330 + (440 * i) / 6, 600])),
    ...[400, 500].map((y) => line([250 + (80 * (y - 300)) / 300, y], [860 - (90 * (y - 300)) / 300, y])),
    // handle
    line([250, 300], [150, 215]),
    rotate(ellipse(140, 205, 45, 18), 40, 140, 205),
    // chassis and wheels
    line([330, 600], [320, 720]),
    line([770, 600], [740, 720]),
    line([280, 720], [790, 720]),
    line([300, 600], [280, 720]),
    circle(320, 770, 42),
    circle(740, 770, 42),
  ],

  airplane: () => [
    // fuselage
    line([110, 425], [760, 430]),
    curve([760, 430], [860, 445], [915, 495], [880, 548], [800, 560]),
    line([800, 560], [330, 560], [110, 445]),
    line([110, 425], [110, 445]),
    // tail fin and stabiliser
    line([260, 428], [160, 230], [105, 230], [130, 427]),
    shape([190, 475], [70, 520], [100, 535], [245, 500]),
    // wings
    shape([540, 560], [650, 560], [430, 800], [355, 800]),
    shape([560, 430], [625, 430], [480, 330], [440, 330]),
    // windows
    ...[310, 370, 430, 490, 550, 610, 670].map((x) => circle(x, 478, 13)),
    shape([815, 455], [868, 468], [890, 495], [830, 495]),
  ],

  helicopter: () => [
    // cabin and tail boom in one outline
    curve([90, 500], [330, 505], [420, 440], [560, 425], [690, 460], [750, 550], [700, 640], [520, 660], [380, 630], [320, 560], [90, 525]),
    line([90, 500], [90, 525]),
    curve([580, 440], [670, 470], [725, 550], [590, 555], [580, 440]),
    // tail fin and rotor
    line([110, 500], [70, 430]),
    circle(95, 512, 40),
    line([60, 477], [130, 547]),
    line([130, 477], [60, 547]),
    // main rotor
    line([540, 425], [540, 365]),
    rect(515, 350, 50, 18),
    shape([150, 355], [515, 350], [515, 368], [150, 368]),
    shape([565, 350], [930, 355], [930, 368], [565, 368]),
    // skids
    line([440, 650], [420, 765]),
    line([640, 648], [660, 765]),
    curve([320, 765], [540, 768], [760, 765], [810, 750], [830, 715]),
  ],

  'paper plane': () => [
    // folded wings and keel
    shape([900, 300], [110, 200], [430, 470]),
    shape([900, 300], [430, 470], [360, 700]),
    line([430, 470], [200, 540], [900, 300]),
    // dashed flight trail looping behind
    ...[
      [[90, 260], [40, 330]],
      [[25, 400], [40, 470]],
      [[75, 530], [140, 570]],
      [[200, 600], [270, 620]],
    ].map(([a, b]) => line(a, b)),
  ],

  'hot air balloon': () => [
    // envelope with gores
    curve([440, 655], [380, 615], [255, 470], [210, 300], [290, 140], [500, 85], [710, 140], [790, 300], [745, 470], [620, 615], [560, 655]),
    line([440, 655], [560, 655]),
    line([500, 90], [500, 655]),
    curve([500, 90], [360, 220], [360, 470], [465, 655]),
    curve([500, 90], [640, 220], [640, 470], [535, 655]),
    // ropes and wicker basket
    line([445, 660], [430, 780]),
    line([555, 660], [570, 780]),
    shape([415, 780], [585, 780], [570, 900], [430, 900]),
    line([420, 820], [580, 820]),
    line([425, 860], [575, 860]),
    line([470, 780], [475, 900]),
    line([530, 780], [525, 900]),
  ],

  parachute: () => {
    const pts = [100, 260, 420, 580, 740, 900]
    return [
      // canopy with scalloped hem
      arc(500, 420, 400, 300, 180, 360),
      ...[180, 340, 500, 660, 820].map((x) => arc(x, 420, 80, 40, 0, 180)),
      ...[260, 420, 580, 740].map((x) => curve([500, 125], [500 + (x - 500) * 0.55, 230], [x, 420])),
      // cords down to a little person
      ...pts.map((x) => line([x, 420], x < 500 ? [462, 712] : [538, 712])),
      circle(500, 735, 30),
      line([500, 765], [500, 860]),
      line([500, 785], [462, 712]),
      line([500, 785], [538, 712]),
      line([500, 860], [465, 945]),
      line([500, 860], [535, 945]),
    ]
  },

  blimp: () => [
    ellipse(520, 400, 390, 150),
    // tail fins
    line([250, 285], [150, 175], [95, 185], [150, 315]),
    line([250, 515], [150, 625], [95, 615], [150, 485]),
    shape([170, 390], [70, 375], [70, 425], [170, 410]),
    // gondola hanging underneath, propeller at the back
    line([450, 548], [455, 590]),
    line([610, 548], [605, 590]),
    rrect(410, 590, 240, 85, 32),
    ...[450, 510, 570].map((x) => rect(x, 608, 38, 34)),
    line([410, 632], [375, 632]),
    ellipse(368, 632, 9, 38),
    // clouds in the sky
    puff(690, 830, 230),
    puff(40, 800, 200),
  ],

  sailboat: () => [
    shape([140, 660], [860, 660], [760, 790], [250, 790]),
    line([480, 660], [480, 110]),
    // mainsail and jib
    line([505, 130], [505, 630], [820, 630]),
    curve([505, 130], [690, 330], [820, 630]),
    line([455, 180], [455, 630], [200, 630]),
    curve([455, 180], [300, 380], [200, 630]),
    // pennant
    shape([480, 110], [565, 128], [480, 148]),
    wave(70, 850, 930, 850, 5, 14),
  ],

  canoe: () => [
    // hull, seen a little from above
    curve([80, 420], [200, 470], [500, 500], [800, 470], [920, 420]),
    curve([80, 420], [180, 540], [500, 600], [820, 540], [920, 420]),
    curve([80, 420], [300, 405], [500, 400], [700, 405], [920, 420]),
    line([300, 412], [295, 482]),
    line([700, 412], [705, 482]),
    // paddle dipping in
    line([660, 140], [480, 560]),
    line([620, 125], [690, 150]),
    rotate(ellipse(450, 640, 38, 95), 23, 450, 640),
    // water
    wave(60, 640, 360, 640, 2, 10),
    wave(560, 640, 940, 640, 3, 10),
  ],

  'cable car': () => [
    // two cables
    line([30, 190], [970, 110]),
    line([30, 140], [970, 60]),
    // trolley and hanger arm
    circle(455, 150, 20),
    circle(545, 142, 20),
    shape([420, 170], [580, 160], [570, 205], [430, 212]),
    line([500, 210], [500, 340]),
    // cabin
    rrect(310, 340, 380, 360, 40),
    line([310, 400], [690, 400]),
    rect(345, 430, 140, 160),
    rect(515, 430, 140, 160),
    line([310, 630], [690, 630]),
  ],

  'roller coaster': () => {
    const path = trace([
      [20, 830], [100, 720], [180, 460], [250, 320], [330, 295], [410, 320], [470, 440], [530, 700], [610, 770],
      [720, 750], [860, 680], [900, 560], [850, 430], [720, 385], [590, 430], [545, 560],
      [590, 690], [740, 765], [880, 795], [985, 795],
    ])
    const half = path.slice(0, Math.round(path.length * 0.4))
    const crest = half.indexOf(half.reduce((a, b) => (b[1] < a[1] ? b : a)))
    const off = path.map(([x, y, nx, ny]) => [x + nx * 30, y + ny * 30])
    const ties = []
    for (let k = 3; k < path.length - 1; k += 4) ties.push(line(path[k], off[k]))
    const cart = (k) => {
      const [x, y, nx, ny] = path[k]
      const deg = (Math.atan2(-nx, ny) * 180) / Math.PI
      return [rotate(rect(x - 32, y - 52, 64, 42), deg, x, y), rotate(circle(x, y - 76, 17), deg, x, y)]
    }
    return [
      curve(...path),
      curve(...off),
      ...ties,
      // supports
      ...[0.06, 0.1, 0.15, 0.25, 0.3].map((t) => {
        const k = Math.round(t * (path.length - 1))
        return line(off[k], [off[k][0], 900])
      }),
      line([720, 795], [720, 900]),
      line([10, 900], [990, 900]),
      // a train of cars full of riders cresting the hill
      ...[crest - 3, crest, crest + 3].map(cart),
    ]
  },

  'traffic light': () => [
    // tall street pole with an arm reaching over the road
    line([180, 950], [180, 140]),
    line([215, 950], [215, 175]),
    curve([180, 140], [300, 110], [640, 110]),
    curve([215, 175], [320, 145], [640, 145]),
    line([640, 110], [640, 145]),
    line([120, 950], [275, 950]),
    // the light hanging from it: three lamps under hoods
    line([560, 145], [560, 190]),
    rrect(450, 190, 220, 560, 40),
    ...[300, 470, 640].flatMap((y) => [circle(560, y, 62), arc(560, y, 82, 78, 195, 345)]),
  ],

  'steering wheel': () => [
    // thick padded rim
    circle(500, 470, 380),
    circle(500, 470, 300),
    // wide airbag hub with three broad spokes
    rrect(370, 420, 260, 170, 60),
    circle(500, 505, 28),
    line([205, 430], [370, 450]),
    line([210, 560], [370, 555]),
    line([795, 430], [630, 450]),
    line([790, 560], [630, 555]),
    line([440, 590], [420, 760]),
    line([560, 590], [580, 760]),
    // steering column below
    line([455, 850], [445, 990]),
    line([545, 850], [555, 990]),
  ],
}
