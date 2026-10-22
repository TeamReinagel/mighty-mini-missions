import assert from "node:assert/strict";
import test from "node:test";
import { CVC, itemsFor, wordParts } from "./classroom-content.mjs";
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
  const step = stepById("gabi", "gabi-cvc-a");
  const items = itemsFor({ ...step, items: 4 }, MONDAY, []);
  for (const item of items) {
    assert.ok(CVC.a.includes(item.word), item.word);
    assert.equal(item.answer, item.word);
    assert.equal(item.parts.map((part) => part.letters).join(""), item.word);
    assert.match(item.say, /Push them together/);
  }
  const day = buildDay({ kidId: "gabi", date: MONDAY });
  const reading = day.cards.find((card) => card.stepId === "gabi-cvc-a");
  assert.equal(reading.kind, "game");
  assert.match(reading.href, /otter-slide/);
  assert.equal(day.cards.some((card) => card.stepId === "gabi-sounds"), false);
});

test("regrouping opens as Block Trade", () => {
  const day = buildDay({ kidId: "max", date: MONDAY });
  const lesson = day.cards.find((card) => card.stepId === "max-regroup-show");
  assert.equal(lesson.gameId, "block-trade");
  assert.match(lesson.href, /block-trade/);
  assert.match(lesson.say, /Trade 10/);
  const items = itemsFor(stepById("max", "max-regroup-show"), MONDAY, []);
  for (const item of items) {
    assert.ok((item.a % 10) + (item.b % 10) >= 10);
    for (const prompt of item.prompts) assert.ok(prompt.choices.some((choice) => choice.id === prompt.answer));
  }
});

test("day length follows the rhythm", () => {
  const gabiFull = buildDay({ kidId: "gabi", date: MONDAY });
  assert.equal(gabiFull.rhythm, "full");
  assert.equal(gabiFull.cards.length, 5);
  assert.ok(gabiFull.cards.some((card) => card.stepId === "gabi-cvc-a"));
  assert.ok(gabiFull.cards.some((card) => card.stepId === "gabi-count-10"));
  assert.ok(gabiFull.cards.every((card) => card.minutes === 15));

  const gabiLight = buildDay({ kidId: "gabi", date: WEDNESDAY });
  assert.equal(gabiLight.rhythm, "light");
  assert.equal(gabiLight.cards.length, 4);
  assert.equal(gabiLight.cards.filter((card) => card.stepId).length, 2);
  assert.equal(gabiLight.cards.reduce((sum, card) => sum + card.minutes, 0), 60);

  const gabiGroup = buildDay({ kidId: "gabi", date: "2026-10-20" });
  assert.equal(gabiGroup.rhythm, "group");
  assert.equal(gabiGroup.cards.reduce((sum, card) => sum + card.minutes, 0), 75);

  const maxFull = buildDay({ kidId: "max", date: FRIDAY });
  assert.deepEqual(maxFull.cards.map((card) => card.kind), ["app", "app", "game", "game", "move"]);
  assert.equal(maxFull.cards[0].askLesson, true);
  assert.equal(maxFull.cards.reduce((sum, card) => sum + card.minutes, 0), 75);

  const maxLight = buildDay({ kidId: "max", date: WEDNESDAY });
  assert.equal(maxLight.cards.length, 4);
  assert.equal(maxLight.cards.reduce((sum, card) => sum + card.minutes, 0), 60);

  const connor = buildDay({ kidId: "connor", date: MONDAY });
  assert.ok(connor.cards.some((card) => card.stepId === "connor-names-1"));
  assert.ok(connor.cards.some((card) => card.stepId === "connor-count-5"));
  assert.equal(connor.cards.length, 5);

  const ethan = buildDay({ kidId: "ethan", date: MONDAY });
  assert.ok(ethan.cards.every((card) => card.minutes <= 8));
});

test("a hold keeps the child on the step they already know", () => {
  const state = {
    steps: {
      "gabi-cvc-a": { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] }
    }
  };
  const plan = { holds: { "gabi-cvc-e": { why: "not yet" } }, kids: {}, asked: {}, noticed: {}, celebrated: {} };
  const day = buildDay({ kidId: "gabi", date: MONDAY, state, plan });
  const reading = day.cards.find((card) => card.stepId === "gabi-cvc-a");
  assert.equal(reading.stepId, "gabi-cvc-a");
  assert.equal(reading.review, true);
  assert.equal(day.cards.some((card) => card.stepId === "gabi-cvc-e"), false);
});

