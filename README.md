# Doodleblaze

![Doodleblaze: a doodle of a giraffe stamped "Blazed!" with its meter past the 75% blaze line](public/og.png)

A multiplayer drawing race. Everyone draws the same word at once while Drishti, an AI judge, watches every canvas. The first drawing Drishti recognizes past 75% wins the round.

Play it at **https://doodleblaze.bimsina.dev**.

https://github.com/user-attachments/assets/d08ae048-e96a-4ca1-adee-a5aabef8bc71

- **431 words in 16 packs**, from Animals to Sci-fi & space and Characters, each [tested against the judge](docs/clef-research.md).
- **Your own words:** the host can write a pack of 5 to 100 words for the room.
- **Up to 8 players**, 5 rounds of 60 seconds, no sign-up.

## How it works

- **Built on Cloudflare:** [Workers](https://developers.cloudflare.com/workers/) with [TanStack Start](https://tanstack.com/start), one [Durable Object](https://developers.cloudflare.com/durable-objects/) per room for game state and WebSockets, and [Clef](https://developers.cloudflare.com/workers-ai/models/clef/) on Workers AI as the judge.
- **Strokes, not images.** Players stream pen strokes and the room draws them into a 256×256 PNG, so nobody can upload a photo.
- **One question per drawing.** Drishti asks Clef to pick between the word, three look-alikes, "something else", "scribble" and "written words". The meter is the word's probability, and writing the word scores 0.
- **Fair look-alikes.** A word is never up against a broader word for itself (a police car never faces "car"), and the host's own words borrow each other as look-alikes.
- **Swappable judge.** `CLEF_PROVIDER` runs Clef on Workers AI or any System One endpoint, such as a local [Ollama](https://ollama.com/library/clef).

## Develop

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`. `JUDGE_MODE=mock` gives a free, fake judge. For the real one at no cost, run Clef locally (`ollama pull clef`) and set `JUDGE_MODE=live` with `CLEF_PROVIDER=ollama`. Tools for testing words against it are in the [judge lab](docs/judge-lab.md).

Pushing to `main` deploys through Workers Builds.
