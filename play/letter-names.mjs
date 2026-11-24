// How each letter's name is spoken. Spelled out so the voice says "bee", not "b".
// Same table as Joyce's lessons (netlify/lib/classroom-content.mjs).
export const LETTER_NAMES = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "ef", g: "jee", h: "aitch", i: "eye",
  j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
  s: "ess", t: "tee", u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zee"
};

export function letterName(letter) {
  return LETTER_NAMES[String(letter).toLowerCase()] || String(letter);
}
