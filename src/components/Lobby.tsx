import { useState } from 'react'
import { Avatar } from '#/components/Avatar'
import { DrishtiEye } from '#/components/Brand'
import { CheckIcon, CrownIcon, FlameIcon, LinkIcon } from '#/components/Icons'
import { RestingNote } from '#/components/RoomChrome'
import { MAX_PLAYERS } from '#/shared/protocol'
import { PACKS } from '#/shared/prompts'
import type { RoomConnection } from '#/lib/useRoom'

export function Lobby({ room }: { room: RoomConnection }) {
  const state = room.state!
  const me = state.players.find((p) => p.id === room.you)
  const host = state.players.find((p) => p.host)
  const isHost = !!me?.host
  const connected = state.players.filter((p) => p.connected)
  const [copied, setCopied] = useState(false)

  const invite = async () => {
    const url = `${location.origin}/r/${state.code}`
    try {
      if ('share' in navigator && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Doodleblaze', text: 'Come draw with me on Doodleblaze', url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }
    } catch {
      // Share sheet dismissed or clipboard blocked.
    }
  }

  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[1fr_1.1fr] lg:gap-8">
      <section className="card animate-rise p-6 sm:p-7">
        <p className="eyebrow">Room code</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <span className="font-display text-6xl font-extrabold tracking-[0.18em] sm:text-7xl">{state.code}</span>
          <button className="btn" onClick={invite}>
            {copied ? <CheckIcon className="size-4 text-moss" /> : <LinkIcon className="size-4" />}
            {copied ? 'Link copied' : 'Invite friends'}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="eyebrow">
            Players · {connected.length}/{MAX_PLAYERS}
          </p>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {state.players.map((p, i) => (
            <li
              key={p.id}
              className="flex animate-pop-in items-center gap-3 rounded-2xl border-2 border-ink bg-white px-3 py-2.5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Avatar name={p.name} color={p.color} />
              <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
              {p.host && <CrownIcon className="size-4 text-sun" />}
              {p.id === room.you && <span className="text-xs font-bold text-ink-faint">you</span>}
            </li>
          ))}
          {Array.from({ length: Math.max(0, Math.min(2, MAX_PLAYERS - state.players.length)) }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-ink/25 px-3 py-2.5 text-ink-faint"
            >
              <span className="size-9 rounded-full border-2 border-dashed border-ink/25" />
              <span className="text-sm font-semibold">Waiting for a friend…</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card animate-rise p-6 [animation-delay:80ms] sm:p-7">
        <p className="eyebrow">Prompt pack</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PACKS.map((pack) => {
            const selected = state.pack === pack.id
            return (
              <button
                key={pack.id}
                disabled={!isHost}
                onClick={() => room.send({ t: 'pack', pack: pack.id })}
                className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                  selected ? 'border-ink bg-sun-soft shadow-[var(--shadow-pop)]' : 'border-ink/15 bg-white'
                } ${isHost && !selected ? 'hover:border-ink/50' : ''} ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="flex items-center justify-between font-display text-lg font-bold">
                  {pack.name}
                  {selected && <CheckIcon className="size-5" />}
                </span>
                <span className="text-sm text-ink-soft">{pack.blurb}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-paper-deep p-4 text-sm leading-relaxed text-ink-soft">
          <DrishtiEye className="size-9 shrink-0" meter={0.3} />
          <p>
            5 rounds, 60 seconds each. Everyone draws the same word. Drishti checks every canvas as you draw, and the first
            one past <b className="text-ink">75%</b> wins the round. No writing the word. Drishti can read.
          </p>
        </div>

        {room.resting && <RestingNote className="mt-6" />}
        {isHost ? (
          <button className="btn btn-blaze mt-6 w-full py-4 text-lg" onClick={() => room.send({ t: 'start' })}>
            <FlameIcon className="size-5" />
            {connected.length <= 1 ? 'Start solo practice' : `Start with ${connected.length} players`}
          </button>
        ) : (
          <p className="mt-6 rounded-2xl border-2 border-dashed border-ink/25 py-4 text-center font-semibold text-ink-soft">
            Waiting for {host?.name ?? 'the host'} to start…
          </p>
        )}
      </section>
    </div>
  )
}
