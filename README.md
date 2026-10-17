# Doodleblaze

A multiplayer drawing race. Everyone draws the same word at the same time while Drishti, an AI judge, watches every canvas. The first drawing Drishti recognizes (past 75%) wins the round.

Live at **https://doodleblaze.bimsina.dev**. Runs entirely on Cloudflare.

## Built with

- [Cloudflare Workers](https://developers.cloudflare.com/workers/) with [TanStack Start](https://tanstack.com/start) (React, SSR)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/) for rooms: WebSockets, alarms, SQLite-backed state
- [Workers AI](https://developers.cloudflare.com/workers-ai/) running [Clef](https://developers.cloudflare.com/workers-ai/models/clef/), Cloudflare's decision model, as the judge
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) for deploys from GitHub
- Tailwind CSS v4

## How it works

- **Worker** (`src/server.ts`): TanStack Start app plus a small API: `POST /api/rooms` creates a room, `/api/rooms/:code/ws` joins it.
- **Room Durable Object** (`src/server/room.ts`): one per room code. Holds the game state, the WebSocket connections, the phase timers (alarms), and the judging loop.
- **Strokes, not images.** Clients stream pen strokes; the room rasterizes them server-side into a 256×256 grayscale PNG (`src/server/raster.ts`). Nobody can upload a photo, and messages stay tiny.
- **Drishti** (`src/server/judge.ts`): Cloudflare's [Clef](https://developers.cloudflare.com/workers-ai/models/clef/) decision model on Workers AI. Each check asks a `choice` question (the word, three look-alike distractors, "something else", "scribble") plus a `noul` question ("does it contain writing?"). The meter is the target's probability, sharpened with temperature 0.7 and zeroed out by writing.
  - Changed canvases are judged at most once a second, batched up to 4 drawings per Clef request (~340 input tokens per drawing, about $0.00008).
  - Winners are ordered by when their strokes arrived, not by when Clef answered.
  - At the reveal, each drawing gets one more check against the whole vocabulary (~150 words), which produces the "8% sure this is a boomerang" verdicts.

## Develop

```bash
pnpm install
pnpm dev
```

Workers AI always runs remotely, so `pnpm dev` needs `wrangler login` and uses real (billed) inference.

### Tuning the judge

With `LAB_ENABLED=1` in `.env.local`, the dev server exposes `POST /api/lab/judge`, and rooms accept a `word:<word>` pack to force the next prompt. Run synthetic doodles through it:

```bash
node scripts/judge-lab.mjs /tmp/lab '[{"word":"cat","drawings":["cat_2_ears","cat_4_whiskers","written_cat","scribble"],"verdict":true}]'
```

Prompt packs and distractors live in `src/shared/prompts.ts`; timings and scoring in `src/shared/protocol.ts`.

## Deploy

Pushing to `main` deploys through Workers Builds. The Worker is served only on the custom domain (`workers_dev` and preview URLs are off).
