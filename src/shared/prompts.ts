// Prompt packs. Each word has three look-alike distractors, so Drishti only
// commits once the drawing has the details that set the word apart.

import { TOTAL_ROUNDS } from '#/shared/protocol'

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
  w('snake', 'worm', 'eel', 'lizard'),
  w('bird', 'airplane', 'butterfly', 'bat'),
  w('turtle', 'snail', 'frog', 'crab'),
  w('rabbit', 'cat', 'mouse', 'kangaroo'),
  w('spider', 'ant', 'crab', 'octopus'),
  w('owl', 'penguin', 'cat', 'eagle'),
  w('snail', 'turtle', 'slug', 'seashell'),
  w('pig', 'cow', 'dog', 'sheep'),
  w('duck', 'chicken', 'swan', 'goose'),
  w('horse', 'donkey', 'cow', 'giraffe'),
  w('butterfly', 'moth', 'bird', 'flower'),
  w('frog', 'toad', 'turtle', 'lizard'),
  w('lion', 'cat', 'sun', 'tiger'),
  w('monkey', 'bear', 'cat', 'squirrel'),
  w('cow', 'horse', 'pig', 'dog'),
  w('sheep', 'cloud', 'dog', 'goat'),
  w('mouse', 'cat', 'rabbit', 'hamster'),
  w('bear', 'dog', 'pig', 'mouse'),
  w('zebra', 'horse', 'donkey', 'tiger'),
  w('kangaroo', 'rabbit', 'dinosaur', 'mouse'),
  w('camel', 'horse', 'llama', 'cow'),
  w('crocodile', 'lizard', 'snake', 'dinosaur'),
  w('hedgehog', 'mouse', 'pinecone', 'cactus'),
  w('bee', 'housefly', 'butterfly', 'ladybug'),
  w('ladybug', 'beetle', 'turtle', 'strawberry'),
  w('caterpillar', 'worm', 'snake', 'centipede'),
  w('flamingo', 'swan', 'stork', 'ostrich'),
  w('chicken', 'duck', 'pigeon', 'turkey'),
  w('deer', 'horse', 'goat', 'dog'),
]

const SEA: PromptWord[] = [
  w('fish', 'shark', 'whale', 'bird'),
  w('octopus', 'jellyfish', 'spider', 'squid'),
  w('crab', 'lobster', 'spider', 'scorpion'),
  w('penguin', 'duck', 'owl', 'bowling pin'),
  w('anchor', 'hook', 'trident', 'airplane'),
  w('shark', 'dolphin', 'whale', 'submarine'),
  w('whale', 'fish', 'submarine', 'dolphin'),
  w('dolphin', 'shark', 'fish', 'whale'),
  w('jellyfish', 'octopus', 'ghost', 'mushroom'),
  w('starfish', 'star', 'flower', 'hand'),
  w('seahorse', 'chess knight', 'dragon', 'snake'),
  w('lobster', 'crab', 'shrimp', 'scorpion'),
  w('squid', 'octopus', 'jellyfish', 'rocket'),
  w('shrimp', 'lobster', 'caterpillar', 'worm'),
  w('seal', 'walrus', 'dolphin', 'dog'),
  w('stingray', 'kite', 'bat', 'butterfly'),
  w('pufferfish', 'balloon', 'hedgehog', 'sea urchin'),
  w('narwhal', 'unicorn', 'swordfish', 'dolphin'),
  w('seashell', 'fan', 'snail', 'umbrella'),
  w('lighthouse', 'candle', 'rocket', 'skyscraper'),
  w('sandcastle', 'cake', 'bucket', 'crown'),
  w('beach ball', 'umbrella', 'pizza', 'balloon'),
  w('surfboard', 'skateboard', 'canoe', 'ironing board'),
  w('island', 'turtle', 'hill', 'hat'),
  w('fishing rod', 'cane', 'kite', 'golf club'),
  w('snorkel', 'goggles', 'glasses', 'mask'),
  w('pelican', 'duck', 'penguin', 'stork'),
  w('submarine', 'whale', 'blimp', 'fish'),
  w('ship wheel', 'steering wheel', 'sun', 'flower'),
  w('treasure chest', 'box', 'suitcase', 'gift'),
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
  w('broccoli', 'lettuce', 'cloud', 'cauliflower'),
  w('birthday cake', 'cupcake', 'candle', 'hat'),
  w('pear', 'lightbulb', 'apple', 'guitar'),
  w('strawberry', 'heart', 'tomato', 'raspberry'),
  w('pumpkin', 'orange', 'apple', 'tomato'),
  w('avocado', 'pear', 'egg', 'lightbulb'),
  w('corn', 'pineapple', 'carrot', 'cucumber'),
  w('cheese', 'pizza', 'cake', 'sponge'),
  w('sandwich', 'cheese', 'lasagna', 'toast'),
  w('french fries', 'popcorn', 'crayons', 'pencils'),
  w('chicken leg', 'bone', 'maracas', 'ice cream'),
  w('pancakes', 'cake', 'burger', 'sandwich'),
  w('croissant', 'moon', 'banana', 'shrimp'),
  w('cookie', 'pizza', 'coin', 'button'),
  w('lollipop', 'balloon', 'magnifying glass', 'flower'),
  w('candy', 'bow tie', 'bone', 'butterfly'),
]

