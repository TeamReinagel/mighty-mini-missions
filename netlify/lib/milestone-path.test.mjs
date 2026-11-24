import assert from "node:assert/strict";
import test from "node:test";
import { CHAINS, buildDay, goalsOf, handleClassroom, memoryStore } from "./classroom.mjs";
import { allMilestones } from "./kids.mjs";
import { coverage, findGaps, runGapCheck } from "./milestone-gaps.mjs";
import { baselineMet } from "./baselines.mjs";

const MASTERED = { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] };
const TUESDAY = "2026-11-24";
const ORDER = new Map(allMilestones().map((goal, index) => [goal.id, index]));

test("every step on Gabi's path names a Kindergarten goal, in the sheet's month order", () => {
  for (const chain of CHAINS.gabi) {
    let last = -1;
    for (const def of chain.steps) {
      const [goal] = goalsOf(def);
      assert.match(goal || "", /^K-/, def.id);
      const at = ORDER.get(goal);
      assert.ok(at >= last, `${def.id} (${goal}) comes before an earlier month`);
      last = at;
    }
  }
});

test("Otter Slide play credits each word to its own vowel step", async () => {
  const store = memoryStore();
  const now = new Date(`${TUESDAY}T15:00:00Z`);
  for (const word of ["dog", "dog", "mop", "fox", "log", "top", "box"]) {
    await handleClassroom({ store, env: {}, body: { action: "practice", kid: "gabi", step: "gabi-cvc-a", item: word, correct: true }, now });
  }
  const saved = await store.get("classroom/kid/gabi", { type: "json" });
  assert.equal(saved.steps["gabi-cvc-o"].mastered, true);
  assert.equal(saved.steps["gabi-cvc-a"], undefined);
  assert.equal(saved.credited, undefined, "report credits are read fresh, never saved with the child");
});

test("a goal the Friday report credited moves Gabi's board past it", async () => {
  const store = memoryStore();
  await store.setJSON("state/report.json", {
    kids: { gabi: { milestones: { "K-Sep-Math-1": { date: "2026-11-20" } } } }
  });
  const today = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now: new Date(`${TUESDAY}T15:00:00Z`) });
  const steps = today.body.cards.map((card) => card.stepId).filter(Boolean);
  assert.deepEqual(steps, ["gabi-sight-1", "gabi-count-20"]);
});

test("Gabi's bonus game changes from day to day and is never the game already on her board", () => {
  const state = { steps: { "gabi-cvc-a": MASTERED, "gabi-count-10": MASTERED, "gabi-numbers": MASTERED } };
  const days = ["2026-11-24", "2026-11-26", "2026-12-01", "2026-12-03"];
  const bonuses = days.map((date) => {
    const day = buildDay({ kidId: "gabi", date, state });
    const bonus = day.cards.find((card) => card.part === "bonus" && card.kind === "game");
    const board = day.cards.filter((card) => card.part !== "bonus").map((card) => card.gameId);
    assert.equal(board.includes(bonus.gameId), false, date);
    return bonus.gameId;
  });
  assert.ok(new Set(bonuses).size >= 3, bonuses.join(", "));
  for (let i = 1; i < bonuses.length; i += 1) assert.notEqual(bonuses[i], bonuses[i - 1]);
});

