import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientMessage, RoomSnapshot, ServerMessage } from '#/shared/protocol'
import type { Identity } from '#/lib/identity'

export type Judge = { meter: number; guess: string | null; writing: boolean; at: number }

export type RoomConnection = {
  status: 'connecting' | 'open' | 'reconnecting' | 'closed'
  error: Extract<ServerMessage, { t: 'error' }> | null
  state: RoomSnapshot | null
  you: string | null
  meters: Record<string, number>
  judge: Judge | null
  /** The host tried to start while Drishti is taking a break. Clears once a game starts. */
  resting: boolean
  /** Increments on every successful (re)connect. */
  session: number
  send: (msg: ClientMessage) => void
  /** Server time, using the offset measured on the last state message. */
  now: () => number
}

const FATAL = new Set(['not_found', 'full', 'bad_token', 'bad_request', 'closed'])

export function useRoom(code: string, identity: Identity | null): RoomConnection {
  const [status, setStatus] = useState<RoomConnection['status']>('connecting')
  const [error, setError] = useState<RoomConnection['error']>(null)
  const [state, setState] = useState<RoomSnapshot | null>(null)
  const [you, setYou] = useState<string | null>(null)
  const [meters, setMeters] = useState<Record<string, number>>({})
  const [judge, setJudge] = useState<Judge | null>(null)
  const [resting, setResting] = useState(false)
  const [session, setSession] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const offsetRef = useRef(0)
  const roundRef = useRef<string>('')

  useEffect(() => {
    if (!identity?.name) return
    let stopped = false
    let attempt = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const params = new URLSearchParams({ pid: identity.id, tok: identity.token, name: identity.name })
      const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${code}/ws?${params}`)
      wsRef.current = ws
      let fatal = false
      ws.onopen = () => {
        attempt = 0
        setStatus('open')
        setSession((s) => s + 1)
      }
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string) as ServerMessage
        switch (msg.t) {
          case 'state': {
            offsetRef.current = msg.now - Date.now()
            const roundKey = `${msg.state.round}:${msg.state.phase === 'lobby' ? 'lobby' : 'game'}`
            if (roundKey !== roundRef.current) {
              roundRef.current = roundKey
              setMeters({})
              setJudge(null)
            }
            if (msg.state.phase !== 'lobby' && msg.state.phase !== 'final') setResting(false)
            setState(msg.state)
            setYou(msg.you)
            setError(null)
            break
          }
          case 'meters':
            setMeters((m) => ({ ...m, ...msg.meters }))
            break
          case 'judge':
            setJudge({ meter: msg.meter, guess: msg.guess, writing: msg.writing, at: Date.now() })
            break
          case 'verdict':
            setState((s) => {
              if (!s?.result || s.result.round !== msg.round) return s
              const drawings = s.result.drawings.map((d) =>
                d.playerId === msg.playerId ? { ...d, verdict: { label: msg.label, p: msg.p } } : d,
              )
              return { ...s, result: { ...s.result, drawings } }
            })
            break
          case 'resting':
            setResting(true)
            break
          case 'error':
            if (FATAL.has(msg.code)) fatal = true
            setError(msg)
            break
        }
      }
      ws.onclose = (ev) => {
        if (wsRef.current === ws) wsRef.current = null
        if (stopped || fatal || ev.code === 4001) {
          setStatus('closed')
          return
        }
        setStatus('reconnecting')
        attempt += 1
        timer = setTimeout(connect, Math.min(8_000, 400 * 2 ** attempt))
      }
    }

    connect()
    return () => {
      stopped = true
      clearTimeout(timer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [code, identity])

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }, [])

  const now = useCallback(() => Date.now() + offsetRef.current, [])

  return { status, error, state, you, meters, judge, resting, session, send, now }
}
