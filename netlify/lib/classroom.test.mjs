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

test("a school day is reading, math, and one bonus, with no clock", () => {
  const parts = (day) => day.cards.map((card) => card.part);
  for (const date of [MONDAY, "2026-10-20", WEDNESDAY, FRIDAY]) {
    const gabi = buildDay({ kidId: "gabi", date });
    assert.deepEqual(gabi.dose.parts.map((part) => part.title), ["Reading", "Math", "Bonus"]);
    assert.deepEqual(parts(gabi), ["ela", "math", "bonus", "bonus"]);
    assert.ok(gabi.cards.some((card) => card.stepId === "gabi-cvc-a" && card.part === "ela"));
    assert.ok(gabi.cards.some((card) => card.stepId === "gabi-count-10" && card.part === "math"));
    assert.ok(gabi.cards.every((card) => card.minutes === undefined));
    assert.equal(gabi.dose.complete, false);
  }

  const max = buildDay({ kidId: "max", date: FRIDAY });
  assert.deepEqual(max.cards.map((card) => `${card.part}:${card.kind}`), ["ela:app", "math:app", "math:game", "bonus:game", "bonus:move"]);
  assert.equal(max.cards[0].askLesson, true);
  assert.match(max.greeting, /Trainer day\. Reading and math, then one bonus/);

  const connor = buildDay({ kidId: "connor", date: MONDAY });
  assert.deepEqual(connor.dose.parts.map((part) => part.title), ["Letters", "Counting", "Bonus"]);
  assert.ok(connor.cards.some((card) => card.stepId === "connor-names-1"));
  assert.ok(connor.cards.some((card) => card.stepId === "connor-count-5"));

  const ethan = buildDay({ kidId: "ethan", date: MONDAY });
  assert.deepEqual(ethan.dose.parts.map((part) => part.id), ["learn", "bonus"]);

  const weekend = buildDay({ kidId: "gabi", date: "2026-10-24" });
  assert.equal(weekend.dose, null);
  assert.equal(weekend.cards.length, 2);
});

const at = (iso, seconds = 0) => new Date(Date.parse(iso) + seconds * 1000);

async function logPlay(store, when, kid, game, count) {
  const events = Array.from({ length: count }, (_, i) => ({ id: `${game}-${i}`, kid, game, skill: "x", item: String(i), correct: i % 2 === 0 }));
  await store.setJSON(`events/${when.toISOString().slice(0, 10)}/${when.getTime()}-${game}`, events);
}

async function finishCard(store, kid, cardId, now) {
  return handleClassroom({ store, env: {}, body: { action: "card", kid, cardId, status: "done" }, now });
}

test("a game card counts only after real play since it was opened", async () => {
  const store = memoryStore();
  const start = "2026-10-19T15:00:00Z";
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now: at(start) });
  const otter = first.body.cards.find((card) => card.gameId === "otter-slide" && card.part === "ela");

  await logPlay(store, at(start, -600), "gabi", "otter-slide", 20);
  await handleClassroom({ store, env: {}, body: { action: "open", kid: "gabi", cardId: otter.id }, now: at(start, 5) });
  const tooSoon = await finishCard(store, "gabi", otter.id, at(start, 10));
  assert.equal(tooSoon.body.notYet, true);
  assert.equal(tooSoon.body.played, 0);

  await logPlay(store, at(start, 60), "gabi", "otter-slide", 5);
  await logPlay(store, at(start, 70), "max", "otter-slide", 5);
  const short = await finishCard(store, "gabi", otter.id, at(start, 80));
  assert.equal(short.body.notYet, true);
  assert.equal(short.body.played, 5);

  await logPlay(store, at(start, 120), "gabi", "otter-slide", 3);
  const played = await finishCard(store, "gabi", otter.id, at(start, 130));
  assert.equal(played.body.ok, true);
  const after = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now: at(start, 140) });
  assert.equal(after.body.dose.parts.find((part) => part.id === "ela").done, true);
});

test("Monster Hunt is checked under the name it logs, word-monsters", async () => {
  const store = memoryStore();
  const start = "2026-10-19T15:00:00Z";
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "connor" }, now: at(start) });
  const hunt = first.body.cards.find((card) => card.gameId === "monster-hunt");
  assert.equal(hunt.part, "bonus");
  await handleClassroom({ store, env: {}, body: { action: "open", kid: "connor", cardId: hunt.id }, now: at(start, 1) });
  await logPlay(store, at(start, 30), "connor", "word-monsters", 6);
  const done = await finishCard(store, "connor", hunt.id, at(start, 40));
  assert.equal(done.body.ok, true);
});

test("Max's reading counts only when he reports a new lesson today", async () => {
  const store = memoryStore();
  await store.setJSON("classroom/kid/max", { readingLesson: 101, readingDay: "2026-10-16" });
  const now = at("2026-10-19T15:00:00Z");
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "max" }, now });
  const reading = first.body.cards.find((card) => card.askLesson);

  const unreported = await finishCard(store, "max", reading.id, now);
  assert.equal(unreported.body.notYet, true);

  const same = await handleClassroom({ store, env: {}, body: { action: "reading", kid: "max", lesson: 101 }, now });
  assert.equal(same.body.ok, false);
  assert.match(same.body.say, /lesson 101/);

  const next = await handleClassroom({ store, env: {}, body: { action: "reading", kid: "max", lesson: 102 }, now });
  assert.equal(next.body.ok, true);
  const again = await handleClassroom({ store, env: {}, body: { action: "reading", kid: "max", lesson: 102 }, now });
  assert.equal(again.body.ok, true);
  const done = await finishCard(store, "max", reading.id, now);
  assert.equal(done.body.ok, true);
});