test("conference asks before a new strand, a long struggle, or the end of Reading.com", () => {
  const struggling = {
    steps: { "gabi-cvc-a": { graded: 8, correct: 2, recent: [false, false, false, false, false, false, false, false] } }
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
  assert.ok(pack.decisions.some((item) => item.id === "slow-gabi-cvc-a"));
  assert.ok(pack.decisions.some((item) => item.id === "read-120"));

  const mastered = { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] };
  const ready = conferencePackage({
    roster: [{
      id: "gabi",
      name: "Gabi",
      state: {
        steps: {
          "gabi-cvc-a": mastered,
          "gabi-cvc-e": mastered,
          "gabi-cvc-i": mastered,
          "gabi-cvc-o": mastered,
          "gabi-cvc-u": mastered
        }
      }
    }],
    plan: {}
  });
  assert.ok(ready.decisions.some((item) => item.id === "go-gabi-sh"));
  assert.equal(ready.decisions.some((item) => item.id === "go-gabi-cvc-a"), false);
});

const MASTERED = { mastered: true, graded: 6, correct: 6, recent: [true, true, true, true, true, true] };

async function gabiReadyToAdd(store) {
  await store.setJSON("classroom/kid/gabi", {
    steps: {
      "gabi-count-10": MASTERED,
      "gabi-count-20": MASTERED,
      "gabi-numbers": MASTERED,
      "gabi-more": MASTERED,
      "gabi-patterns": MASTERED
    }
  });
}

test("answering updates mastery and a cheer waits for the channel", async () => {
  const store = memoryStore();
  const now = new Date("2026-10-21T17:00:00Z");
  const step = stepById("gabi", "gabi-add");
  const item = itemsFor(step, "2026-10-21", [])[0];
  const wrong = item.choices.find((choice) => choice.id !== item.answer);
  await handleClassroom({ store, body: { action: "today", kid: "gabi" }, now });
  const missed = await handleClassroom({
    store,
    body: { action: "answer", kid: "gabi", stepId: step.id, item: item.item, picked: wrong.id },
    now
  });
  assert.equal(missed.body.correct, false);
  const hit = await handleClassroom({
    store,
    body: { action: "answer", kid: "gabi", stepId: step.id, item: item.item, picked: item.answer },
    now: new Date(now.getTime() + 2000)
  });
  assert.equal(hit.body.correct, true);

  const stuck = await handleClassroom({
    store,
    env: {},
    body: { action: "help", kid: "gabi", stepId: step.id, item: item.item, tries: 3 },
    now
  });
  assert.equal(stuck.body.alertParent, true);

  const spoken = await handleClassroom({ store, body: { action: "speak", kid: "gabi", text: "Hi Gabi." }, now });
  assert.equal(spoken.body.audioBase64, "");
  assert.equal(spoken.body.spokenText, "Hi Gabi.");
});

test("a game stays on today's board after the skill is mastered", async () => {
  const store = memoryStore();
  const env = {};
  const monday = new Date("2026-10-19T15:00:00Z");
  await store.setJSON("classroom/kid/max", {
    steps: { "max-regroup-show": { graded: 2, correct: 2, recent: [true, true] } }
  });
  const first = await handleClassroom({ store, env, body: { action: "today", kid: "max" }, now: monday });
  const lesson = first.body.cards.find((card) => card.stepId === "max-regroup-show");
  assert.equal(lesson.gameId, "block-trade");
  const titles = first.body.cards.map((card) => card.title);

  const mastering = await handleClassroom({
    store,
    env,
    body: { action: "practice", kid: "max", step: "max-regroup-show", item: "27 + 15", correct: true },
    now: monday
  });
  assert.equal(mastering.body.correct, true);
  assert.equal(mastering.body.justMastered, true);

  const stillThere = await handleClassroom({
    store,
    env,
    body: { action: "practice", kid: "max", step: "max-regroup-show", item: "27 + 15", correct: true },
    now: new Date(monday.getTime() + 2000)
  });
  assert.equal(stillThere.status, 200);
  assert.equal(stillThere.body.correct, true);

  const again = await handleClassroom({ store, env, body: { action: "today", kid: "max" }, now: monday });
  assert.deepEqual(again.body.cards.map((card) => card.title), titles);
  assert.equal(again.body.cards.find((card) => card.stepId === "max-regroup-show").gameId, "block-trade");

  const tuesday = await handleClassroom({
    store,
    env,
    body: { action: "today", kid: "max" },
    now: new Date("2026-10-20T15:00:00Z")
  });
  const next = tuesday.body.cards.find((card) => card.stepId === "max-regroup");
  assert.equal(next.gameId, "block-trade");
});

