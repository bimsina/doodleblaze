// Random starter names, so nobody has to think before playing. Each fits the
// 16-character name limit.

const ADJECTIVES = [
  'Sleepy', 'Wobbly', 'Sneaky', 'Brave', 'Fuzzy', 'Jolly', 'Speedy', 'Dizzy', 'Sunny', 'Lucky', 'Mighty',
  'Quiet', 'Bouncy', 'Cosmic', 'Zippy', 'Clever', 'Grumpy', 'Cheeky', 'Swift', 'Tiny', 'Bold', 'Witty',
]

const NOUNS = [
  'Giraffe', 'Pencil', 'Noodle', 'Penguin', 'Otter', 'Crayon', 'Panda', 'Comet', 'Doodle', 'Falcon',
  'Mango', 'Rocket', 'Pickle', 'Badger', 'Koala', 'Taco', 'Squid', 'Llama', 'Muffin', 'Yak',
]

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

/** A fresh name, never the same as `current`. */
export function randomName(current = ''): string {
  for (;;) {
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`
    if (name !== current) return name
  }
}
