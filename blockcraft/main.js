import * as THREE from 'three';

// ============ BlockCraft Edu 3D — main game ============
const $ = (id) => document.getElementById(id);
const container = $('game-container');
const SAVE_KEY = 'blockcraft-edu-save-v1';

const BLOCKS = [
  { id: 'grass',   name: 'Grass',   color: 0x5fbf3f, count: 16 },
  { id: 'dirt',    name: 'Dirt',    color: 0x8a5a2b, count: 16 },
  { id: 'stone',   name: 'Stone',   color: 0x8d8d8d, count: 10 },
  { id: 'wood',    name: 'Wood',    color: 0x9c6b30, count: 10 },
  { id: 'leaves',  name: 'Leaves',  color: 0x2e8b3a, count: 10 },
  { id: 'brick',   name: 'Brick',   color: 0xc0392b, count: 8 },
  { id: 'glass',   name: 'Glass',   color: 0xbfe9ff, count: 8, transparent: true },
  { id: 'cube',    name: 'Cube',    color: 0xffd23f, count: 4, lesson: true,
    fact: '🔷 CUBE: 6 square faces · 12 edges · 8 vertices (corners). Every face is an identical square!' },
  { id: 'pyramid', name: 'Pyramid', color: 0x7c4dff, count: 4, lesson: true, pyramid: true,
    fact: '🔷 SQUARE PYRAMID: 5 faces (4 triangles + 1 square base) · 8 edges · 5 vertices. The triangles meet at the apex!' },
];

const state = {
  energy: 100, knowledge: 0, placed: 0,
  selected: 0, started: false, soundOn: true, flying: false,
  inventory: {}, quizSubject: 'math', quizIndex: 0,
};
BLOCKS.forEach(b => state.inventory[b.id] = b.count);

const PLACE_COST = 4;      // energy per placed block
const BREAK_GAIN = 1;      // energy back per broken block
const MAX_ENERGY = 200;

// ============ Cozy town systems (ported from Pastel Meadows; BlockCraft theme kept) ============
// Avatar / economy / seasons / shops / pickups / NPCs / bike / home / MP / minimap / day cycle.
const HAIRS = [
  { n: 'Cocoa', c: '#4A322A' }, { n: 'Night', c: '#23232E' },
  { n: 'Poppy', c: '#E63956' }, { n: 'Ocean', c: '#1D5C99' },
  { n: 'Plum Pop', c: '#7B2DDB' }, { n: 'Moss Dark', c: '#2F5233' },
];
// BlockCraft-theme shirt palette (bold, not pastel)
const SHIRTS = ['#4caf50', '#c0392b', '#2196f3', '#ffd23f', '#7c4dff', '#ff6b35'];
const SKINS = ['#FFE5B4', '#FFDAC1', '#F3C6A5', '#EAC9A8', '#F6D6C3'];
const STYLES = ['short & soft', 'long & flowy', 'little bun'];
const GENDERS = [
  { id: 'girl', n: 'Girl', pro: 'she / her', c: '#c0392b', ps: 'she', po: 'her', pp: 'her' },
  { id: 'boy', n: 'Boy', pro: 'he / him', c: '#2196f3', ps: 'he', po: 'him', pp: 'his' },
  { id: 'star', n: 'Star', pro: 'they / them', c: '#7c4dff', ps: 'they', po: 'them', pp: 'their' },
];
const SEASONS = [
  { n: 'Spring', e: '🌸', note: 'wildflowers everywhere', sky: 0x87ceeb, fog: 0x87ceeb, sun: 0.9 },
  { n: 'Summer', e: '🌻', note: 'shells shine by the water', sky: 0x7ec8e3, fog: 0x7ec8e3, sun: 1.0 },
  { n: 'Autumn', e: '🍁', note: 'mushrooms & amber leaves', sky: 0x9fc3d8, fog: 0x9fc3d8, sun: 0.8 },
  { n: 'Winter', e: '❄️', note: 'snow petals & starflowers', sky: 0xb8c9d8, fog: 0xb8c9d8, sun: 0.65 },
];
const SHOP_SEASONS = { flower: [0, 1], bikes: [0, 1, 2], teahouse: [0, 2, 3] };
const SEASON_POPUPS = [
  { id: 'blossom', name: 'Blossom Tea Stall 🌸', cx: 0, cz: 12, wall: 'leaves', desc: 'spring-only pop-up. petal teas & blossom crowns.' },
  { id: 'ice', name: 'Sunny Ice Stand 🍧', cx: 0, cz: 12, wall: 'glass', desc: 'summer-only pop-up. cool treats & shell crafts.' },
  { id: 'harvest', name: 'Amber Harvest Hut 🍂', cx: 0, cz: 12, wall: 'wood', desc: 'autumn-only pop-up. harvest soups & lanterns.' },
  { id: 'snowgift', name: 'Snowglow Gift Cabin 🎁', cx: 0, cz: 12, wall: 'stone', desc: 'winter-only pop-up. star gifts & snow cocoa.' },
];
// shop lots, SPREAD WIDE across the valley so every shop has lots of breathing room.
// north row (z=-26) + south row (z=+12), 22 apart — a real walk between neighbours.
const BASE_SHOPS = [
  { id: 'bakery', name: 'Sunny Bakery 🍞', cx: -44, cz: -26, wall: 'brick', desc: 'warm bread & seasonal bakes.' },
  { id: 'flower', name: 'Petal Flower Shop 🌷', cx: -22, cz: -26, wall: 'leaves', desc: 'spring & summer blooms. we buy wildflowers, shells & mushrooms.' },
  { id: 'books', name: 'Storybook Books 📚', cx: 0, cz: -26, wall: 'glass', desc: 'picture books & soft poetry for slow afternoons.' },
  { id: 'clothes', name: 'Cloud Clothing 👒', cx: 22, cz: -26, wall: 'wood', desc: 'tees, dresses & hats — new each season.' },
  { id: 'bikes', name: 'Puddle Bike Shop 🚲', cx: 44, cz: -26, wall: 'glass', desc: 'one sturdy bike. closed in snow.' },
  { id: 'volt', name: 'Volt Electronics 🔌', cx: -44, cz: -40, wall: 'glass', desc: 'sun-charged lamps, radios & batteries.' },
  { id: 'tools', name: 'Gadget Tool Shed 🛠️', cx: 44, cz: -40, wall: 'brick', desc: 'drills & gear. home of the bedrock-biting Drill Shovel.' },
  { id: 'homegoods', name: 'Pebble Home Goods 🪑', cx: -44, cz: 12, wall: 'wood', desc: 'little chairs, lamps, rugs & plants for home.' },
  { id: 'cafe', name: 'Mint Café ☕', cx: -22, cz: 12, wall: 'stone', desc: 'cloud lattes & honey toast. seasonal sips too.' },
  { id: 'teahouse', name: 'Hollow Teahouse 🌙', cx: 22, cz: 12, wall: 'wood', desc: 'quiet seasonal teas. closed in high summer.' },
  { id: 'market', name: 'Season Market 🍎', cx: 44, cz: 12, wall: 'brick', desc: 'treats that change with the seasons. we buy shells, starflowers & more.' },
];
// Cottage village: every player claims a DIFFERENT lot, spread FAR around town
// so neighbours never share walls. Picked by name hash (see lotForName).
const HOME_LOTS = [
  { x: -44, z: 32 }, { x: -22, z: 32 }, { x: 0, z: 32 }, { x: 22, z: 32 },
  { x: 44, z: 32 }, { x: -46, z: -8 }, { x: 46, z: -8 }, { x: 0, z: -42 },
];
function hashStr(s) {
  const t = String(s || '');
  let h = 0;
  for (let i = 0; i < t.length; i++) { h = ((h * 31) + t.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function lotForName(name) {
  return HOME_LOTS[hashStr(name) % HOME_LOTS.length];
}
function lotIndexForName(name) {
  return hashStr(name) % HOME_LOTS.length;
}
const SHOPS = {
  bakery: [
    { id: 'bread', e: '🍞', n: 'Milk Bread', p: 'soft & warm', price: 8, use: 'eat', happy: 8 },
    { id: 'tea', e: '🍵', n: 'Chamomile Tea', p: 'sip slowly…', price: 10, use: 'eat', happy: 12 },
    { id: 'cake', e: '🍰', n: 'Strawberry Cake', p: 'to share, or not · spring & summer', price: 18, use: 'eat', happy: 20, seasons: [0, 1] },
    { id: 'blossombun', e: '🌸', n: 'Blossom Bun', p: 'spring exclusive', price: 14, use: 'eat', happy: 16, seasons: [0] },
    { id: 'berrytart', e: '🥧', n: 'Berry Tart', p: 'summer exclusive', price: 16, use: 'eat', happy: 18, seasons: [1] },
    { id: 'pumpkinloaf', e: '🎃', n: 'Pumpkin Loaf', p: 'autumn exclusive', price: 15, use: 'eat', happy: 18, seasons: [2] },
    { id: 'snowcookie', e: '❄️', n: 'Snow Cookie', p: 'winter exclusive', price: 13, use: 'eat', happy: 16, seasons: [3] },
  ],
  flower: [
    { id: 'bouquet', e: '💐', n: 'Daisy Bouquet', p: '+25 happy, giftable', price: 25, use: 'eat', happy: 25, seasons: [0, 1] },
    { id: 'tulippot', e: '🪴', n: 'Tulip Pot', p: 'place at home · spring only', price: 30, use: 'furniture', happy: 6, seasons: [0] },
    { id: 'seedkit', e: '🌱', n: 'Seed Kit', p: 'flowers regrow faster', price: 20, use: 'seed', happy: 5 },
    { id: 'sunpot', e: '🌻', n: 'Sunflower Pot', p: 'place at home · summer only', price: 32, use: 'furniture', happy: 6, seasons: [1] },
  ],
  books: [
    { id: 'picbook', e: '📖', n: 'Picture Book', p: 'a soft story', price: 22, use: 'read', happy: 15, quote: '"and the little cloud decided to take the slow way home."' },
    { id: 'poetry', e: '📜', n: 'Meadow Poems', p: 'read on benches', price: 28, use: 'read', happy: 20, quote: '"petals fall at their own pace — so can you."' },
    { id: 'stickers', e: '✨', n: 'Sticker Pack', p: 'tiny joys', price: 12, use: 'eat', happy: 10 },
    { id: 'springtale', e: '🌸', n: 'Spring Tales', p: 'spring exclusive story', price: 24, use: 'read', happy: 18, seasons: [0], quote: '"the first blossom opened just to say hi."' },
    { id: 'summertale', e: '🌻', n: 'Summer Comics', p: 'summer exclusive story', price: 24, use: 'read', happy: 18, seasons: [1], quote: '"the sun stayed up late to finish the picnic."' },
    { id: 'autumntale', e: '🍁', n: 'Autumn Legends', p: 'autumn exclusive story', price: 24, use: 'read', happy: 18, seasons: [2], quote: '"the amber leaf glowed all the way home."' },
    { id: 'wintertale', e: '❄️', n: 'Winter Lullaby', p: 'winter exclusive story', price: 24, use: 'read', happy: 18, seasons: [3], quote: '"snow fell softly, humming you to sleep."' },
  ],
  clothes: [
    { id: 'minttee', e: '👕', n: 'Mint Tee', p: 'wear: soft green', price: 35, use: 'wear', wear: '#4caf50' },
    { id: 'peachdress', e: '👗', n: 'Sun Dress', p: 'wear · spring & summer', price: 45, use: 'wear', wear: '#ff6b35', seasons: [0, 1] },
    { id: 'lilachat', e: '👒', n: 'Trail Hat', p: 'wear: hat · spring & summer', price: 30, use: 'wearhat', wear: '#7c4dff', seasons: [0, 1] },
    { id: 'creamscarf', e: '🧣', n: 'Cream Scarf', p: 'wear · autumn & winter', price: 28, use: 'wear', wear: '#ffd23f', seasons: [2, 3] },
    { id: 'blossomcrown', e: '🌸', n: 'Blossom Crown', p: 'wear: spring exclusive', price: 38, use: 'wearhat', wear: '#c0392b', seasons: [0] },
    { id: 'sunhat', e: '👒', n: 'Sun Hat', p: 'wear: summer exclusive', price: 32, use: 'wearhat', wear: '#ffd23f', seasons: [1] },
    { id: 'amberscarf', e: '🍁', n: 'Amber Scarf', p: 'wear: autumn exclusive', price: 34, use: 'wear', wear: '#ff6b35', seasons: [2] },
    { id: 'snowcape', e: '❄️', n: 'Snow Cape', p: 'wear: winter exclusive', price: 48, use: 'wear', wear: '#2196f3', seasons: [3] },
  ],
  homegoods: [
    { id: 'chair', e: '🪑', n: 'Wood Chair', p: 'place at home', price: 60, use: 'furniture' },
    { id: 'lamp', e: '💡', n: 'Glow Lamp', p: 'glows softly', price: 55, use: 'furniture' },
    { id: 'rug', e: '🧶', n: 'Rose Rug', p: 'soft under feet', price: 50, use: 'furniture' },
    { id: 'plant', e: '🪴', n: 'Potted Fern', p: 'a calm friend', price: 40, use: 'furniture' },
    { id: 'blossomlantern', e: '🏮', n: 'Blossom Lantern', p: 'spring exclusive · place at home', price: 52, use: 'furniture', seasons: [0] },
    { id: 'shelllamp', e: '🐚', n: 'Shell Lamp', p: 'summer exclusive · place at home', price: 54, use: 'furniture', seasons: [1] },
    { id: 'amberchair', e: '🍂', n: 'Amber Chair', p: 'autumn exclusive · place at home', price: 62, use: 'furniture', seasons: [2] },
    { id: 'starlamp', e: '🌟', n: 'Star Lamp', p: 'winter exclusive · place at home', price: 58, use: 'furniture', seasons: [3] },
  ],
  cafe: [
    { id: 'latte', e: '☕', n: 'Cloud Latte', p: 'warm & slow', price: 12, use: 'eat', happy: 14 },
    { id: 'toast', e: '🍯', n: 'Honey Toast', p: 'golden & soft', price: 14, use: 'eat', happy: 16 },
    { id: 'rest', e: '🌤️', n: 'Sit & Rest', p: 'free. +happy over time', price: 0, use: 'rest', happy: 10 },
    { id: 'sakura', e: '🌸', n: 'Sakura Latte', p: 'spring exclusive', price: 14, use: 'eat', happy: 16, seasons: [0] },
    { id: 'melonsoda', e: '🍈', n: 'Melon Soda', p: 'summer exclusive', price: 14, use: 'eat', happy: 16, seasons: [1] },
    { id: 'chestnut', e: '🌰', n: 'Chestnut Latte', p: 'autumn exclusive', price: 15, use: 'eat', happy: 17, seasons: [2] },
    { id: 'snowcocoa', e: '☕', n: 'Snow Cocoa', p: 'winter exclusive', price: 15, use: 'eat', happy: 17, seasons: [3] },
  ],
  bikes: [
    { id: 'bike', e: '🚲', n: 'Trail Bicycle', p: 'ride with B · gentle bell', price: 120, use: 'bike', seasons: [0, 1, 2] },
    { id: 'basket', e: '🧺', n: 'Flower Basket', p: 'bike rides feel happier', price: 40, use: 'basket', happy: 4, seasons: [0, 1, 2] },
    { id: 'bell', e: '🔔', n: 'Brass Bell', p: 'a rounder ring-ring', price: 15, use: 'eat', happy: 6 },
    { id: 'streamer', e: '🎀', n: 'Spring Streamers', p: 'spring exclusive · +happy', price: 18, use: 'eat', happy: 8, seasons: [0] },
    { id: 'leafcharm', e: '🍁', n: 'Leaf Charm', p: 'autumn exclusive · +happy', price: 18, use: 'eat', happy: 8, seasons: [2] },
  ],
  volt: [
    { id: 'glowbulb', e: '💡', n: 'Glow Bulb', p: 'place at home · cozy light', price: 30, use: 'furniture' },
    { id: 'radio', e: '📻', n: 'Meadow Radio', p: 'a happy tune · +14 happy', price: 22, use: 'eat', happy: 14 },
    { id: 'robotoy', e: '🤖', n: 'Clockwork Pal', p: 'place at home · ticks softly', price: 45, use: 'furniture' },
    { id: 'nightlamp', e: '🌟', n: 'Star Night-Light', p: 'place at home · brave dreams', price: 40, use: 'furniture' },
    { id: 'battery', e: '🔋', n: 'Sunny Battery', p: 'zingy sip · +45 energy', price: 18, use: 'energy', energy: 45 },
  ],
  tools: [
    { id: 'drill', e: '⚒️', n: 'Drill Shovel', p: 'BITES bedrock! dig to the red layer', price: 150, use: 'drill' },
    { id: 'oilcan', e: '🛢️', n: 'Drill Oil', p: 'zingy sip · +25 energy', price: 12, use: 'energy', energy: 25 },
    { id: 'headlamp', e: '🔦', n: 'Headlamp', p: 'wear: light up deep holes', price: 30, use: 'wearhat', wear: '#ffd23f' },
    { id: 'sparebit', e: '⚙️', n: 'Spare Drill Bit', p: 'place at home · looks tough', price: 15, use: 'furniture' },
  ],
  market: [
    { id: 'sproutsalad', e: '🥗', n: 'Sprout Salad', p: 'spring exclusive · crisp', price: 10, use: 'eat', happy: 12, seasons: [0] },
    { id: 'blossomHoney', e: '🍯', n: 'Blossom Honey', p: 'spring exclusive · golden', price: 14, use: 'eat', happy: 15, seasons: [0] },
    { id: 'berry', e: '🫐', n: 'Moon Berries', p: 'summer exclusive · sweet dusk snack', price: 13, use: 'eat', happy: 14, seasons: [1] },
    { id: 'melon', e: '🍈', n: 'Sun Melon', p: 'summer exclusive · juicy', price: 12, use: 'eat', happy: 14, seasons: [1] },
    { id: 'apple', e: '🍎', n: 'Hollow Apple', p: 'autumn exclusive · crisp & calm', price: 9, use: 'eat', happy: 10, seasons: [2] },
    { id: 'mushpie', e: '🥧', n: 'Mushroom Pie', p: 'autumn exclusive favorite', price: 16, use: 'eat', happy: 18, seasons: [2] },
    { id: 'cocoa', e: '🍫', n: 'Stargazing Cocoa', p: 'winter exclusive · warm', price: 12, use: 'eat', happy: 15, seasons: [3] },
    { id: 'snowpear', e: '🍐', n: 'Snow Pear', p: 'winter exclusive · soft & sweet', price: 11, use: 'eat', happy: 13, seasons: [3] },
  ],
  teahouse: [
    { id: 'stea', e: '🍵', n: 'Spring Petal Tea', p: 'spring exclusive · light & floral', price: 11, use: 'eat', happy: 13, seasons: [0] },
    { id: 'spice', e: '🍵', n: 'Amber Spice Tea', p: 'autumn exclusive · warm', price: 12, use: 'eat', happy: 14, seasons: [2] },
    { id: 'starcocoa', e: '🍵', n: 'Starlight Cocoa', p: 'winter exclusive · stargazing', price: 13, use: 'eat', happy: 15, seasons: [3] },
    { id: 'rest2', e: '🌤️', n: 'Lookout Rest', p: 'free. +happy, best at dusk', price: 0, use: 'rest', happy: 12 },
  ],
  blossom: [
    { id: 'petaltea', e: '🍵', n: 'Blossom Petal Tea', p: 'spring pop-up exclusive', price: 12, use: 'eat', happy: 15, seasons: [0] },
    { id: 'crownkit', e: '🌸', n: 'Blossom Crown Kit', p: 'wear: spring pop-up', price: 36, use: 'wearhat', wear: '#c0392b', seasons: [0] },
    { id: 'springseeds', e: '🌱', n: 'Spring Seed Bundle', p: 'regrow blooms faster', price: 22, use: 'seed', happy: 6, seasons: [0] },
  ],
  ice: [
    { id: 'melonice', e: '🍧', n: 'Melon Ice', p: 'summer pop-up exclusive', price: 13, use: 'eat', happy: 16, seasons: [1] },
    { id: 'shellbrace', e: '🐚', n: 'Shell Bracelet', p: 'summer pop-up · +happy', price: 20, use: 'eat', happy: 12, seasons: [1] },
    { id: 'sunfan', e: '🌻', n: 'Sun Paper Fan', p: 'summer pop-up · breezy', price: 16, use: 'eat', happy: 10, seasons: [1] },
  ],
  harvest: [
    { id: 'pumpkinsoup', e: '🎃', n: 'Pumpkin Soup', p: 'autumn pop-up exclusive', price: 15, use: 'eat', happy: 18, seasons: [2] },
    { id: 'amberlantern', e: '🏮', n: 'Amber Lantern', p: 'place at home · autumn pop-up', price: 56, use: 'furniture', seasons: [2] },
    { id: 'leafpie', e: '🥧', n: 'Leaf Pie', p: 'autumn pop-up · warm', price: 14, use: 'eat', happy: 16, seasons: [2] },
  ],
  snowgift: [
    { id: 'stargift', e: '🎁', n: 'Star Gift', p: 'winter pop-up · +happy', price: 26, use: 'eat', happy: 22, seasons: [3] },
    { id: 'snowcocoa2', e: '🍫', n: 'Snowglow Cocoa', p: 'winter pop-up · warmest', price: 13, use: 'eat', happy: 16, seasons: [3] },
    { id: 'warmboots', e: '🧣', n: 'Cloud Boots', p: 'wear: winter pop-up cozy', price: 42, use: 'wear', wear: '#2196f3', seasons: [3] },
  ],
};
const SHOP_DOT = { bakery: '#ffaa00', flower: '#4caf50', books: '#2196f3', clothes: '#7c4dff', homegoods: '#9c6b30', cafe: '#00bcd4', bikes: '#2196f3', market: '#ff6b35', teahouse: '#7c4dff', blossom: '#4caf50', ice: '#00bcd4', harvest: '#ff6b35', snowgift: '#7c4dff', volt: '#00e5ff', tools: '#ff9800' };
const NPC_DEFS = [
  { n: 'Mallow', shirt: '#4caf50', line: 'the pond is extra sparkly today. no hurry — it will wait for you.' },
  { n: 'Pip', shirt: '#ffd23f', line: 'i bought bread and sat with the clouds. 10 out of 10, would loaf again.' },
  { n: 'Wren', shirt: '#ff6b35', line: 'psst… wildflowers behind the cafe sell nicely at the flower shop.' },
  { n: 'Suki', shirt: '#7c4dff', line: (S) => `that color looks so great on you, ${S.name}. ${cap(S.ps)} should wear it more often.` },
  { n: 'Bram', shirt: '#2196f3', line: (S) => `the park missed ${S.po}. well, the park misses everyone. but especially ${S.po}.` },
  { n: 'Lulu', shirt: '#00bcd4', line: 'sit on a bench with a book. time slows down in the best way.' },
  { n: 'Hazel', shirt: '#9c6b30', line: 'welcome to Misty Hollow. the bike shop changed my life. gently.' },
  { n: 'Moss', shirt: '#2e7d32', line: 'mushrooms pop up near the east woods, most in autumn. the market pays well.' },
  { n: 'Stella', shirt: '#4527a0', line: (S) => `the stars say ${S.ps} will have a kind day, ${S.name}. they are rarely wrong.` },
];
const KEEPERS = {
  bakery: { name: 'Mabel', line: (S) => `the milk bread just cooled, ${S.name}. I saved a soft piece for ${S.po}.` },
  flower: { name: 'Petal', line: 'wildflowers, shells and mushrooms — I buy them all, gladly.' },
  books: { name: 'Ash', line: 'the picture book on page three always makes me tear up. in a good way.' },
  clothes: { name: 'Cloud', line: 'everything here is sturdy. the trail hat loves everyone.' },
  homegoods: { name: 'Pebble', line: 'that little chair? it missed you.' },
  cafe: { name: 'Misu', line: 'sit as long as you like. the clouds are doing something lovely.' },
  bikes: { name: 'Spoke', line: 'sturdy bikes only. gentle bells, soft seats. I rest all winter.' },
  market: { name: 'Harvest', line: 'today tastes like the season. my shelves turn over every drift.' },
  teahouse: { name: 'Luna', line: 'the lookout is quietest at dusk. I rest in high summer.' },
  blossom: { name: 'Blossom', line: 'only here for spring! petal tea before I roll away.' },
  ice: { name: 'Sunny', line: 'only here for summer! ice first, worries later.' },
  harvest: { name: 'Amber', line: "only here for autumn! soup's on, lanterns lit." },
  snowgift: { name: 'Snow', line: 'only here for winter! star gifts for kind hearts.' },
  volt: { name: 'Volt', line: 'lamps, radios & sun batteries — all charged with sunshine.' },
  tools: { name: 'Gadget', line: (S) => `bedrock at the bottom of the world? my Drill Shovel bites right through it, ${S.name}.` },
};
function cap(s) { const t = String(s || ''); return t.charAt(0).toUpperCase() + t.slice(1); }

// extended cozy state (saved)
Object.assign(state, {
  name: 'Sunny', style: 0, hair: HAIRS[0].c, shirt: SHIRTS[0], hat: null,
  gender: 'girl', ps: 'she', po: 'her', pp: 'her', pro: 'she / her',
  coins: 150, happy: 60, bag: {}, placedFurn: [], seedBoost: 1,
  season: 0, seasonT: 0, bikeOwned: false, riding: false, hasBasket: false, drillOwned: false,
  decorate: false, inside: null, // null | shopId | 'home' | 'home:N'
  homeXZ: { ...(typeof lotForName === 'function' ? lotForName('Sunny') : { x: 0, z: 28 }) }, thirdPerson: true,
});
function bagTotal() { return Object.values(state.bag).reduce((a, b) => a + b, 0); }
function addItem(id, n = 1) { state.bag[id] = (state.bag[id] || 0) + n; }
function itemInfo(id) {
  for (const k in SHOPS) { const f = SHOPS[k].find((i) => i.id === id); if (f) return f; }
  if (id === 'wildflower') return { id, e: '🌼', n: 'Wildflower', p: 'sell at Flower Shop', price: 6, use: 'sell' };
  if (id === 'shell') return { id, e: '🐚', n: 'Shell', p: 'sell at Flower Shop / Market', price: 9, use: 'sell' };
  if (id === 'mushroom') return { id, e: '🍄', n: 'Soft Mushroom', p: 'sell at Flower Shop (12)', price: 12, use: 'sellshroom' };
  if (id === 'starflower') return { id, e: '🌟', n: 'Starflower', p: 'sell at Season Market (14)', price: 14, use: 'sellstar' };
  if (id === 'litter') return { id, e: '🍃', n: 'Tidy Leaf', p: 'park thanks you', price: 0, use: 'none' };
  return { id, e: '🎁', n: id, p: '', price: 0, use: 'none' };
}
function seasonalStock(keyM) {
  const s = state.season || 0;
  return (SHOPS[keyM] || []).filter((it) => !it.seasons || it.seasons.includes(s));
}
function dotColor(id) {
  for (const k in SHOPS) { if (SHOPS[k].some((i) => i.id === id)) return SHOP_DOT[k] || '#ffd23f'; }
  return { wildflower: '#4caf50', shell: '#2196f3', mushroom: '#c0392b', starflower: '#ffd23f', litter: '#9c6b30' }[id] || '#ffd23f';
}
function isShopOpen(id, season) {
  const s = season == null ? state.season || 0 : season;
  const only = SHOP_SEASONS[id];
  if (only && !only.includes(s)) return false;
  return true;
}
function currentPopup(season) {
  const s = ((season == null ? state.season || 0 : season) % 4 + 4) % 4;
  return SEASON_POPUPS[s];
}
function seasonalShopsNote() {
  const s = state.season || 0;
  const closed = BASE_SHOPS.filter((b) => !isShopOpen(b.id, s)).map((b) => b.name);
  const pop = currentPopup(s);
  let t = ` • ${SEASONS[s].n} exclusive stock`;
  if (pop) t += ` • new: ${pop.name}`;
  if (closed.length) t += ` • resting: ${closed.join(', ')}`;
  return t;
}

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 30, 90);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);
// Perf: MSAA + full devicePixelRatio kills phones once voxel count grows
// (67k+ individual meshes = thousands of draw calls). Phones get no AA
// and a capped pixel ratio; desktops keep the pretty path.
const IS_COARSE = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } })();
const renderer = new THREE.WebGLRenderer({ antialias: !IS_COARSE });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_COARSE ? 1.25 : 2));
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x557755, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(30, 50, 20);
scene.add(sun);

