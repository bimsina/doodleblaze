import { useState } from 'react'
import { Cards, Check, Crown, Hamburger, HourglassMedium, Lamp, LinkSimple, PawPrint, Play, Shuffle, Target, Timer, UsersThree } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Avatar } from '#/components/Avatar'
import { Band, Body, RoomTop } from '#/components/Poster'
import { RestingNote } from '#/components/RoomChrome'
import { MAX_PLAYERS, ROUND_MS, TOTAL_ROUNDS } from '#/shared/protocol'
import { PACKS } from '#/shared/prompts'
import type { RoomConnection } from '#/lib/useRoom'

const PACK_ICONS: Record<string, Icon> = { mixed: Shuffle, animals: PawPrint, food: Hamburger, objects: Lamp }

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
    <>
      <Band tone="blaze">
        <RoomTop room={room} tone="blaze" />
        <div className="flex flex-col items-center pt-2 pb-10 text-center sm:pb-12">
          <p className="font-bold text-white/80">Share this code with friends</p>
          <p className="mt-1 font-display text-7xl font-extrabold tracking-[0.12em] sm:text-8xl">{state.code}</p>
          <button className="btn btn-glass mt-4 px-5 py-2.5" onClick={invite}>
            {copied ? <Check className="size-5" /> : <LinkSimple className="size-5" />}
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </div>
      </Band>

      <Body className="grid max-w-4xl! gap-10 lg:grid-cols-2 lg:gap-14 lg:py-12">
        <section>
          <p className="flex items-center gap-2 font-bold">
            <UsersThree className="size-5" /> Players <span className="text-ink-faint">· {connected.length} of {MAX_PLAYERS}</span>
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {state.players.map((p, i) => (
              <li
                key={p.id}
                className={`flex animate-pop-in items-center gap-3 rounded-2xl bg-paper-deep/70 px-4 py-3 ${p.connected ? '' : 'opacity-50'}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Avatar name={p.name} color={p.color} />
                <span className="min-w-0 flex-1 truncate text-lg font-semibold">{p.name}</span>
                {p.id === room.you && <span className="text-sm font-bold text-ink-faint">you</span>}
                {p.host && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold">
                    <Crown className="size-3.5" weight="fill" /> Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col">
          <p className="flex items-center gap-2 font-bold">
            <Cards className="size-5" /> Word pack
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PACKS.map((pack) => {
              const selected = state.pack === pack.id
              const PackIcon = PACK_ICONS[pack.id]
              return (
                <button
                  key={pack.id}
                  disabled={!isHost}
                  title={pack.blurb}
                  onClick={() => room.send({ t: 'pack', pack: pack.id })}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-bold transition-colors disabled:cursor-default ${
                    selected ? 'bg-ink text-white' : 'bg-paper-deep text-ink-soft enabled:hover:bg-line'
                  }`}
                >
                  <PackIcon className="size-5" weight={selected ? 'fill' : 'bold'} />
                  {pack.name}
                </button>
              )
            })}
          </div>

          <div className="mt-10 lg:mt-auto">
            {room.resting && <RestingNote className="mb-4" />}
            {isHost ? (
              <button className="btn btn-blaze w-full py-5 text-xl" onClick={() => room.send({ t: 'start' })}>
                <Play className="size-6" weight="fill" />
                {connected.length <= 1 ? 'Start solo practice' : 'Start game'}
              </button>
            ) : (
              <p className="flex items-center justify-center gap-2 rounded-full bg-paper-deep py-5 font-bold text-ink-soft">
                <HourglassMedium className="size-5" /> Waiting for {host?.name ?? 'the host'} to start…
              </p>
            )}
            <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-faint">
              <li className="flex items-center gap-1.5">
                <Timer className="size-4" /> {TOTAL_ROUNDS} rounds of {ROUND_MS / 1000}s
              </li>
              <li className="flex items-center gap-1.5">
                <Target className="size-4" /> first to 75% wins
              </li>
            </ul>
          </div>
        </section>
      </Body>
    </>
  )
}
