// One Durable Object per room code: the authoritative game state, the
// WebSocket hub, and the judge scheduler.

import { DurableObject } from 'cloudflare:workers'
import {
  BLAZE_POINTS,
  BLAZE_THRESHOLD,
  CONSOLATION_POINTS,
  COORD_MAX,
  COUNTDOWN_MS,
  MAX_PLAYERS,
  MAX_POINTS,
  MAX_STROKES,
  REVEAL_MS,
  ROUND_MS,
  TOTAL_ROUNDS,
} from '#/shared/protocol'
import type {
  ClientMessage,
  Drawing,
  Phase,
  PublicPlayer,
  RoomSnapshot,
  RoundResult,
  ServerMessage,
  Stroke,
} from '#/shared/protocol'
import {
  CUSTOM_PACK,
  customPrompt,
  DEFAULT_PACK,
  distinctWords,
  findWord,
  getPack,
  MIN_CUSTOM_WORDS,
  PACKS,
  parseWords,
  slug,
  VOCABULARY,
} from '#/shared/prompts'
import type { PromptWord } from '#/shared/prompts'
import { BASE_TICK_MS, isResting, takeBudget } from '#/server/budget'
import { judgeBatch, optionsFor, verdict } from '#/server/judge'
import type { Judgement } from '#/server/judge'
import { renderStrokes } from '#/server/raster'

const MODEL = 'clef'
/** Each tick judges every changed canvas the shared budget allows, up to 4 per Clef request. */
const BATCH_SIZE = 4
/** Rooms nobody is connected to are wiped after this long. */
const IDLE_CLEANUP_MS = 30 * 60_000
/** At time-up, how long to wait for in-flight judgements before scoring. */
const DRAIN_MS = 4_000
/** Below this, a timed-out round has no winner at all. */
const MIN_CONSOLATION_METER = 0.1
/** A stroke still being drawn is judged only once it has gone on this long; otherwise Drishti waits for the pen to lift. */
const LONG_STROKE_MS = 1_500
/** Words a "something else" drawing is compared against at the reveal. Cost grows with the list. */
const VERDICT_WORDS = 40

type Player = {
  id: string
  name: string
  token: string
  score: number
  waiting: boolean
  color: number
}

type Stored = {
  code: string
  createdAt: number
  hostId: string | null
  phase: Phase
  pack: string
  /** The host's own words, used when `pack` is CUSTOM_PACK. */
  customWords: string[]
  round: number
  endsAt: number | null
  roundStartedAt: number | null
  word: string | null
  /** The round's word with its look-alikes; custom words aren't in any pack to look up. */
  prompt: PromptWord | null
  options: string[]
  usedWords: string[]
  players: Player[]
  result: RoundResult | null
  history: RoomSnapshot['history']
}

/** Rooms saved before the custom pack existed lack these fields. */
type Saved = Omit<Stored, 'customWords' | 'prompt'> & Partial<Pick<Stored, 'customWords' | 'prompt'>>

type Canvas = {
  strokes: Stroke[]
  points: number
  /** Bumped on every change; a judgement applies only to the version it saw. */
  version: number
  changedAt: number
  judgedVersion: number
  inFlight: boolean
  meter: number
  /** When the stroke being drawn started; null once the pen lifts. */
  strokeStartedAt: number | null
  /** Drishti's top pick at the last check, reused for the reveal card. */
  top: string | null
  topP: number
}

type Attachment = { playerId: string }

