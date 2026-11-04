// Shop doors, who can open them, and the finds inside.
import { LETTER_NAMES, WRITE_LETTERS, PREWRITE } from "./letters.mjs";
import { THINGS, THING_SRC, SHAPES, shuffle, numberRound, sizeRound, colorRound, kindRound } from "../play/readiness.mjs";

export const NEED = 4;

export const STORY = "Before the shops opened, the helpers ran out to play and forgot the way home. They are hiding along the street. Step into a shop, listen, and find the one that belongs there. They are jumpy. Miss, and they dart off again. Find that shop's helper right the first time, four times in a row, and they curl up and stay.";

const COLORS = [
  { id: "red", name: "red", src: "../color-tap/assets/apple.jpg" },
  { id: "blue", name: "blue", src: "../color-tap/assets/blue.jpg" },
  { id: "yellow", name: "yellow", src: "../color-tap/assets/lemon.jpg" },
  { id: "green", name: "green", src: "../color-tap/assets/pear.jpg" }
];

const LETTERS = [
  { letter: "a", word: "apple", src: "../color-tap/assets/apple.jpg" },
  { letter: "m", word: "ball", src: "../color-tap/assets/ball.jpg" },
  { letter: "s", word: "sun", src: "assets/tile.jpg" },
  { letter: "t", word: "toy", src: "../color-tap/assets/duck.jpg" },
  { letter: "p", word: "pear", src: "../color-tap/assets/pear.jpg" },
  { letter: "n", word: "nest", src: "assets/bun.png" },
  { letter: "c", word: "cup", src: "../color-tap/assets/cup.jpg" },
  { letter: "b", word: "ball", src: "../color-tap/assets/ball.jpg" },
  { letter: "d", word: "duck", src: "../color-tap/assets/duck.jpg" },
  { letter: "g", word: "frog", src: "../color-tap/assets/frog.jpg" }
];

const COINS = [
  { id: 1, name: "penny", cents: 1, src: "../coin-record-run/assets/coin_1.png" },
  { id: 5, name: "nickel", cents: 5, src: "../coin-record-run/assets/coin_5.png" },
  { id: 10, name: "dime", cents: 10, src: "../coin-record-run/assets/coin_10.png" },
  { id: 25, name: "quarter", cents: 25, src: "../coin-record-run/assets/coin_25.png" }
];

const SIGHT = [
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "as", "with", "his", "they", "I",
  "at", "be", "this", "have", "from", "or", "one", "had", "by", "word",
  "but", "not", "what", "all", "were", "we", "when", "your", "can", "said",
  "calls", "small", "real", "always", "almost", "would", "should", "place", "their", "our"
];

const HOMOPHONES = [
  ["to", "two", "too"], ["for", "four"], ["there", "their"], ["write", "right"],
  ["no", "know"], ["one", "won"], ["by", "buy"], ["be", "bee"], ["see", "sea"],
  ["I", "eye"], ["hear", "here"], ["our", "hour"], ["would", "wood"], ["which", "witch"]
];

const RHYMES = [
  { word: "cat", family: ["hat", "bat", "mat"], decoy: ["cup", "sun", "dog"] },
  { word: "sun", family: ["fun", "run"], decoy: ["moon", "star", "cup"] },
  { word: "pig", family: ["big", "dig", "wig"], decoy: ["dog", "cat", "hat"] },
  { word: "cake", family: ["make", "take", "lake"], decoy: ["cookie", "bun", "pie"] },
  { word: "star", family: ["car", "far", "jar"], decoy: ["moon", "sun", "sky"] },
  { word: "ball", family: ["call", "tall", "fall"], decoy: ["bat", "toy", "cup"] }
];

const PATTERN_PIECES = [
  { id: "bun", name: "bun", src: "assets/bun.png" },
  { id: "duck", name: "duck", src: "../color-tap/assets/duck.jpg" },
  { id: "ball", name: "ball", src: "../color-tap/assets/ball.jpg" },
  { id: "apple", name: "apple", src: "../color-tap/assets/apple.jpg" },
  { id: "coin", name: "coin", src: "../coin-record-run/assets/coin_1.png" },
  { id: "frog", name: "frog", src: "../color-tap/assets/frog.jpg" }
];