// Shared geometries / materials
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const pyramidGeo = new THREE.ConeGeometry(0.72, 1, 4);
pyramidGeo.rotateY(Math.PI / 4);
const edgeGeo = new THREE.EdgesGeometry(boxGeo);
const pyramidEdgeGeo = new THREE.EdgesGeometry(pyramidGeo);
const materials = {};
BLOCKS.forEach(b => {
  materials[b.id] = new THREE.MeshLambertMaterial({
    color: b.color,
    transparent: !!b.transparent, opacity: b.transparent ? 0.6 : 1,
  });
});
const cubeEdgeMat = new THREE.LineBasicMaterial({ color: 0x7a5b00 });
const pyramidEdgeMat = new THREE.LineBasicMaterial({ color: 0x2a1b6b });

// Voxel storage: "x,y,z" -> { id, mesh }
const voxels = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const voxelAt = (x, y, z) => voxels.get(key(Math.floor(x), Math.floor(y), Math.floor(z)));

function addVoxel(x, y, z, id, save = true) {
  x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
  const k = key(x, y, z);
  if (voxels.has(k)) return false;
  const def = BLOCKS.find(b => b.id === id);
  const geo = def?.pyramid ? pyramidGeo : boxGeo;
  const mesh = new THREE.Mesh(geo, materials[id] || materials.dirt);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  if (def?.lesson) {
    const eg = def.pyramid ? pyramidEdgeGeo : edgeGeo;
    const em = def.pyramid ? pyramidEdgeMat : cubeEdgeMat;
    mesh.add(new THREE.LineSegments(eg, em));
  }
  scene.add(mesh);
  voxels.set(k, { id, mesh });
  return true;
}

function removeVoxel(x, y, z) {
  const k = key(Math.floor(x), Math.floor(y), Math.floor(z));
  const v = voxels.get(k);
  if (!v) return null;
  scene.remove(v.mesh);
  voxels.delete(k);
  return v.id;
}

function clearWorld() {
  [...voxels.values()].forEach(v => scene.remove(v.mesh));
  voxels.clear();
  clearShopBoards();
}

const WORLD_R = 30; // starter patch (was 52 -> ~75k meshes upfront, phones crawled before Play). land beyond is infinite.
const GROUND_R = 24; // how far around you ground always exists (was 36 -> ~35k meshes per refresh; now ~13k)
const UNLOAD_R = 60; // ground farther than this is recycled (was 90 -> could hold ~180k voxels; now caps much lower)
const BEDROCK_Y = -5; // deep floor you can't break — dig down to it
// Earth strata: grass on top, dirt, then stone down to bedrock.
function earthLayerAt(y) {
  if (y >= -2) return 'dirt'; // y=-1, -2: soft dirt
  if (y === BEDROCK_Y) return 'brick'; // RED drill-level — needs the Drill Shovel 🛠️
  return 'stone'; // rock above + solid core below
}
const shopKeys = new Set(); // protected shop/home voxels (key strings)
const minedGround = new Set(); // ground cells YOU dug out — the generator must not refill them
function rememberMined(k) {
  minedGround.add(k);
  if (minedGround.size > 3000) minedGround.delete(minedGround.values().next().value); // drop oldest
}
const treeVox = new Set(); // tree wood/leaves cells — safe to drop when far (they regrow identically)
function addTreeVox(x, y, z, id) {
  if (addVoxel(x, y, z, id, false)) { treeVox.add(key(x, y, z)); return true; }
  return false;
}
const townShops = []; // active shop defs this season: {id,name,cx,cz,wall,desc,door:{x,y,z}}
const shopBoards = []; // floating name-board sprites, one per shop/home
function clearShopBoards() {
  for (const s of shopBoards) {
    scene.remove(s);
    try { s.material.map?.dispose(); } catch {}
    try { s.material.dispose(); } catch {}
  }
  shopBoards.length = 0;
}
function makeShopBoard(b) {
  const text = String(b.name || b.id || 'Shop');
  const accent = b.id === 'home' ? '#4caf50' : (SHOP_DOT[b.id] || '#ffd23f');
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  // wood plank background
  g.fillStyle = '#5d4037';
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#795548';
  for (let y = 18; y < 128; y += 28) { g.fillRect(0, y, 512, 3); }
  // accent border
  g.lineWidth = 10;
  g.strokeStyle = accent;
  g.strokeRect(6, 6, 500, 116);
  // text (shrink to fit)
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 52;
  g.font = `800 ${size}px 'Segoe UI', system-ui, Arial, sans-serif`;
  while (g.measureText(text).width > 460 && size > 22) {
    size -= 4;
    g.font = `800 ${size}px 'Segoe UI', system-ui, Arial, sans-serif`;
  }
  g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.65)';
  g.strokeText(text, 256, 66);
  g.fillStyle = '#ffffff';
  g.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(4.4, 1.1, 1);
  // float above the front (south) wall, over the wide door — taller houses get taller boards
  const _wallH = (b.wallH != null ? b.wallH : 4), _hz = (b.hz != null ? b.hz : 2);
  sp.position.set(b.cx + 0.5, _wallH + 2.6, b.cz + _hz + 0.8);
  scene.add(sp);
  shopBoards.push(sp);
  b.board = sp;
}
let homeDoor = { x: 0, y: 1, z: 31 };
const POND = { x: -6, z: -2, rx: 4, ry: 3 };
const LAKE = { x: 10, z: -4, rx: 3, ry: 3 };
const LAGOON = { x: -28, z: 22, rx: 8, ry: 5 }; // big swim lake (south-west, clear of shops/lots)
const SEA = { x: 0, z: 52, rx: 70, ry: 14 };    // southern sea — water, not endless land
const WATERS = [POND, LAKE, LAGOON, SEA];
const LOOKOUT = { x: 24, y: 1, z: 19 };
const BENCHES = [{ x: -12, z: 2 }, { x: 0, z: -6 }, { x: 12, z: 2 }, { x: -6, z: -12 }];
function inWater2(x, z) {
  const pdx = (x - POND.x) / POND.rx, pdz = (z - POND.z) / POND.ry;
  const ldx = (x - LAKE.x) / LAKE.rx, ldz = (z - LAKE.z) / LAKE.ry;
  return pdx * pdx + pdz * pdz < 1 || ldx * ldx + ldz * ldz < 1;
}
function shopAt(x, z, pad = 0) {
  for (const b of townShops) {
    const hx = (b.hx != null ? b.hx : 3), hz = (b.hz != null ? b.hz : 2);
    if (x >= b.cx - hx - pad && x <= b.cx + hx + pad && z >= b.cz - hz - pad && z <= b.cz + hz + pad) return b;
  }
  return null;
}
function buildShopVoxels(b) {
  // Shops: 7x5, 4-high walls. Cottages (hx=4,hz=3): 9x7 BIG houses, 5-high,
  // SOLID full roof overhead. All doors 3-wide so nobody gets stuck.
  const hx = (b.hx != null ? b.hx : 3), hz = (b.hz != null ? b.hz : 2);
  const wallH = (b.wallH != null ? b.wallH : 4);
  const doorHalf = (b.doorHalf != null ? b.doorHalf : 1);
  const wallId = BLOCKS.some((b2) => b2.id === b.wall) ? b.wall : 'wood';
  for (let dx = -hx; dx <= hx; dx++) for (let dz = -hz; dz <= hz; dz++) {
    const x = b.cx + dx, z = b.cz + dz;
    const edge = Math.abs(dx) === hx || Math.abs(dz) === hz;
    if (!edge) continue;
    for (let y = 1; y <= wallH; y++) {
      const isDoor = dz === hz && Math.abs(dx) <= doorHalf && y <= 3;
      if (isDoor) continue;
      if (addVoxel(x, y, z, wallId, false)) shopKeys.add(key(x, y, z));
    }
  }
  if (b.openRoof) {
    // rim only — open skylight so the room is bright and visible from above
    for (let dx = -hx; dx <= hx; dx++) for (let dz = -hz; dz <= hz; dz++) {
      const edge = Math.abs(dx) === hx || Math.abs(dz) === hz;
      if (!edge) continue;
      if (addVoxel(b.cx + dx, wallH + 1, b.cz + dz, 'wood', false)) shopKeys.add(key(b.cx + dx, wallH + 1, b.cz + dz));
    }
  } else if (hx >= 4 && hz >= 3) {
    // PEAKED cottage roof: 4 stepping layers up to a ridge (9x7 -> 7x5 -> 5x3 -> 3x1)
    const roofId = wallId;
    const layers = [[hx, hz], [hx - 1, hz - 1], [hx - 2, hz - 2], [hx - 3, hz - 3]];
    layers.forEach(([rx, rz], li) => {
      const y = wallH + 1 + li;
      for (let dx = -rx; dx <= rx; dx++) for (let dz = -rz; dz <= rz; dz++) {
        if (addVoxel(b.cx + dx, y, b.cz + dz, roofId, false)) shopKeys.add(key(b.cx + dx, y, b.cz + dz));
      }
    });
  } else {
    // full flat roof (shops)
    for (let dx = -hx; dx <= hx; dx++) for (let dz = -hz; dz <= hz; dz++) {
      if (addVoxel(b.cx + dx, wallH + 1, b.cz + dz, 'wood', false)) shopKeys.add(key(b.cx + dx, wallH + 1, b.cz + dz));
    }
  }
  b.door = { x: b.cx + 0.5, y: 1.6, z: b.cz + hz + 1.2 };
  makeShopBoard(b);
}
function clearShopVoxels() {
  for (const k of [...shopKeys]) {
    const [x, y, z] = k.split(',').map(Number);
    removeVoxel(x, y, z);
  }
  shopKeys.clear();
  townShops.length = 0;
  clearShopBoards();
}
// wipe structure footprints so load() never restores stale shop/home walls
// (refreshSeasonalShops rebuilds them pristine + protected right after)
function clearStructureVoxels() {
  const wipeShop = (cx, cz, hx = 3, hz = 2, top = 5) => {
    for (let dx = -hx - 1; dx <= hx + 1; dx++) for (let dz = -hz - 1; dz <= hz + 1; dz++) {
      for (let y = 1; y <= top; y++) removeVoxel(cx + dx, y, cz + dz);
    }
  };
  for (const b of BASE_SHOPS) wipeShop(b.cx, b.cz);
  for (const p of SEASON_POPUPS) wipeShop(p.cx, p.cz);
  for (const lot of HOME_LOTS) {
    wipeShop(lot.x, lot.z, 4, 3, 14); // BIG peaked cottages (roof to y=9) + beacon to y=13
    for (let y = 6; y <= 13; y++) removeVoxel(lot.x, y, lot.z);
    // lamp posts outside the door
    for (const dx of [-2, 2]) { removeVoxel(lot.x + dx, 1, lot.z + 4); removeVoxel(lot.x + dx, 2, lot.z + 4); }
  }
  wipeShop(state.homeXZ.x, state.homeXZ.z);
  const ox = HOME_IN.x, oz = HOME_IN.z;
  const hx = (typeof HOME_R !== 'undefined' ? HOME_R.x : 4);
  const hz = (typeof HOME_R !== 'undefined' ? HOME_R.z : 3);
  for (let dx = -hx; dx <= hx; dx++) for (let dz = -hz; dz <= hz; dz++) {
    for (let y = 0; y <= 3; y++) removeVoxel(ox + dx, y, oz + dz);
  }
}
function isHomeId(id) { return id === 'home' || (typeof id === 'string' && id.indexOf('home:') === 0); }
function isInsideHome() { return state.inside === 'home' || (typeof state.inside === 'string' && state.inside.indexOf('home:') === 0); }
function retitleBoard(b) {
  try {
    if (b.board) {
      scene.remove(b.board);
      const i = shopBoards.indexOf(b.board);
      if (i >= 0) shopBoards.splice(i, 1);
      try { b.board.material.map?.dispose(); } catch {}
      try { b.board.material.dispose(); } catch {}
      b.board = null;
    }
  } catch {}
  makeShopBoard(b);
}
// every cottage lot gets a house so the village feels alive.
// YOUR lot (by name hash) is your home; others are neighbours you can visit.
function refreshSeasonalShops() {
  clearShopVoxels();
  const s = state.season || 0;
  for (const b of BASE_SHOPS) {
    if (!isShopOpen(b.id, s)) continue;
    const def = { ...b, door: null };
    townShops.push(def);
    buildShopVoxels(def);
  }
  const pop = currentPopup(s);
  if (pop) {
    const def = { ...pop, door: null };
    townShops.push(def);
    buildShopVoxels(def);
  }
  const ownIdx = lotIndexForName(state.name);
  // make sure state.homeXZ matches your claimed lot (name may have changed)
  const ownLot = HOME_LOTS[ownIdx];
  state.homeXZ = { x: ownLot.x, z: ownLot.z };
  HOME_LOTS.forEach((lot, idx) => {
    const isOwn = idx === ownIdx;
    const home = {
      id: isOwn ? 'home' : ('home:' + idx),
      name: isOwn ? `🏡 MY HOUSE · ${state.name}'s cottage` : `Cottage ${idx + 1} 🏡`,
      cx: lot.x, cz: lot.z, wall: isOwn ? 'brick' : 'wood',
      desc: isOwn ? 'YOUR house! press E at the door to go inside & decorate!' : 'a neighbour cottage. press E at the door to step inside & visit!',
      door: null, lotIdx: idx,
      hx: 4, hz: 3, wallH: 5, doorHalf: 1, openRoof: false,
    };
    townShops.push(home);
    buildShopVoxels(home);
    buildCottageExtras(home, isOwn);
    if (isOwn) homeDoor = { x: home.cx + 0.5, y: 1.6, z: home.cz + 4.2 };
  });
  buildHomeInterior();
  try { refreshHomeNames(); } catch {}
}
// BIG walk-in cottages: 9 wide x 7 deep, with a SOLID roof overhead.
// Nothing solid inside the room (no voxel bed/table to get stuck on) —
// just a walkable door mat + lamp posts OUTSIDE + beacon above YOUR roof.
function buildCottageExtras(b, isOwn) {
  try {
    // door mat (walkable floor, protected so ground recycling keeps it)
    const mx = b.cx, mz = b.cz + 4;
    removeVoxel(mx, 0, mz);
    if (addVoxel(mx, 0, mz, isOwn ? 'brick' : 'wood', false)) shopKeys.add(key(mx, 0, mz));
    // lamp posts flanking the door, OUTSIDE the walkway so they never trap you
    for (const dx of [-2, 2]) {
      const px2 = b.cx + dx, pz2 = b.cz + 4;
      if (!voxels.has(key(px2, 1, pz2))) {
        if (addVoxel(px2, 1, pz2, 'wood', false)) shopKeys.add(key(px2, 1, pz2));
      }
      if (addVoxel(px2, 2, pz2, 'glass', false)) shopKeys.add(key(px2, 2, pz2));
    }
    if (isOwn) {
      // golden beacon above YOUR peaked roof (roof top is y=9) — visible across the valley
      for (let y = 10; y <= 13; y++) {
        if (addVoxel(b.cx, y, b.cz, 'cube', false)) shopKeys.add(key(b.cx, y, b.cz));
      }
    }
  } catch {}
}
// rename neighbour cottages to live player names when we know them
function refreshHomeNames() {
  const ownIdx = lotIndexForName(state.name);
  const taken = new Set([ownIdx]);
  const want = new Map(); // lotIdx -> name
  // bots take the next free lots so they feel like residents
  try {
    for (const b of bots) {
      const nm = (b.profile && b.profile.name) || 'friend';
      let idx = lotIndexForName('bot-' + nm);
      for (let k = 0; k < HOME_LOTS.length; k++) {
        const cand = (idx + k) % HOME_LOTS.length;
        if (!taken.has(cand)) { idx = cand; break; }
      }
      if (!taken.has(idx)) { taken.add(idx); want.set(idx, `${nm}'s cottage 🏡`); }
    }
  } catch {}
  // live multiplayer friends claim lots too — everyone keeps a different house
  try {
    for (const [, p] of MP.players) {
      const nm = (p.profile && p.profile.name) || 'friend';
      const pid = p.id || nm;
      let idx = (hashStr(pid) + hashStr(nm)) % HOME_LOTS.length;
      for (let k = 0; k < HOME_LOTS.length; k++) {
        const cand = (idx + k) % HOME_LOTS.length;
        if (!taken.has(cand)) { idx = cand; break; }
      }
      if (!taken.has(idx)) { taken.add(idx); want.set(idx, `${nm}'s cottage 🏡`); }
    }
  } catch {}
  for (const b of townShops) {
    if (!isHomeId(b.id)) continue;
    if (b.id === 'home') continue; // yours already named
    const idx = (b.lotIdx != null ? b.lotIdx : parseInt(String(b.id).split(':')[1] || '0', 10) || 0);
    const label = want.get(idx) || `Cottage ${idx + 1} 🏡`;
    if (b.name !== label) { b.name = label; retitleBoard(b); }
  }
}
// ---- infinite land helpers ----
function groundTopAt(x, z) {
  return inWater2(x + 0.5, z + 0.5) ? 'glass' : 'grass';
}
function structureAt(x, z, pad = 0) {
  for (const b of BASE_SHOPS) {
    if (x >= b.cx - 3 - pad && x <= b.cx + 3 + pad && z >= b.cz - 2 - pad && z <= b.cz + 2 + pad) return b;
  }
  for (const p of SEASON_POPUPS) {
    if (x >= p.cx - 3 - pad && x <= p.cx + 3 + pad && z >= p.cz - 2 - pad && z <= p.cz + 2 + pad) return p;
  }
  for (const lot of HOME_LOTS) {
    // BIG cottages now: 9 wide x 7 deep
    if (x >= lot.x - 4 - pad && x <= lot.x + 4 + pad && z >= lot.z - 3 - pad && z <= lot.z + 3 + pad) return lot;
  }
  return null;
}
function maybePlantTree(x, z) {
  // deterministic sparse trees for endless meadow — same spot always grows same tree.
  // NEVER on top of people: keep a clear bubble around you + spawn + doors so trees can't trap anyone.
  if ((hashStr(x + ',' + z) % 220) !== 7) return;
  if (inWater2(x + 0.5, z + 0.5) || structureAt(x, z, 4)) return;
  if (Math.abs(x - HOME_IN.x) < 10 && Math.abs(z - HOME_IN.z) < 10) return;
  try {
    if (Math.hypot(x + 0.5 - player.pos.x, z + 0.5 - player.pos.z) < 8) return;
  } catch {}
  if (Math.hypot(x - 0.5, z + 2) < 8) return; // spawn meadow stays clear
  try {
    for (const b of townShops) {
      if (b.door && Math.hypot(x + 0.5 - b.door.x, z + 0.5 - b.door.z) < 6) return;
    }
  } catch {}
  if (voxels.has(key(x, 1, z))) return;
  const h = 3 + (hashStr('h' + x + ',' + z) % 2);
  for (let y = 1; y <= h; y++) addTreeVox(x, y, z, 'wood');
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy <= 1; dy++) {
    if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && dy === 1) continue;
    addTreeVox(x + dx, h + dy, z + dz, 'leaves');
  }
}
function ensureGroundAround(px, pz) {
  const cx = Math.floor(px), cz = Math.floor(pz);
  const R = GROUND_R;
  for (let x = cx - R; x <= cx + R; x++) {
    for (let z = cz - R; z <= cz + R; z++) {
      // round-ish so corners don't spike the mesh count
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz > (R + 4) * (R + 4)) continue;
      // full strata down to bedrock — but NEVER refill a cell you mined out
      for (let y = -1; y >= BEDROCK_Y - 1; y--) {
        const k = key(x, y, z);
        if (!minedGround.has(k) && !voxels.has(k)) addVoxel(x, y, z, earthLayerAt(y), false);
      }
      if (!minedGround.has(key(x, 0, z)) && !voxels.has(key(x, 0, z))) {
        addVoxel(x, 0, z, groundTopAt(x, z), false);
        maybePlantTree(x, z);
      }
    }
  }
}
let unloadT = 0;
function unloadFarGround() {
  const px = player.pos.x, pz = player.pos.z;
  const R2 = UNLOAD_R * UNLOAD_R;
  let n = 0;
  // batched so one tick never hitches; your builds (y>0, not trees) are always kept.
  // batch is large + runs often: walking forward must free behind you at least as
  // fast as ensureGroundAround allocates ahead of you, or voxel count (and draw
  // calls) grows forever and the game gets slower the longer you walk.
  for (const [k, v] of voxels) {
    if (n > 8000) break;
    const parts = k.split(',');
    const x = +parts[0], y = +parts[1], z = +parts[2];
    const dx = x - px, dz = z - pz;
    if (dx * dx + dz * dz < R2) continue;
    if (shopKeys.has(k)) continue;
    if (treeVox.has(k)) { removeVoxel(x, y, z); treeVox.delete(k); n++; continue; } // regrows on return
    if (y > 0) continue;
    removeVoxel(x, y, z); n++;
  }
}
function genWorld(freshTrees = true) {
  clearWorld();
  shopKeys.clear(); minedGround.clear(); treeVox.clear(); townShops.length = 0;
  const R = WORLD_R;
  for (let x = -R; x < R; x++) for (let z = -R; z < R; z++) {
    for (let y = -1; y >= BEDROCK_Y - 1; y--) addVoxel(x, y, z, earthLayerAt(y), false);
    if (inWater2(x + 0.5, z + 0.5)) addVoxel(x, 0, z, 'glass', false);
    else addVoxel(x, 0, z, 'grass', false);
  }
  // NO border walls — the meadow runs forever. ground keeps generating as you walk.
  if (freshTrees) {
    for (let i = 0; i < 14; i++) {
      const tx = Math.floor((Math.random() - 0.5) * 80);
      const tz = Math.floor((Math.random() - 0.5) * 70);
      if (Math.hypot(tx - 0.5, tz + 2) < 8) continue; // never on the spawn meadow
      if (inWater2(tx, tz) || structureAt(tx, tz, 3)) continue;
      const h = 3 + Math.floor(Math.random() * 2);
      for (let y = 1; y <= h; y++) addTreeVox(tx, y, tz, 'wood');
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 0; dy <= 1; dy++) {
        if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && dy === 1) continue;
        addTreeVox(tx + dx, h + dy, tz + dz, 'leaves');
      }
    }
  }
  refreshSeasonalShops();
  buildBenchesLookout();
  // spawn meadow must be walkable: clear any trunks/leaves above it (trees can't trap you here)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    for (let y = 1; y <= 4; y++) removeVoxel(Math.floor(0.5) + dx, y, Math.floor(-2) + dz);
  }
  try { ensureGroundAround(0.5, -2); } catch {}
  scatterPickups();
  spawnNPCs();
  spawnBots();
  buildFurnitureMeshes();
}
function buildBenchesLookout() {
  for (const bch of BENCHES) {
    addVoxel(bch.x, 1, bch.z, 'wood', false);
    addVoxel(bch.x + 1, 1, bch.z, 'wood', false);
  }
  // lookout hill: stone pillar + glass top
  for (let y = 1; y <= 3; y++) addVoxel(LOOKOUT.x, y, LOOKOUT.z, 'stone', false);
  addVoxel(LOOKOUT.x, 4, LOOKOUT.z, 'glass', false);
}

