# Judge lab: local Clef and word testing

Everything here runs against a local Clef, free. Production's Clef on Workers AI is billed, so nothing in this lab should ever point at it.

## Choosing who runs Clef

`JUDGE_MODE=live` uses the real judge, from the provider `CLEF_PROVIDER` names:

| `CLEF_PROVIDER` | Where Clef runs                                                                                                       | Cost   |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| `ollama`        | Any [System One](https://ollama.com/library/clef) endpoint at `CLEF_URL` (`/v1/systemone`), by default a local Ollama | Free   |
| `cloudflare`    | Workers AI through the AI Gateway. Always remote, even in dev, so it needs `wrangler login`                           | Billed |

Production uses `live` and `cloudflare` from `wrangler.jsonc`; `.env.example` defaults to `ollama`, so switching to live mode locally never spends money by accident. `CLEF_API_KEY` is sent as a bearer token, for a hosted System One endpoint that wants one.

## Local Clef

```bash
ollama pull clef   # about 18 GB; needs roughly 26 GB of memory once loaded
```

Then set `JUDGE_MODE=live` and `CLEF_PROVIDER=ollama` in `.env.local` and restart `pnpm dev`. It counts tokens the same way as Workers AI (290 for one drawing), but it may not be the exact same build, so treat local scores as a close guide rather than a promise. On an M2 Max one drawing takes about 3 s (the first check loads the model, up to 2 minutes), so local meters move slower than in production. Ollama caps a choice question at 26 options, so reveal guesses use 26 random words instead of 40.

## Lab endpoint

With `LAB_ENABLED=1` in `.env.local`, the dev server exposes `POST /api/lab/judge` (it reports which mode and provider judged), and rooms accept a `word:<word>` pack to force the next prompt. The original synthetic sketches still run through it:

```bash
node scripts/judge-lab.mjs /tmp/lab '[{"word":"cat","drawings":["cat_2_ears","cat_4_whiskers","written_cat","scribble"],"verdict":true}]'
```

## Test doodles for every word

Every pack word has a test doodle in `scripts/doodles/`, one module per pack, drawn with the small pen in `kit.mjs` (lines, curves, arcs, stars, a slight wobble). Look at them exactly as Drishti sees them, through the game's own rasterizer:

```bash
node --import ./scripts/ts-hooks.mjs scripts/doodles/preview.mjs /tmp/doodles sea food   # PNGs and a contact sheet per pack
```

Then check them against local Clef:

```bash
node --import ./scripts/ts-hooks.mjs scripts/word-check.mjs /tmp/words.json             # every word; or name packs or words
node --import ./scripts/ts-hooks.mjs scripts/word-check.mjs /tmp/words.json spooky cat  # just these
```

`word-check` judges the way rooms do, one drawing per request: the word's own doodle, then each look-alike's doodle (or a scribble) under the same question. A word passes when its own doodle reaches the 75% blaze line and no look-alike's doodle does. It refuses to run unless the dev server uses local Clef, and it skips words whose doodles and look-alikes haven't changed since the last run (`--redo` to run everything, about an hour for all words).

`scripts/ts-hooks.mjs` lets plain Node scripts import the app's TypeScript through the `#/` alias.

What these runs found is in [the Clef research](clef-research.md).
