import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { DrishtiEye, Logo } from '#/components/Brand'
import { ArrowIcon, FlameIcon } from '#/components/Icons'
import { loadIdentity, saveIdentity } from '#/lib/identity'

export const Route = createFileRoute('/')({ component: Home })

const STEPS = [
  { title: 'Same word, same time', body: 'Everyone gets the prompt at once. Nobody waits for a turn.' },
  { title: 'Drishti watches live', body: 'An AI judge checks every canvas as you draw. Your meter shows how sure it is.' },
  { title: 'Cross 75% to blaze', body: 'The first drawing Drishti recognizes wins the round. Five rounds, about five minutes.' },
]

function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setName(loadIdentity().name), [])

  const rememberName = () => {
    const identity = loadIdentity()
    saveIdentity({ ...identity, name: name.trim().slice(0, 16) })
  }

  const create = async () => {
    if (!name.trim()) return setError('Pick a name first.')
    setBusy(true)
    setError(null)
    rememberName()
    try {
      const res = await fetch('/api/rooms', { method: 'POST' })
      const body = await res.json<{ code?: string; error?: string }>()
      if (!body.code) throw new Error(body.error ?? 'Could not create a room.')
      await navigate({ to: '/r/$code', params: { code: body.code } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a room.')
      setBusy(false)
    }
  }

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!name.trim()) return setError('Pick a name first.')
    if (clean.length !== 5) return setError('Room codes are 5 letters.')
    setBusy(true)
    setError(null)
    const info = await fetch(`/api/rooms/${clean}`).then((r) => r.json<{ exists: boolean }>())
    if (!info.exists) {
      setBusy(false)
      return setError('No room with that code. Check it and try again.')
    }
    rememberName()
    await navigate({ to: '/r/$code', params: { code: clean } })
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pt-6 pb-10 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <a
          href="https://developers.cloudflare.com/workers-ai/models/clef/"
          className="hidden text-sm font-semibold text-ink-soft hover:text-ink sm:block"
          target="_blank"
          rel="noreferrer"
        >
          Judged by Clef on Workers AI
        </a>
      </header>

      <section className="grid flex-1 items-center gap-8 py-6 sm:gap-10 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="animate-rise">
          <p className="eyebrow">A drawing race against the clock</p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[0.95] font-extrabold tracking-tight sm:text-7xl">
            Draw it fast.
            <br />
            Make the bot{' '}
            <span className="relative inline-block text-blaze">
              see it
              <Squiggle />
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">
            Everyone draws the same word at the same time while Drishti, our AI judge, watches every canvas. The first
            drawing it recognizes wins the round. Stick figures welcome.
          </p>
          <div className="mt-8 hidden items-center gap-3 text-sm font-semibold text-ink-soft sm:flex">
            <DrishtiEye meter={0.5} className="size-10" />
            <span>“Is that… a potato?” — Drishti, probably</span>
          </div>
        </div>

        <div className="card animate-pop-in p-6 sm:p-8">
          <label className="eyebrow" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            className="field mt-2 text-lg"
            placeholder="e.g. Picasso-ish"
            maxLength={16}
            value={name}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-blaze mt-5 w-full py-4 text-lg" onClick={create} disabled={busy}>
            <FlameIcon className="size-5" />
            Create a room
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-bold tracking-widest text-ink-faint uppercase">
            <span className="h-0.5 flex-1 bg-line" />
            or join friends
            <span className="h-0.5 flex-1 bg-line" />
          </div>

          <form className="flex gap-2" onSubmit={join}>
            <input
              className="field flex-1 text-center font-display text-xl tracking-[0.3em] uppercase"
              placeholder="CODE"
              maxLength={5}
              value={code}
              aria-label="Room code"
              onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, ''))}
            />
            <button className="btn" type="submit" disabled={busy} aria-label="Join room">
              Join <ArrowIcon className="size-4" />
            </button>
          </form>
          {error && <p className="mt-4 text-sm font-semibold text-blaze-deep">{error}</p>}
          <p className="mt-5 text-sm text-ink-soft">2 to 8 players. No signup. You can also start alone to practice.</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="animate-rise rounded-2xl border-2 border-ink/10 bg-card/70 p-5" style={{ animationDelay: `${150 + i * 90}ms` }}>
            <span className="font-display text-3xl font-extrabold text-blaze">{i + 1}</span>
            <h2 className="mt-1 font-display text-lg font-bold">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

function Squiggle() {
  return (
    <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-sun" aria-hidden>
      <path d="M3 13c20-9 34 6 54-2s34-8 52 0 36 6 54-2 26-5 34 0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
