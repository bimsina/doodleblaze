import { useState } from 'react'
import { DrishtiEye, Logo } from '#/components/Brand'
import { CheckIcon, CopyIcon } from '#/components/Icons'
import { useNow } from '#/components/Timer'
import type { RoomConnection } from '#/lib/useRoom'

export function RoomHeader({ room, right }: { room: RoomConnection; right?: React.ReactNode }) {
  const state = room.state
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Logo />
      <div className="flex items-center gap-2">
        {room.status === 'reconnecting' && (
          <span className="rounded-full border-2 border-ink bg-sun-soft px-3 py-1 text-xs font-bold">Reconnecting…</span>
        )}
        {right}
        {state && <CodeChip code={state.code} />}
      </div>
    </header>
  )
}

export function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/r/${code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked; the code is still visible.
    }
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5 text-sm font-bold"
      title="Copy invite link"
    >
      <span className="font-display tracking-[0.2em]">{code}</span>
      {copied ? <CheckIcon className="size-4 text-moss" /> : <CopyIcon className="size-4 text-ink-soft" />}
    </button>
  )
}

export function Countdown({ room }: { room: RoomConnection }) {
  const t = useNow(room.now, 100)
  const state = room.state!
  const secs = Math.max(1, Math.ceil(((state.endsAt ?? t) - t) / 1000))
  const blazeRound = state.round === state.totalRounds
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">
        Round {state.round} of {state.totalRounds}
        {blazeRound ? ' · last one' : ''}
      </p>
      <div
        key={secs}
        className="mt-6 flex size-44 animate-pop-in items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-8xl font-extrabold shadow-[var(--shadow-pop-lg)]"
      >
        {secs}
      </div>
      <p className="mt-8 font-display text-2xl font-bold">Pen ready. The word drops in a second.</p>
      <p className="mt-2 text-ink-soft">First one Drishti recognizes wins the round.</p>
    </div>
  )
}

/** Shown when the host tries to start while Drishti is taking a break. */
export function RestingNote({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      className={`flex animate-pop-in items-start gap-3 rounded-2xl border-2 border-ink bg-sun-soft p-4 text-left text-sm leading-relaxed ${className}`}
    >
      <DrishtiEye className="size-9 shrink-0" />
      <p>
        <b className="font-display text-base">Drishti is resting its eyes.</b>
        <br />
        It’s looked at a lot of doodles today. Come back a little later and it’ll be ready to judge again.
      </p>
    </div>
  )
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">{children}</div>
}
