import assert from "node:assert/strict";
import test from "node:test";
import { gardenEmpty, gardenMiss, gardenPrompt, gardenRemind, nearby, shape, splitBeds } from "../flower-beds/beds.mjs";

test("a full bed is ten, and the rest go in the second bed", () => {
  assert.deepEqual(splitBeds(0), { first: 0, second: 0 });
  assert.deepEqual(splitBeds(9), { first: 9, second: 0 });
  assert.deepEqual(splitBeds(10), { first: 10, second: 0 });
  assert.deepEqual(splitBeds(14), { first: 10, second: 4 });
  assert.deepEqual(splitBeds(20), { first: 10, second: 10 });
  assert.deepEqual(splitBeds(25), { first: 10, second: 10 });
});

test("the other gardens are the nearest amounts", () => {
  assert.deepEqual(nearby(14), [14, 13, 15]);
  assert.deepEqual(nearby(10), [10, 9, 11]);
  assert.deepEqual(nearby(20), [20, 19, 18]);
  assert.deepEqual(nearby(1), [1, 2, 3]);
});

test("a miss tells her to count and does not report how many she planted", () => {
  const say = (n) => `«${n}»`;
  for (const verdict of ["short", "over"]) {
    const line = gardenMiss(verdict, 14, say);
    assert.match(line, /«14»/);
    assert.match(line, /Try again/);
    assert.doesNotMatch(line, /«(?!14»)\d+»/);
    assert.doesNotMatch(line, /that'?s enough/i);
  }
  const prompt = gardenPrompt(14, say);
  assert.match(prompt, /Count the flowers/);
  assert.doesNotMatch(prompt, /that'?s enough/i);
  assert.match(gardenEmpty(14, say), /«14»/);
  assert.doesNotMatch(gardenEmpty(14, say), /«0»/);
  assert.doesNotMatch(gardenRemind(14, say), /that'?s enough/i);
  assert.match(gardenRemind(14, say), /«14»/);
});

test("the words name a full bed and the extras", () => {
  const say = (n) => ["zero", "one", "two", "three", "four"][n];
  assert.equal(shape(10, say), "This bed is full.");
  assert.equal(shape(14, say), "One full bed and four more.");
  assert.equal(shape(20, say), "Both beds are full.");
  assert.equal(shape(4, say), "four in the first bed.");
});
