import assert from "node:assert/strict";
import test from "node:test";
import { CVC, itemsFor, wordParts } from "./classroom-content.mjs";
import {
  applyAttempt, buildDay, conferencePackage, decidePlan, dropEarlyMastery, dropLastNoteSpots, evidenceFor, handleClassroom, handsFirst, isMastered,
  memoryStore, noteSignal, recordNoteSteps, rhythmFor, setEssentialOff, stepById, weekdayIndex
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
  // Regrouping keeps Tuesday and Thursday while First Grade gaps take Monday, Wednesday, and Friday.
  const day = buildDay({ kidId: "max", date: "2026-10-20" });
  const lesson = day.cards.find((card) => card.stepId === "max-regroup-show");
  assert.equal(lesson.gameId, "block-trade");
  assert.match(lesson.href, /block-trade/);
  assert.match(lesson.say, /one round of Moon Crates/);
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
  // Friday: Reading.com, a word-study lesson, AdaptedMind, a First Grade math lesson, writing, and a bonus.
  assert.deepEqual(max.cards.map((card) => `${card.part}:${card.kind}`), ["ela:app", "ela:lesson", "math:app", "math:lesson", "write:write", "bonus:game", "bonus:move"]);
  assert.equal(max.cards[0].askLesson, true);
  assert.deepEqual(max.dose.parts.map((part) => part.title), ["Reading", "Math", "Writing", "Bonus"]);
  assert.match(max.greeting, /Trainer day\. Reading, math and writing, then one bonus/);
  assert.equal(buildDay({ kidId: "max", date: "2026-10-24" }).cards.some((card) => card.kind === "write"), false);

  const connor = buildDay({ kidId: "connor", date: MONDAY });
  assert.deepEqual(connor.dose.parts.map((part) => part.title), ["Reading", "Counting", "Writing", "Practice", "Bonus"]);
  // The Moon Path is a finished episode, not his reading card. Joyce's letter lesson is.
  assert.equal(connor.cards.some((card) => card.gameId === "moon-path"), false);
  assert.deepEqual(connor.cards.filter((card) => card.part === "ela").map((card) => card.stepId), ["connor-names-1"]);
  assert.equal(connor.cards.find((card) => card.part === "ela").kind, "lesson");
  assert.deepEqual(connor.cards.filter((card) => card.part === "bonus" && card.kind === "game").map((card) => card.gameId), ["lost-helpers"]);
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

  await logPlay(store, at(start, 60), "gabi", "otter-slide", 4);
  await logPlay(store, at(start, 70), "max", "otter-slide", 5);
  const short = await finishCard(store, "gabi", otter.id, at(start, 80));
  assert.equal(short.body.notYet, true);
  assert.equal(short.body.played, 4);

  await logPlay(store, at(start, 120), "gabi", "otter-slide", 1);
  const played = await finishCard(store, "gabi", otter.id, at(start, 130));
  assert.equal(played.body.ok, true);
  const after = await handleClassroom({ store, env: {}, body: { action: "today", kid: "gabi" }, now: at(start, 140) });
  assert.equal(after.body.dose.parts.find((part) => part.id === "ela").done, true);
});

test("Connor's practice card is the next Not sure checklist game, and finishes after four plays", async () => {
  for (const date of ["2026-11-03", "2026-11-10", "2026-11-11"]) {
    const day = buildDay({ kidId: "connor", date });
    const card = day.cards.find((entry) => entry.part === "ready");
    assert.equal(card.gameId, "nest-numbers", date);
    assert.match(card.href, /nest-numbers\/\?kid=connor&step=connor-numbers/);
    assert.match(card.say, /Play one round of Nest Numbers/);
    for (const kid of ["gabi", "max", "ethan"]) {
      assert.equal(buildDay({ kidId: kid, date }).cards.some((entry) => entry.part === "ready"), false);
    }
  }
  const learned = { graded: 6, correct: 6, recent: [true, true, true, true, true, true], mastered: true };
  const sorting = buildDay({ kidId: "connor", date: "2026-11-10", state: { steps: { "connor-numbers": learned } } });
  assert.equal(sorting.cards.find((entry) => entry.part === "ready").gameId, "basket-sort");
  const none = buildDay({ kidId: "connor", date: "2026-11-10", state: { steps: { "connor-numbers": learned, "connor-sort": learned } } });
  assert.equal(none.cards.some((entry) => entry.part === "ready"), false);
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-08" }).cards.some((entry) => entry.part === "ready"), false);

  const store = memoryStore();
  const start = "2026-11-03T15:00:00Z";
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "connor" }, now: at(start) });
  const card = first.body.cards.find((entry) => entry.gameId === "nest-numbers");
  await handleClassroom({ store, env: {}, body: { action: "open", kid: "connor", cardId: card.id }, now: at(start, 1) });
  await logPlay(store, at(start, 30), "connor", "nest-numbers", 3);
  const short = await finishCard(store, "connor", card.id, at(start, 40));
  assert.equal(short.body.notYet, true);
  assert.equal(short.body.played, 3);
  await logPlay(store, at(start, 50), "connor", "nest-numbers", 1);
  const done = await finishCard(store, "connor", card.id, at(start, 60));
  assert.equal(done.body.ok, true);
});

