# BlockCraft Edu 3D - Voxel and Building System Specification

## Overview
The Voxel and Building System is the core gameplay mechanic that allows players to mine, place, and manipulate blocks in a 3D world. It combines resource management with creative building, where blocks serve as both building materials and resources earned through educational activities.

## Implementation Location
- Primary: `main.js` (lines ~8-428 for core voxel functions, ~1022-1074 for break/place logic)
- Supporting: Various helper functions throughout main.js
- Block definitions: Lines ~8-20 in main.js

## Core Data Structures

### Block Definitions (BLOCKS array)
Defined in lines 8-20:
```javascript
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
    fact: '🔷 SQUARE PYRAMID: 5 faces (4 triangles + 1 square base) · 8 edges · 5 vertices. The triangles meet at the apex!' }
];
```

Key properties:
- `id`: Unique identifier used in state and voxel storage
- `name`: Display name
- `color`: Three.js color value (hex)
- `count`: Starting inventory amount
- `transparent`: Boolean for glass-like blocks
- `lesson`: Boolean indicating educational block (shows fact when placed)
- `pyramid`: Boolean indicating pyramid geometry instead of cube
- `fact`: Educational text shown when lesson block is placed

### Voxel Storage
- `voxels`: Map storing `"x,y,z" -> { id, mesh }` for all placed blocks
- Helper functions:
  - `key(x, y, z)`: Returns `${x},${y},${z}` string
  - `voxelAt(x, y, z)`: Gets voxel at floored coordinates
  - `addVoxel(x, y, z, id, save)`: Adds voxel, returns success boolean
  - `removeVoxel(x, y, z)`: Removes voxel, returns block ID or null
  - `clearWorld()`: Removes all voxels from scene and clears map

### World Generation Constants
- `WORLD_R = 30`: Initial world radius (60x60 area)
- `GROUND_R = 24`: Radius around player where ground is always maintained
- `UNLOAD_R = 60`: Radius beyond which distant ground is unloaded
- `BEDROCK_Y = -5`: Y-level of unbreakable bedrock layer (requires Drill Shovel)
- `PLACING_COST = 4`: Energy cost to place one block
- `BREAK_GAIN = 1`: Energy returned when breaking a block
- `MAX_ENERGY = 200`: Maximum player energy

## Core Functions

### Voxel Manipulation
**addVoxel(x, y, z, id, save = true)**
1. Floors coordinates to integer voxel positions
2. Checks if voxel already exists at position (returns false if so)
3. Finds block definition by ID
4. Creates appropriate geometry (BoxGeometry for most, ConeGeometry for pyramids)
5. Creates MeshLambertMaterial with block color
6. For lesson blocks (Cube/Pyramid), adds wireframe edges using EdgesGeometry
7. Positions mesh at voxel center (x+0.5, y+0.5, z+0.5)
8. Adds mesh to Three.js scene
9. Stores in `voxels` map with key
10. If save=true, adds to shopKeys set (used for protection checking)
11. Returns true if voxel added

**removeVoxel(x, y, z)**
1. Floors coordinates
2. Looks up voxel in map
3. If found:
   - Removes mesh from scene
   - Deletes entry from map
   - Returns block ID
4. Returns null if no voxel found

**clearWorld()**
1. Iterates through all voxels, removes each mesh from scene
2. Clears the voxels map
3. Calls clearShopBoards() to remove shop name signs
4. Returns true/false based on whether any voxels existed

### World Generation
**earthLayerAt(y)**
Determines what block type should exist at a given Y-level for terrain generation:
- y >= -2: 'dirt' (top layers)
- y === BEDROCK_Y (-5): 'brick' (red drill-level bedrock)
- Otherwise: 'stone' (middle layers)

**genWorld(freshTrees = true)**
1. Calls clearWorld() to remove existing voxels
2. Resets tracking sets: shopKeys, minedGround, treeVox, townShops array
3. Generates initial world within WORLD_R radius (-30 to +30 in X/Z):
   - For each X,Z position:
     * Generates vertical column from y=-1 down to BEDROCK_Y-1 using earthLayerAt(y)
     * Places 'glass' at surface if in water (inWater2 check)
     * Places 'grass' at surface if not in water