// Percents sit on the painted storefronts in assets/street.jpg (three rows around the square).
export const SHOPS = [
  { id: "path", title: "Path Shop", skill: "Pre-writing", helper: "assets/helper-path.png", x: 1, y: 4, w: 18, h: 28 },
  { id: "paint", title: "Paint Shop", skill: "Colors", helper: "assets/helper-paint.png", x: 20, y: 3, w: 18, h: 28 },
  { id: "toys", title: "Toy Shop", skill: "Shapes", helper: "assets/helper-toys.png", x: 39, y: 2, w: 18, h: 28 },
  { id: "market", title: "Market", skill: "Counting", helper: "assets/helper-market.png", x: 58, y: 2, w: 18, h: 28 },
  { id: "book", title: "Book Shop", skill: "Sight words", helper: "assets/helper-book.png", x: 77, y: 3, w: 20, h: 29 },
  { id: "desk", title: "Desk", skill: "Letter writing", helper: "assets/helper-desk.png", x: 1, y: 34, w: 18, h: 27 },
  { id: "garden", title: "Garden", skill: "Bigger and smaller", helper: "assets/helper-garden.png", x: 20, y: 33, w: 18, h: 28 },
  { id: "post", title: "Post", skill: "Letter names", helper: "assets/helper-post.png", x: 39, y: 32, w: 18, h: 28 },
  { id: "bell", title: "Bell Shop", skill: "Letter sounds", helper: "assets/helper-bell.png", x: 58, y: 31, w: 18, h: 29 },
  { id: "bakery", title: "Bakery", skill: "Adding and subtracting", helper: "assets/helper-bakery.png", x: 77, y: 33, w: 20, h: 29 },
  { id: "quilt", title: "Quilt Shop", skill: "Patterns", helper: "assets/helper-quilt.png", x: 6, y: 64, w: 28, h: 29 },
  { id: "laundry", title: "Laundry", skill: "Sorting", helper: "assets/helper-laundry.png", x: 36, y: 64, w: 28, h: 29 },
  { id: "coins", title: "Coin Shop", skill: "Coins", helper: "assets/helper-coins.png", x: 67, y: 64, w: 28, h: 29 }
];

const READY_KEY = "mighty-ready.v1";

function readyFlags(kidId) {
  try {
    const all = JSON.parse(localStorage.getItem(READY_KEY) || "{}");
    return all?.[kidId] || {};
  } catch {
    return {};
  }
}

function shopHome(state, id) {
  return Boolean(state.shops?.[id]?.home);
}

export function defaultState(kidId) {
  const shops = {};
  for (const shop of SHOPS) shops[shop.id] = { streak: 0, home: false };
  if (kidId === "max") {
    for (const id of ["paint", "toys", "market", "garden", "post", "bell", "path"]) {
      shops[id] = { streak: NEED, home: true };
    }
    shops.quilt = { streak: 0, home: false, hard: true };
    shops.laundry = { streak: 0, home: false, hard: true };
  }
  return { storyHeard: false, shops };
}

