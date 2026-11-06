// What Joyce says after a miss, and the hint ladder. Pure logic, no DOM.
// Hint 1 says where to look. Hint 2 says how to think. Hint 3 works a different puzzle of the
// same kind. No line gives the answer to the child's own puzzle.

import { forced, tryValue, build, cell, guessCell } from "./pyramid.mjs";
import { weigh } from "./scales.mjs";

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// ---------- Block Towers ----------

/** The block a child should look at next, or a block to guess in when nothing is forced. */
export function stackFocus(puzzle, known) {
  const next = forced(puzzle.size, known);
  const add = next.find((s) => s.rule === "add");
  if (add) return add;
  if (next.length) return next[0];
  return { cell: guessCell(puzzle, known), rule: "guess" };
}

export function stackHint(puzzle, known, step) {
  const focus = stackFocus(puzzle, known);
  if (step === 1) {
    const line = {
      add: "Start with this block. Look at the two blocks under it.",
      sub: "Start with this block. Look at the block on top of it, and the block next to it.",
      guess: "No block can be found by adding or taking away yet. Try a number in this block. The tower will show what it makes."
    }[focus.rule];
    return { step, cell: focus.cell, line };
  }
  if (step === 2) {
    if (focus.rule === "add") {
      const [a, b] = focus.from.map((id) => known[id]);
      return { step, cell: focus.cell, line: `A block is the two blocks under it put together. Put ${a} and ${b} together.` };
    }
    if (focus.rule === "sub") {
      return { step, cell: focus.cell, line: `The top block is the whole, ${known[focus.top]}. ${known[focus.other]} is one part. What goes with ${known[focus.other]} to make ${known[focus.top]}?` };
    }
    const middle = focus.cell === cell(0, 1) && puzzle.size === 3;
    return {
      step,
      cell: focus.cell,
      line: middle
        ? "This block holds up both blocks above it, so it counts twice in the top. Guess a number and watch the top. Too big? Try a smaller number."
        : "Guess a number and watch what it makes. If a block comes out too big, try a smaller number. Too small, try a bigger one."
    };
  }
  return { step: 3, cell: focus.cell, ...stackTwin(puzzle, known, focus) };
}

function stackTwin(puzzle, known, focus) {
  const answer = puzzle.values[focus.cell];
  if (focus.rule === "add") {
    let [a, b] = [3, 4];
    if (a + b === answer) [a, b] = [2, 6];
    return {
      twin: { size: 2, values: build([a, b]), shown: [cell(0, 0), cell(0, 1)] },
      lines: [`Here is one like it. Under this block are ${a} and ${b}.`, `${a} and ${b} make ${a + b}, so the block is ${a + b}.`, "Now try yours the same way."]
    };
  }
  if (focus.rule === "sub") {
    let [part, whole] = [4, 9];
    if (whole - part === answer) [part, whole] = [2, 8];
    return {
      twin: { size: 2, values: build([part, whole - part]), shown: [cell(0, 0), cell(1, 0)] },
      lines: [`Here is one like it. The top block is ${whole}, and one block under it is ${part}.`, `${part} and ${whole - part} make ${whole}, so the other block is ${whole - part}.`, "Now try yours the same way."]
    };
  }
  const [a, c] = answer === 3 ? [2, 1] : [1, 2];
  const m = answer === 3 ? 4 : 3;
  const top = a + 2 * m + c;
  const low = m - 1;
  return {
    twin: { size: 3, values: build([a, m, c]), shown: [cell(0, 0), cell(0, 2), cell(2, 0)] },
    lines: [
      `Here is one like it. The bottom row is ${a}, a blank, and ${c}. The top is ${top}.`,
      `Try ${low} in the blank. The middle row is ${a + low} and ${low + c}, and the top is ${a + 2 * low + c}. Too small.`,
      `Try ${m}. The middle row is ${a + m} and ${m + c}, and the top is ${top}. That fits.`,
      "Now try yours the same way."
    ]
  };
}

/**
 * The child put `value` in block `id` and it is not right. Answers the choice they made.
 * Returns { line, pencil, clash } — pencil is only set when the block was a guess.
 */