4. If freshTrees=true, adds ~14 random trees outside spawn area
5. Calls refreshSeasonalShops() to build shops and homes
6. Calls buildBenchesLookout() for static scenery
7. Clears trees from immediate spawn area (to prevent trapping player)
8. Ensures ground around spawn point (0.5, -2)
9. Calls scatterPickups() for initial flowers/shells/etc.
10. Calls spawnNPCs() and spawnBots() for town inhabitants
11. Calls buildFurnitureMeshes() for any saved furniture

**ensureGroundAround(px, pz)**
Maintains terrain around player as they move:
1. Calculates chunk coordinates from player position
2. For each position within GROUND_R radius:
   * Skips if distance squared > (GROUND_R+4)^2 (optimization for circular check)
   * For each Y from -1 down to BEDROCK_Y-1:
     + If position not mined by player and no voxel exists, place earthLayerAt(y)
   * At Y=0 (surface):
     + If position not mined by player and no voxel exists, place groundTopAt(x,z)
     + Maybe plant tree (deterministic sparse distribution)
3. Called regularly during player movement to keep ground loaded

**unloadFarGround()**
Removes distant terrain to maintain performance:
1. Runs periodically (every other ground update tick)
2. Iterates through voxels, removing those beyond UNLOAD_R radius from player
3. Preserves:
   * Shop-protected voxels (in shopKeys set)
   * Tree voxels (marked in treeVox set - these regrow when player returns)
   * Player-placed blocks (y > 0)
   * Recently mined ground (tracked in minedGround set)
4. Processes in batches (max 8000 voxels per tick) to prevent frame drops

### Mining System
**Bedrock Mechanics**
- Bedrock layer at Y = BEDROCK_Y (-5) appears as brick-colored blocks
- Cannot be broken by hand (protected state)
- Requires Drill Shovel (state.drillOwned = true) to mine
- When mined with Drill Shovel:
  * Returns 14 bonus energy (added to player)
  * Returns 5 bonus knowledge points
  * Plays special drill sound/feedback

**toggleMine() (M key)**
- Toggles between town and Mining Fields
- Mining Fields location: MINE_SPOT = { x: 500, z: 500 }
- When entering Mining Fields:
  * Saves current position to mineReturn
  * Ensures ground around Mining Fields spawn point
  * Places player at (500.5, 5, 500.5)
  * Sets mineActive = true
  * Updates mine button text to "🏠 Back to town"
- When leaving Mining Fields:
  * Restores player to mineReturn position (or doorstep if too close to Mines)
  * Ensures ground around restored position
  * Sets mineActive = false
  * Updates mine button text to "⛏️ Mine"

### Break/Place Logic
**doBreak()**
1. Validates: game started, no quiz/modal open, not in protected area without permission
2. Checks mining permissions:
   * Not in town without ⛏️ Mine active (toast: "No mining in town...")
   * Not breaking bedrock without Drill Shovel
   * Not breaking protected shop/home voxels (shopKeys check)
   * Not breaking solid core below bedrock
3. If all checks pass:
   * Removes voxel at target position
   * If breaking ground (y <= 0), adds position to minedGround set
   * Adds broken block to player inventory
   * Adds 1 energy (BREAK_GAIN)
   * If breaking bedrock WITH Drill Shovel:
     * Adds 14 energy bonus
     * Adds 5 knowledge bonus
     * Shows special toast
   * Plays break sound effect
   * Updates HUD, hotbar, triggers autosave

**doPlace()**
1. Validates: game started, no quiz/modal open
2. Checks:
   * Player has at least 1 of selected block in inventory
   * Player has at least PLACE_COST (4) energy
   * Target position is valid (not inside player)
   * Not trying to place inside protected area without being in decorate mode or inside home
3. If all checks pass:
   * Calculates placement position using face normal from raycast hit
   * Adds voxel at calculated position with selected block ID
   * Decrements block inventory
   * Reduces energy by PLACE_COST
   * Increases placed counter
   * If block is lesson type (Cube/Pyramid):
     * Shows info card with educational fact
   * Plays place sound effect
   * Updates HUD, hotbar, triggers autosave
   * If decorate mode enabled and no more furniture in bag, disables decorate mode

