import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, CircleNotch, GithubLogo, PencilSimpleLine, Plus, Timer, UsersThree, WarningCircle } from '@phosphor-icons/react'
import { NameField, PosterSplit, Wordmark } from '#/components/Poster'
import { loadIdentity, saveIdentity } from '#/lib/identity'
import { randomName } from '#/lib/names'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Returning players keep their name; everyone else starts with a random one.
  useEffect(() => setName(loadIdentity().name || randomName()), [])

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
    const info = await fetch(`/api/rooms/${clean}`).then((r) => r.json<{ exists: boolean; error?: string }>())
    if (!info.exists) {
      setBusy(false)
      return setError(info.error ?? 'No room with that code. Check it and try again.')
    }
    rememberName()
    await navigate({ to: '/r/$code', params: { code: clean } })
  }

  return (
    <PosterSplit
      corner={
        <a
          href="https://github.com/bimsina/doodleblaze"
          target="_blank"
          rel="noreferrer"
          className="btn btn-glass px-4 py-2 text-sm"
        >
          <GithubLogo className="size-5" weight="fill" /> GitHub
        </a>
      }
      hero={
        <div className="animate-rise">
          <Wordmark />
          <p className="mt-6 max-w-md text-lg leading-snug font-semibold text-white/85 sm:text-2xl">
            Everyone draws the same word. First one the bot recognizes wins.
          </p>
        </div>
      }
    >
      <NameField name={name} onChange={setName} />
      <button className="btn btn-ink mt-7 w-full py-4.5 text-lg" onClick={create} disabled={busy}>
        {busy ? <CircleNotch className="size-5 animate-spin" /> : <Plus className="size-5" />}
        Create a room
      </button>

      <div className="my-6 flex items-center gap-3 text-sm font-semibold text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        or join with a code
        <span className="h-px flex-1 bg-line" />
      </div>

      <form className="flex gap-2" onSubmit={join}>
        <input
          className="min-w-0 flex-1 rounded-full bg-paper-deep px-5 py-3.5 text-center font-display text-lg font-bold tracking-[0.3em] uppercase outline-none placeholder:font-sans placeholder:text-base placeholder:font-semibold placeholder:tracking-normal placeholder:normal-case placeholder:text-ink-faint focus:ring-2 focus:ring-ink"
          placeholder="Room code"
          maxLength={5}
          value={code}
          aria-label="Room code"
          onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, ''))}
        />
        <button className="btn btn-outline px-5" type="submit" disabled={busy}>
          Join <ArrowRight className="size-4" />
        </button>
      </form>
      {error && (
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-blaze-deep">
          <WarningCircle className="size-5 shrink-0" weight="fill" /> {error}
        </p>
      )}
      <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-faint">
        <li className="flex items-center gap-1.5">
          <UsersThree className="size-4" /> 2 to 8 players
        </li>
        <li className="flex items-center gap-1.5">
          <PencilSimpleLine className="size-4" /> 5 rounds
        </li>
        <li className="flex items-center gap-1.5">
          <Timer className="size-4" /> about 5 minutes
        </li>
      </ul>
    </PosterSplit>
  )
}
