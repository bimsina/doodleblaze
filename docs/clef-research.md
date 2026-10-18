# Testing 400 words against Clef, locally

Doodleblaze's judge, Drishti, is Cloudflare's [Clef](https://developers.cloudflare.com/workers-ai/models/clef/) decision model. In production it runs on Workers AI and every check is billed. Growing the word packs from 60 to about 400 words meant finding out, for every word, whether a fair doodle can actually win, without spending the demo's budget to do it. This is what one night of testing on a local Clef showed.

## Setup

- **Clef on a laptop.** `ollama pull clef` (the 27B model, 18 GB) on an M2 Max with 32 GB of memory. Loaded, it holds about 26 GB.
- **A provider switch.** `CLEF_PROVIDER=ollama` makes `src/server/judge.ts` send the exact question it sends Workers AI to a System One endpoint (`POST /v1/systemone`). Production stays on `cloudflare`.
- **Parity.** The local model answers in the same format and counts input tokens the same way: 290 for one drawing, the figure measured on Workers AI. That doesn't prove it's the same build, so local scores are a close guide, not a promise.
- **Speed.** About 3 s to judge one drawing and 10 s for a batch of four; the first call after a load takes up to 2 minutes. Answers are deterministic: the same images and question always get the same probabilities, and reshuffling the answer options never changed a score in our runs.

## Method

1. **A test doodle for every word.** Each word got a doodle drawn in code with a small pen (`scripts/doodles/kit.mjs`: lines, curves, arcs, stars, a slight hand wobble). Seven agents drew the 431 candidate words in parallel, two packs each, and reviewed them as Drishti sees them, through the game's own rasterizer (`scripts/doodles/preview.mjs`). The rule: draw what a quick, competent player would draw in under a minute, with no letters or numbers.
2. **Check every word.** `scripts/word-check.mjs` judges a word's doodle and asks whether it reaches the 75% blaze line, then judges each look-alike's doodle under the same question and makes sure none of them does. While rooms still batched drawings, a word had to pass twice: alone, and first in a batch with its look-alikes. Once rooms switched to one drawing per request (finding 1), the check did too.
3. **Fix, swap, or drop.** A failing word got up to four redraws. If a fair doodle still failed, the look-alike Clef confused it with was swapped for another, or the word was cut.

## Results

| Stage                                              | Words | Pass       |
| -------------------------------------------------- | ----- | ---------- |
| First score for every word                         | 431   | 312 (72%)  |
| After two rounds of redraws and swaps              | 409   | 380 (93%)  |
| Third round, then a fresh run of all               | 398   | 398 (100%) |
| Again, one drawing per request, as rooms now judge | 398   | 398 (100%) |
| Two more packs, then every word they touch again   | 431   | 431 (100%) |

- **40 look-alikes were swapped before any testing,** because they were just a broader word for the target: police car had "car", golden egg had "egg", magic carpet had "rug", frog prince had "frog". When the honest answer is one of the options, the judge is right to pick it, and the player loses for drawing well.
- **About 60 more were swapped on evidence.** Three of the original, previously tested words changed: every hammer doodle read as an axe (axe → golf club), upright broccoli read as a tree (tree → lettuce), and pliers doodles scored 94% as scissors (pliers → comb, for scissors).
- **33 words were cut.** 22 because Clef read even a good doodle as something else: nose (hook), tongue and braid (surfboard, caterpillar), foot and leg (boot), walrus (seal, then hippo), screwdriver (toothbrush), globe (lollipop), space station (windmill), drone (spider), whistle (teapot), piano ("written words"), troll ("monster"). Another 11 reached 75% alone or in a batch, but never both: basketball, perfume, trombone, tuba, genie, laser sword, lunar lander, black hole, crater, scythe, lantern.
- **The batched final run cleared the bar with room to spare.** Each word's own doodle scored at least 75% alone and 76% in a batch (medians 99% and 98%). The 806 look-alike doodles judged against the words they stand in for scored a median of 2% and never blazed (highest 74%), and no scribble got past 69%.
- **Judged one drawing per request, as rooms now do, every word still passes.** Own doodles scored at least 75% (median 99%), the 806 look-alike doodles at most 70% (median 0%), and scribbles at most 3%, down from 69% in batches. Four look-alikes changed on the way, because judged alone their doodle won: a lantern read 82% as padlock, an iron 80% as shoe, a leg 76% as boot and a fire extinguisher 89% as jetpack.

## The new packs

Six packs were new this round, built around themes the original packs only touched: space and robots, Halloween, the body, work tools, people in costume, and the kitchen. Space and magic words moved out of Make-believe into Sci-fi & space and Spooky, and hammer moved from Around the house to Tools of the trade. Every new word had to be general (no regional dishes or festivals), drawable in under a minute, free of letters, and never paired with a broader word for itself.

| Pack               | Words | Cut | Median score | What Clef couldn't take                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ----- | --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sci-fi & space     | 22    | 9   | 98%          | Machines built from the same parts as their look-alikes: a space shuttle is a rocket or a plane, a robot arm a desk lamp, a drone a spider, a space station a windmill. Black holes and craters reached the line only some of the time.                                                                                                                |
| Spooky             | 25    | 2   | 98%          | A scythe and a lantern only reached 75% alone or in a batch, never both. Everything else (vampire, mummy, werewolf, grim reaper, zombie hand) passed.                                                                                                                                                                                                  |
| Head to toe        | 22    | 5   | 99%          | Body parts with no face or person around them: a nose read as a hook, a foot and a leg as a boot, a braid as a caterpillar. Faces (smiley, sad, angry, surprised, crying) all passed.                                                                                                                                                                  |
| Tools of the trade | 28    | 4   | 96%          | Small tools that collapse into their silhouette: a screwdriver is a toothbrush, a nail a pin. A toolbox read as a treasure chest and a fire extinguisher as a bottle. Medical and lab kit passed.                                                                                                                                                      |
| Characters         | 17    | 0   | 96%          | Nothing, once each person carried the one prop only they have. A ninja with a sword or headband tails read as a pirate, a wizard with a wide beard as a witch, and a king in a floor-length robe as a queen. Throwing stars, a spell book and boots fixed them, and ninja's look-alike moved from pirate to cowboy, since real players draw the sword. |
| Kitchen            | 16    | 0   | 98%          | Nothing, but several doodles only passed with a giveaway: a kettle needs steam (or it's a watering can), an oven mitt a hot dish (or it's a mitten), a spatula a burger patty (or it's a fly swatter). A plain drawing would lose to those look-alikes, so all three were swapped for ones it can't be mistaken for.                                   |

The median score is each word's own doodle, judged on its own as rooms now judge, in the final run. The lowest word in any of the six packs scored 77%.

Packs considered and folded into existing ones instead: town and street things (in Great outdoors and Tools of the trade), school and office supplies (Around the house), weather (Great outdoors).

## Findings

### 1. In a batch, one drawing can steal the next one's answer

Rooms judged up to four drawings in one Clef request. On the local model, a drawing judged right after a similar one can be pulled toward it, when that answer is one of the options:

| Target (other drawing) | Target first | Target second |
| ---------------------- | ------------ | ------------- |
| astronaut (snowman)    | 95%          | **12%**       |
| guitar (violin)        | 90%          | **61%**       |
| owl (penguin)          | 96%          | 90%           |
| shark (dolphin)        | 99%          | 95%           |
| pizza (cheese)         | 55%          | 72%           |
| cat (dog)              | 99%          | 98%           |
| giraffe (horse)        | 100%         | 99%           |
| rocket (pencil)        | 100%         | 99%           |
| key (spoon)            | 98%          | 99%           |
| house (castle)         | 97%          | 97%           |

Most pairs don't move, but in a real room the order is whoever's canvas changed first, so the astronaut player loses a round they should win. Two full local games with bots showed it: with batching, 7 of 9 drawn rounds blazed, and the two that didn't were an astronaut stuck at 12% behind a snowman and a pizza at 56%. Judging one drawing per request, all 10 rounds of the same two games blazed within 3.4 s (one of them, robot, went to the bot drawing a look-alike, with a half-finished astronaut), and the astronaut after a snowman blazes at 92%.

A prompt telling Clef the images are unrelated and to judge each one on its own (`Looking only at image 2, what is it?`) didn't help: 17% instead of 12%. So rooms now judge each drawing in its own request.

**Cost of the fix.** One drawing alone costs 290 input tokens, against 242 per drawing in a batch of four: about 20% more per drawing, and up to four times the requests. The daily cap went from 3,000 to 10,000 requests, which keeps the same ceiling: 10,000 × 290 tokens at $0.24 per million is about $0.70 a day. Busy rooms reach the per-minute budget sooner, so the judge budget widens everyone's pace earlier instead of failing.

### 2. The prompt moves scores as much as the drawing

The same doodle can score 40 points apart depending on whether it's judged alone (a one-image prompt) or in a batch: perfume 47% alone and 89% in a batch, tuba 58% and 96%, and the other way round igloo 94% and 69%. Words that only cleared one of the two were cut. Now that rooms only ask the one-image question, that's the one every word is held to.

### 3. What a doodle can't carry

The words that never passed share a pattern. Body parts drawn on their own lose their context (a nose is a hook, a leg is a boot). Small tools collapse into their silhouette (a screwdriver is a toothbrush, a nail is a pin). Keyboards and grids read as writing (piano). And near-twins need a detail a quick doodle rarely has (walrus vs seal, crater vs bowl).

## Limitations

- One doodle per word, drawn in code, is cleaner than most players' drawings. Passing means a fair drawing can win, not that every drawing will.
- The local model may not be the exact build on Workers AI. Nothing here was re-measured on Workers AI, by design.

## Reproduce

```bash
ollama pull clef
# .env.local: LAB_ENABLED=1, JUDGE_MODE=live, CLEF_PROVIDER=ollama
pnpm dev
node --import ./scripts/ts-hooks.mjs scripts/doodles/preview.mjs /tmp/doodles spooky   # look first
node --import ./scripts/ts-hooks.mjs scripts/word-check.mjs /tmp/words.json --redo     # every word, about an hour
```
