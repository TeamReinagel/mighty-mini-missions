import assert from "node:assert/strict";
import test from "node:test";
import { addWithTrade, countRound, patternRound, rngFrom, soundRound, SOUND_GROUPS, subWithTrade, teamRound } from "./rounds.mjs";

test("a trade always has ten or more ones, and a subtraction has to break a ten", () => {
  const rng = rngFrom(7);
  for (let i = 0; i < 30; i += 1) {
    const fixed = addWithTrade(rng, true);
    assert.equal(fixed.a, 27);
    assert.equal(fixed.b, 15);
    const add = addWithTrade(rng, false);
    assert.ok((add.a % 10) + (add.b % 10) >= 10, `${add.a}+${add.b}`);
    assert.ok(add.a + add.b <= 99);
    const sub = subWithTrade(rng);
    assert.ok(sub.a > sub.b);
    assert.ok((sub.a % 10) < (sub.b % 10), `${sub.a}-${sub.b}`);
  }
});

test("a count stays inside its level and the right number is one of the choices", () => {
  const rng = rngFrom(3);
  for (let i = 0; i < 20; i += 1) {
    const item = countRound(11, 20, rng);
    assert.ok(item.count >= 11 && item.count <= 20);
    assert.ok(item.choices.includes(item.count));
    assert.equal(new Set(item.choices).size, item.choices.length);
  }
});

test("a pattern, a sound, and a letter team each have one right answer", () => {
  const rng = rngFrom(9);
  const pattern = patternRound(rng);
  assert.ok(pattern.choices.includes(pattern.answer));
  const sound = soundRound(SOUND_GROUPS[0], rng);
  assert.ok(sound.choices.includes(sound.answer));
  assert.equal(sound.choices.length, 3);
  const team = teamRound("sh", rng);
  assert.ok(team.choices.includes(team.answer));
  assert.equal(team.choices.filter((word) => word.includes("sh")).length, 1);
});
