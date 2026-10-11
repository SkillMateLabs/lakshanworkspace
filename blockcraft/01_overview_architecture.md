# BlockCraft Edu 3D - Overview and Architecture

## Project Overview
BlockCraft Edu 3D is a Minecraft-style 3D builder game that combines education with creative building. Players answer quiz questions to earn resources (blocks, energy, knowledge, petals) which they use to build and decorate in a cozy valley town that changes with seasons. The game runs entirely in the browser with automatic save functionality.

## Core Architecture

### Technology Stack
- **Rendering**: Three.js (via `three.module.js`)
- **Persistence**: LocalStorage
- **Multiplayer**: WebSocket (when hosted)
- **Audio**: Web Audio API
- **Input**: Keyboard, mouse, touch, Pointer Lock API
- **Game Loop**: requestAnimationFrame

### File Structure
```
/lakshanworkspace/
├── index.html                  # Main entry point and UI
├── blockcraft/
│   ├── index.html              # Actual game HTML
│   ├── main.js                 # Core game logic (~176KB)
│   ├── quiz-data.js            # Educational questions
│   ├── styles.css              # Styling
│   └── three.module.js         # Three.js library
└── README.md                   # Basic description
```

### Key Systems Overview
1. **Quiz System** - Educational questions with rewards
2. **Voxel Engine** - Custom block-based world with building/mining
3. **Town Systems** - Seasonal shops, economy, NPCs
4. **Avatar System** - Customizable player character
5. **Home System** - Personal cottage with decoration
6. **Social Systems** - NPC friends, bots, optional multiplayer
7. **Special Modes** - Hide & Time game, Mining Fields
8. **Autofix Service** - In-game bug/feature reporting
9. **Save/Load System** - Persistent world state

### Game Loop Architecture
```
Main Loop (requestAnimationFrame)
├── Input Processing
├── Player Physics & Movement (sub-stepped for stability)
├── Cozy Systems Update (season, wanderers, effects)
├── Minimap Update (throttled)
├── Position Audio & Avatars
├── Rendering (Three.js scene)
└── Autosave (throttled to 4s minimum)
```

### Performance Optimizations
- Mobile detection reduces graphical fidelity
- Ground generation limited to player vicinity (~30000 voxel save cap)
- Voxel unloading for distant terrain (UNLOAD_R = 60)
- Batched processing for NPC/wanderer updates
- Limited voxel saves (only meaningful changes: y>0 or near player)
- Throttled autosaving (every 4 seconds minimum)
- Compass-based minimap instead of full world render
- Pointer lock only acquired on desktop first click

### Save/Load Mechanics
- **Saved**: Player state (position, inventory, stats), world modifications (placed blocks, dug ground), avatar customization, season progress, shop states
- **Not Saved**: Flat terrain (regenerates), distant voxel data
- **Save Triggers**: Manual (save button/B key), automatic (every 15s), autosave (throttled to 4s)
- **Storage Key**: `blockcraft-edu-save-v1`
- **Size Protection**: Voxel array capped at 40000 entries for localStorage safety

### Security & Privacy
- All data stored locally on device (localStorage)
- No account system required
- Multiplayer connections only to user-hosted servers (ws:// or wss:// current host)
- Bug reports stay on device unless manually shared via copy/download
- Geolocation access is optional and only for flavor text in Hide & Time
- No personal data transmitted without explicit user action

## Development Notes
- Built as a single-page application with modular JavaScript
- Heavy use of closures and IIFE for encapsulation
- Extensive use of helper functions for DOM manipulation ($ alias)
- State centralized in `state` object with sub-objects for cozy data
- Event listeners attached directly to elements and document
- Three.js scene managed through direct manipulation
- LocalStorage operations wrapped in try/catch for safety