### Highlight System
**targetVoxel()**
1. Sets up raycaster from player's eye position along view direction
2. Limits search to nearby cubes (within 7 blocks X/Z, 4 blocks Y of eye position)
3. Returns hit point, normal vector, and intersected object or null if nothing hit

**updateHighlight(dt)**
1. Called each frame with time delta
2. Updates at ~12Hz intervals (0.08s threshold)
3. Hides highlight if:
   * Game not started
   * Quiz, help, or any modal open
4. Otherwise:
   * Calls targetVoxel() to get target
   * If target found:
     * Shows highlight outline
     * Positions outline at target object's position
   * Else hides highlight

### Performance Considerations
1. **Voxel Capping**: 
   - Save system caps voxel array at 40000 entries for localStorage safety
   - Only saves voxels where y > 0 (player-built structures) or within 65 units of player
   - Flat terrain regenerates via earthLayerAt() and groundTopAt()

2. **Ground Management**:
   - ensureGroundAround() maintains terrain in GROUND_R radius (~24 units)
   - unloadFarGround() removes terrain beyond UNLOAD_R radius (~60 units)
   - Tree voxels marked in treeVox set regenerate when player returns to area
   - minedGround tracks player-dug holes to prevent terrain from refilling them

3. **Rendering Optimization**:
   - Each voxel is individual Three.js Mesh (could be optimized with InstancedMesh)
   - Lesson blocks add EdgesGeometry LineSegments for wireframe display
   - Materials reused via materials[id] lookup table

4. **Collision Detection**:
   - AABB vs voxel grid in collides() function
   - Checks all voxels in player's bounding box expanded by P_RADIUS
   - Used for movement blocking and unstuck detection

### Integration with Other Systems
- **Inventory System**: state.inventory tracks block counts
- **HUD System**: renderHUD() updates energy/placed counters; renderHotbar() updates slot counts
- **Save System**: Voxel positions saved via save()/load() functions
- **Protection System**: shopKeys set tracks protected positions (shops/homes)
- **Quiz System**: Correct answers reward blocks via inventory modification
- **Shop System**: Purchased blocks added to inventory
- **Hide & Time**: Uses same voxel system for world modification
- **Mining Fields**: Separate world toggle but uses same voxel functions

### Educational Aspects (Lesson Blocks)
- Cube and Pyramid blocks have lesson: true flag
- When placed, showInfoCard() displays:
  * Formatted title (🔷 Cube or 🔷 Square Pyramid)
  * Educational fact from block.fact property
  * Auto-hides after 8 seconds (configurable in showInfoCard)
- Facts teach geometric properties:
  * Cube: 6 faces, 12 edges, 8 vertices
  * Pyramid: 5 faces, 8 edges, 5 vertices

### Mobile/Touch Support
- Break: Left tap/click
- Place: Right tap/click (or contextmenu prevented and handled as right-click)
- Touch joystick for movement (separate system)
- Action buttons adapt to context (E for interact, etc.)

### Special Cases and Limits
1. **Maximum Build Height**: Not explicitly limited, but practical limits from:
   - Energy requirements (4 energy per block)
   - Save system caps voxel count
   - Performance degradation with excessive voxels

2. **Minimum Build Height**: Limited by BEDROCK_Y (-5) and solid core below

3. **Protected Areas**:
   - Shop voxels: Cannot break/place without entering shop (E interaction)
   - Home voxels: Cannot break/place without being inside (E to enter/exit)
   - Detected via shopKeys.has(key(x,y,z)) check

4. **Inventory Limits**: 
   - Starting counts defined in BLOCKS array
   - No explicit maximum, but practical limits from gameplay balance
   - Quiz rewards and shop purchases are the main sources

5. **World Bounds**: 
   - Theoretically infinite due to procedural generation
   - Practical limits from save system (only saves meaningful changes)
   - Player can walk indefinitely in any direction

### Files and Resources
- Core implementation: `/home/ubuntu/lakshanworkspace/blockcraft/main.js` (voxel functions)
- Block definitions: Same file, lines 8-20
- No separate voxel data files - all procedural
- Three.js library: `three.module.js` in same directory