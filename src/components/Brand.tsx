// The mark's path is also in public/favicon.svg and scripts/brand/*.html; keep them in sync.
export const MARK_SCRIBBLE = 'M9.5 26.5C12.5 20.5 15 17 17.5 18.2c2.6 1.3-1.4 7 1.6 7.6 3 .6 4.6-5.6 7.9-6'
/** Centers the scribble in the 40×40 tile and scales it to fill it. */
export const MARK_TRANSFORM = 'translate(20 20) scale(1.4) translate(-18.25 -22.35)'

/** An ink tile with a single quick pen scribble. `light` is for dark backgrounds. */
export function Mark({ className = 'size-9', light }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0`} aria-hidden>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill={light ? '#ffffff' : '#1d1b18'} />
      <path
        d={MARK_SCRIBBLE}
        transform={MARK_TRANSFORM}
        fill="none"
        stroke={light ? '#1d1b18' : '#fffdf9'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