export class Room extends DurableObject<Env> {
  private state: Stored | null = null
  private canvases = new Map<string, Canvas>()
  private judgeTimer: ReturnType<typeof setTimeout> | null = null
  private lastTickAt = 0
  /** Widens past BASE_TICK_MS when every room together is asking for more than the budget. */
  private tickMs = BASE_TICK_MS
  /** Earliest snapshot time of each in-flight Clef request. */
  private flights = new Set<{ minAt: number; done: Promise<void> }>()
  private pending: { playerId: string; at: number } | null = null
  private finalizing = false
  /** A pending timer keeps the object in memory (canvases live there) for the whole phase. */
  private keepAlive: ReturnType<typeof setTimeout> | null = null
  /** Dev only (LAB_ENABLED): the next round's word. */
  private forcedWord: string | null = null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get<Saved>('state')
      this.state = saved ? { ...saved, customWords: saved.customWords ?? [], prompt: saved.prompt ?? null } : null
    })
  }

  // --- RPC from the Worker ---

  async init(code: string): Promise<boolean> {
    if (this.state) return false
    this.state = {
      code,
      createdAt: Date.now(),
      hostId: null,
      phase: 'lobby',
      pack: DEFAULT_PACK,
      customWords: [],
      round: 0,
      endsAt: null,
      roundStartedAt: null,
      word: null,
      prompt: null,
      options: [],
      usedWords: [],
      players: [],
      result: null,
      history: [],
    }
    await this.save()
    await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP_MS)
    return true
  }

  async info() {
    if (!this.state) return { exists: false as const }
    return { exists: true as const, phase: this.state.phase, players: this.state.players.length }
  }

  // --- WebSockets ---

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 })
    const url = new URL(request.url)
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    const reject = (code: Extract<ServerMessage, { t: 'error' }>['code'], message: string) => {
      server.accept()
      send(server, { t: 'error', code, message })
      server.close(4000, code)
      return new Response(null, { status: 101, webSocket: client })
    }

    const state = this.state
    if (!state) return reject('not_found', 'That room does not exist (or it expired).')
    const playerId = (url.searchParams.get('pid') ?? '').slice(0, 64)
    const token = (url.searchParams.get('tok') ?? '').slice(0, 64)
    if (!playerId || !token) return reject('bad_request', 'Missing player identity.')

    let player = state.players.find((p) => p.id === playerId)
    if (player && player.token !== token) return reject('bad_token', 'Someone else is using this seat.')
    if (!player) {
      if (state.players.length >= MAX_PLAYERS) return reject('full', `This room is full (${MAX_PLAYERS} players).`)
      player = {
        id: playerId,
        name: uniqueName(cleanName(url.searchParams.get('name')), state.players),
        token,
        score: 0,
        // Joining before the drawing starts still makes this round.
        waiting: state.phase === 'drawing' || state.phase === 'judging' || state.phase === 'reveal',
        color: freeColor(state.players),
      }
      state.players.push(player)
    }
    state.hostId ??= player.id

    // One live socket per player: a new tab replaces the old one.
    for (const ws of this.ctx.getWebSockets(player.id)) ws.close(4001, 'replaced')
    this.ctx.acceptWebSocket(server, [player.id])
    server.serializeAttachment({ playerId: player.id } satisfies Attachment)

    await this.save()
    this.broadcastState()
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const state = this.state
    if (!state || typeof raw !== 'string' || raw.length > 64_000) return
    const { playerId } = ws.deserializeAttachment() as Attachment
    const player = state.players.find((p) => p.id === playerId)
    if (!player) return
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw) as ClientMessage
    } catch {
      return
    }
    switch (msg.t) {
      case 'stroke':
        return this.onStroke(player, msg)
      case 'undo':
        return this.onUndo(player)
      case 'sync':
        return this.onSync(player, msg)
      case 'pack':
        if (this.env.LAB_ENABLED === '1' && msg.pack.startsWith('word:')) {
          this.forcedWord = msg.pack.slice(5)
          return
        }
        if (!this.isHost(player) || state.phase !== 'lobby') return
        if (
          PACKS.some((p) => p.id === msg.pack) ||
          (msg.pack === CUSTOM_PACK && state.customWords.length >= MIN_CUSTOM_WORDS)
        ) {
          state.pack = msg.pack
          await this.save()
          this.broadcastState()
        }
        return
      case 'words': {
        if (!this.isHost(player) || state.phase !== 'lobby') return
        const words = parseWords(Array.isArray(msg.words) ? msg.words : [])
        if (words.length < MIN_CUSTOM_WORDS) return
        state.customWords = words
        state.pack = CUSTOM_PACK
        await this.save()
        this.broadcastState()
        return
      }
      case 'start': {
        const canStart = () => this.isHost(player) && (state.phase === 'lobby' || state.phase === 'final')
        if (!canStart()) return
        if (await isResting(this.env)) return this.broadcast({ t: 'resting' })
        // Another start may have landed while we checked.
        if (canStart()) await this.startGame()
        return
      }
      case 'again':
        if (this.isHost(player) && state.phase === 'final') await this.backToLobby()
        return
    }
  }

  async webSocketClose(ws: WebSocket) {
    const state = this.state
    if (!state) return
    const { playerId } = ws.deserializeAttachment() as Attachment
    if (state.phase === 'lobby' && !this.isConnected(playerId, ws)) {
      // Lobby seats are free to take; mid-game seats are kept for rejoining.
      state.players = state.players.filter((p) => p.id !== playerId)
      if (state.hostId === playerId) state.hostId = state.players[0]?.id ?? null
    }
    if (this.connectedIds().length === 0 && (state.phase === 'lobby' || state.phase === 'final')) {
      await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP_MS)
    }
    await this.save()
    this.broadcastState()
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws)
  }

  // --- Phases ---

  async alarm() {
    const state = this.state
    if (!state) return
    const now = Date.now()
    if (state.endsAt && now < state.endsAt - 50) {
      await this.ctx.storage.setAlarm(state.endsAt)
      return
    }
    switch (state.phase) {
      case 'countdown':
        return this.beginDrawing()
      case 'drawing':
        return this.timeUp()
      case 'reveal':
        if (this.connectedIds().length === 0) return this.backToLobby()
        return state.round >= TOTAL_ROUNDS ? this.finishGame() : this.nextRound()
      case 'lobby':
      case 'final':
        if (this.connectedIds().length === 0) {
          await this.ctx.storage.deleteAll()
          this.state = null
        }
        return
      case 'judging':
        return
    }
  }

  private async startGame() {
    const state = this.state!
    for (const p of state.players) p.score = 0
    state.players = state.players.filter((p) => this.isConnected(p.id))
    state.round = 0
    state.usedWords = []
    state.history = []
    await this.nextRound()
  }

  private async nextRound() {
    const state = this.state!
    const custom = state.pack === CUSTOM_PACK ? state.customWords : []
    const prompt =
      findWord(this.forcedWord ?? '') ??
      (custom.length
        ? customPrompt(pickFresh(custom, state.usedWords, (w) => w), custom)
        : pickFresh(getPack(state.pack).words, state.usedWords, (w) => w.word))
    this.forcedWord = null
    state.round += 1
    state.word = prompt.word
    state.prompt = prompt
    state.usedWords.push(prompt.word)
    state.options = optionsFor(prompt)
    state.result = null
    for (const p of state.players) p.waiting = false
    this.canvases.clear()
    this.pending = null
    this.finalizing = false
    await this.setPhase('countdown', COUNTDOWN_MS)
  }

  private async beginDrawing() {
    this.state!.roundStartedAt = Date.now()
    await this.setPhase('drawing', ROUND_MS)
  }

  private async timeUp() {
    if (this.finalizing) return
    this.finalizing = true
    const state = this.state!
    state.phase = 'judging'
    state.endsAt = null
    this.broadcastState()
    // Last look at anything drawn before the buzzer.
    if (this.judgeTimer) clearTimeout(this.judgeTimer)
    this.judgeTimer = null
    await this.judgeTick(true)
    await Promise.race([
      Promise.all([...this.flights].map((f) => f.done)),
      new Promise((r) => setTimeout(r, DRAIN_MS)),
    ])
    await this.finalizeRound()
  }

  private async finalizeRound() {
    const state = this.state!
    if (state.phase !== 'drawing' && state.phase !== 'judging') return
    this.finalizing = true
    if (this.judgeTimer) clearTimeout(this.judgeTimer)
    this.judgeTimer = null
    const active = state.players.filter(
      (p) => !p.waiting && (this.isConnected(p.id) || (this.canvases.get(p.id)?.strokes.length ?? 0) > 0),
    )
    let winnerId: string | null = null
    let reason: RoundResult['reason'] = 'none'
    let winMs: number | null = null
    if (this.pending) {
      winnerId = this.pending.playerId
      reason = 'blaze'
      winMs = this.pending.at - (state.roundStartedAt ?? this.pending.at)
    } else {
      const best = active
        .map((p) => ({ p, meter: this.canvases.get(p.id)?.meter ?? 0 }))
        .sort((a, b) => b.meter - a.meter)
        .at(0)
      if (best && best.meter >= MIN_CONSOLATION_METER) {
        winnerId = best.p.id
        reason = 'timeout'
      }
    }
    const winner = state.players.find((p) => p.id === winnerId)
    if (winner) winner.score += reason === 'blaze' ? BLAZE_POINTS : CONSOLATION_POINTS

    const drawings: Drawing[] = await Promise.all(
      active.map(async (p) => {
        const canvas = this.canvases.get(p.id)
        const image = await renderStrokes(canvas?.strokes ?? [])
        const drawing: Drawing = { playerId: p.id, image: image.dataUrl, meter: canvas?.meter ?? 0, blank: image.empty }
        if (canvas && !image.empty) drawing.verdict = liveVerdict(canvas, state.word!)
        return drawing
      }),
    )
    state.result = { round: state.round, word: state.word!, winnerId, reason, winMs, drawings }
    state.history.push({ round: state.round, word: state.word!, winnerId })
    await this.setPhase('reveal', REVEAL_MS)
    this.ctx.waitUntil(this.addVerdicts(state.round))
  }

  /**
   * Most reveal cards reuse the last live check for free (see liveVerdict).
   * Only drawings Drishti filed under "something else" get one more look,
   * against a short random sample of other words.
   */
  private async addVerdicts(round: number) {
    const state = this.state
    const result = state?.result
    if (!state || !result) return
    const unknown = result.drawings.filter((d) => !d.blank && !d.verdict)
    if (!unknown.length) return
    // The host's own words join in, for guesses from the room's theme.
    const custom = state.pack === CUSTOM_PACK ? state.customWords : []
    const words = sample(distinctWords([...custom, ...VOCABULARY], state.options.map(slug)), VERDICT_WORDS)
    // Always granted: a handful per round. Counting them makes busy rooms slow down to make room.
    await takeBudget(this.env, unknown.length, this.tickMs, true)
    await Promise.all(
      unknown.map(async (d) => {
        try {
          const v = await verdict(this.env.AI, MODEL, d.image, words, state.code)
          if (this.state?.result?.round !== round) return
          d.verdict = v
          this.broadcast({ t: 'verdict', round, playerId: d.playerId, label: v.label, p: v.p })
        } catch (err) {
          console.error('verdict failed', err)
        }
      }),
    )
    if (this.state?.result?.round === round) await this.save()
  }

  private async finishGame() {
    await this.setPhase('final', null)
    await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP_MS)
  }

  private async backToLobby() {
    const state = this.state!
    state.players = state.players.filter((p) => this.isConnected(p.id))
    for (const p of state.players) {
      p.score = 0
      p.waiting = false
    }
    if (!state.players.some((p) => p.id === state.hostId)) state.hostId = state.players[0]?.id ?? null
    state.round = 0
    state.word = null
    state.prompt = null
    state.result = null
    state.history = []
    this.canvases.clear()
    await this.setPhase('lobby', null)
    await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP_MS)
  }

  private async setPhase(phase: Phase, durationMs: number | null) {
    const state = this.state!
    state.phase = phase
    state.endsAt = durationMs === null ? null : Date.now() + durationMs
    if (this.keepAlive) clearTimeout(this.keepAlive)
    this.keepAlive = durationMs === null ? null : setTimeout(() => (this.keepAlive = null), durationMs + 5_000)
    await this.save()
    if (state.endsAt) await this.ctx.storage.setAlarm(state.endsAt)
    this.broadcastState()
  }

  // --- Drawing ---

  private canvasFor(player: Player): Canvas | null {
    if (this.state?.phase !== 'drawing' || player.waiting || this.pending) return null
    let canvas = this.canvases.get(player.id)
    if (!canvas) {
      canvas = {
        strokes: [],
        points: 0,
        version: 0,
        changedAt: 0,
        judgedVersion: 0,
        inFlight: false,
        meter: 0,
        strokeStartedAt: null,
        top: null,
        topP: 0,
      }
      this.canvases.set(player.id, canvas)
    }
    return canvas
  }

  private onStroke(player: Player, msg: Extract<ClientMessage, { t: 'stroke' }>) {
    const canvas = this.canvasFor(player)
    // The pen-up message may carry no new points.
    const points = Array.isArray(msg.p) && msg.p.length === 0 ? [] : cleanPoints(msg.p)
    if (!canvas || !points) return
    if (canvas.points + points.length / 2 > MAX_POINTS) return
    if (points.length) {
      if (msg.id === canvas.strokes.length && canvas.strokes.length < MAX_STROKES) {
        canvas.strokes.push({ e: msg.e === true, p: points })
        canvas.strokeStartedAt = Date.now()
      } else if (msg.id === canvas.strokes.length - 1) {
        canvas.strokes[msg.id].p.push(...points)
      } else {
        return
      }
      canvas.points += points.length / 2
    }
    if (msg.end === true) canvas.strokeStartedAt = null
    if (points.length) this.touch(canvas)
    else this.scheduleJudge()
  }

  private onUndo(player: Player) {
    const canvas = this.canvasFor(player)
    const last = canvas?.strokes.pop()
    if (!canvas || !last) return
    canvas.points -= last.p.length / 2
    this.touch(canvas)
  }

  /** After a reconnect, the client resends its strokes in case this object restarted. */
  private onSync(player: Player, msg: Extract<ClientMessage, { t: 'sync' }>) {
    if (msg.round !== this.state?.round) return
    const canvas = this.canvasFor(player)
    if (!canvas || canvas.strokes.length > 0 || !Array.isArray(msg.strokes)) return
    for (const s of msg.strokes.slice(0, MAX_STROKES)) {
      const points = cleanPoints((s as Partial<Stroke> | null)?.p)
      if (!points || canvas.points + points.length / 2 > MAX_POINTS) break
      canvas.strokes.push({ e: s.e === true, p: points })
      canvas.points += points.length / 2
    }
    this.touch(canvas)
  }

  private touch(canvas: Canvas) {
    canvas.version += 1
    canvas.changedAt = Date.now()
    this.scheduleJudge()
  }

  // --- Judging ---

  private scheduleJudge() {
    if (this.judgeTimer || this.finalizing || this.state?.phase !== 'drawing') return
    const now = Date.now()
    let wait = Math.max(0, this.lastTickAt + this.tickMs - now)
    if (!this.unjudged().length) {
      // Only mid-stroke canvases are waiting. Look again once the oldest open
      // stroke counts as long, in case its pen-up never arrives (a dropped
      // message, or a tab still running an older client).
      const before = this.pending?.at ?? Infinity
      const due = [...this.canvases.values()]
        .filter((c) => c.version !== c.judgedVersion && !c.inFlight && c.changedAt < before && c.strokeStartedAt !== null)
        .map((c) => c.strokeStartedAt! + LONG_STROKE_MS + 10)
      if (!due.length) return
      wait = Math.max(wait, Math.min(...due) - now)
    }
    this.judgeTimer = setTimeout(() => {
      this.judgeTimer = null
      void this.judgeTick()
    }, wait)
  }

  /**
   * Changed canvases waiting for Drishti, oldest change first. Mid-stroke
   * canvases wait for the pen to lift (or a long stroke), which saves checks
   * on half-drawn lines. Once someone has blazed, only ones drawn before that
   * can still win. `final` (time's up) takes everything.
   */
  private unjudged(final = false) {
    const before = this.pending?.at ?? Infinity
    const now = Date.now()
    return [...this.canvases.entries()]
      .filter(
        ([, c]) =>
          c.version !== c.judgedVersion &&
          !c.inFlight &&
          c.changedAt < before &&
          (final || c.strokeStartedAt === null || now - c.strokeStartedAt > LONG_STROKE_MS),
      )
      .sort((a, b) => a[1].changedAt - b[1].changedAt)
  }

  private async judgeTick(final = false) {
    const state = this.state
    if (!state?.word || (!final && (state.phase !== 'drawing' || this.finalizing))) return
    const round = state.round
    this.lastTickAt = Date.now()
    const want = Math.ceil(this.unjudged(final).length / BATCH_SIZE)
    if (!want) return this.scheduleJudge()
    const { granted, tickMs } = await takeBudget(this.env, want, this.tickMs, final)
    this.tickMs = tickMs
    if (this.state?.round !== round || (!final && this.finalizing)) return
    const ready = this.unjudged(final).slice(0, granted * BATCH_SIZE)
    for (let i = 0; i < ready.length; i += BATCH_SIZE) this.launch(ready.slice(i, i + BATCH_SIZE))
    // Whatever the budget held back goes out on a later tick.
    this.scheduleJudge()
  }

  private launch(batch: [string, Canvas][]) {
    const snapshots = batch.map(([playerId, canvas]) => {
      canvas.inFlight = true
      return { playerId, canvas, version: canvas.version, at: canvas.changedAt, strokes: canvas.strokes.map((s) => ({ e: s.e, p: s.p.slice() })) }
    })
    const flight = { minAt: Math.min(...snapshots.map((s) => s.at)), done: Promise.resolve() }
    flight.done = this.runJudge(snapshots).finally(() => {
      this.flights.delete(flight)
      for (const s of snapshots) s.canvas.inFlight = false
      this.checkWinner()
      if (!this.finalizing) this.scheduleJudge()
    })
    this.flights.add(flight)
  }

  private async runJudge(
    snapshots: { playerId: string; canvas: Canvas; version: number; at: number; strokes: Stroke[] }[],
  ) {
    const state = this.state!
    const prompt = state.prompt
    if (!prompt) return
    const rendered = await Promise.all(snapshots.map((s) => renderStrokes(s.strokes)))
    const toJudge = snapshots.map((s, i) => ({ s, image: rendered[i] })).filter((x) => !x.image.empty)
    const meters: Record<string, number> = {}
    // Blank canvases score 0 without asking Clef.
    for (const [i, s] of snapshots.entries()) {
      if (rendered[i].empty) this.applyJudgement(s, null, meters)
    }
    if (toJudge.length) {
      try {
        const { judgements } = await judgeBatch(
          this.env.AI,
          MODEL,
          prompt,
          state.options,
          toJudge.map((x) => x.image.dataUrl),
          state.code,
        )
        if (this.state?.word !== prompt.word) return
        toJudge.forEach(({ s }, i) => this.applyJudgement(s, judgements[i], meters))
      } catch (err) {
        console.error('judge failed', err)
        // Back off a little; probably rate limited.
        this.lastTickAt = Date.now() + 2_000
      }
    }
    if (Object.keys(meters).length) this.broadcast({ t: 'meters', meters })
  }

  /** `j` is null for a blank canvas. */
  private applyJudgement(
    s: { playerId: string; canvas: Canvas; version: number; at: number },
    j: Judgement | null,
    meters: Record<string, number>,
  ) {
    if (s.version < s.canvas.judgedVersion) return
    const meter = j?.meter ?? 0
    s.canvas.judgedVersion = s.version
    s.canvas.meter = meter
    s.canvas.top = j?.top ?? null
    s.canvas.topP = j?.topP ?? 0
    meters[s.playerId] = meter
    this.sendTo(s.playerId, { t: 'judge', meter, guess: j?.guess ?? null, writing: j?.top === 'writing' })
    if (meter >= BLAZE_THRESHOLD && (!this.pending || s.at < this.pending.at)) {
      this.pending = { playerId: s.playerId, at: s.at }
    }
  }

  /** The earliest crossing wins, but only once nothing drawn earlier is still being judged or waiting its turn. */
  private checkWinner() {
    if (!this.pending || this.finalizing) return
    const at = this.pending.at
    if ([...this.flights].some((f) => f.minAt < at) || this.unjudged().length) return
    this.ctx.waitUntil(this.finalizeRound())
  }

  // --- Helpers ---

  private isHost(player: Player) {
    const state = this.state!
    if (state.hostId === player.id) return true
    // If the host is gone, the earliest connected player can act and takes over.
    if (!this.isConnected(state.hostId ?? '') && this.connectedIds()[0] === player.id) {
      state.hostId = player.id
      return true
    }
    return false
  }

  private connectedIds(except?: WebSocket) {
    const ids = new Set<string>()
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except || ws.readyState !== WebSocket.OPEN) continue
      ids.add((ws.deserializeAttachment() as Attachment).playerId)
    }
    const order = this.state?.players.map((p) => p.id) ?? []
    return order.filter((id) => ids.has(id))
  }

  private isConnected(playerId: string, except?: WebSocket) {
    return this.connectedIds(except).includes(playerId)
  }

  private snapshot(): RoomSnapshot {
    const state = this.state!
    const connected = new Set(this.connectedIds())
    const hostId = connected.has(state.hostId ?? '') ? state.hostId : ([...connected][0] ?? state.hostId)
    const players: PublicPlayer[] = state.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: connected.has(p.id),
      host: p.id === hostId,
      waiting: p.waiting,
      color: p.color,
    }))
    return {
      code: state.code,
      phase: state.phase,
      pack: state.pack,
      customWords: state.customWords.length,
      round: state.round,
      totalRounds: TOTAL_ROUNDS,
      endsAt: state.endsAt,
      word: state.phase === 'countdown' ? null : state.word,
      players,
      result: state.result,
      history: state.history,
    }
  }

  private broadcastState() {
    if (!this.state) return
    const snapshot = this.snapshot()
    const now = Date.now()
    for (const ws of this.ctx.getWebSockets()) {
      const { playerId } = ws.deserializeAttachment() as Attachment
      send(ws, { t: 'state', state: snapshot, you: playerId, now })
    }
  }

  private broadcast(msg: ServerMessage) {
    for (const ws of this.ctx.getWebSockets()) send(ws, msg)
  }

  private sendTo(playerId: string, msg: ServerMessage) {
    for (const ws of this.ctx.getWebSockets(playerId)) send(ws, msg)
  }

  private async save() {
    if (this.state) await this.ctx.storage.put('state', this.state)
  }
}

