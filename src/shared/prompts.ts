// Prompt packs. Each word has three look-alike distractors, so Drishti only
// commits once the drawing has the details that set the word apart.

export type PromptWord = { word: string; distractors: [string, string, string] }

export type Pack = { id: string; name: string; blurb: string; words: PromptWord[] }

const w = (word: string, a: string, b: string, c: string): PromptWord => ({
  word,
  distractors: [a, b, c],
})

const ANIMALS: PromptWord[] = [
  w('cat', 'dog', 'fox', 'rabbit'),
  w('dog', 'cat', 'wolf', 'bear'),
  w('giraffe', 'horse', 'camel', 'deer'),
  w('elephant', 'hippo', 'rhino', 'pig'),
  w('fish', 'shark', 'whale', 'bird'),
  w('snake', 'worm', 'eel', 'lizard'),
  w('bird', 'airplane', 'butterfly', 'bat'),
  w('turtle', 'snail', 'frog', 'crab'),
  w('rabbit', 'cat', 'mouse', 'kangaroo'),
  w('spider', 'ant', 'crab', 'octopus'),
  w('owl', 'penguin', 'cat', 'eagle'),
  w('octopus', 'jellyfish', 'spider', 'squid'),
  w('penguin', 'duck', 'owl', 'bowling pin'),
  w('snail', 'turtle', 'slug', 'seashell'),
  w('pig', 'cow', 'dog', 'sheep'),
  w('duck', 'chicken', 'swan', 'goose'),
  w('crab', 'lobster', 'spider', 'scorpion'),
  w('horse', 'donkey', 'cow', 'giraffe'),
  w('butterfly', 'moth', 'bird', 'flower'),
  w('frog', 'toad', 'turtle', 'lizard'),
]

const FOOD: PromptWord[] = [
  w('pizza', 'pie', 'cake', 'cheese'),
  w('banana', 'moon', 'cucumber', 'boomerang'),
  w('apple', 'tomato', 'orange', 'cherry'),
  w('ice cream', 'cupcake', 'torch', 'microphone'),
  w('burger', 'sandwich', 'cake', 'taco'),
  w('donut', 'bagel', 'tire', 'ring'),
  w('carrot', 'pencil', 'radish', 'ice cream'),
  w('cupcake', 'muffin', 'ice cream', 'cake'),
  w('watermelon', 'pizza', 'ball', 'pumpkin'),
  w('hot dog', 'taco', 'burrito', 'banana'),
  w('fried egg', 'sun', 'flower', 'pancake'),
  w('grapes', 'balloons', 'blueberries', 'cherries'),
  w('taco', 'burrito', 'sandwich', 'pizza'),
  w('popcorn', 'cloud', 'flower', 'cauliflower'),
  w('cherry', 'apple', 'tomato', 'grapes'),
  w('pineapple', 'pinecone', 'carrot', 'palm tree'),
  w('mushroom', 'umbrella', 'tree', 'lamp'),
  w('broccoli', 'tree', 'cloud', 'cauliflower'),
  w('birthday cake', 'cupcake', 'candle', 'hat'),
  w('pear', 'lightbulb', 'apple', 'guitar'),
]

const OBJECTS: PromptWord[] = [
  w('umbrella', 'mushroom', 'lamp', 'tent'),
  w('glasses', 'bicycle', 'binoculars', 'mask'),
  w('lightbulb', 'balloon', 'pear', 'lamp'),
  w('scissors', 'knife', 'pliers', 'glasses'),
  w('key', 'spoon', 'sword', 'wrench'),
  w('chair', 'table', 'ladder', 'bench'),
  w('clock', 'compass', 'plate', 'steering wheel'),
  w('guitar', 'violin', 'ukulele', 'tennis racket'),
  w('bicycle', 'glasses', 'motorcycle', 'scooter'),
  w('house', 'tent', 'barn', 'castle'),
  w('car', 'bus', 'truck', 'boat'),
  w('rocket', 'pencil', 'airplane', 'lighthouse'),
  w('headphones', 'earmuffs', 'horseshoe', 'stethoscope'),
  w('hammer', 'axe', 'wrench', 'shovel'),
  w('kite', 'diamond', 'umbrella', 'balloon'),
  w('crown', 'castle', 'fork', 'comb'),
  w('candle', 'lighthouse', 'crayon', 'bottle'),
  w('ladder', 'train tracks', 'fence', 'chair'),
  w('tent', 'pyramid', 'house', 'umbrella'),
  w('anchor', 'hook', 'trident', 'airplane'),
]

export const PACKS: Pack[] = [
  { id: 'mixed', name: 'Mixed bag', blurb: 'A bit of everything', words: [...ANIMALS, ...FOOD, ...OBJECTS] },
  { id: 'animals', name: 'Animals', blurb: 'Necks, tails, too many legs', words: ANIMALS },
  { id: 'food', name: 'Food', blurb: 'Snacks Drishti has never tasted', words: FOOD },
  { id: 'objects', name: 'Objects', blurb: 'Stuff lying around the house', words: OBJECTS },
]

export const DEFAULT_PACK = 'mixed'

export function getPack(id: string): Pack {
  return PACKS.find((p) => p.id === id) ?? PACKS[0]
}

export function findWord(word: string): PromptWord | undefined {
  return PACKS[0].words.find((p) => p.word === word)
}

/** Every target and distractor, deduplicated: Drishti's full vocabulary for gallery verdicts. */
export const VOCABULARY: string[] = [
  ...new Set(PACKS[0].words.flatMap((p) => [p.word, ...p.distractors])),
]
