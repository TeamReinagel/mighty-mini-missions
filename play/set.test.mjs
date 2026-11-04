import assert from "node:assert/strict";
import test from "node:test";
import { ROUND_LENGTH, roundsFor } from "./round-length.mjs";

test("a round is the whole set, and Ethan plays half", () => {
  assert.equal(roundsFor("nest-numbers", "connor"), 4);
  assert.equal(roundsFor("snack-count", "gabi"), 6);
  assert.equal(roundsFor("color-tap", "ethan"), 3);
  assert.equal(ROUND_LENGTH["otter-slide"], 5);
  assert.equal(ROUND_LENGTH["hatch-match"], 5);
  assert.equal(ROUND_LENGTH["monster-hunt"], 6);
  assert.equal(ROUND_LENGTH["lost-helpers"], 4);
  assert.equal(roundsFor("lost-helpers", "ethan"), 2);
});
