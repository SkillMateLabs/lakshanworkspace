# BlockCraft Edu 3D - Shop and Economy System Specification

## Overview
The Shop and Economy System manages the in-game economy where players earn petals (currency) by collecting and selling natural items, then spend petals to purchase goods, upgrades, and decorative items from various shops scattered throughout the valley. The system includes seasonal availability, shopkeeper dialogue, and dynamic stock based on time of year.

## Implementation Location
- Primary: `main.js` (lines ~207-264 for shop/item data, ~622-760 for shop logic, ~909-950 for helper functions, ~1920-2235 for interact/bag/shop functions)
- Supporting: Various helper functions throughout main.js
- UI Elements: Shop modal (`#shop-modal`) and its children

## Core Data Structures

### Shop Items Definition (SHOPS object)
Defined in lines ~105-205:
```javascript
const SHOPS = {
  bakery: [ /* array of item objects */ ],
  flower: [ /* array of item objects */ ],
  books: [ /* array of item objects */ ],
  // ... 12+ shop categories
};
```

Each shop contains an array of item objects with properties:
- `id`: Unique identifier (used in state.bag and transactions)
- `e`: Emoji for display
- `n`: Item name string
- `p`: Description/plain text string
- `price`: Cost in petals (🪷)
- `use`: String indicating item purpose:
  - `'eat'`: Food items that increase happiness when consumed
  - `'wear'`: Clothing that changes avatar shirt color
  - `'wearhat'`: Hats that appear on avatar
  - `'furniture'`: Items for home decoration (stored in bag, placed via Decorate mode)
  - `'seed'`: Increases wildflower regrowth rate (state.seedBoost)
  - `'energy'`: Consumable that adds energy when used from bag
  - `'rest'`: Free item that increases happiness when "used" (sit/rest)
  - `'bike'`: Bicycle purchase (enables riding)
  - `'basket'`: Basket upgrade for bike (increases happiness while riding)
  - `'drill'`: Drill Shovel purchase (enables mining bedrock)
  - `'sell'`: Items to sell at Flower Shop (wildflowers, shells)
  - `'sellshroom'`: Mushrooms to sell at Flower Shop
  - `'sellstar'`: Starflowers to sell at Season Market
  - `'none'`: Decorative/no-use items (like tidy leaf)
- Optional properties for specific uses:
  - `happy`: Happiness gain when eaten/rested
  - `energy`: Energy gain when used
  - `wear`: Shirt color hex for clothing items
  - `quote`: Text for readable items (books)
  - `seasons`: Array of season indices [0,1,2,3] where item is available (empty = all seasons)

### Seasonal System
- Seasons array (lines 49-54):
  ```javascript
  const SEASONS = [
    { n: 'Spring', e: '🌸', note: 'wildflowers everywhere', sky: 0x87ceeb, fog: 0x87ceeb, sun: 0.9 },
    { n: 'Summer', e: '🌻', note: 'shells shine by the water', sky: 0x7ec8e3, fog: 0x7ec8e3, sun: 1.0 },
    { n: 'Autumn', e: '🍁', note: 'mushrooms & amber leaves', sky: 0x9fc3d8, fog: 0x9fc3d8, sun: 0.8 },
    { n: 'Winter', e: '❄️', note: 'snow petals & starflowers', sky: 0xb8c9d8, fog: 0xb8c9d8, sun: 0.65 }
  ];
  ```
- `state.season`: Integer 0-3 tracking current season
- `state.seasonT`: Timer counting seconds in current season (triggers change at >300s)
- Seasonal effects:
  * Background color and fog intensity
  * Sunlight intensity
  * Particle colors (seasonParticleColor())
  * Which shop items are available (via seasonalStock() and isShopOpen())
  * Which shops are open (via isShopOpen() and SHOP_SEASONS)
  * Which seasonal pop-ups appear (via currentPopup() and SEASON_POPUPS)

