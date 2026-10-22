// Fixed word lists and problem generators for Today with Joyce.
// Lessons are built from these, so a child never depends on a model to invent a word or a sum.

export const LETTERS = [
  ["a", "a", "apple", true],
  ["b", "buh", "bear", false],
  ["c", "k", "cat", false],
  ["d", "d", "dog", false],
  ["e", "eh", "egg", true],
  ["f", "fff", "fish", false],
  ["g", "g", "goat", false],
  ["h", "h", "hat", false],
  ["i", "ih", "igloo", true],
  ["j", "j", "jam", false],
  ["k", "k", "kite", false],
  ["l", "lll", "lamp", false],
  ["m", "mmm", "map", false],
  ["n", "nnn", "nest", false],
  ["o", "o", "octopus", true],
  ["p", "p", "pig", false],
  ["q", "kw", "queen", false],
  ["r", "rrr", "rain", false],
  ["s", "sss", "sun", false],
  ["t", "t", "top", false],
  ["u", "uh", "umbrella", true],
  ["v", "vvv", "van", false],
  ["w", "w", "web", false],
  ["x", "ks", "box", false],
  ["y", "y", "yarn", false],
  ["z", "zzz", "zebra", false]
].map(([letter, sound, example, vowel]) => ({ letter, sound, example, vowel }));

export const letterBy = (letter) => LETTERS.find((item) => item.letter === letter);

export const CVC = {
  a: ["cat", "map", "hat", "ran", "sad", "tap", "bag", "pan", "jam", "van", "wag", "dad"],
  e: ["bed", "hen", "pen", "red", "net", "jet", "wet", "leg", "men", "web"],
  i: ["pig", "sit", "pin", "lip", "dig", "win", "kid", "mix", "rip", "six"],
  o: ["hot", "dog", "pot", "mop", "top", "log", "hop", "box", "cob", "pop"],
  u: ["bug", "cup", "sun", "run", "mud", "hug", "nut", "pup", "bus", "fun"]
};

export const DIGRAPHS = {
  sh: ["ship", "shop", "fish", "wish", "shut", "shell", "dash", "rush"],
  ch: ["chip", "chat", "chin", "chop", "much", "rich", "such", "chum"],
  th: ["thin", "math", "path", "bath", "moth", "thud"]
};

export const BLENDS = ["stop", "step", "snap", "slip", "plan", "frog", "drip", "grab", "clap", "trip", "blob", "crib"];

// High-frequency words, in a teachable order. Irregular ones are said whole, not sounded out.
export const SIGHT = [
  "the", "a", "I", "to", "and", "was", "you", "said", "are", "they",
  "have", "of", "what", "were", "there", "do", "one", "two", "who", "put",
  "want", "come", "some", "here", "where", "my", "she", "he", "we", "see",
  "look", "go", "no", "so", "for", "his", "her", "with", "that", "this",
  "is", "it", "in", "on", "at", "can", "up", "had", "be", "me"
];

export const SIGHT_IRREGULAR = new Set([
  "the", "a", "to", "was", "you", "said", "are", "they", "have", "of", "what", "were",
  "there", "do", "one", "two", "who", "put", "want", "come", "some", "where", "she",
  "for", "of", "was"
]);

export const STORIES = {
  "story-cat": {
    title: "The Cat",
    pages: [
      { text: "The cat sat.", focus: "cat" },
      { text: "The cat sat on a mat.", focus: "mat" },
      { text: "The cat had a hat.", focus: "hat" }
    ]
  },
  "story-hen": {
    title: "The Red Hen",
    pages: [
      { text: "The hen is red.", focus: "hen" },
      { text: "I see the hen.", focus: "see" },
      { text: "The hen sat on a bed.", focus: "bed" }
    ]
  },
  "story-ship": {
    title: "The Ship",
    pages: [
      { text: "I see a ship.", focus: "ship" },
      { text: "The fish is in the ship.", focus: "fish" },
      { text: "I wish for a shell.", focus: "wish" }
    ]
  }
};

export const COUNT_EMOJI = ["🐻", "🍪", "⭐", "🍎", "🐟", "🌸"];
export const PATTERN_EMOJI = ["⭐", "💙", "🍎", "🌙"];
export const COLORS = [
  { id: "red", label: "red", emoji: "🔴" },
  { id: "blue", label: "blue", emoji: "🔵" },
  { id: "yellow", label: "yellow", emoji: "🟡" },
  { id: "green", label: "green", emoji: "🟢" }
];

