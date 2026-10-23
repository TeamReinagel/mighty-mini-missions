// Problem generators for the skill games. The same file feeds the games and the tests.

export function rngFrom(seed) {
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

export const COLORS = [
  { id: "red", label: "red", hex: "#e23b3b" },
  { id: "blue", label: "blue", hex: "#3b7ddd" },
  { id: "yellow", label: "yellow", hex: "#f5c518" },
  { id: "green", label: "green", hex: "#2fbf71" }
];

export const SNACKS = ["🍪", "🍎", "🍓", "🍇", "🥕"];

export function countRound(min, max, rng) {
  const span = Math.max(1, max - min + 1);
  const count = min + Math.floor(rng() * span);
  const emoji = SNACKS[Math.floor(rng() * SNACKS.length)];
  const wrong = shuffle(rng, [count - 1, count + 1, count + 2].filter((n) => n > 0 && n !== count)).slice(0, 2);
  return { count, emoji, choices: shuffle(rng, [count, ...wrong]) };
}

export function nameRound(rng) {
  const number = 1 + Math.floor(rng() * 10);
  const wrong = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((n) => n !== number)).slice(0, 2);
  return { number, choices: shuffle(rng, [number, ...wrong]) };
}

export function compareRound(max, rng) {
  const cap = Math.max(2, max);
  let left = 1 + Math.floor(rng() * cap);
  let right = 1 + Math.floor(rng() * cap);
  if (left === right) right = left === cap ? left - 1 : left + 1;
  const fewer = rng() < 0.5;
  const answer = fewer ? (left < right ? "left" : "right") : (left > right ? "left" : "right");
  return { left, right, fewer, answer, emoji: SNACKS[Math.floor(rng() * SNACKS.length)] };
}

export function patternRound(rng) {
  const icons = ["⭐", "💙", "🍎", "🌙"];
  const [a, b] = shuffle(rng, icons).slice(0, 2);
  const repeat = rng() < 0.5;
  const sequence = repeat ? [a, b, a, b] : [a, b, b, a];
  const answer = repeat ? a : b;
  const choices = shuffle(rng, [answer, ...icons.filter((icon) => icon !== answer)].slice(0, 3));
  return { sequence, answer, choices };
}

export function addWithTrade(rng, fixed = false) {
  if (fixed) return { a: 27, b: 15, op: "+" };
  for (let i = 0; i < 40; i += 1) {
    const a = 12 + Math.floor(rng() * 70);
    const b = 15 + Math.floor(rng() * Math.max(1, 90 - a));
    if (a + b <= 99 && (a % 10) + (b % 10) >= 10) return { a, b, op: "+" };
  }
  return { a: 28, b: 17, op: "+" };
}

/** The fewest coins that pay a price exactly. Biggest coin first is always fewest for US coins. */
export function fewestCoins(price, coins) {
  let left = price;
  let used = 0;
  for (const coin of [...coins].sort((a, b) => b - a)) {
    used += Math.floor(left / coin);
    left %= coin;
  }
  return left === 0 ? used : Infinity;
}

export function subWithTrade(rng) {
  for (let i = 0; i < 40; i += 1) {
    const a = 30 + Math.floor(rng() * 60);
    const b = 11 + Math.floor(rng() * Math.max(1, a - 12));
    if (a > b && (a % 10) < (b % 10)) return { a, b, op: "-" };
  }
  return { a: 42, b: 15, op: "-" };
}

export const SOUND = {
  a: "ah", e: "eh", i: "ih", o: "o", u: "uh",
  b: "buh", c: "kuh", d: "duh", f: "fff", g: "guh",
  h: "huh", j: "juh", k: "kuh", l: "lll", m: "mmm",
  n: "nnn", p: "puh", q: "kwuh", r: "rrr", s: "sss",
  t: "tuh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz"
};

export const SOUND_GROUPS = [
  ["a", "b", "c", "d", "e", "f"],
  ["g", "h", "i", "j", "k", "l"]
];

export function soundRound(letters, rng) {
  const answer = letters[Math.floor(rng() * letters.length)];
  const wrong = shuffle(rng, letters.filter((letter) => letter !== answer)).slice(0, 2);
  return { answer, sound: SOUND[answer], choices: shuffle(rng, [answer, ...wrong]) };
}

export const TEAMS = {
  sh: ["ship", "shop", "fish", "shell", "wish", "rush"],
  ch: ["chip", "chat", "chin", "chop", "much", "rich"],
  th: ["thin", "math", "path", "bath", "moth", "thud"]
};

export function teamRound(team, rng) {
  const words = TEAMS[team];
  const answer = words[Math.floor(rng() * words.length)];
  const others = Object.entries(TEAMS)
    .filter(([name]) => name !== team)
    .flatMap(([, list]) => list);
  const wrong = shuffle(rng, others.filter((word) => !word.includes(team))).slice(0, 2);
  return { team, answer, choices: shuffle(rng, [answer, ...wrong]) };
}
