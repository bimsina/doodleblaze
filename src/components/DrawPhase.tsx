import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Avatar } from '#/components/Avatar'
import { DrishtiEye } from '#/components/Brand'
import { DrawingCanvas } from '#/components/DrawingCanvas'
import type { CanvasHandle, Tool } from '#/components/DrawingCanvas'
import { EraserIcon, FlameIcon, PenIcon, UndoIcon } from '#/components/Icons'
import { Meter, MiniMeter } from '#/components/Meter'
import { TimerRing } from '#/components/Timer'
import { lineFor, moodFor } from '#/lib/drishti'
import type { RoomConnection } from '#/lib/useRoom'
import { BLAZE_THRESHOLD, ROUND_MS } from '#/shared/protocol'

export function DrawPhase({ room }: { room: RoomConnection }) {
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
  const line = lineFor(mood, seed, word, room.judge?.guess ?? null)

  const onPoints = useCallback(
    (id: number, e: boolean, p: number[]) => room.send({ t: 'stroke', id, e, p }),
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
  const disabled = waiting || judging || state.phase !== 'drawing'

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="mx-auto w-full max-w-[min(100%,calc(100dvh-260px))] min-w-[280px] lg:mx-0 lg:ml-auto">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">
              Round {state.round} of {state.totalRounds} · draw
            </p>
            <h1 className="truncate font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              {word}
            </h1>
          </div>
          {state.endsAt && <TimerRing endsAt={state.endsAt} totalMs={ROUND_MS} now={room.now} />}
        </div>

        {/* Compact meter for small screens, where the side panel sits below the canvas. */}
        <div className="mb-3 flex items-center gap-3 lg:hidden">
          <DrishtiEye meter={meter} className="size-8 shrink-0" />
          <div className="flex-1">
            <MiniMeter value={meter} />
          </div>
          <span className="w-12 text-right font-display text-xl font-extrabold tabular-nums">{Math.round(meter * 100)}%</span>
        </div>
        <p key={line} className="-mt-1 mb-3 animate-rise truncate text-sm font-semibold text-ink-soft lg:hidden">
          {waiting ? 'Watching the others for now.' : line}
        </p>

        <div className="relative">
          <DrawingCanvas
            key={state.round}
            ref={canvasRef}
            tool={tool}
            disabled={disabled}
            onPoints={onPoints}
            onUndo={onUndo}
            onInkChange={setHasInk}
          />
          {(waiting || judging) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-paper/70 p-6 text-center backdrop-blur-[2px]">
              <div className="card animate-pop-in max-w-xs p-5">
                {judging ? (
                  <>
                    <p className="font-display text-2xl font-extrabold">Time!</p>
                    <p className="mt-1 text-ink-soft">Drishti is taking one last look…</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl font-extrabold">You’re in!</p>
                    <p className="mt-1 text-ink-soft">This round is underway. You’ll draw from the next one.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <ToolButton active={tool === 'pen'} onClick={() => setTool('pen')} label="Pen (P)">
            <PenIcon />
          </ToolButton>
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} label="Eraser (E)">
            <EraserIcon />
          </ToolButton>
          <span className="mx-1 h-8 w-0.5 bg-line" />
          <ToolButton onClick={() => canvasRef.current?.undo()} label="Undo (Ctrl/⌘ Z)" disabled={disabled}>
            <UndoIcon />
          </ToolButton>
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <section className="card p-5">
          <div className="flex items-start gap-3">
            <DrishtiEye meter={meter} className="size-12 shrink-0" />
            <div className="min-w-0">
              <p className="eyebrow">Drishti says</p>
              <p key={line} className="mt-1 animate-rise font-display text-lg leading-snug font-bold">
                {waiting ? 'Watching the others for now.' : line}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <Meter value={meter} />
          </div>
        </section>

        <section className="card p-5">
          <p className="eyebrow">The race</p>
          {others.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Solo practice: it’s you against the clock.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {others.map((p) => {
                const m = room.meters[p.id] ?? 0
                return (
                  <li key={p.id} className={`flex items-center gap-3 ${p.connected ? '' : 'opacity-45'}`}>
                    <Avatar name={p.name} color={p.color} className="size-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        {m >= BLAZE_THRESHOLD && <FlameIcon className="size-4 text-blaze" />}
                      </div>
                      <div className="mt-1">
                        <MiniMeter value={m} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>
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
      className={`btn size-12 p-0 ${active ? 'bg-ink text-paper' : ''}`}
    >
      {children}
    </button>
  )
}
