import assert from "node:assert/strict";
import test from "node:test";
import { LETTER_NAMES, WRITE_LETTERS, WRITE_SIZES, recordWrite, writeLesson, writeToday } from "./handwriting.mjs";

test("every lowercase letter is taught once, with a spoken step for each stroke", () => {
  assert.deepEqual(WRITE_LETTERS.map((entry) => entry.letter).sort().join(""), "abcdefghijklmnopqrstuvwxyz");
  for (const entry of WRITE_LETTERS) {
    assert.ok(entry.strokes.length >= 1, entry.letter);
    for (const stroke of entry.strokes) {
      assert.match(stroke.d, /^M [\d.]+ [\d.]+ /, entry.letter);
      assert.ok(stroke.cue.length > 10, entry.letter);
    }
  }
});

test("a practice word only uses letters already taught", () => {
  for (let count = 0; count < WRITE_LETTERS.length; count += 1) {
    const plan = writeToday({ count });
    const known = new Set(WRITE_LETTERS.slice(0, count + 1).map((entry) => entry.letter));
    if (plan.word) assert.ok([...plan.word].every((ch) => known.has(ch)), `${plan.letter}: ${plan.word}`);
  }
  assert.equal(writeToday({ count: 0 }).word, null);
  assert.equal(writeToday({ count: WRITE_LETTERS.length }).letter, "c");
});

test("the lesson names the letter the way it is said and the paper to use", () => {
  const lesson = writeLesson({ letter: "d", word: "cod", size: 1 });
  assert.match(lesson.say, new RegExp(LETTER_NAMES.d));
  assert.match(lesson.sayText, /letter is d\./);
  assert.match(lesson.write, /small-box paper, write dee three/);
  assert.match(lesson.writeText, /write d three/);
  assert.equal(lesson.strokes[0].text, "Start like a c. Back and around.");
  assert.equal(lesson.strokes[0].cue, "Start like a see. Back and around.");
  assert.equal(lesson.wordSay, "Now write the word cod.");
  assert.equal(writeLesson({ letter: "c", word: null, size: 0 }).wordSay, null);
});

test("paper narrows after three fits and widens after two misses", () => {
  let writing = {};
  const day = (n) => `2026-10-${String(10 + n).padStart(2, "0")}`;
  const moves = [];
  [true, true, true, false, false, true].forEach((fits, n) => {
    const out = recordWrite(writing, { date: day(n), letter: "c", fits });
    writing = out.writing;
    moves.push(`${out.moved || "-"}:${writing.size}`);
  });
  assert.deepEqual(moves, ["-:0", "-:0", "narrower:1", "-:1", "wider:0", "-:0"]);
  assert.equal(recordWrite(writing, { date: day(5), letter: "c", fits: false }).repeat, true);

  let top = { size: WRITE_SIZES.length - 1 };
  for (let n = 0; n < 4; n += 1) top = recordWrite(top, { date: day(n), letter: "c", fits: true }).writing;
  assert.equal(top.size, WRITE_SIZES.length - 1);
});
