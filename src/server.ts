import { env } from 'cloudflare:workers'
import handler from '@tanstack/react-start/server-entry'
import { findWord, VOCABULARY } from '#/shared/prompts'
import type { Stroke } from '#/shared/protocol'
import { budgetStatus, isResting } from '#/server/budget'
import { judgeBatch, judgeMode, optionsFor, verdict } from '#/server/judge'
import type { ClefModel } from '#/server/judge'
import { renderStrokes } from '#/server/raster'

export { Room } from '#/server/room'
export { JudgeBudget } from '#/server/budget'

// Consonants only: easy to read aloud, and codes can't spell words.
const CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ'
const CODE_LENGTH = 5
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    if (url.pathname === '/api/rooms' && request.method === 'POST') return createRoom(request)
    const room = url.pathname.match(/^\/api\/rooms\/([A-Za-z]+)(\/ws)?$/)
    if (room) {
      const code = room[1].toUpperCase()
      if (!CODE_RE.test(code)) return Response.json({ exists: false }, { status: 404 })
      const stub = env.ROOMS.getByName(code)
      if (room[2]) return stub.fetch(request)
      return Response.json(await stub.info())
    }
    if (url.pathname.startsWith('/api/lab/')) return lab(request, url)
    return handler.fetch(request)
  },
}

async function createRoom(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await env.ROOM_CREATE_LIMIT.limit({ key: ip })).success) {
    return Response.json({ error: 'That’s a lot of rooms! Take a breather and try again in a minute.' }, { status: 429 })
  }
  if (await isResting(env)) {
    return Response.json(
      { error: 'Drishti is resting its eyes after a big day of doodles. Come back a little later!' },
      { status: 503 },
    )
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
    const code = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
    if (await env.ROOMS.getByName(code).init(code)) return Response.json({ code })
  }
  return Response.json({ error: 'Could not create a room, try again.' }, { status: 503 })
}

type LabBody = {
  word: string
  drawings: Stroke[][]
  model?: ClefModel
  crop?: boolean
  margin?: number
  temperature?: number
  verdict?: boolean
}

// Developer-only endpoints for tuning the judge. Enabled with LAB_ENABLED=1 in .env.local.
async function lab(request: Request, url: URL) {
  if (env.LAB_ENABLED === '1' && url.pathname === '/api/lab/budget') return Response.json(await budgetStatus(env))
  if (env.LAB_ENABLED !== '1' || request.method !== 'POST' || url.pathname !== '/api/lab/judge') {
    return new Response('Not found', { status: 404 })
  }
  const body = await request.json<LabBody>()
  const prompt = findWord(body.word)
  if (!prompt) return Response.json({ error: `unknown word ${body.word}` }, { status: 400 })
  const model = body.model ?? 'clef'
  const t0 = Date.now()
  const images = await Promise.all(
    body.drawings.map((d) => renderStrokes(d, { crop: body.crop ?? true, margin: body.margin })),
  )
  const renderMs = Date.now() - t0
  const result = await judgeBatch(
    env.AI,
    model,
    prompt,
    optionsFor(prompt),
    images.map((i) => i.dataUrl),
    'lab',
    body.temperature,
  )
  const verdicts = body.verdict
    ? await Promise.all(images.map((i) => verdict(env.AI, model, i.dataUrl, VOCABULARY, 'lab')))
    : undefined
  return Response.json({
    model,
    mode: judgeMode(),
    renderMs,
    ...result,
    verdicts,
    images: images.map((i) => ({ dataUrl: i.dataUrl, bytes: i.bytes, empty: i.empty })),
  })
}
