import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowCounterClockwise, Eraser, Eye, FlagCheckered, PencilSimple } from '@phosphor-icons/react'
import { DrawingCanvas } from '#/components/DrawingCanvas'
import type { CanvasHandle, Tool } from '#/components/DrawingCanvas'
import { MeterBar, Ring } from '#/components/Meter'
import type { Delta } from '#/components/Meter'
import { BlazeBanner, BlazeBurst, TimeUp } from '#/components/Moments'
import { Band, RoomTop } from '#/components/Poster'
import { TimerBadge } from '#/components/Timer'
import { lineFor, moodFor } from '#/lib/drishti'
import type { RoomConnection } from '#/lib/useRoom'
import type { Moment } from '#/lib/useStagedRoom'

/** A check that moves the meter at least this much shows a "+12" next to it. */
const DELTA_MIN = 0.05

export function DrawPhase({ room, moment }: { room: RoomConnection; moment: Moment | null }) {
  const state = room.state!
  const me = state.players.find((p) => p.id === room.you)
  const waiting = !!me?.waiting
  const judging = state.phase === 'judging'
  const canvasRef = useRef<CanvasHandle>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [hasInk, setHasInk] = useState(false)
  const word = state.word ?? ''

  const meter = room.judge?.meter ?? 0
  const writing = room.judge?.writing ?? false
  const mood = moodFor(hasInk ? meter : 0, hasInk, writing)
  // A new line only when the mood changes, so Drishti doesn't chatter.
  const seed = useMemo(() => Math.floor(Math.random() * 1000), [mood])
  const line = waiting ? 'Watching the others for now.' : lineFor(mood, seed, word, room.judge?.guess ?? null)

  // Show how much the last stroke helped: purposeful feedback, not decoration.
  const [delta, setDelta] = useState<Delta | null>(null)
  const lastMeter = useRef(0)
  useEffect(() => {
    if (!room.judge) return
    const d = room.judge.meter - lastMeter.current
    lastMeter.current = room.judge.meter
    if (d >= DELTA_MIN) setDelta({ value: d, key: room.judge.at })
  }, [room.judge?.at])

  const onPoints = useCallback(
    (id: number, e: boolean, p: number[], end: boolean) => room.send({ t: 'stroke', id, e, p, ...(end && { end }) }),
    [room.send],
  )
  const onUndo = useCallback(() => room.send({ t: 'undo' }), [room.send])

  // After a reconnect, resend strokes in case the room restarted and lost them.
  useEffect(() => {
    const strokes = canvasRef.current?.strokes() ?? []
    if (room.session > 1 && strokes.length) room.send({ t: 'sync', round: state.round, strokes })
  }, [room.session])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        canvasRef.current?.undo()
      } else if (e.key === 'e') setTool('eraser')
      else if (e.key === 'p' || e.key === 'b') setTool('pen')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const others = state.players.filter((p) => p.id !== room.you && !p.waiting)
  const disabled = waiting || judging || !!moment || state.phase !== 'drawing'
  const winner = moment && !moment.mine ? state.players.find((p) => p.id === moment.winnerId) : undefined

  const race =
    others.length === 0 ? (
      <p className="text-sm font-semibold text-ink-faint">Solo practice: just you against the clock.</p>
    ) : (
      <div className="flex flex-wrap gap-x-2 gap-y-3">
        {others.map((p) => (
          <Ring
            key={p.id}
            value={room.meters[p.id] ?? 0}
            name={p.name}
            color={p.color}
            faded={!p.connected}
            celebrate={moment?.winnerId === p.id}
          />
        ))}
      </div>
    )

  return (
    <div className="flex flex-1 flex-col select-none">
      <Band tone="sun">
        <RoomTop room={room} tone="sun" />
        <div className="flex items-end justify-between gap-4 pb-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink/60">
              Round {state.round} of {state.totalRounds} · draw
            </p>
            {/* Long words ("birthday cake") wrap and step down a size instead of being cut off. */}
            <h1
              key={state.round}
              className={`animate-word font-display leading-[0.95] font-extrabold text-balance sm:text-6xl ${word.length > 9 ? 'text-4xl' : 'text-5xl'}`}
            >
              {word}
            </h1>
          </div>
          {state.endsAt && <TimerBadge endsAt={state.endsAt} now={room.now} />}
        </div>
      </Band>

      <div className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-6 px-5 py-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 lg:py-8">
        {/* Phones: the meter sits above the canvas so it stays in view while drawing. */}
        <div className="flex flex-col gap-4 lg:hidden">
          <div>
            <MeterBar value={meter} delta={delta} compact />
            <DrishtiSays line={line} meter={meter} compact />
          </div>
          {others.length > 0 && race}
        </div>

        {/* Sized so the tools stay on screen: stacked layouts also fit the meter and race above the canvas. */}
        <div className="mx-auto flex w-full max-w-[min(100%,calc(100dvh-430px))] min-w-[260px] flex-col items-center lg:max-w-[min(100%,calc(100dvh-270px))]">
          <div className="relative w-full">
            <DrawingCanvas
              key={state.round}
              ref={canvasRef}
              tool={tool}
              disabled={disabled}
              onPoints={onPoints}
              onUndo={onUndo}
              onInkChange={setHasInk}
            />
            {moment?.mine && <BlazeBurst winMs={moment.winMs} />}
            {winner && <BlazeBanner name={winner.name} color={winner.color} winMs={moment!.winMs} />}
            {!moment && judging && <TimeUp />}
            {!moment && waiting && !judging && (
              <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-canvas/80 p-6 text-center backdrop-blur-[2px]">
                <div className="animate-pop-in">
                  <p className="font-display text-4xl font-extrabold">You’re in!</p>
                  <p className="mt-1 font-semibold text-ink-soft">You’ll draw from the next round.</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1">
            <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} label="Pen (P)">
              <PencilSimple className="size-6" />
            </ToolButton>
            <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Eraser (E)">
              <Eraser className="size-6" />
            </ToolButton>
            <ToolButton onClick={() => canvasRef.current?.undo()} label="Undo (Ctrl/⌘ Z)" disabled={disabled}>
              <ArrowCounterClockwise className="size-6" />
            </ToolButton>
          </div>
        </div>

        <aside className="hidden flex-col lg:flex">
          <MeterBar value={meter} delta={delta} />
          <div className="mt-6">
            <DrishtiSays line={line} meter={meter} />
          </div>
          <div className="mt-auto pt-8">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-soft">
              <FlagCheckered className="size-4" /> The race
            </p>
            {race}
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Drishti's running commentary. The eye warms from ink to yellow to orange as the meter climbs. */
function DrishtiSays({ line, meter, compact }: { line: string; meter: number; compact?: boolean }) {
  const tone = meter >= 0.75 ? 'bg-blaze text-white' : meter >= 0.3 ? 'bg-sun text-ink' : 'bg-ink text-white'
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${tone} ${compact ? 'size-7' : 'size-10'}`}
        title="Drishti"
      >
        <Eye className={compact ? 'size-4' : 'size-5'} weight="fill" />
      </span>
      <p
        key={line}
        className={`animate-rise font-semibold ${compact ? 'min-w-0 truncate pt-0.5 text-ink-soft' : 'pt-1 text-xl leading-snug'}`}
      >
        “{line}”
      </p>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-12 items-center justify-center rounded-2xl transition-colors disabled:opacity-40 ${
        active ? 'bg-ink text-white' : 'text-ink-soft enabled:hover:bg-paper-deep'
      }`}
    >
      {children}
    </button>
  )
}
