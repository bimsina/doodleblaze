// Drishti ("vision" in Nepali and Sanskrit) reacts with short prewritten
// lines, so reactions are instant and the jokes stay on-brand.

type Mood = 'idle' | 'writing' | 'cold' | 'lukewarm' | 'warm' | 'close' | 'blazed'

const LINES: Record<Mood, string[]> = {
  idle: ['Go on, I’m watching.', 'Blank page energy.', 'Whenever you’re ready.', 'Pen down, eyes up.'],
  writing: ['No spelling it out!', 'Words don’t count. Draw it.', 'I can read, you know.'],
  cold: ['Is that… a {guess}?', 'Hmm. Abstract.', 'I see lines. Lots of lines.', 'Is that… a potato?', 'Bold. Confusing, but bold.'],
  lukewarm: ['Something’s there.', 'Squinting…', 'Could it be a {guess}?', 'Keep going, I’m intrigued.'],
  warm: ['Ooh, getting warmer.', 'Now we’re talking.', 'I think I see it…', 'Not a {guess}. Right?'],
  close: ['So close. One more detail!', 'It’s on the tip of my tongue…', 'Almost! What makes it a {word}?'],
  blazed: ['That’s a {word}! Blazed.', 'Got it. Beautiful {word}.'],
}

export function moodFor(meter: number, hasInk: boolean, writing: boolean): Mood {
  if (!hasInk) return 'idle'
  if (writing) return 'writing'
  if (meter >= 0.75) return 'blazed'
  if (meter >= 0.55) return 'close'
  if (meter >= 0.3) return 'warm'
  if (meter >= 0.1) return 'lukewarm'
  return 'cold'
}

/** Picks a line for a mood; `seed` keeps the same line until the mood changes. */
export function lineFor(mood: Mood, seed: number, word: string, guess: string | null): string {
  const options = LINES[mood].filter((l) => guess || !l.includes('{guess}'))
  const line = options[seed % options.length]
  return line.replaceAll('{word}', word).replaceAll('{guess}', guess ?? 'thing')
}

export function verdictLine(label: string, p: number, word: string): string {
  const pct = Math.round(p * 100)
  if (label === word) return pct >= 60 ? `Definitely a ${word}.` : `${pct}% sure it’s a ${word}.`
  if (label === 'scribble') return 'Drishti saw… scribbles.'
  if (label === 'writing') return 'That’s just writing. Nice try.'
  return `${pct}% sure this is ${article(label)} ${label}.`
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a')
