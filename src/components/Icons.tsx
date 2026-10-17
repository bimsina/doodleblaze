type IconProps = { className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const PenIcon = ({ className = 'size-5' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 20l1.2-4.6L15.6 5a2.1 2.1 0 013 3L8.2 18.4 4 20z" />
    <path d="M13.8 6.8l3.4 3.4" />
  </svg>
)

export const EraserIcon = ({ className = 'size-5' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M8.5 19.5h11" />
    <path d="M5.2 14.6l8.6-8.6a2 2 0 012.8 0l2.4 2.4a2 2 0 010 2.8L11.4 19H8.2l-3-3a1 1 0 010-1.4z" />
    <path d="M9.6 10.2l5.2 5.2" />
  </svg>
)

export const UndoIcon = ({ className = 'size-5' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
  </svg>
)

export const CopyIcon = ({ className = 'size-4' }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 5.5V5a1.5 1.5 0 00-1.5-1.5h-8A1.5 1.5 0 004 5v8a1.5 1.5 0 001.5 1.5H6" />
  </svg>
)

export const CheckIcon = ({ className = 'size-4' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const CrownIcon = ({ className = 'size-4' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 8l4 4 4-7 4 7 4-4-1.6 10H5.6L4 8z" />
  </svg>
)

export const FlameIcon = ({ className = 'size-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M12.6 2.2c.3 2.6-.9 4.3-2.3 5.9C8.7 9.9 7 11.8 7 14.8 7 18.2 9.3 21 12.5 21s5.5-2.6 5.5-6c0-2.2-1-3.7-1.9-4.9-.2 1.4-.9 2.4-2 2.8.7-3.5-.2-7.2-1.5-10.7z"
    />
    <path fill="white" opacity=".9" d="M12.4 13.2c-1.6 1.3-2.3 2.4-2.3 3.8 0 1.4 1 2.4 2.3 2.4s2.4-1 2.4-2.5c0-1.2-.7-2.2-2.4-3.7z" />
  </svg>
)

export const ArrowIcon = ({ className = 'size-5' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

export const LinkIcon = ({ className = 'size-4' }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
  </svg>
)