### Shop Availability Rules
- `SHOP_SEASONS` (line 55): Defines which seasons specific shops are open
  ```javascript
  const SHOP_SEASONS = { 
    flower: [0, 1],      // Flower Shop: Spring & Summer only
    bikes: [0, 1, 2],    // Bike Shop: Spring, Summer, Autumn (closed in Winter)
    teahouse: [0, 2, 3]  // Teahouse: Spring, Autumn, Winter (closed in Summer)
  };
  ```
- Function `isShopOpen(id, season)` checks if a shop is open in given season (defaults to state.season)
- Shops not in SHOP_SEASONS are open year-round

### Seasonal Pop-ups
- `SEASON_POPUPS` array (lines 56-61): Temporary shops that appear mid-valley
  ```javascript
  const SEASON_POPUPS = [
    { id: 'blossom', name: 'Blossom Tea Stall 🌸', cx: 0, cz: 12, wall: 'leaves', desc: 'spring-only pop-up. petal teas & blossom crowns.' },
    { id: 'ice', name: 'Sunny Ice Stand 🍧', cx: 0, cz: 12, wall: 'glass', desc: 'summer-only pop-up. cool treats & shell crafts.' },
    { id: 'harvest', name: 'Amber Harvest Hut 🍂', cx: 0, cz: 12, wall: 'wood', desc: 'autumn-only pop-up. harvest soups & lanterns.' },
    { id: 'snowgift', name: 'Snowglow Gift Cabin 🎁', cx: 0, cz: 12, wall: 'stone', desc: 'winter-only pop-up. star gifts & snow cocoa.' }
  ];
  ```
- Function `currentPopup(season)` returns the active pop-up for given season
- Only one pop-up active at a time, changes with season

### Shop Visual Identity
- `SHOP_DOT` object (line 206): Colors for shop indicators on minimap and UI
  ```javascript
  const SHOP_DOT = { 
    bakery: '#ffaa00', flower: '#4caf50', books: '#2196f3', clothes: '#7c4dff', 
    homegoods: '#9c6b30', cafe: '#00bcd4', bikes: '#2196f3', market: '#ff6b35', 
    teahouse: '#7c4dff', blossom: '#4caf50', ice: '#00bcd4', harvest: '#ff6b35', 
    snowgift: '#7c4dff', volt: '#00e5ff', tools: '#ff9800' 
  };
  ```

### Shopkeeper Dialogue (KEEPERS object)
Lines ~218-234:
```javascript
const KEEPERS = {
  bakery: { name: 'Mabel', line: (S) => `the milk bread just cooled, ${S.name}. I saved a soft piece for ${S.po}.` },
  // ... each shop has a keeper with name and line function
};
```
- Keeper line functions receive state object and return personalized dialogue
- Accessed via `KEEPERS[shopId].line(state)` when interacting with keeper button

## Shop Data Examples

### Bakery Items
- Bread: price 8, eat, happy 8
- Tea: price 10, eat, happy 12
- Cake: price 18, eat, happy 20, seasons [0,1] (spring/summer)
- Blossom Bun: price 14, eat, happy 16, seasons [0] (spring only)
- Berry Tart: price 16, eat, happy 18, seasons [1] (summer only)
- Pumpkin Loaf: price 15, eat, happy 18, seasons [2] (autumn only)
- Snow Cookie: price 13, eat, happy 16, seasons [3] (winter only)

### Flower Shop Items
- Bouquet: price 25, eat, happy 25, seasons [0,1]
- Tulip Pot: price 30, furniture, happy 6, seasons [0] (spring only)
- Seed Kit: price 20, seed, happy 5 (use: 'seed' sets state.seedBoost = 0.45)
- Sunflower Pot: price 32, furniture, happy 6, seasons [1] (summer only)

### Bookstore Items
- Picture Book: price 22, read, happy 15, quote: "...soft story..."
- Poetry: price 28, read, happy 20, quote: "...petals fall at their own pace..."
- Sticker Pack: price 12, eat, happy 10
- Spring Tales: price 24, read, happy 18, seasons [0], quote: "...first blossom opened..."
- Summer Comics: price 24, read, happy 18, seasons [1], quote: "...sun stayed up late..."
- Autumn Legends: price 24, read, happy 18, seasons [2], quote: "...amber leaf glowed..."
- Winter Lullaby: price 24, read, happy 18, seasons [3], quote: "...snow fell softly..."

