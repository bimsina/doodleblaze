import { Link } from '@tanstack/react-router'

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg'
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5 no-underline" aria-label="Doodleblaze home">
      <Mark className={big ? 'size-12' : 'size-9'} />
      <span className={`font-display font-extrabold tracking-tight text-ink ${big ? 'text-4xl' : 'text-2xl'}`}>
        doodle<span className="text-blaze">blaze</span>
      </span>
    </Link>
  )
}

/** An ink tile with a quick squiggle that flares into a spark. */
export function Mark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 transition-transform group-hover:-rotate-6`} aria-hidden>
      <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="#1d1b18" />
      <path
        d="M9 26c3-6 5.5-9 7.5-8.2 2.4 1-1.6 7.2.8 7.9 2.2.7 4.2-5.4 6.6-5.1 1.8.2 1 3.6 2.6 3.7"
        fill="none"
        stroke="#fffdf9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M29.5 9.5l1.1 3.1 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3.1-1.1 3.1-1.1z" fill="#ff5a1f" />
    </svg>
  )
}

/**
 * Drishti's eye. The iris warms from ink to sun to blaze as the meter climbs,
 * and the pupil drifts toward the drawing.
 */
export function DrishtiEye({ meter = 0, className = 'size-12' }: { meter?: number; className?: string }) {
  const iris = meter >= 0.75 ? '#ff5a1f' : meter >= 0.3 ? '#ffc23d' : '#1d1b18'
  const dilate = 3.2 + Math.min(meter, 1) * 2.2
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <g className="origin-center animate-blink" style={{ transformBox: 'fill-box' }}>
        <path d="M3 24C9 13 16 9 24 9s15 4 21 15c-6 11-13 15-21 15S9 35 3 24z" fill="#fffdf9" stroke="#1d1b18" strokeWidth="2.5" />
        <circle cx="21.5" cy="25" r="9.5" fill={iris} style={{ transition: 'fill 300ms' }} />
        <circle cx="20.5" cy="25.5" r={dilate} fill="#1d1b18" style={{ transition: 'r 300ms' }} />
        <circle cx="24.5" cy="21" r="2.3" fill="#fffdf9" />
      </g>
    </svg>
  )
}
