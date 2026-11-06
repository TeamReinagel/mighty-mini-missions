// Block Towers: number pyramids. Each block is the sum of the two blocks under it.
// Pure logic, no DOM. Cells are "r,c": row 0 is the bottom row, and row r has (size - r) blocks.
// Block (r,c) sits on (r-1,c) and (r-1,c+1).

export const cell = (r, c) => `${r},${c}`;
export const parse = (id) => id.split(",").map(Number);

export function cells(size) {
  const list = [];
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size - r; c += 1) list.push(cell(r, c));
  return list;
}

/** Every block's value from the bottom row. */
export function build(bottom) {
  const size = bottom.length;
  const values = {};
  bottom.forEach((v, c) => { values[cell(0, c)] = v; });
  for (let r = 1; r < size; r += 1) {
    for (let c = 0; c < size - r; c += 1) values[cell(r, c)] = values[cell(r - 1, c)] + values[cell(r - 1, c + 1)];
  }
  return values;
}

function under(id) {
  const [r, c] = parse(id);
  return r === 0 ? null : [cell(r - 1, c), cell(r - 1, c + 1)];
}

/** The blocks resting on this one, each with the other block under it. */
function above(id, size) {
  const [r, c] = parse(id);
  if (r === size - 1) return [];
  const out = [];
  if (c - 1 >= 0) out.push({ top: cell(r + 1, c - 1), other: cell(r, c - 1) });
  if (c < size - r - 1) out.push({ top: cell(r + 1, c), other: cell(r, c + 1) });
  return out;
}

/**
 * The blanks a child could fill right now by adding the two blocks under it, or by taking one
 * block under a known block away from that block. `known` maps cell -> value.
 */
export function forced(size, known) {
  const out = [];
  for (const id of cells(size)) {
    if (known[id] !== undefined) continue;
    const kids = under(id);
    if (kids && known[kids[0]] !== undefined && known[kids[1]] !== undefined) {
      out.push({ cell: id, rule: "add", from: kids, value: known[kids[0]] + known[kids[1]] });
      continue;
    }
    for (const { top, other } of above(id, size)) {
      if (known[top] !== undefined && known[other] !== undefined) {
        out.push({ cell: id, rule: "sub", top, other, value: known[top] - known[other] });
        break;
      }
    }
  }
  return out;
}

/** Fills everything that adding and taking away can reach. Returns the steps taken. */
export function propagate(size, start) {
  const known = { ...start };
  const steps = [];
  let clash = null;
  for (;;) {
    const next = forced(size, known);
    if (!next.length) break;
    for (const step of next) {
      if (known[step.cell] !== undefined) continue;
      known[step.cell] = step.value;
      steps.push(step);
    }
  }
  // A filled block that disagrees with the two under it.
  for (const id of cells(size)) {
    const kids = under(id);
    if (!kids || known[id] === undefined || known[kids[0]] === undefined || known[kids[1]] === undefined) continue;
    if (known[kids[0]] + known[kids[1]] !== known[id]) { clash = { cell: id, got: known[kids[0]] + known[kids[1]], want: known[id] }; break; }
  }
  const negative = Object.entries(known).find(([, v]) => v < 0);
  if (!clash && negative) clash = { cell: negative[0], got: negative[1], want: 0 };
  return { known, steps, clash };
}

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= k; i += 1) out = (out * (n - k + i)) / i;
  return Math.round(out);
}

/** How many times each bottom block counts toward this block. */
export function weights(size, id) {
  const [r, c] = parse(id);
  return Array.from({ length: size }, (_, j) => binom(r, j - c));
}

/** Rank of the shown blocks' weight rows. A full rank means exactly one answer. */
export function rank(size, shown) {
  const rows = shown.map((id) => weights(size, id).slice());
  let rankOut = 0;
  for (let col = 0; col < size && rankOut < rows.length; col += 1) {
    let pivot = -1;
    for (let i = rankOut; i < rows.length; i += 1) if (rows[i][col] !== 0) { pivot = i; break; }
    if (pivot < 0) continue;
    [rows[rankOut], rows[pivot]] = [rows[pivot], rows[rankOut]];
    for (let i = 0; i < rows.length; i += 1) {
      if (i === rankOut || rows[i][col] === 0) continue;
      const f = rows[i][col];
      const p = rows[rankOut][col];
      rows[i] = rows[i].map((v, j) => v * p - rows[rankOut][j] * f);
    }
    rankOut += 1;
  }
  return rankOut;
}