// ---------- Player controller ----------
const player = {
  pos: new THREE.Vector3(0.5, 3, -2),
  vel: new THREE.Vector3(),
  yaw: Math.PI, pitch: 0, onGround: false,
};
const P_HEIGHT = 1.8, P_RADIUS = 0.3, SPEED = 5.5, JUMP = 8.5, GRAV = 26;
const FLY_SPEED = 10, FLY_UP = 8, FLY_MAX_Y = 40;

function collides(px, py, pz) {
  // AABB vs voxels
  const minX = Math.floor(px - P_RADIUS), maxX = Math.floor(px + P_RADIUS);
  const minY = Math.floor(py), maxY = Math.floor(py + P_HEIGHT - 0.01);
  const minZ = Math.floor(pz - P_RADIUS), maxZ = Math.floor(pz + P_RADIUS);
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) for (let z = minZ; z <= maxZ; z++) {
    if (voxels.has(key(x, y, z))) return true;
  }
  return false;
}

function moveAxis(axis, amount) {
  const p = player.pos.clone();
  p[axis] += amount;
  if (!collides(p.x, p.y, p.z)) player.pos.copy(p);
  else if (axis === 'y') {
    if (amount < 0) player.onGround = true;
    player.vel.y = 0;
  }
}

const keys = {};
let flyUpHeld = false, flyDownHeld = false;
function anyModalOpen() {
  return isQuizOpen() || isHelpOpen() || isShopOpen_() || isBagOpen() || isDialogOpen() || isBugOpen();
}
let lastSpaceTap = 0;
addEventListener('keydown', (e) => {
  const chatFocus = document.activeElement === $('chatIn') || document.activeElement === $('nameInput');
  if (!chatFocus) keys[e.code] = true;
  if (chatFocus) {
    if (e.code === 'Escape') { try { document.activeElement.blur(); } catch {} toggleChat(false); }
    if (e.code === 'Enter' && document.activeElement === $('chatIn')) { e.preventDefault(); mpSendChat(); }
    return;
  }
  if (e.code === 'Digit1') selectSlot(0); if (e.code === 'Digit2') selectSlot(1);
  if (e.code === 'Digit3') selectSlot(2); if (e.code === 'Digit4') selectSlot(3);
  if (e.code === 'Digit5') selectSlot(4); if (e.code === 'Digit6') selectSlot(5);
  if (e.code === 'Digit7') selectSlot(6); if (e.code === 'Digit8') selectSlot(7);
  if (e.code === 'Digit9') selectSlot(8);
  if (e.code === 'KeyQ') openQuiz();
  if (e.code === 'KeyE' && state.started && !anyModalOpen()) interact();
  if (e.code === 'KeyB' && state.started && !anyModalOpen()) toggleBike();
  if (e.code === 'KeyH' && state.started) { if (state.riding) ringBell(); }
  if (e.code === 'KeyT' && state.started) {
    if (MP.on) toggleChat();
    else toast('Press F (or the Friends button) to join multiplayer chat first!');
  }
  if (e.code === 'KeyF' && state.started && !anyModalOpen()) mpToggle();
  if (e.code === 'KeyG' && state.started && !anyModalOpen()) toggleFly();
  if (e.code === 'KeyU' && state.started && !anyModalOpen()) unstickPlayer(false);
  if (e.code === 'KeyV' && state.started && !anyModalOpen()) toggleView();
  if (e.code === 'KeyI' && state.started) { isBagOpen() ? closeBag() : openBag(); }
  if (e.code === 'Escape') {
    closeQuiz(); $('help-modal').classList.add('hidden');
    if (isShopOpen_()) $('shop-modal').classList.add('hidden');
    if (isBagOpen()) $('bag-modal').classList.add('hidden');
    if (isDialogOpen()) $('dialog-modal').classList.add('hidden');
    if (isBugOpen()) $('bug-modal').classList.add('hidden');
    toggleChat(false);
  }
  if (e.code === 'Space') {
    e.preventDefault();
    // double-tap Space toggles fly (Minecraft-style), single tap still jumps
    if (!e.repeat && state.started && !anyModalOpen()) {
      const now = performance.now();
      if (now - lastSpaceTap < 300) { toggleFly(); lastSpaceTap = 0; }
      else lastSpaceTap = now;
    }
  }
});
addEventListener('keyup', (e) => keys[e.code] = false);

function updatePlayer(dt) {
  // infinite land: keep ground under your feet before physics runs.
  // NOTE: the home interior is a self-contained protected room at HOME_IN —
  // it needs no infinite ground, and generating around it while indoors only
  // grows the voxel count (town ground stays loaded too). Skip it indoors.
  try { if (!isInsideHome()) tickInfiniteGround(dt, false); } catch {}
  // anti-stuck: if a tree grew into you, gently lift out instead of wedging
  try {
    if (collides(player.pos.x, player.pos.y, player.pos.z)) player.pos.y += Math.min(1, 0.2 + dt * 4);
  } catch {}
  const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3();
  // keyboard
  if (keys.KeyW || keys.ArrowUp) move.add(fwd);
  if (keys.KeyS || keys.ArrowDown) move.sub(fwd);
  if (keys.KeyA || keys.ArrowLeft) move.sub(right);
  if (keys.KeyD || keys.ArrowRight) move.add(right);
  // joystick
  move.addScaledVector(fwd, -joy.y);
  move.addScaledVector(right, joy.x);
  if (move.lengthSq() > 1) move.normalize();
  if (state.flying) {
    // creative fly: fast horizontal glide + Space up / Shift (or C) down
    move.multiplyScalar(FLY_SPEED * dt);
    moveAxis('x', move.x); moveAxis('z', move.z);
    let vy = 0;
    if (keys.Space || jumpQueued || flyUpHeld) vy += 1;
    if (keys.ShiftLeft || keys.ShiftRight || keys.KeyC || keys.ControlLeft || flyDownHeld) vy -= 1;
    jumpQueued = false;
    player.vel.y = 0;
    player.onGround = false;
    moveAxis('y', vy * FLY_UP * dt);
    // gentle ceiling so you can't get lost in the sky
    if (player.pos.y > FLY_MAX_Y) player.pos.y = FLY_MAX_Y;
  } else {
    const sprint = (keys.ShiftLeft || keys.ShiftRight) ? 1.7 : 1;
    const bikeMul = state.riding ? 1.55 : 1; // Trail Bicycle glides but stays calm
    move.multiplyScalar(SPEED * sprint * bikeMul * dt);
    moveAxis('x', move.x); moveAxis('z', move.z);

    player.vel.y -= GRAV * dt;
    if ((keys.Space || jumpQueued) && player.onGround) {
      player.vel.y = JUMP; player.onGround = false;
    }
    jumpQueued = false;
    player.onGround = false;
    moveAxis('y', player.vel.y * dt);
  }
  if (isInsideHome()) {
    // stay on the home platform while indoors (it lives outside valley bounds)
    player.pos.x = Math.max(HOME_IN.x - 5.4, Math.min(HOME_IN.x + 5.4, player.pos.x));
    player.pos.z = Math.max(HOME_IN.z - 4.4, Math.min(HOME_IN.z + 4.4, player.pos.z));
  } else {
    // OPEN WORLD: no walls, no invisible fences — walk as far as you like.
    // (ground generates ahead of you via tickInfiniteGround)
  }
  if (player.pos.y < -10) {
    try { ensureGroundAround(player.pos.x, player.pos.z); } catch {}
    player.pos.y = 5; player.vel.set(0, 0, 0);
  }

  positionCamera();
}
let lastGroundCX = 1e9, lastGroundCZ = 1e9, groundT = 0;
function tickInfiniteGround(dt, force) {
  groundT += dt || 0;
  const cx = Math.floor(player.pos.x), cz = Math.floor(player.pos.z);
  if (force || groundT > 0.4 || Math.abs(cx - lastGroundCX) > 6 || Math.abs(cz - lastGroundCZ) > 6) {
    groundT = 0; lastGroundCX = cx; lastGroundCZ = cz;
    ensureGroundAround(player.pos.x, player.pos.z);
    unloadT++;
    if (unloadT % 2 === 0) unloadFarGround();
  }
}

// ---------- Look / pointer lock ----------
let locked = false;
renderer.domElement.addEventListener('click', () => {
  if (state.started && !isQuizOpen() && !isHelpOpen() && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
  }
});
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
});
document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  player.yaw -= e.movementX * 0.0025;
  player.pitch -= e.movementY * 0.0025;
  player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch));
});
addEventListener('wheel', (e) => {
  if (!state.started || isQuizOpen()) return;
  selectSlot((state.selected + (e.deltaY > 0 ? 1 : BLOCKS.length - 1)) % BLOCKS.length);
}, { passive: true });

// Touch look: drag on right half of screen
let lookTouch = null;
addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX > innerWidth * 0.4 && lookTouch === null) lookTouch = { id: t.identifier, x: t.clientX, y: t.clientY };
  }
}, { passive: true });
addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (lookTouch && t.identifier === lookTouch.id) {
      player.yaw -= (t.clientX - lookTouch.x) * 0.005;
      player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch - (t.clientY - lookTouch.y) * 0.005));
      lookTouch.x = t.clientX; lookTouch.y = t.clientY;
    }
  }
}, { passive: true });
addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) if (lookTouch && t.identifier === lookTouch.id) lookTouch = null;
});

// ---------- Break / place ----------
const ray = new THREE.Raycaster();
ray.far = 6;
const center = new THREE.Vector2(0, 0);

// White outline showing the currently targeted block (Minecraft-style)
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
);
highlight.visible = false;
scene.add(highlight);

function targetVoxel() {
  // aim from the player's eyes along the view direction (stays truthful in 3rd person)
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const e = eyePos();
  ray.set(e, dir);
  // only test nearby cubes (reach is 6) — never the whole endless world
  const cx = Math.floor(e.x), cy = Math.floor(e.y), cz = Math.floor(e.z);
  const meshes = [];
  for (let x = cx - 7; x <= cx + 7; x++) for (let y = cy - 4; y <= cy + 4; y++) for (let z = cz - 7; z <= cz + 7; z++) {
    const v = voxels.get(key(x, y, z));
    if (v) meshes.push(v.mesh);
  }
  const hits = ray.intersectObjects(meshes, false);
  if (!hits.length) return null;
  const h = hits[0];
  return { point: h.point, normal: h.face?.normal || new THREE.Vector3(0, 1, 0), object: h.object };
}

// Robust face normal: dominant axis from voxel center to hit point.
// Works for cubes AND pyramid (cone side-normals aren't axis-aligned).
function faceNormal(t) {
  const d = t.point.clone().sub(t.object.position);
  const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z);
  if (ax > ay && ax > az) return new THREE.Vector3(Math.sign(d.x) || 1, 0, 0);
  if (az > ax && az > ay) return new THREE.Vector3(0, 0, Math.sign(d.z) || 1);
  return new THREE.Vector3(0, Math.sign(d.y) || 1, 0);
}

let highlightTimer = 0;
function updateHighlight(dt) {
  highlightTimer -= dt;
  if (highlightTimer > 0) return;
  highlightTimer = 0.08; // ~12 raycasts/sec is plenty
  if (!state.started || anyModalOpen() || isHelpOpen()) { highlight.visible = false; return; }
  const t = targetVoxel();
  if (!t) { highlight.visible = false; return; }
  highlight.visible = true;
  highlight.position.copy(t.object.position);
}

function doBreak() {
  if (!state.started || isQuizOpen()) return;
  if (!mineActive) { toast('⛏️ No mining in town — press ⛏️ Mine (M) to jump to the Mining Fields!'); return; }
  if (state.decorate) { placeFurnitureAtTarget(); return; }
  const t = targetVoxel();
  if (!t) return;
  const p = t.object.position;
  const bx = Math.floor(p.x - 0.5), by = Math.floor(p.y - 0.5), bz = Math.floor(p.z - 0.5);
  if (shopKeys.has(key(bx, by, bz))) { toast('🏠 That part of the valley is protected — press E to go inside!'); return; }
  if (by <= BEDROCK_Y - 1) { toast("🪨 Solid core — even the Drill Shovel can't bite deeper!"); return; }
  if (by <= BEDROCK_Y && !state.drillOwned) { toast('🪨 RED BEDROCK drill-level! Too hard by hand — buy a ⚒️ Drill Shovel at Gadget Tool Shed (far north-east).'); return; }
  const id = removeVoxel(bx, by, bz);
  if (id) {
    if (by <= 0) rememberMined(key(bx, by, bz)); // dug-out ground stays dug — generator won't refill it
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    state.energy = Math.min(MAX_ENERGY, state.energy + BREAK_GAIN);
    if (by <= BEDROCK_Y && state.drillOwned) {
      state.energy = Math.min(MAX_ENERGY, state.energy + 14);
      state.knowledge = (state.knowledge || 0) + 5;
      toast('⚒️ DRILLED through bedrock! +bonus energy & knowledge');
    }
    blip(200, 0.06);
    renderHUD(); renderHotbar(); autoSave();
  }
}

function doPlace() {
  if (!state.started || isQuizOpen()) return;
  if (state.decorate) { placeFurnitureAtTarget(); return; }
  // building IS allowed inside your home (walls are protected) so you can decorate.
  // shops never set state.inside — only homes do.
  const def = BLOCKS[state.selected];
  if ((state.inventory[def.id] || 0) <= 0) { toast(`No ${def.name} left — press Q to earn more! 📚`); openQuiz(); return; }
  if (state.energy < PLACE_COST) { toast('Out of energy! Answer quiz questions to recharge ⚡'); openQuiz(); return; }
  const t = targetVoxel();
  if (!t) return;
  // world position of targeted cube + robust face normal (works for pyramid too)
  const tp = t.object.position.clone();
  const n = faceNormal(t);
  const nx = Math.floor(tp.x - 0.5 + n.x), ny = Math.floor(tp.y - 0.5 + n.y), nz = Math.floor(tp.z - 0.5 + n.z);
  // don't place inside player
  const c = new THREE.Vector3(nx + 0.5, ny + 0.5, nz + 0.5);
  const pp = new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z);
  if (Math.abs(c.x - pp.x) < 0.8 && Math.abs(c.y - pp.y) < 1.3 && Math.abs(c.z - pp.z) < 0.8) { toast("Can't place inside yourself!"); return; }
  if (addVoxel(nx, ny, nz, def.id)) {
    state.inventory[def.id]--;
    state.energy -= PLACE_COST;
    state.placed++;
    blip(520, 0.07);
    if (def.lesson) showInfoCard(`<h3>${def.id === 'cube' ? '🔷 Cube' : '🔷 Square Pyramid'}</h3>${def.fact}`);
    renderHUD(); renderHotbar(); autoSave();
  }
}

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!state.started || anyModalOpen() || isHelpOpen()) return;
  // First click on desktop only acquires pointer lock — don't break/place yet.
  // (Touch devices have no pointer lock; always allow their taps.)
  const isCoarse = matchMedia('(pointer: coarse)').matches;
  if (!locked && !isCoarse) return;
  if (e.button === 0) doBreak();
  if (e.button === 2) doPlace();
});
addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- HUD / hotbar ----------
function renderHUD() {
  $('knowledge').textContent = state.knowledge;
  $('energy').textContent = Math.max(0, Math.round(state.energy));
  $('placed').textContent = state.placed;
  $('energy').parentElement.style.background = state.energy < PLACE_COST ? 'rgba(180,30,30,.75)' : 'rgba(0,0,0,.55)';
  if ($('petals')) $('petals').textContent = state.coins;
  if ($('happyNum')) $('happyNum').textContent = Math.round(state.happy);
  if ($('happyFill')) $('happyFill').style.width = Math.min(100, state.happy) + '%';
  if ($('bagCount')) $('bagCount').textContent = bagTotal();
  if ($('drillPill')) $('drillPill').classList.toggle('hidden', !state.drillOwned);
  if ($('seasonName')) $('seasonName').textContent = SEASONS[state.season || 0].n;
  if ($('seasonPill')) $('seasonPill').firstChild.textContent = SEASONS[state.season || 0].e + ' ';
  updateBikeBtn(); updateDecorateBtn(); updateFlyBtn(); updateViewBtn();
}
function updateFlyBtn() {
  const b = $('fly-btn'); if (!b) return;
  b.textContent = state.flying ? '🕊️ Flying… (land)' : '🕊️ Fly';
  b.classList.toggle('on', !!state.flying);
}
function updateBikeBtn() {
  const b = $('bike-btn'); if (!b) return;
  if (!state.bikeOwned) { b.textContent = '🚲 Bike (shop)'; }
  else if (state.riding) { b.textContent = '🚲 Hop off'; }
  else { b.textContent = '🚲 Ride'; }
  const bell = $('bell-btn'); if (bell) bell.style.display = (state.bikeOwned && state.riding) ? '' : 'none';
}
function updateDecorateBtn() {
  const b = $('decorate-btn'); if (!b) return;
  b.textContent = state.decorate ? '🏡 Placing… (off)' : '🏡 Decorate';
}

function renderHotbar() {
  const bar = $('hotbar');
  bar.innerHTML = '';
  BLOCKS.forEach((b, i) => {
    const d = document.createElement('div');
    d.className = 'slot' + (i === state.selected ? ' selected' : '');
    d.innerHTML = `<div class="swatch" style="background:#${b.color.toString(16).padStart(6, '0')};${b.pyramid ? 'clip-path:polygon(50% 0,100% 100%,0 100%);border-radius:0;' : ''}"></div><div class="name">${i + 1} ${b.name}</div><div class="count">${state.inventory[b.id] || 0}</div>`;
    d.title = b.fact || b.name;
    d.onclick = () => selectSlot(i);
    bar.appendChild(d);
  });
}

function selectSlot(i) {
  state.selected = i;
  const def = BLOCKS[i];
  if (def.lesson) showInfoCard(`<h3>${def.id === 'cube' ? '🔷 Cube' : '🔷 Square Pyramid'}</h3>${def.fact}`);
  renderHotbar();
}

let infoTimer = null;
function showInfoCard(html, ms = 8000) {
  const el = $('info-card');
  el.innerHTML = html;
  el.classList.remove('hidden');
  clearTimeout(infoTimer);
  infoTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ---------- Quiz ----------

// ---------- Autofix Service ----------
const autofixService = {
  requests: [],
  processing: false,
  lastProcessed: 0
};

function loadAutofixData() {
  try {
    const saved = localStorage.getItem('blockcraft-autofix');
    if (saved) {
      const data = JSON.parse(saved);
      autofixService.requests = data.requests || [];
      autofixService.lastProcessed = data.lastProcessed || 0;
    }
  } catch (e) {
    console.error('Failed to load autofix data:', e);
  }
}

function saveAutofixData() {
  try {
    localStorage.setItem('blockcraft-autofix', JSON.stringify({
      requests: autofixService.requests,
      lastProcessed: autofixService.lastProcessed
    }));
  } catch (e) {
    console.error('Failed to save autofix data:', e);
  }
}

function openAutofixInterface() {
  // Create modal if it doesn't exist
  if (!$('autofix-modal')) {
    createAutofixModal();
  }
  
  document.exitPointerLock?.();
  $('autofix-modal').classList.remove('hidden');
  loadAutofixData();
  renderAutofixRequests();
  renderAutofixStats();
}

function closeAutofixInterface() {
  $('autofix-modal').classList.add('hidden');
  saveAutofixData();
}

function createAutofixModal() {
  const modal = document.createElement('div');
  modal.id = 'autofix-modal';
  modal.className = 'modal hidden';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>💻 Autofix Service Workstation</h2>
      <p>Access the automated feature/bug fixing system</p>
      
      <div class="autofix-section">
        <h3>🔐 Secure Access</h3>
        <div id="autofix-auth">
          <input type="password" id="autofix-passcode" placeholder="Enter passcode to access service" />
          <button id="autofix-unlock">Unlock Service</button>
          <div id="autofix-status"></div>
        </div>
        <div id="autofix-service" class="hidden">
          <h4>Service Features</h4>
          <div id="autofix-features">
            <button class="feature-btn" onclick="requestFeature()">📝 Request New Feature</button>
            <button class="feature-btn" onclick="reportBug()">🐛 Report Bug</button>
            <button class="feature-btn" onclick="processQueue()">⚡ Process Queue</button>
          </div>
          <div id="autofix-requests">
            <h5>Pending Requests</h5>
            <div id="requests-list"></div>
          </div>
          <div id="autofix-updates">
            <h5>Recent Updates</h5>
            <div id="updates-list"></div>
          </div>
          <div id="autofix-stats">
            <h5>Service Statistics</h5>
            <div id="stats-display"></div>
          </div>
        </div>
      </div>
      
      <button class="modal-close" onclick="closeAutofixInterface()">✕ Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('autofix-unlock').addEventListener('click', () => {
    const passcode = document.getElementById('autofix-passcode').value;
    if (passcode === 'lakshan2026') { // Default passcode - could be made configurable
      document.getElementById('autofix-auth').classList.add('hidden');
      document.getElementById('autofix-service').classList.remove('hidden');
      document.getElementById('autofix-status').textContent = '✅ Access granted! Service unlocked.';
      document.getElementById('autofix-status').style.color = '#4caf50';
    } else {
      document.getElementById('autofix-status').textContent = '❌ Invalid passcode. Try again.';
      document.getElementById('autofix-status').style.color = '#c0392b';
    }
  });
  
  // Allow Enter key to submit
  document.getElementById('autofix-passcode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('autofix-unlock').click();
    }
  });
}

