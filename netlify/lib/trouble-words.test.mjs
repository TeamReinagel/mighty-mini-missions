import assert from "node:assert/strict";
import test from "node:test";
import { askedWord, buildTroubleWords, loadTroubleWords } from "./trouble-words.mjs";

const ask = (word, t, kid = "max") => ({ from: "tablet", kind: "tablet-help", kids: [kid], t, saw: `the word ${word}` });
const play = (word, correct, t, kid = "max") => ({ kid, game: "ghost-word-run", skill: "Sight words: Moonlit Meadow (Words 1-50)", item: word, correct, t });

test("a tablet help note names its word", () => {
  assert.equal(askedWord(ask("would", "2026-10-20T14:47:51Z")), "would");
  assert.equal(askedWord({ from: "tablet", word: "Pounds" }), "pounds");
  assert.equal(askedWord({ from: "tablet", saw: "the word 'friends' in a story" }), "friends");
  assert.equal(askedWord({ from: "tablet", saw: "the word don't" }), "don't");
  assert.equal(askedWord({ from: "tablet", saw: "the number 34" }), "");
  assert.equal(askedWord({ from: "slack", saw: "the word would" }), "");
});

test("words asked about come first, newest first, with how often", () => {
  const out = buildTroubleWords({
    kidId: "max",
    observations: [ask("would", "2026-10-20T14:47:00Z"), ask("eight", "2026-10-20T14:49:00Z"), ask("would", "2026-10-20T15:07:00Z"), ask("cat", "2026-10-20T15:00:00Z", "gabi")]
  });
  assert.deepEqual(out.trouble, [{ word: "would", asks: 2 }, { word: "eight", asks: 1 }]);
});

test("an asked word leaves after 3 first-try right picks since the last ask", () => {
  const observations = [ask("would", "2026-10-20T10:00:00Z")];
  const stillTrouble = buildTroubleWords({
    kidId: "max",
    observations,
    events: [play("would", true, "2026-10-19T10:00:00Z"), play("would", true, "2026-10-20T11:00:00Z"), play("would", true, "2026-10-20T11:01:00Z")]
  });
  assert.deepEqual(stillTrouble.trouble.map((t) => t.word), ["would"]);
  const clear = buildTroubleWords({
    kidId: "max",
    observations,
    events: [play("would", true, "2026-10-20T11:00:00Z"), play("would", true, "2026-10-20T11:01:00Z"), play("would", true, "2026-10-20T11:02:00Z")]
  });
  assert.deepEqual(clear.trouble, []);
  assert.ok(clear.mastered.includes("would"));
});

test("game misses fill in behind asked words, most missed first", () => {
  const out = buildTroubleWords({
    kidId: "max",
    observations: [ask("would", "2026-10-20T10:00:00Z")],
    events: [
      play("by", false, "2026-10-19T10:00:00Z"), play("by", false, "2026-10-19T10:05:00Z"), play("by", true, "2026-10-19T10:06:00Z"),
      play("the", false, "2026-10-19T10:01:00Z"),
      play("would", false, "2026-10-19T10:02:00Z"),
      play("and", true, "2026-10-19T10:03:00Z")
    ]
  });
  assert.deepEqual(out.practice, ["by", "the"]);
  assert.ok(!out.mastered.includes("would"));
});

test("loading reads three weeks of notes and plays from the store", async () => {
  const now = Date.parse("2026-10-20T16:00:00Z");
  const data = new Map([
    [`observations/2026-10-20/${now - 1000}-tablet-1`, ask("would", "2026-10-20T15:59:00Z")],
    [`observations/2026-09-01/${Date.parse("2026-09-01T00:00:00Z")}-tablet-2`, ask("old", "2026-09-01T00:00:00Z")],
    [`events/2026-10-19/${now - 864e5}-a`, [play("by", false, "2026-10-19T16:00:00Z")]],
    ["state/report.json", { kids: { max: { items: { x: { game: "ghost-word-run", skill: "Sight words: Moonlit Meadow (Words 1-50)", item: "the", mastered: true } } } } }]
  ]);
  const store = {
    async list({ prefix }) { return { blobs: [...data.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
    async get(key) { return data.get(key) ?? null; }
  };
  const out = await loadTroubleWords({ store, kidId: "max", now });
  assert.deepEqual(out.trouble, [{ word: "would", asks: 1 }]);
  assert.deepEqual(out.practice, ["by"]);
  assert.deepEqual(out.mastered, ["the"]);
});
