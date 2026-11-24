// Word Tree's rules: which words, which choices. No look or theme here (that is skin.mjs).
// The 50 words are Joyce's sight-word list in the same order (netlify/lib/classroom-content.mjs
// SIGHT), so set 1 is the December goal (K-Dec-Reading-1) and set 2 is January's.
// word-tree/words.test.mjs checks the two lists stay the same.

import { letterName } from "../play/letter-names.mjs";

export const SIGHT = [
  "the", "a", "I", "to", "and", "was", "you", "said", "are", "they",
  "have", "of", "what", "were", "there", "do", "one", "two", "who", "put",
  "want", "come", "some", "here", "where", "my", "she", "he", "we", "see",
  "look", "go", "no", "so", "for", "his", "her", "with", "that", "this",
  "is", "it", "in", "on", "at", "can", "up", "had", "be", "me"
];

export const LEVELS = [
  { id: "set-1", label: "Words 1", steps: ["gabi-sight-1"], skill: "Sight words", words: SIGHT.slice(0, 25), flag: "sight-1", next: "set-2" },
  { id: "set-2", label: "Words 2", steps: ["gabi-sight-2"], skill: "Sight words", words: SIGHT.slice(25, 50), flag: "sight-2" }
];

/** How a word is printed: "I" stays a capital, everything else is lowercase. */
export function shown(word) {
  return word === "I" ? "I" : word.toLowerCase();
}

function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Look-alikes make the choice about the word itself: same first letter first, then same length.
function lookAlike(target, other) {
  let score = 0;
  if (other[0].toLowerCase() === target[0].toLowerCase()) score += 2;
  if (other.length === target.length) score += 1;
  return score;
}

/**
 * One problem: a word to find and three words to choose from. `recent` words are not asked
 * again right away. `again` (a word missed earlier) comes back as the target when given.
 */
export function wordRound(words, rng, { recent = [], again = "" } = {}) {
  const fresh = words.filter((word) => !recent.includes(word));
  const pool = fresh.length ? fresh : words;
  const target = again && words.includes(again) ? again : pool[Math.floor(rng() * pool.length)];
  const others = shuffle(rng, words.filter((word) => word.toLowerCase() !== target.toLowerCase()))
    .sort((a, b) => lookAlike(target, b) - lookAlike(target, a));
  // One look-alike and one other, so the round is fair but still about reading.
  const near = others[0];
  const far = others.slice(1)[Math.floor(rng() * Math.max(1, others.length - 1))] || others[1];
  return { target, choices: shuffle(rng, [target, near, far]) };
}

export function prompt(target) {
  return `Find the word ${shown(target)}.`;
}

/**
 * A clue that tells the target apart from the words still on screen: its first letter if no
 * other word shares it, else its last letter, else its length.
 */
export function clue(target, others = []) {
  const t = target.toLowerCase();
  const rest = others.map((word) => word.toLowerCase()).filter((word) => word !== t);
  if (t.length === 1) return `The word ${shown(target)} is just one letter.`;
  if (!rest.some((word) => word[0] === t[0])) return `The word ${shown(target)} starts with ${letterName(t[0])}.`;
  if (!rest.some((word) => word.at(-1) === t.at(-1))) return `The word ${shown(target)} ends with ${letterName(t.at(-1))}.`;
  return `The word ${shown(target)} has ${t.length} letters.`;
}

/** What a miss says: the word they tapped, then a clue about the one to find. */
export function missLine(picked, target, left = []) {
  return `That one says ${shown(picked)}. Find ${shown(target)}. ${clue(target, left)}`;
}

export function hintLine(target, left = []) {
  return `Find ${shown(target)}. ${clue(target, left)}`;
}