export function stackMiss(puzzle, known, id, value) {
  const step = forced(puzzle.size, known).find((s) => s.cell === id);
  if (step?.rule === "add") {
    const [a, b] = step.from.map((k) => known[k]);
    const big = Math.max(a, b);
    if (value <= big && a !== b && value === Math.abs(a - b)) return { line: `That's how far apart ${a} and ${b} are. This block holds both of them, so put them together.` };
    if (value <= big) return { line: `${value} isn't bigger than ${big}. A block is always bigger than each block under it.` };
    if (value > step.value) return { line: `${a} and ${b} don't make ${value}. Try a smaller number.` };
    return { line: `${a} and ${b} make more than ${value}. Try a bigger number.` };
  }
  if (step?.rule === "sub") {
    const whole = known[step.top];
    const part = known[step.other];
    if (value === whole + part) return { line: `${value} puts ${whole} and ${part} together. ${whole} is the whole, so take ${part} away.` };
    if (value + part > whole) return { line: `${value} and ${part} make more than ${whole}. Try a smaller number.` };
    return { line: `${value} and ${part} don't reach ${whole} yet. Try a bigger number.` };
  }
  const tried = tryValue(puzzle.size, known, id, value);
  if (!tried.clash) return { line: "That doesn't fit with the other blocks. Try another number.", pencil: tried.known };
  const { got, want } = tried.clash;
  // Which way to move: the gap between the two numbers that disagree should shrink.
  const gap = (v) => {
    const c = tryValue(puzzle.size, known, id, v).clash;
    return c ? c.got - c.want : 0;
  };
  const here = got - want;
  const slope = gap(value + 1) - here || here - gap(Math.max(0, value - 1)) || 1;
  const smaller = here * slope > 0;
  const fixed = known[tried.clash.cell] !== undefined;
  const where = tried.clash.cell === cell(puzzle.size - 1, 0) ? "the top" : "this block";
  const move = `Try a ${smaller ? "smaller" : "bigger"} number.`;
  let line;
  if (want === 0 && got < 0) line = `With ${value} there, a block would need less than nothing. ${move}`;
  else if (fixed) line = `With ${value} there, ${where} comes out ${got}, but it says ${want}. ${move}`;
  else line = `With ${value} there, the blocks don't fit together. ${move}`;
  return { line, pencil: tried.known, clash: tried.clash };
}

// ---------- Monster Scales ----------

const FOCUS = { swap: 0, chain: 0, takeaway: 0, takeaway2: 0, "two-a": 0, "two-b": 0 };

export function scaleHint(puzzle, step) {
  const w = puzzle.weights;
  const f = puzzle.facts;
  if (step === 1) {
    const line = {
      swap: "Look at the first scale. What does one little monster balance?",
      chain: "Start with the big monster scale. What does a big monster balance?",
      takeaway: "Look at the gems on both sides of the scale.",
      takeaway2: "Look at the gems on both sides of the scale.",
      "two-a": "The first scale tells you what a big monster is the same as.",
      "two-b": "The first scale tells you what a big monster is the same as."
    }[puzzle.kind];
    return { step, focus: FOCUS[puzzle.kind], line };
  }
  if (step === 2) {
    const k = puzzle.ask.little || 0;
    const extra = f[0].left.gem || 0;
    const line = {
      swap: `Each little monster can be swapped for ${plural(w.little, "gem")}. This side has ${plural(k, "little monster")}.`,
      chain: `Swap the big monster for ${plural(f[0].right.little, "little monster")}. Then swap each little monster for gems.`,
      takeaway: `Take ${plural(extra, "gem")} off both sides. The scale still balances. What is left with the little monster?`,
      takeaway2: `Take ${plural(extra, "gem")} off both sides. Then share the gems that are left between the two little monsters.`,
      "two-a": `On the second scale, swap the big monster for a little monster and ${plural(f[0].right.gem, "gem")}. Then see what is left.`,
      "two-b": "On the second scale, swap the big monster for two little monsters. Now that side is three little monsters."
    }[puzzle.kind];
    return { step, focus: puzzle.kind.startsWith("two") ? 1 : 0, line };
  }
  return { step: 3, ...scaleTwin(puzzle) };
}

