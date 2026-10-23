import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const window = {};
vm.runInNewContext(fs.readFileSync(new URL("../games.js", import.meta.url), "utf8"), { window });

const game = (id) => window.MIGHTY_GAMES.find((item) => item.id === id);
const ethan = { id: "ethan", stage: "toddler", practicing: ["colors-shapes"] };
const gabi = { id: "gabi", stage: "prek", practicing: ["letters", "letter-sounds", "blending", "counting", "feelings", "missions"] };
const connor = { id: "connor", stage: "prek", practicing: ["counting", "letters", "colors-shapes"] };
const max = { id: "max", stage: "1st", practicing: ["sight-words", "rhyming", "money", "math-facts", "missions", "game-design"] };

test("the next skill stays hidden until the child is using the one before it", () => {
  const open = window.gameOpen;
  assert.equal(open(ethan, game("color-tap"), {}), true);
  assert.equal(open(ethan, game("snack-count"), {}), false);
  assert.equal(open(ethan, game("snack-count"), { colors: true }), true);
  assert.equal(open(connor, game("snack-count"), {}), true);
  assert.equal(open(connor, game("sound-bugs"), {}), false);
  assert.equal(open(connor, game("sound-bugs"), { letters: true }), true);
  assert.equal(open(connor, game("more-or-fewer"), { "count-20": true }), true);
  assert.equal(open(connor, game("pattern-park"), {}), false);
  assert.equal(open(gabi, game("sound-teams"), {}), false);
  assert.equal(open(gabi, game("sound-teams"), { blending: true }), true);
  assert.equal(open(gabi, game("otter-slide"), {}), true);
  assert.equal(open(max, game("block-trade"), {}), true);
  assert.equal(open(max, game("snack-count"), {}), true);
  assert.equal(open(max, game("more-or-fewer"), {}), false);
  assert.equal(open(gabi, game("today-with-joyce"), {}), true);
});