function send(ws: WebSocket, msg: ServerMessage) {
  try {
    ws.send(JSON.stringify(msg))
  } catch {
    // Socket already closed.
  }
}

function cleanPoints(p: unknown): number[] | null {
  if (!Array.isArray(p) || p.length === 0 || p.length % 2 !== 0 || p.length > 4_000) return null
  const out = new Array<number>(p.length)
  for (let i = 0; i < p.length; i++) {
    const v = p[i]
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    out[i] = Math.min(COORD_MAX, Math.max(0, Math.round(v)))
  }
  return out
}

/** The reveal card's line, straight from the last live check, when it says enough. */
function liveVerdict(canvas: Canvas, word: string): Drawing['verdict'] {
  if (canvas.meter >= BLAZE_THRESHOLD) return { label: word, p: canvas.meter }
  if (!canvas.top || canvas.top === 'something else') return undefined
  return { label: canvas.top, p: canvas.topP }
}

/** A random item whose word hasn't come up this game; repeats only once the pack runs out. */
function pickFresh<T>(items: T[], used: string[], wordOf: (item: T) => string): T {
  const fresh = items.filter((item) => !used.includes(wordOf(item)))
  const pool = fresh.length ? fresh : items
  return pool[Math.floor(Math.random() * pool.length)]
}

function sample<T>(items: T[], n: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function freeColor(players: Player[]) {
  const used = new Set(players.map((p) => p.color))
  for (let c = 0; c < MAX_PLAYERS; c++) if (!used.has(c)) return c
  return players.length % MAX_PLAYERS
}

function cleanName(raw: string | null) {
  const name = (raw ?? '')
    .replace(/[\p{C}<>]/gu, '')
    .trim()
    .slice(0, 16)
  return name || 'Doodler'
}

function uniqueName(name: string, players: Player[]) {
  const taken = new Set(players.map((p) => p.name.toLowerCase()))
  if (!taken.has(name.toLowerCase())) return name
  for (let n = 2; ; n++) {
    const candidate = `${name.slice(0, 13)} ${n}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}