const TWINS = {
  swap: ([p, k]) => ({
    facts: [{ left: { little: 1 }, right: { gem: p } }],
    ask: { little: k },
    lines: [`Here is one like it. One little monster balances ${plural(p, "gem")}.`, `For ${k} little monsters, swap each one for ${p} gems. That makes ${k * p} gems.`, "Now try yours the same way."]
  }),
  chain: ([p, per]) => ({
    facts: [{ left: { big: 1 }, right: { little: per } }, { left: { little: 1 }, right: { gem: p } }],
    ask: { big: 1 },
    lines: [`Here is one like it. A big monster balances ${per} little monsters, and a little monster balances ${p} gems.`, `Swap the big monster for ${per} little monsters. Then swap each little monster for ${p} gems. That makes ${per * p} gems.`, "Now try yours the same way."]
  }),
  takeaway: ([p, extra]) => ({
    facts: [{ left: { little: 1, gem: extra }, right: { gem: p + extra } }],
    ask: { little: 1 },
    lines: [`Here is one like it. A little monster and ${plural(extra, "gem")} balance ${p + extra} gems.`, `Take ${plural(extra, "gem")} off both sides. The little monster balances ${p} gems.`, "Now try yours the same way."]
  }),
  takeaway2: ([p, extra]) => ({
    facts: [{ left: { little: 2, gem: extra }, right: { gem: 2 * p + extra } }],
    ask: { little: 1 },
    lines: [`Here is one like it. Two little monsters and ${plural(extra, "gem")} balance ${2 * p + extra} gems.`, `Take ${plural(extra, "gem")} off both sides. Two little monsters balance ${2 * p} gems.`, `Share ${2 * p} gems between two little monsters. ${p} each.`, "Now try yours the same way."]
  }),
  "two-a": ([p, extra]) => ({
    facts: [{ left: { big: 1 }, right: { little: 1, gem: extra } }, { left: { big: 1, little: 1 }, right: { gem: 2 * p + extra } }],
    ask: { big: 1 },
    lines: [
      `Here is one like it. A big monster balances a little monster and ${plural(extra, "gem")}. A big monster and a little monster balance ${2 * p + extra} gems.`,
      `Swap the big monster. Now two little monsters and ${plural(extra, "gem")} balance ${2 * p + extra} gems.`,
      `Take ${plural(extra, "gem")} off both sides. Two little monsters balance ${2 * p}, so one little monster is ${p}.`,
      `The big monster is a little monster and ${plural(extra, "gem")}. That's ${p + extra}.`,
      "Now try yours the same way."
    ]
  }),
  "two-b": ([p]) => ({
    facts: [{ left: { big: 1 }, right: { little: 2 } }, { left: { big: 1, little: 1 }, right: { gem: 3 * p } }],
    ask: { little: 1 },
    lines: [`Here is one like it. A big monster balances 2 little monsters. A big monster and a little monster balance ${3 * p} gems.`, `Swap the big monster. Now three little monsters balance ${3 * p} gems.`, `Share ${3 * p} gems among three little monsters. ${p} each.`, "Now try yours the same way."]
  })
};

const TWIN_NUMBERS = [[3, 2], [2, 3], [4, 2], [2, 2], [3, 1], [5, 2], [2, 1], [4, 1], [3, 3]];

function scaleTwin(puzzle) {
  const make = TWINS[puzzle.kind];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const numbers of TWIN_NUMBERS) {
    const twin = make(numbers);
    const weights = solveTwin(twin);
    if (!weights) continue;
    const answer = weigh(twin.ask, weights);
    if (answer !== puzzle.answer && answer <= 12 && !same(twin.facts, puzzle.facts)) return { twin: { facts: twin.facts, ask: twin.ask }, lines: twin.lines };
  }
  throw new Error(`No worked example for ${puzzle.id || puzzle.kind}`);
}

function solveTwin(twin) {
  for (let little = 1; little <= 20; little += 1) {
    for (let big = 1; big <= 40; big += 1) {
      const w = { little, big };
      if (twin.facts.every((f) => weigh(f.left, w) === weigh(f.right, w))) return w;
    }
  }
  return null;
}

/** The child put `gems` on the gem pan and it doesn't balance. Answers the choice they made. */
export function scaleMiss(puzzle, gems) {
  const w = puzzle.weights;
  const f = puzzle.facts;
  const tip = gems > puzzle.answer ? "down" : "up";
  const base = tip === "down" ? "Too many gems. The gem side went down." : "The gem side went up. It needs more gems.";
  const k = puzzle.ask.little || 0;
  let why = "";
  if (puzzle.kind === "swap" && gems === w.little && k > 1) why = ` That balances one little monster. This side has ${k}.`;
  if (puzzle.kind === "chain" && gems === f[0].right.little) why = " That's how many little monsters a big monster is. Now swap each little monster for gems.";
  if (puzzle.kind === "chain" && gems === w.little) why = ` That balances one little monster. A big monster is ${f[0].right.little} little monsters.`;
  if (puzzle.kind.startsWith("takeaway") && gems === f[0].right.gem) why = ` That's all ${f[0].right.gem} gems. But ${plural(f[0].left.gem, "gem")} were already on the little monster side.`;
  if (puzzle.kind === "takeaway2" && gems === f[0].right.gem - f[0].left.gem) why = " That balances both little monsters. This side has one little monster.";
  if (puzzle.kind === "two-a" && gems === f[1].right.gem) why = " That balances a big monster and a little monster together. This side is just the big monster.";
  if (puzzle.kind === "two-a" && gems === f[0].right.gem) why = " That's how much more a big monster is than a little monster.";
  if (puzzle.kind === "two-b" && gems === f[1].right.gem) why = " That balances a big monster and a little monster together. This side is one little monster.";
  if (puzzle.kind === "two-b" && gems === w.big) why = " That balances a big monster. This side is one little monster.";
  return { tip, line: base + why };
}

export { weigh };
