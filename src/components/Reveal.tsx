import { Avatar } from '#/components/Avatar'
import { DrishtiEye } from '#/components/Brand'
import { CrownIcon, FlameIcon } from '#/components/Icons'
import { useNow } from '#/components/Timer'
import { verdictLine } from '#/lib/drishti'
import type { RoomConnection } from '#/lib/useRoom'
import type { PublicPlayer } from '#/shared/protocol'

export function Reveal({ room }: { room: RoomConnection }) {
  const state = room.state!
  const result = state.result
  const t = useNow(room.now, 250)
  if (!result) return null
  const player = (id: string | null) => state.players.find((p) => p.id === id)
  const name = (id: string | null) => player(id)?.name ?? 'Someone'
  const winnerIsMe = result.winnerId === room.you
  const secs = Math.max(0, Math.ceil(((state.endsAt ?? t) - t) / 1000))
  const last = state.round >= state.totalRounds
  const winnerMeter = result.drawings.find((d) => d.playerId === result.winnerId)?.meter ?? 0

  let headline: string
  let sub: string
  if (result.reason === 'blaze') {
    const time = result.winMs != null ? `${(result.winMs / 1000).toFixed(1)}s` : ''
    headline = winnerIsMe ? `You blazed it in ${time}!` : `${name(result.winnerId)} blazed it in ${time}`
    sub = `+100 points. The word was “${result.word}”.`
  } else if (result.reason === 'timeout') {
    headline = winnerIsMe ? 'Time! You got the closest.' : `Time! ${name(result.winnerId)} got the closest.`
    sub = `${Math.round(winnerMeter * 100)}% sure it was “${result.word}”. +20 points.`
  } else {
    headline = 'Time! Drishti saw nothing.'
    sub = `Nobody got through. The word was “${result.word}”.`
  }

  const drawings = [...result.drawings].sort((a, b) =>
    a.playerId === result.winnerId ? -1 : b.playerId === result.winnerId ? 1 : b.meter - a.meter,
  )

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-rise">
          <p className="eyebrow">
            Round {result.round} of {state.totalRounds}
          </p>
          <h1 className="mt-1 font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">{headline}</h1>
          <p className="mt-2 text-lg text-ink-soft">{sub}</p>
        </div>
        <p className="rounded-full border-2 border-ink bg-card px-4 py-2 text-sm font-bold">
          {last ? 'Final results' : 'Next round'} in {secs}s
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {drawings.map((d, i) => {
            const won = d.playerId === result.winnerId
            return (
              <li
                key={d.playerId}
                className={`card animate-pop-in overflow-hidden p-0 ${won ? 'ring-4 ring-blaze/40' : ''}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative border-b-2 border-ink bg-white">
                  <img src={d.image} alt={`${name(d.playerId)}’s drawing`} className="aspect-square w-full" />
                  {won && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-blaze px-2 py-0.5 text-xs font-extrabold text-white">
                      <FlameIcon className="size-3.5" /> {result.reason === 'blaze' ? 'Blazed' : 'Closest'}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 rounded-full border-2 border-ink bg-card px-2 py-0.5 text-xs font-extrabold tabular-nums">
                    {Math.round(d.meter * 100)}%
                  </span>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={name(d.playerId)} color={player(d.playerId)?.color ?? 0} className="size-6 text-[0.65rem]" />
                    <span className="truncate text-sm font-bold">{name(d.playerId)}</span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-ink-soft">
                    <DrishtiEye meter={d.verdict?.label === result.word ? 0.8 : 0.1} className="mt-px size-5 shrink-0" />
                    <span>
                      {d.blank
                        ? 'An empty canvas. Brave.'
                        : d.verdict
                          ? verdictLine(d.verdict.label, d.verdict.p, result.word)
                          : 'Squinting…'}
                    </span>
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <Scoreboard players={state.players} you={room.you} />
      </div>
    </div>
  )
}

function Scoreboard({ players, you }: { players: PublicPlayer[]; you: string | null }) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  return (
    <section className="card h-fit p-5">
      <p className="eyebrow">Scores</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {ranked.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-4 font-display font-extrabold text-ink-faint">{i + 1}</span>
            <Avatar name={p.name} color={p.color} className="size-7 text-xs" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {p.name}
              {p.id === you && <span className="ml-1.5 text-xs text-ink-faint">you</span>}
            </span>
            <span className="font-display font-extrabold tabular-nums">{p.score}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Final({ room }: { room: RoomConnection }) {
  const state = room.state!
  const me = state.players.find((p) => p.id === room.you)
  const ranked = [...state.players].sort((a, b) => b.score - a.score)
  const podium = [ranked.at(1), ranked.at(0), ranked.at(2)]
  // Ties share a place: 1 + the number of players who scored strictly more.
  const placeOf = (score: number) => 1 + ranked.filter((p) => p.score > score).length
  const places = podium.map((p) => (p ? placeOf(p.score) : 0))
  const heightFor = (place: number) => (place === 1 ? 'h-40' : place === 2 ? 'h-28' : 'h-20')
  const winner = ranked[0]
  const tie = ranked.length > 1 && ranked[1].score === winner.score
  const blazes = (id: string) => state.history.filter((h) => h.winnerId === id).length

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <p className="eyebrow">Game over</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
        {winner.score === 0 ? 'Drishti wins this one.' : tie ? 'It’s a tie at the top!' : `${winner.name} takes it!`}
      </h1>

      <div className="mt-12 flex items-end justify-center gap-3 sm:gap-5">
        {podium.map((p, i) =>
          p ? (
            <div key={p.id} className="flex w-24 animate-rise flex-col items-center sm:w-32" style={{ animationDelay: `${i * 120}ms` }}>
              {places[i] === 1 && <CrownIcon className="mb-1 size-7 text-sun" />}
              <Avatar name={p.name} color={p.color} className="size-14 text-xl" />
              <span className="mt-2 w-full truncate font-bold">{p.name}</span>
              <span className="font-display text-xl font-extrabold tabular-nums">{p.score}</span>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-2xl border-2 border-b-0 border-ink pt-2 font-display text-3xl font-extrabold ${heightFor(places[i])} ${places[i] === 1 ? 'bg-blaze text-white' : 'bg-card'}`}
              >
                {places[i]}
              </div>
            </div>
          ) : (
            <div key={i} className="w-24 sm:w-32" />
          ),
        )}
      </div>
      <div className="h-0.5 w-full max-w-md bg-ink" />

      {ranked.length > 3 && (
        <ol className="mt-6 w-full max-w-md text-left">
          {ranked.slice(3).map((p) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-line py-2">
              <span className="w-5 font-display font-extrabold text-ink-faint">{placeOf(p.score)}</span>
              <Avatar name={p.name} color={p.color} className="size-7 text-xs" />
              <span className="flex-1 truncate font-semibold">{p.name}</span>
              <span className="font-display font-extrabold">{p.score}</span>
            </li>
          ))}
        </ol>
      )}

      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {state.history.map((h) => (
          <li key={h.round} className="rounded-full border-2 border-ink/15 bg-card px-3 py-1 text-sm">
            <b>{h.word}</b>
            <span className="text-ink-soft"> · {h.winnerId ? (state.players.find((p) => p.id === h.winnerId)?.name ?? '?') : 'nobody'}</span>
          </li>
        ))}
      </ul>
      {me && me.score > 0 && (
        <p className="mt-4 text-sm text-ink-soft">
          You won {blazes(me.id)} of {state.history.length} rounds.
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {me?.host ? (
          <>
            <button className="btn btn-blaze px-6 py-4 text-lg" onClick={() => room.send({ t: 'start' })}>
              <FlameIcon className="size-5" /> Play again
            </button>
            <button className="btn px-6 py-4 text-lg" onClick={() => room.send({ t: 'again' })}>
              Back to lobby
            </button>
          </>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-ink/25 px-6 py-4 font-semibold text-ink-soft">
            Waiting for the host to start another game…
          </p>
        )}
      </div>
    </div>
  )
}
