# Costs and guards

The demo runs real, billed inference for anyone who opens it, so every Clef call is measured and passes a few guards.

## What a check costs

Measured on the lab doodles with `clef` at $0.24 per million input tokens:

| Request                            | Input tokens | Cost     |
| ---------------------------------- | ------------ | -------- |
| 1 drawing                          | 290          | $0.00007 |
| 4 drawings, batched                | 969          | $0.00023 |
| Reveal guess against 40 words      | 897          | $0.00022 |
| (before trimming) 4 drawings       | 1,372        | $0.00033 |
| (before trimming) guess, 150 words | 3,370        | $0.00081 |

A 256×256 image is 67 tokens; the rest is the question. Rooms judge each drawing in its own request: batching four was 20% cheaper per drawing, but one drawing could pull the next one toward its answer (see [the Clef research](clef-research.md#1-in-a-batch-one-drawing-can-steal-the-next-ones-answer)). Workers AI's free 10,000 neurons a day cover about 2,000 single-drawing checks, and a 2-player game costs roughly 2 cents.

## Guards

| Guard                    | Where                            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI Gateway `doodleblaze` | `src/server/judge.ts`, dashboard | Every Clef call goes through the gateway, tagged with `room`, `kind` (`judge` or `verdict`) and `drawings` metadata. Its analytics show requests, tokens and cost per day; logs can be filtered by room. It also has a hard 300 requests/min sliding rate limit and a $1/day spend limit as last-resort backstops.                                                                                                                                                                                                                                                                                     |
| Judge budget             | `src/server/budget.ts`           | One `JudgeBudget` Durable Object that every room asks before calling Clef. A token bucket allows `JUDGE_PER_MINUTE` (240) requests a minute across all rooms, with bursts of 20, under Workers AI's 300/min account limit. It also sets the pace: if every room judging every 1.5 s would want 2× the budget, every room judges every 3 s (up to 8 s). Busy rooms slow down instead of failing. Canvases held back go first on the next tick, and a blaze only wins once everything drawn before it has been judged. The last look at time-up and the reveal verdicts are always granted, but counted. |
| Daily cap                | `src/server/budget.ts`           | `JUDGE_PER_DAY` (10,000) Clef requests per UTC day: one drawing each, at most about $0.70. Past it, new games pause until midnight UTC; games already running finish.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Pause switch             | KV namespace `FLAGS`             | Set `paused` to pause new games by hand, no deploy needed. Like the daily cap, room creation answers with "Drishti is resting its eyes" and the lobby's start button shows the same note.                                                                                                                                                                                                                                                                                                                                                                                                              |
| Room creation limit      | `src/server.ts`                  | 5 rooms a minute per IP (Workers Rate Limiting binding, counted per Cloudflare location).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

If the budget Durable Object can't be reached, rooms keep judging at a 2 s pace and the gateway's limits still apply.

```bash
# Pause new games (add --ttl 86400 to pause for a day); takes up to a minute to reach every location
npx wrangler kv key put paused 1 --binding FLAGS --remote
# Resume
npx wrangler kv key delete paused --binding FLAGS --remote
```

## Checking the guards

Run bots against a server. Against production every judgement is real inference, a few cents per run:

```bash
node scripts/guard-check.mjs create https://doodleblaze.bimsina.dev     # 6th room in a minute gets a 429
node scripts/guard-check.mjs play https://doodleblaze.bimsina.dev       # one full room plays a round
node scripts/guard-check.mjs load https://doodleblaze.bimsina.dev 3 40  # 3 full rooms at once: judging slows to fit the budget
```

Locally, put lower limits in `.env.local` (for example `JUDGE_PER_MINUTE=30` and `JUDGE_PER_DAY=60`) to watch the pace widen and the daily cap pause new games. With `LAB_ENABLED=1`, `GET /api/lab/budget` shows today's count and the current pace.
