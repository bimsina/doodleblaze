// Layout pieces for the Poster look: a bold color band on top, white below.

import { Link } from '@tanstack/react-router'
import { CircleNotch, DiceFive } from '@phosphor-icons/react'
import { Avatar } from '#/components/Avatar'
import { Mark } from '#/components/Brand'
import { randomName } from '#/lib/names'
import type { RoomConnection } from '#/lib/useRoom'

type Tone = 'blaze' | 'sun' | 'ink'

const TONES: Record<Tone, string> = {
  blaze: 'bg-blaze text-white',
  sun: 'bg-sun text-ink',
  ink: 'bg-ink text-white',
}

/** A full-width color band whose content lines up with the page column. */
export function Band({ tone, className = '', children }: { tone: Tone; className?: string; children: React.ReactNode }) {
  return (
    // Named so it morphs (color and height) when the phase changes. See styles.css.
    <div className={`${TONES[tone]} ${className}`} style={{ viewTransitionName: 'band' }}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-10">{children}</div>
    </div>
  )
}

/** The mark (home link) and connection status, at the top of every room band. */
export function RoomTop({ room, tone }: { room: RoomConnection; tone: Tone }) {
  return (
    <div className="flex h-16 items-center justify-between">
      <Link to="/" aria-label="Doodleblaze home" className="transition-transform hover:-rotate-6">
        <Mark className="size-9" light={tone === 'ink'} />
      </Link>
      {room.status === 'reconnecting' && (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tone === 'sun' ? 'bg-ink/10' : 'bg-white/20'}`}>
          <CircleNotch className="size-3.5 animate-spin" />
          Reconnecting…
        </span>
      )}
    </div>
  )
}

/** The page body under a band. */
export function Body({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-10 ${className}`}>{children}</div>
}

/**
 * Home and invite pages: the orange poster with the big wordmark, and a white
 * panel for the form. Stacks on phones, sits side by side on wide screens.
 */
export function PosterSplit({
  hero,
  corner,
  children,
}: {
  hero: React.ReactNode
  /** Sits opposite the mark, in the poster's top row. */
  corner?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1.15fr_1fr]">
      <section className="flex flex-1 flex-col bg-blaze px-6 pt-6 pb-14 text-white sm:px-12 lg:p-14 lg:pb-14">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Doodleblaze home" className="w-fit transition-transform hover:-rotate-6">
            <Mark className="size-10" />
          </Link>
          {corner}
        </div>
        <div className="flex flex-1 flex-col justify-center py-10 lg:py-0">{hero}</div>
      </section>
      <section className="-mt-8 rounded-t-[2rem] bg-white px-6 pt-8 pb-10 sm:px-12 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:p-14">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </section>
    </main>
  )
}

export function Wordmark() {
  return (
    <h1 className="font-display text-[4.5rem] leading-[0.84] font-extrabold tracking-tight sm:text-8xl lg:text-[8.5rem]">
      doodle
      <br />
      blaze
    </h1>
  )
}

/** Name input that starts with a random name; the dice rolls a new one. */
export function NameField({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div>
      <label htmlFor="name" className="text-sm font-bold text-ink-soft">
        You’ll play as
      </label>
      <div className="mt-2 flex items-center gap-3">
        <Avatar name={name} color={2} className="size-12 text-xl" />
        <input
          id="name"
          value={name}
          maxLength={16}
          autoComplete="nickname"
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 border-b-2 border-line bg-transparent py-2 text-2xl font-bold outline-none transition-colors focus:border-ink"
        />
        <button
          type="button"
          onClick={() => onChange(randomName(name))}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paper-deep transition-transform hover:bg-line active:rotate-90"
          aria-label="Pick a random name"
          title="Random name"
        >
          <DiceFive className="size-6" />
        </button>
      </div>
    </div>
  )
}
