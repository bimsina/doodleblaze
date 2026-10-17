import { Avatar } from '#/components/Avatar'
import { Fire } from '@phosphor-icons/react'
import { useTweened } from '#/lib/useTweened'
import { BLAZE_THRESHOLD } from '#/shared/protocol'

const pct = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100)

/** How much the last check moved the meter; `key` restarts the chip's animation. */
export type Delta = { value: number; key: number }

function DeltaChip({ delta, className = '' }: { delta: Delta | null; className?: string }) {
  if (!delta) return null
  return (
    <span key={delta.key} className={`pointer-events-none absolute animate-float-up rounded-full bg-sun px-2 py-0.5 font-display text-lg font-extrabold ${className}`}>
      +{Math.round(delta.value * 100)}
    </span>
  )
}

/** The player's own meter: a big percentage and a bar with the blaze line marked. `compact` fits above the canvas on phones. */
export function MeterBar({ value, delta = null, compact }: { value: number; delta?: Delta | null; compact?: boolean }) {
  const blazed = value >= BLAZE_THRESHOLD
  const shown = useTweened(value)
  const bar = (
    <>
      <div
        className="h-full rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(.2,1.2,.4,1)]"
        style={{ width: `${pct(value)}%`, backgroundColor: blazed ? 'var(--color-blaze)' : 'var(--color-sun)' }}
      />
      <span
        className={`absolute -translate-x-1/2 rounded-full bg-ink ${compact ? '-top-1 h-4.5 w-1' : '-top-1.5 h-6 w-1'}`}
        style={{ left: `${BLAZE_THRESHOLD * 100}%` }}
      />
    </>
  )

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <span className={`relative w-[4.5rem] font-display text-4xl leading-none font-extrabold tabular-nums ${blazed ? 'text-blaze' : ''}`}>
          {pct(shown)}%
          <DeltaChip delta={delta} className="-top-7 left-1 text-base" />
        </span>
        <div className="relative h-2.5 flex-1 rounded-full bg-paper-deep">{bar}</div>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className={`relative font-display text-7xl leading-none font-extrabold tabular-nums transition-colors lg:text-8xl ${blazed ? 'text-blaze' : ''}`}>
          {pct(shown)}%
          <DeltaChip delta={delta} className="-top-6 -right-12" />
        </span>
        {blazed && <Fire className="mb-2 size-11 animate-pop-in text-blaze" weight="fill" />}
      </div>
      <div className="relative mt-4 h-3 rounded-full bg-paper-deep">{bar}</div>
      <p className="mt-2 text-right text-sm font-bold text-ink-faint">blaze at {BLAZE_THRESHOLD * 100}%</p>
    </div>
  )
}

/** Another player in the race: their avatar inside a ring that fills toward the blaze line. */
export function Ring({
  value,
  name,
  color,
  faded,
  celebrate,
}: {
  value: number
  name: string
  color: number
  faded?: boolean
  /** They just blazed: the avatar pulses. */
  celebrate?: boolean
}) {
  const r = 21
  const c = 2 * Math.PI * r
  const blazed = value >= BLAZE_THRESHOLD || celebrate
  // A full ring means "at the blaze line", so the race reads at a glance.
  const fill = celebrate ? 1 : Math.min(1, value / BLAZE_THRESHOLD)
  return (
    <div className={`flex w-16 flex-col items-center ${faded ? 'opacity-40' : ''}`}>
      <div className="relative size-14">
        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-paper-deep)" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r={r}
            fill="none"
            stroke={blazed ? 'var(--color-blaze)' : 'var(--color-ink)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - fill)}
            style={{ transition: 'stroke-dashoffset 500ms ease-out, stroke 300ms' }}
          />
        </svg>
        <span className={`absolute inset-[9px] rounded-full ${celebrate ? 'animate-pulse-ring' : ''}`}>
          <Avatar name={name} color={color} className="size-full text-sm" />
        </span>
        {blazed && (
          <span className="absolute -top-1 -right-1 flex size-6 animate-pop-in items-center justify-center rounded-full bg-blaze text-white">
            <Fire className="size-3.5" weight="fill" />
          </span>
        )}
      </div>
      <span className="mt-1 w-full truncate text-center text-xs font-bold text-ink-soft">{name}</span>
    </div>
  )
}