### Electronics Store (Volt)
- Glow Bulb: price 30, furniture
- Radio: price 22, eat, happy 14 ("a happy tune · +14 happy")
- Clockwork Pal: price 45, furniture
- Star Night-Light: price 40, furniture
- Sunny Battery: price 18, energy, energy: 45 (adds 45 energy when used)

### Tool Shop (Gadget Tool Shed)
- Drill Shovel: price 150, drill (enables mining bedrock)
- Drill Oil: price 12, energy, energy: 25
- Headlamp: price 30, wearhat, wear: '#ffd23f'
- Spare Drill Bit: price 15, furniture

## Shop Mechanics

### Shop Building and Positioning
- Defined in `BASE_SHOPS` array (lines 64-76): 11 permanent shops with positions
- Position format: `{ id: 'bakery', name: 'Sunny Bakery 🍞', cx: -44, cz: -26, wall: 'brick', desc: '...' }`
- `cx`, `cz`: Grid coordinates for shop placement
- `wall`: Block ID for shop walls (brick, wood, leaves, glass)
- Shops are built as 7x5 footprint, 4 units high with 3x2 door
- Cottages (homes) are 9x7 footprint, 5 units high with peaked roof
- Buildings constructed via `buildShopVoxels(b)` function which:
  1. Creates walls (except door area)
  2. Adds roof (flat for shops, peaked for cottages)
  3. Sets shop door position
  4. Calls `makeShopBoard(b)` to create floating name sign

### Seasonal Shop Refresh
- Function: `refreshSeasonalShops()`
- Process:
  1. Clears existing shop voxels and signs
  2. For each shop in BASE_SHOPS:
     * Checks `isShopOpen(b.id, state.season)`
     * If open, adds to `townShops` array and calls `buildShopVoxels(def)`
  3. Adds current seasonal pop-up (if any) via `currentPopup(s)`
  4. Resets player's home position based on name hash (`lotForName(state.name)`)
  5. For each cottage lot in `HOME_LOTS`:
     * Determines if it's player's lot (by name hash) or neighbor
     * Builds appropriate cottage (player gets brick walls, others wood)
     * Calls `buildCottageExtras(home, isOwn)` for door mat, lamp posts, beacon
  6. Calls `buildHomeInterior()` for the special player home interior
  7. Calls `refreshHomeNames()` to update neighbor cottage signs with player names

### Shop Interaction
- Triggered by: Pressing E key when near shop door (or clicking shop button in HUD)
- Function: `interact()` → finds interaction target → if `t.kind === 'shop'` → `openShop(t.ref)`
- Process in `openShop(b)`:
  1. Sets `curShop = b` (global for current shop)
  2. Exits pointer lock
  3. Sets modal title: `$('shopName').textContent = b.name;`
  4. Sets description: `${b.desc}${seasonalShopsNote()} • you have ${state.coins} petals 🪷`
  5. Shows sell row if shop is flower or market (for selling picked items)
  6. Builds shop grid:
     * Gets seasonal stock via `seasonalStock(b.id)` (filters SHOPS[b.id] by current season)
     * If no stock: shows "resting this season" message
     * For each item:
       - Creates shop-item div with dot color, name, description+season tag, price
       - Creates button: "buy" (or "rest a while"/"enjoy"/etc. based on item.use)
       - Button onclick: `buyItem(it, b)`
  7. Shows shop modal
  8. Plays chime sound