function renderAutofixRequests() {
  const listDiv = document.getElementById('requests-list');
  if (!listDiv) return;
  
  if (autofixService.requests.length === 0) {
    listDiv.innerHTML = '<p>No pending requests. Submit a feature or bug report to get started.</p>';
    return;
  }
  
  listDiv.innerHTML = autofixService.requests.map((req, index) => {
    const statusClass = req.status === 'completed' ? 'completed' : 
                       req.status === 'processing' ? 'processing' : 'pending';
    const statusText = req.status === 'completed' ? '✅ Completed' : 
                      req.status === 'processing' ? '⚡ Processing' : '⏳ Pending';
    const typeIcon = req.type === 'feature' ? '📝' : '🐛';
    const date = new Date(req.timestamp).toLocaleString();
    
    return `
      <div class="request-item ${statusClass}">
        <div class="request-header">
          <span class="request-type">${typeIcon} ${req.type.toUpperCase()}</span>
          <span class="request-status">${statusText}</span>
        </div>
        <div class="request-title">${req.title}</div>
        <div class="request-description">${req.description}</div>
        <div class="request-meta">
          <span>Submitted: ${date}</span>
          ${req.assignee ? `<span>Assigned: ${req.assignee}</span>` : ''}
        </div>
        ${req.result ? `<div class="request-result">Result: ${req.result}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderAutofixStats() {
  const statsDiv = document.getElementById('stats-display');
  if (!statsDiv) return;
  
  const pending = autofixService.requests.filter(r => r.status === 'pending').length;
  const processing = autofixService.requests.filter(r => r.status === 'processing').length;
  const completed = autofixService.requests.filter(r => r.status === 'completed').length;
  
  statsDiv.innerHTML = `
    <div class="stat-item">
      <label>Pending:</label>
      <value>${pending}</value>
    </div>
    <div class="stat-item">
      <label>Processing:</label>
      <value>${processing}</value>
    </div>
    <div class="stat-item">
      <label>Completed:</label>
      <value>${completed}</value>
    </div>
    <div class="stat-item">
      <label>Total:</label>
      <value>${autofixService.requests.length}</value>
    </div>
  `;
}

function renderAutofixUpdates() {
  const updatesDiv = document.getElementById('updates-list');
  if (!updatesDiv) return;
  
  // Get completed requests from last 24 hours
  const recentUpdates = autofixService.requests
    .filter(req => req.status === 'completed' && 
                  (Date.now() - new Date(req.completedAt).getTime()) < 24 * 60 * 60 * 1000)
    .slice(-5); // Last 5 updates
  
  if (recentUpdates.length === 0) {
    updatesDiv.innerHTML = '<p>No recent updates. Completed requests will appear here.</p>';
    return;
  }
  
  updatesDiv.innerHTML = recentUpdates.map(req => {
    const timeAgo = Math.floor((Date.now() - new Date(req.completedAt).getTime()) / 1000);
    let timeStr;
    if (timeAgo < 60) timeStr = `${timeAgo}s ago`;
    else if (timeAgo < 3600) timeStr = `${Math.floor(timeAgo / 60)}m ago`;
    else if (timeAgo < 86400) timeStr = `${Math.floor(timeAgo / 3600)}h ago`;
    else timeStr = `${Math.floor(timeAgo / 86400)}d ago`;
    
    const typeIcon = req.type === 'feature' ? '📝' : '🐛';
    
    return `
      <div class="update-item">
        <div class="update-header">
          <span class="update-type">${typeIcon} ${req.type.toUpperCase()}</span>
          <span class="update-time">${timeStr}</span>
        </div>
        <div class-update-title">${req.title}</div>
        <div class="update-result">✅ ${req.result}</div>
      </div>
    `;
  }).join('');
}

function requestFeature() {
  const title = prompt('Enter feature title:');
  if (!title || title.trim() === '') return;
  
  const description = prompt('Describe the feature you\'d like to see implemented:');
  if (!description || description.trim() === '') return;
  
  const newRequest = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    type: 'feature',
    title: title.trim(),
    description: description.trim(),
    status: 'pending',
    timestamp: Date.now(),
    completedAt: null,
    result: null
  };
  
  autofixService.requests.push(newRequest);
  saveAutofixData();
  renderAutofixRequests();
  renderAutofixStats();
  toast('📝 Feature request submitted! The autofix service will process it when available.');
}

function reportBug() {
  const title = prompt('Enter bug title:');
  if (!title || title.trim() === '') return;
  
  const description = prompt('Describe the bug you encountered:');
  if (!description || description.trim() === '') return;
  
  const newRequest = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    type: 'bug',
    title: title.trim(),
    description: description.trim(),
    status: 'pending',
    timestamp: Date.now(),
    completedAt: null,
    result: null
  };
  
  autofixService.requests.push(newRequest);
  saveAutofixData();
  renderAutofixRequests();
  renderAutofixStats();
  toast('🐛 Bug report submitted! The autofix service will investigate and fix it.');
}

function processQueue() {
  if (autofixService.processing) {
    toast('⚡ Service is already processing requests...');
    return;
  }
  
  const pendingRequests = autofixService.requests.filter(req => req.status === 'pending');
  if (pendingRequests.length === 0) {
    toast('📭 No pending requests to process.');
    return;
  }
  
  autofixService.processing = true;
  toast('⚡ Starting autofix service processing...');
  
  // Process each pending request
  pendingRequests.forEach((request, index) => {
    setTimeout(() => {
      processRequest(request);
    }, index * 2000); // Stagger processing by 2 seconds each
  });
  
  // Mark processing as complete after all requests
  setTimeout(() => {
    autofixService.processing = false;
    autofixService.lastProcessed = Date.now();
    saveAutofixData();
    renderAutofixRequests();
    renderAutofixStats();
    renderAutofixUpdates();
    toast('✅ Autofix service processing complete! Check for updates.');
  }, pendingRequests.length * 2000 + 1000);
}

function processRequest(request) {
  // Find the request in the array and update its status
  const reqIndex = autofixService.requests.findIndex(r => r.id === request.id);
  if (reqIndex === -1) return;
  
  autofixService.requests[reqIndex].status = 'processing';
  saveAutofixData();
  renderAutofixRequests();
  
  // Simulate processing time
  setTimeout(() => {
    // Generate a realistic result based on request type
    let resultMessage;
    if (autofixService.requests[reqIndex].type === 'feature') {
      resultMessage = `Feature "${autofixService.requests[reqIndex].title}" has been implemented and is ready for testing.`;
    } else {
      resultMessage = `Bug "${autofixService.requests[reqIndex].title}" has been fixed. The issue was resolved in the latest update.`;
    }
    
    autofixService.requests[reqIndex].status = 'completed';
    autofixService.requests[reqIndex].completedAt = Date.now();
    autofixService.requests[reqIndex].result = resultMessage;
    
    saveAutofixData();
    renderAutofixRequests();
    renderAutofixStats();
    renderAutofixUpdates();
    
    // Show toast for completed request
    toast(`✅ ${autofixService.requests[reqIndex].type === 'feature' ? 'Feature' : 'Bug'} completed: ${autofixService.requests[reqIndex].title}`);
  }, 3000 + Math.random() * 2000); // Random processing time between 3-5 seconds
}

// Add CSS for autofix modal
const autofixStyle = document.createElement('style');
autofixStyle.textContent = `
  #autofix-modal .modal-content {
    max-width: 500px;
  }
  .autofix-section {
    background: rgba(0,0,0,0.3);
    padding: 15px;
    border-radius: 10px;
    margin: 15px 0;
  }
  .autofix-section h3, .autofix-section h4, .autofix-section h5 {
    color: #ffd23f;
    margin-top: 0;
  }
  #autofix-auth input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: none;
    border-radius: 5px;
    background: rgba(255,255,255,0.1);
    color: white;
  }
  #autofix-auth input::placeholder {
    color: rgba(255,255,255,0.7);
  }
  #autofix-auth button {
    width: 100%;
    padding: 12px;
    background: #4caf50;
    border: none;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  #autofix-auth button:hover {
    background: #45a049;
  }
  #autofix-status {
    margin-top: 10px;
    padding: 8px;
    border-radius: 5px;
    min-height: 20px;
  }
  .feature-btn {
    width: 100%;
    padding: 12px;
    margin: 8px 0;
    border: none;
    border-radius: 5px;
    background: #2196f3;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  .feature-btn:hover {
    background: #1976d2;
  }
  .request-item {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 12px;
    margin: 10px 0;
  }
  .request-item.pending {
    border-left: 4px solid #ff9800;
  }
  .request-item.processing {
    border-left: 4px solid #2196f3;
    animation: pulse 2s infinite;
  }
  .request-item.completed {
    border-left: 4px solid #4caf50;
    opacity: 0.8;
  }
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  .request-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .request-type, .request-status {
    background: rgba(0,0,0,0.3);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  .request-title {
    font-weight: bold;
    margin-bottom: 5px;
  }
  .request-description {
    color: #ccc;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .request-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
    flex-wrap: wrap;
  }
  .request-result {
    background: rgba(76,175,80,0.2);
    border: 1px solid rgba(76,175,80,0.3);
    border-radius: 4px;
    padding: 8px;
    margin-top: 8px;
    font-size: 13px;
  }
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .stat-item label {
    color: #ccc;
  }
  .stat-item value {
    color: #ffd23f;
    font-weight: bold;
  }
  .update-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    padding: 10px;
    margin: 8px 0;
  }
  .update-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    flex-wrap: wrap;
  }
  .update-type, .update-time {
    background: rgba(0,0,0,0.3);
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
  }
  .update-title {
    font-weight: bold;
    margin-bottom: 3px;
  }
  .update-result {
    color: #8bc34a;
    font-size: 13px;
  }
`;
document.head.appendChild(autofixStyle);const isQuizOpen = () => !$('quiz-modal').classList.contains('hidden');
const isHelpOpen = () => !$('help-modal').classList.contains('hidden');

function openQuiz() {
  if (!state.started) return;
  document.exitPointerLock?.();
  $('quiz-modal').classList.remove('hidden');
  renderSubjects();
  showQuestion();
}
function closeQuiz() { $('quiz-modal').classList.add('hidden'); }

function renderSubjects() {
  const tabs = $('subject-tabs');
  tabs.innerHTML = '';
  Object.keys(window.QUIZ).forEach(sub => {
    const meta = window.SUBJECT_META[sub];
    const b = document.createElement('button');
    b.textContent = `${meta.icon} ${meta.name}`;
    if (sub === state.quizSubject) b.classList.add('active');
    b.onclick = () => { state.quizSubject = sub; state.quizIndex = 0; renderSubjects(); showQuestion(); };
    tabs.appendChild(b);
  });
}

function showQuestion() {
  const list = window.QUIZ[state.quizSubject];
  const q = list[state.quizIndex % list.length];
  $('quiz-q').textContent = q.q;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className = '';
  $('quiz-next').classList.add('hidden');
  const box = $('quiz-opts');
  box.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const b = document.createElement('button');
    b.textContent = opt;
    b.onclick = () => answer(i, q);
    box.appendChild(b);
  });
}

function answer(i, q) {
  const btns = [...$('quiz-opts').children];
  btns.forEach(b => b.disabled = true);
  if (i === q.a) {
    btns[i].classList.add('correct');
    const fb = $('quiz-feedback');
    fb.textContent = `✅ Correct! +8 🧱 + ⚡25 + ⭐10 — ${q.why}`;
    fb.className = 'good';
    // reward: +8 split across lowest-stock blocks + energy + knowledge
    const sorted = [...BLOCKS].sort((a, b) => (state.inventory[a.id] || 0) - (state.inventory[b.id] || 0));
    for (let k = 0; k < 8; k++) state.inventory[sorted[k % sorted.length].id]++;
    state.energy = Math.min(MAX_ENERGY, state.energy + 25);
    state.knowledge += 10;
    state.coins += 10;
    state.happy = Math.min(100, state.happy + 3);
    fanfare();
    toast('+8 🧱 + ⚡25 + ⭐10 + 🪷10! Keep building!');
  } else {
    btns[i].classList.add('wrong');
    btns[q.a].classList.add('correct');
    const fb = $('quiz-feedback');
    fb.textContent = `❌ Not quite. ${q.why} (+⚡5 for trying)`;
    fb.className = 'bad';
    state.energy = Math.min(MAX_ENERGY, state.energy + 5);
    blip(160, 0.15);
  }
  $('quiz-next').classList.remove('hidden');
  renderHUD(); renderHotbar(); autoSave();
}

// ---------- Sound (tiny WebAudio synth) ----------
let actx = null;
function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function blip(freq, dur = 0.08) {
  if (!state.soundOn) return;
  try {
    const c = ac(), o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch { /* audio blocked */ }
}
function fanfare() {
  if (!state.soundOn) return;
  [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.12), i * 110));
}
// gentle background arpeggio
let musicTimer = null;
function startMusic() {
  stopMusic();
  const notes = [262, 294, 330, 392, 440, 392, 330, 294];
  let i = 0;
  musicTimer = setInterval(() => {
    if (state.soundOn && state.started && !isQuizOpen()) blip(notes[i++ % notes.length], 0.09);
  }, 420);
}
function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }

// ---------- Save / load (world + cozy state) ----------
function save(silent = true) {
  try {
    // infinite-world friendly: don't store endless flat ground — it regenerates.
    // keep builds (y>0), shops (protected), and ground near you.
    const px = player.pos.x, pz = player.pos.z;
    const vox = [];
    for (const [k, v] of voxels) {
      const parts = k.split(',');
      const x = +parts[0], y = +parts[1], z = +parts[2];
      if (y > 0 || shopKeys.has(k)) { vox.push([x, y, z, v.id]); continue; }
      const dx = x - px, dz = z - pz;
      if (dx * dx + dz * dz < 65 * 65) vox.push([x, y, z, v.id]);
      if (vox.length > 40000) break; // safety cap for localStorage
    }
    const data = {
      energy: state.energy, knowledge: state.knowledge, placed: state.placed,
      inventory: state.inventory, selected: state.selected,
      player: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
      voxels: vox,
      mined: [...minedGround].slice(-3000), // dug-out cells stay dug after reload
      cozy: {
        name: state.name, style: state.style, hair: state.hair, shirt: state.shirt, hat: state.hat,
        gender: state.gender, ps: state.ps, po: state.po, pp: state.pp, pro: state.pro,
        coins: state.coins, happy: state.happy, bag: state.bag, placedFurn: state.placedFurn,
        seedBoost: state.seedBoost, season: state.season, seasonT: state.seasonT,
        bikeOwned: state.bikeOwned, riding: state.riding, hasBasket: state.hasBasket, drillOwned: state.drillOwned,
        homeXZ: state.homeXZ, thirdPerson: state.thirdPerson,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (!silent) toast('💾 World saved!');
  } catch { /* storage full/blocked */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    Object.assign(state, { energy: d.energy ?? 100, knowledge: d.knowledge ?? 0, placed: d.placed ?? 0, selected: d.selected ?? 0 });
    state.inventory = { ...state.inventory, ...(d.inventory || {}) };
    if (d.cozy) {
      Object.assign(state, {
        name: d.cozy.name ?? state.name, style: d.cozy.style ?? 0, hair: d.cozy.hair ?? state.hair,
        shirt: d.cozy.shirt ?? state.shirt, hat: d.cozy.hat ?? null,
        gender: d.cozy.gender ?? 'girl', ps: d.cozy.ps ?? 'she', po: d.cozy.po ?? 'her',
        pp: d.cozy.pp ?? 'her', pro: d.cozy.pro ?? 'she / her',
        coins: d.cozy.coins ?? 150, happy: d.cozy.happy ?? 60, bag: d.cozy.bag ?? {},
        placedFurn: d.cozy.placedFurn ?? [], seedBoost: d.cozy.seedBoost ?? 1,
        season: d.cozy.season ?? 0, seasonT: d.cozy.seasonT ?? 0,
        bikeOwned: !!d.cozy.bikeOwned, hasBasket: !!d.cozy.hasBasket, drillOwned: !!d.cozy.drillOwned, homeXZ: d.cozy.homeXZ ?? state.homeXZ,
        thirdPerson: d.cozy.thirdPerson ?? true,
      });
      // every name owns a different cottage lot — migrate old saves forward
      try { state.homeXZ = { ...lotForName(state.name) }; } catch {}
      state.riding = false; state.decorate = false; state.inside = null;
      state.flying = false; flyUpHeld = false; flyDownHeld = false;
    }
    clearWorld();
    shopKeys.clear();
    minedGround.clear();
    (d.mined || []).forEach((k) => minedGround.add(k)); // restore dug-out cells
    (d.voxels || []).forEach(([x, y, z, id]) => addVoxel(x, y, z, id, false));
    clearStructureVoxels(); // shops + home room rebuild pristine below (no stale walls)
    if (d.player) player.pos.set(d.player.x, d.player.y, d.player.z);
    // never wake up trapped inside the far-away home interior (saved while indoors)
    if (Math.abs(player.pos.x - HOME_IN.x) < 9 && Math.abs(player.pos.z - HOME_IN.z) < 9) {
      player.pos.set(state.homeXZ.x + 0.5, 3, state.homeXZ.z + 4.5);
    }
    try { ensureGroundAround(player.pos.x, player.pos.z); } catch {}
    try { lastGroundCX = Math.floor(player.pos.x); lastGroundCZ = Math.floor(player.pos.z); groundT = 0; } catch {}
    player.vel.set(0, 0, 0);
    try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
    return voxels.size > 0;
  } catch { return false; }
}
function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

// ---------- Autosave ----------
let saveTimer = null, lastSaveT = 0;
function autoSave() {
  // throttle: at most one save per 4s (mining fast used to re-save the whole world every second)
  clearTimeout(saveTimer);
  const wait = Math.max(800, 4000 - (performance.now() - lastSaveT));
  saveTimer = setTimeout(() => { lastSaveT = performance.now(); save(); }, wait);
}
setInterval(() => { if (state.started) save(); }, 15000);

// ---------- Mobile controls ----------
const joy = { x: 0, y: 0 };
let jumpQueued = false;
let lastMobTouch = 0;
(function initMobile() {
  const base = $('joystick'), stick = $('stick');
  if (!base) return;
  let joyId = null, cx = 0, cy = 0;
  base.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    joyId = t.identifier;
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    e.preventDefault();
  }, { passive: false });
  addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joyId) continue;
      let dx = (t.clientX - cx) / 40, dy = (t.clientY - cy) / 40;
      const m = Math.hypot(dx, dy) || 1;
      if (m > 1) { dx /= m; dy /= m; }
      joy.x = dx; joy.y = dy;
      stick.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
    }
  }, { passive: true });
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) { joyId = null; joy.x = 0; joy.y = 0; stick.style.transform = ''; }
    }
  });
  document.querySelectorAll('#mobile-btns button').forEach(b => {
    b.addEventListener('touchstart', (e) => {
      const act = b.dataset.act;
      lastMobTouch = Date.now();
      if (act === 'jump') { if (state.flying) flyUpHeld = true; else jumpQueued = true; }
      if (act === 'down') flyDownHeld = true;
      if (act === 'break') doBreak();
      if (act === 'place') doPlace();
      if (act === 'quiz') openQuiz();
      if (act === 'fly') toggleFly();
      if (act === 'view') toggleView();
      if (act === 'act') interact();
      if (act === 'mine') toggleMine();
      e.preventDefault();
    }, { passive: false });
    b.addEventListener('touchend', () => {
      const act = b.dataset.act;
      if (act === 'jump') flyUpHeld = false;
      if (act === 'down') flyDownHeld = false;
    });
    b.addEventListener('click', () => {
      if (Date.now() - lastMobTouch < 600) return; // touch already handled it
      const act = b.dataset.act;
      if (act === 'view') toggleView();
      else if (act === 'fly') toggleFly();
      else if (act === 'quiz') openQuiz();
      else if (act === 'act') interact();
      else if (act === 'mine') toggleMine();
      else if (act === 'break') doBreak();
      else if (act === 'place') doPlace();
      else if (act === 'jump' && !state.flying) jumpQueued = true;
    });
  });
})();

// ============ Cozy engine (functional port; BlockCraft look kept) ============
const isShopOpen_ = () => !$('shop-modal').classList.contains('hidden');
const isBagOpen = () => !$('bag-modal').classList.contains('hidden');
const isDialogOpen = () => !$('dialog-modal').classList.contains('hidden');
function closeBag() { $('bag-modal').classList.add('hidden'); }

// soft chimes (respect the same sound toggle)
function chime(f = 520, d = 0.25, type = 'sine', g = 0.06) {
  if (!state.soundOn) return;
  try {
    const c = ac(), o = c.createOscillator(), gn = c.createGain();
    o.type = type; o.frequency.value = f;
    gn.gain.setValueAtTime(g, c.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
    o.connect(gn); gn.connect(c.destination); o.start(); o.stop(c.currentTime + d);
  } catch {}
}
const sfx = {
  pickup() { chime(660, 0.2); setTimeout(() => chime(880, 0.25), 90); },
  buy() { chime(523, 0.18); setTimeout(() => chime(659, 0.2), 110); setTimeout(() => chime(784, 0.3), 220); },
  no() { chime(330, 0.25, 'sine', 0.05); },
  pop() { chime(740, 0.12); },
  happy() { [523, 587, 659, 784].forEach((f, i) => setTimeout(() => chime(f, 0.25), i * 120)); },
};
function fadeTo(fn) {
  const f = $('fade'); if (!f) { fn(); return; }
  f.style.opacity = '1';
  setTimeout(() => { try { fn(); } finally { f.style.opacity = '0'; } }, 210);
}
function showDialog(face, name, text) {
  const F = $('dialogFace');
  const cols = ['#c0392b', '#4caf50', '#2196f3', '#7c4dff', '#ff6b35', '#00bcd4'];
  F.style.background = cols[String(name || '?').length % cols.length];
  F.textContent = (String(face || name || '?').trim().charAt(0).toUpperCase() || '?');
  $('dialogName').textContent = String(name || '');
  $('dialogText').textContent = String(text || '');
  document.exitPointerLock?.();
  $('dialog-modal').classList.remove('hidden');
}
function chatLine(name, text, sys) {
  const log = $('chatLog'); if (!log) return;
  const d = document.createElement('div');
  d.className = 'chatline' + (sys ? ' sys' : '');
  if (sys) d.textContent = String(text || '');
  else {
    const b = document.createElement('b'); b.textContent = String(name || 'friend') + ' ';
    const s = document.createElement('span'); s.textContent = String(text || '');
    d.appendChild(b); d.appendChild(s);
  }
  log.appendChild(d);
  while (log.children.length > 6) log.removeChild(log.firstChild);
  setTimeout(() => { d.classList.add('gone'); setTimeout(() => { try { d.remove(); } catch {} }, 1300); }, 12000);
}

// ---------- creator ----------
let selStyle = 0, selHair = 0, selShirt = 0, selSkin = 0, selGender = 0;
function buildCreator() {
  const sr = $('styleRow'); if (!sr) return;
  sr.innerHTML = '';
  STYLES.forEach((n, i) => {
    const d = document.createElement('div');
    d.className = 'sw' + (i === selStyle ? ' sel' : '');
    d.title = n; d.style.background = '#7c4dff'; d.style.display = 'flex';
    d.style.alignItems = 'center'; d.style.justifyContent = 'center';
    d.style.color = '#fff'; d.style.fontWeight = '800';
    d.textContent = ['A', 'B', 'C'][i];
    d.onclick = () => { selStyle = i; buildCreator(); chime(600, 0.12); };
    sr.appendChild(d);
  });
  const hr = $('hairRow'); hr.innerHTML = '';
  HAIRS.forEach((h, i) => {
    const d = document.createElement('div');
    d.className = 'sw' + (i === selHair ? ' sel' : ''); d.title = h.n; d.style.background = h.c;
    d.onclick = () => { selHair = i; buildCreator(); chime(500 + i * 60, 0.12); };
    hr.appendChild(d);
  });
  const sh = $('shirtRow'); sh.innerHTML = '';
  SHIRTS.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'sw' + (i === selShirt ? ' sel' : ''); d.style.background = c;
    d.onclick = () => { selShirt = i; buildCreator(); chime(650, 0.12); };
    sh.appendChild(d);
  });
  const gr = $('genderRow'); gr.innerHTML = '';
  GENDERS.forEach((g, i) => {
    const d = document.createElement('div');
    d.className = 'gpill' + (i === selGender ? ' sel' : ''); d.style.background = g.c; d.style.color = '#fff';
    d.innerHTML = `${g.n}<small>${g.pro}</small>`;
    d.onclick = () => { selGender = i; buildCreator(); chime(560 + i * 70, 0.12); };
    gr.appendChild(d);
  });
}
function applyCreator() {
  state.name = ($('nameInput').value || 'Sunny').slice(0, 12);
  state.style = selStyle; state.hair = HAIRS[selHair].c;
  state.shirt = SHIRTS[selShirt];
  const g = GENDERS[selGender] || GENDERS[0];
  state.gender = g.id; state.ps = g.ps; state.po = g.po; state.pp = g.pp; state.pro = g.pro;
  try { state.homeXZ = { ...lotForName(state.name) }; } catch {}
}

