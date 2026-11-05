// Lark & Nib’s Treasure Quest: eight seasons, one playable opening episode each.
// Later chapters keep their skill and title so the season has a shape. Their stops are not written yet.
// Pip stays the otter in Otter Slide. The guide here is Lark.

import { pictureUnlocked } from "./reading-marks.mjs";

export { pictureUnlocked };

export const STOPS = ["map", "lagoon", "woods", "shore", "cove", "river", "treasure"];
export const SHORE_UP_STOPS = ["map", "lagoon", "woods"];

const TAUGHT_THROUGH_4 = [
  "ee", "ea", "oo", "ou", "ow", "ai", "ay", "oa", "oi", "oy", "aw", "au", "al",
  "ar", "er", "ir", "or", "ur", "sh", "ch", "th", "wh", "ph", "ng", "nk", "ck", "igh",
  "silent-e", "soft-c", "soft-g", "open", "y-long"
];

function soon(trailId, n, title, skill) {
  return { id: `${trailId}e${n}`, trailId, n, title, skill, ready: false };
}

function episode(fields) {
  return { ready: true, sight: [], taught: [], splits: {}, hints: {}, ...fields };
}

export const TRAILS = [
  {
    id: "t1",
    n: 1,
    title: "First Sounds",
    book: "The Map Pieces",
    episodes: [
      episode({
        id: "t1e1",
        trailId: "t1",
        n: 1,
        title: "The Moon Path",
        skill: "The sound mmm",
        essential: "listening-1",
        script: "s1e1-v2",
        again: "Nib runs for the sun again.",
        lark: "Which path hums mmm?",
        nib: "The sun! Treasure loves the sun!",
        next: "Nib can see another piece.",
        tagPlate: "art/tag.jpg",
        treasure: {
          id: "moon-stone",
          name: "Moon stone",
          picture: "art/stone.jpg",
          plate: "art/tag.jpg",
          line: "Moon stone is yours. First piece of the map.",
          lead: [
            { text: "The corner holds.", plate: "art/tag.jpg" },
            { text: "First piece of the map. The moon stone too.", plate: "art/tag.jpg" },
            { text: "Nib's ears go up. Another hum, far off.", plate: "art/tag.jpg" }
          ]
        },
        intro: [
          { who: "lark", text: "Morning. The map was on this stump.", plate: "art/camp.jpg" },
          { who: "nib", text: "I sat on it.", plate: "art/camp.jpg" },
          { who: "lark", text: "Nib! You found a piece of the map.", plate: "art/camp.jpg" },
          { who: "nib", text: "A moon stone. Where's the rest?", plate: "art/camp.jpg" },
          { who: "lark", text: "Torn off. The piece is humming.", plate: "art/camp.jpg" },
          { who: "lark", text: "Put your ear close.", plate: "art/camp.jpg" },
          { who: "lark", text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/camp.jpg" },
          { who: "nib", text: "I can hum too!", plate: "art/camp.jpg" },
          { who: "lark", text: "Hold it with me.", plate: "art/camp.jpg" },
          { who: "lark", text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/camp.jpg" },
          { who: "nib", text: "The sun! Treasure loves the sun!", plate: "art/camp.jpg" },
          { who: "lark", text: "He is already running.", plate: "art/camp.jpg" }
        ],
        map: {
          graded: true,
          touch: "split",
          plate: "art/fork.jpg",
          lead: [
            { text: "Two paths leave camp.", plate: "art/fork.jpg" },
            { text: "Nib is on the shiny one.", plate: "art/fork.jpg" },
            { text: "The scrap still hums.", plate: "art/fork.jpg" },
            { text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/fork.jpg" }
          ],
          prompt: "Which path hums mmm?",
          miss: "That's the sun.",
          choices: [
            { id: "sun", label: "sun", hears: ["sun"], correct: false },
            { id: "moon", label: "moon", hears: ["moon", "mmm"], correct: true }
          ]
        },
        lagoon: {
          lead: [
            { text: "The moon path has a gate.", plate: "art/gate.jpg" },
            { text: "Nib shoved it.", plate: "art/gate.jpg" },
            { text: "The gate hummed back.", plate: "art/gate.jpg" },
            { text: "Same hum as the piece.", plate: "art/gate.jpg" },
            { text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/gate.jpg" }
          ],
          prompt: "The gate wants the letter that hums.",
          plate: "art/gate.jpg",
          sound: "mmm",
          answer: "m",
          miss: "Mmm.",
          choices: [
            { id: "s", label: "s", hears: ["s", "sss", "es"], correct: false },
            { id: "m", label: "m", hears: ["m", "em", "mmm"], correct: true },
            { id: "t", label: "t", hears: ["t", "tee"], correct: false }
          ]
        },
        woods: {
          lead: [
            { text: "Down the path, the grass hums.", plate: "art/path.jpg" },
            { text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/path.jpg" },
            { text: "Your turn. Hum with the piece.", plate: "art/path.jpg" },
            { text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/path.jpg" },
            { text: "Nib found signs.", plate: "art/signs.jpg" },
            { text: "He is pointing at the sun one.", plate: "art/signs.jpg" }
          ],
          prompt: "Nib points at the sun.",
          plate: "art/signs.jpg",
          miss: "That's the sun.",
          choices: [
            { id: "sun", label: "sun", word: "sun", hears: ["sun"], correct: false },
            { id: "moon", label: "moon", word: "moon", hears: ["moon"], correct: true }
          ]
        },
        shore: {
          plate: "art/path.jpg",
          scene: "art/stone.jpg",
          sceneAlt: "A glowing stone on the moon path",
          reveal: "The stone.",
          lines: [
            { who: "lark", text: "You took the moon path." },
            { who: "lark", text: "The hum came with us." },
            { who: "lark", text: "Mmm, said the piece." },
            { who: "child", text: "m", say: "Mmm." },
            { who: "lark", text: "A moth hummed back." },
            { who: "lark", text: "The sun did not." },
            { who: "lark", text: "Nib hummed at a bee." },
            { who: "lark", text: "Bees do not hum mmm." },
            { who: "lark", text: "The stone is up there." },
            { who: "child", text: "m", say: "Mmm." }
          ]
        },
        cove: {
          lead: [
            { text: "The stone is glowing in the grass.", plate: "art/stone.jpg" },
            { text: "Nib spins around.", plate: "art/stone.jpg" },
            { text: "He says the sun led us here.", plate: "art/stone.jpg" }
          ],
          prompt: "Nib says we followed the sun.",
          plate: "art/stone.jpg",
          miss: "Up there.",
          choices: [
            { id: "sun", label: "the sun", hears: ["sun"], correct: false },
            { id: "moon", label: "the moon", hears: ["moon"], correct: true }
          ]
        },
        river: {
          kind: "trace",
          letter: "m",
          plate: "art/camp.jpg",
          lead: [
            { text: "The piece has an empty corner.", plate: "art/camp.jpg" },
            { text: "Wind tugs at it.", plate: "art/camp.jpg" },
            { text: "The letter that hums will hold it.", plate: "art/camp.jpg" },
            { text: "Mmm.", cue: "sound", sound: "mmm", plate: "art/camp.jpg" }
          ],
          line: "The piece needs its letter.",
          prompt: "Start here."
        }
      }),
      soon("t1", 2, "The Apple Path", "The sound a"),
      soon("t1", 3, "The Sun Path", "The sound sss"),
      soon("t1", 4, "The Top of the Map", "The sound t"),
      soon("t1", 5, "The Red Path", "The sound rrr"),
      soon("t1", 6, "Nib's Idea", "The sound ih"),
      soon("t1", 7, "Rat, Mat, Sat", "Blending"),
      soon("t1", 8, "Sit on the Map", "The word sit"),
      soon("t1", 9, "The First Page", "A co-read page"),
      soon("t1", 10, "The Map Book", "The bound book")
    ]
  },
  {
    id: "t2",
    n: 2,
    title: "Short Vowel Woods",
    book: "Through the Woods",
    episodes: [
      episode({
        id: "t2e1",
        trailId: "t2",
        n: 1,
        title: "Nib Ran",
        skill: "The sound nnn",
        essential: "problem-solving-1",
        again: "Let's find the nnn path again.",
        lark: "I'll say the path. You tap it. Nest.",
        nib: "Nib sits on the sun and says, This one!",
        treasure: { id: "nest-charm", name: "Nest charm", picture: "🪺" },
        intro: [
          { who: "lark", text: "Nib ran ahead. The next path starts with nnn.", cue: "camp" },
          { who: "nib", text: "Sun path again! I am good at this.", cue: "camp" },
          { who: "lark", text: "Listen. Nnn. Nest starts with nnn.", cue: "sound", sound: "nnn" }
        ],
        map: {
          graded: true,
          prompt: "Lark says nest. Tap that path.",
          miss: "Lark said nest. It starts with nnn.",
          choices: [
            { id: "sun", label: "sun", picture: "☀️", correct: false },
            { id: "nest", label: "nest", picture: "🪺", correct: true }
          ]
        },
        lagoon: {
          prompt: "This sound is nnn. Tap the letter.",
          sound: "nnn",
          answer: "n",
          miss: "Listen again. Nnn.",
          choices: [
            { id: "m", label: "m", correct: false },
            { id: "n", label: "n", correct: true },
            { id: "s", label: "s", correct: false }
          ]
        },
        woods: {
          prompt: "Tap the word ran.",
          miss: "Ran has nnn at the end. Rat does not.",
          choices: [
            { id: "rat", word: "rat", correct: false },
            { id: "ran", word: "ran", correct: true }
          ]
        },
        shore: {
          scene: "🐜",
          sceneAlt: "Nib running toward an ant",
          lines: [
            { who: "lark", text: "Nib sees an ant." },
            { who: "child", text: "Nib ran." }
          ]
        },
        cove: {
          prompt: "Nib says he sat. What did Nib do?",
          miss: "The page says Nib ran.",
          choices: [
            { id: "sat", label: "sat", correct: false },
            { id: "ran", label: "ran", correct: true }
          ]
        },
        river: { kind: "build", word: "ran", tiles: ["r", "a", "n", "s"], prompt: "Build ran." }
      }),
      soon("t2", 2, "The D Path", "The sound d"),
      soon("t2", 3, "The F Path", "The sound fff"),
      soon("t2", 4, "On the Path", "Short o"),
      soon("t2", 5, "The P Path", "The sound p"),
      soon("t2", 6, "The C Path", "The sound k"),
      soon("t2", 7, "The H Path", "The sound h"),
      soon("t2", 8, "The E Path", "Short e"),
      soon("t2", 9, "The G Path", "The sound g"),
      soon("t2", 10, "The L Path", "The sound lll"),
      soon("t2", 11, "The B Path", "The sound buh"),
      soon("t2", 12, "The U Path", "Short u"),
      soon("t2", 13, "The W Path", "The sound w"),
      soon("t2", 14, "The K Path", "The sound k")
    ]
  },
  {
    id: "t3",
    n: 3,
    title: "Long Vowels",
    book: "The Long Path",
    episodes: [
      episode({
        id: "t3e1",
        trailId: "t3",
        n: 1,
        title: "See the Tree",
        skill: "Long e spelled ee",
        essential: "speaking-1",
        again: "Let's read the ee sign again.",
        lark: "Tell Nib which sign says tree.",
        nib: "Nib taps trap and cheers.",
        sight: ["a"],
        taught: ["ee"],
        treasure: { id: "green-leaf", name: "Green leaf", picture: "🍃" },
        intro: [
          { who: "lark", text: "Two e's are waiting on a sign.", cue: "camp" },
          { who: "nib", text: "Trap! I pick trap.", cue: "camp" },
          { who: "lark", text: "E and e together say ee. Like tree.", cue: "sound", sound: "ee" }
        ],
        map: {
          graded: true,
          prompt: "Which sign says tree?",
          miss: "Tree has ee in it. Those two letters say ee.",
          choices: [
            { id: "trap", word: "trap", correct: false },
            { id: "tree", word: "tree", correct: true }
          ]
        },
        lagoon: {
          prompt: "These letters say ee. Tap them.",
          sound: "ee",
          answer: "ee",
          miss: "E and e stay together. They say ee.",
          choices: [
            { id: "e", label: "e", correct: false },
            { id: "ee", label: "ee", correct: true },
            { id: "a", label: "a", correct: false }
          ]
        },
        woods: {
          prompt: "Tap the word tree.",
          miss: "Look for e and e together.",
          choices: [
            { id: "trip", word: "trip", correct: false },
            { id: "tree", word: "tree", correct: true }
          ]
        },
        shore: {
          scene: "🌳",
          sceneAlt: "A tree beside the path",
          lines: [
            { who: "lark", text: "Lark can see." },
            { who: "child", text: "A tree." }
          ]
        },
        cove: {
          prompt: "Nib says Lark sees a trap. What does Lark see?",
          miss: "The page says a tree.",
          choices: [
            { id: "trap", word: "trap", correct: false },
            { id: "tree", word: "tree", correct: true }
          ]
        },
        river: { kind: "build", word: "see", tiles: ["s", "ee", "a"], prompt: "Build see." }
      }),
      soon("t3", 2, "Jeff's Job", "The sound j"),
      soon("t3", 3, "The Van", "The sound vvv"),
      soon("t3", 4, "The Cake", "Long a, silent e"),
      soon("t3", 5, "Yes", "The letter y"),
      soon("t3", 6, "The Queen", "The letter q"),
      soon("t3", 7, "Snow", "Long o"),
      soon("t3", 8, "The Fox", "The letter x"),
      soon("t3", 9, "Zip", "The letter z"),
      soon("t3", 10, "The Hive", "Long i"),
      soon("t3", 11, "The King", "The sound ng"),
      soon("t3", 12, "The Mule", "Long u"),
      soon("t3", 13, "The Shore", "The sound sh"),
      soon("t3", 14, "Amy Flies", "Long i spelled y")
    ]
  },
  {
    id: "t4",
    n: 4,
    title: "Teams and Tales",
    book: "Teams and Tales",
    episodes: [
      episode({
        id: "t4e1",
        trailId: "t4",
        n: 1,
        title: "A Seat",
        skill: "ea saying ee",
        essential: "planning-2",
        again: "Let's read the ea sign again.",
        lark: "The right sign says seat.",
        nib: "Nib picks set, then looks proud.",
        sight: ["a"],
        taught: ["ea", "ee"],
        treasure: { id: "feast-cup", name: "Feast cup", picture: "🥤" },
        intro: [
          { who: "lark", text: "The feast is ready. We need a seat.", cue: "camp" },
          { who: "nib", text: "Set! That one is short.", cue: "camp" },
          { who: "lark", text: "E and a together say ee. Seat.", cue: "sound", sound: "ea" }
        ],
        map: {
          graded: true,
          prompt: "Tap the sign that says seat.",
          miss: "Seat has e and a together. They say ee.",
          choices: [
            { id: "set", word: "set", correct: false },
            { id: "seat", word: "seat", correct: true }
          ]
        },
        lagoon: {
          prompt: "E and a together say ee. Tap them.",
          sound: "ee",
          answer: "ea",
          miss: "Look for e and a side by side.",
          choices: [
            { id: "ee", label: "ee", correct: false },
            { id: "ea", label: "ea", correct: true },
            { id: "a", label: "a", correct: false }
          ]
        },
        woods: {
          prompt: "Tap the word seat.",
          miss: "Seat is s, then ea, then t.",
          choices: [
            { id: "set", word: "set", correct: false },
            { id: "seat", word: "seat", correct: true }
          ]
        },
        shore: {
          scene: "🪑",
          sceneAlt: "A seat at a small feast",
          lines: [
            { who: "lark", text: "Lark and Nib eat." },
            { who: "child", text: "A seat." }
          ]
        },
        cove: {
          prompt: "Nib says they found a set. What did they find?",
          miss: "The page says a seat.",
          choices: [
            { id: "set", word: "set", correct: false },
            { id: "seat", word: "seat", correct: true }
          ]
        },
        river: { kind: "build", word: "eat", tiles: ["ea", "t", "s"], prompt: "Build eat." }
      }),
      soon("t4", 2, "The Chest", "ch"),
      soon("t4", 3, "The Farm", "ar"),
      soon("t4", 4, "The River", "er"),
      soon("t4", 5, "The Path", "th"),
      soon("t4", 6, "Magic", "Soft g"),
      soon("t4", 7, "The Moon", "oo"),
      soon("t4", 8, "Why", "wh"),
      soon("t4", 9, "The Cow", "ou and ow"),
      soon("t4", 10, "The Race", "Soft c"),
      soon("t4", 11, "The Ball", "al"),
      soon("t4", 12, "The Lawn", "aw"),
      soon("t4", 13, "The Train", "ai"),
      soon("t4", 14, "The Boat", "oa"),
      soon("t4", 15, "The Phone", "ph"),
      soon("t4", 16, "The Coin", "oi")
    ]
  },
  {
    id: "t5",
    n: 5,
    title: "Big Words",
    book: "Big Words",
    episodes: [
      episode({
        id: "t5e1",
        trailId: "t5",
        n: 1,
        title: "Sunset",
        skill: "Two chunks in a long word",
        essential: "adapting-3",
        again: "Let's chunk the long word again.",
        lark: "This word is long. Read the first chunk, then the next.",
        nib: "Nib reads sun and stops. The word keeps going.",
        sight: ["the"],
        taught: TAUGHT_THROUGH_4,
        splits: { sunset: ["sun", "set"] },
        treasure: { id: "sun-coin", name: "Sun coin", picture: "🪙" },
        intro: [
          { who: "lark", text: "This word is long. Read one chunk, then the next.", cue: "camp" },
          { who: "nib", text: "Sun! I stopped. Is it over?", cue: "camp" },
          { who: "lark", text: "Sun, then set. Keep going.", cue: "sound", sound: "sun · set" }
        ],
        map: {
          graded: true,
          prompt: "Tap the sign that says sunset.",
          miss: "Read sun, then set. That is sunset.",
          choices: [
            { id: "sun", word: "sun", correct: false },
            { id: "sunset", word: "sunset", correct: true }
          ]
        },
        lagoon: {
          prompt: "The first chunk of sunset is sun. Tap sun.",
          sound: "sun",
          answer: "sun",
          miss: "The first chunk is sun.",
          choices: [
            { id: "set", label: "set", correct: false },
            { id: "sun", label: "sun", correct: true }
          ]
        },
        woods: {
          prompt: "Tap the word sunset.",
          miss: "Sunset is sun, then set.",
          choices: [
            { id: "sand", word: "sand", correct: false },
            { id: "sunset", word: "sunset", correct: true }
          ]
        },
        shore: {
          scene: "🌇",
          sceneAlt: "The sun setting on the path",
          lines: [
            { who: "lark", text: "Lark and Nib stop." },
            { who: "child", text: "The sunset." }
          ]
        },
        cove: {
          prompt: "Nib is lost. What helps them find camp?",
          miss: "They look at the sunset.",
          choices: [
            { id: "hat", label: "a hat", correct: false },
            { id: "sunset", label: "the sunset", correct: true }
          ]
        },
        river: { kind: "build", word: "sunset", tiles: ["sun", "set", "hat"], prompt: "Build sunset in chunks." }
      }),
      soon("t5", 2, "Open Chunks", "Open syllables"),
      soon("t5", 3, "Silent e Chunks", "Silent e in a long word"),
      soon("t5", 4, "Team Chunks", "A vowel team in a long word"),
      soon("t5", 5, "R Chunks", "An r-controlled chunk"),
      soon("t5", 6, "Little le", "Consonant le"),
      soon("t5", 7, "Jumped", "The ending ed"),
      soon("t5", 8, "Running", "The ending ing"),
      soon("t5", 9, "Helper", "The ending er"),
      soon("t5", 10, "Sunbeam", "A compound word"),
      soon("t5", 11, "Mixed Chunks", "A mixed long word"),
      soon("t5", 12, "Camp Again", "A long-word review")
    ]
  },
  {
    id: "t6",
    n: 6,
    title: "Word Builders",
    book: "Word Builders",
    episodes: [
      episode({
        id: "t6e1",
        trailId: "t6",
        n: 1,
        title: "Unlock",
        skill: "The prefix un",
        essential: "creativity-1",
        again: "Let's read unlock again.",
        lark: "Guess what is in the chest. Then read the sign that opens it.",
        nib: "Nib guesses a hat. Then he tugs the lock.",
        sight: [],
        taught: [...TAUGHT_THROUGH_4],
        splits: { unlock: ["un", "lock"] },
        hints: { unlock: "Un at the start means not. Say un, then the rest." },
        treasure: { id: "little-key", name: "Little key", picture: "🗝️" },
        intro: [
          { who: "lark", text: "The chest is locked.", cue: "camp" },
          { who: "nib", text: "I will pull it. It will not open.", cue: "camp" },
          { who: "lark", text: "Un at the start means not. Unlock means not locked.", cue: "sound", sound: "un" }
        ],
        map: {
          graded: true,
          prompt: "Which sign opens the chest?",
          miss: "Unlock means not locked.",
          choices: [
            { id: "lock", word: "lock", correct: false },
            { id: "unlock", word: "unlock", correct: true }
          ]
        },
        lagoon: {
          prompt: "Un means not. Tap un.",
          sound: "un",
          answer: "un",
          miss: "The start is un.",
          choices: [
            { id: "re", label: "re", correct: false },
            { id: "un", label: "un", correct: true }
          ]
        },
        woods: {
          prompt: "Tap the word unlock.",
          miss: "Unlock starts with un.",
          choices: [
            { id: "lock", word: "lock", correct: false },
            { id: "unlock", word: "unlock", correct: true }
          ]
        },
        shore: {
          scene: "🔐",
          sceneAlt: "A chest with a lock",
          lines: [
            { who: "lark", text: "The chest is stuck." },
            { who: "child", text: "Lark can unlock it." }
          ]
        },
        cove: {
          prompt: "Nib says the chest stays shut. What can Lark do?",
          miss: "Lark can unlock it.",
          choices: [
            { id: "lock", label: "lock it", correct: false },
            { id: "unlock", label: "unlock it", correct: true }
          ]
        },
        river: {
          kind: "sentence",
          words: ["Lark", "can", "unlock", "it"],
          extra: ["Nib"],
          prompt: "Build the sentence that opens the chest."
        }
      }),
      soon("t6", 2, "Redo", "The prefix re"),
      soon("t6", 3, "Helpful", "The ending ful"),
      soon("t6", 4, "Slowly", "The ending ly"),
      soon("t6", 5, "Endless", "The ending less"),
      soon("t6", 6, "Boxes", "The ending s or es"),
      soon("t6", 7, "Planted", "ed again"),
      soon("t6", 8, "Planting", "ing again"),
      soon("t6", 9, "Sunlight", "Compounds again"),
      soon("t6", 10, "A Sentence", "Writing a sentence")
    ]
  },
  {
    id: "t7",
    n: 7,
    title: "Read to Learn",
    book: "Field Notes",
    episodes: [
      episode({
        id: "t7e1",
        trailId: "t7",
        n: 1,
        title: "Moon Stone",
        skill: "A field note",
        essential: "problem-solving-4",
        again: "Let's read the note again.",
        lark: "The note says where the stone is. Use the note.",
        nib: "Nib does not read the note. He guesses a hat.",
        sight: ["a", "is"],
        taught: TAUGHT_THROUGH_4,
        treasure: { id: "field-card", name: "Field card", picture: "🗒️" },
        intro: [
          { who: "lark", text: "I wrote a field note. Read it before you guess.", cue: "camp" },
          { who: "nib", text: "A hat! I did not read the note.", cue: "camp" },
          { who: "lark", text: "The note tells us what the stone is.", cue: "sound", sound: "read it" }
        ],
        map: {
          graded: true,
          prompt: "The note says rock. Tap that path.",
          miss: "The note names a rock, not a hat.",
          choices: [
            { id: "hat", word: "hat", correct: false },
            { id: "rock", word: "rock", correct: true }
          ]
        },
        lagoon: {
          prompt: "Tap the word rock.",
          sound: "rock",
          answer: "rock",
          miss: "The word is rock.",
          choices: [
            { id: "hat", label: "hat", correct: false },
            { id: "rock", label: "rock", correct: true }
          ]
        },
        woods: {
          prompt: "Tap the word rock.",
          miss: "Rock is the word in the note.",
          choices: [
            { id: "hat", word: "hat", correct: false },
            { id: "rock", word: "rock", correct: true }
          ]
        },
        shore: {
          scene: "🪨",
          sceneAlt: "A round stone, labeled round",
          diagram: "round",
          lines: [
            { who: "child", text: "A moon stone is a rock." },
            { who: "child", text: "It is round." },
            { who: "lark", text: "Lark finds it on the path." }
          ]
        },
        cove: {
          prompt: "What is a moon stone?",
          miss: "The note says a moon stone is a rock.",
          choices: [
            { id: "hat", label: "a hat", correct: false },
            { id: "rock", label: "a rock", correct: true }
          ]
        },
        river: { kind: "build", word: "rock", tiles: ["r", "o", "ck", "h"], prompt: "Build rock." }
      }),
      soon("t7", 2, "The Diagram", "A diagram"),
      soon("t7", 3, "The Main Idea", "Main idea"),
      soon("t7", 4, "Because", "Cause and effect"),
      soon("t7", 5, "How to Camp", "A how-to page"),
      soon("t7", 6, "Labels", "Labels on a picture"),
      soon("t7", 7, "Two Notes", "Compare two notes"),
      soon("t7", 8, "First Next Last", "A process"),
      soon("t7", 9, "Ask the Page", "A question the page answers"),
      soon("t7", 10, "A Cold Page", "A cold read")
    ]
  },
  {
    id: "t8",
    n: 8,
    title: "Your Expedition",
    book: "Your Expedition",
    episodes: [
      episode({
        id: "t8e1",
        trailId: "t8",
        n: 1,
        title: "Pick a Path",
        skill: "A page you chose",
        essential: "creativity-2",
        again: "Let's read your page again.",
        lark: "Pick what you want to read.",
        nib: "Nib wants all three. You pick one.",
        sight: ["a", "is", "the", "it"],
        taught: TAUGHT_THROUGH_4,
        treasure: { id: "blank-book", name: "Expedition book", picture: "📘" },
        intro: [
          { who: "lark", text: "Today you pick the path.", cue: "camp" },
          { who: "nib", text: "Nib wants all three.", cue: "camp" },
          { who: "lark", text: "Bugs, moons, or maps. You choose.", cue: "sound", sound: "you pick" }
        ],
        map: {
          graded: false,
          prompt: "What do you want to read about?",
          miss: "",
          choices: [
            { id: "bugs", label: "bugs", picture: "🐜", correct: true },
            { id: "moons", label: "moons", picture: "🌙", correct: true },
            { id: "maps", label: "maps", picture: "🗺️", correct: true }
          ]
        },
        topics: {
          bugs: {
            treasure: { id: "book-bugs", name: "Bug book", picture: "🐜" },
            lagoon: {
              prompt: "Tap the letter that starts ant.",
              sound: "ah",
              answer: "a",
              miss: "Ant starts with a.",
              choices: [
                { id: "s", label: "s", correct: false },
                { id: "a", label: "a", correct: true }
              ]
            },
            woods: {
              prompt: "Tap the word ant.",
              miss: "Ant is a, n, t.",
              choices: [
                { id: "sun", word: "sun", correct: false },
                { id: "ant", word: "ant", correct: true }
              ]
            },
            shore: {
              scene: "🐜",
              sceneAlt: "An ant on the path",
              lines: [
                { who: "child", text: "An ant is a bug." },
                { who: "child", text: "It can run." },
                { who: "lark", text: "It has six legs." }
              ]
            },
            cove: {
              prompt: "What did you learn?",
              miss: "The page says an ant is a bug.",
              choices: [
                { id: "hat", label: "An ant is a hat.", correct: false },
                { id: "bug", label: "An ant is a bug.", correct: true }
              ]
            },
            river: { kind: "build", word: "ant", tiles: ["a", "n", "t", "s"], prompt: "Build ant." }
          },
          moons: {
            treasure: { id: "book-moons", name: "Moon book", picture: "🌙" },
            splits: { moon: ["m", "oo", "n"] },
            taught: [...TAUGHT_THROUGH_4, "oo"],
            lagoon: {
              prompt: "Tap oo. Those letters say oo in moon.",
              sound: "oo",
              answer: "oo",
              miss: "O and o stay together in moon.",
              choices: [
                { id: "m", label: "m", correct: false },
                { id: "oo", label: "oo", correct: true }
              ]
            },
            woods: {
              prompt: "Tap the word moon.",
              miss: "Moon has oo in the middle.",
              choices: [
                { id: "man", word: "man", correct: false },
                { id: "moon", word: "moon", correct: true }
              ]
            },
            shore: {
              scene: "🌙",
              sceneAlt: "The moon over camp",
              lines: [
                { who: "child", text: "The moon is up." },
                { who: "child", text: "It is round." },
                { who: "lark", text: "It can shine." }
              ]
            },
            cove: {
              prompt: "What did you learn?",
              miss: "The page says the moon is round.",
              choices: [
                { id: "hat", label: "The moon is a hat.", correct: false },
                { id: "round", label: "The moon is round.", correct: true }
              ]
            },
            river: { kind: "build", word: "moon", tiles: ["m", "oo", "n", "a"], prompt: "Build moon." }
          },
          maps: {
            treasure: { id: "book-maps", name: "Map book", picture: "🗺️" },
            lagoon: {
              prompt: "Tap the letter that starts map.",
              sound: "mmm",
              answer: "m",
              miss: "Map starts with mmm.",
              choices: [
                { id: "s", label: "s", correct: false },
                { id: "m", label: "m", correct: true }
              ]
            },
            woods: {
              prompt: "Tap the word map.",
              miss: "Map is m, a, p.",
              choices: [
                { id: "sun", word: "sun", correct: false },
                { id: "map", word: "map", correct: true }
              ]
            },
            shore: {
              scene: "🗺️",
              sceneAlt: "A map of the path",
              lines: [
                { who: "child", text: "A map shows a path." },
                { who: "lark", text: "Lark reads the map." },
                { who: "child", text: "The path leads on." }
              ]
            },
            cove: {
              prompt: "What did you learn?",
              miss: "The page says a map shows a path.",
              choices: [
                { id: "hat", label: "A map is a hat.", correct: false },
                { id: "path", label: "A map shows a path.", correct: true }
              ]
            },
            river: { kind: "build", word: "map", tiles: ["m", "a", "p", "s"], prompt: "Build map." }
          }
        }
      }),
      soon("t8", 2, "Another Page", "A second chosen page"),
      soon("t8", 3, "Ask Joyce", "Help only when called"),
      soon("t8", 4, "Tell It", "Say what you learned"),
      soon("t8", 5, "A New Topic", "A second topic"),
      soon("t8", 6, "A Longer Page", "A longer chosen page"),
      soon("t8", 7, "Cold Read", "A cold read on your topic"),
      soon("t8", 8, "Set Free", "Read what you want")
    ]
  }
];

const EPISODES = new Map(TRAILS.flatMap((trail) => trail.episodes.map((ep) => [ep.id, ep])));

export function trailById(id) {
  return TRAILS.find((trail) => trail.id === id) || null;
}

export function episodeById(id) {
  return EPISODES.get(id) || null;
}

export function trailNumber(episode) {
  return trailById(episode?.trailId)?.n || 1;
}

export function emptyProgress() {
  return {
    episodeId: "t1e1",
    stop: "map",
    line: 0,
    topic: null,
    shoreUp: null,
    done: [],
    tries: [],
    logged: {},
    helped: {},
    revealed: {},
    treasures: [],
    chapters: []
  };
}

export function choicesFor(choices, narrow) {
  const list = Array.isArray(choices) ? choices : [];
  if (!narrow || list.length < 2) return list;
  const correct = list.find((choice) => choice.correct);
  const wrong = list.find((choice) => !choice.correct);
  if (!wrong) return list;
  return [wrong, correct].filter(Boolean);
}

export function isSolid(tries) {
  const scored = (tries || []).filter((row) => !row.helped);
  if (scored.length < 3) return false;
  const right = scored.filter((row) => row.correct).length;
  return right / scored.length >= 0.6;
}

export function activeScript(episode, progress) {
  const topic = episode?.topics?.[progress?.topic];
  if (!topic) return episode;
  return {
    ...episode,
    ...topic,
    taught: topic.taught || episode.taught,
    splits: { ...episode.splits, ...topic.splits },
    sight: topic.sight || episode.sight,
    map: episode.map,
    topics: episode.topics
  };
}

export function nextPlayable(episode) {
  const trail = trailById(episode.trailId);
  const later = trail?.episodes.find((ep) => ep.n > episode.n);
  if (later) return later.ready ? later : null;
  const following = TRAILS.find((item) => item.n === (trail?.n || 0) + 1);
  const first = following?.episodes[0];
  return first?.ready ? first : null;
}

function addTreasure(list, treasure) {
  if (!treasure?.id) return list || [];
  if ((list || []).some((item) => item.id === treasure.id)) return list;
  return [...(list || []), treasure];
}

function addChapter(list, chapter) {
  const key = `${chapter.episodeId}:${chapter.topic || ""}`;
  if ((list || []).some((item) => `${item.episodeId}:${item.topic || ""}` === key)) return list;
  return [...(list || []), chapter];
}

export function applyFinish(progress, episode, tries) {
  const script = activeScript(episode, progress);
  const base = {
    ...progress,
    treasures: addTreasure(progress.treasures, script.treasure || episode.treasure),
    chapters: addChapter(progress.chapters, {
      episodeId: episode.id,
      title: episode.title,
      topic: progress.topic || null
    }),
    done: progress.done.includes(episode.id) ? progress.done : [...progress.done, episode.id]
  };
  const cleared = { tries: [], logged: {}, helped: {}, revealed: {}, line: 0 };
  if (!isSolid(tries)) {
    return { ...base, ...cleared, shoreUp: episode.id, episodeId: episode.id, stop: "map", topic: progress.topic };
  }
  const next = nextPlayable(episode);
  if (!next) {
    return { ...base, ...cleared, shoreUp: null, episodeId: episode.id, stop: "waiting", topic: progress.topic };
  }
  return { ...base, ...cleared, shoreUp: null, episodeId: next.id, stop: "map", topic: null };
}

export function resume(progress, episode) {
  const shoreUp = progress?.shoreUp === episode?.id;
  const stops = shoreUp ? SHORE_UP_STOPS : STOPS;
  const same = progress?.episodeId === episode?.id;
  let stop = same ? (progress.stop || "map") : "map";
  if (stop === "waiting" && !shoreUp) return { stop: "waiting", stops, line: 0, narrow: false };
  if (!stops.includes(stop)) stop = "map";
  return { stop, stops, line: same ? (progress.line || 0) : 0, narrow: shoreUp };
}

export function gradeChoice(choiceId, choices) {
  const found = (choices || []).find((choice) => choice.id === choiceId);
  const correct = Boolean(found?.correct);
  return { correct, stay: !correct };
}

export function placementProbe() {
  return TRAILS.flatMap((trail) => trail.episodes.filter((ep) => ep.ready).map((ep) => {
    const lagoon = ep.lagoon || Object.values(ep.topics || {})[0]?.lagoon;
    return {
      episodeId: ep.id,
      trail: trail.n,
      skill: ep.skill,
      prompt: lagoon?.prompt || "",
      answer: lagoon?.answer || ""
    };
  }));
}

export function syncScript(progress, episode) {
  const version = episode?.script;
  if (!version || progress?.playedScript === version) return progress;
  return {
    ...progress,
    script: version,
    playedScript: version,
    stop: "map",
    line: 0,
    seenLead: "",
    tries: [],
    logged: {},
    helped: {},
    revealed: {},
    introSeen: "",
    shoreUp: progress.shoreUp === episode.id ? null : progress.shoreUp
  };
}

export function placeChild(results) {
  const miss = (results || []).find((row) => row.correct === false);
  if (miss) return miss.episodeId;
  return results?.at(-1)?.episodeId || "t1e1";
}

export function shelf(progress) {
  const state = progress || emptyProgress();
  return TRAILS.map((trail) => {
    const ready = trail.episodes.filter((ep) => ep.ready);
    const bound = trail.episodes.every((ep) => ep.ready) && ready.length > 0 && ready.every((ep) => state.done.includes(ep.id));
    return {
      id: trail.id,
      book: trail.book,
      bound,
      chapters: trail.episodes.map((ep) => ({
        id: ep.id,
        n: ep.n,
        title: ep.title,
        ready: ep.ready,
        earned: state.chapters.some((chapter) => chapter.episodeId === ep.id)
      }))
    };
  });
}

export function trailCard(date, kidId) {
  return {
    id: `${date}:game:reading-trail`,
    kind: "game",
    part: "ela",
    gameId: "reading-trail",
    title: "Lark & Nib’s Treasure Quest",
    href: `../reading-trail/?kid=${encodeURIComponent(kidId)}`,
    say: "Lark has a map. Follow it to the treasure.",
    goal: "Play, then come back",
    skill: "Reading"
  };
}

export function hintFor(script, word) {
  const key = String(word || "").toLowerCase();
  return script?.hints?.[key] || "";
}
