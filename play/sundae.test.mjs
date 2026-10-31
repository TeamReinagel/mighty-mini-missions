import assert from "node:assert/strict";
import test from "node:test";
import { checkOrder, emptyPrompt, missPrompt, orderPrompt, placeScoops } from "../snack-count/stand.mjs";

const say = (n) => `«${n}»`;

test("every scoop lands, including the one past the order", () => {
  assert.equal(placeScoops(0, 1), 1);
  assert.equal(placeScoops(7, 1), 8);
  assert.equal(placeScoops(40, 10), 50);
  assert.equal(placeScoops(5, "1"), 6);
});

test("the order is checked when the child serves", () => {
  assert.equal(checkOrder(4, 4), "exact");
  assert.equal(checkOrder(3, 4), "short");
  assert.equal(checkOrder(5, 4), "over");
  assert.equal(checkOrder(0, 4), "short");
});

test("a miss tells them to count and does not report how many they made", () => {
  for (const verdict of ["short", "over"]) {
    const line = missPrompt({ verdict, count: 7, holder: "in the dish", say });
    assert.match(line, /«7»/);
    assert.match(line, /Try again/);
    assert.doesNotMatch(line, /«(?!7»)\d+»/);
    assert.doesNotMatch(line, /that'?s enough/i);
    assert.doesNotMatch(line, /\b(one|two|three|four|five|six|eight)\b/i);
  }
  const party = missPrompt({ verdict: "over", count: 47, party: true, say });
  assert.match(party, /The order is 47/);
  assert.match(party, /Try again/);
  assert.doesNotMatch(party, /that'?s enough/i);
  assert.equal(party.includes("48"), false);
  assert.equal(party.includes("50"), false);
});

test("the order stays the thing to count, and adding is not narrated", () => {
  const line = orderPrompt({ count: 4, holder: "on a cone", say });
  assert.match(line, /«4»/);
  assert.match(line, /Count them/);
  assert.doesNotMatch(line, /that'?s enough/i);
  const empty = emptyPrompt({ count: 4, holder: "on a cone", say });
  assert.match(empty, /«4»/);
  assert.doesNotMatch(empty, /«0»/);
});