export function hashSeed(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function take(rng, list, n, prefer = []) {
  const first = prefer.filter((item) => list.includes(item));
  const rest = shuffle(rng, list.filter((item) => !first.includes(item)));
  return [...first, ...rest].slice(0, n);
}

function choiceItem(say, answer, labels, rng) {
  const choices = shuffle(rng, labels).map((label) => ({ id: String(label), label: String(label) }));
  return { type: "choice", say, answer: String(answer), choices };
}

function letterChoices(answer, pool, rng, count = 3) {
  const others = shuffle(rng, pool.filter((letter) => letter !== answer)).slice(0, count - 1);
  return shuffle(rng, [answer, ...others]);
}

export function itemsFor(step, seed, missed = []) {
  const rng = mulberry32(hashSeed(`${seed}:${step.id}`));
  const n = step.items || 6;
  const prefer = missed.map((item) => String(item).toLowerCase());
  if (step.activity === "hear-sound") return hearSounds(step, rng, n);
  if (step.activity === "hear-name") return hearNames(step, rng, n);
  if (step.activity === "cvc") return cvcItems(step, rng, n, prefer);
  if (step.activity === "digraph") return wordItems(step, DIGRAPHS[step.pattern], rng, n, prefer, digraphSay);
  if (step.activity === "blend") return wordItems(step, BLENDS, rng, n, prefer, () => "Tap the letters to build the word.");
  if (step.activity === "sight") return sightItems(step, rng, n, prefer);
  if (step.activity === "story") return storyItems(step);
  if (step.activity === "count") return countItems(step, rng, n);
  if (step.activity === "numbers") return numberItems(rng, n);
  if (step.activity === "compare") return compareItems(rng, n);
  if (step.activity === "pattern") return patternItems(rng, n);
  if (step.activity === "add") return addItems(step, rng, n);
  if (step.activity === "regroup") return regroupItems(step, rng, n);
  if (step.activity === "color") return colorItems(rng, n);
  return [];
}

function hearSounds(step, rng, n) {
  const pool = (step.letters || LETTERS.map((item) => item.letter)).slice();
  const picks = take(rng, pool, n);
  return picks.map((letter) => {
    const info = letterBy(letter);
    const choices = letterChoices(letter, pool, rng).map((id) => ({ id, label: id }));
    return {
      type: "choice",
      say: `Tap the letter that says ${info.sound}, like in ${info.example}.`,
      answer: letter,
      sound: info.sound,
      example: info.example,
      choices: shuffle(rng, choices),
      item: letter
    };
  });
}

const LETTER_NAMES = {
  a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "ef", g: "jee", h: "aitch", i: "eye",
  j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
  s: "ess", t: "tee", u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zee"
};

function hearNames(step, rng, n) {
  const pool = step.letters.slice();
  return take(rng, pool, n).map((letter) => {
    const choices = letterChoices(letter, pool.length > 2 ? pool : LETTERS.map((item) => item.letter), rng)
      .map((id) => ({ id, label: id.toUpperCase() }));
    return {
      type: "choice",
      say: `Tap the letter named ${LETTER_NAMES[letter]}.`,
      answer: letter,
      spoken: LETTER_NAMES[letter],
      choices: shuffle(rng, choices),
      item: letter.toUpperCase()
    };
  });
}

function wordTiles(word, rng) {
  const extras = shuffle(rng, ["b", "m", "p", "s", "t", "n", "r", "l", "d", "g"].filter((letter) => !word.includes(letter)));
  return shuffle(rng, [...word, ...extras.slice(0, 2)]);
}

const SOUND = {
  a: "ah", e: "eh", i: "ih", o: "o", u: "uh",
  b: "buh", c: "kuh", d: "duh", f: "fff", g: "guh",
  h: "huh", j: "juh", k: "kuh", l: "lll", m: "mmm",
  n: "nnn", p: "puh", q: "kwuh", r: "rrr", s: "sss",
  t: "tuh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz"
};

export function wordParts(word) {
  const parts = [];
  let i = 0;
  while (i < word.length) {
    const pair = word.slice(i, i + 2);
    if (pair === "sh" || pair === "ch" || pair === "th") {
      parts.push({ letters: pair, sound: pair });
      i += 2;
    } else {
      parts.push({ letters: word[i], sound: SOUND[word[i]] || word[i] });
      i += 1;
    }
  }
  return parts;
}

function blendSay(word) {
  const sounds = wordParts(word).map((part) => part.sound).join(", ");
  return `Say the sounds. ${sounds}. Push them together, then tap the letters.`;
}

function cvcItems(step, rng, n, prefer) {
  const words = CVC[step.vowel] || [];
  return take(rng, words, n, prefer).map((word) => ({
    type: "build",
    say: blendSay(word),
    word,
    tiles: wordTiles(word, rng),
    answer: word,
    item: word,
    parts: wordParts(word),
    thenRead: true
  }));
}

function digraphSay(word) {
  const team = word.slice(0, 2);
  const known = { sh: "sh", ch: "ch", th: "th" };
  if (known[team]) return `${team[0].toUpperCase()} and ${team[1]} together say ${known[team]}. Tap the letters to make the word.`;
  return "Tap the letters to make the word.";
}

function wordItems(step, words, rng, n, prefer, sayFor) {
  return take(rng, words, n, prefer).map((word) => ({
    type: "build",
    say: sayFor(word),
    word,
    tiles: wordTiles(word, rng),
    answer: word,
    item: word,
    parts: wordParts(word),
    thenRead: true
  }));
}

function sightItems(step, rng, n, prefer) {
  const start = step.from || 0;
  const words = SIGHT.slice(start, start + (step.span || 25));
  return take(rng, words, n, prefer).map((word) => ({
    type: "read",
    say: SIGHT_IRREGULAR.has(word.toLowerCase())
      ? `${word} is a whole word. We say it, we don't sound it out. Read it.`
      : "Read this word.",
    word,
    answer: word.toLowerCase(),
    item: word
  }));
}

function storyItems(step) {
  const story = STORIES[step.story];
  return [{
    type: "story",
    title: story.title,
    say: `This story is called ${story.title}. I'll read a page, then you read it.`,
    pages: story.pages,
    answer: story.title,
    item: story.title
  }];
}

function countItems(step, rng, n) {
  const min = step.min ?? 1;
  const max = step.max ?? 10;
  const used = new Set();
  const items = [];
  while (items.length < n) {
    const count = min + Math.floor(rng() * (max - min + 1));
    const emoji = COUNT_EMOJI[Math.floor(rng() * COUNT_EMOJI.length)];
    const key = `${emoji}${count}`;
    if (used.has(key)) continue;
    used.add(key);
    const wrong = shuffle(rng, [count - 1, count + 1, count + 2].filter((value) => value >= 0 && value !== count)).slice(0, 2);
    items.push({
      type: "count",
      say: "Tap each one as you count. Then tap how many.",
      emoji,
      count,
      answer: String(count),
      choices: shuffle(rng, [count, ...wrong]).map((value) => ({ id: String(value), label: String(value) })),
      item: `count ${count}`
    });
  }
  return items;
}

function numberItems(rng, n) {
  const pool = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, n);
  return pool.map((num) => {
    const wrong = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => value !== num)).slice(0, 2);
    return choiceItem(`What number is this?`, num, [num, ...wrong], rng);
  }).map((item, index) => ({ ...item, show: pool[index], item: `number ${pool[index]}` }));
}

