import { BLAZE_THRESHOLD } from '#/shared/protocol'
import { FlameIcon } from '#/components/Icons'

const pct = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 100)

export function fillColor(meter: number) {
  if (meter >= BLAZE_THRESHOLD) return 'var(--color-blaze)'
  if (meter >= 0.3) return 'var(--color-sun)'
  return 'var(--color-ink-faint)'
}

/** The player's own meter: exact percentage, with the blaze line marked. */
export function Meter({ value }: { value: number }) {
  const blazed = value >= BLAZE_THRESHOLD
  return (
    <div>
      <div className="flex items-end justify-between">
        <span
          className={`font-display text-6xl leading-none font-extrabold tabular-nums transition-colors ${blazed ? 'text-blaze' : 'text-ink'}`}
        >
          {pct(value)}
          <span className="text-3xl">%</span>
        </span>
        {blazed && <FlameIcon className="mb-1 size-9 animate-pop-in text-blaze" />}
      </div>
      <div className="relative mt-3 h-5 overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
        <div
          className="h-full rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(.2,1.2,.4,1)]"
          style={{ width: `${pct(value)}%`, backgroundColor: fillColor(value) }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${BLAZE_THRESHOLD * 100}%` }} />
      </div>
      <div className="relative mt-1 h-4 text-[0.68rem] font-bold text-ink-soft">
        <span className="absolute -translate-x-1/2 uppercase tracking-wider" style={{ left: `${BLAZE_THRESHOLD * 100}%` }}>
          blaze line
        </span>
      </div>
    </div>
  )
}

/** Other players: a bar only, so you can feel the race without seeing their drawing. */
export function MiniMeter({ value }: { value: number }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-paper-deep">
      <div
        className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
        style={{ width: `${pct(value)}%`, backgroundColor: fillColor(value) }}
      />
      <div className="absolute inset-y-0 w-px bg-ink/70" style={{ left: `${BLAZE_THRESHOLD * 100}%` }} />
    </div>
  )
}
