// One Durable Object that every room asks before calling Drishti, so all
// rooms together stay under the account's Workers AI rate limit and a daily
// spend cap. Busy rooms judge less often instead of failing.

import { DurableObject } from 'cloudflare:workers'

/** A room's fastest judging pace. Each tick judges every changed canvas, so this sets most of the bill. */
export const BASE_TICK_MS = 1_500
/** Its slowest pace, when the budget is stretched thin. */
const MAX_TICK_MS = 8_000
/** Requests that can go out back to back before the per-minute pace applies. */
const BURST = 20
/** How far back demand is measured when working out the shared pace. */
const DEMAND_WINDOW_MS = 15_000
/** The daily count is saved at most this often. */
const SAVE_MS = 5_000

export type Grant = { granted: number; tickMs: number }

type Daily = { day: string; used: number }

export class JudgeBudget extends DurableObject<Env> {
  private readonly perSecond: number
  private readonly perDay: number
  private tokens = BURST
  private refilledAt = Date.now()
  /** Recent asks, scaled to what each room would send at the base pace. */
  private demand: { at: number; load: number }[] = []
  private daily: Daily = { day: '', used: 0 }
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.perSecond = Number(env.JUDGE_PER_MINUTE) / 60
    this.perDay = Number(env.JUDGE_PER_DAY)
    ctx.blockConcurrencyWhile(async () => {
      this.daily = (await ctx.storage.get<Daily>('daily')) ?? this.daily
    })
  }

  /**
   * Asks for `want` Clef requests from a room ticking every `tickMs`. Grants
   * what the per-minute budget allows right now, and returns the pace every
   * room should tick at so that, together, they fit the budget. `force`
   * always grants (the last look at time-up, reveal verdicts) but still counts.
   */
  take(want: number, tickMs: number, force = false): Grant {
    const now = Date.now()
    this.tokens = Math.min(BURST, this.tokens + ((now - this.refilledAt) / 1000) * this.perSecond)
    this.refilledAt = now
    const granted = force ? want : Math.max(0, Math.min(want, Math.floor(this.tokens)))
    this.tokens -= granted
    this.count(granted, now)
    if (!force) this.demand.push({ at: now, load: (want * tickMs) / BASE_TICK_MS })
    return { granted, tickMs: this.pace(now) }
  }

  /** True once today's cap is used up. Resets at midnight UTC. */
  resting(): boolean {
    this.rollover(Date.now())
    return this.daily.used >= this.perDay
  }

  status() {
    this.rollover(Date.now())
    return { ...this.daily, perDay: this.perDay, tokens: this.tokens, tickMs: this.pace(Date.now()) }
  }

  /** If every room ticked at the base pace, how far over budget would that be? Stretch everyone's tick by that much. */
  private pace(now: number) {
    while (this.demand.length && this.demand[0].at < now - DEMAND_WINDOW_MS) this.demand.shift()
    const load = this.demand.reduce((sum, d) => sum + d.load, 0)
    const stretch = load / (DEMAND_WINDOW_MS / 1000) / this.perSecond
    return Math.round(Math.min(MAX_TICK_MS, Math.max(BASE_TICK_MS, BASE_TICK_MS * stretch)))
  }

  private count(n: number, now: number) {
    if (!n) return
    this.rollover(now)
    this.daily.used += n
    this.saveTimer ??= setTimeout(() => {
      this.saveTimer = null
      void this.ctx.storage.put('daily', this.daily)
    }, SAVE_MS)
  }

  private rollover(now: number) {
    const day = new Date(now).toISOString().slice(0, 10)
    if (day !== this.daily.day) this.daily = { day, used: 0 }
  }
}

const budget = (env: Env) => env.BUDGET.getByName('global')

/** Asks the shared budget for Clef requests. If it can't be reached, judge anyway at a gentler pace; the AI Gateway's own limits still apply. */
export async function takeBudget(env: Env, want: number, tickMs: number, force = false): Promise<Grant> {
  try {
    return await budget(env).take(want, tickMs, force)
  } catch (err) {
    console.error('budget check failed', err)
    return { granted: want, tickMs: BASE_TICK_MS * 2 }
  }
}

/** The pause switch: the "paused" flag in KV (flipped by hand) or today's budget running out. */
export async function isResting(env: Env): Promise<boolean> {
  try {
    const [flag, spent] = await Promise.all([env.FLAGS.get('paused', { cacheTtl: 30 }), budget(env).resting()])
    return (!!flag && flag !== '0') || spent
  } catch (err) {
    console.error('pause check failed', err)
    return false
  }
}

export const budgetStatus = (env: Env) => budget(env).status()
