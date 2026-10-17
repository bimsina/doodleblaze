import { Avatar } from '#/components/Avatar'
import { ArrowRight, ArrowsClockwise, Crosshair, Crown, Fire, HourglassMedium, House, Trophy } from '@phosphor-icons/react'
import { Band, Body, RoomTop } from '#/components/Poster'
import { RestingNote } from '#/components/RoomChrome'
import { useNow } from '#/components/Timer'
import { verdictLine } from '#/lib/drishti'
import { CountUp } from '#/lib/useTweened'
import type { RoomConnection } from '#/lib/useRoom'
import { BLAZE_POINTS, CONSOLATION_POINTS } from '#/shared/protocol'
import type { PublicPlayer } from '#/shared/protocol'

export function Reveal({ room }: { room: RoomConnection }) {
  const state = room.state!
  const result = state.result
  const t = useNow(room.now, 250)
  if (!result) return null
  const player = (id: string | null) => state.players.find((p) => p.id === id)
  const name = (id: string | null) => (id === room.you ? 'You' : (player(id)?.name ?? 'Someone'))
  const secs = Math.max(0, Math.ceil(((state.endsAt ?? t) - t) / 1000))
  const last = state.round >= state.totalRounds
  const winnerMeter = result.drawings.find((d) => d.playerId === result.winnerId)?.meter ?? 0

  let headline: React.ReactNode
  let sub: string
  if (result.reason === 'blaze') {
    const time = result.winMs != null ? `${(result.winMs / 1000).toFixed(1)}s` : ''
    headline = (
      <>
        {name(result.winnerId)} blazed it in <span className="text-sun">{time}</span>
      </>
    )
    sub = `+${BLAZE_POINTS} points · the word was ${result.word}`
  } else if (result.reason === 'timeout') {
    headline = (
      <>
        Time! <span className="text-sun">{name(result.winnerId)}</span> got closest
      </>
    )
    sub = `${Math.round(winnerMeter * 100)}% sure it was ${result.word} · +${CONSOLATION_POINTS} points`
  } else {
    headline = 'Time! Drishti saw nothing'
    sub = `Nobody got through · the word was ${result.word}`
  }

  const drawings = [...result.drawings].sort((a, b) =>
    a.playerId === result.winnerId ? -1 : b.playerId === result.winnerId ? 1 : b.meter - a.meter,
  )

  return (
    <div className="flex flex-1 flex-col select-none">
      <Band tone="ink">
        <RoomTop room={room} tone="ink" />
        <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
          <div className="animate-rise">
            <p className="text-sm font-bold text-white/60">
              Round {result.round} of {state.totalRounds}
            </p>
            <h1 className="font-display text-4xl leading-tight font-extrabold sm:text-6xl sm:leading-none">{headline}</h1>
            <p className="mt-3 text-lg font-semibold text-white/70">{sub}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 font-bold">
            {last ? 'Final results' : 'Next round'} in {secs}s <ArrowRight className="size-4" />
          </span>
        </div>
      </Band>

      <Body className="grid max-w-5xl! gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
          {drawings.map((d, i) => {
            const won = d.playerId === result.winnerId
            const p = player(d.playerId)
            return (
              <li key={d.playerId} className="animate-pop-in" style={{ animationDelay: `${i * 70}ms` }}>
                <div className={`relative overflow-hidden rounded-2xl bg-canvas ${won ? 'ring-4 ring-blaze' : ''}`}>
                  {/* Drishti's image is white; multiply blends it into the tile's paper color. */}
                  <img src={d.image} alt={`${name(d.playerId)}’s drawing`} className="aspect-square w-full mix-blend-multiply" draggable={false} />
                  {won && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-blaze px-2 py-0.5 text-xs font-extrabold text-white">
                      {result.reason === 'blaze' ? <Fire className="size-3.5" weight="fill" /> : <Crosshair className="size-3.5" />}
                      {result.reason === 'blaze' ? 'Blazed' : 'Closest'}
                    </span>
                  )}
                  <span className="absolute right-2 bottom-2 rounded-full bg-white px-2 py-0.5 text-xs font-extrabold tabular-nums">
                    {Math.round(d.meter * 100)}%
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Avatar name={p?.name ?? '?'} color={p?.color ?? 0} className="size-6 text-[0.65rem]" />
                  <span className="truncate font-bold">{p?.name ?? 'Someone'}</span>
                </div>
                <p key={d.verdict?.label ?? 'pending'} className="mt-1 animate-rise text-sm leading-snug text-ink-soft">
                  {d.blank ? 'An empty canvas. Brave.' : d.verdict ? verdictLine(d.verdict.label, d.verdict.p, result.word) : 'Squinting…'}
                </p>
              </li>
            )
          })}
        </ul>
        <Scoreboard
          players={state.players}
          you={room.you}
          gained={result.winnerId ? { id: result.winnerId, points: result.reason === 'blaze' ? BLAZE_POINTS : CONSOLATION_POINTS } : null}
        />
      </Body>
    </div>
  )
}

