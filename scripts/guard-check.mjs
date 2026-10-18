// Checks the cost guards against a running server with bot players.
// Usage: node scripts/guard-check.mjs <mode> [base] [...]
//   create [base]                    POSTs 8 rooms in a row; expect 429 after 5 (per IP, per location)
//   join   [base]                    opens 35 room sockets in a row; expect the 31st on to be refused (per IP, per location)
//   flood  [base]                    one socket sends messages as fast as it can; expect the room to close it with 4008
//   play   [base]                    one full room of 8 bots plays a round through to the reveal
//   load   [base] [rooms] [seconds]  several full rooms draw at once; judging should slow to fit the budget
// base defaults to http://localhost:3000. Every judgement is real (billed) inference; join and flood judge nothing.
import { DRAWINGS } from './lab-drawings.mjs'

const [mode = 'play', base = 'http://localhost:3000', ...rest] = process.argv.slice(2)
const PLAYERS = 8
/** Drawings per Clef request: rooms judge each drawing on its own. */
const BATCH = 1
/** Words bot 0 can actually draw, from the lab sketches. */
const SKETCHES = { cat: 'cat_4_whiskers', house: 'house', sun: 'sun', fish: 'fish', giraffe: 'giraffe', pizza: 'pizza', umbrella: 'umbrella' }
const t0 = Date.now()
const ts = () => `${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s`

async function createRoom() {
  const res = await fetch(`${base}/api/rooms`, { method: 'POST' })
  return { status: res.status, body: await res.json() }
}

/** A bot player. Bot 0 is the host. Scribbles keep its canvas changing, so it always wants judging. */
function bot(code, i, room) {
  const params = new URLSearchParams({ pid: crypto.randomUUID(), tok: crypto.randomUUID(), name: `Bot ${i + 1}` })
  const url = `${base.replace(/^http/, 'ws')}/api/rooms/${code}/ws?${params}`
  const me = { i, judged: [], strokes: 0, timer: null, round: 0, phase: null, done: false }
  const send = (msg) => me.ws.readyState === WebSocket.OPEN && me.ws.send(JSON.stringify(msg))
  const stroke = (p) => send({ t: 'stroke', id: me.strokes++, e: false, p })
  const scribble = () => {
    let x = 200 + Math.random() * 600
    let y = 200 + Math.random() * 600
    const p = []
    for (let k = 0; k < 12; k++) p.push(Math.round((x += (Math.random() - 0.5) * 80)), Math.round((y += (Math.random() - 0.5) * 80)))
    stroke(p.map((v) => Math.min(1000, Math.max(0, v))))
  }
  const onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.t === 'state') {
      const s = msg.state
      if (i === 0 && s.phase !== room.phase) room.onPhase(s)
      if (s.phase === 'drawing' && me.phase !== 'drawing') {
        me.strokes = 0
        clearInterval(me.timer)
        // In play mode, bot 0 draws the word if there's a sketch for it, a stroke at a time.
        const sketch = room.sketch && i === 0 ? DRAWINGS[SKETCHES[s.word]] : null
        if (sketch) {
          let k = 0
          me.timer = setInterval(() => (k < sketch.length ? stroke(sketch[k++].p) : clearInterval(me.timer)), 500)
        } else {
          me.timer = setInterval(scribble, 250)
        }
      }
      if (s.phase !== 'drawing') clearInterval(me.timer)
      me.phase = s.phase
    } else if (msg.t === 'judge' && me.phase === 'drawing') {
      me.judged.push(Date.now())
    } else if (msg.t === 'verdict') {
      if (i === 0) room.verdicts++
    } else if (msg.t === 'resting') {
      if (i === 0) room.resting = true
    } else if (msg.t === 'error') {
      console.log(`${ts()} bot ${i} error`, msg.code, msg.message)
    }
  }
  let opened
  me.opened = new Promise((r) => (opened = r))
  // Same seat on reconnect, like a browser tab would.
  const connect = (attempt = 0) => {
    const ws = new WebSocket(url)
    me.ws = ws
    ws.onmessage = onmessage
    ws.onopen = opened
    ws.onclose = (ev) => {
      if (me.done) return
      console.log(`${ts()} bot ${i} socket closed (${ev.code}), reconnecting`)
      if (attempt < 5) setTimeout(() => connect(attempt + 1), 500)
    }
  }
  connect()
  me.send = send
  return me
}

async function startRoom(code, { sketch = false, word } = {}) {
  const room = { code, sketch, verdicts: 0, resting: false, phase: null, results: [], onPhase: () => {} }
  // Join one after another, like people opening the invite link.
  const bots = []
  for (let i = 0; i < PLAYERS; i++) {
    bots.push(bot(code, i, room))
    await bots[i].opened
  }
  await new Promise((r) => setTimeout(r, 500))
  // Only takes effect with LAB_ENABLED=1 (local dev); ignored in production.
  if (word) bots[0].send({ t: 'pack', pack: `word:${word}` })
  bots[0].send({ t: 'start' })
  room.bots = bots
  return room
}