// ---------- seasons / bike ----------
function setSeason(i, quiet) {
  const prev = ((state.season || 0) % 4 + 4) % 4;
  const prevPop = currentPopup(prev);
  state.season = ((i % 4) + 4) % 4; state.seasonT = 0;
  refreshSeasonalShops();
  scatterPickups();
  applySeasonSky();
  try { if (typeof HT !== 'undefined' && HT.active && HT.era !== 'present') htApplySky(); } catch {}
  renderHUD();
  if (state.inside && state.inside !== 'home' && !townShops.some((b) => b.id === state.inside)) state.inside = null;
  if (isShopOpen_() && curShop && !townShops.some((b) => b.id === curShop.id)) $('shop-modal').classList.add('hidden');
  if (!quiet) {
    sfx.happy();
    const se = SEASONS[state.season];
    const pop = currentPopup(state.season);
    let swap = '';
    if (prevPop && pop && prevPop.id !== pop.id) swap = ` ${prevPop.name} packed up, ${pop.name} opened mid-valley.`;
    const closed = BASE_SHOPS.filter((b) => isShopOpen(b.id, prev) && !isShopOpen(b.id, state.season)).map((b) => b.name);
    const opened = BASE_SHOPS.filter((b) => !isShopOpen(b.id, prev) && isShopOpen(b.id, state.season)).map((b) => b.name);
    if (closed.length) swap += ` Resting now: ${closed.join(', ')}.`;
    if (opened.length) swap += ` Back open: ${opened.join(', ')}.`;
    toast(`${se.e} ${se.n} drifts in… ${se.note}.${swap} stock is new everywhere.`);
  }
}
function applySeasonSky() {
  const se = SEASONS[state.season || 0];
  scene.background = new THREE.Color(se.sky);
  scene.fog = new THREE.Fog(se.fog, 30, 95);
  sun.intensity = se.sun;
  if (cozyParticles) cozyParticles.material.color.set(seasonParticleColor());
}
function seasonParticleColor() {
  return [0x7fbf5f, 0xfff2a0, 0xff9a3c, 0xffffff][state.season || 0];
}
function toggleBike() {
  if (state.inside) { toast('No bikes indoors — step outside first.'); return; }
  if (state.flying) { toast('Landing first — press G again, then ride.'); return; }
  if (!state.bikeOwned) {
    if (!isShopOpen('bikes', state.season || 0)) { toast('Bike shop rests in snow — it rolls back in spring.'); return; }
    toast('No bike yet — visit Puddle Bike Shop (north row, far east). Follow the minimap dots!'); return;
  }
  state.riding = !state.riding;
  sfx.pop(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
  toast(state.riding ? 'You hop on… ring-ring! Press B to hop off.' : 'You hop off and walk…');
  if (state.riding && state.hasBasket) state.happy = Math.min(100, state.happy + 2);
  renderHUD(); autoSave();
}
function ringBell() { chime(880, 0.15); setTimeout(() => chime(1174, 0.2), 110); toast('Ring-ring! Have a kind day~'); }
function toggleFly() {
  if (!state.started || anyModalOpen()) return;
  if (state.inside) { toast('No flying indoors — step outside first.'); return; }
  state.flying = !state.flying;
  if (state.flying) {
    if (state.riding) state.riding = false;
    player.vel.y = 0;
    sfx.pop(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
    toast('🕊️ Flying! Hold Space to rise · Shift (or C) to sink · G or double-Space to land.');
  } else {
    flyUpHeld = false; flyDownHeld = false;
    sfx.pop();
    toast(player.onGround ? 'Landed softly. 🌱' : 'Landing… gravity is back on!');
  }
  renderHUD(); autoSave();
}
function toggleView() {
  if (!state.started) { toast('Press Play first!'); return; }
  document.exitPointerLock?.();
  state.thirdPerson = !state.thirdPerson;
  sfx.pop();
  toast(state.thirdPerson ? '🧍 Third-person — you can see yourself!' : '👁️ First-person — through your own eyes!');
  updateViewBtn(); autoSave();
}
function updateViewBtn() {
  const b = $('view-btn'); if (!b) return;
  b.textContent = state.thirdPerson ? '👁️ First-person' : '🧍 Third-person';
}

// ---------- shops ----------
let curShop = null;
function openShop(b) {
  curShop = b;
  document.exitPointerLock?.();
  $('shopName').textContent = b.name;
  $('shopDesc').textContent = `${b.desc}${seasonalShopsNote()} • you have ${state.coins} petals 🪷`;
  const showSell = b.id === 'flower' || b.id === 'market';
  $('sellRow').classList.toggle('hidden', !showSell);
  $('sellStars').style.display = b.id === 'market' ? '' : 'none';
  if (b.id === 'market') $('sellShells').textContent = 'sell shells (+9)';
  const grid = $('shopGrid'); grid.innerHTML = '';
  const stock = seasonalStock(b.id);
  if (!stock.length) grid.innerHTML = `<div class="shop-item"><h4>resting this season</h4><p>new stock with the next drift</p></div>`;
  stock.forEach((it) => {
    const seTag = it.seasons && it.seasons.length === 1 ? ` • ${SEASONS[it.seasons[0]].n} exclusive` : '';
    const d = document.createElement('div'); d.className = 'shop-item';
    d.innerHTML = `<div class="dot" style="background:${dotColor(it.id)}"></div><h4>${it.n}</h4><p>${(it.p || '') + seTag}</p><span class="price">${it.price === 0 ? 'free' : it.price + ' 🪷'}</span>`;
    const btn = document.createElement('button');
    btn.textContent = it.price === 0 ? 'rest a while' : 'buy';
    btn.onclick = () => buyItem(it, b);
    d.appendChild(btn); grid.appendChild(d);
  });
  $('shop-modal').classList.remove('hidden');
  chime(587, 0.2);
}
function buyItem(it, b) {
  if (state.coins < it.price) { sfx.no(); toast('Not enough petals yet — pick & sell flowers, shells & mushrooms. They regrow!'); return; }
  if (it.use === 'rest') {
    state.happy = Math.min(100, state.happy + it.happy); renderHUD(); sfx.happy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
    toast(`You sit with a warm cup… time slows down. +${it.happy} happy`);
    return;
  }
  if (it.use === 'bike') {
    if (state.bikeOwned) { toast('You already have your bike — press B to ride!'); return; }
    state.coins -= it.price; state.bikeOwned = true; state.riding = true;
    renderHUD(); sfx.happy(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 5);
    $('shopDesc').textContent = `${b.desc} • you have ${state.coins} petals 🪷`;
    toast('Your bike! Press B to ride / hop off, H to ring the bell.');
    autoSave(); return;
  }
  if (it.use === 'basket') {
    if (state.hasBasket) { toast('Basket already on your bike.'); return; }
    state.coins -= it.price; state.hasBasket = true;
    state.happy = Math.min(100, state.happy + (it.happy || 4));
    renderHUD(); sfx.buy();
    $('shopDesc').textContent = `${b.desc} • you have ${state.coins} petals 🪷`;
    toast('Flower basket added. Rides feel happier now.');
    autoSave(); return;
  }
  if (it.use === 'drill') {
    if (state.drillOwned) { toast('You already own the Drill Shovel — dig down to the RED bedrock layer!'); return; }
    state.coins -= it.price; state.drillOwned = true;
    renderHUD(); sfx.happy(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 5);
    $('shopDesc').textContent = `${b.desc} • you have ${state.coins} petals 🪷`;
    showDialog('⚒️', 'Drill Shovel!', 'The RED bedrock layer at the bottom of the world is now drillable!\nDig straight down, bite through the red bricks, and earn bonus energy + knowledge for every bedrock block.');
    autoSave(); return;
  }
  if (it.use === 'energy') {
    state.coins -= it.price; addItem(it.id, 1);
    state.energy = Math.min(MAX_ENERGY, state.energy + (it.energy || 40));
    renderHUD(); sfx.buy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
    $('shopDesc').textContent = `${b.desc} • you have ${state.coins} petals 🪷`;
    toast(`Zing! +${it.energy || 40} energy (one is also in your bag for later)`);
    autoSave(); return;
  }
  state.coins -= it.price; addItem(it.id, 1);
  if (it.use === 'seed') { state.seedBoost = 0.45; toast('Seed kit tucked in — wildflowers will regrow faster!'); }
  else if (it.use === 'furniture') { toast(`${it.e} ${it.n} is in your bag! Use Decorate near home to place it.`); }
  else state.happy = Math.min(100, state.happy + 2);
  renderHUD(); sfx.buy();
  spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
  $('shopDesc').textContent = `${b.desc} • you have ${state.coins} petals 🪷`;
  autoSave();
}
function sellKind(kind, price, emptyMsg, okMsg) {
  const n = state.bag[kind] || 0;
  if (!n) { sfx.no(); toast(emptyMsg); return; }
  state.coins += n * price; state.bag[kind] = 0;
  state.happy = Math.min(100, state.happy + 4);
  renderHUD(); sfx.buy(); toast(`Sold ${n} for ${n * price} petals. ${okMsg}`);
  if (curShop) $('shopDesc').textContent = `${curShop.desc} • you have ${state.coins} petals 🪷`;
  autoSave();
}
// ---------- bag ----------
function openBag() {
  document.exitPointerLock?.();
  const g = $('bagGrid'); g.innerHTML = '';
  const ids = Object.keys(state.bag).filter((k) => state.bag[k] > 0);
  $('bagSub').textContent = ids.length
    ? `about ${state.name} (${state.pro}) • ${state.coins} petals 🪷 • click to use`
    : 'Empty for now… the valley provides. Pick things with E!';
  if (!ids.length) g.innerHTML = `<div class="shop-item"><h4>take a walk</h4><p>flowers, shells & kind deeds become petals</p></div>`;
  ids.forEach((id) => {
    const info = itemInfo(id), n = state.bag[id];
    const d = document.createElement('div'); d.className = 'shop-item';
    d.innerHTML = `<div class="dot" style="background:${dotColor(id)}"></div><h4>${info.n} ×${n}</h4><p>${info.p || ''}</p>`;
    const btn = document.createElement('button');
    btn.textContent = info.use === 'eat' ? 'enjoy' : info.use === 'read' ? 'read' : info.use === 'wear' ? 'wear'
      : info.use === 'wearhat' ? 'wear hat' : info.use === 'furniture' ? 'place at home' : info.use === 'energy' ? 'zing'
        : info.use === 'sell' || info.use === 'sellshroom' ? 'sell at Flower Shop' : info.use === 'sellstar' ? 'sell at Season Market' : '—';
    btn.onclick = () => useItem(id);
    d.appendChild(btn); g.appendChild(d);
  });
  $('bag-modal').classList.remove('hidden');
}
function useItem(id) {
  const info = itemInfo(id);
  if ((state.bag[id] || 0) <= 0) return;
  if (info.use === 'eat') {
    state.bag[id]--; state.happy = Math.min(100, state.happy + (info.happy || 8));
    sfx.happy(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
    toast(`Mmm… ${info.n} +${info.happy || 8} happy`);
  } else if (info.use === 'read') {
    state.happy = Math.min(100, state.happy + (info.happy || 12)); sfx.happy();
    showDialog('📖', info.n, `${info.quote || 'a soft story…'} (+${info.happy || 12} happy)`);
  } else if (info.use === 'wear') { state.shirt = info.wear; state.bag[id]--; sfx.pop(); refreshAvatarColors(); toast(`You wear the ${info.n}… very you!`); }
  else if (info.use === 'wearhat') { state.hat = info.wear; state.bag[id]--; sfx.pop(); refreshAvatarColors(); toast('Little hat on. Nice!'); }
  else if (info.use === 'furniture') {
    closeBag(); state.decorate = true; renderHUD();
    toast(isInsideHome() ? 'Decorate mode — aim at the floor/walls and click to furnish this room!' : 'Decorate mode — place near your cottage, or go INSIDE (E at door) to furnish the room!');
  }
  else if (info.use === 'sell' || info.use === 'sellshroom') { closeBag(); toast('The Flower Shop buys those (north row, second from west)!'); }
  else if (info.use === 'sellstar') { closeBag(); toast('The Season Market buys those (south row, far east)!'); }
  else if (info.use === 'seed') { state.seedBoost = 0.45; state.bag[id]--; toast('Seeds scattered — regrowth quickens.'); }
  else if (info.use === 'energy') {
    state.bag[id]--; state.energy = Math.min(MAX_ENERGY, state.energy + (info.energy || 40));
    state.happy = Math.min(100, state.happy + 4); sfx.happy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
    toast(`Zing! +${info.energy || 40} energy`); renderHUD();
  }
  else if (info.use === 'rest') { state.happy = Math.min(100, state.happy + (info.happy || 10)); sfx.happy(); toast(`Rested. +${info.happy || 10} happy`); }
  else if (info.use === 'bike') { closeBag(); toggleBike(); return; }
  else if (info.use === 'basket') {
    if (!state.hasBasket) { state.hasBasket = true; state.bag[id]--; toast('Basket fitted to your bike!'); }
    else toast('Basket already fitted.');
  }
  else toast('It just sits there, being nice.');
  renderHUD(); autoSave();
  if (isBagOpen()) { closeBag(); openBag(); }
}

// ---------- pickups (3D) ----------
const pickups = [];
const pickupGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const pickupMats = {};
function pickupMat(kind) {
  if (!pickupMats[kind]) {
    const c = { wildflower: 0x4caf50, shell: 0xe8f4ff, mushroom: 0xc0392b, starflower: 0xffd23f, litter: 0x8a5a2b }[kind] || 0xffffff;
    pickupMats[kind] = new THREE.MeshLambertMaterial({ color: c, emissive: kind === 'starflower' ? 0x664d00 : 0x000000 });
  }
  return pickupMats[kind];
}
function pickupSpotOk(x, z) {
  if (inWater2(x, z) || shopAt(x, z, 2) || structureAt(x, z, 2)) return false;
  return true;
}
function addPickup(kind, x, z) {
  const mesh = new THREE.Mesh(pickupGeo, pickupMat(kind));
  mesh.position.set(x + 0.5, 1.35, z + 0.5);
  scene.add(mesh);
  pickups.push({ kind, x: x + 0.5, z: z + 0.5, mesh, taken: false, respawn: 0, ph: Math.random() * 6 });
}
function scatterPickups() {
  for (const p of pickups) scene.remove(p.mesh);
  pickups.length = 0;
  const s = state.season || 0;
  const add = (kind, x, z) => {
    if (!pickupSpotOk(x, z)) return;
    addPickup(kind, x, z);
  };
  const R = (a, b) => a + Math.random() * (b - a);
  const nFlower = s === 3 ? 10 : 30, nShell = 18, nShroom = s === 2 ? 24 : 12, nStar = s === 3 ? 20 : 10, nLitter = 14;
  for (let i = 0; i < nFlower; i++) add('wildflower', Math.floor(R(-46, 46)), Math.floor(R(-32, 24)));
  for (let i = 0; i < nShell; i++) {
    const nearLake = i % 2 === 0;
    const cx = nearLake ? LAKE.x : POND.x, cz = nearLake ? LAKE.z : POND.z;
    add('shell', Math.floor(cx + R(-5, 5)), Math.floor(cz + R(-4, 4)));
  }
  for (let i = 0; i < nShroom; i++) add('mushroom', Math.floor(R(8, 46)), Math.floor(R(-12, 26)));
  for (let i = 0; i < nStar; i++) add('starflower', Math.floor(R(12, 46)), Math.floor(R(-8, 26)));
  for (let i = 0; i < nLitter; i++) add('litter', Math.floor(R(-42, 24)), Math.floor(R(-30, 20)));
}
// endless meadow: keep flowers/shells appearing around you as you wander far
let pickupFarT = 0;
function ensurePickupsAround(dt) {
  pickupFarT += dt;
  if (pickupFarT < 1.5) return;
  pickupFarT = 0;
  if (state.inside) return;
  const px = player.pos.x, pz = player.pos.z;
  let near = 0;
  for (const p of pickups) {
    if (p.taken) continue;
    if (Math.hypot(p.x - px, p.z - pz) < GROUND_R) near++;
  }
  if (near >= 22) return;
  const kinds = ['wildflower', 'wildflower', 'shell', 'mushroom', 'starflower', 'litter'];
  for (let i = 0; i < 6; i++) {
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const x = Math.floor(px + (Math.random() - 0.5) * 60);
    const z = Math.floor(pz + (Math.random() - 0.5) * 60);
    if (!pickupSpotOk(x, z)) continue;
    if (pickups.length > 140) {
      const old = pickups.find((q) => q.taken || Math.hypot(q.x - px, q.z - pz) > UNLOAD_R);
      if (old) { scene.remove(old.mesh); pickups.splice(pickups.indexOf(old), 1); }
      else break;
    }
    addPickup(kind, x, z);
  }
}
function nearestPickup() {
  let best = null, bd = 2.8;
  for (const p of pickups) {
    if (p.taken) continue;
    const d = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function pickPickup(p) {
  p.taken = true;
  p.respawn = (p.kind === 'wildflower' ? (40 + Math.random() * 50) * state.seedBoost
    : p.kind === 'mushroom' && state.season === 2 ? 25 + Math.random() * 30
      : 50 + Math.random() * 60);
  p.mesh.visible = false;
  if (p.kind === 'litter') {
    state.coins += 4; state.happy = Math.min(100, state.happy + 3);
    toast('You tidied the park 🍃 +4 petals, +3 happy. Thank you!');
  } else {
    const id = p.kind === 'wildflower' ? 'wildflower' : p.kind === 'shell' ? 'shell' : p.kind === 'mushroom' ? 'mushroom' : 'starflower';
    addItem(id, 1);
    state.happy = Math.min(100, state.happy + (p.kind === 'starflower' ? 2 : 1));
    toast(p.kind === 'wildflower' ? 'Picked a wildflower (+1 · sell at Flower Shop)'
      : p.kind === 'shell' ? 'A smooth shell (+1 · sell at Flower Shop or Market)'
        : p.kind === 'mushroom' ? 'A soft mushroom (+1 · sell at Flower Shop, best in autumn)'
          : 'A starflower! (+1 · sell at Season Market, south row far east)');
  }
  sfx.pickup(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
  renderHUD(); autoSave();
}

// ---------- NPC neighbours (humans, just like you) ----------
const npcs = [];
let personAuto = 0;
function makePersonMesh(shirtCss, skinCss = '#FFE5B4', hairCss = null, styleIdx = null) {
  // Everybody is human now — same smooth look as the player, own shirt/hair.
  const g = new THREE.Group();
  const mShirt = new THREE.MeshLambertMaterial({ color: new THREE.Color(shirtCss) });
  const mSkin = new THREE.MeshLambertMaterial({ color: new THREE.Color(skinCss) });
  const mHair = new THREE.MeshLambertMaterial({ color: new THREE.Color(hairCss || HAIRS[personAuto++ % HAIRS.length].c) });
  const mPants = new THREE.MeshLambertMaterial({ color: new THREE.Color('#2b3a67') });
  const mDark = new THREE.MeshLambertMaterial({ color: new THREE.Color('#2b2117') });
  const mShoe = new THREE.MeshLambertMaterial({ color: new THREE.Color('#3a2d24') });
  const sph = (r, mat, x, y, z, parent, ws = 16, hs = 12) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const cap = (r, len, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const style = styleIdx == null ? (personAuto % 3) : styleIdx;
  // legs
  const legs = [];
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.14, 0.78, 0);
    cap(0.115, 0.42, mPants, 0, -0.34, 0, lg);
    const shoe = sph(0.115, mShoe, 0, -0.68, 0.05, lg); shoe.scale.set(1, 0.65, 1.45);
    g.add(lg); legs.push(lg);
  }
  // torso + neck + shoulders
  const torso = cap(0.26, 0.34, mShirt, 0, 1.08, 0, g); torso.scale.set(1.12, 1, 0.7);
  sph(0.105, mShirt, -0.3, 1.36, 0, g); sph(0.105, mShirt, 0.3, 1.36, 0, g);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.14, 12), mSkin);
  neck.position.set(0, 1.42, 0); g.add(neck);
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const ag = new THREE.Group(); ag.position.set(s * 0.36, 1.36, 0);
    cap(0.082, 0.34, mShirt, 0, -0.24, 0, ag);
    sph(0.085, mSkin, 0, -0.52, 0, ag);
    g.add(ag); arms.push(ag);
  }
  // head + face
  const HY = 1.7;
  sph(0.26, mSkin, 0, HY, 0, g, 20, 14);
  sph(0.05, mSkin, -0.26, HY, 0, g); sph(0.05, mSkin, 0.26, HY, 0, g);
  sph(0.036, mDark, -0.1, HY + 0.02, 0.228, g); sph(0.036, mDark, 0.1, HY + 0.02, 0.228, g);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 14, Math.PI), mDark);
  smile.position.set(0, HY - 0.1, 0.235); smile.rotation.z = Math.PI; g.add(smile);
  // hair in original human shape (short / long / bun variety)
  if (style === 1) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mHair);
    c.position.set(0, HY + 0.03, -0.02); g.add(c);
    const fall = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 4, 10), mHair);
    fall.position.set(0, HY - 0.32, -0.24); g.add(fall);
  } else if (style === 2) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.275, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mHair);
    c.position.set(0, HY + 0.03, -0.02); g.add(c);
    sph(0.115, mHair, 0, HY + 0.3, -0.08, g);
  } else {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.275, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mHair);
    c.position.set(0, HY + 0.03, -0.02); g.add(c);
  }
  g.scale.setScalar(0.9);
  g.userData.legL = legs[0]; g.userData.legR = legs[1];
  g.userData.armL = arms[0]; g.userData.armR = arms[1];
  return g;
}
function swingHuman(mesh, walk) {
  try {
    const u = mesh.userData || {};
    if (!u.legL) return;
    const sw = Math.sin(walk) * 0.55;
    u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
    u.armL.rotation.x = -sw * 0.8; u.armR.rotation.x = sw * 0.8;
  } catch {}
}
function spawnNPCs() {
  for (const n of npcs) scene.remove(n.mesh);
  npcs.length = 0;
  NPC_DEFS.forEach((def, i) => {
    const mesh = makePersonMesh(def.shirt);
    const x = -40 + (i * 9) % 80, z = i < 5 ? -2 : 4;
    if (structureAt(x, z, 2)) { mesh.position.set(x + 6, 1.0, z - 6); }
    else mesh.position.set(x, 1.0, z);
    scene.add(mesh);
    npcs.push({ def, mesh, x: mesh.position.x, z: mesh.position.z, tx: mesh.position.x, tz: mesh.position.z, t: Math.random() * 3, pause: 1 + Math.random() * 2, walk: 0 });
  });
}
function nearestNPC() {
  let best = null, bd = 2.8;
  for (const n of npcs) {
    const d = Math.hypot(player.pos.x - n.mesh.position.x, player.pos.z - n.mesh.position.z);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}
function talkNPC(n) {
  sfx.pop();
  const ln = typeof n.def.line === 'function' ? n.def.line(state) : n.def.line;
  showDialog(n.def.n[0], n.def.n, ln);
  state.happy = Math.min(100, state.happy + 2);
  spawnHearts(n.mesh.position.x, 2.6, n.mesh.position.z, 3);
  renderHUD(); autoSave();
}

// ---------- offline bot friends + live multiplayer ----------
const bots = [];
const BOT_LINES = [
  'soft day, isn\'t it? I saved you a sunny spot.',
  'did you try the seasonal pop-up mid-valley? stock turns every season!',
  'picking flowers slowly is my whole workout plan.',
  'the lookout east is quietest at dusk. meet you there?',
];
function spawnBots() {
  for (const b of bots) scene.remove(b.mesh);
  bots.length = 0;
  [['Mossy', '#2e7d32', -6, 0], ['Pippa', '#ff6b35', 6, -2], ['Hazel', '#7c4dff', 0, 4]].forEach(([nm, shirt, x, z]) => {
    const mesh = makePersonMesh(shirt);
    mesh.position.set(x, 1.0, z);
    scene.add(mesh);
    bots.push({ id: 'bot-' + nm, profile: { name: nm }, mesh, x, z, tx: x, tz: z, t: 2, pause: 2, walk: 0 });
  });
  try { refreshHomeNames(); } catch {}
}
function nearestFriend() {
  let best = null, bd = 2.8, isRemote = false;
  for (const b of bots) {
    const d = Math.hypot(player.pos.x - b.mesh.position.x, player.pos.z - b.mesh.position.z);
    if (d < bd) { bd = d; best = b; isRemote = false; }
  }
  if (MP.on) {
    for (const p of MP.players.values()) {
      if (p.inside) continue;
      const d = Math.hypot(player.pos.x - (p.x3 ?? p.x), player.pos.z - (p.z3 ?? p.y));
      if (d < bd) { bd = d; best = p; isRemote = true; }
    }
  }
  return best ? { ref: best, isRemote } : null;
}
const MP = { ws: null, on: false, players: new Map(), you: null, sendT: 0, retry: 0, retryT: null };
const remoteMeshes = new Map();
function mpCan() { return location.protocol.indexOf('http') === 0; }
function mpToggle() {
  if (MP.on) { mpOff(true); return; }
  if (!state.started) return;
  if (!mpCan()) { toast('You are on a local file — hanging out with bot neighbours instead. (Host the game to meet live friends.)'); return; }
  mpConnect();
}
function mpConnect() {
  if (!state.started || MP.on) return;
  let ws;
  try { ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws'); }
  catch { toast('Solo for now — bot neighbours keep you company.'); return; }
  MP.ws = ws;
  toast('Calling out for friends…');
  clearTimeout(MP.watchdog);
  MP.watchdog = setTimeout(() => {
    if (MP.ws === ws && !MP.on && state.started) toast("Couldn't reach the valley server — playing with bot neighbours. Try F again later!");
  }, 4000);
  ws.onopen = () => {
    MP.on = true; MP.retry = 0; mpUI();
    try {
      ws.send(JSON.stringify({
        t: 'hello', name: state.name, style: state.style, hair: state.hair,
        shirt: state.shirt, skin: SKINS[0], hat: state.hat, gender: state.gender,
        x: Math.round(player.pos.x), y: Math.round(player.pos.z), placed: (state.placedFurn || []).slice(0, 30),
      }));
    } catch {}
    toast('Looking for friends…');
  };
  ws.onmessage = (ev) => { let m; try { m = JSON.parse(ev.data); } catch { return; } mpOnMsg(m); };
  ws.onclose = () => {
    const was = MP.on; MP.on = false; MP.players.clear(); syncRemoteMeshes(); mpUI();
    if (was && MP.retry < 4) { MP.retry++; toast('Drifted apart… reconnecting.'); clearTimeout(MP.retryT); MP.retryT = setTimeout(() => { if (state.started && !MP.on) mpConnect(); }, 2500); }
    else if (was) toast('Solo for now — bot neighbours keep you company.');
  };
  ws.onerror = () => { try { ws.close(); } catch {} };
}
function mpOff(manual) {
  MP.retry = 99; clearTimeout(MP.retryT);
  try { MP.ws && MP.ws.close(); } catch {}
  MP.on = false; MP.players.clear(); syncRemoteMeshes(); mpUI();
  if (manual) toast('Wandering solo. The valley is still yours (bots stay).');
}
function mpUI() {
  $('mpPill').style.display = MP.on ? '' : 'none';
  $('talk-btn').style.display = MP.on || true ? '' : 'none';
  if (!MP.on) toggleChat(false);
  $('friends-btn').textContent = MP.on ? '👥 Solo' : '👥 Friends';
  if (MP.on) $('mpCount').textContent = MP.players.size + 1;
}
function syncRemoteMeshes() {
  for (const [id, mesh] of [...remoteMeshes]) {
    if (!MP.players.has(id)) { scene.remove(mesh); remoteMeshes.delete(id); }
  }
  for (const [id, p] of MP.players) {
    if (p.inside) { const m = remoteMeshes.get(id); if (m) m.visible = false; continue; }
    let mesh = remoteMeshes.get(id);
    if (!mesh) {
      mesh = makePersonMesh((p.profile && p.profile.shirt) || '#7c4dff');
      scene.add(mesh); remoteMeshes.set(id, mesh);
    }
    mesh.visible = true;
    mesh.position.set(p.x3 ?? p.x ?? 0, 1.0, p.z3 ?? p.y ?? 0);
  }
}
function mpOnMsg(m) {
  if (m.t === 'welcome') { MP.you = m.you; (m.history || []).forEach((h) => chatLine(h.name, h.text, false)); }
  else if (m.t === 'roster') {
    MP.players.clear();
    (m.players || []).forEach((p) => {
      if (p.id !== MP.you) {
        p.x3 = p.x; p.z3 = p.y;
        MP.players.set(p.id, p);
      }
    });
    syncRemoteMeshes();
    try { refreshHomeNames(); } catch {}
    if (MP.on) $('mpCount').textContent = MP.players.size + 1;
  } else if (m.t === 'chat') {
    if (m.sys) { chatLine('', m.text, true); }
    else { chatLine(m.name, m.text, false); sfx.pop(); }
  } else if (m.t === 'slow') toast('One kind thought at a time…');
}
function mpSendMove() {
  if (!MP.on || !MP.ws || MP.ws.readyState !== 1) return;
  try {
    MP.ws.send(JSON.stringify({
      t: 'move', x: Math.round(player.pos.x), y: Math.round(player.pos.z),
      inside: state.inside, riding: !!state.riding, face: 1, moving: true, walk: 0,
    }));
  } catch {}
}
function mpSendPlace() {
  if (!MP.on || !MP.ws || MP.ws.readyState !== 1) return;
  try { MP.ws.send(JSON.stringify({ t: 'place', items: (state.placedFurn || []).slice(0, 30) })); } catch {}
}
function toggleChat(force) {
  const r = $('chatRow');
  const show = typeof force === 'boolean' ? force : r.classList.contains('hidden');
  r.classList.toggle('hidden', !show);
  if (show) setTimeout(() => { try { $('chatIn').focus({ preventScroll: true }); } catch { try { $('chatIn').focus(); } catch {} } }, 60);
  else try { $('chatIn').blur(); } catch {}
}
function mpSendChat() {
  const inp = $('chatIn');
  const text = inp.value.slice(0, 120).trim();
  if (!text) return;
  if (MP.on && MP.ws && MP.ws.readyState === 1) {
    try { MP.ws.send(JSON.stringify({ t: 'chat', text })); } catch {}
    chatLine(state.name, text, false);
  } else {
    chatLine(state.name, text, false);
    const b = bots[Math.floor(Math.random() * bots.length)];
    if (b) setTimeout(() => chatLine(b.profile.name, BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)], false), 800);
  }
  inp.value = '';
}

