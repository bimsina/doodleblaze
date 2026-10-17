const PALETTE = ['#ff8a5c', '#4a9eff', '#ffc23d', '#2fa36b', '#a77bff', '#ff6fa8', '#22b5b0', '#c58b4e']

export function Avatar({ name, color, className = 'size-9 text-sm' }: { name: string; color: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-display font-extrabold text-ink ${className}`}
      style={{ backgroundColor: PALETTE[color % PALETTE.length] }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
