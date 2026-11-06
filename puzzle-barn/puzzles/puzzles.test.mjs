import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as P from "./pyramid.mjs";
import * as S from "./scales.mjs";
import { stackHint, stackMiss, stackFocus, scaleHint, scaleMiss } from "./hints.mjs";
import { buildBank, MIN_PER_LEVEL } from "../tools/build-bank.mjs";

const bank = JSON.parse(fs.readFileSync(new URL("../bank.json", import.meta.url), "utf8"));
const stacks = Object.values(bank.stack).flat();
const scales = Object.values(bank.scale).flat();
const start = (p) => Object.fromEntries(p.shown.map((id) => [id, p.values[id]]));
const topOf = (p) => P.cell(p.size - 1, 0);

test("bank.json is exactly what the builder makes", () => {
  assert.deepEqual(bank, buildBank(bank.seed));
  for (const level of [1, 2, 3, 4]) {
    assert.ok(bank.stack[level].length >= MIN_PER_LEVEL);
    assert.ok(bank.scale[level].length >= MIN_PER_LEVEL);
  }
  const ids = [...stacks, ...scales].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every stack has exactly one answer", () => {
  for (const p of stacks) {
    const info = P.check(p);
    assert.ok(info.unique && info.consistent, p.id);
  }
});

test("a 3-row stack's one answer also holds by trying every bottom row", () => {
  for (const p of stacks.filter((s) => s.size === 3)) {
    let found = 0;
    for (let a = 0; a <= 30; a += 1) for (let b = 0; b <= 30; b += 1) for (let c = 0; c <= 30; c += 1) {
      const v = P.build([a, b, c]);
      if (p.shown.every((id) => v[id] === p.values[id])) found += 1;
    }
    assert.equal(found, 1, p.id);
  }
});

test("each stack level asks what its level says", () => {
  for (const p of bank.stack[1]) {
    const info = P.check(p);
    assert.ok(p.size === 3 && !info.stuck && info.subs === 0 && p.values[topOf(p)] <= 20, p.id);
    assert.ok(p.shown.filter((id) => id.startsWith("0,")).length === 3, p.id);
  }
  for (const p of bank.stack[2]) {
    const info = P.check(p);
    assert.ok(p.size === 3 && !info.stuck && info.subs >= 1 && p.values[topOf(p)] <= 20, p.id);
  }
  for (const p of bank.stack[3]) {
    const info = P.check(p);
    assert.ok(p.size === 4 && !info.stuck && info.subs >= 2 && p.values[topOf(p)] <= 100, p.id);
  }
  for (const p of bank.stack[4]) {
    assert.ok(P.check(p).stuck && p.shown.includes(topOf(p)), p.id);
  }
});

// Levels 1-3 add steps. Level 4 has fewer steps but needs a guess, which the level test checks.
test("stack levels get harder", () => {
  const mean = (list) => list.reduce((sum, p) => sum + P.difficulty(p), 0) / list.length;
  const means = [1, 2, 3].map((level) => mean(bank.stack[level]));
  for (let i = 1; i < means.length; i += 1) assert.ok(means[i] > means[i - 1], `level ${i + 1} ${means[i]} vs ${means[i - 1]}`);
  const scaleMeans = [1, 2, 3, 4].map((level) => bank.scale[level].reduce((sum, p) => sum + S.difficulty(p), 0) / bank.scale[level].length);
  for (let i = 1; i < scaleMeans.length; i += 1) assert.ok(scaleMeans[i] > scaleMeans[i - 1]);
});

test("hint 1 points at a block the child can fill next, or the one block to guess in", () => {
  for (const p of stacks) {
    const known = start(p);
    const hint = stackHint(p, known, 1);
    const next = P.forced(p.size, known);
    if (next.length) assert.ok(next.some((s) => s.cell === hint.cell), p.id);
    else {
      assert.ok(hint.cell && known[hint.cell] === undefined, p.id);
      const filled = P.propagate(p.size, { ...known, [hint.cell]: p.values[hint.cell] });
      assert.ok(!filled.clash && P.cells(p.size).every((id) => filled.known[id] === p.values[id]), p.id);
    }
    for (const step of [1, 2, 3]) assert.ok((stackHint(p, known, step).line || stackHint(p, known, step).lines?.length), `${p.id} hint ${step}`);
  }
});