### Purchasing Items
- Function: `buyItem(it, b)` where `it` is item object, `b` is shop object
- Process:
  1. Checks if player has enough petals (`state.coins < it.price`)
  2. Handles special item uses:
     * `'rest'`: Increases happiness, plays happy sound, spawns hearts
     * `'bike'`: 
       - Checks bike shop open
       - Deducts price, sets state.bikeOwned = true, state.riding = true
       - Updates HUD, spawns hearts, saves
     * `'basket'`: 
       - Checks if basket not already owned
       - Deducts price, sets state.hasBasket = true
       - Increases happiness, saves
     * `'drill'`: 
       - Checks if drill not already owned
       - Deducts price, sets state.drillOwned = true
       - Shows dialog about bedrock mining benefits, saves
     * `'energy'`: 
       - Deducts price, adds item to bag via addItem(it.id, 1)
       - Increases energy by (it.energy || 40), saves
     * `'seed'`: 
       - Sets state.seedBoost = 0.45
       - Shows toast about faster wildflower regrowth
     * `'furniture'`/`'wear'`/`'wearhat'`/`'read'`:
       - Deducts price, adds item to bag via addItem(it.id, 1)
       - Shows appropriate toast (e.g., "is in your bag! Use Decorate near home to place it.")
     * Default (`'eat'`): 
       - Deducts price, adds item to bag
       - Increases happiness by (it.happy || 2)
       - Plays buy sound, spawns hearts, saves
  3. For all successful purchases:
     * Updates shop description with current petal count
     * Plays appropriate sound effect (buy/happy/chime)
     * Spawns heart particles
     * Calls autoSave()

### Selling Items
- Functions: `sellKind(kind, price, emptyMsg, okMsg)` and bag item usage
- Sell flowers/shells/etc. via shop buttons:
  * Flowers: `sellKind('wildflower', 6, 'No wildflowers yet...', 'Thank you!')`
  * Shells: `sellKind('shell', 9, 'No shells yet...', 'Lovely!')`
  * Mushrooms: `sellKind('mushroom', 12, 'No mushrooms yet...', 'Thank you!')`
  * Starflowers: `sellKind('starflower', 14, 'No starflowers yet...', 'Sparkling!')`
- Process in `sellKind()`:
  1. Checks if player has any of item type in bag (`state.bag[kind] || 0`)
  2. If none: plays error sound, shows emptyMsg toast
  3. If has items:
     * Calculates total: n * price
     * Adds to state.coins
     * Sets bag count to zero for that type
     * Increases happiness by 4
     * Plays buy sound
     * Shows okMsg toast with total earned
     * Updates shop description if relevant
     * Calls autoSave()

### Bag System
- `state.bag`: Object tracking quantities of collected/purchased items
- Functions:
  * `bagTotal()`: Returns sum of all values in state.bag
  * `addItem(id, n = 1)`: Increments state.bag[id] by n
  * `itemInfo(id)`: Looks up item definition across all shops (returns object with id,e,n,p,price,use)
  * `dotColor(id)`: Returns color for item's dot indicator (based on which shop sells it)
