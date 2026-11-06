// Monster Scales: balance puzzles with gems, little monsters, and big monsters. Pure logic, no DOM.
// A side is a count of each thing, e.g. { little: 1, gem: 2 }. A gem weighs one gem.
// The child answers with gems: how many gems balance the question side.

export const THINGS = ["big", "little", "gem"];
export const MAX_GEMS = 12;

const n = (side, thing) => side?.[thing] || 0;

export function weigh(side, w) {
  return n(side, "gem") + n(side, "little") * (w.little || 0) + n(side, "big") * (w.big || 0);
}

/** Things other than gems that appear anywhere in the puzzle. */
function unknowns(puzzle) {
  const sides = [...puzzle.facts.flatMap((f) => [f.left, f.right]), puzzle.ask];
  return ["little", "big"].filter((t) => sides.some((s) => n(s, t) > 0));
}

/** Every weighting (little 1–20, big 1–40 gems) that keeps every scale level. */
export function solutions(puzzle) {
  const used = unknowns(puzzle);
  const out = [];
  const bigs = used.includes("big") ? 40 : 1;
  const littles = used.includes("little") ? 20 : 1;
  for (let little = 1; little <= littles; little += 1) {
    for (let big = 1; big <= bigs; big += 1) {
      const w = { little, big };
      if (puzzle.facts.every((f) => weigh(f.left, w) === weigh(f.right, w))) out.push(w);
    }
  }
  return out;
}

export function check(puzzle) {
  const found = solutions(puzzle);
  const answers = new Set(found.map((w) => weigh(puzzle.ask, w)));
  const answer = found.length ? weigh(puzzle.ask, found[0]) : null;
  return {
    unique: found.length === 1,
    // Even when a weight is free, the asked side might still have one answer. We require both.
    answerUnique: answers.size === 1,
    answer,
    matches: answer === puzzle.answer,
    inRange: answer !== null && answer >= 1 && answer <= MAX_GEMS,
    noGemsOnAsk: n(puzzle.ask, "gem") === 0
  };
}

const pick = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const MAKERS = {
  1: (rng) => {
    const little = pick(rng, 2, 5);
    const k = pick(rng, 2, 4);
    return { kind: "swap", w: { little }, facts: [{ left: { little: 1 }, right: { gem: little } }], ask: { little: k } };
  },
  2: (rng) => {
    const little = pick(rng, 2, 4);
    const per = pick(rng, 2, 4);
    return {
      kind: "chain",
      w: { little, big: per * little },
      facts: [{ left: { big: 1 }, right: { little: per } }, { left: { little: 1 }, right: { gem: little } }],
      ask: { big: 1 }
    };
  },
  3: (rng) => {
    const two = rng() < 0.3;
    const little = pick(rng, 2, two ? 4 : 6);
    const extra = pick(rng, 1, 4);
    const count = two ? 2 : 1;
    return {
      kind: two ? "takeaway2" : "takeaway",
      w: { little },
      facts: [{ left: { little: count, gem: extra }, right: { gem: count * little + extra } }],
      ask: { little: 1 }
    };
  },
  4: (rng) => {
    if (rng() < 0.5) {
      const little = pick(rng, 2, 4);
      const extra = pick(rng, 1, 4);
      const big = little + extra;
      return {
        kind: "two-a",
        w: { little, big },
        facts: [{ left: { big: 1 }, right: { little: 1, gem: extra } }, { left: { big: 1, little: 1 }, right: { gem: big + little } }],
        ask: { big: 1 }
      };
    }
    const little = pick(rng, 2, 4);
    return {
      kind: "two-b",
      w: { little, big: 2 * little },
      facts: [{ left: { big: 1 }, right: { little: 2 } }, { left: { big: 1, little: 1 }, right: { gem: 3 * little } }],
      ask: { little: 1 }
    };
  }
};

export const LEVEL_IDS = [1, 2, 3, 4];

export function generate(level, rng) {
  for (let tries = 0; tries < 2000; tries += 1) {
    const made = MAKERS[level](rng);
    const puzzle = { type: "scale", level, kind: made.kind, facts: made.facts, ask: made.ask, weights: made.w, answer: weigh(made.ask, made.w) };
    const info = check(puzzle);
    if (info.unique && info.answerUnique && info.matches && info.inRange && info.noGemsOnAsk) return puzzle;
  }
  throw new Error(`No scale puzzle found for level ${level}`);
}

/** Steps to the answer, for difficulty: one per swap or take-away. */
export function difficulty(puzzle) {
  return { swap: 1, chain: 2, takeaway: 2, takeaway2: 3, "two-a": 4, "two-b": 4 }[puzzle.kind] || 1;
}