test("a lesson can be eased only after Joyce has called for help", async () => {
  const store = memoryStore();
  const now = at("2026-10-19T15:00:00Z");
  await gabiReadyToAdd(store);
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now });
  const lesson = first.body.cards.find((card) => card.stepId === "gabi-add");
  const early = await handleClassroom({ store, env: {}, body: { action: "card", kid: "gabi", cardId: lesson.id, status: "eased" }, now });
  assert.equal(early.status, 400);
  const help = await handleClassroom({ store, env: {}, body: { action: "help", kid: "gabi", stepId: lesson.stepId, item: lesson.items[0].item, tries: 3 }, now });
  assert.equal(help.body.canEase, true);
  const eased = await handleClassroom({ store, env: {}, body: { action: "card", kid: "gabi", cardId: lesson.id, status: "eased" }, now });
  assert.equal(eased.body.ok, true);
  const after = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now });
  assert.equal(after.body.dose.parts.find((part) => part.id === "math").done, true);
});

test("one bonus finishes the dose, and the room is done when everyone who started is done", async () => {
  const store = memoryStore();
  const start = "2026-10-19T15:00:00Z";
  const posted = [];
  const env = { JOYCE_CHEER_CHANNEL: "C1", SLACK_BOT_TOKEN: "xoxb-test" };
  const fetchImpl = async (url, init) => {
    posted.push(JSON.parse(init.body).text);
    return { ok: true, json: async () => ({ ok: true }) };
  };

  const ethan = await handleClassroom({ store, env, fetchImpl, body: { action: "today", kid: "ethan" }, now: at(start) });
  const gabi = await handleClassroom({ store, env, fetchImpl, body: { action: "today", kid: "gabi" }, now: at(start) });
  const waiting = await handleClassroom({ store, env, fetchImpl, body: { action: "room", kid: "ethan" }, now: at(start) });
  assert.equal(waiting.body.allDone, false);
  assert.deepEqual(waiting.body.kids.filter((entry) => entry.started).map((entry) => entry.name), ["Gabi", "Ethan"]);

  const finishAll = async (kid, cards, from) => {
    let t = from;
    for (const card of cards) {
      t += 10;
      await handleClassroom({ store, env, fetchImpl, body: { action: "open", kid, cardId: card.id }, now: at(start, t) });
      if (card.kind === "game") await logPlay(store, at(start, t + 2), kid, card.gameId === "monster-hunt" ? "word-monsters" : card.gameId, 10);
      const out = await handleClassroom({ store, env, fetchImpl, body: { action: "card", kid, cardId: card.id, status: "done" }, now: at(start, t + 5) });
      assert.equal(out.body.ok, true, `${kid} ${card.title}`);
    }
    return t;
  };

  const ethanWork = ethan.body.cards.filter((card) => card.part !== "bonus" || card.kind === "move");
  let t = await finishAll("ethan", ethanWork, 0);
  const ethanDone = await handleClassroom({ store, env, fetchImpl, body: { action: "today", kid: "ethan" }, now: at(start, t + 20) });
  assert.equal(ethanDone.body.dose.complete, true);
  assert.equal(ethanDone.body.free[0].title, "Train Set");
  const half = await handleClassroom({ store, env, fetchImpl, body: { action: "room", kid: "ethan" }, now: at(start, t + 20) });
  assert.equal(half.body.allDone, false);

  const gabiWork = gabi.body.cards.filter((card) => card.part !== "bonus" || card.kind === "game");
  t = await finishAll("gabi", gabiWork, t + 30);
  const room = await handleClassroom({ store, env, fetchImpl, body: { action: "room", kid: "gabi" }, now: at(start, t + 20) });
  assert.equal(room.body.allDone, true);
  const again = await handleClassroom({ store, env, fetchImpl, body: { action: "room", kid: "ethan" }, now: at(start, t + 40) });
  assert.equal(again.body.allDone, true);
  assert.equal(posted.filter((text) => /Everyone is done/.test(text)).length, 1);
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
  assert.equal(used.at(-1).voice, "marin");
  assert.equal(fake.body.voice, undefined);
  const again = await handleClassroom({ store, env, fetchImpl, body: { action: "speak", kid: "gabi", voice: "sage", text: "Hi." } });
  assert.equal(again.body.audioBase64, asked.body.audioBase64);
  assert.equal(used.length, 2);
});

test("when speech fails, the reason names the status and code but never the message", async () => {
  const store = memoryStore();
  const fetchImpl = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { code: "invalid_api_key", message: "Incorrect API key provided: sk-secret1234" } })
  });
  const out = await handleClassroom({ store, env: { OPENAI_API_KEY: "sk-secret1234" }, fetchImpl, body: { action: "speak", kid: "gabi", text: "Hi." } });
  assert.equal(out.body.audioBase64, "");
  assert.match(out.body.why, /401 invalid_api_key/);
  assert.equal(JSON.stringify(out.body).includes("secret"), false);
  const none = await handleClassroom({ store, env: {}, body: { action: "speak", kid: "gabi", text: "Hello." } });
  assert.match(none.body.why, /no OPENAI_API_KEY/);
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
