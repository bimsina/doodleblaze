import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { COORD_MAX, ERASER_WIDTH, PEN_WIDTH } from '#/shared/protocol'
import type { Stroke } from '#/shared/protocol'

export type Tool = 'pen' | 'eraser'

export type CanvasHandle = {
  strokes: () => Stroke[]
  undo: () => void
}

type Props = {
  tool: Tool
  disabled?: boolean
  /** Streams points of the stroke being drawn; same id appends to the same stroke. `end` is the pen lifting. */
  onPoints: (id: number, eraser: boolean, points: number[], end: boolean) => void
  onUndo: () => void
  onInkChange?: (hasInk: boolean) => void
}

// Drishti looks at most every ~1.5 s and waits for the pen to lift, so there's no need to stream faster.
const FLUSH_MS = 250
const MIN_STEP = 3

export const DrawingCanvas = forwardRef<CanvasHandle, Props>(function DrawingCanvas(
  { tool, disabled, onPoints, onUndo, onInkChange },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const activeRef = useRef<{ id: number; pointer: number; pending: number[] } | null>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [side, setSide] = useState(0)

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  const paintStroke = useCallback((c: CanvasRenderingContext2D, s: Stroke, from = 0) => {
    const w = c.canvas.width
    const k = w / COORD_MAX
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.strokeStyle = s.e ? '#ffffff' : '#1d1b18'
    c.fillStyle = c.strokeStyle
    c.lineWidth = (s.e ? ERASER_WIDTH : PEN_WIDTH) * w
    const p = s.p
    if (p.length === 2) {
      c.beginPath()
      c.arc(p[0] * k, p[1] * k, c.lineWidth / 2, 0, Math.PI * 2)
      c.fill()
      return
    }
    c.beginPath()
    const start = Math.max(0, from - 2)
    c.moveTo(p[start] * k, p[start + 1] * k)
    for (let i = start + 2; i + 1 < p.length; i += 2) c.lineTo(p[i] * k, p[i + 1] * k)
    c.stroke()
  }, [])

  const redraw = useCallback(() => {
    const c = ctx()
    if (!c) return
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, c.canvas.width, c.canvas.height)
    for (const s of strokesRef.current) paintStroke(c, s)
  }, [paintStroke])

  const notifyInk = useCallback(() => {
    onInkChange?.(strokesRef.current.some((s) => !s.e))
  }, [onInkChange])

  // Keep the backing store square and crisp at any size and pixel ratio.
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ro = new ResizeObserver(() => {
      const size = Math.round(wrap.clientWidth)
      const px = Math.round(size * Math.min(window.devicePixelRatio || 1, 2))
      if (canvas.width !== px) {
        canvas.width = px
        canvas.height = px
        redraw()
      }
      setSide(size)
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [redraw])

  const flush = useCallback(
    (end = false) => {
      const a = activeRef.current
      if (!a || (a.pending.length === 0 && !end)) return
      const s = strokesRef.current[a.id]
      onPoints(a.id, s.e, a.pending, end)
      a.pending = []
    },
    [onPoints],
  )

  useEffect(() => {
    const t = setInterval(() => flush(), FLUSH_MS)
    return () => clearInterval(t)
  }, [flush])

  const undo = useCallback(() => {
    if (activeRef.current || strokesRef.current.length === 0) return
    strokesRef.current.pop()
    redraw()
    notifyInk()
    onUndo()
  }, [notifyInk, onUndo, redraw])

  useImperativeHandle(ref, () => ({ strokes: () => strokesRef.current, undo }), [undo])

  const toCoords = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * COORD_MAX)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * COORD_MAX)
    return [Math.min(COORD_MAX, Math.max(0, x)), Math.min(COORD_MAX, Math.max(0, y))] as const
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || activeRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [x, y] = toCoords(e)
    const stroke: Stroke = { e: tool === 'eraser', p: [x, y] }
    strokesRef.current.push(stroke)
    activeRef.current = { id: strokesRef.current.length - 1, pointer: e.pointerId, pending: [x, y] }
    const c = ctx()
    if (c) paintStroke(c, stroke)
    notifyInk()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    const a = activeRef.current
    if (!a || a.pointer !== e.pointerId) return
    const s = strokesRef.current[a.id]
    const events = 'getCoalescedEvents' in e.nativeEvent ? e.nativeEvent.getCoalescedEvents() : []
    const samples = events.length ? events : [e.nativeEvent]
    const before = s.p.length
    for (const ev of samples) {
      const [x, y] = toCoords(ev)
      const lx = s.p[s.p.length - 2]
      const ly = s.p[s.p.length - 1]
      if (Math.hypot(x - lx, y - ly) < MIN_STEP) continue
      s.p.push(x, y)
      a.pending.push(x, y)
    }
    const c = ctx()
    if (c && s.p.length > before) paintStroke(c, s, before)
  }

  const endStroke = (e: React.PointerEvent) => {
    const a = activeRef.current
    if (!a || a.pointer !== e.pointerId) return
    flush(true)
    activeRef.current = null
  }

  useEffect(() => {
    if (disabled && activeRef.current) {
      flush(true)
      activeRef.current = null
    }
  }, [disabled, flush])

  const eraserSize = ERASER_WIDTH * side

  return (
    <div
      ref={wrapRef}
      className="relative aspect-square w-full overflow-hidden rounded-[1.25rem] border-2 border-ink bg-white shadow-[var(--shadow-pop-lg)]"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none ${disabled ? 'cursor-not-allowed' : tool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={() => setCursor(null)}
      />
      {tool === 'eraser' && cursor && !disabled && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-ink/60 bg-white/40"
          style={{
            width: eraserSize,
            height: eraserSize,
            left: cursor.x - eraserSize / 2,
            top: cursor.y - eraserSize / 2,
          }}
        />
      )}
    </div>
  )
})