const OBJECTS: PromptWord[] = [
  w('umbrella', 'mushroom', 'lamp', 'tent'),
  w('lightbulb', 'balloon', 'pear', 'lamp'),
  w('scissors', 'knife', 'comb', 'glasses'),
  w('key', 'spoon', 'sword', 'wrench'),
  w('chair', 'table', 'ladder', 'bench'),
  w('clock', 'compass', 'plate', 'steering wheel'),
  w('candle', 'lighthouse', 'crayon', 'bottle'),
  w('ladder', 'train tracks', 'fence', 'chair'),
  w('bed', 'sofa', 'table', 'bench'),
  w('sofa', 'bed', 'chair', 'bench'),
  w('door', 'window', 'fridge', 'cupboard'),
  w('bathtub', 'boat', 'sofa', 'bowl'),
  w('television', 'window', 'microwave', 'picture frame'),
  w('camera', 'radio', 'washing machine', 'toaster'),
  w('teapot', 'watering can', 'magic lamp', 'vase'),
  w('mug', 'bucket', 'jar', 'vase'),
  w('fork', 'trident', 'rake', 'comb'),
  w('spoon', 'lollipop', 'mirror', 'shovel'),
  w('frying pan', 'tennis racket', 'banjo', 'mirror'),
  w('bucket', 'trash can', 'flower pot', 'basket'),
  w('watering can', 'teapot', 'kettle', 'elephant'),
  w('toothbrush', 'spoon', 'comb', 'broom'),
  w('comb', 'fork', 'rake', 'crown'),
  w('padlock', 'handbag', 'bucket', 'mug'),
  w('magnet', 'horseshoe', 'headphones', 'rainbow'),
  w('pencil', 'crayon', 'carrot', 'rocket'),
  w('book', 'box', 'envelope', 'butterfly'),
  w('envelope', 'book', 'box', 'folder'),
  w('paper clip', 'safety pin', 'coil', 'hook'),
]

const VEHICLES: PromptWord[] = [
  w('bicycle', 'glasses', 'motorcycle', 'scooter'),
  w('car', 'bus', 'truck', 'boat'),
  w('bus', 'car', 'truck', 'train'),
  w('truck', 'car', 'bus', 'tractor'),
  w('train', 'bus', 'caterpillar', 'truck'),
  w('fire truck', 'ambulance', 'bus', 'train'),
  w('ambulance', 'truck', 'bus', 'fire truck'),
  w('police car', 'van', 'ambulance', 'taxi'),
  w('race car', 'shoe', 'rocket', 'boat'),
  w('tractor', 'truck', 'car', 'bulldozer'),
  w('excavator', 'crane', 'bulldozer', 'tractor'),
  w('motorcycle', 'bicycle', 'scooter', 'car'),
  w('scooter', 'skateboard', 'bicycle', 'motorcycle'),
  w('unicycle', 'bicycle', 'lollipop', 'wheel'),
  w('skateboard', 'surfboard', 'scooter', 'sled'),
  w('sled', 'skateboard', 'bench', 'skis'),
  w('shopping cart', 'basket', 'wheelbarrow', 'stroller'),
  w('airplane', 'bird', 'rocket', 'fish'),
  w('helicopter', 'dragonfly', 'airplane', 'fan'),
  w('paper plane', 'airplane', 'arrow', 'kite'),
  w('hot air balloon', 'parachute', 'lightbulb', 'ice cream'),
  w('parachute', 'umbrella', 'jellyfish', 'mushroom'),
  w('blimp', 'balloon', 'fish', 'submarine'),
  w('sailboat', 'kite', 'tent', 'flag'),
  w('canoe', 'banana', 'surfboard', 'leaf'),
  w('cable car', 'lantern', 'swing', 'bird house'),
  w('roller coaster', 'bridge', 'snake', 'train'),
  w('traffic light', 'domino', 'snowman', 'robot'),
  w('steering wheel', 'clock', 'tire', 'frisbee'),
]

