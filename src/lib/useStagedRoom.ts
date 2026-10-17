// Paces what the screen shows. The server jumps straight from drawing to the
// reveal the instant someone blazes; this holds the drawing screen for a beat
// so the win can land, then moves between phases with a view transition.

import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { RoomConnection } from '#/lib/useRoom'
import type { RoomSnapshot } from '#/shared/protocol'

export type Moment = {
  kind: 'blaze'
  winnerId: string
  winMs: number | null
  /** You're the one who blazed. */
  mine: boolean
}

/** How long the blaze celebration holds before the reveal. Yours lasts a little longer. */
const HOLD_MINE_MS = 2_600
const HOLD_OTHER_MS = 2_000

const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Runs a state change inside a view transition where supported, so phase changes morph instead of cutting. */
export function withTransition(update: () => void) {
  if (typeof document === 'undefined' || !('startViewTransition' in document) || prefersReducedMotion()) {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}

export function useStagedRoom(room: RoomConnection): { view: RoomConnection; moment: Moment | null } {
  const [shown, setShown] = useState<RoomSnapshot | null>(room.state)
  const [moment, setMoment] = useState<Moment | null>(null)
  const shownRef = useRef(shown)
  const latest = useRef(room.state)
  const holding = useRef<ReturnType<typeof setTimeout> | null>(null)
  latest.current = room.state

  useEffect(() => {
    const next = room.state
    const prev = shownRef.current
    if (!next) return
    // While the celebration plays, newer state waits; the timer applies the latest.
    if (holding.current) return
    const show = (state: RoomSnapshot) => {
      shownRef.current = state
      setShown(state)
    }
    if (!prev) return show(next)
    // Same phase (someone joined, a verdict arrived): no transition needed.
    if (prev.phase === next.phase && prev.round === next.round) return show(next)

    const fromDrawing = prev.phase === 'drawing' || prev.phase === 'judging'
    if (next.phase === 'reveal' && fromDrawing && next.result?.reason === 'blaze' && next.result.winnerId) {
      const mine = next.result.winnerId === room.you
      setMoment({ kind: 'blaze', winnerId: next.result.winnerId, winMs: next.result.winMs, mine })
      holding.current = setTimeout(
        () => {
          holding.current = null
          withTransition(() => {
            setMoment(null)
            if (latest.current) show(latest.current)
          })
        },
        prefersReducedMotion() ? 1_200 : mine ? HOLD_MINE_MS : HOLD_OTHER_MS,
      )
      return
    }
    withTransition(() => show(next))
  }, [room.state, room.you])

  useEffect(
    () => () => {
      if (holding.current) clearTimeout(holding.current)
    },
    [],
  )

  const view = useMemo(() => ({ ...room, state: shown }), [room, shown])
  return { view, moment }
}