function compareItems(rng, n) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    let left = 1 + Math.floor(rng() * 6);
    let right = 1 + Math.floor(rng() * 6);
    if (left === right) right = left === 6 ? 4 : left + 1;
    const fewer = rng() < 0.5;
    const emoji = COUNT_EMOJI[i % COUNT_EMOJI.length];
    const answer = fewer ? (left < right ? "left" : "right") : (left > right ? "left" : "right");
    items.push({
      type: "compare",
      say: fewer ? "Which side has fewer?" : "Which side has more?",
      emoji,
      left,
      right,
      answer,
      choices: [
        { id: "left", label: "This side" },
        { id: "right", label: "That side" }
      ],
      item: `${fewer ? "fewer" : "more"} ${left} and ${right}`
    });
  }
  return items;
}

function patternItems(rng, n) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    const [a, b] = shuffle(rng, PATTERN_EMOJI).slice(0, 2);
    const repeat = rng() < 0.5;
    const sequence = repeat ? [a, b, a, b] : [a, b, b, a];
    const answer = repeat ? a : b;
    const distractors = shuffle(rng, PATTERN_EMOJI.filter((emoji) => emoji !== answer)).slice(0, 2);
    items.push({
      type: "pattern",
      say: "What comes next?",
      sequence,
      answer,
      choices: shuffle(rng, [answer, ...distractors]).map((emoji) => ({ id: emoji, label: emoji })),
      item: `${sequence.join(" ")} next`
    });
  }
  return items;
}