- Bag UI:
  * Function: `openBag()`
  * Shows `$('bag-modal')`
  * Sets `$('bagSub').textContent` with item count or "Empty for now…"
  * Populates `$('bagGrid')` with shop-items for each item type in bag
  * Each item shows: dot icon, name ×count, description, action button
  * Button text varies by item.use:
    * 'eat' → "enjoy"
    * 'read' → "read"
    * 'wear' → "wear"
    * 'wearhat' → "wear hat"
    * 'furniture' → "place at home"
    * 'energy' → "zing"
    * 'sell'/'sellshroom' → "sell at Flower Shop"
    * 'sellstar' → "sell at Season Market"
    * 'seed' → "—" (auto-used when picked up? Actually seed items give boost when used from bag)
    * 'rest' → (handled elsewhere?)
  * `useItem(id)` function handles bag item usage:
    * Routes to appropriate action based on itemInfo(id).use:
      * 'eat': Increases happiness, plays happy sound, spawns hearts
      * 'read': Shows dialog with item.quote, increases happiness
      * 'wear': Changes state.shirt, updates avatar
      * 'wearhat': Changes state.hat, updates avatar
      * 'furniture': Sets state.decorate = true, shows toast about decorating
      * 'sell'/'sellshroom': Toasts about going to Flower Shop (doesn't actually sell - must go to shop)
      * 'sellstar': Toasts about going to Season Market
      * 'seed': Sets state.seedBoost = 0.45
      * 'energy': Increases energy, plays happy sound, spawns hearts
      * 'rest': Increases happiness
      * 'bike': Calls toggleBike()
      * 'basket': Sets state.hasBasket = true
    * After use: decrements bag count, updates HUD, triggers autosave, re-opens bag if still open

## Seasonal and Temporal Mechanics

### Season Progression
- Function: `setSeason(i, quiet)`
- Process:
  1. Stores previous season and pop-up for change detection
  2. Sets `state.season = ((i % 4) + 4) % 4` (ensures 0-3)
  3. Resets `state.seasonT = 0`
  4. Calls `refreshSeasonalShops()` to rebuild town
  5. Calls `scatterPickups()` to respawn flowers/shells/etc.
  6. Calls `applySeasonSky()` to update background/fog/sun
  7. If HT (Hide & Time) active, calls `htApplySky()`
  8. Updates HUD
  9. If not quiet:
     * Plays happy sound effect
     * Shows toast describing season change:
       - Current season emoji and name + note
       - Info about pop-up changes if applicable
       - Lists shops that closed/opened this season
       - Notes stock is new everywhere
- Season change triggers: 
  * Automatic every 5 minutes (when state.seasonT > 300 in updateCozy)
  * Manual by clicking season pill in HUD
  * Via Hide & Time game (traveling to different eras affects sky but not actual season state)

### Seasonal Stock and Availability
- Function: `seasonalStock(keyM)`
  * Returns items from SHOPS[keyM] that are available in current state.season
  * Filters: items with no seasons property OR item.seasons includes current season
- Function: `isShopOpen(id, season)` 
  * Returns true if:
    * id not in SHOP_SEASONS (always open)
    * OR season is in SHOP_SEASONS[id] array
- Function: `currentPopup(season)`
  * Returns SEASON_POPUPS[season] (0-3 mapping to spring-summer-autumn-winter popups)
- Function: `seasonalShopsNote()`
  * Returns string describing current seasonal state:
    * " • {SEASONS[s].n} exclusive stock"
    * Plus " • new: {pop.name}" if pop-up active
    * Plus " • resting: {closed shops list}" if any shops closed

### Visual and Audio Seasonal Effects
- Function: `applySeasonSky()`
  * Sets Three.js scene.background to SEASONS[state.season].sky
  * Sets scene.fog to SEASONS[state.season].fog
  * Sets sun.intensity to SEASONS[state.season].sun
  * Updates cozyParticles material color via seasonParticleColor()
- Function: `seasonParticleColor()`
  * Returns [0x7fbf5f, 0xfff2a0, 0xff9a3c, 0xffffff][state.season || 0]
    (Spring green, Summer yellow, Autumn orange, Winter white)

## Shopkeeper and NPC Interaction
- Shopkeepers accessed via KEEPER button in shop modal
- Function: `$('keeper-btn').onclick = () => { if (!curShop) return; const k = KEEPERS[curShop.id]; ... showDialog('', k.name, ln); }`
- NPC friends (6 predefined) interacted with via E key when near them
  * Function: `talkNPC(n)` shows dialog with NPC's personalized line
  * Increases happiness by 2, spawns hearts
- Bot friends (3) work similarly via nearestFriend() system

## Economy Balance and Flow

### Petal Acquisition Methods
1. **Picking Natural Items** (E key when near):
   - Wildflower: +1 to bag (sell for 6 petals)
   - Shell: +1 to bag (sell for 9 petals)
   - Mushroom: +1 to bag (sell for 12 petals)
   - Starflower: +1 to bag (sell for 14 petals)
   - Tidy Leaf (litter): +4 petals directly +3 happiness (no bag storage)
2. **Selling Collected Items** at appropriate shops:
   - Wildflowers/Shells/Mushrooms → Flower Shop
   - Starflowers → Season Market
3. **Hide & Time Game**: Finding friends rewards +20 petals each
4. **Quiz Answers**: Correct answers reward +10 petals
5. **Bedrock Mining**: Not directly, but enables resource gathering in Mining Fields

### Petal Expenditure Methods
1. **Shop Purchases**: Wide variety of goods and upgrades
2. **No direct building/block costs** (blocks require energy, not petals)
3. **Energy Items**: Some shop items convert petals to energy
4. **Furniture**: Decorative items for home
5. **Clothing**: Avatar customization
6. **Upgrades**: Bike, basket, drill shovel, headlamp

### Notable Economic Loops
1. **Flower Cycle**: 
   - Pick wildflowers → sell at Flower Shop → buy Seed Kit → wildflowers regrow faster
2. **Shell Collection**: 
   - Collect shells near water → sell at Flower Shop/Market → buy items
3. **Mushroom Hunting**: 
   - Find mushrooms in woods (especially autumn) → sell at Flower Shop
4. **Starflower Collection**: 
   - Find glowing starflowers near lake (especially winter) → sell at Season Market
5. **Park Cleanup**: 
   - Tidy litter → +4 petals +3 happiness → encourages exploration

### Price Points and Value
- **Low Cost (1-6 petals)**: Basic food items, starter goods
- **Medium Cost (8-18 petals)**: Main meals, clothing, basic furniture
- **High Cost (20-45 petals)**: Premium furniture, seasonal exclusives, upgrades
- **Very High Cost (120-150 petals)**: Major upgrades (Bike 120, Drill Shovel 150)
- **Special Items**: 
  - Radio: 22 petals for +14 happiness (good value)
  - Batteries: 18 petals for 45 energy (excellent energy conversion)
  - Seed Kit: 20 petals for permanent wildflower regrowth boost

## Integration with Other Systems

### Save/Load
- Economy state saved in `load()`/`save()`:
  * `state.coins` (petals)
  * `state.bag` (collected/purchased items)
  * `state.seedBoost`
  * `state.bikeOwned`, `state.riding`, `state.hasBasket`
  * `state.drillOwned`
  * `state.happy` (happiness affected by purchases)
  * Season progress (`state.season`, `state.seasonT`)
  * Shop states indirectly via season and saved placedFurn (furniture in bag/placed)

### Quiz System
- Correct answers reward: +10 petals (coins) among other rewards
- Provides steady petal income for active learners

### Building/Voxel System
- No direct petal cost for blocks
- Indirect link: Energy required to place blocks can be replenished by purchasing energy items from shops
- Furniture system uses bag items for home decoration

### Avatar/Home System
- Clothing items change avatar appearance via `state.shirt`
- Furniture items placed via Decorate mode (E key when furniture in bag)
- Home decoration increases happiness

### Social Systems
- Shopkeepers provide personalized dialogue based on player state (name, pronouns)
- Seasonal changes affect what items NPCs might reference in dialogue
- Hide & Time game uses seasonal visuals but not actual season state for economy

### Special Modes
- **Mining Fields**: 
  - No shops, pure resource gathering
  - Drill Shovel enables bedrock mining for bonus energy/knowledge
  - Indirectly supports economy by allowing more efficient resource collection
- **Hide & Time**: 
  - Seasonal visuals change based on HT.era (past/present/future)
  - Finding friends rewards petals
  - Does not affect actual shop seasonality
- **Computer/Autofix**: 
  - No direct economic interaction
  - Located in home interior for flavor

## Performance and Optimization
- Shop data is static JSON-like objects in main.js
- Seasonal filtering occurs on shop open (not per-frame)
- Shop voxel building happens only on season change or new world
- Shop UI rebuilt each time shop is opened (relatively infrequent)
- Minimap shop dots updated in drawMinimap() (called ~4x/sec)
- No expensive operations in main game loop related to shops

## Educational and Design Notes
- Teaches basic economics: earning vs spending, supply and demand (seasonal scarcity)
- Encourages exploration: different items found in different areas/seasons
- Teaches delayed gratification: saving for big purchases like Bike or Drill Shovel
- Seasonal system teaches natural cycles and adaptation
- Shopkeeper dialogue adds personality and context to economic transactions
- Bag system teaches inventory management
- Sell-only-at-specific-shops encourages learning economic specializatio

## Potential Enhancements (Noted in Code)
- Dynamic pricing based on supply/demand (not implemented)
- Player-run shops (not implemented)
- Shop upgrades/expansions (not implemented)
- Loyalty/reputation systems (not implemented)
- More complex crafting recipes (not implemented)
- NPC quests tied to shop interactions (not implemented)