const OUTDOORS: PromptWord[] = [
  w('house', 'tent', 'barn', 'castle'),
  w('tent', 'pyramid', 'house', 'umbrella'),
  w('tree', 'broccoli', 'mushroom', 'lollipop'),
  w('palm tree', 'pineapple', 'umbrella', 'fireworks'),
  w('cactus', 'tree', 'cucumber', 'fork'),
  w('flower', 'sun', 'lollipop', 'star'),
  w('leaf', 'feather', 'fish', 'kite'),
  w('nest', 'basket', 'bowl', 'spaghetti'),
  w('sun', 'flower', 'lion', 'fried egg'),
  w('cloud', 'sheep', 'popcorn', 'bush'),
  w('rainbow', 'bridge', 'magnet', 'horseshoe'),
  w('lightning', 'arrow', 'snake', 'zipper'),
  w('snowflake', 'star', 'flower', 'spider web'),
  w('tornado', 'ice cream', 'traffic cone', 'carrot'),
  w('snowman', 'bowling pin', 'peanut', 'cloud'),
  w('mountain', 'volcano', 'tent', 'pyramid'),
  w('volcano', 'mountain', 'pyramid', 'campfire'),
  w('waterfall', 'mountain', 'curtain', 'shower'),
  w('campfire', 'candle', 'volcano', 'flower'),
  w('barn', 'tractor', 'garage', 'tent'),
  w('igloo', 'turtle', 'snowball', 'helmet'),
  w('tree house', 'bird house', 'ladder', 'barn'),
  w('windmill', 'pinwheel', 'fan', 'lighthouse'),
  w('pyramid', 'tent', 'mountain', 'party hat'),
  w('skyscraper', 'lighthouse', 'rocket', 'chocolate bar'),
  w('bridge', 'rainbow', 'ladder', 'fence'),
  w('fountain', 'umbrella', 'palm tree', 'cake'),
  w('fence', 'ladder', 'train tracks', 'comb'),
  w('bench', 'chair', 'table', 'sofa'),
  w('swing', 'seesaw', 'hammock', 'ladder'),
  w('seesaw', 'bench', 'balance scale', 'swing'),
  w('hammock', 'swing', 'banana', 'bridge'),
]

const SPORTS: PromptWord[] = [
  w('kite', 'diamond', 'umbrella', 'balloon'),
  w('soccer ball', 'basketball', 'volleyball', 'turtle'),
  w('baseball', 'tennis ball', 'soccer ball', 'golf ball'),
  w('rugby ball', 'egg', 'lemon', 'potato'),
  w('bowling ball', 'button', 'coconut', 'cookie'),
  w('bowling pin', 'bottle', 'penguin', 'vase'),
  w('tennis racket', 'frying pan', 'magnifying glass', 'guitar'),
  w('shuttlecock', 'ice cream', 'lampshade', 'cupcake'),
  w('hockey stick', 'golf club', 'cane', 'boomerang'),
  w('basketball hoop', 'basket', 'butterfly net', 'flower pot'),
  w('boxing glove', 'fist', 'oven mitt', 'baseball glove'),
  w('dumbbell', 'bone', 'glasses', 'binoculars'),
  w('jump rope', 'snake', 'hose', 'worm'),
  w('roller skate', 'boot', 'ice skate', 'skateboard'),
  w('ice skate', 'ski', 'roller skate', 'sled'),
  w('trophy', 'vase', 'cup', 'lamp'),
  w('medal', 'necklace', 'coin', 'badge'),
  w('stopwatch', 'clock', 'compass', 'alarm clock'),
  w('dartboard', 'clock', 'spider web', 'pizza'),
  w('dice', 'box', 'domino', 'ice cube'),
  w('domino', 'dice', 'door', 'book'),
  w('chess knight', 'horse', 'seahorse', 'dog'),
  w('puzzle piece', 'cookie', 'cloud', 'flower'),
  w('teddy bear', 'doll', 'monkey', 'pig'),
  w('yo-yo', 'donut', 'button', 'lollipop'),
  w('balloon', 'lollipop', 'lightbulb', 'cherry'),
  w('spinning top', 'onion', 'diamond', 'UFO'),
  w('rocking horse', 'horse', 'chair', 'unicorn'),
  w('pinwheel', 'windmill', 'flower', 'fan'),
  w('trampoline', 'table', 'drum', 'bed'),
]