function addItems(step, rng, n) {
  const maxSum = step.maxSum || 5;
  const items = [];
  const seen = new Set();
  while (items.length < n) {
    const left = Math.floor(rng() * maxSum);
    const right = Math.floor(rng() * (maxSum - left + 1));
    const key = `${left}+${right}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const sum = left + right;
    const emoji = COUNT_EMOJI[items.length % COUNT_EMOJI.length];
    const wrong = shuffle(rng, [sum - 1, sum + 1, sum + 2, left, right].filter((value) => value >= 0 && value !== sum)).slice(0, 2);
    items.push({
      type: "add",
      say: "How many altogether?",
      left,
      right,
      emoji,
      answer: String(sum),
      choices: shuffle(rng, [sum, ...wrong]).map((value) => ({ id: String(value), label: String(value) })),
      item: `${left} + ${right}`
    });
  }
  return items;
}

function regroupProblem(rng, fixed) {
  if (fixed) return { a: 27, b: 15 };
  let a = 10 + Math.floor(rng() * 80);
  let b = 10 + Math.floor(rng() * (99 - a));
  let guard = 0;
  while ((a % 10) + (b % 10) < 10 && guard < 20) {
    b = 10 + Math.floor(rng() * 80);
    if (a + b > 99) b = 99 - a;
    guard += 1;
  }
  if ((a % 10) + (b % 10) < 10) {
    a = 28;
    b = 15;
  }
  return { a, b };
}

function regroupItems(step, rng, n) {
  const count = step.fixed ? 1 : n;
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const { a, b } = regroupProblem(rng, step.fixed && i === 0);
    const ones = (a % 10) + (b % 10);
    const tens = Math.floor(a / 10) + Math.floor(b / 10) + 1;
    const total = a + b;
    items.push({
      type: "regroup",
      say: "We'll add with tens and ones. One step at a time.",
      a,
      b,
      answer: String(total),
      item: `${a} + ${b}`,
      prompts: [ ["ones", "Count all the ones. How many ones are there?", ones], ["tens", "Trade 10 ones for 1 ten. How many tens do you have now?", tens], ["total", "What number is that?", total] ].map(([id, say, answer]) => {
        const extras = shuffle(rng, [answer - 1, answer + 1, answer - 10, answer + 10].filter((value) => value >= 0 && value !== answer)).slice(0, 2);
        return {
          id,
          say,
          answer: String(answer),
          choices: shuffle(rng, [answer, ...extras]).map((value) => ({ id: String(value), label: String(value) }))
        };
      })
    });
  }
  return items;
}

function colorItems(rng, n) {
  return shuffle(rng, COLORS).slice(0, Math.min(n, COLORS.length)).map((color) => ({
    type: "choice",
    say: `Tap the ${color.label} one.`,
    answer: color.id,
    choices: shuffle(rng, COLORS).map((item) => ({ id: item.id, label: `${item.emoji} ${item.label}` })),
    item: color.label
  }));
}

/** A second explanation, still about this exact item. No model. */
export function helpLine(item, tries) {
  if (!item) return "Look again at the one we are on.";
  if (tries >= 2) return "Let's take a wiggle break. Hop five times, then we can try this one again.";
  if (item.type === "build" || item.type === "read") {
    return "Say the sounds slowly, then push them together.";
  }
  if (item.type === "count") return `Point to each ${item.emoji} one time. There are ${item.count}.`;
  if (item.type === "compare") return "Count one side, then count the other side.";
  if (item.type === "pattern") return "Say the pattern out loud, then look at what repeats.";
  if (item.type === "add") return `Count the first group, then keep counting the second group.`;
  if (item.type === "regroup") return "Start with the ones. If you have 10 or more ones, trade 10 of them for a ten.";
  if (item.type === "story") return "I'll read the page again. Then you read the same words.";
  return "Listen one more time, then tap the one that matches.";
}
