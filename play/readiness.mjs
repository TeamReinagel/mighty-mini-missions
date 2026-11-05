// Round builders for Connor's kindergarten-readiness games.
// The picture carries the choice. These functions only pick which objects appear.

export const THINGS = [
  { id: "apple", name: "apple", color: "red", kind: "food" },
  { id: "ball", name: "ball", color: "red", kind: "toy" },
  { id: "lemon", name: "lemon", color: "yellow", kind: "food" },
  { id: "duck", name: "duck", color: "yellow", kind: "toy" },
  { id: "berries", name: "blueberries", color: "blue", kind: "food" },
  { id: "train", name: "train", color: "blue", kind: "toy" },
  { id: "pear", name: "pear", color: "green", kind: "food" },
  { id: "frog", name: "frog", color: "green", kind: "toy" }
];

export const THING_SRC = {
  apple: "../color-tap/assets/apple.jpg",
  ball: "../color-tap/assets/ball.jpg",
  lemon: "../color-tap/assets/lemon.jpg",
  duck: "../color-tap/assets/duck.jpg",
  berries: "../color-tap/assets/blue.jpg",
  train: "../train-set/art/engine_blue.png",
  pear: "../color-tap/assets/pear.jpg",
  frog: "../color-tap/assets/frog.jpg"
};

export const SHAPES = [
  { id: "circle", name: "circle", src: "assets/circle.jpg" },
  { id: "square", name: "square", src: "assets/square.jpg" },
  { id: "triangle", name: "triangle", src: "assets/triangle.jpg" },
  { id: "rectangle", name: "rectangle", src: "assets/rectangle.jpg" }
];

export const NAME_DECOYS = ["Max", "Gabi", "Ethan", "Ada", "Sam", "Bo", "Mom", "Dad", "Cam", "Cal", "Cory", "Ben", "Amy"];

export const MEADOW = "../color-tap/assets/bg.jpg";

export function shuffle(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function numberRound(rng, { min = 1, max = 5, n = 3, preferHigh = false } = {}) {
  const span = max - min + 1;
  const highMin = min + Math.ceil(span / 2);
  const target = preferHigh
    ? highMin + Math.floor(rng() * (max - highMin + 1))
    : min + Math.floor(rng() * span);
  const choices = new Set([target]);
  let guard = 0;
  while (choices.size < Math.min(n, span) && guard < 40) {
    choices.add(min + Math.floor(rng() * span));
    guard += 1;
  }
  return { target, choices: shuffle(rng, [...choices]) };
}

export function sizeRound(rng, things = THINGS, count = 2) {
  const thing = things[Math.floor(rng() * things.length)];
  const sizes = count >= 3 ? ["big", "mid", "little"] : ["big", "little"];
  const ask = rng() < 0.5 ? "bigger" : "smaller";
  return { thing, ask, answer: ask === "bigger" ? "big" : "little", sizes: shuffle(rng, sizes) };
}

export function colorRound(rng, things = THINGS) {
  const colors = [...new Set(things.map((item) => item.color))];
  const [first, second] = shuffle(rng, colors);
  const modelFor = (color) => shuffle(rng, things.filter((item) => item.color === color))[0];
  const models = [modelFor(first), modelFor(second)];
  const pool = things.filter((item) => (item.color === first || item.color === second) && !models.some((model) => model.id === item.id));
  return { by: "color", models: shuffle(rng, models), item: shuffle(rng, pool)[0] };
}

export function kindRound(rng, things = THINGS) {
  const food = shuffle(rng, things.filter((item) => item.kind === "food"));
  const toy = shuffle(rng, things.filter((item) => item.kind === "toy"));
  const models = [food[0], toy[0]];
  const item = shuffle(rng, things.filter((entry) => !models.some((model) => model.id === entry.id)))[0];
  return { by: "kind", models, item };
}

export function nameRound(rng, name, { count = 2, sameStart = false } = {}) {
  const mine = String(name || "Connor");
  const pool = NAME_DECOYS.filter((decoy) => decoy.toLowerCase() !== mine.toLowerCase());
  const start = mine[0]?.toLowerCase() || "";
  const close = pool.filter((decoy) => decoy[0].toLowerCase() === start);
  const far = pool.filter((decoy) => decoy[0].toLowerCase() !== start);
  const picked = [];
  if (sameStart && close.length) picked.push(close[Math.floor(rng() * close.length)]);
  const rest = shuffle(rng, [...far, ...close].filter((decoy) => !picked.includes(decoy)));
  while (picked.length < count - 1 && rest.length) picked.push(rest.pop());
  return { name: mine, cards: shuffle(rng, [mine, ...picked]) };
}

export function jobRound(rng, things = THINGS, { steps = 2, extra = 0 } = {}) {
  const picked = shuffle(rng, things).slice(0, steps + extra);
  return { order: picked.slice(0, steps), crowd: shuffle(rng, picked) };
}

export function shapeRound(rng, shapes = SHAPES, count = 3) {
  const choices = shuffle(rng, shapes).slice(0, count);
  const target = choices[Math.floor(rng() * choices.length)];
  return { target, choices: shuffle(rng, choices) };
}

export function missNumber(tapped, target, say) {
  return `That says ${say(tapped)}. Find ${say(target)}.`;
}

export function missSize(ask, got) {
  if (got === "mid") return ask === "bigger"
    ? "That one is in the middle. Find the one that takes up more room."
    : "That one is in the middle. Find the one that takes up less room.";
  return ask === "bigger"
    ? "That one is smaller. Find the one that takes up more room."
    : "That one is bigger. Find the one that takes up less room.";
}

export function missSort(item, basket, by) {
  if (by === "kind") {
    const mine = item.kind === "food" ? "food" : "a toy";
    const theirs = basket.kind === "food" ? "food" : "a toy";
    return `The ${item.name} is ${mine}. This basket is ${theirs}.`;
  }
  return `The ${item.name} is ${item.color}. This basket is ${basket.color}.`;
}
