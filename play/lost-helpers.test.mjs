import assert from "node:assert/strict";
import test from "node:test";
import { makeFind, noteStreak, defaultState, NEED } from "../lost-helpers/shops.mjs";

function seeded(seed = 5) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

test("a miss moves a helper back one stone, not all the way to the start", () => {
  const state = defaultState("connor");
  noteStreak(state, "paint", 1);
  noteStreak(state, "paint", 1);
  noteStreak(state, "paint", 1);
  assert.equal(state.shops.paint.streak, 3);
  noteStreak(state, "paint", -1);
  assert.equal(state.shops.paint.streak, 2);
  noteStreak(state, "paint", 0);
  assert.equal(state.shops.paint.streak, 2, "a trace finished after a slip holds the stone");
  noteStreak(state, "paint", 1);
  noteStreak(state, "paint", 1);
  assert.equal(state.shops.paint.home, true);
  noteStreak(state, "paint", -1);
  assert.equal(state.shops.paint.home, true, "home is for good");
  assert.equal(state.shops.paint.streak, NEED);
  noteStreak(state, "toys", -1);
  assert.equal(state.shops.toys.streak, 0, "never below the first stone");
});

test("the bakery never shows an empty plate", () => {
  const rng = seeded(9);
  for (const kid of ["max", "gabi"]) {
    const state = defaultState(kid);
    for (let i = 0; i < 3000; i += 1) {
      const find = makeFind("bakery", kid, state, rng);
      assert.ok(find.options.every((o) => o.count > 0), find.item);
      assert.equal(find.options.length, 3, find.item);
    }
  }
});

test("a path drawn in two lifts is two strokes, each with its own green dot", () => {
  const rng = seeded(2);
  const state = defaultState("connor");
  let cross = null;
  for (let i = 0; i < 400 && !cross; i += 1) {
    const find = makeFind("path", "connor", state, rng);
    if (find.item === "cross") cross = find;
  }
  assert.ok(cross, "the cross comes up");
  assert.equal(cross.paths.length, 2);
  for (const stroke of cross.paths) assert.match(stroke.d, /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
});
