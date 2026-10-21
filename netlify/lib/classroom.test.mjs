import assert from "node:assert/strict";
import test from "node:test";
import { CVC } from "./classroom-content.mjs";
import {
  applyAttempt, buildDay, conferencePackage, decidePlan, handleClassroom, isMastered, memoryStore, rhythmFor, stepById, weekdayIndex
} from "./classroom.mjs";

const MONDAY = "2026-10-19";
const WEDNESDAY = "2026-10-21";
const FRIDAY = "2026-10-23";

test("weekday rhythm follows the Learning Land week", () => {
  assert.equal(weekdayIndex(MONDAY), 1);
  assert.equal(rhythmFor(weekdayIndex(MONDAY)), "full");
  assert.equal(rhythmFor(weekdayIndex(WEDNESDAY)), "light");
  assert.equal(rhythmFor(weekdayIndex("2026-10-20")), "group");
  assert.equal(rhythmFor(weekdayIndex(FRIDAY)), "full");
  assert.equal(rhythmFor(weekdayIndex("2026-10-24")), "weekend");
});

test("a step is mastered after a solid run and stays mastered", () => {
  const rule = { masteryMin: 6, masteryHits: 5 };
  let rec;
  for (let i = 0; i < 5; i += 1) rec = applyAttempt(rec, true, rule);
  assert.equal(rec.mastered, false);
  rec = applyAttempt(rec, true, rule);
  assert.equal(isMastered(rec, rule), true);
  rec = applyAttempt(rec, false, rule);
  assert.equal(rec.mastered, true);
});

test("lesson items stay inside the real word lists", () => {
  const day = buildDay({ kidId: "gabi", date: MONDAY });
  const reading = day.cards.find((card) => card.stepId === "gabi-sounds");
  assert.ok(reading);
  for (const item of reading.items) {
    assert.ok(item.choices.some((choice) => choice.id === item.answer));
  }
  const cvc = stepById("gabi", "gabi-cvc-a");
  const again = buildDay({
    kidId: "gabi",
    date: FRIDAY,
    state: { steps: { "gabi-sounds": { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] } } }
  });
  const words = again.cards.find((card) => card.stepId === "gabi-cvc-a");
  assert.ok(words);
  for (const item of words.items) assert.ok(CVC.a.includes(item.word), item.word);
  assert.equal(cvc.activity, "cvc");
});

test("regrouping always has ten or more ones to trade", () => {
  const day = buildDay({ kidId: "max", date: MONDAY });
  const lesson = day.cards.find((card) => card.kind === "lesson");
  assert.equal(lesson.stepId, "max-regroup-show");
  for (const item of lesson.items) {
    assert.ok((item.a % 10) + (item.b % 10) >= 10);
    for (const prompt of item.prompts) assert.ok(prompt.choices.some((choice) => choice.id === prompt.answer));
  }
});

test("day length follows the rhythm", () => {
  const gabiFull = buildDay({ kidId: "gabi", date: MONDAY });
  assert.equal(gabiFull.rhythm, "full");
  assert.equal(gabiFull.cards.length, 4);
  assert.ok(gabiFull.cards.some((card) => card.stepId === "gabi-sounds"));
  assert.ok(gabiFull.cards.some((card) => card.stepId === "gabi-count-10"));
  assert.ok(gabiFull.cards.some((card) => card.kind === "move"));

  const gabiLight = buildDay({ kidId: "gabi", date: WEDNESDAY });
  assert.equal(gabiLight.rhythm, "light");
  assert.equal(gabiLight.cards.length, 2);
  assert.equal(gabiLight.cards.filter((card) => card.kind === "lesson").length, 1);

  const maxFull = buildDay({ kidId: "max", date: FRIDAY });
  assert.deepEqual(maxFull.cards.map((card) => card.kind), ["app", "app", "lesson", "game"]);
  assert.equal(maxFull.cards[0].askLesson, true);

  const connor = buildDay({ kidId: "connor", date: MONDAY });
  assert.ok(connor.cards.some((card) => card.stepId === "connor-names-1"));
  assert.ok(connor.cards.some((card) => card.stepId === "connor-count-5"));
});

