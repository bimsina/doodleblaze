import { useEffect, useRef, useState } from 'react'

/** Counts toward `target` (ease-out) instead of jumping, starting from `from` on mount. */
export function useTweened(target: number, { ms = 650, from = target, delay = 0 } = {}) {
  const [value, setValue] = useState(from)
  const current = useRef(from)
  useEffect(() => {
    let frame = 0
    let start = 0
    const begin = current.current
    const step = (now: number) => {
      start ||= now + delay
      const t = Math.min(1, Math.max(0, (now - start) / ms))
      const v = begin + (target - begin) * (1 - Math.pow(1 - t, 3))
      current.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms, delay])
  return value
}

/** A number that counts up to `value`. */
export function CountUp({ value, from = 0, ms = 900, delay = 0 }: { value: number; from?: number; ms?: number; delay?: number }) {
  return Math.round(useTweened(value, { from, ms, delay }))
}
