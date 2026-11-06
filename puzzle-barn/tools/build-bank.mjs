// Builds puzzle-barn/bank.json: a fixed, checked set of puzzles. Children only ever see puzzles
// from this file. Run: node puzzle-barn/tools/build-bank.mjs
// The seed is fixed, so the same code always writes the same bank.

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as stacks from "../puzzles/pyramid.mjs";
import * as scales from "../puzzles/scales.mjs";

// Up to 60 different puzzles per level. Some scale levels only have a handful of different
// puzzles with answers of 12 gems or fewer; the game spaces repeats out.
export const PER_LEVEL = 60;
export const MIN_PER_LEVEL = 8;

function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stackKey = (p) => `${p.size}:${stacks.cells(p.size).map((id) => (p.shown.includes(id) ? p.values[id] : "_")).join(",")}`;
const scaleKey = (p) => JSON.stringify([p.facts, p.ask]);

export function buildBank(seed = 20261105) {
  const rng = rngFrom(seed);
  const bank = { version: 1, seed, stack: {}, scale: {} };
  for (const [type, mod, key] of [["stack", stacks, stackKey], ["scale", scales, scaleKey]]) {
    for (const level of mod.LEVEL_IDS) {
      const seen = new Set();
      const list = [];
      for (let tries = 0; list.length < PER_LEVEL && tries < 4000; tries += 1) {
        const puzzle = mod.generate(level, rng);
        const k = key(puzzle);
        if (seen.has(k)) continue;
        seen.add(k);
        list.push({ id: `${type}-${level}-${String(list.length + 1).padStart(2, "0")}`, ...puzzle });
      }
      if (list.length < MIN_PER_LEVEL) throw new Error(`${type} level ${level}: only ${list.length} different puzzles`);
      bank[type][level] = list;
    }
  }
  return bank;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = new URL("../bank.json", import.meta.url);
  fs.writeFileSync(out, `${JSON.stringify(buildBank())}\n`);
  const bank = JSON.parse(fs.readFileSync(out, "utf8"));
  for (const type of ["stack", "scale"]) for (const [level, list] of Object.entries(bank[type])) console.log(type, level, list.length);
}