test("following the hints solves every stack", () => {
  for (const p of stacks) {
    const known = start(p);
    for (let guard = 0; guard < 20 && Object.keys(known).length < P.cells(p.size).length; guard += 1) {
      const focus = stackFocus(p, known);
      known[focus.cell] = p.values[focus.cell];
    }
    assert.deepEqual(known, p.values, p.id);
  }
});

test("the worked example never has the child's answer", () => {
  for (const p of stacks) {
    const known = start(p);
    const { cell, twin } = stackHint(p, known, 3);
    const hidden = P.cells(twin.size).filter((id) => !twin.shown.includes(id));
    const twinAnswer = twin.values[hidden.find((id) => id.startsWith("0,")) || hidden[0]];
    assert.notEqual(twinAnswer, p.values[cell], p.id);
  }
  for (const p of scales) {
    const { twin, lines } = scaleHint(p, 3);
    const found = S.solutions({ facts: twin.facts, ask: twin.ask });
    assert.equal(found.length, 1, p.id);
    assert.notEqual(S.weigh(twin.ask, found[0]), p.answer, p.id);
    assert.ok(lines.length >= 3);
  }
});

test("a miss on a stack answers the number the child chose, pointing the right way", () => {
  for (const p of stacks) {
    const known = start(p);
    const focus = stackFocus(p, known);
    const answer = p.values[focus.cell];
    for (const value of [answer - 3, answer - 1, answer + 1, answer + 4]) {
      if (value < 0) continue;
      const { line } = stackMiss(p, known, focus.cell, value);
      assert.ok(line.includes(String(value)), `${p.id} ${value}: ${line}`);
      if (line.includes("Try a smaller")) assert.ok(value > answer, `${p.id} ${value}: ${line}`);
      if (line.includes("Try a bigger")) assert.ok(value < answer, `${p.id} ${value}: ${line}`);
    }
  }
});

test("a wrong guess in a stuck stack shows where it stops fitting", () => {
  for (const p of bank.stack[4]) {
    const known = P.propagate(p.size, start(p)).known; // fill what adding and taking away can
    const focus = stackFocus(p, known);
    assert.equal(focus.rule, "guess");
    const answer = p.values[focus.cell];
    for (const value of [answer - 2, answer - 1, answer + 1, answer + 2]) {
      if (value < 0) continue;
      const miss = stackMiss(p, known, focus.cell, value);
      assert.ok(miss.clash, `${p.id} ${value}`);
      assert.ok(miss.line.includes(value > answer ? "Try a smaller" : "Try a bigger"), `${p.id} ${value}: ${miss.line}`);
    }
  }
});

test("every scale puzzle has one answer of 1 to 12 gems", () => {
  for (const p of scales) {
    const info = S.check(p);
    assert.ok(info.unique && info.answerUnique && info.matches && info.inRange && info.noGemsOnAsk, p.id);
    for (const fact of p.facts) for (const side of [fact.left, fact.right]) assert.ok(S.weigh(side, p.weights) <= 12, p.id);
  }
});

test("a scale miss tips the right way and has hints for every step", () => {
  for (const p of scales) {
    for (const gems of [p.answer - 1, p.answer + 1, 1, 12]) {
      if (gems < 0 || gems === p.answer) continue;
      const miss = scaleMiss(p, gems);
      assert.equal(miss.tip, gems > p.answer ? "down" : "up");
      assert.ok(miss.line.length > 10);
    }
    for (const step of [1, 2]) assert.ok(scaleHint(p, step).line, `${p.id} ${step}`);
  }
});