function Scoreboard({
  players,
  you,
  gained,
}: {
  players: PublicPlayer[]
  you: string | null
  /** This round's points, which tick onto the winner's score. */
  gained: { id: string; points: number } | null
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  return (
    <section>
      <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
        <Trophy className="size-4" /> Scores
      </p>
      <ol className="mt-3 flex flex-col gap-3">
        {ranked.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-4 font-display font-extrabold text-ink-faint">{i + 1}</span>
            <Avatar name={p.name} color={p.color} className="size-7 text-xs" />
            <span className="min-w-0 flex-1 truncate font-semibold">
              {p.name}
              {p.id === you && <span className="ml-1.5 text-sm text-ink-faint">you</span>}
            </span>
            <span className="relative font-display text-lg font-extrabold tabular-nums">
              {gained?.id === p.id ? (
                <>
                  <CountUp value={p.score} from={p.score - gained.points} delay={500} />
                  <span className="absolute -top-5 right-0 animate-float-up rounded-full bg-sun px-1.5 text-xs [animation-delay:400ms]">
                    +{gained.points}
                  </span>
                </>
              ) : (
                p.score
              )}
            </span>
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
  const winner = ranked[0]
  const tie = ranked.length > 1 && ranked[1].score === winner.score
  const wins = (id: string) => state.history.filter((h) => h.winnerId === id).length
  const nameOf = (id: string | null) => state.players.find((p) => p.id === id)?.name ?? 'nobody'

  const step = (place: number) =>
    place === 1 ? 'h-40 bg-blaze text-white' : place === 2 ? 'h-28 bg-sun' : 'h-20 bg-paper-deep'
  // The podium builds from third place up, so first place lands last.
  const delayFor = (place: number) => (place === 1 ? 900 : place === 2 ? 450 : 0)

  return (
    <div className="flex flex-1 flex-col">
      <Band tone="blaze">
        <RoomTop room={room} tone="blaze" />
        <div className="animate-rise pt-2 pb-10 text-center">
          <p className="inline-flex items-center gap-2 font-bold text-white/80">
            <Trophy className="size-5" weight="fill" /> Game over
          </p>
          <h1 className="mt-1 font-display text-5xl font-extrabold sm:text-7xl">
            {winner.score === 0 ? 'Drishti wins this one' : tie ? 'It’s a tie at the top!' : `${winner.name} takes it!`}
          </h1>
        </div>
      </Band>

      <Body className="flex max-w-3xl! flex-col items-center">
        <div className="flex items-end justify-center gap-3 sm:gap-5">
          {podium.map((p, i) =>
            p ? (
              <div key={p.id} className="flex w-24 flex-col items-center sm:w-32">
                <div className="flex animate-rise flex-col items-center" style={{ animationDelay: `${delayFor(places[i]) + 450}ms` }}>
                  {places[i] === 1 && (
                    <span className="mb-1 animate-drop-in text-sun" style={{ animationDelay: `${delayFor(1) + 900}ms` }}>
                      <Crown className="size-9" weight="fill" />
                    </span>
                  )}
                  <Avatar name={p.name} color={p.color} className="size-14 text-xl" />
                  <span className="mt-2 w-full truncate text-center font-bold">{p.name}</span>
                  <span className="font-display text-xl font-extrabold tabular-nums">
                    <CountUp value={p.score} delay={delayFor(places[i]) + 450} />
                  </span>
                </div>
                <div
                  className={`mt-2 flex w-full origin-bottom animate-grow-up items-start justify-center rounded-t-2xl pt-2 font-display text-3xl font-extrabold ${step(places[i])}`}
                  style={{ animationDelay: `${delayFor(places[i])}ms` }}
                >
                  {places[i]}
                </div>
              </div>
            ) : (
              <div key={i} className="w-24 sm:w-32" />
            ),
          )}
        </div>
        <div className="h-1 w-full max-w-md rounded-full bg-ink" />

        {ranked.length > 3 && (
          <ol className="mt-6 w-full max-w-md">
            {ranked.slice(3).map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-line py-2.5">
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
            <li key={h.round} className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-4 py-1.5 text-sm">
              <b>{h.word}</b>
              <span className="text-ink-faint">·</span>
              {h.winnerId && <Fire className="size-3.5 text-blaze" weight="fill" />}
              <span className="text-ink-soft">{nameOf(h.winnerId)}</span>
            </li>
          ))}
        </ul>
        {me && me.score > 0 && (
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            You won {wins(me.id)} of {state.history.length} rounds.
          </p>
        )}

        {room.resting && <RestingNote className="mt-8 max-w-md" />}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {me?.host ? (
            <>
              <button className="btn btn-blaze px-8 py-4 text-lg" onClick={() => room.send({ t: 'start' })}>
                <ArrowsClockwise className="size-5" /> Play again
              </button>
              <button className="btn btn-outline px-8 py-4 text-lg" onClick={() => room.send({ t: 'again' })}>
                <House className="size-5" /> Back to lobby
              </button>
            </>
          ) : (
            <p className="flex items-center gap-2 rounded-full bg-paper-deep px-6 py-4 font-bold text-ink-soft">
              <HourglassMedium className="size-5" /> Waiting for the host to start another game…
            </p>
          )}
        </div>
      </Body>
    </div>
  )
}