test("a goal with nothing to teach it is a gap, and the next goal is checked too", () => {
  const met = new Set(["K-Sep-Reading-1", "K-Oct-Reading-1", "K-Sep-Math-1", "K-Oct-Math-1", "K-Nov-Math-1"]);
  const gaps = findGaps("gabi", met);
  const math = gaps.filter((gap) => gap.goal.area === "Math");
  assert.deepEqual(math.map((gap) => [gap.goal.id, gap.when, gap.kind]), [["K-Dec-Math-1", "now", "none"], ["K-Jan-Math-1", "next", "none"]]);
  assert.equal(gaps.some((gap) => gap.goal.id === "K-Dec-Reading-1"), false, "Word Tree covers December sight words");
  assert.equal(gaps.some((gap) => gap.goal.id === "K-Nov-Reading-1"), false, "Otter Slide covers short-vowel words");

  // A goal Joyce teaches only as a lesson is still a gap: Max's solid shapes, once December
  // and April math are met.
  const maxMet = new Set([...baselineMet("max"), "G1-Dec-Math-1", "G1-Apr-Math-1"]);
  const shapes = findGaps("max", maxMet).find((gap) => gap.goal.id === "G1-May-Math-1");
  assert.equal(shapes.kind, "lesson");
  assert.deepEqual(shapes.lessons, ["Solid shapes"]);
});

test("the November 24 gaps all have games now", () => {
  for (const kidId of ["gabi", "max", "connor"]) {
    assert.deepEqual(findGaps(kidId, new Set(baselineMet(kidId))), [], kidId);
  }
  assert.deepEqual(coverage("gabi", "K-Dec-Reading-1").games, ["Word Tree"]);
  assert.deepEqual(coverage("max", "G1-Dec-ELA-1").games, ["Word Workshop"]);
  assert.deepEqual(coverage("max", "G1-Feb-ELA-1").games, ["Word Workshop"]);
  assert.deepEqual(coverage("max", "G1-Dec-Math-1").games, ["Penguin Pond"]);
  assert.deepEqual(coverage("max", "G1-Apr-Math-1").games, ["Penguin Pond"]);
  assert.deepEqual(coverage("connor", "KR-Read-5").games, ["Letter Lights"]);
});

test("Stephanie hears about each gap once, and again when the child reaches it", async () => {
  const store = memoryStore();
  const sent = [];
  const fetchImpl = async (url, opts) => {
    sent.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({ ok: true }) };
  };
  const env = { SLACK_BOT_TOKEN: "xoxb-test", JOYCE_APPROVERS: "U0STEPH" };
  // From the baselines, every goal now and next has a game, so nothing is sent.
  const first = await runGapCheck({ store, env, fetchImpl, now: new Date("2026-11-24T13:00:00Z") });
  assert.equal(first.sent, false);
  assert.equal(sent.length, 0);

  const again = await runGapCheck({ store, env, fetchImpl, now: new Date("2026-11-24T14:00:00Z") });
  assert.equal(again.sent, false, "once a day");
  const nextDay = await runGapCheck({ store, env, fetchImpl, now: new Date("2026-11-25T13:00:00Z") });
  assert.equal(nextDay.sent, false, "nothing new");

  // Gabi finishes September and October math: December's math, with nothing to teach it, is up next.
  const math = ["gabi-count-10", "gabi-numbers", "gabi-count-20", "gabi-patterns"];
  await store.setJSON("classroom/kid/gabi", { steps: Object.fromEntries(math.map((id) => [id, MASTERED])) });
  const ahead = await runGapCheck({ store, env, fetchImpl, now: new Date("2026-11-26T13:00:00Z") });
  assert.equal(ahead.sent, true);
  assert.equal(sent.at(-1).body.channel, "U0STEPH");
  assert.match(sent.at(-1).body.text, /Gabi\*, Kindergarten Math \(up next\).*K-Dec-Math-1/s);
  assert.doesNotMatch(sent.at(-1).body.text, /K-Dec-Reading-1/, "Word Tree covers it");

  // November math done too: she has reached December's math, so it comes once more.
  const through = [...math, "gabi-more", "gabi-add", "gabi-add-10"];
  await store.setJSON("classroom/kid/gabi", { steps: Object.fromEntries(through.map((id) => [id, MASTERED])) });
  const reached = await runGapCheck({ store, env, fetchImpl, now: new Date("2026-11-27T13:00:00Z") });
  assert.equal(reached.sent, true);
  assert.match(sent.at(-1).body.text, /Gabi\*, Kindergarten Math \(working on now\).*K-Dec-Math-1/s);
});
