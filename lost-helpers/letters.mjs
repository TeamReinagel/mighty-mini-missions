// Lowercase stroke paths shared with Joyce's handwriting card (netlify/lib/handwriting.mjs).
// The desk shop traces these on the glass. A clean trace is practice, not paper writing.

const C_START = "M 64 56 A 20 20 0 1 0 64 84";
const HILL = "M 34 90 L 34 64 Q 36 50 50 50 Q 64 50 64 64 L 64 90";
const BELLY = "M 34 90 L 34 68 Q 38 50 52 50 Q 68 50 68 70 Q 68 90 52 90 Q 40 90 34 86";

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

// Pre-writing paths in the same 100 x 120 box as letter strokes.
export const PREWRITE = [
  { id: "down", name: "straight down", cue: "Start at the top. Trace straight down.", d: "M 50 18 L 50 102" },
  { id: "across", name: "straight across", cue: "Start on the left. Trace straight across.", d: "M 18 60 L 82 60" },
  { id: "slant", name: "a slant", cue: "Start at the top left. Slide down to the bottom right.", d: "M 28 20 L 72 100" },
  { id: "curve", name: "a curve", cue: "Start at the top. Curve down like a smile.", d: "M 22 36 Q 50 110 78 36" },
  { id: "circle", name: "a circle", cue: "Start at the top. Go around and close the circle.", d: "M 50 28 A 28 28 0 1 1 49.9 28" },
  { id: "zigzag", name: "a zigzag", cue: "Start on the left. Zigzag across.", d: "M 16 40 L 34 80 L 52 40 L 70 80 L 88 40" },
  { id: "loop", name: "a loop", cue: "Start on the left. Make a loop, then finish on the right.", d: "M 18 70 C 18 30 50 30 50 60 C 50 90 82 90 82 50" },
  { id: "cross", name: "a cross", cue: "Trace down, then across the middle.", d: "M 50 18 L 50 102 M 22 60 L 78 60" },
  { id: "hill", name: "a hill", cue: "Start on the left. Up the hill, then down.", d: "M 20 90 L 20 60 Q 20 28 50 28 Q 80 28 80 60 L 80 90" }
];