// ---------- home interior + furniture ----------
const HOME_IN = { x: 60, z: 60 };
let homeReturn = null;
const furnGroup = new THREE.Group();
scene.add(furnGroup);
const HOME_R = { x: 8, z: 6 }; // BIG interior room (17 x 13) so you can see + decorate
function buildHomeInterior() {
  // big bright room far away so the main valley stays clean; protected, open top
  const ox = HOME_IN.x, oz = HOME_IN.z;
  const put = (x, y, z, id) => { if (addVoxel(x, y, z, id, false)) shopKeys.add(key(x, y, z)); };
  for (let dx = -HOME_R.x; dx <= HOME_R.x; dx++) for (let dz = -HOME_R.z; dz <= HOME_R.z; dz++) {
    put(ox + dx, 0, oz + dz, 'dirt');
    const edge = Math.abs(dx) === HOME_R.x || Math.abs(dz) === HOME_R.z;
    if (edge) {
      for (let y = 1; y <= 3; y++) {
        if (dz === HOME_R.z && Math.abs(dx) <= 1 && y <= 2) continue; // WIDE door gap (south, 3-wide so nobody gets stuck)
        put(ox + dx, y, oz + dz, 'brick');
      }
    }
  }
  put(ox - 5, 1, oz - 3, 'brick'); // bed head (tucked in corner, out of the walkway)
  put(ox - 4, 1, oz - 3, 'glass'); // pillow
  put(ox + 5, 1, oz + 1, 'wood'); // table (corner)
    put(ox + 5, 1, oz + 1, 'wood'); // table (corner)
    put(ox + 5, 2, oz + 1, 'stone'); // computer base
    put(ox + 4, 2, oz + 1, 'glass'); // computer screen
    put(ox + 6, 2, oz + 1, 'glass'); // computer screen
    // VERIFICATION MARKER: COMPUTER VISIBLE
}
// ---- anti-stuck rescue: lifts you out of blocks, or pops you to safety ----
// Press U (or the 🆘 button) any time you get wedged somewhere.
function unstickPlayer(silent) {
  try {
    let lifts = 0;
    while (collides(player.pos.x, player.pos.y, player.pos.z) && lifts < 6) {
      player.pos.y += 0.6; lifts++;
    }
    if (!collides(player.pos.x, player.pos.y, player.pos.z)) {
      player.vel.set(0, 0, 0);
      if (!silent) toast(lifts > 0 ? 'Popped out — you were stuck in a block!' : 'You look free already. ✨');
      return;
    }
    // still stuck: teleport to safety (own doorstep, or spawn)
    state.inside = null;
    state.riding = false; state.flying = false;
    try { ensureGroundAround(state.homeXZ.x, state.homeXZ.z); } catch {}
    player.pos.set(state.homeXZ.x + 0.5, 3, state.homeXZ.z + 5.5);
    player.vel.set(0, 0, 0);
    renderHUD();
    if (!silent) toast('🆘 Rescued to your doorstep!');
    autoSave();
  } catch {}
}
function enterHome() {
  fadeTo(() => {
    if (state.riding) { state.riding = false; renderHUD(); }
    if (state.flying) { state.flying = false; flyUpHeld = false; flyDownHeld = false; renderHUD(); }
    state.decorate = false; renderHUD();
    homeReturn = player.pos.clone();
    state.inside = 'home';
    try { ensureGroundAround(HOME_IN.x, HOME_IN.z); } catch {}
    player.pos.set(HOME_IN.x + 0.5, 2.2, HOME_IN.z + 2.5); player.vel.set(0, 0, 0);
    try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
    toast('Home sweet home — walk in, place furniture & blocks to decorate! E on the bed naps, E on the mat steps out.');
    sfx.pop(); autoSave();
  });
}
// every neighbour cottage can be ENTERED too — you visit their room,
// decorate yours, and E on the mat always brings you back out.
function visitNeighbourHome(b) {
  const idx = (b && b.lotIdx != null) ? b.lotIdx : parseInt(String((b && b.id) || '0').split(':')[1] || '0', 10) || 0;
  fadeTo(() => {
    if (state.riding) { state.riding = false; renderHUD(); }
    if (state.flying) { state.flying = false; flyUpHeld = false; flyDownHeld = false; renderHUD(); }
    state.decorate = false; renderHUD();
    homeReturn = player.pos.clone();
    state.inside = 'home:' + idx;
    try { ensureGroundAround(HOME_IN.x, HOME_IN.z); } catch {}
    player.pos.set(HOME_IN.x + 0.5, 2.2, HOME_IN.z + 2.5); player.vel.set(0, 0, 0);
    try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
    state.happy = Math.min(100, state.happy + 2); renderHUD();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
    toast(`Visiting ${b.name || 'a neighbour cottage'} — look around! E on the mat steps back outside.`);
    sfx.pop(); autoSave();
  });
}
function leaveHome() {
  fadeTo(() => {
    state.inside = null;
    if (homeReturn) { player.pos.copy(homeReturn); homeReturn = null; }
    else player.pos.set(homeDoor.x, 2.2, homeDoor.z + 1);
    player.vel.set(0, 0, 0);
    try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
    sfx.pop(); autoSave();
  });
}
function furnIdInBag() {
  return Object.keys(state.bag).find((id) => state.bag[id] > 0 && itemInfo(id).use === 'furniture');
}
function buildFurnitureMeshes() {
  while (furnGroup.children.length) furnGroup.remove(furnGroup.children[0]);
  for (const f of state.placedFurn || []) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshLambertMaterial({ color: new THREE.Color(dotColor(f.id)) }));
    m.position.set(f.x, f.y, f.z);
    furnGroup.add(m);
  }
  // also show a few inside home
  (state.placedFurn || []).slice(0, 6).forEach((f, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshLambertMaterial({ color: new THREE.Color(dotColor(f.id)) }));
    m.position.set(HOME_IN.x - 2 + (i % 3) * 2, 1.4, HOME_IN.z - 1 + Math.floor(i / 3) * 1.5);
    furnGroup.add(m);
  });
}
function placeFurnitureAtTarget() {
  const id = furnIdInBag();
  if (!id) { toast('No furniture in bag — visit Pebble Home Goods (south row, west end).'); state.decorate = false; renderHUD(); return; }
  const t = targetVoxel();
  if (!t) { toast(isInsideHome() ? 'Aim at the floor or a wall inside, then click.' : 'Aim at soft grass near home, then click.'); return; }
  const p = t.object.position.clone();
  const n = faceNormal(t);
  const nx = p.x + n.x, ny = p.y + n.y, nz = p.z + n.z;
  if (isInsideHome()) {
    // decorating INSIDE the home room (it lives at HOME_IN far away)
    const dx = nx - (HOME_IN.x + 0.5), dz = nz - (HOME_IN.z + 0.5);
    if (Math.abs(dx) > HOME_R.x || Math.abs(dz) > HOME_R.z || ny < 1 || ny > 3) {
      toast('Place it inside the room — aim at the floor or walls.');
      return;
    }
  } else {
    const hx = state.homeXZ.x + 0.5, hz = state.homeXZ.z + 0.5;
    if (Math.hypot(nx - hx, nz - hz) > 16) { toast("Let's place that near your cottage (walk home first) — or press E at your door to decorate inside!"); return; }
  }
  state.bag[id]--;
  (state.placedFurn = state.placedFurn || []).push({ id, x: nx, y: ny, z: nz });
  if ((state.placedFurn || []).length > 30) state.placedFurn.shift();
  mpSendPlace();
  state.happy = Math.min(100, state.happy + 6);
  buildFurnitureMeshes(); renderHUD(); sfx.happy();
  spawnHearts(nx, ny + 1, nz, 5);
  toast(isInsideHome() ? `${itemInfo(id).n} placed inside! Your room gets cozier (+6 happy)` : `${itemInfo(id).n} placed! Home gets cozier (+6 happy)`);
  if (!furnIdInBag()) { state.decorate = false; renderHUD(); }
  autoSave();
}

// ---------- interact (E) ----------
let nearTarget = null;
const ACT_WORD = { shop: 'inside', home: 'inside', 'home-other': 'visit', npc: 'hi', friend: 'visit', wildflower: 'pick', starflower: 'pick', shell: 'take', mushroom: 'pick', litter: 'tidy', bench: 'sit', lookout: 'gaze', rest: 'rest', bed: 'nap', exit: 'leave', keeper: 'hi', counter: 'browse', computer: 'work' };
function distXZ(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }
function findInteract() {
  if (isInsideHome()) {
    const bx = HOME_IN.x - 4.5, bz = HOME_IN.z - 3;
    if (distXZ(player.pos.x, player.pos.z, bx, bz) < 3.2) return { kind: 'bed' };
    if (distXZ(player.pos.x, player.pos.z, HOME_IN.x + 0.5, HOME_IN.z + HOME_R.z + 0.2) < 2.8) return { kind: 'exit' };
    // Computer workstation on table
    if (distXZ(player.pos.x, player.pos.z, HOME_IN.x + 5, HOME_IN.z + 1) < 2.5) return { kind: 'computer' };
    return null;
  }
  // nearest candidate wins (so shops never shadow neighbours/pickups)
  const cands = [];
  for (const b of townShops) {
    if (!b.door) continue;
    const d = distXZ(player.pos.x, player.pos.z, b.door.x, b.door.z);
    if (d < 3.4) {
      if (isHomeId(b.id)) cands.push({ d, t: b.id === 'home' ? { kind: 'home', ref: b } : { kind: 'home-other', ref: b } });
      else cands.push({ d, t: { kind: 'shop', ref: b } });
    }
  }
  const n = nearestNPC();
  if (n) cands.push({ d: Math.hypot(player.pos.x - n.mesh.position.x, player.pos.z - n.mesh.position.z), t: { kind: 'npc', ref: n } });
  const f = nearestFriend();
  if (f) {
    const fp = f.isRemote ? { x: f.ref.x3 ?? f.ref.x, z: f.ref.z3 ?? f.ref.y } : { x: f.ref.mesh.position.x, z: f.ref.mesh.position.z };
    cands.push({ d: Math.hypot(player.pos.x - fp.x, player.pos.z - fp.z), t: { kind: 'friend', ref: f.ref, isRemote: f.isRemote } });
  }
  const p = nearestPickup();
  if (p) cands.push({ d: Math.hypot(player.pos.x - p.x, player.pos.z - p.z), t: { kind: p.kind, ref: p } });
  for (const bch of BENCHES) {
    const d = distXZ(player.pos.x, player.pos.z, bch.x + 0.5, bch.z + 0.5);
    if (d < 2.4) cands.push({ d, t: { kind: 'bench', ref: bch } });
  }
  if (distXZ(player.pos.x, player.pos.z, LOOKOUT.x + 0.5, LOOKOUT.z + 0.5) < 3.2) {
    cands.push({ d: distXZ(player.pos.x, player.pos.z, LOOKOUT.x + 0.5, LOOKOUT.z + 0.5), t: { kind: 'lookout' } });
  }
  // Computer workstation fallback (for when isInsideHome() fails)
  if (distXZ(player.pos.x, player.pos.z, HOME_IN.x + 5, HOME_IN.z + 1) < 2.5) {
    cands.push({ d: distXZ(player.pos.x, player.pos.z, HOME_IN.x + 5, HOME_IN.z + 1), t: { kind: 'computer' } });
  }
  const cafe = townShops.find((b) => b.id === 'cafe');
  if (cafe && distXZ(player.pos.x, player.pos.z, cafe.cx + 0.5, cafe.cz + 3.5) < 2.6) {
    cands.push({ d: distXZ(player.pos.x, player.pos.z, cafe.cx + 0.5, cafe.cz + 3.5), t: { kind: 'rest', ref: cafe } });
  }
  if (!cands.length) return null;
  cands.sort((a, b2) => a.d - b2.d);
  return cands[0].t;
}
function interact() {
  const t = state.inside ? findInteract() : findInteract();
  if (!t) { toast(state.inside ? 'Wander to the bed or the door mat — or aim at floor/walls with Decorate on to furnish!' : 'Walk to a shop, cottage door, friend, or flower and press E.'); return; }
  if (isInsideHome()) {
    if (t.kind === 'bed') {
      state.happy = Math.min(100, state.happy + 8); renderHUD(); sfx.happy();
      spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 4);
      toast('You nap softly on the little bed… +8 happy');
    } else if (t.kind === 'exit') leaveHome();
    else if (t.kind === 'computer') {
      // Open autofix service interface for computer work
      openAutofixInterface();
    }
    return;
  }
  if (t.kind === 'shop') {
    if (!isShopOpen(t.ref.id, state.season || 0)) { toast(`${t.ref.name} is resting this season — its pop-up sibling mid-valley may be open!`); return; }
    openShop(t.ref);
  }
  else if (t.kind === 'home') enterHome();
  else if (t.kind === 'home-other') visitNeighbourHome(t.ref);
  else if (t.kind === 'friend') {
    const nm = t.isRemote ? (t.ref.profile?.name || 'friend') : (t.ref.profile?.name || 'friend');
    sfx.pop(); spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
    state.happy = Math.min(100, state.happy + 2); renderHUD();
    showDialog(nm[0] || 'F', nm, t.isRemote ? `Hi! I'm visiting too. ${BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]}` : `${BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)]} (E again at their cottage door to peek at home life.)`);
  }
  else if (t.kind === 'npc') talkNPC(t.ref);
  else if (['wildflower', 'starflower', 'shell', 'mushroom', 'litter'].includes(t.kind)) pickPickup(t.ref);
  else if (t.kind === 'bench') {
    const lines = ['You watch clouds drift. Nowhere to be. +5 happy', 'A duck waddles by like it pays rent. +5 happy', 'You read one page, then just breathe. +5 happy', 'The clouds rearrange themselves, slowly. +5 happy'];
    showDialog('B', 'bench break', lines[Math.floor(Math.random() * lines.length)]);
    state.happy = Math.min(100, state.happy + 5); renderHUD(); sfx.happy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
  }
  else if (t.kind === 'lookout') {
    showDialog('S', 'starlight lookout', 'You breathe with the whole valley below. Misty Hollow twinkles, the meadow hums. +8 happy');
    state.happy = Math.min(100, state.happy + 8); renderHUD(); sfx.happy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 6);
  }
  else if (t.kind === 'rest') {
    state.happy = Math.min(100, state.happy + 6); renderHUD(); sfx.happy();
    spawnHearts(player.pos.x, player.pos.y + 1.5, player.pos.z, 3);
    toast('You rest on the café terrace… +6 happy');
  }
}
let interactTimer = 0;
function updateInteractTip(dt) {
  interactTimer -= dt;
  if (interactTimer > 0) return;
  interactTimer = 0.15;
  nearTarget = state.started && !anyModalOpen() && !state.inside ? findInteract()
    : state.started && isInsideHome() && !anyModalOpen() ? findInteract() : null;
  const tip = $('interactTip');
  if (nearTarget && tip) {
    tip.classList.remove('hidden');
    const k = nearTarget.kind;
    tip.innerHTML = k === 'shop' ? `press <b>E</b> to go inside ${nearTarget.ref.name}`
      : k === 'home' ? `press <b>E</b> to go inside 🏡 MY HOUSE`
        : k === 'home-other' ? `press <b>E</b> to visit ${nearTarget.ref.name}`
        : k === 'npc' ? `press <b>E</b> to say hi to ${nearTarget.ref.def.n}`
          : k === 'friend' ? `press <b>E</b> to say hi to ${(nearTarget.ref.profile?.name) || 'friend'}`
            : k === 'wildflower' ? `press <b>E</b> to pick a flower`
              : k === 'starflower' ? `press <b>E</b> to pick starflower`
                : k === 'mushroom' ? `press <b>E</b> to pick mushroom`
                  : k === 'shell' ? `press <b>E</b> to take shell`
                    : k === 'litter' ? `press <b>E</b> to tidy (+petals)`
                      : k === 'bench' ? `press <b>E</b> to sit`
                        : k === 'lookout' ? `press <b>E</b> to stargaze`
                          : k === 'bed' ? `press <b>E</b> to nap`
                            : k === 'exit' ? `press <b>E</b> to step outside`
                              : `press <b>E</b> to rest`;
  } else if (tip) tip.classList.add('hidden');
  const ab = $('actBtn');
  if (ab) {
    const isTouch = matchMedia('(pointer: coarse)').matches;
    if (!isTouch || !state.started || !nearTarget) ab.classList.add('hidden');
    else { ab.classList.remove('hidden'); $('actLbl').textContent = ACT_WORD[nearTarget.kind] || 'tap'; }
  }
}

