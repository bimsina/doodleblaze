import { useState } from 'react'
import {
  Bicycle,
  Cards,
  Check,
  CookingPot,
  Crown,
  FishSimple,
  Ghost,
  Hamburger,
  HandWaving,
  HourglassMedium,
  Lamp,
  LinkSimple,
  MagicWand,
  MaskHappy,
  MusicNotes,
  NotePencil,
  PawPrint,
  Planet,
  Play,
  Plus,
  Shuffle,
  SoccerBall,
  Target,
  Timer,
  Tree,
  TShirt,
  Wrench,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Avatar } from '#/components/Avatar'
import { Band, Body, RoomTop } from '#/components/Poster'
import { RestingNote } from '#/components/RoomChrome'
import { MAX_PLAYERS, ROUND_MS, TOTAL_ROUNDS } from '#/shared/protocol'
import {
  CUSTOM_PACK,
  MAX_WORD_LENGTH,
  MIN_CUSTOM_WORDS,
  PACKS,
  parseWords,
} from '#/shared/prompts'
import type { RoomConnection } from '#/lib/useRoom'

const PACK_ICONS: Record<string, Icon | undefined> = {
  mixed: Shuffle,
  animals: PawPrint,
  sea: FishSimple,
  food: Hamburger,
  objects: Lamp,
  vehicles: Bicycle,
  outdoors: Tree,
  sports: SoccerBall,
  wardrobe: TShirt,
  music: MusicNotes,
  fantasy: MagicWand,
  scifi: Planet,
  spooky: Ghost,
  body: HandWaving,
  tools: Wrench,
  characters: MaskHappy,
  kitchen: CookingPot,
}

/** The host's last list, kept on this device so the next room starts with it. */
const DRAFT_KEY = 'doodleblaze:words'

export function Lobby({ room }: { room: RoomConnection }) {
  const state = room.state!
  const me = state.players.find((p) => p.id === room.you)
  const host = state.players.find((p) => p.host)
  const isHost = !!me?.host
  const connected = state.players.filter((p) => p.connected)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const hasCustom = state.customWords >= MIN_CUSTOM_WORDS

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
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PACKS.map((pack) => (
              <PackCard
                key={pack.id}
                icon={PACK_ICONS[pack.id] ?? Cards}
                name={pack.name}
                blurb={pack.blurb}
                selected={state.pack === pack.id}
                isHost={isHost}
                onClick={() => {
                  setEditing(false)
                  room.send({ t: 'pack', pack: pack.id })
                }}
              />
            ))}
            <PackCard
              icon={NotePencil}
              name={isHost ? 'Your words' : 'Host’s words'}
              blurb={
                hasCustom
                  ? `${state.customWords} secret words`
                  : isHost
                    ? 'Write your own list'
                    : 'Written by the host'
              }
              selected={state.pack === CUSTOM_PACK}
              isHost={isHost}
              expanded={isHost ? editing : undefined}
              onClick={() => {
                if (hasCustom) room.send({ t: 'pack', pack: CUSTOM_PACK })
                setEditing((open) => !open)
              }}
            />
          </div>
          {isHost && editing && (
            <WordsEditor room={room} onClose={() => setEditing(false)} />
          )}
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

function PackCard({
  icon: PackIcon,
  name,
  blurb,
  selected,
  isHost,
  expanded,
  onClick,
}: {
  icon: Icon
  name: string
  blurb: string
  selected: boolean
  isHost: boolean
  expanded?: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={!isHost}
      aria-pressed={selected}
      aria-expanded={expanded}
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl p-3 text-left transition-colors disabled:cursor-default sm:p-4 ${
        selected ? 'bg-ink text-white' : 'bg-paper-deep enabled:hover:bg-line'
      } ${!isHost && !selected ? 'opacity-55' : ''}`}
    >
      <span
        className={`mb-2 flex size-8 items-center justify-center rounded-lg sm:mb-2.5 sm:size-10 sm:rounded-xl ${selected ? 'bg-sun text-ink' : 'bg-white text-ink-soft'}`}
      >
        <PackIcon
          className="size-4 sm:size-5"
          weight={selected ? 'fill' : 'bold'}
        />
      </span>
      <span className="leading-tight font-bold">{name}</span>
      {/* Eighteen cards are a lot on a phone: there, only the picked pack shows its line. */}
      <span
        className={`mt-0.5 text-sm leading-snug ${selected ? 'text-white/65' : 'hidden text-ink-faint sm:block'}`}
      >
        {blurb}
      </span>
    </button>
  )
}

/** The host writes their own pack. Only the host ever sees the words. */
function WordsEditor({
  room,
  onClose,
}: {
  room: RoomConnection
  onClose: () => void
}) {
  const [text, setText] = useState(loadDraft)
  const words = parseWords(text)
  const typed = text.split(/[\n,]/).filter((s) => s.trim()).length
  const skipped = typed - words.length
  const ready = words.length >= MIN_CUSTOM_WORDS

  const edit = (value: string) => {
    setText(value)
    try {
      localStorage.setItem(DRAFT_KEY, value)
    } catch {
      // Storage blocked: the list lasts until the editor closes.
    }
  }

  return (
    <div className="mt-3 animate-pop-in rounded-2xl bg-paper-deep p-4 sm:p-5">
      <label htmlFor="words" className="font-display text-lg font-bold">
        Write your own words
      </label>
      <p className="mt-1 text-sm leading-snug text-ink-soft">
        One per line, or split them with commas. Pick things anyone could draw,
        so Drishti knows them when it sees them. Only you see the list.
      </p>
      <textarea
        id="words"
        rows={6}
        value={text}
        spellCheck={false}
        onChange={(e) => edit(e.target.value)}
        placeholder={'pirate ship\nsnowman\ntoaster\nhot air balloon\nsloth'}
        className="mt-3 w-full resize-y rounded-xl bg-white px-4 py-3 text-base font-semibold outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-ink"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-soft" aria-live="polite">
          {words.length} {words.length === 1 ? 'word' : 'words'}
          {!ready && (
            <span className="text-ink-faint">
              {' '}
              · at least {MIN_CUSTOM_WORDS} to play
            </span>
          )}
          {skipped > 0 && (
            <span className="text-ink-faint">
              {' '}
              · {skipped} skipped (repeats or over {MAX_WORD_LENGTH} letters)
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button className="btn btn-outline px-5 py-2.5" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-ink px-5 py-2.5"
            disabled={!ready}
            onClick={() => {
              room.send({ t: 'words', words })
              onClose()
            }}
          >
            <Check className="size-5" /> Use these words
          </button>
        </div>
      </div>
    </div>
  )
}

function loadDraft() {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
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