const WARDROBE: PromptWord[] = [
  w('glasses', 'bicycle', 'binoculars', 'mask'),
  w('crown', 'castle', 'fork', 'comb'),
  w('t-shirt', 'sweater', 'dress', 'jacket'),
  w('hoodie', 'sweater', 'jacket', 't-shirt'),
  w('dress', 'skirt', 't-shirt', 'apron'),
  w('skirt', 'dress', 'lampshade', 'cupcake'),
  w('shorts', 'jeans', 'skirt', 't-shirt'),
  w('apron', 'dress', 'bib', 'shield'),
  w('sock', 'boot', 'mitten', 'shoe'),
  w('shoe', 'boot', 'slipper', 'sock'),
  w('boot', 'sock', 'roller skate', 'hockey stick'),
  w('high heel', 'boot', 'sandal', 'stapler'),
  w('flip-flops', 'footprint', 'slipper', 'peanut'),
  w('mitten', 'glove', 'sock', 'shoe'),
  w('scarf', 'ribbon', 'necktie', 'towel'),
  w('necktie', 'kite', 'arrow', 'carrot'),
  w('bow tie', 'candy', 'butterfly', 'hourglass'),
  w('belt', 'snake', 'ribbon', 'wristwatch'),
  w('wristwatch', 'clock', 'bracelet', 'belt'),
  w('necklace', 'jump rope', 'horseshoe', 'magnet'),
  w('handbag', 'padlock', 'basket', 'bucket'),
  w('backpack', 'sleeping bag', 'lunchbox', 'box'),
  w('top hat', 'drum', 'jar', 'chimney'),
  w('baseball cap', 'helmet', 'shoe', 'mushroom'),
  w('party hat', 'ice cream', 'traffic cone', 'witch hat'),
  w('sun hat', 'UFO', 'mushroom', 'plate'),
  w('chef hat', 'cloud', 'mushroom', 'cupcake'),
  w('earmuffs', 'headphones', 'horseshoe', 'magnet'),
  w('coat hanger', 'triangle', 'hook', 'tent'),
  w('lipstick', 'crayon', 'candle', 'battery'),
]

const MUSIC: PromptWord[] = [
  w('guitar', 'violin', 'ukulele', 'tennis racket'),
  w('headphones', 'earmuffs', 'horseshoe', 'stethoscope'),
  w('violin', 'guitar', 'ukulele', 'pear'),
  w('banjo', 'guitar', 'frying pan', 'tennis racket'),
  w('harp', 'triangle', 'sailboat', 'guitar'),
  w('xylophone', 'piano', 'fence', 'ladder'),
  w('accordion', 'fan', 'piano', 'radio'),
  w('drum', 'bucket', 'cake', 'top hat'),
  w('tambourine', 'drum', 'plate', 'clock'),
  w('cymbals', 'plate', 'UFO', 'burger'),
  w('gong', 'clock', 'shield', 'mirror'),
  w('maracas', 'lollipop', 'balloon', 'spoon'),
  w('trumpet', 'saxophone', 'megaphone', 'watering can'),
  w('saxophone', 'trumpet', 'clarinet', 'umbrella'),
  w('flute', 'clarinet', 'pencil', 'straw'),
  w('harmonica', 'comb', 'domino', 'bus'),
  w('microphone', 'ice cream', 'lollipop', 'flashlight'),
  w('megaphone', 'traffic cone', 'trumpet', 'funnel'),
  w('loudspeaker', 'radio', 'washing machine', 'camera'),
  w('radio', 'television', 'toaster', 'suitcase'),
  w('gramophone', 'trumpet', 'flower', 'megaphone'),
  w('telephone', 'banana', 'radio', 'camera'),
  w('bell', 'lamp', 'jellyfish', 'mushroom'),
  w('alarm clock', 'bell', 'radio', 'stopwatch'),
  w('party horn', 'trumpet', 'snail', 'ribbon'),
  w('fireworks', 'flower', 'dandelion', 'snowflake'),
]

