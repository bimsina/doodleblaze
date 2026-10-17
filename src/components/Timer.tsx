import { useEffect, useState } from 'react'

/** Ticks a re-render every `ms` while mounted; returns the current server time. */
export function useNow(now: () => number, ms = 200) {
  const [t, setT] = useState(now)
  useEffect(() => {
    const id = setInterval(() => setT(now()), ms)
    return () => clearInterval(id)
  }, [now, ms])
  return t
}

/** Seconds left in a solid circle; turns orange and wiggles for the last ten. */
export function TimerBadge({ endsAt, now }: { endsAt: number; now: () => number }) {
  const t = useNow(now)
  const secs = Math.max(0, Math.ceil((endsAt - t) / 1000))
  const urgent = secs <= 10
  return (
    <span
      key={urgent ? secs : 'calm'}
      className={`flex size-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-extrabold tabular-nums text-white sm:size-20 sm:text-3xl ${
        urgent ? 'animate-wiggle bg-blaze' : 'bg-ink'
      }`}
      aria-label={`${secs} seconds left`}
    >
      {secs}
    </span>
  )
}
