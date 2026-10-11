// Question bank: the "difference" of this game — energy comes from learning, not grinding.
// Subjects: math, science, english, music, shapes
window.QUIZ = {
  math: [
    { q: "What is 7 × 8?", opts: ["54", "56", "63", "48"], a: 1, why: "7 × 8 = 56. Think (7×10) − (7×2) = 70 − 14." },
    { q: "What is 1/2 + 1/4?", opts: ["3/4", "1/4", "2/6", "1"], a: 0, why: "1/2 = 2/4, so 2/4 + 1/4 = 3/4." },
    { q: "What is 15 − 7 + 3?", opts: ["11", "5", "10", "9"], a: 0, why: "15 − 7 = 8, + 3 = 11." },
    { q: "A square has sides of 5. Its area is…", opts: ["10", "20", "25", "15"], a: 2, why: "Area of square = side × side = 5 × 5 = 25." },
    { q: "What is 100 ÷ 4?", opts: ["20", "24", "25", "40"], a: 2, why: "4 × 25 = 100." },
    { q: "Which number is even?", opts: ["13", "27", "42", "35"], a: 2, why: "42 ends in 2, so it is divisible by 2." }
  ],
  science: [
    { q: "Which planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Mercury"], a: 1, why: "Mars looks red because of iron-oxide (rusty) dust." },
    { q: "What do plants need for photosynthesis?", opts: ["Sunlight + water + CO₂", "Sand + wind", "Sugar + darkness", "Plastic + heat"], a: 0, why: "Plants use sunlight, water and carbon dioxide to make food." },
    { q: "How long does Earth take to orbit the Sun?", opts: ["1 day", "1 month", "1 year", "10 years"], a: 2, why: "One full orbit ≈ 365 days = 1 year." },
    { q: "What is H₂O?", opts: ["Salt", "Water", "Oxygen", "Sugar"], a: 1, why: "H₂O = 2 hydrogen + 1 oxygen = water." },
    { q: "Which is a renewable energy source?", opts: ["Coal", "Oil", "Sunlight", "Petrol"], a: 2, why: "Sunlight never runs out — coal and oil do." }
  ],
  english: [
    { q: "Which word is a noun?", opts: ["Run", "Beautiful", "Castle", "Quickly"], a: 2, why: "A castle is a thing — nouns name people, places or things." },
    { q: "Choose the correct sentence.", opts: ["They is happy.", "They are happy.", "They be happy.", "They am happy."], a: 1, why: "'They' pairs with 'are'." },
    { q: "What is the past tense of 'go'?", opts: ["Goed", "Went", "Gone always", "Going"], a: 1, why: "'I go' → 'I went' (yesterday)." },
    { q: "Which is an adjective?", opts: ["Brave", "Run", "And", "House"], a: 0, why: "Adjectives describe nouns: a brave builder." },
    { q: "Which ends with a question mark?", opts: ["What is your name", "My name is Sam.", "What is your name?", "Wow!"], a: 2, why: "Questions end with ?" }
  ],
  music: [
    { q: "How many notes are in one octave (C to C)?", opts: ["6", "7", "8", "12"], a: 2, why: "C D E F G A B C = 8 notes including both Cs." },
    { q: "Which clef do most singers and flutes read?", opts: ["Bass clef", "Treble clef", "Drum clef", "No clef"], a: 1, why: "Treble clef is for higher sounds — voices, flute, violin." },
    { q: "How many beats does a whole note get in 4/4?", opts: ["1", "2", "3", "4"], a: 3, why: "Whole note = hold for all 4 beats of the bar." },
    { q: "Which instrument is a percussion instrument?", opts: ["Violin", "Drum", "Flute", "Trumpet"], a: 1, why: "You hit or shake percussion — drums, shakers, xylophone." },
    { q: "What does 'tempo' mean?", opts: ["How loud", "How fast", "How high", "How long the concert is"], a: 1, why: "Tempo = speed of the music (fast/slow)." },
    { q: "Which symbol makes a note louder?", opts: ["p (piano)", "f (forte)", "♩ rest", "bar line"], a: 1, why: "f = forte = loud. p = piano = soft." }
  ],
  shapes: [
    { q: "How many SQUARE faces does a cube have?", opts: ["4", "5", "6", "8"], a: 2, why: "Cube = 6 square faces, 8 vertices (corners), 12 edges." },
    { q: "A square pyramid has how many TRIANGLE faces?", opts: ["2", "3", "4", "5"], a: 2, why: "4 triangles meet at the top + 1 square base = 5 faces total." },
    { q: "Which 2D shape do you see on every face of a cube?", opts: ["Triangle", "Circle", "Square", "Rectangle (not square)"], a: 2, why: "All 6 faces of a cube are identical squares." },
    { q: "How many vertices (corners) does a cube have?", opts: ["6", "8", "12", "4"], a: 1, why: "4 corners on top + 4 on the bottom = 8." },
    { q: "How many edges does a square pyramid have?", opts: ["4", "6", "8", "12"], a: 2, why: "4 base edges + 4 edges up to the apex = 8." },
    { q: "A triangle has how many sides?", opts: ["2", "3", "4", "5"], a: 1, why: "Tri = 3. Triangles are the faces of a pyramid's sides." }
  ]
};
window.SUBJECT_META = {
  math: { icon: "➕", name: "Math" },
  science: { icon: "🔬", name: "Science" },
  english: { icon: "📖", name: "English" },
  music: { icon: "🎵", name: "Music" },
  shapes: { icon: "🔷", name: "3D Shapes" }
};