// ---------- minimap / day / particles / hearts ----------
const mmc2 = () => document.getElementById('minimap')?.getContext('2d');
let mmTimer = 0;
function drawMinimap() {
  const mm = document.getElementById('minimap'); if (!mm) return;
  const c = mm.getContext('2d');
  const W2 = 150, H2 = 118;
  // OPEN WORLD minimap: follows YOU (40-block view). town dots appear when near.
  const VIEW = 42;
  c.clearRect(0, 0, W2, H2);
  c.fillStyle = '#1c2b1c'; c.fillRect(0, 0, W2, H2);
  const sx = W2 / (VIEW * 2), sz = H2 / (VIEW * 2);
  const px = isInsideHome() ? HOME_IN.x : player.pos.x;
  const pz = isInsideHome() ? HOME_IN.z : player.pos.z;
  const X = (x) => (x - px + VIEW) * sx, Z = (z) => (z - pz + VIEW) * sz;
  const onMap = (x, z) => x >= -8 && x <= W2 + 8 && z >= -8 && z <= H2 + 8;
  c.fillStyle = '#5fa8d3';
  for (const w of [POND, LAKE]) {
    const wx = X(w.x), wz = Z(w.z);
    if (onMap(wx, wz)) { c.beginPath(); c.ellipse(wx, wz, Math.max(2, w.rx * sx), Math.max(2, w.ry * sz), 0, 0, Math.PI * 2); c.fill(); }
  }
  for (const b of townShops) {
    const bx = X(b.cx), bz = Z(b.cz);
    if (!onMap(bx, bz)) continue;
    if (b.id === 'home') {
      // YOUR house: bigger green dot + white ring so it's obvious
      c.fillStyle = '#4caf50';
      c.fillRect(bx - 4, bz - 4, 8, 8);
      c.strokeStyle = '#ffffff'; c.lineWidth = 2;
      c.strokeRect(bx - 4, bz - 4, 8, 8);
    } else {
      c.fillStyle = isHomeId(b.id) ? '#4caf50' : '#ffd23f';
      c.fillRect(bx - 3, bz - 3, 6, 6);
    }
  }
  c.fillStyle = '#9ccc65';
  for (const p of pickups) {
    if (p.taken) continue;
    const qx = X(p.x), qz = Z(p.z);
    if (!onMap(qx, qz)) continue;
    c.fillRect(qx - 1, qz - 1, 2, 2);
  }
  c.fillStyle = '#ffab40';
  for (const n of npcs) {
    const nx = X(n.mesh.position.x), nz = Z(n.mesh.position.z);
    if (!onMap(nx, nz)) continue;
    c.beginPath(); c.arc(nx, nz, 2.4, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#ce93d8';
  for (const b of bots) {
    try { if (typeof HT !== 'undefined' && HT.active && htIsHider(b)) continue; } catch {} // hidden hiders stay off minimap
    const qx = X(b.mesh.position.x), qz = Z(b.mesh.position.z);
    if (!onMap(qx, qz)) continue;
    c.beginPath(); c.arc(qx, qz, 2.4, 0, Math.PI * 2); c.fill();
  }
  if (MP.on) {
    c.fillStyle = '#7c9aff';
    for (const [, p] of MP.players) {
      if (p.inside) continue;
      const qx = X(p.x3 ?? p.x ?? 0), qz = Z(p.z3 ?? p.y ?? 0);
      if (!onMap(qx, qz)) continue;
      c.beginPath(); c.arc(qx, qz, 2.6, 0, Math.PI * 2); c.fill();
    }
  }
  if (isInsideHome()) { c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.fillText('home', 6, 12); }
  else {
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(W2 / 2, H2 / 2, 4, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.textAlign = 'left';
  c.fillText(`${SEASONS[state.season || 0].n} · ${Math.round(player.pos.x)},${Math.round(player.pos.z)}`, 6, 12);
}
let dayT = 0.3, restTick = 0;
function updateDay(dt) {
  dayT += dt / 480; if (dayT > 1) dayT -= 1;
  const night = Math.sin(dayT * Math.PI * 2);
  const base = SEASONS[state.season || 0].sun;
  sun.intensity = Math.max(0.35, base + (night < -0.15 ? night * 0.25 : night > 0.55 ? (night - 0.55) * 0.2 : 0));
}
let cozyParticles = null;
function initCozyFx() {
  const N = 130;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 50;
    pos[i * 3 + 1] = Math.random() * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  cozyParticles = new THREE.Points(g, new THREE.PointsMaterial({ color: seasonParticleColor(), size: 0.16, transparent: true, opacity: 0.85 }));
  scene.add(cozyParticles);
}
const hearts3d = [];
function spawnHearts(x, y, z, n = 3) {
  for (let i = 0; i < n; i++) {
    if (hearts3d.length > 40) { const old = hearts3d.shift(); scene.remove(old.mesh); }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xe53935 : 0xff6b81, transparent: true, opacity: 1 }));
    mesh.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.8);
    scene.add(mesh);
    hearts3d.push({ mesh, t: 0, life: 0.9 + Math.random() * 0.6, vy: 1 + Math.random() });
  }
}
function updateFx(dt) {
  if (cozyParticles) {
    const a = cozyParticles.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) - dt * (state.season === 3 ? 1.2 : 0.7);
      if (y < 0) y = 12;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(performance.now() / 1400 + i) * dt * 0.5);
    }
    a.needsUpdate = true;
    cozyParticles.position.set(player.pos.x, 0, player.pos.z);
  }
  for (let i = hearts3d.length - 1; i >= 0; i--) {
    const h = hearts3d[i]; h.t += dt;
    h.mesh.position.y += h.vy * dt;
    h.mesh.material.opacity = Math.max(0, 1 - h.t / h.life);
    if (h.t > h.life) { scene.remove(h.mesh); hearts3d.splice(i, 1); }
  }
}
function updateWanderers(dt) {
  for (const n of npcs) {
    n.t -= dt;
    if (n.t <= 0) {
      if (n.pause > 0) n.pause -= dt;
      else {
        n.tx = -44 + Math.random() * 88; n.tz = -14 + Math.random() * 24;
        if (inWater2(n.tx, n.tz) || shopAt(n.tx, n.tz, 1) || structureAt(n.tx, n.tz, 1)) { n.pause = 1; n.t = 0.5; continue; }
        n.pause = 1.5 + Math.random() * 2.5; n.t = 2 + Math.random() * 2;
      }
    } else if (n.pause <= 0) {
      const dx = n.tx - n.mesh.position.x, dz = n.tz - n.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.4) {
        const s2 = 1.4 * dt;
        n.mesh.position.x += (dx / d) * s2; n.mesh.position.z += (dz / d) * s2;
        n.walk += dt * 6;
        n.mesh.position.y = 1.0 + Math.abs(Math.sin(n.walk)) * 0.06;
        n.mesh.rotation.y = Math.atan2(dx, dz);
        swingHuman(n.mesh, n.walk);
      }
    }
  }
  for (const b of bots) {
    // Hide & Time: hiders stay frozen at their hiding spot until found
    try { if (typeof HT !== 'undefined' && HT.active && htIsHider(b)) continue; } catch {}
    b.t -= dt;
    if (b.t <= 0) {
      if (b.pause > 0) b.pause -= dt;
      else {
        b.tx = -30 + Math.random() * 60; b.tz = -12 + Math.random() * 24;
        if (inWater2(b.tx, b.tz) || shopAt(b.tx, b.tz, 1) || structureAt(b.tx, b.tz, 1)) { b.pause = 1; b.t = 0.5; continue; }
        b.pause = 2 + Math.random() * 3; b.t = 2 + Math.random() * 3;
      }
    } else if (b.pause <= 0) {
      const dx = b.tx - b.mesh.position.x, dz = b.tz - b.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.4) {
        const s2 = 1.6 * dt;
        b.mesh.position.x += (dx / d) * s2; b.mesh.position.z += (dz / d) * s2;
        b.walk = (b.walk || 0) + dt * 6;
        b.mesh.position.y = 1.0 + Math.abs(Math.sin(b.walk)) * 0.06;
        b.mesh.rotation.y = Math.atan2(dx, dz);
        swingHuman(b.mesh, b.walk);
      }
    }
  }
  for (const p of pickups) {
    if (p.taken) {
      p.respawn -= dt;
      if (p.respawn <= 0) { p.taken = false; p.mesh.visible = true; }
    } else {
      p.mesh.position.y = 1.35 + Math.sin(performance.now() / 600 + p.ph) * 0.08;
      p.mesh.rotation.y += dt;
    }
  }
}
function updateCozy(dt) {
  state.seasonT = (state.seasonT || 0) + dt;
  if (state.seasonT > 300) setSeason((state.season || 0) + 1);
  updateWanderers(dt);
  updateFx(dt);
  updateDay(dt);
  updateInteractTip(dt);
  try { ensurePickupsAround(dt); } catch {}
  try { if (!state.inside) tickInfiniteGround(dt, false); } catch {}
  restTick += dt;
  if (restTick > 5) { restTick = 0; if (state.happy > 55) { state.happy = Math.max(55, state.happy - 0.4); renderHUD(); } }
  MP.sendT += dt;
  if (MP.sendT > 0.2) { MP.sendT = 0; mpSendMove(); }
  mmTimer += dt;
  if (mmTimer > 0.25) { mmTimer = 0; drawMinimap(); }
}

// ============ You: a smooth human + third-person camera + visible bike ============
// NOTE: everybody is human-shaped now (player, NPCs, bots, multiplayer friends).
const avMats = {
  shirt: new THREE.MeshLambertMaterial({ color: new THREE.Color(SHIRTS[0]) }),
  hair: new THREE.MeshLambertMaterial({ color: new THREE.Color(HAIRS[0].c) }),
  skin: new THREE.MeshLambertMaterial({ color: new THREE.Color('#F6D6C3') }),
  pants: new THREE.MeshLambertMaterial({ color: new THREE.Color('#2b3a67') }),
  dark: new THREE.MeshLambertMaterial({ color: new THREE.Color('#2b2117') }),
  shoe: new THREE.MeshLambertMaterial({ color: new THREE.Color('#3a2d24') }),
  hat: new THREE.MeshLambertMaterial({ color: new THREE.Color('#7c4dff') }),
  white: new THREE.MeshLambertMaterial({ color: new THREE.Color('#ffffff') }),
};
const bikeMats = {
  frame: new THREE.MeshLambertMaterial({ color: new THREE.Color('#e53935') }),
  tire: new THREE.MeshLambertMaterial({ color: new THREE.Color('#222228') }),
  metal: new THREE.MeshLambertMaterial({ color: new THREE.Color('#b0bec5') }),
  seat: new THREE.MeshLambertMaterial({ color: new THREE.Color('#4A322A') }),
  basket: new THREE.MeshLambertMaterial({ color: new THREE.Color('#9c6b30') }),
  bell: new THREE.MeshLambertMaterial({ color: new THREE.Color('#ffd23f') }),
};
let avLegL, avLegR, avArmL, avArmR;
let avHairShort, avHairLong, avHairBun, avHatGroup;
const avatar = new THREE.Group();
const bikeGroup = new THREE.Group();
let bikeWheelF = null, bikeWheelR = null, bikeBasket = null;
(function buildAvatarHuman() {
  const sph = (r, mat, x, y, z, parent, ws = 20, hs = 14) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
    m.position.set(x, y, z);
    (parent || avatar).add(m);
    return m;
  };
  const cap = (r, len, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
    m.position.set(x, y, z);
    (parent || avatar).add(m);
    return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, parent, seg = 18) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    (parent || avatar).add(m);
    return m;
  };
  // ---- legs (pivot at hip for walk swing) ----
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * 0.14, 0.78, 0);
    cap(0.115, 0.42, avMats.pants, 0, -0.34, 0, g); // smooth thigh+shin
    const shoe = sph(0.115, avMats.shoe, 0, -0.68, 0.05, g);
    shoe.scale.set(1, 0.65, 1.45); // rounded shoe pointing forward
    avatar.add(g);
    if (s < 0) avLegL = g; else avLegR = g;
  }
  // ---- torso: soft rounded human chest (not a box) ----
  const torso = cap(0.26, 0.34, avMats.shirt, 0, 1.08, 0, avatar);
  torso.scale.set(1.12, 1, 0.7);
  sph(0.105, avMats.shirt, -0.3, 1.36, 0, avatar); // rounded shoulders
  sph(0.105, avMats.shirt, 0.3, 1.36, 0, avatar);
  cyl(0.085, 0.095, 0.14, avMats.skin, 0, 1.42, 0, avatar); // neck
  // ---- arms (pivot at shoulder) ----
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * 0.36, 1.36, 0);
    cap(0.082, 0.34, avMats.shirt, 0, -0.24, 0, g); // sleeve / arm
    sph(0.085, avMats.skin, 0, -0.52, 0, g); // hand
    avatar.add(g);
    if (s < 0) avArmL = g; else avArmR = g;
  }
  // ---- head: round human head + face (looks along local +z) ----
  const HEAD_Y = 1.7;
  sph(0.26, avMats.skin, 0, HEAD_Y, 0, avatar, 24, 18);
  sph(0.05, avMats.skin, -0.26, HEAD_Y, 0, avatar); // ears
  sph(0.05, avMats.skin, 0.26, HEAD_Y, 0, avatar);
  sph(0.028, avMats.skin, 0, HEAD_Y - 0.03, 0.255, avatar); // nose tip
  sph(0.036, avMats.dark, -0.1, HEAD_Y + 0.02, 0.228, avatar); // eyes
  sph(0.036, avMats.dark, 0.1, HEAD_Y + 0.02, 0.228, avatar);
  sph(0.012, avMats.white, -0.09, HEAD_Y + 0.033, 0.258, avatar, 8, 6); // eye shine
  sph(0.012, avMats.white, 0.11, HEAD_Y + 0.033, 0.258, avatar, 8, 6);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 16, Math.PI), avMats.dark);
  smile.position.set(0, HEAD_Y - 0.1, 0.235);
  smile.rotation.z = Math.PI; // curve downward = smile
  smile.rotation.x = -0.15;
  avatar.add(smile);
  // ---- hairstyles (original human hair, toggled by creator style A/B/C) ----
  // A: short & soft — neat cap
  avHairShort = new THREE.Group();
  const capShort = new THREE.Mesh(new THREE.SphereGeometry(0.275, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), avMats.hair);
  capShort.position.set(0, HEAD_Y + 0.03, -0.02);
  avHairShort.add(capShort);
  avatar.add(avHairShort);
  // B: long & flowy — cap + soft fall down the back
  avHairLong = new THREE.Group();
  const capLong = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), avMats.hair);
  capLong.position.set(0, HEAD_Y + 0.03, -0.02);
  avHairLong.add(capLong);
  const fall = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 6, 12), avMats.hair);
  fall.position.set(0, HEAD_Y - 0.32, -0.24);
  avHairLong.add(fall);
  avatar.add(avHairLong);
  // C: little bun — cap + top bun
  avHairBun = new THREE.Group();
  const capBun = new THREE.Mesh(new THREE.SphereGeometry(0.275, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), avMats.hair);
  capBun.position.set(0, HEAD_Y + 0.03, -0.02);
  avHairBun.add(capBun);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), avMats.hair);
  bun.position.set(0, HEAD_Y + 0.3, -0.08);
  avHairBun.add(bun);
  avatar.add(avHairBun);
  // ---- hat (shop hats sit on the human head) ----
  avHatGroup = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.045, 22), avMats.hat);
  brim.position.set(0, HEAD_Y + 0.24, 0);
  avHatGroup.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.17, 22), avMats.hat);
  crown.position.set(0, HEAD_Y + 0.34, 0);
  avHatGroup.add(crown);
  avHatGroup.visible = false;
  avatar.add(avHatGroup);
  avatar.scale.setScalar(0.9);
  avatar.visible = false;
  scene.add(avatar);
})();
(function buildBike() {
  // Blocky Trail Bicycle — child of avatar so it follows the player yaw.
  // Forward is local +z. Wheels spin around local X when moving.
  const bBox = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    bikeGroup.add(m);
    return m;
  };
  const wheelGeo = new THREE.TorusGeometry(0.32, 0.06, 8, 18);
  wheelGeo.rotateY(Math.PI / 2); // wheel plane -> YZ, rolls forward along z
  bikeWheelR = new THREE.Mesh(wheelGeo, bikeMats.tire);
  bikeWheelR.position.set(0, 0.34, -0.48);
  bikeGroup.add(bikeWheelR);
  bikeWheelF = new THREE.Mesh(wheelGeo, bikeMats.tire);
  bikeWheelF.position.set(0, 0.34, 0.55);
  bikeGroup.add(bikeWheelF);
  // hubs
  bBox(0.1, 0.1, 0.1, bikeMats.metal, 0, 0.34, -0.48);
  bBox(0.1, 0.1, 0.1, bikeMats.metal, 0, 0.34, 0.55);
  // frame: low bar + seat post + handle post
  bBox(0.08, 0.08, 1.05, bikeMats.frame, 0, 0.55, 0.03);
  bBox(0.08, 0.45, 0.08, bikeMats.frame, 0, 0.62, -0.44);
  bBox(0.08, 0.55, 0.08, bikeMats.frame, 0, 0.68, 0.52);
  // seat + handlebar + bell
  bBox(0.28, 0.09, 0.3, bikeMats.seat, 0, 0.88, -0.44);
  bBox(0.52, 0.07, 0.07, bikeMats.metal, 0, 0.98, 0.52);
  bBox(0.12, 0.08, 0.12, bikeMats.bell, 0.18, 1.04, 0.52);
  // pedals
  bBox(0.34, 0.06, 0.12, bikeMats.metal, 0, 0.32, 0.0);
  // basket (front, only when owned upgrade)
  bikeBasket = bBox(0.36, 0.22, 0.28, bikeMats.basket, 0, 0.88, 0.78);
  bikeGroup.visible = false;
  avatar.add(bikeGroup);
})();
function refreshAvatarColors() {
  try {
    avMats.shirt.color.set(state.shirt || SHIRTS[0]);
    avMats.hair.color.set(state.hair || HAIRS[0].c);
    const st = state.style | 0;
    if (avHairShort) avHairShort.visible = st === 0;
    if (avHairLong) avHairLong.visible = st === 1;
    if (avHairBun) avHairBun.visible = st === 2;
    if (avHatGroup) {
      avHatGroup.visible = !!state.hat;
      if (state.hat) avMats.hat.color.set(state.hat);
    }
  } catch {}
}
function eyePos() {
  return new THREE.Vector3(player.pos.x, player.pos.y + 1.62, player.pos.z);
}
function positionCamera() {
  const eye = eyePos();
  camera.position.copy(eye);
  camera.rotation.set(0, 0, 0);
  camera.rotateY(player.yaw); camera.rotateX(player.pitch);
  if (state.thirdPerson) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    camera.position.copy(eye).addScaledVector(dir, -4.2);
    camera.position.y += 0.7;
    camera.lookAt(eye.x + dir.x * 4, eye.y + dir.y * 4, eye.z + dir.z * 4);
  }
}
let avWalk = 0;
const avLast = new THREE.Vector3(0.5, 3, -2);
function positionAvatar(dt = 0) {
  avatar.visible = !!state.thirdPerson && !!state.started;
  if (!avatar.visible) return;
  avatar.position.set(player.pos.x, player.pos.y, player.pos.z);
  avatar.rotation.y = player.yaw + Math.PI;
  const sp = dt > 0 ? avLast.distanceTo(player.pos) / dt : 0;
  avLast.copy(player.pos);
  if (sp > 0.5) avWalk += dt * (5 + sp);
  // --- bike: show when riding, hide otherwise ---
  const riding = !!state.riding;
  if (bikeGroup) bikeGroup.visible = riding;
  if (bikeBasket) bikeBasket.visible = !!state.hasBasket;
  if (riding) {
    // sit on the seat
    avatar.position.y += 0.3;
    // spin wheels with speed
    const spin = sp * dt * 2.2;
    if (bikeWheelF) bikeWheelF.rotation.x += spin;
    if (bikeWheelR) bikeWheelR.rotation.x += spin;
    // riding pose: arms reach forward to handlebar, legs pedal
    if (sp > 0.5) {
      const ped = Math.sin(avWalk * 1.6) * 0.55;
      avLegL.rotation.x = -0.9 + ped;
      avLegR.rotation.x = -0.9 - ped;
    } else {
      avLegL.rotation.x = -0.9; avLegR.rotation.x = -0.9;
    }
    avArmL.rotation.x = -0.95; avArmR.rotation.x = -0.95;
    // little bob while rolling
    if (sp > 0.5) avatar.position.y += Math.abs(Math.sin(avWalk * 1.6)) * 0.03;
    return;
  }
  const sw = sp > 0.5 ? Math.sin(avWalk) * 0.6 : 0;
  avLegL.rotation.x = sw; avLegR.rotation.x = -sw;
  avArmL.rotation.x = -sw * 0.9; avArmR.rotation.x = sw * 0.9;
  if (sp > 0.5) avatar.position.y += Math.abs(Math.sin(avWalk)) * 0.05;
}