export function shopOpen(kidId, shopId, state) {
  const flags = readyFlags(kidId);
  if (kidId === "ethan") {
    return ["paint", "market", "quilt", "laundry", "path"].includes(shopId);
  }
  if (kidId === "connor") {
    if (shopId === "bell") return Boolean(flags.letters);
    if (shopId === "desk") return shopHome(state, "path");
    if (["coins", "book", "bakery"].includes(shopId)) return false;
    return ["paint", "toys", "market", "garden", "post", "quilt", "laundry", "path", "bell", "desk"].includes(shopId);
  }
  if (kidId === "gabi") {
    if (["coins", "book", "bakery"].includes(shopId)) return false;
    return ["toys", "market", "garden", "post", "bell", "quilt", "laundry", "path", "desk"].includes(shopId);
  }
  if (kidId === "max") return true;
  return true;
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function choices(rng, right, decoys, n = 3) {
  const pool = shuffle(rng, decoys.filter((item) => item !== right)).slice(0, n - 1);
  return shuffle(rng, [right, ...pool]);
}

function tile(label) {
  return { kind: "tile", label };
}

function pic(src, label, value) {
  return { kind: "pic", src, label, value: value ?? label };
}

export function makeFind(shopId, kidId, state, rng) {
  const hard = Boolean(state.shops?.[shopId]?.hard) || kidId === "max";

  if (shopId === "paint") {
    const want = pick(rng, COLORS);
    const alts = choices(rng, want, COLORS);
    return {
      skill: "Colors",
      item: want.id,
      prompt: `Find ${want.name}.`,
      miss: (choice) => `That one is ${choice.label}. Look for ${want.name}.`,
      options: alts.map((c) => pic(c.src, c.name, c.id)),
      right: (value) => value === want.id
    };
  }

  if (shopId === "toys") {
    const shapes = SHAPES.map((entry) => ({ ...entry, src: `../shape-tap/assets/${entry.id}.jpg` }));
    const want = pick(rng, shapes);
    const alts = choices(rng, want, shapes);
    return {
      skill: "Shapes",
      item: want.id,
      prompt: `Find the ${want.name}.`,
      miss: (choice) => `That one is a ${choice.label}. Look for the ${want.name}.`,
      options: alts.map((entry) => pic(entry.src, entry.name, entry.id)),
      right: (value) => value === want.id
    };
  }

  if (shopId === "market") {
    const max = kidId === "ethan" ? 3 : 10;
    const deal = numberRound(rng, { min: 1, max, n: 3 });
    return {
      skill: "Counting",
      item: String(deal.target),
      prompt: `Find ${deal.target}.`,
      miss: (choice) => `That is ${choice.label}. Look for ${deal.target}.`,
      options: deal.choices.map((n) => ({
        kind: "count",
        value: String(n),
        label: String(n),
        count: n,
        src: "assets/bun.png"
      })),
      right: (value) => value === String(deal.target)
    };
  }

  if (shopId === "garden") {
    if (rng() < 0.5) {
      const high = 4 + Math.floor(rng() * 3);
      const low = 1 + Math.floor(rng() * 2);
      const want = rng() < 0.5 ? "more" : "less";
      return {
        skill: "Bigger and smaller",
        item: want,
        prompt: want === "more" ? "Which has more?" : "Which has less?",
        miss: () => "Count the buns, then try again.",
        options: shuffle(rng, [
          { kind: "count", value: "more", label: "more", count: high, src: "assets/bun.png" },
          { kind: "count", value: "less", label: "less", count: low, src: "assets/bun.png" }
        ]),
        right: (value) => value === want
      };
    }
    const deal = sizeRound(rng, THINGS, 2);
    return {
      skill: "Bigger and smaller",
      item: deal.ask,
      prompt: deal.ask === "bigger" ? "Which one is bigger?" : "Which one is smaller?",
      miss: () => "Look at the sizes, then try again.",
      options: deal.sizes.map((size) => ({
        kind: "size",
        value: size,
        label: size,
        size,
        src: THING_SRC[deal.thing.id]
      })),
      right: (value) => value === deal.answer
    };
  }

  if (shopId === "post") {
    const want = pick(rng, LETTERS);
    const alts = choices(rng, want, LETTERS);
    return {
      skill: "Letter names",
      item: want.letter,
      prompt: `Find the letter ${want.letter}. ${want.word} starts with ${want.letter}.`,
      miss: (choice) => `That is ${choice.label}. Look for ${want.letter}.`,
      options: alts.map((entry) => tile(entry.letter)),
      right: (value) => value === want.letter
    };
  }

  if (shopId === "bell") {
    const want = pick(rng, LETTERS);
    const alts = choices(rng, want, LETTERS);
    return {
      skill: "Letter sounds",
      item: `/${want.letter}/`,
      prompt: `${want.word}. What letter does ${want.word} start with?`,
      miss: (choice) => `${want.word} starts with ${want.letter}. Try again.`,
      options: alts.map((entry) => tile(entry.letter)),
      right: (value) => value === want.letter
    };
  }

  if (shopId === "quilt") {
    const pieces = shuffle(rng, PATTERN_PIECES);
    if (kidId === "ethan" || (!hard && kidId !== "max")) {
      const [a, b] = pieces;
      const abab = rng() < 0.5;
      const seq = abab ? [a, b, a, b] : [a, b, b, a];
      const answer = abab ? a : b;
      return {
        skill: "Patterns",
        item: abab ? "abab" : "aabb",
        prompt: `${seq.map((p) => p.name).join(", ")}. Who comes next?`,
        miss: () => "Say the row out loud, then look at what repeats.",
        sequence: seq,
        options: shuffle(rng, [a, b, pieces[2]]).map((p) => pic(p.src, p.name, p.id)),
        right: (value) => value === answer.id
      };
    }
    if (rng() < 0.5) {
      const [a, b, c] = pieces;
      const seq = [a, b, c, a, b];
      return {
        skill: "Patterns",
        item: "abcabc",
        prompt: `${seq.map((p) => p.name).join(", ")}. Who comes next?`,
        miss: () => "Say the row out loud. Listen for the three that repeat.",
        sequence: seq,
        options: shuffle(rng, [a, b, c]).map((p) => pic(p.src, p.name, p.id)),
        right: (value) => value === c.id
      };
    }
    const counts = [1, 2, 3];
    return {
      skill: "Patterns",
      item: "grow",
      prompt: "One bun, two buns, three buns. What comes next?",
      miss: () => "The row grows by one each time.",
      sequence: counts.map((n) => ({ id: String(n), name: `${n}`, count: n, src: "assets/bun.png" })),
      options: shuffle(rng, [2, 3, 4]).map((n) => ({
        kind: "count",
        value: String(n),
        label: String(n),
        count: n,
        src: "assets/bun.png"
      })),
      right: (value) => value === "4"
    };
  }

  if (shopId === "laundry") {
    if (!hard || kidId !== "max") {
      const byKind = kidId !== "ethan" && rng() < 0.5;
      const deal = byKind ? kindRound(rng) : colorRound(rng);
      return {
        skill: "Sorting",
        item: `${deal.by}-${deal.item.id}`,
        prompt: deal.by === "kind"
          ? `Put the ${deal.item.name} with the same kind.`
          : `Put the ${deal.item.name} with the same color.`,
        miss: (choice) => `That basket is for something else. Try the matching one.`,
        held: pic(THING_SRC[deal.item.id], deal.item.name, deal.item.id),
        options: deal.models.map((model) => pic(THING_SRC[model.id], `${model.color} ${model.kind}`, model.id)),
        right: (value) => {
          const model = deal.models.find((entry) => entry.id === value);
          if (!model) return false;
          return deal.by === "kind" ? model.kind === deal.item.kind : model.color === deal.item.color;
        }
      };
    }
    const things = shuffle(rng, THINGS);
    const item = things[0];
    const byColor = rng() < 0.5;
    const sameColor = things.find((entry) => entry.id !== item.id && entry.color === item.color);
    const sameKind = things.find((entry) => entry.id !== item.id && entry.kind === item.kind);
    const other = things.find((entry) => entry.id !== item.id && entry.color !== item.color && entry.kind !== item.kind);
    const models = shuffle(rng, [sameColor, sameKind, other].filter(Boolean)).slice(0, 3);
    return {
      skill: "Sorting",
      item: `hard-${byColor ? "color" : "kind"}-${item.id}`,
      prompt: byColor
        ? `Sort by color. Put the ${item.name} with the same color.`
        : `Sort by kind. Put the ${item.name} with the same kind.`,
      miss: () => byColor ? "Look only at the color." : "Look only at the kind: food or toy.",
      held: pic(THING_SRC[item.id], item.name, item.id),
      options: models.map((model) => pic(THING_SRC[model.id], `${model.color} ${model.kind}`, model.id)),
      right: (value) => {
        const model = models.find((entry) => entry.id === value);
        if (!model) return false;
        return byColor ? model.color === item.color : model.kind === item.kind;
      }
    };
  }

  if (shopId === "coins") {
    const pool = hard ? COINS : COINS.filter((c) => c.cents <= 5);
    if (rng() < 0.5) {
      const want = pick(rng, pool);
      const alts = choices(rng, want, pool);
      return {
        skill: "Coins",
        item: want.name,
        prompt: `Find the ${want.name}.`,
        miss: (choice) => `That is a ${choice.label}. Look for the ${want.name}.`,
        options: alts.map((c) => pic(c.src, c.name, c.name)),
        right: (value) => value === want.name
      };
    }
    const want = pick(rng, pool);
    const amounts = choices(rng, want.cents, pool.map((c) => c.cents));
    return {
      skill: "Coins",
      item: `${want.cents}c`,
      prompt: `A ${want.name} is worth how many cents?`,
      miss: () => `A ${want.name} is ${want.cents} ${want.cents === 1 ? "cent" : "cents"}.`,
      held: pic(want.src, want.name, want.name),
      options: amounts.map((n) => tile(`${n}`)),
      right: (value) => value === String(want.cents)
    };
  }

  if (shopId === "book") {
    if (rng() < 0.45) {
      const rhyme = pick(rng, RHYMES);
      const answer = pick(rng, rhyme.family);
      const decoys = shuffle(rng, rhyme.decoy).slice(0, 2);
      return {
        skill: "Rhyming",
        item: `${rhyme.word}-${answer}`,
        prompt: `What rhymes with ${rhyme.word}?`,
        miss: () => `${answer} rhymes with ${rhyme.word}. Try again.`,
        options: shuffle(rng, [answer, ...decoys]).map((word) => tile(word)),
        right: (value) => value === answer
      };
    }
    const want = pick(rng, SIGHT);
    const group = HOMOPHONES.find((set) => set.some((w) => w.toLowerCase() === want.toLowerCase())) || [];
    const decoys = shuffle(rng, SIGHT.filter((w) => w.toLowerCase() !== want.toLowerCase() && !group.map((g) => g.toLowerCase()).includes(w.toLowerCase()))).slice(0, 2);
    return {
      skill: "Sight words",
      item: want,
      prompt: `Find the word ${want}.`,
      miss: (choice) => `That says ${choice.label}. Look for ${want}.`,
      options: shuffle(rng, [want, ...decoys]).map((word) => tile(word)),
      right: (value) => value.toLowerCase() === want.toLowerCase()
    };
  }

  if (shopId === "bakery") {
    const within = hard ? 20 : 10;
    const add = rng() < 0.55;
    const a = 1 + Math.floor(rng() * Math.min(9, within - 1));
    const b = 1 + Math.floor(rng() * Math.min(9, within - a));
    const answer = add ? a + b : Math.max(a, b) - Math.min(a, b);
    const left = add ? a : Math.max(a, b);
    const right = add ? b : Math.min(a, b);
    const decoys = shuffle(rng, [answer + 1, Math.max(0, answer - 1), answer + 2].filter((n) => n !== answer && n <= within)).slice(0, 2);
    return {
      skill: "Adding and subtracting",
      item: add ? `${left}+${right}` : `${left}-${right}`,
      prompt: add ? `${left} plus ${right}. How many buns?` : `${left} take away ${right}. How many buns?`,
      miss: () => add ? `Count ${left} and ${right} together.` : `Start with ${left} and take away ${right}.`,
      heldCount: { left, right, op: add ? "+" : "−" },
      options: shuffle(rng, [answer, ...decoys]).map((n) => ({
        kind: "count",
        value: String(n),
        label: String(n),
        count: n,
        src: "assets/bun.png"
      })),
      right: (value) => value === String(answer)
    };
  }

  if (shopId === "path") {
    const path = pick(rng, PREWRITE);
    return {
      skill: "Pre-writing",
      item: path.id,
      prompt: path.cue,
      kind: "trace",
      paths: [{ d: path.d, cue: path.cue }],
      miss: () => "Stay on the path. Start at the green dot."
    };
  }

  if (shopId === "desk") {
    const family = kidId === "gabi" ? "c" : null;
    const pool = family ? WRITE_LETTERS.filter((entry) => entry.family === family) : WRITE_LETTERS;
    const entry = pick(rng, pool);
    return {
      skill: "Letter writing",
      item: entry.letter,
      prompt: `Trace the letter ${LETTER_NAMES[entry.letter]}.`,
      kind: "trace",
      letter: entry.letter,
      paths: entry.strokes,
      miss: () => `Stay on the letter ${LETTER_NAMES[entry.letter]}. Start at the green dot.`
    };
  }

  return {
    skill: "Colors",
    item: "red",
    prompt: "Find red.",
    options: COLORS.slice(0, 3).map((c) => pic(c.src, c.name, c.id)),
    right: (value) => value === "red",
    miss: () => "Try again."
  };
}

export function noteStreak(state, shopId, clean) {
  const rec = state.shops[shopId] || { streak: 0, home: false };
  if (rec.home) {
    state.shops[shopId] = rec;
    return rec;
  }
  rec.streak = clean ? (rec.streak || 0) + 1 : 0;
  if (rec.streak >= NEED) rec.home = true;
  state.shops[shopId] = rec;
  return rec;
}
