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

export function TimerRing({ endsAt, totalMs, now }: { endsAt: number; totalMs: number; now: () => number }) {
  const t = useNow(now)
  const left = Math.max(0, endsAt - t)
  const secs = Math.ceil(left / 1000)
  const frac = Math.min(1, left / totalMs)
  const urgent = secs <= 10
  const r = 22
  return (
    <div className={`relative size-16 ${urgent && secs > 0 ? 'animate-wiggle' : ''}`} key={urgent ? secs : 'calm'}>
      <svg viewBox="0 0 52 52" className="size-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="#fffdf9" stroke="#1d1b18" strokeWidth="2.5" />
        <circle
          cx="26"
          cy="26"
          r={r - 5}
          fill="none"
          stroke={urgent ? '#ff5a1f' : '#ffc23d'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (r - 5)}
          strokeDashoffset={2 * Math.PI * (r - 5) * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 200ms linear' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold tabular-nums ${urgent ? 'text-blaze' : 'text-ink'}`}
      >
        {secs}
      </span>
    </div>
  )
}
