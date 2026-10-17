import { useState } from 'react'
import {
  Cards,
  Check,
  Crown,
  Hamburger,
  HourglassMedium,
  Lamp,
  LinkSimple,
  PawPrint,
  Play,
  Plus,
  Shuffle,
  Target,
  Timer,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Avatar } from '#/components/Avatar'
import { Band, Body, RoomTop } from '#/components/Poster'
import { RestingNote } from '#/components/RoomChrome'
import { MAX_PLAYERS, ROUND_MS, TOTAL_ROUNDS } from '#/shared/protocol'
import { PACKS } from '#/shared/prompts'
import type { RoomConnection } from '#/lib/useRoom'

const PACK_ICONS: Record<string, Icon> = {
  mixed: Shuffle,
  animals: PawPrint,
  food: Hamburger,
  objects: Lamp,
}

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
        await navigator.share({
          title: 'Doodleblaze',
          text: 'Come draw with me on Doodleblaze',
          url,
        })
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
    <>
      <Band tone="blaze">
        <RoomTop room={room} tone="blaze" />
        <div className="flex flex-col items-center pt-1 pb-10 text-center sm:pb-12">
          <p className="font-bold text-white/80">Room code</p>
          <p className="mt-1 font-display text-6xl font-extrabold tracking-[0.12em] sm:text-7xl">
            {state.code}
          </p>
          <button className="btn btn-glass mt-4 px-5 py-2.5" onClick={invite}>
            {copied ? (
              <Check className="size-5" />
            ) : (
              <LinkSimple className="size-5" />
            )}
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
          <Seats room={room} invite={invite} />
        </div>
      </Band>

      <Body className="flex max-w-3xl! flex-col gap-8 pb-0! sm:pt-10">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <Cards className="size-5 self-center" /> Word pack
            </p>
            <span className="text-sm font-semibold text-ink-faint">
              {isHost ? 'you pick' : 'the host picks'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PACKS.map((pack) => {
              const selected = state.pack === pack.id
              const PackIcon = PACK_ICONS[pack.id]
              return (
                <button
                  key={pack.id}
                  disabled={!isHost}
                  aria-pressed={selected}
                  onClick={() => room.send({ t: 'pack', pack: pack.id })}
                  className={`flex flex-col gap-2.5 rounded-2xl p-3.5 text-left transition-colors disabled:cursor-default sm:p-4 ${
                    selected
                      ? 'bg-ink text-white'
                      : 'bg-paper-deep enabled:hover:bg-line'
                  } ${!isHost && !selected ? 'opacity-55' : ''}`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl ${selected ? 'bg-sun text-ink' : 'bg-white text-ink-soft'}`}
                  >
                    <PackIcon
                      className="size-5"
                      weight={selected ? 'fill' : 'bold'}
                    />
                  </span>
                  <span>
                    <span className="block font-bold">{pack.name}</span>
                    <span
                      className={`block text-sm leading-snug ${selected ? 'text-white/65' : 'text-ink-faint'}`}
                    >
                      {pack.blurb}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* On phones the start button rides along at the bottom of the screen. */}
        <div className="sticky bottom-0 -mx-5 bg-linear-to-t from-white from-70% to-white/0 px-5 pt-6 pb-5 sm:-mx-10 sm:px-10 lg:static lg:m-0 lg:bg-none lg:p-0 lg:pb-12">
          <div className="mx-auto max-w-md">
            {room.resting && <RestingNote className="mb-4" />}
            {isHost ? (
              <button
                className="btn btn-blaze w-full py-5 text-xl"
                onClick={() => room.send({ t: 'start' })}
              >
                <Play className="size-6" weight="fill" />
                {connected.length <= 1
                  ? 'Start solo practice'
                  : `Start with ${connected.length} players`}
              </button>
            ) : (
              <p className="flex items-center justify-center gap-2 rounded-full bg-paper-deep py-5 font-bold text-ink-soft">
                <HourglassMedium className="size-5" /> Waiting for{' '}
                {host?.name ?? 'the host'} to start…
              </p>
            )}
            <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-faint">
              <li className="flex items-center gap-1.5">
                <Timer className="size-4" /> {TOTAL_ROUNDS} rounds of{' '}
                {ROUND_MS / 1000}s
              </li>
              <li className="flex items-center gap-1.5">
                <Target className="size-4" /> first to 75% wins
              </li>
            </ul>
          </div>
        </div>
      </Body>
    </>
  )
}

/** Every seat at the table: the players, one seat that invites, and the empty rest. */
function Seats({ room, invite }: { room: RoomConnection; invite: () => void }) {
  const state = room.state!
  const empty = MAX_PLAYERS - state.players.length
  return (
    <ul
      className="mx-auto mt-9 grid w-full max-w-sm grid-cols-4 gap-x-2 gap-y-5 sm:max-w-none sm:grid-cols-8"
      aria-label="Players"
    >
      {state.players.map((p, i) => (
        <li
          key={p.id}
          className={`flex min-w-0 animate-pop-in flex-col items-center gap-2.5 ${p.connected ? '' : 'opacity-45'}`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span className="relative">
            <Avatar
              name={p.name}
              color={p.color}
              className="size-16 text-2xl ring-4 ring-white sm:size-[4.5rem]"
            />
            {p.host && (
              <span
                className="absolute -top-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-sun text-ink ring-3 ring-blaze"
                title="Host"
              >
                <Crown className="size-4" weight="fill" />
              </span>
            )}
            {p.id === room.you && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] leading-none font-bold">
                you
              </span>
            )}
          </span>
          <span className="line-clamp-2 w-full text-center text-[13px] leading-tight font-bold break-words sm:text-sm">
            {p.name}
          </span>
        </li>
      ))}
      {Array.from({ length: empty }, (_, i) =>
        i === 0 ? (
          <li key="invite" className="flex flex-col items-center gap-2.5">
            <button
              onClick={invite}
              aria-label="Invite a friend"
              className="flex size-16 items-center justify-center rounded-full border-[2.5px] border-dashed border-white/70 transition-colors hover:bg-white/15 sm:size-[4.5rem]"
            >
              <Plus className="size-6" />
            </button>
            <span className="text-[13px] font-bold text-white/85 sm:text-sm">
              Invite
            </span>
          </li>
        ) : (
          <li key={i} className="flex flex-col items-center" aria-hidden>
            <span className="size-16 rounded-full border-[2.5px] border-dashed border-white/25 sm:size-[4.5rem]" />
          </li>
        ),
      )}
    </ul>
  )
}
