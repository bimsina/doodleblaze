import { MoonStars, PencilSimpleLine } from '@phosphor-icons/react'
import { Band, RoomTop } from '#/components/Poster'
import { useNow } from '#/components/Timer'
import type { RoomConnection } from '#/lib/useRoom'

export function Countdown({ room }: { room: RoomConnection }) {
  const t = useNow(room.now, 100)
  const state = room.state!
  const secs = Math.max(1, Math.ceil(((state.endsAt ?? t) - t) / 1000))
  const last = state.round === state.totalRounds
  return (
    <Band tone="blaze" className="flex flex-1 flex-col">
      <RoomTop room={room} tone="blaze" />
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center pb-16 text-center">
        <p className="text-lg font-bold text-white/80">
          Round {state.round} of {state.totalRounds}
          {last ? ' · last one' : ''}
        </p>
        <p key={secs} className="animate-tick font-display text-[11rem] leading-none font-extrabold sm:text-[14rem]">
          {secs}
        </p>
        <p className="flex items-center gap-2.5 font-display text-2xl font-bold sm:text-3xl">
          <PencilSimpleLine className="size-7 shrink-0" /> Pen ready. The word drops in a second.
        </p>
      </div>
    </Band>
  )
}

/** Shown when the host tries to start while Drishti is taking a break. */
export function RestingNote({ className = '' }: { className?: string }) {
  return (
    <div role="status" className={`flex animate-pop-in items-start gap-3 rounded-3xl bg-sun p-4 text-left text-sm leading-relaxed ${className}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sun">
        <MoonStars className="size-5" weight="fill" />
      </span>
      <p>
        <b className="font-display text-base">Drishti is resting its eyes.</b>
        <br />
        It’s looked at a lot of doodles today. Come back a little later and it’ll be ready to judge again.
      </p>
    </div>
  )
}
