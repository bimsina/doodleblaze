import { arc, blob, circle, curve, dot, ellipse, line, rect, rotate, shape, wave, zigzag } from './kit.mjs'

// Local helpers.
/** Joins several strokes into one continuous stroke, like a pen that never lifts. */
const path = (...parts) => ({ e: false, p: parts.flatMap((s) => s.p) })
/** A rectangle with rounded corners. */
const rounded = (x, y, w, h, r) =>
  path(
    line([x + r, y], [x + w - r, y]),
    arc(x + w - r, y + r, r, r, 270, 360),
    line([x + w, y + r], [x + w, y + h - r]),
    arc(x + w - r, y + h - r, r, r, 0, 90),
    line([x + w - r, y + h], [x + r, y + h]),
    arc(x + r, y + h - r, r, r, 90, 180),
    line([x, y + h - r], [x, y + r]),
    arc(x + r, y + r, r, r, 180, 270),
  )

export default {
  hammer: () =>
    rotate(
      [
        // thick handle with a rubber grip
        line([462, 360], [458, 640]),
        line([538, 360], [542, 640]),
        rounded(445, 640, 110, 280, 40),
        ...[700, 760, 820].map((y) => line([450, y], [550, y])),
        // heavy block head: round striking face on the left, split claw on the right
        rect(430, 200, 140, 160),
        rect(300, 220, 130, 120),
        ellipse(290, 280, 30, 85),
        curve([570, 215], [680, 230], [760, 262]),
        curve([570, 342], [680, 325], [760, 302]),
        line([760, 262], [712, 282], [760, 302]),
      ],
      -35,
    ),

  saw: () => [
    // blade with teeth along the bottom
    line([660, 300], [130, 450]),
    line([130, 450], [125, 570]),
    zigzag(125, 570, 660, 570, 16, 14),
    // closed handle with a hand hole
    curve([660, 270], [790, 240], [880, 300], [900, 450], [880, 610], [760, 640], [650, 610]),
    line([660, 270], [650, 610]),
    curve([720, 360], [800, 340], [830, 420], [820, 530], [740, 550], [715, 450], [720, 360]),
    dot(620, 360, 10),
    dot(620, 520, 10),
  ],

  screwdriver: () => [
    // upright: smooth bulb handle, metal collar, long shaft, flat tip that flares out
    curve([420, 400], [395, 250], [410, 120], [500, 75], [590, 120], [605, 250], [580, 400], [420, 400]),
    rect(450, 400, 100, 55),
    line([480, 455], [480, 800]),
    line([520, 455], [520, 800]),
    shape([480, 800], [455, 900], [545, 900], [520, 800]),
    line([500, 840], [500, 895]),
  ],

  wrench: () =>
    rotate(
      [
        // open jaw on the right
        path(
          curve([690, 470], [730, 410], [790, 385], [860, 400], [905, 445]),
          line([905, 445], [810, 460], [800, 500], [810, 540], [905, 555]),
          curve([905, 555], [860, 600], [790, 615], [730, 590], [690, 530]),
        ),
        // handle
        line([300, 470], [690, 470]),
        line([300, 530], [690, 530]),
        // closed ring on the left with a six-sided hole
        curve([300, 470], [270, 400], [190, 390], [120, 440], [110, 520], [160, 595], [250, 600], [300, 530]),
        shape(
          ...Array.from({ length: 6 }, (_, i) => [
            200 + Math.cos(((i * 60 + 30) * Math.PI) / 180) * 52,
            498 + Math.sin(((i * 60 + 30) * Math.PI) / 180) * 52,
          ]),
        ),
      ],
      -30,
    ),

  drill: () => [
    // body
    path(curve([650, 250], [400, 245], [280, 255], [225, 330], [260, 420], [380, 430]), line([380, 430], [650, 430], [650, 250])),
    ...[280, 310].map((x) => line([x, 300], [x, 380])),
    // chuck and twisted bit
    rect(650, 280, 70, 120),
    ...[670, 690].map((x) => line([x, 280], [x, 400])),
    shape([720, 320], [880, 330], [910, 340], [880, 350], [720, 360]),
    ...[750, 790, 830, 870].map((x) => line([x, 322], [x + 20, 358])),
    // pistol grip, trigger and battery
    line([390, 430], [350, 700]),
    line([500, 430], [470, 700]),
    curve([500, 460], [540, 470], [535, 520], [495, 520]),
    rounded(260, 700, 300, 110, 25),
    line([260, 740], [560, 740]),
  ],

  chainsaw: () => [
    // engine body and the big loop handle on top
    rounded(170, 400, 310, 300, 50),
    curve([210, 400], [220, 280], [320, 230], [430, 260], [470, 400]),
    curve([270, 400], [280, 320], [330, 295], [400, 310], [420, 400]),
    // rear handle with its trigger hole
    curve([170, 470], [70, 470], [50, 560], [70, 650], [170, 660]),
    curve([170, 520], [110, 525], [105, 565], [115, 610], [170, 610]),
    // the long bar with the chain all round it
    path(line([480, 490], [870, 490]), arc(870, 550, 60, 60, 270, 450), line([870, 610], [480, 610])),
    zigzag(490, 476, 870, 476, 12, 10),
    zigzag(490, 624, 870, 624, 12, 10),
    line([500, 550], [860, 550]),
    curve([250, 480], [320, 470], [400, 480]),
  ],

  axe: () =>
    rotate(
      [
        // long wooden handle
        curve([480, 330], [475, 600], [468, 920]),
        curve([532, 330], [530, 600], [528, 920]),
        curve([468, 920], [458, 955], [500, 965], [540, 955], [528, 920]),
        // big wedge head: wide curved blade on the left, short poll on the right
        rect(470, 165, 75, 165),
        curve([470, 185], [380, 190], [300, 150], [225, 95]),
        curve([225, 95], [150, 250], [150, 330], [225, 470]),
        curve([225, 470], [300, 400], [380, 330], [470, 310]),
        curve([255, 150], [195, 260], [200, 340], [255, 420]),
        rect(545, 190, 50, 115),
      ],
      28,
    ),

  pliers: () => [
    // short blunt jaws with gripping teeth
    curve([458, 420], [440, 330], [448, 250], [475, 200], [525, 200], [552, 250], [560, 330], [542, 420]),
    zigzag(500, 205, 500, 335, 6, 10),
    ellipse(500, 372, 16, 24),
    // pivot
    circle(500, 430, 38),
    dot(500, 430, 8),
    // two long handles, slightly open, with rubber grips
    curve([468, 462], [450, 520], [440, 570]),
    curve([532, 462], [550, 520], [560, 570]),
    curve([500, 468], [480, 520], [470, 570]),
    curve([500, 468], [520, 520], [530, 570]),
    blob([430, 565], [478, 570], [462, 750], [430, 905], [390, 920], [370, 890], [400, 740]),
    blob([570, 565], [522, 570], [538, 750], [570, 905], [610, 920], [630, 890], [600, 740]),
  ],

  nail: () =>
    rotate(
      [
        // small flat head, long shank with grip rings, sharp point
        rounded(415, 95, 170, 45, 16),
        line([475, 140], [475, 800]),
        line([525, 140], [525, 800]),
        line([475, 800], [500, 930], [525, 800]),
        ...[180, 210, 240].map((y) => line([475, y], [525, y])),
      ],
      12,
    ),

  screw: () => [
    // round head with the slot cut in it
    line([340, 230], [660, 230]),
    arc(500, 230, 160, 120, 180, 245),
    arc(500, 230, 160, 120, 295, 360),
    shape([470, 125], [470, 175], [530, 175], [530, 125]),
    // threaded shank: thread teeth sticking out both sides, tapering to a point
    zigzag(430, 240, 430, 720, 8, 22),
    zigzag(570, 240, 570, 720, 8, 22),
    line([430, 720], [500, 920], [570, 720]),
    ...Array.from({ length: 8 }, (_, i) => 270 + i * 60).map((y) => line([425, y + 25], [575, y - 5])),
    line([445, 770], [555, 745]),
    line([465, 830], [535, 810]),
  ],

  toolbox: () => [
    // open tote: box, end posts and a carry bar
    rect(150, 560, 700, 320),
    line([150, 630], [850, 630]),
    shape([150, 560], [195, 340], [255, 340], [295, 560]),
    shape([850, 560], [805, 340], [745, 340], [705, 560]),
    line([250, 340], [750, 340]),
    line([250, 372], [750, 372]),
    // tools sticking well out of it: screwdriver, wrench, hammer
    rotate([rounded(300, 230, 70, 200, 30), ...[322, 348].map((x) => line([x, 260], [x, 400])), line([335, 430], [335, 560])], -12, 335, 560),
    rotate(
      [
        line([455, 560], [455, 300]),
        line([490, 560], [490, 300]),
        path(curve([455, 300], [415, 265], [420, 205], [445, 180]), line([445, 180], [458, 235], [487, 235], [500, 180])),
        curve([500, 180], [525, 205], [530, 265], [490, 300]),
      ],
      6,
      472,
      560,
    ),
    rotate([line([620, 560], [620, 270]), line([658, 560], [658, 270]), rect(550, 210, 190, 60), line([740, 225], [790, 255], [740, 260])], 12, 640, 560),
  ],

  'tape measure': () => [
    // chunky case with a lock button and a screw in the middle
    rounded(110, 250, 440, 440, 100),
    rect(290, 215, 100, 35),
    circle(330, 470, 40),
    dot(330, 470, 10),
    // a long run of tape pulled out, with tick marks and the hook at the end
    line([510, 610], [960, 610]),
    line([510, 680], [960, 680]),
    line([960, 585], [960, 700], [985, 700]),
    ...Array.from({ length: 16 }, (_, i) => 580 + i * 24).map((x, i) => line([x, 610], [x, i % 2 ? 628 : 648])),
  ],

  paintbrush: () => [
    rotate(
      [
        // handle with a hanging hole, metal band, flat bristles dipped in paint
        curve([470, 470], [455, 300], [468, 140], [500, 90], [532, 140], [545, 300], [530, 470]),
        circle(500, 150, 16),
        rect(410, 470, 180, 150),
        line([410, 510], [590, 510]),
        line([410, 545], [590, 545]),
        curve([410, 620], [400, 760], [410, 850], [470, 880], [530, 880], [590, 850], [600, 760], [590, 620]),
        ...[450, 500, 550].map((x) => line([x, 640], [x, 740])),
        curve([404, 770], [440, 750], [470, 790], [500, 760], [535, 800], [565, 760], [598, 775]),
      ],
      -25,
    ),
    // paint dripping off the tip
    curve([640, 860], [630, 900], [615, 925], [632, 950], [650, 925], [642, 900], [640, 860]),
    curve([560, 900], [552, 935], [540, 955], [556, 975], [572, 955], [565, 935], [560, 900]),
  ],

  'paint roller': () =>
    rotate(
      [
        // the stripe of fresh paint it has just rolled on
        line([250, 300], [250, 80]),
        line([750, 300], [750, 80]),
        wave(250, 80, 750, 80, 3, 14),
        // the fat fuzzy roller
        line([250, 300], [750, 300]),
        line([250, 440], [750, 440]),
        ellipse(250, 370, 35, 70),
        arc(750, 370, 35, 70, 270, 450),
        ...[
          [340, 340],
          [420, 400],
          [500, 345],
          [580, 405],
          [660, 350],
          [380, 410],
          [620, 395],
        ].map(([x, y]) => curve([x, y], [x + 12, y - 8], [x + 24, y])),
        // bent wire frame down to the handle
        line([785, 370], [850, 370], [850, 540], [500, 560], [500, 620]),
        rounded(455, 620, 90, 300, 40),
        line([455, 680], [545, 680]),
      ],
      -25,
    ),

  shovel: () => [
    // D-grip handle
    curve([485, 260], [420, 190], [420, 100], [500, 85], [580, 100], [580, 190], [515, 260]),
    curve([470, 190], [470, 140], [530, 140], [530, 190], [500, 215], [470, 190]),
    line([485, 260], [485, 500]),
    line([515, 260], [515, 500]),
    // socket and pointed blade with a centre ridge
    shape([470, 500], [530, 500], [560, 580], [440, 580]),
    curve([360, 580], [345, 720], [400, 850], [500, 940]),
    curve([640, 580], [655, 720], [600, 850], [500, 940]),
    line([360, 580], [640, 580]),
    line([500, 600], [500, 820]),
  ],

  rake: () => [
    // long handle
    line([485, 60], [485, 650]),
    line([515, 60], [515, 650]),
    // bracket, head bar and a row of long teeth
    shape([475, 650], [525, 650], [560, 700], [440, 700]),
    rect(190, 700, 620, 40),
    ...Array.from({ length: 12 }, (_, i) => 215 + i * 52).map((x) => line([x, 740], [x - 8, 880])),
  ],

  broom: () => [
    // long handle
    line([480, 60], [480, 520]),
    line([520, 60], [520, 520]),
    // bound bristles flaring out to a straight bottom edge
    rect(455, 520, 90, 40),
    curve([455, 560], [400, 680], [330, 800], [250, 920]),
    curve([545, 560], [600, 680], [670, 800], [750, 920]),
    zigzag(250, 925, 750, 925, 14, 8),
    curve([420, 640], [500, 655], [580, 640]),
    curve([390, 700], [500, 718], [610, 700]),
    ...[
      [460, 720, 380, 900],
      [500, 720, 500, 905],
      [540, 720, 620, 900],
      [420, 720, 300, 890],
      [580, 720, 700, 890],
    ].map(([a, b, c, d]) => line([a, b], [c, d])),
  ],

  mop: () => [
    // handle and clamp
    line([485, 60], [485, 500]),
    line([515, 60], [515, 500]),
    rounded(410, 500, 180, 70, 20),
    // floppy wavy strings
    ...[
      [430, 260],
      [455, 340],
      [480, 420],
      [500, 500],
      [520, 580],
      [545, 660],
      [570, 740],
    ].map(([x0, x1], i) => wave(x0, 570, x1, 880 + (i % 2) * 30, 2, 18)),
  ],

  wheelbarrow: () => [
    // the tub
    shape([170, 360], [830, 360], [700, 600], [330, 600]),
    line([185, 395], [810, 395]),
    // wheel at the front
    circle(720, 740, 110),
    circle(720, 740, 22),
    line([640, 600], [720, 740]),
    // frame running back into the handles, and the leg
    line([720, 740], [380, 620], [90, 470]),
    rotate(rounded(40, 450, 110, 40, 18), 28, 95, 470),
    line([400, 625], [380, 860]),
    line([340, 860], [420, 860]),
  ],

  'hard hat': () => [
    // tall dome with a raised ridge up the middle and ribs on the sides
    arc(500, 600, 300, 340, 180, 360),
    curve([465, 620], [455, 430], [478, 268]),
    curve([535, 620], [545, 430], [522, 268]),
    curve([335, 605], [325, 460], [375, 350]),
    curve([665, 605], [675, 460], [625, 350]),
    // wide brim that curves out towards you at the front
    curve([110, 585], [300, 620], [500, 635], [700, 620], [890, 585]),
    curve([110, 585], [100, 612], [300, 668], [500, 690], [700, 668], [900, 612], [890, 585]),
  ],

  'traffic cone': () => {
    const at = (y) => [300 + (150 * (820 - y)) / 700, 700 - (150 * (820 - y)) / 700]
    const band = (y) => curve([at(y)[0], y], [500, y + 18], [at(y)[1], y])
    return [
      line([300, 820], [450, 120]),
      line([700, 820], [550, 120]),
      ellipse(500, 120, 50, 14),
      band(320),
      band(400),
      band(540),
      band(620),
      // chunky square base it stands in
      shape([150, 790], [850, 790], [950, 870], [50, 870]),
      line([50, 870], [50, 925], [950, 925], [950, 870]),
    ]
  },

  'fire hydrant': () => [
    // domed cap with a nut on top
    arc(500, 300, 160, 130, 180, 360),
    rect(465, 140, 70, 35),
    rect(310, 300, 380, 50),
    // body with two side nozzles and the big front cap
    line([350, 350], [350, 790]),
    line([650, 350], [650, 790]),
    rect(270, 470, 80, 100),
    rect(240, 450, 30, 140),
    rect(650, 470, 80, 100),
    rect(730, 450, 30, 140),
    circle(500, 530, 70),
    circle(500, 530, 25),
    // bolted flange and base
    rect(310, 790, 380, 50),
    ...[350, 430, 570, 650].map((x) => dot(x, 815, 8)),
    rect(280, 840, 440, 50),
  ],

  'fire extinguisher': () => [
    // tank
    path(arc(520, 440, 140, 90, 180, 360), line([660, 440], [660, 910], [380, 910], [380, 440])),
    line([380, 860], [660, 860]),
    // neck, valve head and the squeeze handle
    rect(490, 300, 60, 60),
    rect(455, 250, 140, 50),
    shape([470, 250], [740, 195], [750, 215], [600, 262]),
    rect(595, 275, 145, 24),
    // pressure gauge
    circle(625, 395, 32),
    line([625, 395], [642, 375]),
    // thick hose swinging out to a flared nozzle
    curve([460, 270], [360, 270], [270, 350], [240, 480], [255, 600]),
    curve([460, 300], [380, 300], [305, 370], [280, 480], [295, 600]),
    shape([255, 600], [295, 600], [320, 700], [220, 700]),
  ],

  flashlight: () =>
    rotate(
      [
        // body with a switch and grip rings
        path(line([450, 430], [170, 430]), arc(170, 500, 50, 70, 270, 90), line([170, 570], [450, 570])),
        rect(270, 405, 60, 25),
        ...[200, 230].map((x) => line([x, 435], [x, 565])),
        // flared head and lens
        line([450, 430], [580, 370]),
        line([450, 570], [580, 630]),
        ellipse(580, 500, 35, 130),
        // a cone of light
        line([610, 380], [950, 220]),
        line([610, 620], [950, 780]),
        line([650, 450], [800, 420]),
        line([660, 500], [820, 500]),
        line([650, 550], [800, 580]),
      ],
      -12,
    ),

  'magnifying glass': () => [
    // thick rim, glint, chunky handle
    circle(380, 380, 220),
    circle(380, 380, 185),
    arc(380, 380, 140, 140, 195, 255),
    rotate([rect(600, 350, 60, 60), rounded(660, 340, 300, 80, 35)], 45, 380, 380),
  ],

  microscope: () => [
    // horseshoe base, curved arm with focus knobs
    rounded(220, 860, 520, 60, 25),
    curve([650, 860], [705, 720], [725, 560], [690, 410], [610, 310], [505, 292]),
    curve([570, 860], [620, 720], [640, 570], [610, 455], [540, 385]),
    circle(700, 580, 45),
    circle(700, 580, 18),
    // stage with clips and a slide, a little mirror underneath
    rect(310, 600, 340, 30),
    rect(410, 586, 130, 14),
    line([350, 600], [400, 585]),
    line([600, 600], [550, 585]),
    ellipse(480, 735, 50, 18),
    line([480, 630], [480, 717]),
    // turret of lenses pointing down at the slide
    shape([420, 410], [570, 410], [550, 460], [440, 460]),
    rotate(rect(440, 460, 30, 70), 12, 455, 460),
    rect(482, 460, 30, 85),
    rotate(rect(525, 460, 28, 60), -12, 539, 460),
    // short tube up to the eyepiece, tilted back
    rotate([rect(445, 170, 100, 240), rect(462, 100, 66, 70)], -20, 495, 410),
  ],

  'test tube': () =>
    rotate(
      [
        // flared lip, straight walls, round bottom
        ellipse(500, 120, 100, 24),
        path(line([420, 128], [420, 780]), arc(500, 780, 80, 80, 180, 0), line([580, 780], [580, 128])),
        // bubbling liquid in the bottom half
        wave(420, 500, 580, 500, 2, 10),
        circle(475, 610, 20),
        circle(535, 680, 14),
        circle(490, 770, 16),
        circle(530, 570, 11),
        circle(550, 60, 16),
        circle(505, 15, 11),
      ],
      12,
    ),

  stethoscope: () => [
    // ear tips and the two tubes that meet in a Y
    ellipse(330, 120, 30, 20),
    ellipse(670, 120, 30, 20),
    curve([340, 140], [320, 260], [380, 380], [500, 470]),
    curve([660, 140], [680, 260], [620, 380], [500, 470]),
    // long tube down to the chest piece
    curve([500, 470], [495, 640], [540, 800], [650, 860], [760, 820], [790, 730]),
    circle(790, 650, 80),
    circle(790, 650, 45),
  ],

  syringe: () =>
    rotate(
      [
        // barrel with marks, finger grips
        rect(300, 430, 400, 140),
        line([285, 360], [285, 640]),
        line([300, 360], [300, 640]),
        line([285, 360], [300, 360]),
        line([285, 640], [300, 640]),
        ...[480, 520, 560, 600, 640].map((x, i) => line([x, 430], [x, i % 2 ? 470 : 490])),
        // plunger
        rect(410, 435, 30, 130),
        line([150, 485], [410, 485]),
        line([150, 515], [410, 515]),
        rect(120, 400, 30, 200),
        // needle
        shape([700, 475], [745, 485], [745, 515], [700, 525]),
        line([745, 500], [930, 500]),
      ],
      -30,
    ),

  thermometer: () => [
    // glass tube with a bulb, a column of mercury and tick marks
    path(line([450, 705], [450, 150]), arc(500, 150, 50, 50, 180, 360), line([550, 150], [550, 705])),
    arc(500, 780, 90, 90, -56, 236),
    circle(500, 780, 55),
    line([485, 730], [485, 380], [515, 380], [515, 730]),
    ...[200, 250, 300, 350, 400, 450, 500, 550, 600].map((y, i) => line([550, y], [i % 2 ? 585 : 610, y])),
  ],

  bandage: () =>
    rotate(
      [
        path(
          line([220, 400], [780, 400]),
          arc(780, 500, 100, 100, 270, 450),
          line([780, 600], [220, 600]),
          arc(220, 500, 100, 100, 90, 270),
        ),
        rounded(390, 420, 220, 160, 20),
        ...[200, 260, 320, 680, 740, 800].flatMap((x) => [dot(x, 465, 8), dot(x, 535, 8)]),
      ],
      -30,
    ),

  'first aid kit': () => [
    rounded(150, 320, 700, 500, 40),
    // handle on top and two clasps
    curve([380, 320], [380, 210], [620, 210], [620, 320]),
    curve([420, 320], [425, 250], [575, 250], [580, 320]),
    rect(240, 320, 50, 35),
    rect(710, 320, 50, 35),
    // the cross
    shape(
      [455, 440],
      [545, 440],
      [545, 525],
      [630, 525],
      [630, 615],
      [545, 615],
      [545, 700],
      [455, 700],
      [455, 615],
      [370, 615],
      [370, 525],
      [455, 525],
    ),
  ],
}
