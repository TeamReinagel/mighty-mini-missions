// Letter Lights' rules: Connor's letter names, in the same four groups as Joyce's lessons
// (netlify/lib/classroom.mjs NAME_GROUPS; steps connor-names-1 to connor-names-4), then all 26.
// Readiness checklist goal KR-Read-5, "Knows the alphabet". No look or theme here (skin.mjs).

import { letterName } from "../play/letter-names.mjs";

export const GROUPS = [
  ["a", "b", "c", "d", "e", "f"],
  ["g", "h", "i", "j", "k", "l"],
  ["m", "n", "o", "p", "q", "r"],
  ["s", "t", "u", "v", "w", "x", "y", "z"]
];

const ALL = GROUPS.flat();

export const LEVELS = [
  ...GROUPS.map((letters, index) => ({
    id: `names-${index + 1}`,
    label: `${letters[0].toUpperCase()}–${letters.at(-1).toUpperCase()}`,
    steps: [`connor-names-${index + 1}`],
    skill: "Letter names",
    letters,
    flag: `letter-names-${index + 1}`,
    next: index < GROUPS.length - 1 ? `names-${index + 2}` : "all"
  })),
  { id: "all", label: "A–Z", steps: [], skill: "Letter names", letters: ALL, flag: "letters" }
];

function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A letter to find and three letters to pick from, all from the level's group. */
export function letterRound(letters, rng, { recent = [], again = "" } = {}) {
  const fresh = letters.filter((letter) => !recent.includes(letter));
  const pool = fresh.length ? fresh : letters;
  const target = again && letters.includes(again) ? again : pool[Math.floor(rng() * pool.length)];
  const wrong = shuffle(rng, letters.filter((letter) => letter !== target)).slice(0, 2);
  return { target, choices: shuffle(rng, [target, ...wrong]) };
}

export const big = (letter) => letter.toUpperCase();

export const lines = {
  prompt: (target) => `Find the letter ${letterName(target)}.`,
  miss: (picked, target) => `That one is ${letterName(picked)}. Find ${letterName(target)}.`,
  hint: (target) => `The letter ${letterName(target)} looks like this. Find the one that matches.`,
  right: (target) => `${letterName(target)}!`
};
