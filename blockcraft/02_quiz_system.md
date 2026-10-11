# BlockCraft Edu 3D - Quiz System Specification

## Overview
The Quiz System is the core educational component of BlockCraft Edu 3D. Players answer questions to earn resources that enable building and progression. Correct answers provide substantial rewards, while incorrect answers still offer small incentives to encourage continued learning.

## Implementation Location
- Primary: `main.js` (lines ~1157-1723)
- Data Source: `quiz-data.js` (loaded via `<script src="quiz-data.js"></script>`)
- UI Elements: Quiz modal (`#quiz-modal`) and its children

## Quiz Data Structure
The quiz data is imported from `quiz-data.js` and structured as:
```javascript
window.QUIZ = {
  math: [ /* array of question objects */ ],
  science: [ /* array of question objects */ ],
  english: [ /* array of question objects */ ],
  music: [ /* array of question objects */ ],
  '3d-shapes': [ /* array of question objects */ ]
};

window.SUBJECT_META = {
  math: { icon: '➕', name: 'Math' },
  science: { icon: '🔬', name: 'Science' },
  english: { icon: '📖', name: 'English' },
  music: { icon: '🎵', name: 'Music' },
  '3d-shapes': { icon: '🔷', name: '3D Shapes' }
};
```

Each question object has:
- `q`: The question text string
- `opts`: Array of 4 answer option strings
- `a`: Index of correct answer (0-3)
- `y`: Explanation string shown after answering

## Quiz Flow

### Opening the Quiz
- Triggered by: Pressing Q key or clicking "Earn Blocks" button (id=`quiz-btn`)
- Function: `openQuiz()`
- Process:
  1. Verify game has started (`state.started`)
  2. Exit pointer lock (important for mouse aim)
  3. Show quiz modal (`$('#quiz-modal').classList.remove('hidden')`)
  4. Render subject tabs (`renderSubjects()`)
  5. Show first question (`showQuestion()`)

### Subject Selection
- Tabs rendered in `#subject-tabs`
- Active tab highlighted with `.active` class
- Clicking tab changes `state.quizSubject` and resets `state.quizIndex = 0`
- Subjects: math, science, english, music, 3d-shapes

### Question Presentation
- Function: `showQuestion()`
- Process:
  1. Get current subject's question list: `window.QUIZ[state.quizSubject]`
  2. Get question using modulo indexing (allows infinite cycling): `list[state.quizIndex % list.length]`
  3. Display question text in `#quiz-q`
  4. Clear previous feedback
  5. Populate `#quiz-opts` with answer buttons
  6. Hide "Next question" button initially
  7. Enable all answer buttons (disabled during answer processing)

### Answer Processing
- Function: `answer(i, q)` where `i` is selected option index, `q` is question object
- Process:
  1. Disable all answer buttons immediately
  2. Check if selected index matches correct answer (`i === q.a`)
  3. **Correct Answer Path**:
     - Mark button as `.correct`
     - Show green feedback: "✅ Correct! +8 🧱 + ⚡25 + ⭐10 — {q.why}"
     - Apply rewards:
       * +8 blocks distributed across lowest-stock block types
       * +25 energy (capped at MAX_ENERGY=200)
       * +10 knowledge points
       * +10 petals (coins)
       * +3 happiness
     - Play fanfare audio
     - Show toast: "+8 🧱 + ⚡25 + ⭐10 + 🪷10! Keep building!"
  4. **Incorrect Answer Path**:
     - Mark selected button as `.wrong`, correct button as `.correct`
     - Show red feedback: "❌ Not quite. {q.why} (+⚡5 for trying)"
     * Apply consolation: +5 energy (capped at MAX_ENERGY)
     - Play error blip audio
  5. Common to both paths:
     - Enable "Next question" button (`$('#quiz-next').classList.remove('hidden')`)
     - Update HUD and hotbar
     - Trigger autosave
  6. Advance to next question on "Next question" click:
     - Increment `state.quizIndex`
     - Call `showQuestion()`

### Reward Distribution Algorithm
For the +8 block reward on correct answers:
1. Sort block types by current inventory (ascending): `[...BLOCKS].sort((a, b) => (state.inventory[a.id] || 0) - (state.inventory[b.id] || 0))`
2. Distribute 8 blocks in round-robin fashion to the sorted list
3. This encourages balancing inventory across block types

### UI Components
- **Quiz Modal**: `#quiz-modal` (overlay hidden by default)
  - **Header**: `#quiz-modal .quiz-head` with title and close button
  - **Subject Tabs**: `#subject-tabs` (dynamically generated)
  - **Question Display**: `#quiz-q` (text content)
  - **Answer Options**: `#quiz-opts` (contains 4 buttons)
  - **Feedback Area**: `#quiz-feedback` (shows correctness with `.good`/`.bad` classes)
  - **Next Button**: `#quiz-next` (hidden initially, shows after answer)
  - **Footer**: Shows reward information ("Correct = +8 🧱 + ⚡25 + ⭐10 · Wrong = +⚡5 try again")

### Styling & Feedback
- Correct answer feedback: Green text (`.good` class)
- Incorrect answer feedback: Red text (`.bad` class)
- Answer buttons get `.correct` or `.wrong` classes added
- "Next question" button appears after answering
- Question feedback explains why answer is correct/incorrect (`q.why`)
- Toast notification summarizes rewards earned
- Audio feedback: Fanfare for correct, blip for incorrect

### Edge Cases & Details
- Quiz cannot be opened if game hasn't started (`if (!state.started) return;` in `openQuiz()`)
- Pointer lock is explicitly released when opening quiz (`document.exitPointerLock?.()`)
- Quiz closes on:
  - Clicking close button (✕)
  - Pressing Escape key (handled in global keydown listener)
- Quiz index wraps using modulo allowing infinite play
- Subject persistence: Selected subject remains until changed
- Question order: Sequential within subject, then repeats
- No score tracking beyond cumulative resources earned
- Feedback auto-hides when next question is shown

### Integration with Game Systems
- Resources added directly to `state` object:
  - Blocks: `state.inventory[blockId]++`
  - Energy: `state.energy = Math.min(MAX_ENERGY, state.energy + amount)`
  - Knowledge: `state.knowledge += amount`
  - Petals (coins): `state.coins += amount`
  - Happiness: `state.happy = Math.min(100, state.happy + amount)`
- Triggers HUD update: `renderHUD(); renderHotbar();`
- Triggers autosave: `autoSave();`
- Can trigger special block lessons when placing Cube/Pyramid blocks

## Educational Value
- Immediate feedback reinforces learning
- Variety of subjects exposes players to different knowledge areas
- Reward system motivates continued engagement with educational content
- Explanation text (`q.why`) teaches reasoning behind correct answers
- Progressive difficulty through question variety rather than explicit levels
- 3D Shapes subject specifically teaches geometry concepts relevant to building

## Potential Enhancements (Noted in Code)
- Difficulty levels (not implemented)
- Streak bonuses (not implemented)
- Subject mastery tracking (beyond knowledge points)
- Hint systems (not implemented)
- Time-based bonuses (not implemented)
- Multimedia questions (images/audio - not in current implementation)

## Data Source Notes
The actual quiz questions reside in `/home/ubuntu/lakshanworkspace/blockcraft/quiz-data.js` which would need to be examined for the specific question content, but the system is designed to accommodate any questions following the {q, opts, a, y} format.