const FANTASY: PromptWord[] = [
  w('dragon', 'dinosaur', 'lizard', 'bird'),
  w('dinosaur', 'dragon', 'lizard', 'giraffe'),
  w('unicorn', 'horse', 'goat', 'rhino'),
  w('mermaid', 'fish', 'fairy', 'dolphin'),
  w('fairy', 'butterfly', 'dragonfly', 'bird'),
  w('cyclops', 'alien', 'robot', 'owl'),
  w('pirate ship', 'castle', 'bathtub', 'shoe'),
  w('magic wand', 'lollipop', 'flower', 'pencil'),
  w('magic lamp', 'teapot', 'watering can', 'shoe'),
  w('magic carpet', 'flag', 'towel', 'surfboard'),
  w('castle', 'house', 'crown', 'lighthouse'),
  w('throne', 'chair', 'sofa', 'bench'),
  w('sword', 'knife', 'key', 'airplane'),
  w('shield', 'kite', 'badge', 'heart'),
  w('knight helmet', 'bucket', 'robot', 'lantern'),
  w('pegasus', 'unicorn', 'horse', 'bird'),
  w('phoenix', 'eagle', 'dragon', 'butterfly'),
  w('sea serpent', 'snake', 'dragon', 'eel'),
  w('frog prince', 'toad', 'king', 'turtle'),
  w('wizard hat', 'tent', 'party hat', 'traffic cone'),
  w('spell book', 'box', 'envelope', 'suitcase'),
  w('magic mirror', 'window', 'picture frame', 'tennis racket'),
  w('glass slipper', 'sock', 'boat', 'teapot'),
  w('tiara', 'bracelet', 'necklace', 'comb'),
  w('beanstalk', 'vine', 'tree', 'ladder'),
  w('gingerbread house', 'cake', 'barn', 'bird house'),
  w('golden egg', 'lemon', 'potato', 'coin'),
  w('dragon egg', 'pinecone', 'pineapple', 'lemon'),
  w('catapult', 'seesaw', 'spoon', 'crane'),
]

const SCIFI: PromptWord[] = [
  w('robot', 'astronaut', 'toaster', 'television'),
  w('alien', 'frog', 'octopus', 'robot'),
  w('UFO', 'hat', 'jellyfish', 'lamp'),
  w('astronaut', 'knight', 'snowman', 'scuba diver'),
  w('planet', 'UFO', 'ball', 'moon'),
  w('moon', 'banana', 'croissant', 'boomerang'),
  w('shooting star', 'star', 'kite', 'tadpole'),
  w('satellite', 'windmill', 'airplane', 'kite'),
  w('telescope', 'binoculars', 'flashlight', 'megaphone'),
  w('rocket', 'pencil', 'airplane', 'lighthouse'),
  w('star', 'starfish', 'flower', 'snowflake'),
  w('ray gun', 'hair dryer', 'water pistol', 'drill'),
  w('jetpack', 'backpack', 'dumbbell', 'rocket'),
  w('moon rover', 'car', 'tractor', 'shopping cart'),
  w('satellite dish', 'umbrella', 'bowl', 'lamp'),
  w('solar panel', 'window', 'chessboard', 'calculator'),
  w('galaxy', 'whirlpool', 'snail', 'hurricane'),
  w('constellation', 'spider web', 'net', 'map'),
  w('robot dog', 'dog', 'cat', 'toy car'),
  w('space helmet', 'fishbowl', 'diving helmet', 'lightbulb'),
  w('flying car', 'airplane', 'UFO', 'helicopter'),
  w('control panel', 'keyboard', 'calculator', 'remote control'),
]

