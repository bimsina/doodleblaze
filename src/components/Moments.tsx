// The beats that make a round feel like a race: your blaze, someone else's
// blaze, and the buzzer. They sit on top of the canvas.

import { Alarm, Fire } from '@phosphor-icons/react'
import { Avatar } from '#/components/Avatar'

const seconds = (ms: number | null) => (ms == null ? '' : `${(ms / 1000).toFixed(1)}s`)

// Sparks fly out evenly around the stamp, alternating near and far, orange and yellow.
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + 0.2
  const dist = i % 2 ? 150 : 110
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    color: i % 3 === 0 ? 'var(--color-sun)' : 'var(--color-blaze)',
    size: i % 2 ? 10 : 14,
  }
})

/** You blazed: the stamp lands, a ring rolls out, sparks fly. */
export function BlazeBurst({ winMs }: { winMs: number | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl bg-blaze/10">
      <span className="absolute aspect-square w-[70%] animate-ring-out rounded-full border-[10px] border-blaze" />
      <span className="absolute aspect-square w-[70%] animate-ring-out rounded-full border-[6px] border-sun [animation-delay:180ms]" />
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-spark rounded-full [animation-delay:140ms]"
          style={{ width: s.size, height: s.size, background: s.color, '--dx': s.dx, '--dy': s.dy } as React.CSSProperties}
        />
      ))}
      <div className="relative animate-stamp rounded-3xl bg-blaze px-7 py-4 text-center text-white shadow-[0_18px_40px_-12px_rgb(226_72_15/0.7)]">
        <p className="flex items-center justify-center gap-2 font-display text-5xl font-extrabold sm:text-6xl">
          <Fire className="size-11 sm:size-13" weight="fill" /> Blazed!
        </p>
        {winMs != null && <p className="mt-1 font-display text-2xl font-bold text-white/90">in {seconds(winMs)}</p>}
      </div>
    </div>
  )
}

/** Someone else got there first. */
export function BlazeBanner({ name, color, winMs }: { name: string; color: number; winMs: number | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-3xl bg-canvas/60 p-5">
      <div className="flex animate-banner items-center gap-3 rounded-full bg-ink py-2 pr-6 pl-2 text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.5)]">
        <Avatar name={name} color={color} className="size-11 text-lg" />
        <div>
          <p className="font-display text-2xl leading-tight font-extrabold">{name} blazed it!</p>
          {winMs != null && <p className="text-sm font-semibold text-white/70">in {seconds(winMs)}</p>}
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-blaze">
          <Fire className="size-5" weight="fill" />
        </span>
      </div>
    </div>
  )
}

/** The buzzer: drawing stops while Drishti takes its last look. */
export function TimeUp() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-canvas/80 p-6 text-center backdrop-blur-[2px]">
      <div>
        <p className="flex animate-stamp items-center justify-center gap-3 font-display text-6xl font-extrabold">
          <Alarm className="size-14" weight="fill" /> Time!
        </p>
        <p className="mt-3 animate-rise font-semibold text-ink-soft [animation-delay:250ms]">Drishti is taking one last look…</p>
      </div>
    </div>
  )
}
