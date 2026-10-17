import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DrishtiEye, Logo } from '#/components/Brand'
import { DrawPhase } from '#/components/DrawPhase'
import { ArrowIcon } from '#/components/Icons'
import { Lobby } from '#/components/Lobby'
import { Final, Reveal } from '#/components/Reveal'
import { Centered, Countdown, RoomHeader } from '#/components/RoomChrome'
import { loadIdentity, saveIdentity } from '#/lib/identity'
import type { Identity } from '#/lib/identity'
import { useRoom } from '#/lib/useRoom'

export const Route = createFileRoute('/r/$code')({
  component: RoomPage,
  head: ({ params }) => ({ meta: [{ title: `Room ${params.code.toUpperCase()} · Doodleblaze` }] }),
})

function RoomPage() {
  const { code: rawCode } = Route.useParams()
  const code = rawCode.toUpperCase()
  const [identity, setIdentity] = useState<Identity | null>(null)
  useEffect(() => setIdentity(loadIdentity()), [])

  if (!identity) return <Shell />
  if (!identity.name) {
    return (
      <Shell>
        <NameGate
          code={code}
          onJoin={(name) => {
            const next = { ...identity, name }
            saveIdentity(next)
            setIdentity(next)
          }}
        />
      </Shell>
    )
  }
  return <Game code={code} identity={identity} />
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-6 pb-10 sm:px-8">
      <header>
        <Logo />
      </header>
      {children}
    </main>
  )
}

function NameGate({ code, onJoin }: { code: string; onJoin: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <Centered>
      <form
        className="card w-full max-w-sm animate-pop-in p-6 text-left"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onJoin(name.trim().slice(0, 16))
        }}
      >
        <p className="eyebrow">You’re invited to room {code}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">What should we call you?</h1>
        <input
          className="field mt-5 text-lg"
          autoFocus
          maxLength={16}
          placeholder="Your name"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-blaze mt-4 w-full py-3.5 text-lg" disabled={!name.trim()}>
          Join the room <ArrowIcon className="size-5" />
        </button>
      </form>
    </Centered>
  )
}

function Game({ code, identity }: { code: string; identity: Identity }) {
  const room = useRoom(code, identity)
  const state = room.state

  let body: React.ReactNode
  if (room.error && room.status === 'closed') {
    body = (
      <Centered>
        <DrishtiEye className="size-16" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">{room.error.message}</h1>
        <Link to="/" className="btn btn-blaze mt-6">
          Start a new room <ArrowIcon className="size-4" />
        </Link>
      </Centered>
    )
  } else if (!state) {
    body = (
      <Centered>
        <DrishtiEye className="size-14 animate-pulse" />
        <p className="mt-4 font-semibold text-ink-soft">Opening room {code}…</p>
      </Centered>
    )
  } else if (state.phase === 'lobby') {
    body = <Lobby room={room} />
  } else if (state.phase === 'countdown') {
    body = <Countdown room={room} />
  } else if (state.phase === 'drawing' || state.phase === 'judging') {
    body = <DrawPhase room={room} />
  } else if (state.phase === 'reveal') {
    body = <Reveal room={room} />
  } else {
    body = <Final room={room} />
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-6 pb-10 sm:px-8">
      <RoomHeader room={room} />
      {body}
    </main>
  )
}