/** Checks a puzzle: { size, values, shown }. */
export function check(puzzle) {
  const { size, values, shown } = puzzle;
  const start = Object.fromEntries(shown.map((id) => [id, values[id]]));
  const unique = rank(size, shown) === size;
  const { known, steps } = propagate(size, start);
  const blanks = cells(size).filter((id) => !shown.includes(id));
  const reached = blanks.filter((id) => known[id] !== undefined);
  const consistent = Object.entries(values).every(([id, v]) => Number.isInteger(v) && v >= 0 && (known[id] === undefined || known[id] === v));
  const built = build(cells(size).filter((id) => id.startsWith("0,")).map((id) => values[id]));
  const sums = cells(size).every((id) => built[id] === values[id]);
  return {
    unique,
    consistent: consistent && sums,
    stuck: reached.length < blanks.length,
    blanks: blanks.length,
    adds: steps.filter((s) => s.rule === "add").length,
    subs: steps.filter((s) => s.rule === "sub").length
  };
}

/**
 * A child puts `value` in a block that adding and taking away can't reach yet. The game fills in
 * what that would make, in pencil, and points at the first block it disagrees with.
 */
export function tryValue(size, known, id, value) {
  return propagate(size, { ...known, [id]: value });
}

/**
 * When nothing can be added or taken away, the block to guess in: the one whose right number lets
 * adding and taking away fill every other block. Bottom row first, middle first.
 */
export function guessCell(puzzle, known) {
  const { size, values } = puzzle;
  const blanks = cells(size).filter((id) => known[id] === undefined);
  const mid = (size - 1) / 2;
  blanks.sort((a, b) => {
    const [ra, ca] = parse(a);
    const [rb, cb] = parse(b);
    return ra - rb || Math.abs(ca - mid) - Math.abs(cb - mid);
  });
  return blanks.find((id) => {
    const filled = propagate(size, { ...known, [id]: values[id] });
    return !filled.clash && cells(size).every((c) => filled.known[c] !== undefined);
  }) || null;
}

export function difficulty(puzzle) {
  const info = check(puzzle);
  return info.blanks + info.subs * 2 + (info.stuck ? 6 : 0) + (puzzle.size - 3) * 2;
}

const LEVELS = {
  1: { size: 3, bottom: [1, 6], top: 20, blanks: [2, 3], shape: "top" },
  2: { size: 3, bottom: [1, 7], top: 20, blanks: [2, 3], shape: "bottom" },
  3: { size: 4, bottom: [2, 18], top: 100, blanks: [4, 6], shape: "mixed" },
  4: { size: 3, bottom: [1, 8], top: 30, blanks: [3, 4], shape: "stuck" },
  5: { size: 4, bottom: [1, 9], top: 60, blanks: [5, 6], shape: "stuck" }
};

export const LEVEL_IDS = [1, 2, 3, 4];

function fits(specId, puzzle, info) {
  const spec = LEVELS[specId];
  if (!info.unique || !info.consistent) return false;
  if (info.blanks < spec.blanks[0] || info.blanks > spec.blanks[1]) return false;
  const bottomBlank = puzzle.shown.filter((id) => id.startsWith("0,")).length < puzzle.size;
  if (spec.shape === "top") return !bottomBlank && !info.stuck && info.subs === 0;
  if (spec.shape === "bottom") return bottomBlank && !info.stuck && info.subs >= 1;
  if (spec.shape === "mixed") return bottomBlank && !info.stuck && info.subs >= 2;
  if (!info.stuck) return false;
  const start = Object.fromEntries(puzzle.shown.map((id) => [id, puzzle.values[id]]));
  return guessCell(puzzle, start) !== null;
}

/** Makes one puzzle for a level. `rng` returns [0, 1). Level 4 mixes 3- and 4-row stacks. */
export function generate(level, rng) {
  const specId = level === 4 && rng() < 0.4 ? 5 : level;
  const spec = LEVELS[specId];
  const all = cells(spec.size);
  for (let tries = 0; tries < 5000; tries += 1) {
    const bottom = Array.from({ length: spec.size }, () => spec.bottom[0] + Math.floor(rng() * (spec.bottom[1] - spec.bottom[0] + 1)));
    const values = build(bottom);
    const top = values[cell(spec.size - 1, 0)];
    if (top > spec.top || top < spec.size * 2) continue;
    const blankCount = spec.blanks[0] + Math.floor(rng() * (spec.blanks[1] - spec.blanks[0] + 1));
    let pool = all;
    if (spec.shape === "top") pool = all.filter((id) => !id.startsWith("0,"));
    const blanks = new Set();
    const order = pool.slice().sort(() => rng() - 0.5);
    for (const id of order) if (blanks.size < blankCount) blanks.add(id);
    if (spec.shape === "stuck" && blanks.has(cell(spec.size - 1, 0))) continue; // the top stays shown
    const shown = all.filter((id) => !blanks.has(id));
    const puzzle = { type: "stack", level, size: spec.size, values, shown };
    if (fits(specId, puzzle, check(puzzle))) return puzzle;
  }
  throw new Error(`No stack puzzle found for level ${level}`);
}
