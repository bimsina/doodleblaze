// Messages and constants shared by the browser and the Room Durable Object.

export const MAX_PLAYERS = 8
export const TOTAL_ROUNDS = 5
export const BLAZE_THRESHOLD = 0.75
export const COUNTDOWN_MS = 3_000
export const ROUND_MS = 60_000
export const REVEAL_MS = 12_000
export const BLAZE_POINTS = 100
export const CONSOLATION_POINTS = 20

// Canvas coordinates are integers in [0, COORD_MAX] on a square canvas.
export const COORD_MAX = 1000
// Stroke widths as a fraction of the canvas side, so client and server match.
export const PEN_WIDTH = 0.014
export const ERASER_WIDTH = 0.07
export const MAX_STROKES = 400
export const MAX_POINTS = 12_000

export type Stroke = {
  /** Eraser stroke: paints white. */
  e: boolean
  /** Flat list of x, y pairs. */
  p: number[]
}

export type Phase = 'lobby' | 'countdown' | 'drawing' | 'judging' | 'reveal' | 'final'

export type PublicPlayer = {
  id: string
  name: string
  score: number
  connected: boolean
  host: boolean
  /** Joined mid-round; plays from the next round. */
  waiting: boolean
  /** Index into the avatar palette, unique within the room. */
  color: number
}

export type Drawing = {
  playerId: string
  /** PNG data URL of what Drishti saw. */
  image: string
  meter: number
  /** Nothing drawn, so there is no verdict to wait for. */
  blank: boolean
  /** Drishti's best guess from the wide vocabulary, filled in after the reveal starts. */
  verdict?: { label: string; p: number }
}

export type RoundResult = {
  round: number
  word: string
  winnerId: string | null
  reason: 'blaze' | 'timeout' | 'none'
  /** Time from round start to the winning snapshot. */
  winMs: number | null
  drawings: Drawing[]
}

export type RoomSnapshot = {
  code: string
  phase: Phase
  pack: string
  round: number
  totalRounds: number
  /** Server time when the current phase ends. */
  endsAt: number | null
  /** Only sent once drawing has started. */
  word: string | null
  players: PublicPlayer[]
  result: RoundResult | null
  history: { round: number; word: string; winnerId: string | null }[]
}

export type ClientMessage =
  /** `end` marks the pen lifting; the stroke's last points may come with it. */
  | { t: 'stroke'; id: number; e: boolean; p: number[]; end?: boolean }
  | { t: 'undo' }
  | { t: 'sync'; round: number; strokes: Stroke[] }
  | { t: 'pack'; pack: string }
  | { t: 'start' }
  | { t: 'again' }

export type ServerMessage =
  | { t: 'state'; state: RoomSnapshot; you: string; now: number }
  | { t: 'meters'; meters: Record<string, number> }
  | { t: 'judge'; meter: number; guess: string | null; writing: boolean }
  | { t: 'verdict'; round: number; playerId: string; label: string; p: number }
  /** Drishti is taking a break (daily budget spent or paused by hand), so no new games start. */
  | { t: 'resting' }
  | { t: 'error'; code: 'not_found' | 'full' | 'bad_token' | 'bad_request'; message: string }
