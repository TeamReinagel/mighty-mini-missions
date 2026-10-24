// Today with Joyce's writing card: one lowercase letter a day, shown stroke by stroke, written on paper.
// Letters come in families that start the same way, not A to Z. The paper narrows from big boxes
// to small boxes to lines as the child's own check says the letters fit.
//
// Strokes are SVG paths in a 100 x 120 box: top line y=10, dashed middle line y=50,
// bottom line y=90, and the tail of g, j, p, q, y reaches y=115.

const C_START = "M 64 56 A 20 20 0 1 0 64 84";
const HILL = "M 34 90 L 34 64 Q 36 50 50 50 Q 64 50 64 64 L 64 90";
const BELLY = "M 34 90 L 34 68 Q 38 50 52 50 Q 68 50 68 70 Q 68 90 52 90 Q 40 90 34 86";

// `text` is shown; `cue` is spoken, with the letter's name so speech never reads "c" as a sound.
const s = (d, text) => ({ d, text, cue: text.replace(/\blike a c\b/g, "like a see") });

export const LETTER_NAMES = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "ef", g: "jee", h: "aitch", i: "eye",
  j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
  s: "ess", t: "tee", u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zee"
};

export const WRITE_LETTERS = [
  { letter: "c", family: "c", strokes: [s(C_START, "Start just under the middle line. Go back, around, and stop.")] },
  { letter: "o", family: "c", strokes: [s("M 50 50 A 20 20 0 0 0 50 90 A 20 20 0 0 0 50 50", "Start at the middle line. Go back, around, and close it up.")] },
  { letter: "a", family: "c", strokes: [s(C_START, "Start like a c. Back and around."), s("M 67 50 L 67 90", "Then up to the middle line, and straight down.")] },
  { letter: "d", family: "c", strokes: [s(C_START, "Start like a c. Back and around."), s("M 67 10 L 67 90", "Then way up to the top line, and all the way down.")] },
  { letter: "g", family: "c", strokes: [s(C_START, "Start like a c. Back and around."), s("M 67 50 L 67 104 Q 67 115 54 115 Q 42 115 37 108", "Up to the middle line, down under the bottom line, and hook back.")] },
  { letter: "q", family: "c", strokes: [s(C_START, "Start like a c. Back and around."), s("M 67 50 L 67 115 L 75 108", "Up to the middle line, down under the bottom line, and a little kick.")] },
  { letter: "l", family: "line", strokes: [s("M 50 10 L 50 90", "Start at the top line. Straight down to the bottom line.")] },
  { letter: "t", family: "line", strokes: [s("M 50 18 L 50 90", "Start up high. Straight down."), s("M 36 50 L 64 50", "Then cross it on the middle line.")] },
  { letter: "i", family: "line", strokes: [s("M 50 50 L 50 90", "Start at the middle line. Straight down."), s("M 50 33 L 50 33.5", "Then a dot on top.")] },
  { letter: "j", family: "line", strokes: [s("M 54 50 L 54 104 Q 54 115 43 115 Q 35 115 32 108", "Start at the middle line. Down under the bottom line, and hook back."), s("M 54 33 L 54 33.5", "Then a dot on top.")] },
  { letter: "r", family: "hill", strokes: [s("M 38 50 L 38 90", "Start at the middle line. Straight down."), s("M 38 90 L 38 64 Q 44 50 62 53", "Back up the same line, then over like a little branch.")] },
  { letter: "n", family: "hill", strokes: [s("M 34 50 L 34 90", "Start at the middle line. Straight down."), s(HILL, "Back up, over the hill, and down.")] },
  {
    letter: "m",
    family: "hill",
    strokes: [
      s("M 28 50 L 28 90", "Start at the middle line. Straight down."),
      s("M 28 90 L 28 60 Q 30 50 39 50 Q 50 50 50 60 L 50 90", "Back up, over one hill, and down."),
      s("M 50 90 L 50 60 Q 52 50 61 50 Q 72 50 72 60 L 72 90", "Back up, over one more hill, and down.")
    ]
  },
  { letter: "h", family: "hill", strokes: [s("M 34 10 L 34 90", "Start at the top line. Straight down."), s(HILL, "Back up to the middle, over the hill, and down.")] },
  { letter: "b", family: "hill", strokes: [s("M 34 10 L 34 90", "Start at the top line. Straight down."), s(BELLY, "Back up to the middle, then around to make the belly.")] },
  { letter: "p", family: "hill", strokes: [s("M 34 50 L 34 115", "Start at the middle line. Straight down, under the bottom line."), s("M 34 115 L 34 68 Q 38 50 52 50 Q 68 50 68 70 Q 68 90 52 90 Q 40 90 34 86", "Back up, then around to close it.")] },
  { letter: "u", family: "cup", strokes: [s("M 34 50 L 34 74 Q 34 90 50 90 Q 66 90 66 74 L 66 50", "Start at the middle line. Down, around the bottom, and up."), s("M 66 50 L 66 90", "Then straight down.")] },
  { letter: "y", family: "cup", strokes: [s("M 34 50 L 50 90", "Start at the middle line. Slide down to the bottom line."), s("M 66 50 L 42 115", "Start at the middle line again. Slide down, under the bottom line.")] },
  { letter: "v", family: "cup", strokes: [s("M 34 50 L 50 90 L 66 50", "Start at the middle line. Slide down, then slide up.")] },
  { letter: "w", family: "cup", strokes: [s("M 26 50 L 38 90 L 50 58 L 62 90 L 74 50", "Start at the middle line. Down, up, down, up.")] },
  { letter: "e", family: "other", strokes: [s("M 31 70 L 69 70 Q 69 50 50 50 Q 31 50 31 70 Q 31 90 52 90 Q 63 90 67 84", "Start in the middle. Straight across, then up and around like a c.")] },
  { letter: "s", family: "other", strokes: [s("M 64 56 Q 58 50 50 50 Q 36 50 36 60 Q 36 70 50 70 Q 64 70 64 80 Q 64 90 50 90 Q 40 90 34 84", "Start like a c. Curve back, then curve the other way.")] },
  { letter: "f", family: "other", strokes: [s("M 62 16 Q 56 10 50 10 Q 42 10 42 22 L 42 90", "Start near the top line. Curve back, then straight down."), s("M 30 50 L 56 50", "Then cross it on the middle line.")] },
  { letter: "k", family: "other", strokes: [s("M 36 10 L 36 90", "Start at the top line. Straight down."), s("M 62 50 L 36 72 L 62 90", "Start at the middle line. Slide in, then slide out.")] },
  { letter: "x", family: "other", strokes: [s("M 34 50 L 66 90", "Start at the middle line. Slide down this way."), s("M 66 50 L 34 90", "Start at the middle line again. Slide down the other way.")] },
  { letter: "z", family: "other", strokes: [s("M 34 50 L 66 50 L 34 90 L 66 90", "Start at the middle line. Across, slide down, then across again.")] }
];