const SPOOKY: PromptWord[] = [
  w('ghost', 'cloud', 'jellyfish', 'bell'),
  w('skeleton', 'robot', 'ghost', 'scarecrow'),
  w('witch hat', 'party hat', 'traffic cone', 'pyramid'),
  w('broomstick', 'rake', 'mop', 'paintbrush'),
  w('crystal ball', 'bubble', 'egg', 'fishbowl'),
  w('cauldron', 'bucket', 'drum', 'bathtub'),
  w('potion', 'lightbulb', 'vase', 'perfume'),
  w('spider web', 'dartboard', 'snowflake', 'umbrella'),
  w('bat', 'bird', 'butterfly', 'dragon'),
  w("jack-o'-lantern", 'orange', 'apple', 'smiley face'),
  w('tombstone', 'door', 'mailbox', 'book'),
  w('haunted house', 'castle', 'barn', 'bird house'),
  w('coffin', 'door', 'box', 'guitar case'),
  w('skull', 'face', 'ghost', 'lightbulb'),
  w('mummy', 'snowman', 'robot', 'ghost'),
  w('vampire', 'bat', 'magician', 'ghost'),
  w('zombie hand', 'tree', 'glove', 'rake'),
  w('monster', 'dinosaur', 'troll', 'bear'),
  w('werewolf', 'wolf', 'dog', 'bear'),
  w('scarecrow', 'snowman', 'skeleton', 'robot'),
  w('grim reaper', 'ghost', 'witch', 'scarecrow'),
  w('pitchfork', 'shovel', 'comb', 'rake'),
  w('candelabra', 'trident', 'cactus', 'coat rack'),
  w('skeleton key', 'spoon', 'sword', 'wrench'),
  w('spooky tree', 'hand', 'lightning', 'antlers'),
]

const BODY: PromptWord[] = [
  w('eye', 'fish', 'lemon', 'planet'),
  w('ear', 'seashell', 'croissant', 'bean'),
  w('lips', 'heart', 'butterfly', 'boat'),
  w('tooth', 'popcorn', 'mushroom', 'cloud'),
  w('hand', 'glove', 'tree', 'rake'),
  w('fist', 'walnut', 'rock', 'potato'),
  w('thumbs up', 'thumbs down', 'glove', 'mitten'),
  w('flexed arm', 'leg', 'boomerang', 'drumstick'),
  w('footprint', 'paw print', 'flip-flops', 'peanut'),
  w('fingerprint', 'spider web', 'tree rings', 'maze'),
  w('brain', 'cloud', 'walnut', 'cauliflower'),
  w('heart', 'apple', 'strawberry', 'cherry'),
  w('lungs', 'tree', 'butterfly', 'broccoli'),
  w('bone', 'dumbbell', 'peanut', 'baseball bat'),
  w('mustache', 'eyebrows', 'boomerang', 'caterpillar'),
  w('beard', 'cloud', 'scarf', 'bush'),
  w('ponytail', 'broom', 'paintbrush', 'tail'),
  w('smiley face', 'sun', 'cookie', 'clock'),
  w('sad face', 'smiley face', 'angry face', 'cookie'),
  w('angry face', 'sad face', 'smiley face', 'tomato'),
  w('surprised face', 'smiley face', 'sad face', 'donut'),
  w('crying face', 'rain cloud', 'smiley face', 'fountain'),
]