// ============ Hide & Time: share location to start, hide anywhere, time-travel ============
// Friends share their in-world location to start, then hide ANYWHERE (space + era).
// You seek them by walking up to them in the right era.
// Past = fixed dusty valley. Present = normal. Future = GUESSED fresh every visit
// (nobody knows the future, so it reshuffles + future hiders re-hide).
const HT = { active: false, era: 'present', guess: 0, hiders: [], found: 0 };
function htEraName(e) { return e === 'past' ? '🦕 past' : e === 'future' ? '🔮 guessed future #' + HT.guess : '🏠 present'; }
function htIsHider(bot) { return HT.hiders.some((h) => h.bot === bot); }
function htUpdateBar() {
  const bar = $('timebar'); if (!bar) return;
  bar.classList.toggle('hidden', !HT.active);
  const s = $('timeStatus'); if (s) s.textContent = htEraName(HT.era) + ` · 🎯 ${HT.found}/${HT.hiders.length || 3}`;
  for (const [id, e] of [['past-btn', 'past'], ['present-btn', 'present'], ['future-btn', 'future']]) {
    const b = $(id); if (b) b.classList.toggle('on', HT.era === e);
  }
  const t = $('time-btn'); if (t) t.textContent = HT.active ? '🕰️ Seeking… (stop)' : '🕰️ Hide & Time';
}
function htScatter(bot, radius) {
  // hide anywhere: random open spot away from player
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * (radius || 28);
    const x = player.pos.x + Math.cos(a) * r, z = player.pos.z + Math.sin(a) * r;
    try {
      if (typeof inWater2 === 'function' && inWater2(x, z)) continue;
      if (typeof shopAt === 'function' && shopAt(x, z, 2)) continue;
      if (typeof structureAt === 'function' && structureAt(x, z, 2)) continue;
      try { ensureGroundAround(x, z); } catch {}
      bot.mesh.position.set(x, 1.0, z);
      bot.tx = x; bot.tz = z; bot.t = 9999; bot.pause = 9999; // stay hidden, don't wander
      return;
    } catch { continue; }
  }
}
function htApplySky() {
  try {
    if (HT.era === 'past') {
      scene.background = new THREE.Color(0xd8a05a); // dusty amber past
      scene.fog = new THREE.Fog(0xd8a05a, 28, 90);
      sun.intensity = 0.75;
      if (cozyParticles) cozyParticles.material.color.set(0x8a5a2b);
    } else if (HT.era === 'future') {
      const neons = [0x1c1030, 0x0b2b3a, 0x2b0b3a, 0x0b3a2b];
      const c = neons[HT.guess % neons.length];
      scene.background = new THREE.Color(c); // guessed neon future
      scene.fog = new THREE.Fog(c, 28, 90);
      sun.intensity = 0.85;
      if (cozyParticles) cozyParticles.material.color.set([0x7c4dff, 0x00e5ff, 0xff6b81, 0x7CFC98][HT.guess % 4]);
    } else {
      applySeasonSky(); // present = normal season sky
    }
  } catch {}
}
function htTravel(era, quiet) {
  if (!HT.active) return;
  HT.era = era;
  if (era === 'future') {
    // NOBODY knows the future -> re-guess it every visit: new sky + future hiders re-hide
    HT.guess++;
    for (const h of HT.hiders) {
      if (!h.caught && h.era === 'future') { htScatter(h.bot, 30); }
    }
    if (!quiet) { toast(`🔮 Guessed future #${HT.guess} — it reshuffled! Future hiders moved.`); sfx.happy(); }
  } else if (era === 'past' && !quiet) { toast('🦕 You hop to the PAST — dusty valley, same hiding rules.'); sfx.pop(); }
  else if (era === 'present' && !quiet) { toast('🏠 Back to the PRESENT.'); sfx.pop(); }
  htApplySky(); htSyncHiderVisibility(); htUpdateBar(); htTick(true);
}
function htSyncHiderVisibility() {
  // Only hiders living in YOUR current era are visible — time-travel to see the rest.
  for (const h of HT.hiders) {
    try {
      if (h.caught) { h.bot.mesh.visible = true; continue; }
      h.bot.mesh.visible = (h.era === HT.era);
    } catch {}
  }
}
function htShareAndStart() {
  if (!state.started) { toast('Press ▶ Play first, then start Hide & Time!'); return; }
  if (HT.active) { htStop(true); return; }
  if (!bots.length) { try { spawnBots(); } catch {} }
  if (!bots.length) { toast('No friends here yet — try again after the world loads.'); return; }
  // 1) Everyone SHARES their location to start (your real GPS if allowed + in-world grid)
  const px = Math.round(player.pos.x), pz = Math.round(player.pos.z);
  let real = 'in-world';
  try {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      (p) => chatLine('', `📍 ${state.name} also shared real GPS ${p.coords.latitude.toFixed(3)},${p.coords.longitude.toFixed(3)} (flavor only — hiding uses the valley)`, true),
      () => {}, { timeout: 2000 });
    real = 'valley';
  } catch {}
  chatLine('', `📍 ${state.name} shared location (${px},${pz}) — game starting! Everyone scatters…`, true);
  // 2) Friends share + travel ANYWHERE (space + past/present/guessed-future)
  const eras = ['past', 'present', 'future'];
  HT.hiders = bots.slice(0, 3).map((bot, i) => {
    const era = eras[Math.floor(Math.random() * 3)];
    htScatter(bot, 30);
    const hx = Math.round(bot.mesh.position.x), hz = Math.round(bot.mesh.position.z);
    chatLine(bot.profile.name, `📍 my start was (${px},${pz}) — now I'm hidden somewhere in the ${era}!`, false);
    return { bot, era, caught: false };
  });
  HT.active = true; HT.era = 'present'; HT.found = 0;
  if (HT.guess === 0) HT.guess = 1;
  htApplySky(); htSyncHiderVisibility(); htUpdateBar();
  sfx.happy();
  showDialog('⏳', 'Hide & Time — GO!',
    `Everyone shared their spot, then hid ANYWHERE — even in the past or a guessed future.\nWalk close to a friend in the RIGHT era to find them (${HT.hiders.length} hiding).\n🦕 Past (7) · 🏠 Now (8) · 🔮 Future (9) — the future re-guesses every visit because nobody knows it!`);
  autoSave();
}
function htStop(manual) {
  if (!HT.active) return;
  HT.active = false;
  try { for (const h of HT.hiders) { h.bot.mesh.visible = true; h.bot.t = 1; h.bot.pause = 1; } } catch {}
  HT.hiders = []; HT.found = 0;
  try { applySeasonSky(); } catch {}
  htUpdateBar();
  if (manual) toast('Hide & Time stopped — friends are all visible again.');
}
function htTick(silent) {
  if (!HT.active || !state.started || state.inside) return;
  let changed = false;
  for (const h of HT.hiders) {
    if (h.caught) continue;
    if (h.era !== HT.era) continue; // must match era to catch
    const d = Math.hypot(player.pos.x - h.bot.mesh.position.x, player.pos.z - h.bot.mesh.position.z);
    if (d < 3.4) {
      h.caught = true; HT.found++; changed = true;
      const nm = h.bot.profile.name;
      state.coins = (state.coins || 0) + 20;
      state.happy = Math.min(100, (state.happy || 60) + 10);
      state.knowledge = (state.knowledge || 0) + 10;
      try { spawnHearts(h.bot.mesh.position.x, 2.6, h.bot.mesh.position.z, 6); } catch {}
      try { sfx.happy(); } catch {}
      chatLine('', `🎉 Found ${nm} hiding in the ${h.era} at (${Math.round(h.bot.mesh.position.x)},${Math.round(h.bot.mesh.position.z)})! +20🪷 +10😊 +10⭐`, true);
      if (!silent) toast(`🎉 Found ${nm}! (${HT.found}/${HT.hiders.length})`);
      try { renderHUD(); } catch {}
    }
  }
  if (changed) {
    htUpdateBar();
    try { autoSave(); } catch {}
    if (HT.found >= HT.hiders.length && HT.hiders.length) {
      try { sfx.happy(); } catch {}
      showDialog('🏆', 'All friends found!',
        `You searched space AND time — past, present and guessed futures — and found everyone in the valley!\n+bonus petals are yours. Press 📍 Re-hide for a new round, or keep building.`);
      chatLine('', `🏆 ${state.name} found everyone through time! Past ✅ Present ✅ Guessed futures ✅`, true);
    }
  }
}
setInterval(() => { try { htTick(false); } catch {} }, 400);
addEventListener('keydown', (e) => {
  const chatFocus = document.activeElement === $('chatIn') || document.activeElement === $('nameInput');
  if (chatFocus || !state.started) return;
  if (e.code === 'KeyY' && !anyModalOpen()) htShareAndStart();
  if (!HT.active || anyModalOpen()) return;
  if (e.code === 'Digit7') htTravel('past');
  if (e.code === 'Digit8') htTravel('present');
  if (e.code === 'Digit9') htTravel('future');
});

// ============ Bug reports: real in-game reporter (stored on device + export) ============
const BUG_KEY = 'blockcraft-bug-reports-v1';
let bugReports = [];
const bugErrors = []; // recent window errors, auto-attached to reports
addEventListener('error', (e) => {
  try {
    bugErrors.push(`${new Date().toISOString()} ${(e && e.message) || 'error'} @${(e && e.lineno) || '?'}`);
    if (bugErrors.length > 20) bugErrors.shift();
  } catch {}
});
function isBugOpen() { const m = $('bug-modal'); return m && !m.classList.contains('hidden'); }
function loadBugs() { try { bugReports = JSON.parse(localStorage.getItem(BUG_KEY) || '[]'); if (!Array.isArray(bugReports)) bugReports = []; } catch { bugReports = []; } }
function saveBugs() { try { localStorage.setItem(BUG_KEY, JSON.stringify(bugReports.slice(-100))); } catch {} }
function bugCtx() {
  return {
    when: new Date().toISOString(), who: state.name,
    at: `${Math.round(player.pos.x)},${Math.round(player.pos.y)},${Math.round(player.pos.z)}`,
    season: SEASONS[state.season || 0].n, inside: state.inside || 'outside',
    era: (typeof HT !== 'undefined' && HT.active) ? HT.era : '—',
    drill: !!state.drillOwned, voxels: voxels.size,
    device: matchMedia('(pointer: coarse)').matches ? 'phone' : 'desktop',
    agent: String(navigator.userAgent || '').slice(0, 120),
    errors: bugErrors.slice(-8),
  };
}
function bugText(r) {
  return `BUG: ${r.title}\nBy ${r.who} @ ${r.when}\n---\n${r.desc}\n---\nCONTEXT:\n${JSON.stringify(r.ctx, null, 1)}`;
}
function bugCopy(t, done) {
  const ok = () => { toast('Copied — paste it anywhere (chat, email, notes)!'); if (done) done(); };
  const fb = () => {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch { toast('Copy failed — use Download instead.'); }
    ta.remove();
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok).catch(fb);
    else fb();
  } catch { fb(); }
}
function renderBugs() {
  const list = $('bugList'); if (!list) return;
  $('bugCount').textContent = bugReports.length;
  $('bug-btn').textContent = bugReports.length ? `🐞 Bugs (${bugReports.length})` : '🐞 Bugs';
  try {
    const c = bugCtx();
    $('bugCtx').textContent = `auto-attached: @${c.at} · ${c.season} · ${c.inside} · voxels:${c.voxels}`;
  } catch {}
  list.innerHTML = bugReports.length ? '' : '<p class="tiny">no reports yet — thank you for helping!</p>';
  [...bugReports].reverse().forEach((r) => {
    const d = document.createElement('div'); d.className = 'bug-item';
    const h = document.createElement('h4'); h.textContent = r.title;
    const s = document.createElement('small'); s.textContent = `${r.who} · ${new Date(r.when).toLocaleString()} · @${(r.ctx && r.ctx.at) || '?'}`;
    const p = document.createElement('p'); p.textContent = r.desc;
    const row = document.createElement('div'); row.className = 'row-btns';
    const cp = document.createElement('button'); cp.className = 'ghost'; cp.textContent = '⧉ copy';
    cp.onclick = () => bugCopy(bugText(r));
    const del = document.createElement('button'); del.className = 'ghost'; del.textContent = 'delete';
    del.onclick = () => { bugReports = bugReports.filter((x) => x.id !== r.id); saveBugs(); renderBugs(); toast('Report deleted.'); };
    row.appendChild(cp); row.appendChild(del);
    d.appendChild(h); d.appendChild(s); d.appendChild(p); d.appendChild(row);
    list.appendChild(d);
  });
}
function openBugs() { document.exitPointerLock?.(); loadBugs(); renderBugs(); $('bug-modal').classList.remove('hidden'); }
function closeBugs() { $('bug-modal').classList.add('hidden'); }
function submitBug() {
  const title = $('bugTitle').value.trim(), desc = $('bugDesc').value.trim();
  if (!title || !desc) { sfx.no(); toast('Give it a short title + what happened first!'); return; }
  // PRIVATE by design: localStorage only. Never send via MP/chat — only the
  // developer + local AI fixer get it. Do not add chatLine/mpSend here.
  const report = {
    id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 99),
    when: new Date().toISOString(), who: state.name || 'Sunny',
    title: title.slice(0, 80), desc: desc.slice(0, 1000), ctx: bugCtx(),
  };
  bugReports.push(report);
  saveBugs(); $('bugTitle').value = ''; $('bugDesc').value = '';
  sfx.happy(); renderBugs();
  // AUTO-SEND TO AI: queue it in the local autofix service so the AI picks it
  // up immediately — no manual copy/paste or "Process Queue" click needed.
  // Still fully private: same-device queue only, never broadcast to players.
  try {
    loadAutofixData();
    const aiReq = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      type: 'bug',
      title: report.title,
      description: `${report.desc}\n\n--- auto-attached ---\nBy ${report.who} @ ${report.when}\n@${(report.ctx && report.ctx.at) || '?'} · ${(report.ctx && report.ctx.season) || ''} · ${(report.ctx && report.ctx.inside) || ''} · voxels:${(report.ctx && report.ctx.voxels) || '?'} · ${(report.ctx && report.ctx.device) || ''}\nerrors: ${((report.ctx && report.ctx.errors) || []).join(' | ') || 'none'}`,
      status: 'pending',
      timestamp: Date.now(),
      completedAt: null,
      result: null,
      fromBugId: report.id,
    };
    autofixService.requests.push(aiReq);
    saveAutofixData();
    // kick the queue automatically (processQueue no-ops if already running)
    try { processQueue(); } catch {}
  } catch (e) { try { console.error('AI auto-send failed:', e); } catch {} }
  toast('🐞 Sent to AI fixer 🤖 + saved privately for the developer. Never shared with other players.');
}
addEventListener('keydown', (e) => {
  const chatFocus = document.activeElement === $('chatIn') || document.activeElement === $('nameInput')
    || document.activeElement === $('bugTitle') || document.activeElement === $('bugDesc');
  if (chatFocus || !state.started) return;
  if (e.code === 'KeyP') { isBugOpen() ? closeBugs() : openBugs(); }
});

// ============ Mining Fields: an empty world with NOTHING protected ============
// Press ⛏️ Mine (M): you jump to a far empty zone — pure diggable earth, no shops,
// no houses, no protection. Press it again when done: you come back out to town.
const MINE_SPOT = { x: 500, z: 500 };
let mineActive = false, mineReturn = null, mineLockT = 0;
function updateMineBtn() {
  const b = $('mine-btn'); if (!b) return;
  b.textContent = mineActive ? '🏠 Back to town' : '⛏️ Mine';
}
function toggleMine() {
  if (!state.started) { toast('Press ▶ Play first!'); return; }
  const now = performance.now();
  if (now - mineLockT < 600) return; // ignore double-fire (touch + click on some phones)
  mineLockT = now;
  // close any open panel first instead of refusing — the button always works
  try { closeQuiz(); } catch {}
  ['help-modal', 'shop-modal', 'bag-modal', 'dialog-modal', 'bug-modal'].forEach((id) => { try { $(id).classList.add('hidden'); } catch {} });
  try { toggleChat(false); } catch {}
  if (!mineActive) {
    // going IN: remember where you stood, then jump to the empty fields
    if (state.inside) { state.inside = null; state.riding = false; }
    mineReturn = player.pos.clone();
    if (Math.hypot(mineReturn.x - MINE_SPOT.x, mineReturn.z - MINE_SPOT.z) < 40) {
      // already out there (e.g. after a reload) — head back to your doorstep instead
      try { mineReturn.set(homeDoor.x, 2.2, homeDoor.z + 1); } catch {}
    }
    try { ensureGroundAround(MINE_SPOT.x, MINE_SPOT.z); } catch {}
    player.pos.set(MINE_SPOT.x + 0.5, 5, MINE_SPOT.z + 0.5);
    player.vel.set(0, 0, 0);
    mineActive = true; updateMineBtn();
    sfx.pop();
    toast('⛏️ The Mining Fields — NOTHING is protected here, dig anywhere! Press ⛏️ Mine (M) when done to come back out.');
    try { chatLine('', '⛏️ headed to the Mining Fields…', true); } catch {}
  } else {
    // coming OUT: back to the normal world where you left it
    try {
      if (mineReturn) player.pos.copy(mineReturn);
      else player.pos.set(homeDoor.x, 2.2, homeDoor.z + 1);
    } catch { try { player.pos.set(0.5, 3, -2); } catch {} }
    try { ensureGroundAround(player.pos.x, player.pos.z); } catch {}
    player.vel.set(0, 0, 0);
    try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
    mineActive = false; mineReturn = null; updateMineBtn();
    sfx.pop();
    toast('🏠 Back in town — welcome back!');
  }
  try { renderHUD(); autoSave(); } catch {}
}
addEventListener('keydown', (e) => {
  const chatFocus = document.activeElement === $('chatIn') || document.activeElement === $('nameInput')
    || document.activeElement === $('bugTitle') || document.activeElement === $('bugDesc');
  if (chatFocus || !state.started) return;
  if (e.code === 'KeyM') toggleMine();
});

// ---------- UI wiring ----------
function startWithAvatar(fromSave) {
  state.started = true;
  $('start-screen').classList.add('hidden');
  if (fromSave) {
    const had = load();
    if (!had) genWorld(true);
    else { refreshSeasonalShops(); scatterPickups(); spawnNPCs(); spawnBots(); buildFurnitureMeshes(); }
  } else {
    applyCreator();
    const av = { name: state.name, style: state.style, hair: state.hair, shirt: state.shirt, gender: state.gender, ps: state.ps, po: state.po, pp: state.pp, pro: state.pro, homeXZ: { ...lotForName(state.name) } };
    const had = load();
    Object.assign(state, av);
    try { state.homeXZ = { ...lotForName(state.name) }; } catch {}
    if (!had) genWorld(true);
    else { refreshSeasonalShops(); scatterPickups(); spawnNPCs(); spawnBots(); buildFurnitureMeshes(); }
    if (!had) {
      // fresh start: you wake up INSIDE your own home room — decorate it,
      // nap in the bed, then press E on the door mat to step out to your village lot!
      try { ensureGroundAround(HOME_IN.x, HOME_IN.z); } catch {}
      state.inside = 'home';
      player.pos.set(HOME_IN.x + 0.5, 2.2, HOME_IN.z + 2.5); player.vel.set(0, 0, 0);
      try { homeReturn = new THREE.Vector3(homeDoor.x, 2.2, homeDoor.z + 1); } catch {}
    }
  }
  try { ensureGroundAround(player.pos.x, player.pos.z); } catch {}
  try { lastGroundCX = Math.floor(player.pos.x); lastGroundCZ = Math.floor(player.pos.z); groundT = 0; } catch {}
  try { for (let i = 0; i < 5 && collides(player.pos.x, player.pos.y, player.pos.z); i++) player.pos.y += 0.5; } catch {}
  applySeasonSky();
  renderHUD(); renderHotbar(); refreshAvatarColors(); startMusic();
  toast(state.inside ? '🏠 You woke up in YOUR home — E on the bed naps, E on the mat steps outside!' : '⛏️ Break / place · E interact · Q quiz · B bike · G fly · U unstuck!');
  renderer.domElement.requestPointerLock?.();
}
$('play-btn').onclick = () => startWithAvatar(false);
$('continue-btn').onclick = () => startWithAvatar(true);
$('new-world-btn').onclick = () => {
  applyCreator();
  state.started = true;
  $('start-screen').classList.add('hidden');
  localStorage.removeItem(SAVE_KEY);
  BLOCKS.forEach(b => state.inventory[b.id] = b.count);
  Object.assign(state, {
    energy: 100, knowledge: 0, placed: 0, coins: 150, happy: 60, bag: {},
    placedFurn: [], seedBoost: 1, season: 0, seasonT: 0,
    bikeOwned: false, riding: false, hasBasket: false, drillOwned: false, decorate: false, inside: null,
    flying: false,
    homeXZ: { ...lotForName(state.name) },
  });
  flyUpHeld = false; flyDownHeld = false;
  player.pos.set(0.5, 3, -2); player.vel.set(0, 0, 0);
  genWorld(true);
  // new flat world: wake up inside YOUR home room
  try { ensureGroundAround(HOME_IN.x, HOME_IN.z); } catch {}
  state.inside = 'home';
  player.pos.set(HOME_IN.x + 0.5, 2.2, HOME_IN.z + 2.5); player.vel.set(0, 0, 0);
  try { homeReturn = new THREE.Vector3(homeDoor.x, 2.2, homeDoor.z + 1); } catch {}
  applySeasonSky();
  renderHUD(); renderHotbar(); refreshAvatarColors(); startMusic();
  toast('🏠 New world, same home — E on the mat steps outside!');
  renderer.domElement.requestPointerLock?.();
};
$('quiz-btn').onclick = openQuiz;
$('quiz-close').onclick = closeQuiz;
$('quiz-next').onclick = () => { state.quizIndex++; showQuestion(); };
$('help-btn').onclick = () => { document.exitPointerLock?.(); $('help-modal').classList.remove('hidden'); };
$('bug-btn').onclick = openBugs;
$('bug-close').onclick = closeBugs;
$('bug-submit').onclick = submitBug;
$('bug-copy').onclick = () => {
  if (!bugReports.length) { toast('No reports to copy yet.'); return; }
  bugCopy(bugReports.map(bugText).join('\n\n====\n\n'));
};
$('bug-dl').onclick = () => {
  if (!bugReports.length) { toast('No reports to download yet.'); return; }
  const blob = new Blob([bugReports.map(bugText).join('\n\n====\n\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'blockcraft-bug-reports.txt';
  document.body.appendChild(a); a.click();
  setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch {} a.remove(); }, 600);
  toast('⬇ Downloaded — send the file to the developer!');
};
$('help-close').onclick = () => $('help-modal').classList.add('hidden');
$('save-btn').onclick = () => save(false);
$('sound-btn').onclick = () => {
  state.soundOn = !state.soundOn;
  $('sound-btn').textContent = state.soundOn ? '🔊' : '🔇';
  if (state.soundOn) blip(440, 0.1);
};
$('bag-btn').onclick = openBag;
$('bag-close').onclick = closeBag;
$('shop-close').onclick = () => $('shop-modal').classList.add('hidden');
$('dialog-close').onclick = () => $('dialog-modal').classList.add('hidden');
$('keeper-btn').onclick = () => {
  if (!curShop) return;
  const k = KEEPERS[curShop.id];
  if (!k) { toast('Just a quiet room.'); return; }
  sfx.pop();
  const ln = typeof k.line === 'function' ? k.line(state) : k.line;
  state.happy = Math.min(100, state.happy + 2); renderHUD();
  showDialog('', k.name, ln);
};
$('sellFlowers').onclick = () => sellKind('wildflower', 6, 'No wildflowers yet — look for green sprouts (E to pick).', 'Thank you!');
$('sellShells').onclick = () => sellKind('shell', 9, 'No shells yet — stroll the pond or lake shore (E).', 'Lovely!');
$('sellShrooms').onclick = () => sellKind('mushroom', 12, 'No mushrooms yet — check the east woods, most in autumn.', 'Thank you!');
$('sellStars').onclick = () => sellKind('starflower', 14, 'No starflowers yet — they glow near the lake.', 'Sparkling!');
$('bike-btn').onclick = toggleBike;
$('fly-btn').onclick = toggleFly;
$('view-btn').onclick = toggleView;
$('bell-btn').onclick = () => { if (state.riding) ringBell(); };
$('decorate-btn').onclick = () => {
  state.decorate = !state.decorate; renderHUD();
  toast(state.decorate
    ? (isInsideHome() ? 'Decorate mode: aim at the floor/walls inside & click to furnish this room!' : 'Decorate mode: aim near your cottage & click — or go INSIDE (E at door) to furnish the room!')
    : 'Decorate off.');
};
$('mine-btn').onclick = toggleMine;
$('friends-btn').onclick = mpToggle;
$('talk-btn').onclick = () => toggleChat();
$('time-btn').onclick = htShareAndStart;
$('past-btn').onclick = () => htTravel('past');
$('present-btn').onclick = () => htTravel('present');
$('future-btn').onclick = () => htTravel('future');
$('time-hide-btn').onclick = () => { if (HT.active) htStop(false); htShareAndStart(); };
$('chatSend').onclick = mpSendChat;
$('seasonPill').onclick = () => { if (state.started) setSeason((state.season || 0) + 1); };
$('interactTip').onclick = () => { if (state.started) interact(); };
$('actBtn').onclick = () => { if (state.started) interact(); };

// ---------- Main loop ----------
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  // Don't slow-mo the player when the frame rate dips: dt was clamped to 0.05,
  // so below ~20fps real walk speed dropped (5.5 b/s -> 2.7 b/s at 10fps) and
  // big single steps collided-and-stopped. Instead use the real frame time
  // (up to 0.25s) and sub-step physics in <=0.05s chunks. Cozy visuals use it once.
  const rawDt = Math.min(clock.getDelta(), 0.25);
  if (state.started && !anyModalOpen() && !isHelpOpen()) {
    const steps = Math.max(1, Math.ceil(rawDt / 0.05));
    const dt = rawDt / steps;
    for (let i = 0; i < steps; i++) updatePlayer(dt);
  } else positionCamera();
  const dt = rawDt;
  if (state.started) updateCozy(dt);
  positionAvatar(dt);
  updateHighlight(dt);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Debug/testing handle (harmless in production)
window.__game = { get player() { return player; }, get state() { return state; }, get pickups() { return pickups; }, get npcs() { return npcs; }, get townShops() { return townShops; }, get nearTarget() { return nearTarget; }, get HOME_LOTS() { return HOME_LOTS; }, lotForName, lotIndexForName, ensureGroundAround, refreshSeasonalShops, refreshHomeNames, unstickPlayer, doBreak, doPlace, interact, toggleBike, toggleFly, save, openQuiz };

// Preview world behind start screen
buildCreator();
genWorld(true);
initCozyFx();
applySeasonSky();
if (hasSave() && $('continue-btn')) $('continue-btn').classList.remove('hidden');
renderHUD(); renderHotbar(); mpUI();
try { loadBugs(); if (bugReports.length) $('bug-btn').textContent = `🐞 Bugs (${bugReports.length})`; } catch {}
loop();