test("a hold keeps the child on the step they already know", () => {
  const state = {
    steps: {
      "gabi-sounds": { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] }
    }
  };
  const plan = { holds: { "gabi-cvc-a": { why: "not yet" } }, kids: {}, asked: {}, noticed: {}, celebrated: {} };
  const day = buildDay({ kidId: "gabi", date: MONDAY, state, plan });
  const reading = day.cards.find((card) => card.kind === "lesson" && card.skill === "Letter sounds");
  assert.equal(reading.review, true);
  assert.equal(day.cards.some((card) => card.stepId === "gabi-cvc-a"), false);
});

test("conference asks before a new strand, a long struggle, or the end of Reading.com", () => {
  const struggling = {
    steps: { "gabi-sounds": { graded: 8, correct: 2, recent: [false, false, false, false, false, false, false, false] } }
  };
  const pack = conferencePackage({
    roster: [
      { id: "gabi", name: "Gabi", state: struggling },
      { id: "max", name: "Max", state: { readingLesson: 120, steps: {} } },
      { id: "connor", name: "Connor", state: { steps: {}, days: {} } },
      { id: "ethan", name: "Ethan", state: { steps: {}, days: {} } }
    ],
    plan: {}
  });
  assert.ok(pack.decisions.some((item) => item.id === "slow-gabi-sounds"));
  assert.ok(pack.decisions.some((item) => item.id === "read-120"));

  const ready = conferencePackage({
    roster: [{
      id: "gabi",
      name: "Gabi",
      state: { steps: { "gabi-sounds": { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] } } }
    }],
    plan: {}
  });
  assert.ok(ready.decisions.some((item) => item.id === "go-gabi-cvc-a"));
});

test("answering updates mastery and a cheer waits for the channel", async () => {
  const store = memoryStore();
  const now = new Date("2026-10-21T17:00:00Z");
  const today = await handleClassroom({ store, body: { action: "today", kid: "gabi" }, now });
  const lesson = today.body.cards.find((card) => card.kind === "lesson");
  const item = lesson.items[0];
  const wrong = item.choices.find((choice) => choice.id !== item.answer);
  const missed = await handleClassroom({
    store,
    body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: item.item, picked: wrong.id },
    now
  });
  assert.equal(missed.body.correct, false);
  const hit = await handleClassroom({
    store,
    body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: item.item, picked: item.answer },
    now
  });
  assert.equal(hit.body.correct, true);

  const stuck = await handleClassroom({
    store,
    env: {},
    body: { action: "help", kid: "gabi", stepId: lesson.stepId, item: item.item, tries: 3 },
    now
  });
  assert.equal(stuck.body.alertParent, true);

  const spoken = await handleClassroom({ store, body: { action: "speak", kid: "gabi", text: "Hi Gabi." }, now });
  assert.equal(spoken.body.audioBase64, "");
  assert.equal(spoken.body.spokenText, "Hi Gabi.");
});

test("an approved conference decision is remembered", async () => {
  const store = memoryStore();
  const posted = await import("./classroom.mjs");
  await store.setJSON("classroom/decisions", {
    "read-120": { id: "read-120", kind: "celebrate", prompt: "Max finished.", status: "pending" }
  });
  const yes = await decidePlan({ store, id: "read-120", yes: true, user: "U1" });
  assert.match(yes.line, /Approved/);
  const again = await decidePlan({ store, id: "read-120", yes: true, user: "U1" });
  assert.match(again.error, /Already/);
  const plan = await posted.loadPlan(store);
  assert.equal(plan.celebrated.reading120, "yes");
  assert.equal(plan.asked["read-120"], "approved");
});