const TOOLS: PromptWord[] = [
  w('hammer', 'golf club', 'wrench', 'shovel'),
  w('saw', 'knife', 'comb', 'shark'),
  w('wrench', 'spoon', 'key', 'bone'),
  w('drill', 'hair dryer', 'ray gun', 'screwdriver'),
  w('chainsaw', 'guitar', 'drill', 'vacuum cleaner'),
  w('axe', 'hockey stick', 'flag', 'shovel'),
  w('pliers', 'clothespin', 'crocodile', 'tweezers'),
  w('screw', 'nail', 'spring', 'drill'),
  w('tape measure', 'camera', 'snail', 'coin'),
  w('paintbrush', 'feather', 'broom', 'pencil'),
  w('paint roller', 'rolling pin', 'hammer', 'lollipop'),
  w('shovel', 'spoon', 'axe', 'tennis racket'),
  w('rake', 'fork', 'comb', 'trident'),
  w('broom', 'feather', 'hockey stick', 'paintbrush'),
  w('mop', 'broom', 'paintbrush', 'octopus'),
  w('wheelbarrow', 'shopping cart', 'bathtub', 'tractor'),
  w('hard hat', 'bowler hat', 'bowl', 'baseball cap'),
  w('traffic cone', 'party hat', 'carrot', 'ice cream'),
  w('fire hydrant', 'robot', 'bottle', 'chess piece'),
  w('flashlight', 'microphone', 'ice cream cone', 'battery'),
  w('magnifying glass', 'tennis racket', 'lollipop', 'frying pan'),
  w('microscope', 'telescope', 'desk lamp', 'camera'),
  w('test tube', 'thermometer', 'candle', 'bottle'),
  w('stethoscope', 'headphones', 'necklace', 'jump rope'),
  w('syringe', 'pen', 'screwdriver', 'thermometer'),
  w('thermometer', 'pencil', 'syringe', 'straw'),
  w('bandage', 'eraser', 'chewing gum', 'domino'),
  w('first aid kit', 'suitcase', 'box', 'handbag'),
]

const CHARACTERS: PromptWord[] = [
  w('pirate', 'cowboy', 'viking', 'sailor'),
  w('ninja', 'burglar', 'cowboy', 'scarecrow'),
  w('chef', 'doctor', 'painter', 'snowman'),
  w('clown', 'jester', 'scarecrow', 'king'),
  w('king', 'queen', 'knight', 'wizard'),
  w('queen', 'king', 'bride', 'fairy'),
  w('knight', 'robot', 'astronaut', 'soldier'),
  w('wizard', 'witch', 'king', 'gnome'),
  w('witch', 'wizard', 'scarecrow', 'ghost'),
  w('superhero', 'vampire', 'ninja', 'robot'),
  w('firefighter', 'astronaut', 'police officer', 'miner'),
  w('doctor', 'chef', 'scientist', 'nurse'),
  w('scientist', 'doctor', 'chef', 'wizard'),
  w('magician', 'wizard', 'vampire', 'king'),
  w('ballerina', 'fairy', 'princess', 'flower'),
  w('viking', 'pirate', 'knight', 'caveman'),
  w('zombie', 'mummy', 'scarecrow', 'robot'),
]

const KITCHEN: PromptWord[] = [
  w('toaster', 'radio', 'suitcase', 'box'),
  w('kettle', 'trophy', 'bucket', 'lamp'),
  w('blender', 'vase', 'lighthouse', 'bottle'),
  w('whisk', 'balloon', 'lightbulb', 'tennis racket'),
  w('spatula', 'shovel', 'spoon', 'toothbrush'),
  w('rolling pin', 'baseball bat', 'bone', 'paint roller'),
  w('grater', 'trash can', 'skyscraper', 'lantern'),
  w('oven mitt', 'hand puppet', 'sock', 'boxing glove'),
  w('fridge', 'door', 'cupboard', 'mailbox'),
  w('microwave', 'television', 'washing machine', 'radio'),
  w('ladle', 'spoon', 'umbrella', 'golf club'),
  w('colander', 'bowl', 'helmet', 'basket'),
  w('salt shaker', 'bottle', 'lighthouse', 'thermos'),
  w('chopsticks', 'pencils', 'drumsticks', 'straws'),
  w('teacup', 'mug', 'bowl', 'flower pot'),
  w('cookie jar', 'vase', 'lantern', 'bucket'),
]