test("a missed question does not replace the ones already on the card", async () => {
  const store = memoryStore();
  const env = {};
  const now = new Date("2026-10-19T15:00:00Z");
  await gabiReadyToAdd(store);
  const first = await handleClassroom({ store, env, body: { action: "today", kid: "gabi" }, now });
  const lesson = first.body.cards.find((card) => card.stepId === "gabi-add");
  const words = lesson.items.map((item) => item.item);
  const missed = await handleClassroom({
    store,
    env,
    body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: words[0], index: 0, picked: "nope" },
    now
  });
  assert.equal(missed.body.correct, false);
  const second = lesson.items[1];
  const kept = await handleClassroom({
    store,
    env,
    body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: second.item, index: 1, picked: second.answer },
    now: new Date(now.getTime() + 2000)
  });
  assert.equal(kept.body.correct, true);
  const again = await handleClassroom({ store, env, body: { action: "today", kid: "gabi" }, now: new Date(now.getTime() + 4000) });
  const next = again.body.cards.find((card) => card.stepId === "gabi-add");
  assert.deepEqual(next.items.map((item) => item.item), words);
});

test("a lesson cannot be checked off until the questions are answered", async () => {
  const store = memoryStore();
  const env = {};
  const now = new Date("2026-10-19T15:00:00Z");
  await gabiReadyToAdd(store);
  const first = await handleClassroom({ store, env, body: { action: "today", kid: "gabi" }, now });
  const lesson = first.body.cards.find((card) => card.stepId === "gabi-add");
  assert.equal(lesson.kind, "lesson");
  const skipped = await handleClassroom({
    store,
    env,
    body: { action: "card", kid: "gabi", cardId: lesson.id, status: "done" },
    now
  });
  assert.equal(skipped.body.redo, true);
  const open = await handleClassroom({ store, env, body: { action: "today", kid: "gabi" }, now });
  assert.equal(open.body.cards.find((card) => card.id === lesson.id).done, false);

  let at = now.getTime();
  for (const item of lesson.items) {
    at += 2000;
    const hit = await handleClassroom({
      store,
      env,
      body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: item.item, picked: item.answer },
      now: new Date(at)
    });
    assert.equal(hit.body.correct, true);
  }
  const done = await handleClassroom({
    store,
    env,
    body: { action: "card", kid: "gabi", cardId: lesson.id, status: "done" },
    now: new Date(at + 2000)
  });
  assert.equal(done.body.ok, true);
  assert.equal(done.body.redo, undefined);
});

test("a second tap in the same breath does not count", async () => {
  const store = memoryStore();
  const env = {};
  const now = new Date("2026-10-19T15:00:00Z");
  const step = stepById("connor", "connor-names-1");
  const items = itemsFor(step, MONDAY, []);
  await handleClassroom({ store, env, body: { action: "today", kid: "connor" }, now });
  const hit = await handleClassroom({
    store,
    env,
    body: { action: "answer", kid: "connor", stepId: step.id, item: items[0].item, picked: items[0].answer },
    now
  });
  assert.equal(hit.body.correct, true);
  const rushed = await handleClassroom({
    store,
    env,
    body: { action: "answer", kid: "connor", stepId: step.id, item: items[1].item, picked: items[1].answer },
    now: new Date(now.getTime() + 200)
  });
  assert.equal(rushed.body.wait, true);
  assert.equal(rushed.body.correct, null);
});

test("the voice lab plays the voice that was asked for, and ignores a made-up one", async () => {
  const store = memoryStore();
  const used = [];
  const fetchImpl = async (url, init) => {
    used.push(JSON.parse(init.body));
    return { ok: true, arrayBuffer: async () => new Uint8Array(64).buffer };
  };
  const env = { OPENAI_API_KEY: "test-key" };
  const asked = await handleClassroom({ store, env, fetchImpl, body: { action: "speak", kid: "gabi", voice: "sage", text: "Hi." } });
  assert.ok(asked.body.audioBase64);
  assert.equal(used.at(-1).voice, "sage");
  assert.equal(asked.body.voice, "sage");
  const fake = await handleClassroom({ store, env, fetchImpl, body: { action: "speak", kid: "gabi", voice: "darth", text: "Hi." } });
  assert.equal(used.at(-1).voice, "coral");
  assert.equal(fake.body.voice, undefined);
  const again = await handleClassroom({ store, env, fetchImpl, body: { action: "speak", kid: "gabi", voice: "sage", text: "Hi." } });
  assert.equal(again.body.audioBase64, asked.body.audioBase64);
  assert.equal(used.length, 2);
});

test("sh and ch and th stay one sound", () => {
  assert.deepEqual(wordParts("ship").map((part) => part.letters), ["sh", "i", "p"]);
  assert.deepEqual(wordParts("fish").map((part) => part.sound), ["fff", "ih", "sh"]);
  assert.deepEqual(wordParts("stop").map((part) => part.letters), ["s", "t", "o", "p"]);
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
