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
  - Changed canvases are judged at most once a second (less often when the shared budget is tight, see below), batched up to 4 drawings per Clef request (~340 input tokens per drawing, about $0.00008).
  - Winners are ordered by when their strokes arrived, not by when Clef answered.
  - At the reveal, each drawing gets one more check against the whole vocabulary (~150 words), which produces the "8% sure this is a boomerang" verdicts.

## Cost and abuse guards

The demo runs real, billed inference for anyone who opens it, so every Clef call passes a few guards:

| Guard                    | Where                            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Gateway `doodleblaze` | `src/server/judge.ts`, dashboard | Every Clef call goes through the gateway, tagged with `room`, `kind` (`judge` or `verdict`) and `drawings` metadata. Its analytics show requests, tokens and cost per day; logs can be filtered by room. It also has a hard 300 requests/min sliding rate limit and a $10/day spend limit as last-resort backstops.                                                                                                                                                                                                                                                                                      |
| Judge budget             | `src/server/budget.ts`           | One `JudgeBudget` Durable Object that every room asks before calling Clef. A token bucket allows `JUDGE_PER_MINUTE` (240) requests a minute across all rooms, with bursts of 20, under Workers AI's 300/min account limit. It also sets the pace: if every room judging once a second would want 2× the budget, every room judges every 2 s (up to 8 s). Busy rooms slow down instead of failing. Canvases held back go first on the next tick, and a blaze only wins once everything drawn before it has been judged. The last look at time-up and the reveal verdicts are always granted, but counted. |
| Daily cap                | `src/server/budget.ts`           | `JUDGE_PER_DAY` (20,000) Clef requests per UTC day, about $5. Past it, new games pause until midnight UTC; games already running finish.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Pause switch             | KV namespace `FLAGS`             | Set `paused` to pause new games by hand, no deploy needed. Like the daily cap, room creation answers with "Drishti is resting its eyes" and the lobby's start button shows the same note.                                                                                                                                                                                                                                                                                                                                                                                                                |
| Room creation limit      | `src/server.ts`                  | 5 rooms a minute per IP (Workers Rate Limiting binding, counted per Cloudflare location).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

If the budget Durable Object can't be reached, rooms keep judging at a 2 s pace and the gateway's limits still apply.

```bash
# Pause new games (add --ttl 86400 to pause for a day); takes up to a minute to reach every location
npx wrangler kv key put paused 1 --binding FLAGS --remote
# Resume
npx wrangler kv key delete paused --binding FLAGS --remote
```

To check the guards, run bots against a server (each judgement is real inference, a few cents per run):

```bash
node scripts/guard-check.mjs create https://doodleblaze.bimsina.dev     # 6th room in a minute gets a 429
node scripts/guard-check.mjs play https://doodleblaze.bimsina.dev       # one full room plays a round
node scripts/guard-check.mjs load https://doodleblaze.bimsina.dev 3 40  # 3 full rooms at once: judging slows to fit the budget
```

Locally, put lower limits in `.env.local` (for example `JUDGE_PER_MINUTE=30` and `JUDGE_PER_DAY=60`) to watch the pace widen and the daily cap pause new games. With `LAB_ENABLED=1`, `GET /api/lab/budget` shows today's count and the current pace.

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