const THEMED: Pack[] = [
  { id: 'animals', name: 'Animals', blurb: 'Necks, tails, too many legs', words: ANIMALS },
  { id: 'sea', name: 'Under the sea', blurb: 'Fins, shells, sandy toes', words: SEA },
  { id: 'food', name: 'Food', blurb: 'Snacks Drishti has never tasted', words: FOOD },
  { id: 'objects', name: 'Around the house', blurb: "Stuff you can't find right now", words: OBJECTS },
  { id: 'vehicles', name: 'Things that go', blurb: 'Wheels, wings and sails', words: VEHICLES },
  { id: 'outdoors', name: 'Great outdoors', blurb: 'Grab a coat, it might rain', words: OUTDOORS },
  { id: 'sports', name: 'Sports & games', blurb: 'Balls, boards and sore losers', words: SPORTS },
  { id: 'wardrobe', name: 'Wardrobe', blurb: 'Hats, socks and the odd crown', words: WARDROBE },
  { id: 'music', name: 'Music', blurb: 'Bangs, toots and twangs', words: MUSIC },
  { id: 'fantasy', name: 'Make-believe', blurb: 'Dragons, wands and castles', words: FANTASY },
  { id: 'scifi', name: 'Sci-fi & space', blurb: 'Robots, rockets, little green men', words: SCIFI },
  { id: 'spooky', name: 'Spooky', blurb: 'Things that go bump', words: SPOOKY },
  { id: 'body', name: 'Head to toe', blurb: 'Every bit of you, roughly', words: BODY },
  { id: 'tools', name: 'Tools of the trade', blurb: 'Builders, doctors, mad scientists', words: TOOLS },
  { id: 'characters', name: 'Characters', blurb: 'Pirates, ninjas, the odd queen', words: CHARACTERS },
  { id: 'kitchen', name: 'Kitchen', blurb: 'Whisk it, toast it, lose the lid', words: KITCHEN },
]

// Mixed bag is every other pack together. Each word lives in exactly one pack.
export const PACKS: Pack[] = [
  { id: 'mixed', name: 'Mixed bag', blurb: 'A bit of everything', words: THEMED.flatMap((p) => p.words) },
  ...THEMED,
]

export const DEFAULT_PACK = 'mixed'

/** The host's own words. Not in PACKS: each room keeps its own list. */
export const CUSTOM_PACK = 'custom'
/** One word per round, so nothing repeats in a game. */
export const MIN_CUSTOM_WORDS = TOTAL_ROUNDS
export const MAX_CUSTOM_WORDS = 100
export const MAX_WORD_LENGTH = 30

// Drishti's catch-all answers, next to the words. No word may use these keys.
export const OTHER = 'something_else'
export const SCRIBBLE = 'scribble'
export const WRITING = 'writing'

/** A word's answer key for Drishti. Words without any a-z or 0-9 (other scripts) get a short hash, so they don't all become "_". */
export function slug(word: string) {
  const key = word.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  if (/[a-z0-9]/.test(key)) return key
  let h = 2166136261
  for (const ch of word) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619)
  return `w${(h >>> 0).toString(36)}`
}

export function getPack(id: string): Pack {
  return PACKS.find((p) => p.id === id) ?? PACKS[0]
}

export function findWord(word: string): PromptWord | undefined {
  const key = slug(word)
  return PACKS[0].words.find((p) => slug(p.word) === key)
}

/** Every target and distractor, deduplicated: Drishti's full vocabulary for gallery verdicts. */
export const VOCABULARY: string[] = [
  ...new Set(PACKS[0].words.flatMap((p) => [p.word, ...p.distractors])),
]

/** Drops words whose answer key is taken, so each stays a separate choice for Drishti. */
export function distinctWords(words: string[], taken: Iterable<string> = []): string[] {
  const seen = new Set(taken)
  return words.filter((word) => {
    const key = slug(word)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** The host's list as usable words: one per line or comma, tidied, without repeats or overlong ones. */
export function parseWords(input: string | unknown[]): string[] {
  const raw = typeof input === 'string' ? input.split(/[\n,]/) : input
  const words = raw.flatMap((item) => {
    if (typeof item !== 'string') return []
    const word = item
      .replace(/[\p{C}<>]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return word && word.length <= MAX_WORD_LENGTH ? [word] : []
  })
  return distinctWords(words, [OTHER, SCRIBBLE, WRITING]).slice(0, MAX_CUSTOM_WORDS)
}

/**
 * One of the host's words as a prompt. A word from the built-in packs keeps
 * its hand-picked look-alikes. Any other borrows three of the host's other words
 * (often the same theme, so decent look-alikes), topped up from the built-in list.
 */
export function customPrompt(word: string, words: string[]): PromptWord {
  const known = findWord(word)
  if (known) return { word, distractors: known.distractors }
  const picks = distinctWords([...shuffled(words), ...shuffled(VOCABULARY)], [slug(word)])
  return { word, distractors: picks.slice(0, 3) as PromptWord['distractors'] }
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
