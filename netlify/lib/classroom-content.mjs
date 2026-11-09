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

function buildItems(step, seed, missed) {
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
  if (step.activity === "skip") return skipItems(rng, n);
  if (step.activity === "odd-even") return oddEvenItems(rng, n);
  if (step.activity === "bar-graph") return graphItems(rng, n);
  if (step.activity === "shapes-3d") return solidItems(rng, n, prefer);
  if (step.activity === "compound") return compoundItems(rng, n, prefer);
  if (step.activity === "contraction") return contractionItems(rng, n, prefer);
  if (step.activity === "parts-of-speech") return partsItems(rng, n);
  if (step.activity === "sentences") return sentenceItems(rng, n);
  return [];
}

function itemKey(item) {
  return String(item?.item || item?.word || "").toLowerCase();
}

/** `avoid` lists items the child practiced recently, so a cold check can use different ones. */
export function itemsFor(step, seed, missed = [], avoid = []) {
  const n = step.items || 6;
  const skip = new Set((avoid || []).map((item) => String(item).toLowerCase()));
  if (!skip.size) return buildItems(step, seed, missed);
  const wide = buildItems({ ...step, items: n + Math.min(skip.size + 4, 12) }, seed, missed);
  const fresh = wide.filter((item) => !skip.has(itemKey(item)));
  if (fresh.length >= n) return fresh.slice(0, n);
  return [...fresh, ...wide.filter((item) => !fresh.includes(item))].slice(0, n);
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
  let spins = 0;
  while (items.length < n && spins < n * 30) {
    spins += 1;
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
  let spins = 0;
  while (items.length < n && spins < n * 30) {
    spins += 1;
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
  if (item.hint) return item.hint;
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

// ---------- First Grade gaps for Max: math ----------

function numberChoices(answer, others, rng) {
  const set = [answer];
  for (const value of others) if (value > 0 && !set.includes(value)) set.push(value);
  return set.slice(0, 3);
}

function skipItems(rng, n) {
  const items = [];
  const steps = [2, 5, 10];
  for (let i = 0; i < n; i += 1) {
    const by = steps[i % steps.length];
    const start = by * (1 + Math.floor(rng() * (by === 2 ? 20 : by === 5 ? 15 : 8)));
    const shown = [start, start + by, start + 2 * by];
    const answer = start + 3 * by;
    const choices = numberChoices(answer, [answer + by, answer - 1, answer + 1], rng);
    items.push({
      ...choiceItem(`Count by ${by}s. What number comes next?`, answer, choices, rng),
      show: `${shown.join(", ")}, ?`,
      item: `${by}s from ${start}`,
      hint: `Each jump adds ${by}. ${shown.at(-1)} plus ${by} is the next number.`
    });
  }
  return items;
}

function oddEvenItems(rng, n) {
  const pool = shuffle(rng, Array.from({ length: 39 }, (_, i) => i + 2));
  return pool.slice(0, n).map((value) => {
    const even = value % 2 === 0;
    const last = value % 10;
    return {
      type: "choice",
      say: `Is ${value} odd or even?`,
      show: String(value),
      answer: even ? "even" : "odd",
      choices: [{ id: "odd", label: "Odd" }, { id: "even", label: "Even" }],
      item: String(value),
      hint: `Look at the last digit, ${last}. Numbers ending in 0, 2, 4, 6, or 8 are even. Numbers ending in 1, 3, 5, 7, or 9 are odd.`
    };
  });
}

const GRAPHS = [
  { title: "Favorite fruit", unit: "kids", rows: [["🍎", "apples"], ["🍌", "bananas"], ["🍇", "grapes"], ["🍓", "strawberries"]] },
  { title: "Pets on our street", unit: "pets", rows: [["🐶", "dogs"], ["🐱", "cats"], ["🐟", "fish"], ["🐰", "rabbits"]] },
  { title: "Weather this month", unit: "days", rows: [["☀️", "sunny"], ["🌧️", "rainy"], ["☁️", "cloudy"], ["❄️", "snowy"]] },
  { title: "Birds at the feeder", unit: "birds", rows: [["🐦", "sparrows"], ["🐤", "finches"], ["🦅", "hawks"], ["🦉", "owls"]] }
];

function graphItems(rng, n) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    const g = GRAPHS[Math.floor(rng() * GRAPHS.length)];
    const rows = shuffle(rng, g.rows).slice(0, 3);
    const values = shuffle(rng, [2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
    const bars = rows.map(([emoji, label], k) => ({ emoji, label, value: values[k] }));
    const graph = { title: g.title, max: 8, bars };
    const kind = i % 3;
    const [a, b] = bars;
    if (kind === 0) {
      items.push({
        ...choiceItem(`How many ${a.label}?`, a.value, numberChoices(a.value, [a.value + 1, a.value - 1, a.value + 2], rng), rng),
        type: "graph", graph, item: `${g.title}: how many ${a.label}`,
        hint: `Find the ${a.label} bar. Follow its end down to the numbers.`
      });
    } else if (kind === 1) {
      const most = bars.reduce((x, y) => (y.value > x.value ? y : x));
      items.push({
        type: "graph", graph, say: `Which has the most ${g.unit}?`, answer: most.label,
        choices: shuffle(rng, bars).map((bar) => ({ id: bar.label, label: `${bar.emoji} ${bar.label}` })),
        item: `${g.title}: most`,
        hint: "The longest bar shows the most."
      });
    } else {
      const [big, small] = a.value >= b.value ? [a, b] : [b, a];
      const diff = big.value - small.value;
      items.push({
        ...choiceItem(`How many more ${big.label} than ${small.label}?`, diff, numberChoices(diff, [diff + 1, diff + 2, big.value], rng), rng),
        type: "graph", graph, item: `${g.title}: ${big.label} minus ${small.label}`,
        hint: `Read both bars. ${big.label} is ${big.value}. ${small.label} is ${small.value}. Count up from ${small.value} to ${big.value}.`
      });
    }
  }
  return items;
}

const SOLIDS = [
  { emoji: "⚽", thing: "soccer ball", shape: "sphere" },
  { emoji: "🌍", thing: "globe", shape: "sphere" },
  { emoji: "🎲", thing: "die", shape: "cube" },
  { emoji: "🧊", thing: "ice cube", shape: "cube" },
  { emoji: "🥫", thing: "soup can", shape: "cylinder" },
  { emoji: "🔋", thing: "battery", shape: "cylinder" },
  { emoji: "🍦", thing: "ice cream cone", shape: "cone" },
  { emoji: "📦", thing: "box", shape: "rectangular prism" },
  { emoji: "🧱", thing: "brick", shape: "rectangular prism" }
];
const SOLID_NAMES = ["sphere", "cube", "cylinder", "cone", "rectangular prism"];

function solidItems(rng, n, prefer) {
  const picked = take(rng, SOLIDS.map((s) => s.thing), n, prefer).map((thing) => SOLIDS.find((s) => s.thing === thing));
  return picked.map((solid) => {
    const others = shuffle(rng, SOLID_NAMES.filter((name) => name !== solid.shape)).slice(0, 2);
    return {
      ...choiceItem(`What solid shape is a ${solid.thing}?`, solid.shape, [solid.shape, ...others], rng),
      show: solid.emoji,
      item: solid.thing,
      hint: {
        sphere: "Round all over, like a ball. That's a sphere.",
        cube: "Six flat faces, all the same square. That's a cube.",
        cylinder: "Two flat circles on the ends and a curved side, like a can. That's a cylinder.",
        cone: "A flat circle at one end and a point at the other. That's a cone.",
        "rectangular prism": "Six flat faces, and some are longer rectangles, like a box. That's a rectangular prism."
      }[solid.shape]
    };
  });
}

// ---------- First Grade gaps for Max: words ----------

const COMPOUNDS = [
  ["sun", "shine"], ["rain", "bow"], ["cup", "cake"], ["foot", "ball"], ["bed", "room"], ["sun", "flower"],
  ["snow", "man"], ["tooth", "brush"], ["back", "pack"], ["mail", "box"], ["pop", "corn"], ["star", "fish"],
  ["dog", "house"], ["rain", "coat"], ["gold", "fish"], ["play", "ground"], ["bath", "tub"], ["air", "plane"],
  ["cow", "boy"], ["fire", "truck"]
];

function compoundItems(rng, n, prefer) {
  const words = COMPOUNDS.map(([a, b]) => a + b);
  const chosen = take(rng, words, n, prefer);
  return chosen.map((word, i) => {
    const [a, b] = COMPOUNDS[words.indexOf(word)];
    if (i % 2 === 0) {
      const others = shuffle(rng, words.filter((w) => w !== word && !w.startsWith(a))).slice(0, 2);
      return { ...choiceItem(`Put the two words together. ${a} and ${b} make what word?`, word, [word, ...others], rng), show: `${a} + ${b}`, item: word, hint: `Say ${a}, then say ${b} right after it. ${a}${b}.` };
    }
    const right = `${a} + ${b}`;
    const wrong = [`${word.slice(0, a.length - 1)} + ${word.slice(a.length - 1)}`, `${word.slice(0, a.length + 1)} + ${word.slice(a.length + 1)}`];
    return { ...choiceItem(`Which two words make ${word}?`, right, [right, ...wrong], rng), show: word, item: word, hint: `Look for a small word you know at the start. Then see what word is left.` };
  });
}

const CONTRACTIONS = [
  ["do not", "don't"], ["can not", "can't"], ["is not", "isn't"], ["did not", "didn't"], ["was not", "wasn't"],
  ["I am", "I'm"], ["it is", "it's"], ["we are", "we're"], ["you are", "you're"], ["they are", "they're"],
  ["I will", "I'll"], ["she is", "she's"], ["he is", "he's"], ["let us", "let's"], ["have not", "haven't"]
];

function contractionItems(rng, n, prefer) {
  const shorts = CONTRACTIONS.map(([, short]) => short);
  const chosen = take(rng, shorts, n, prefer);
  return chosen.map((short, i) => {
    const long = CONTRACTIONS[shorts.indexOf(short)][0];
    const others = shuffle(rng, CONTRACTIONS.filter(([, s]) => s !== short)).slice(0, 2);
    if (i % 2 === 0) {
      return { ...choiceItem(`Which word is the short way to say ${long}?`, short, [short, ...others.map(([, s]) => s)], rng), show: long, item: short, hint: `The apostrophe takes the place of the missing letters in ${long}.` };
    }
    return { ...choiceItem(`What two words make ${short}?`, long, [long, ...others.map(([l]) => l)], rng), show: short, item: short, hint: `Put the missing letters back where the apostrophe is.` };
  });
}

const SENTENCES = [
  ["The big dog runs.", "dog", "runs", "big"], ["A red bird sings.", "bird", "sings", "red"],
  ["The happy girl jumps.", "girl", "jumps", "happy"], ["My little cat sleeps.", "cat", "sleeps", "little"],
  ["The tall man walks.", "man", "walks", "tall"], ["A green frog hops.", "frog", "hops", "green"],
  ["The cold wind blows.", "wind", "blows", "cold"], ["Two small fish swim.", "fish", "swim", "small"],
  ["The loud train stops.", "train", "stops", "loud"], ["A soft rabbit hides.", "rabbit", "hides", "soft"],
  ["The fast car zooms.", "car", "zooms", "fast"], ["My brave brother climbs.", "brother", "climbs", "brave"]
];
const KINDS = [
  { key: 1, name: "noun", say: "Which word is the noun, the naming word?", hint: "A noun names a person, place, or thing." },
  { key: 2, name: "verb", say: "Which word is the verb, the action word?", hint: "A verb is what someone or something does." },
  { key: 3, name: "adjective", say: "Which word is the adjective, the describing word?", hint: "An adjective tells what something is like: its size, color, or feeling." }
];

function partsItems(rng, n) {
  const rows = shuffle(rng, SENTENCES).slice(0, n);
  return rows.map((row, i) => {
    const kind = KINDS[i % KINDS.length];
    const answer = row[kind.key];
    return { ...choiceItem(kind.say, answer, [row[1], row[2], row[3]], rng), show: row[0], showSize: "sentence", item: `${kind.name}: ${row[0]}`, hint: kind.hint };
  });
}

function sentenceItems(rng, n) {
  const rows = shuffle(rng, SENTENCES).slice(0, n);
  return rows.map(([sentence, noun, verb, adj], i) => {
    if (i % 2 === 0) {
      const words = sentence.replace(".", "").split(" ");
      const lower = sentence[0].toLowerCase() + sentence.slice(1, -1);
      const scrambled = [...words.slice(1), words[0].toLowerCase()].join(" ") + ".";
      const fragment = words.slice(0, -1).join(" ");
      return {
        ...choiceItem("Which one is a complete sentence?", sentence, [sentence, lower, fragment, scrambled], rng),
        item: `sentence: ${sentence}`,
        hint: "A sentence tells a whole idea, starts with a capital letter, and ends with a period."
      };
    }
    const blank = sentence.replace(`${adj} `, "___ ");
    return {
      ...choiceItem(`Pick a describing word for the blank.`, adj, [adj, verb, noun], rng),
      show: blank,
      showSize: "sentence",
      item: `describe: ${sentence}`,
      hint: "The blank needs a word that tells what the thing is like."
    };
  });
}