/** How often each bot heard back from Drishti while drawing, ignoring the first judgement. */
function judgeStats(bots) {
  const gaps = bots.flatMap((b) => b.judged.slice(1).map((t, k) => t - b.judged[k]))
  const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : NaN
  const total = bots.reduce((n, b) => n + b.judged.length, 0)
  return { total, avgGapS: +(avg / 1000).toFixed(2) }
}

const close = (bots) => bots.forEach((b) => ((b.done = true), clearInterval(b.timer), b.ws.close()))

if (mode === 'create') {
  for (let k = 1; k <= 8; k++) {
    const { status, body } = await createRoom()
    console.log(`${ts()} create #${k}: ${status} ${body.code ?? body.error}`)
  }
} else if (mode === 'join' || mode === 'flood') {
  const { status, body } = await createRoom()
  if (!body.code) throw new Error(`create failed: ${status} ${body.error}`)
  const socket = () => {
    const params = new URLSearchParams({ pid: crypto.randomUUID(), tok: crypto.randomUUID(), name: 'Guard' })
    return new WebSocket(`${base.replace(/^http/, 'ws')}/api/rooms/${body.code}/ws?${params}`)
  }
  if (mode === 'join') {
    let opened = 0
    let refused = 0
    for (let k = 0; k < 35; k++) {
      const ws = socket()
      const ok = await new Promise((r) => ((ws.onopen = () => r(true)), (ws.onerror = () => r(false))))
      ws.close()
      ok ? opened++ : refused++
    }
    console.log(`${ts()} room ${body.code}: ${opened} sockets opened, ${refused} refused`)
  } else {
    // Undo in the lobby does nothing, so no Clef calls; each message is still billed.
    const ws = socket()
    await new Promise((r) => (ws.onopen = r))
    const closedWith = new Promise((r) => (ws.onclose = (ev) => r(ev.code)))
    let sent = 0
    const timer = setInterval(() => {
      for (let k = 0; k < 20 && ws.readyState === WebSocket.OPEN; k++, sent++) ws.send('{"t":"undo"}')
    }, 5)
    const code = await Promise.race([closedWith, new Promise((r) => setTimeout(() => r('none, still open after 5s'), 5_000))])
    clearInterval(timer)
    ws.close()
    console.log(`${ts()} room ${body.code}: sent ${sent} messages, close code ${code}${code === 4008 ? ' (too fast)' : ''}`)
  }
} else if (mode === 'play') {
  const { status, body } = await createRoom()
  if (!body.code) throw new Error(`create failed: ${status} ${body.error}`)
  console.log(`${ts()} room ${body.code}, ${PLAYERS} bots`)
  const room = await startRoom(body.code, { sketch: true, word: 'cat' })
  await new Promise((resolve) => {
    let drawStart = 0
    room.onPhase = (s) => {
      room.phase = s.phase
      console.log(`${ts()} phase ${s.phase}${s.word ? ` (word: ${s.word})` : ''}`)
      if (s.phase === 'drawing') drawStart = Date.now()
      if (s.phase === 'reveal') {
        const r = s.result
        const winner = s.players.find((p) => p.id === r.winnerId)?.name ?? 'nobody'
        console.log(`${ts()} round ${r.round}: ${winner} (${r.reason}${r.winMs ? `, ${(r.winMs / 1000).toFixed(1)}s` : ''}), drew ${((Date.now() - drawStart) / 1000).toFixed(1)}s`)
        console.log(`${ts()} judging while drawing:`, judgeStats(room.bots))
        setTimeout(resolve, 8_000)
      }
    }
    setTimeout(() => room.resting && (console.log(`${ts()} resting: new games are paused`), resolve()), 3_000)
  })
  console.log(`${ts()} verdicts at reveal: ${room.verdicts}`)
  close(room.bots)
} else if (mode === 'load') {
  const rooms = Number(rest[0] ?? 3)
  const seconds = Number(rest[1] ?? 40)
  const created = []
  for (let k = 0; k < rooms; k++) created.push(await createRoom())
  const codes = created.map((c) => c.body.code).filter(Boolean)
  console.log(`${ts()} rooms ${codes.join(', ')} with ${PLAYERS} bots each, scribbling for ${seconds}s`)
  const all = await Promise.all(codes.map((code) => startRoom(code)))
  // Countdown, then draw.
  await new Promise((r) => setTimeout(r, 3_500 + seconds * 1000))
  const window = seconds
  for (const room of all) {
    const st = judgeStats(room.bots)
    console.log(`${room.code}: ${st.total} judgements, each bot judged every ${st.avgGapS}s`)
  }
  const total = all.reduce((n, r) => n + judgeStats(r.bots).total, 0)
  console.log(`all rooms: ${(total / window).toFixed(1)} judgements/s ≈ ${(total / window / BATCH).toFixed(2)} Clef requests/s (unthrottled would be ${((codes.length * PLAYERS) / BATCH).toFixed(1)}/s)`)
  all.forEach((r) => close(r.bots))
}