test("The Lost Helpers is checked under the name it logs, lost-helpers", async () => {
  const store = memoryStore();
  const start = "2026-10-21T15:00:00Z";
  const first = await handleClassroom({ store, env: {}, body: { action: "today", kid: "connor" }, now: at(start) });
  const hunt = first.body.cards.find((card) => card.gameId === "lost-helpers");
  assert.equal(hunt.part, "bonus");
  await handleClassroom({ store, env: {}, body: { action: "open", kid: "connor", cardId: hunt.id }, now: at(start, 1) });
  await logPlay(store, at(start, 30), "connor", "lost-helpers", 4);
  const done = await finishCard(store, "connor", hunt.id, at(start, 40));
  assert.equal(done.body.ok, true);
});

test("an old Monster Hunt card still looks for word-monsters answers", async () => {
  const rule = evidenceFor("connor", "monster-hunt");
  assert.equal(rule.game, "word-monsters");
  assert.equal(rule.need, 6);
  const helpers = evidenceFor("connor", "lost-helpers");
  assert.equal(helpers.game, "lost-helpers");
  assert.equal(helpers.need, 4);
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

test("Max's writing card counts after his own check, and the paper narrows after three fits", async () => {
  const store = memoryStore();
  const days = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"];
  const seen = [];
  for (const [i, date] of days.entries()) {
    const now = at(`${date}T15:00:00Z`);
    const today = await handleClassroom({ store, env: {}, body: { action: "today", kid: "max" }, now });
    const write = today.body.cards.find((card) => card.kind === "write");
    seen.push(`${write.letter}:${write.paper}`);
    assert.ok(write.strokes.length >= 1);
    if (i === 0) {
      const early = await finishCard(store, "max", write.id, now);
      assert.equal(early.body.notYet, true);
    }
    const checked = await handleClassroom({ store, env: {}, body: { action: "write", kid: "max", fits: true }, now });
    assert.equal(checked.body.ok, true);
    assert.equal(checked.body.moved, i === 2 ? "narrower" : null);
    const again = await handleClassroom({ store, env: {}, body: { action: "write", kid: "max", fits: true }, now });
    assert.equal(again.body.moved, undefined);
    const done = await finishCard(store, "max", write.id, now);
    assert.equal(done.body.ok, true);
    const after = await handleClassroom({ store, env: {}, body: { action: "today", kid: "max" }, now });
    assert.equal(after.body.cards.find((card) => card.kind === "write").letter, write.letter);
    assert.equal(after.body.dose.parts.find((part) => part.id === "write").done, true);
  }
  assert.deepEqual(seen, ["c:big", "o:big", "a:big", "d:small"]);
  const saved = await store.get("classroom/kid/max", { type: "json" });
  assert.equal(saved.writing.count, 4);
  const logged = [];
  for (const { key } of (await store.list({ prefix: "events/" })).blobs) logged.push(...(await store.get(key, { type: "json" })));
  assert.ok(logged.every((event) => event.skill === "Handwriting" && event.correct === null));
  assert.deepEqual(logged.map((event) => event.item).sort(), ["a", "c", "d cod", "o"]);
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

test("counting past ten opens Flower Beds for Gabi", () => {
  const early = buildDay({ kidId: "gabi", date: MONDAY });
  assert.equal(early.cards.find((card) => card.stepId === "gabi-count-10").gameId, "snack-count");

  const day = buildDay({
    kidId: "gabi",
    date: MONDAY,
    state: { steps: { "gabi-count-10": MASTERED } }
  });
  const twenty = day.cards.find((card) => card.stepId === "gabi-count-20");
  assert.equal(twenty.gameId, "flower-beds");
  assert.match(twenty.href, /flower-beds\/\?kid=gabi&step=gabi-count-20/);
  assert.match(twenty.say, /one round of Flower Beds/);

  const connor = buildDay({
    kidId: "connor",
    date: MONDAY,
    state: { steps: { "connor-count-5": MASTERED, "connor-count-10": MASTERED } }
  });
  const counting = connor.cards.find((card) => card.part === "math");
  assert.equal(counting.stepId, "connor-count-10", "mastery from the old 3-of-4 rule does not count");
  assert.equal(counting.review, false);
  assert.match(counting.href, /snack-count\/\?kid=connor&step=connor-count-10/);

  const earned = buildDay({
    kidId: "connor",
    date: MONDAY,
    state: { steps: { "connor-count-5": MASTERED, "connor-count-10": { ...MASTERED, coverRule: true } } }
  });
  // Counting to 20 is not on the readiness checklist, so once 1 to 10 is learned the counting card ends.
  assert.equal(earned.cards.some((card) => card.part === "math"), false);
});

test("Connor learns counting to 10 only with every quantity, 75%, and three days", () => {
  const def = stepById("connor", "connor-count-10");
  const play = (rec, date, tries) => tries.reduce((acc, [n, correct]) => applyAttempt(acc, correct, def, { date, item: `${n} scoops` }), rec);
  const allTen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => [n, true]);

  const oneDay = play(undefined, "2026-11-02", [...allTen, [3, true], [4, true]]);
  assert.equal(oneDay.mastered, false, "one sitting is not enough");

  let rec = play(undefined, "2026-11-02", [[1, true], [2, true], [3, true], [4, true]]);
  rec = play(rec, "2026-11-03", [[5, true], [6, false], [6, true], [7, true]]);
  rec = play(rec, "2026-11-04", [[8, true], [9, true], [10, false], [1, true]]);
  assert.equal(rec.mastered, false, "10 has no right first try yet");
  rec = play(rec, "2026-11-04", [[10, true]]);
  assert.equal(rec.mastered, true);
  assert.equal(rec.coverRule, true);

  let shaky = play(undefined, "2026-11-02", allTen.slice(0, 4));
  shaky = play(shaky, "2026-11-03", allTen.slice(4, 8));
  shaky = play(shaky, "2026-11-04", [[3, false], [4, false], [5, false], [6, false], [7, false], [9, true], [10, true]]);
  assert.equal(shaky.mastered, false, "every quantity, three days, but the latest 12 are 7 right: under 75%");
});

test("old counting mastery goes back to practicing, keeping the tries", () => {
  const state = dropEarlyMastery("connor", {
    steps: {
      "connor-count-5": MASTERED,
      "connor-count-10": { ...MASTERED, shownAt: "2026-11-03", nextCheck: "2026-11-04" }
    }
  });
  assert.equal(state.steps["connor-count-5"].mastered, true);
  assert.equal(state.steps["connor-count-10"].mastered, false);
  assert.equal(state.steps["connor-count-10"].shownAt, undefined);
  assert.equal(state.steps["connor-count-10"].graded, 6);
});

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
  assert.equal(hit.body.explain, true);
  assert.match(hit.body.say, /How did you know\? Tell me\.$/);
  const next = itemsFor(step, "2026-10-21", [])[1];
  const again = await handleClassroom({
    store,
    body: { action: "answer", kid: "gabi", stepId: step.id, item: next.item, index: 1, picked: next.answer },
    now: new Date(now.getTime() + 4000)
  });
  assert.equal(again.body.correct, true);
  assert.equal(again.body.explain, false);
  assert.doesNotMatch(again.body.say, /How did you know/);

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
  const monday = new Date("2026-10-20T15:00:00Z");
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
    now: new Date("2026-10-22T15:00:00Z")
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

test("a cold check uses lesson items and confirms after two of three", async () => {
  const store = memoryStore();
  const posted = [];
  const env = { JOYCE_CHEER_CHANNEL: "C1", SLACK_BOT_TOKEN: "xoxb-test" };
  const fetchImpl = async (_url, init) => {
    posted.push(JSON.parse(init.body).text);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await store.setJSON("classroom/kid/gabi", {
    steps: {
      "gabi-cvc-a": {
        mastered: true,
        graded: 6,
        correct: 6,
        recent: [true, true, true, true, true, true],
        shownAt: "2026-10-16",
        shownVia: "game",
        nextCheck: MONDAY
      }
    }
  });
  const now = at("2026-10-19T15:00:00Z");
  const first = await handleClassroom({ store, env, fetchImpl, body: { action: "today", kid: "gabi" }, now });
  const check = first.body.cards.find((card) => card.kind === "check");
  assert.equal(check.stepId, "gabi-cvc-a");
  assert.equal(check.say, "Show me what you know. No hints this time.");
  assert.equal(check.items.length, 3);
  assert.equal(check.items[0].type, "build");
  assert.equal(check.part, "ela");

  let t = now.getTime();
  for (const [i, item] of check.items.entries()) {
    t += 2000;
    const out = await handleClassroom({
      store,
      env,
      fetchImpl,
      body: {
        action: "answer",
        kid: "gabi",
        stepId: check.stepId,
        item: item.item,
        picked: i === 0 ? "nope" : item.answer,
        check: true
      },
      now: new Date(t)
    });
    assert.equal(out.body.correct, i !== 0);
    assert.equal(out.body.moveOn, true);
  }
  const done = await handleClassroom({
    store,
    env,
    fetchImpl,
    body: { action: "card", kid: "gabi", cardId: check.id, status: "done" },
    now: new Date(t + 2000)
  });
  assert.equal(done.body.ok, true);
  const saved = await store.get("classroom/kid/gabi", { type: "json" });
  assert.equal(saved.steps["gabi-cvc-a"].confirmedAt, MONDAY);
  assert.equal(saved.steps["gabi-cvc-a"].nextCheck, "2026-10-26");
  assert.match(posted.join("\n"), /cold today/);
  assert.equal(saved.essential.spots.some((spot) => spot.stepId === "adapting-3" && spot.source === "persist"), true);
});

test("help on a check leaves that item out", async () => {
  const store = memoryStore();
  await store.setJSON("classroom/kid/gabi", {
    steps: {
      "gabi-cvc-a": {
        mastered: true,
        graded: 6,
        correct: 6,
        recent: [true, true, true, true, true, true],
        shownAt: "2026-10-16",
        shownVia: "lesson",
        nextCheck: MONDAY
      }
    }
  });
  const now = at("2026-10-19T15:00:00Z");
  const first = await handleClassroom({ store, body: { action: "today", kid: "gabi" }, now });
  const check = first.body.cards.find((card) => card.kind === "check");
  const left = await handleClassroom({
    store,
    body: { action: "help", kid: "gabi", stepId: check.stepId, item: check.items[0].item, tries: 1, check: true },
    now
  });
  assert.equal(left.body.say, "We'll leave that one.");
  assert.equal(left.body.moveOn, true);
  let t = now.getTime();
  for (const item of check.items.slice(1)) {
    t += 2000;
    const out = await handleClassroom({
      store,
      body: { action: "answer", kid: "gabi", stepId: check.stepId, item: item.item, picked: item.answer, check: true },
      now: new Date(t)
    });
    assert.equal(out.body.correct, true);
  }
  const saved = await store.get("classroom/kid/gabi", { type: "json" });
  assert.equal(saved.steps["gabi-cvc-a"].confirmedAt, MONDAY);
  assert.equal(saved.days[MONDAY].checkAnswers["gabi-cvc-a"][check.items[0].item].void, true);
});

test("a finished miss and a request for help are spotted moments", async () => {
  const store = memoryStore();
  const env = {};
  const now = at("2026-10-19T15:00:00Z");
  await gabiReadyToAdd(store);
  const first = await handleClassroom({ store, env, body: { action: "today", kid: "gabi" }, now });
  const lesson = first.body.cards.find((card) => card.stepId === "gabi-add");
  const wrong = lesson.items[0].choices.find((choice) => choice.id !== lesson.items[0].answer);
  const missed = await handleClassroom({
    store,
    env,
    body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: lesson.items[0].item, picked: wrong.id },
    now
  });
  assert.equal(missed.body.correct, false);
  await handleClassroom({
    store,
    env,
    body: { action: "help", kid: "gabi", stepId: lesson.stepId, item: lesson.items[0].item, tries: 1 },
    now: at("2026-10-19T15:00:00Z", 2)
  });
  let t = now.getTime();
  for (const item of lesson.items) {
    t += 2000;
    await handleClassroom({
      store,
      env,
      body: { action: "answer", kid: "gabi", stepId: lesson.stepId, item: item.item, picked: item.answer },
      now: new Date(t)
    });
  }
  const done = await handleClassroom({
    store,
    env,
    body: { action: "card", kid: "gabi", cardId: lesson.id, status: "done" },
    now: new Date(t + 2000)
  });
  assert.equal(done.body.ok, true);
  const saved = await store.get("classroom/kid/gabi", { type: "json" });
  const sources = saved.essential.spots.map((spot) => `${spot.stepId}:${spot.source}`);
  assert.ok(sources.includes("adapting-3:persist"));
  assert.ok(sources.includes("problem-solving-2:help"));
});

test("Ethan and a switched-off map do not collect essential spots", async () => {
  const store = memoryStore();
  assert.equal((await noteSignal({ store, kidId: "ethan", source: "persist", day: MONDAY })).spotted, false);
  assert.equal(await store.get("classroom/kid/ethan", { type: "json" }), null);
  await setEssentialOff(store, true);
  assert.equal((await noteSignal({ store, kidId: "gabi", source: "help", day: MONDAY })).spotted, false);
  assert.equal(await store.get("classroom/kid/gabi", { type: "json" }), null);
});

test("a parent note can spot a skill, and not-that removes it", async () => {
  const store = memoryStore();
  const counted = await recordNoteSteps({
    store,
    kids: ["max", "ethan"],
    steps: ["teamwork-1", "max-regroup"],
    text: "Max split the laundry and showed a trade of ten blocks.",
    obsId: "note-1",
    day: MONDAY
  });
  assert.deepEqual(counted.sort(), ["max-regroup", "teamwork-1"]);
  const saved = await store.get("classroom/kid/max", { type: "json" });
  assert.equal(saved.essential.spots[0].stepId, "teamwork-1");
  assert.equal(saved.steps["max-regroup"].sightings.length, 1);
  assert.equal(await store.get("classroom/kid/ethan", { type: "json" }), null);
  const removed = await dropLastNoteSpots({ store, kids: ["max"] });
  assert.deepEqual(removed, ["max"]);
  const after = await store.get("classroom/kid/max", { type: "json" });
  assert.equal(after.essential.spots.length, 0);
  assert.equal(after.steps["max-regroup"].sightings.length, 0);
});

test("the conference names the map and asks after two missed checks", () => {
  const pack = conferencePackage({
    roster: [{
      id: "gabi",
      name: "Gabi",
      state: {
        steps: {
          "gabi-cvc-a": { mastered: true, shownAt: "2026-10-16", confirmedAt: MONDAY, checkMisses: 0 },
          "gabi-cvc-e": { slipping: true, checkMisses: 2, graded: 8, correct: 3, recent: [] }
        },
        essential: { spots: [{ stepId: "teamwork-1", day: MONDAY, source: "note", at: 1 }] }
      }
    }],
    plan: {}
  });
  assert.match(pack.summary, /Confirmed: Short a words/);
  assert.match(pack.summary, /Slipping: Short e words/);
  assert.match(pack.summary, /Teamwork: Working together/);
  assert.match(pack.summary, /Next to notice for Gabi: Teamwork step 1/);
  assert.ok(pack.decisions.some((item) => item.id === "hold-check-gabi-cvc-e"));
});

test("a check can avoid words the child just practiced", () => {
  const step = stepById("gabi", "gabi-cvc-a");
  const first = itemsFor({ ...step, items: 3 }, "check-seed");
  const next = itemsFor({ ...step, items: 3 }, "check-seed", [], first.map((item) => item.item));
  assert.equal(next.length, 3);
  for (const item of next) assert.equal(first.some((earlier) => earlier.item === item.item), false);
  for (const item of next) assert.ok(CVC.a.includes(item.word));
});


test("a new picture starts with real blocks, only before the first try", () => {
  const add = stepById("gabi", "gabi-add");
  assert.match(handsFirst({ steps: {} }, add), /get 5 blocks/);
  assert.equal(handsFirst({ steps: { "gabi-add": { graded: 1, correct: 1, recent: [true] } } }, add), "");
  assert.equal(handsFirst({ steps: {} }, { ...add, review: true }), "");
  assert.match(handsFirst({ steps: {} }, stepById("max", "max-regroup-show")), /Snap 10 ones together/);
  assert.equal(handsFirst({ steps: {} }, stepById("gabi", "gabi-sh")), "");
});

test("a new regrouping game card asks for blocks before play", () => {
  const day = buildDay({ kidId: "max", date: "2026-10-20", state: { steps: {} }, plan: {} });
  const card = day.cards.find((entry) => entry.stepId === "max-regroup-show");
  assert.equal(card.kind, "game");
  assert.match(card.say, /^Before you start, get your blocks\..*Play one round of Moon Crates/);
});