// Each word uses only letters taught by then, so the child never writes a letter they haven't seen made.
export const WRITE_WORDS = [
  "dad", "add", "odd", "cod", "dog", "go", "do", "old", "log", "cold", "gold", "doll", "told", "tall",
  "cat", "dot", "got", "lot", "coat", "toad", "did", "dig", "lid", "lit", "jig", "jog", "rod", "rat",
  "rag", "ran", "nod", "not", "tin", "man", "mom", "hat", "ham", "hot", "bat", "bag", "big", "pig",
  "pot", "map", "mop", "hop", "cup", "pup", "mud", "bug", "hum", "yum", "yap", "van", "wag", "wig",
  "win", "web", "bed", "hen", "jet", "sun", "yes", "fun", "fan", "kid", "kit", "fox", "box", "six", "zip", "zap"
];

export const WRITE_SIZES = [
  { id: "big", label: "big-box" },
  { id: "small", label: "small-box" },
  { id: "lines", label: "lined" }
];

const FIT_TO_NARROW = 3;
const MISSES_TO_WIDEN = 2;

function wordFor(index) {
  const known = new Set(WRITE_LETTERS.slice(0, index + 1).map((entry) => entry.letter));
  const today = WRITE_LETTERS[index].letter;
  const usable = WRITE_WORDS.filter((word) => [...word].every((ch) => known.has(ch)));
  const withToday = usable.filter((word) => word.includes(today));
  const pool = withToday.length ? withToday : usable;
  return pool.length ? pool[index % pool.length] : null;
}

/** What today's card asks for, from how many writing days are done and the current paper. */
export function writeToday(writing = {}) {
  const count = Math.max(0, Number(writing.count) || 0);
  const index = count % WRITE_LETTERS.length;
  const size = Math.min(WRITE_SIZES.length - 1, Math.max(0, Number(writing.size) || 0));
  return { letter: WRITE_LETTERS[index].letter, word: wordFor(index), size };
}

export function writeLesson(plan) {
  const entry = WRITE_LETTERS.find((item) => item.letter === plan.letter) || WRITE_LETTERS[0];
  const name = LETTER_NAMES[entry.letter];
  const paper = WRITE_SIZES[plan.size] || WRITE_SIZES[0];
  return {
    letter: entry.letter,
    say: `Today's letter is ${name}. Watch how I make it.`,
    sayText: `Today's letter is ${entry.letter}. Watch how I make it.`,
    strokes: entry.strokes,
    write: `Now you. On your ${paper.label} paper, write ${name} three times. Start where I started.`,
    writeText: `Now you. On your ${paper.label} paper, write ${entry.letter} three times. Start where I started.`,
    word: plan.word || null,
    wordSay: plan.word ? `Now write the word ${plan.word}.` : null,
    check: "Look at your letters. Do they stay inside the lines?",
    paper: paper.id
  };
}

/**
 * Saves the child's own check once per day. Three fits in a row moves to narrower paper;
 * two "not yet" in a row moves back to the paper before.
 */
export function recordWrite(writing = {}, { date, letter, fits }) {
  const before = { count: 0, size: 0, fits: 0, misses: 0, ...writing };
  if (before.day === date) return { writing: before, moved: null, repeat: true };
  const next = { ...before, day: date, count: before.count + 1, last: { day: date, letter, fits } };
  let moved = null;
  if (fits) {
    next.fits = before.fits + 1;
    next.misses = 0;
    if (next.fits >= FIT_TO_NARROW && before.size < WRITE_SIZES.length - 1) {
      next.size = before.size + 1;
      next.fits = 0;
      moved = "narrower";
    }
  } else {
    next.misses = before.misses + 1;
    next.fits = 0;
    if (next.misses >= MISSES_TO_WIDEN && before.size > 0) {
      next.size = before.size - 1;
      next.misses = 0;
      moved = "wider";
    }
  }
  return { writing: next, moved, repeat: false };
}

export const paperLabel = (size) => (WRITE_SIZES[size] || WRITE_SIZES[0]).label;
