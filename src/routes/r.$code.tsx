import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, CircleNotch, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { Mark } from '#/components/Brand'
import { DrawPhase } from '#/components/DrawPhase'
import { Lobby } from '#/components/Lobby'
import { NameField, PosterSplit } from '#/components/Poster'
import { Final, Reveal } from '#/components/Reveal'
import { Countdown } from '#/components/RoomChrome'
import { loadIdentity, saveIdentity } from '#/lib/identity'
import type { Identity } from '#/lib/identity'
import { randomName } from '#/lib/names'
import { useRoom } from '#/lib/useRoom'
import { useStagedRoom } from '#/lib/useStagedRoom'

export const Route = createFileRoute('/r/$code')({
  component: RoomPage,
  head: ({ params }) => {
    const code = params.code.toUpperCase()
    // What an invite link shows when pasted into a chat.
    return {
      meta: [
        { title: `Room ${code} · Doodleblaze` },
        { property: 'og:title', content: `Join my Doodleblaze room: ${code}` },
        { property: 'og:description', content: 'Everyone draws the same word. First one the bot recognizes wins.' },
      ],
    }
  },
})

function RoomPage() {
  const { code: rawCode } = Route.useParams()
  const code = rawCode.toUpperCase()
  const [identity, setIdentity] = useState<Identity | null>(null)
  useEffect(() => setIdentity(loadIdentity()), [])

  if (!identity) return <main className="min-h-dvh bg-blaze" />
  if (!identity.name) {
    return (
      <NameGate
        code={code}
        onJoin={(name) => {
          const next = { ...identity, name }
          saveIdentity(next)
          setIdentity(next)
        }}
      />
    )
  }
  return <Game code={code} identity={identity} />
}

/** For people arriving from an invite link: a name (random to start), then straight in. */
function NameGate({ code, onJoin }: { code: string; onJoin: (name: string) => void }) {
  const [name, setName] = useState(randomName)
  return (
    <PosterSplit
      hero={
        <div className="animate-rise">
          <p className="text-lg font-semibold text-white/85 sm:text-2xl">You’re invited to room</p>
          <p className="mt-2 font-display text-7xl font-extrabold tracking-[0.12em] sm:text-8xl lg:text-[7.5rem]">{code}</p>
          <p className="mt-6 max-w-md text-lg leading-snug font-semibold text-white/85 sm:text-2xl">
            Everyone draws the same word. First one the bot recognizes wins.
          </p>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onJoin(name.trim().slice(0, 16))
        }}
      >
        <NameField name={name} onChange={setName} />
        <button className="btn btn-ink mt-7 w-full py-4.5 text-lg" disabled={!name.trim()}>
          Join the room <ArrowRight className="size-5" />
        </button>
      </form>
    </PosterSplit>
  )
}

function Game({ code, identity }: { code: string; identity: Identity }) {
  const live = useRoom(code, identity)
  // What's on screen trails the server by a beat when someone blazes (see useStagedRoom).
  const { view: room, moment } = useStagedRoom(live)
  const state = room.state

  if (room.error && room.status === 'closed') {
    return (
      <Message title={room.error.message} icon={<MagnifyingGlass className="size-10" />}>
        <Link to="/" className="btn btn-ink mt-8 px-8 py-4 text-lg">
          <Plus className="size-5" /> Start a new room
        </Link>
      </Message>
    )
  }
  if (!state) return <Message title={`Opening room ${code}…`} icon={<CircleNotch className="size-10 animate-spin" />} />

  return (
    <main className="flex min-h-dvh flex-col">
      {state.phase === 'lobby' && <Lobby room={room} />}
      {state.phase === 'countdown' && <Countdown room={room} />}
      {(state.phase === 'drawing' || state.phase === 'judging') && <DrawPhase room={room} moment={moment} />}
      {state.phase === 'reveal' && <Reveal room={room} />}
      {state.phase === 'final' && <Final room={room} />}
    </main>
  )
}

function Message({ title, icon, children }: { title: string; icon: React.ReactNode; children?: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-blaze px-6 text-center text-white">
      <Link to="/" aria-label="Doodleblaze home" className="absolute top-6 left-6 sm:left-12">
        <Mark className="size-10" />
      </Link>
      <span className="flex size-20 items-center justify-center rounded-full bg-white/15">{icon}</span>
      <h1 className="mt-6 max-w-lg font-display text-4xl font-extrabold sm:text-5xl">{title}</h1>
      {children}
    </main>
  )
}
