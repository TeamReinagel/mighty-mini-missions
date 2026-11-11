import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildDay, handleClassroom, memoryStore, weekdayIndex } from "../netlify/lib/classroom.mjs";
import { EPISODE as SAIL_EPISODE } from "../sail-that-wouldnt-stay/episode.mjs";
import { EPISODE as FAN_EPISODE } from "../fan-at-the-fork/episode.mjs";
import { STORY_ASSET_REV } from "../shared/story-cache.mjs";
import { SERIES, FINISHED_BEFORE, finishedEpisodes, focusFor, nextEpisode, recordFinished } from "./episodes.mjs";
import { chicagoWeekday, isStoryDay } from "./plan.mjs";

const STORY_DAYS = ["2026-11-09", "2026-11-11", "2026-11-13", "2026-11-16"];
const OTHER_DAYS = ["2026-11-10", "2026-11-12", "2026-11-17"];
const ALL_FINISHED = (kidId) => ({ episodes: Object.fromEntries(SERIES[kidId].map((entry) => [entry.gameId, "2026-11-01"])) });
const ela = (day) => day.cards.filter((card) => card.part === "ela").map((card) => card.gameId);

const at = (iso, seconds = 0) => new Date(Date.parse(iso) + seconds * 1000);
const call = (store, kid, body, when) => handleClassroom({ store, env: {}, body: { kid, ...body }, now: when });
const finish = (store, kid, gameId, item, when) => store.setJSON(`events/${when.toISOString().slice(0, 10)}/${when.getTime()}-story`, [
  { kid, game: gameId, skill: "Story participation", item, correct: null, extra: { completed: true } }
]);

test("the Chicago weekday matches the classroom", () => {
  for (const date of [...STORY_DAYS, ...OTHER_DAYS, "2026-11-04", "2026-11-14"]) assert.equal(chicagoWeekday(date), weekdayIndex(date));
  assert.deepEqual(STORY_DAYS.map(isStoryDay), [true, true, true, true]);
  assert.deepEqual([...OTHER_DAYS, "2026-11-14", "2026-10-30"].map(isStoryDay), [false, false, false, false, false]);
});

test("each child's list matches what the episodes introduce", async () => {
  for (const entry of Object.values(SERIES).flat()) {
    if (entry.gameId === "moon-path") continue;
    const { EPISODE } = await import(`../${entry.gameId}/episode.mjs`);
    assert.equal(entry.completionItem, EPISODE.completionItem, entry.gameId);
    assert.deepEqual(entry.sounds, EPISODE.introduced, entry.gameId);
    assert.deepEqual(entry.words, EPISODE.targets, entry.gameId);
  }
  assert.deepEqual(SERIES.connor.map((entry) => entry.label), ["S1E1", "S1E2", "S1E3"]);
  assert.deepEqual(SERIES.gabi.map((entry) => entry.label), ["S2E1", "S2E2"]);
});

test("a story day gives each child their next unfinished episode", () => {
  assert.deepEqual(Object.keys(FINISHED_BEFORE.connor), ["moon-path", "apple-catcher"]);
  assert.deepEqual(Object.keys(FINISHED_BEFORE.gabi), ["bag-at-the-door"]);
  for (const date of STORY_DAYS) {
    assert.deepEqual(ela(buildDay({ kidId: "connor", date })), ["sail-that-wouldnt-stay"], date);
    assert.deepEqual(ela(buildDay({ kidId: "gabi", date })), ["fan-at-the-fork"], date);
  }
  for (const date of OTHER_DAYS) {
    assert.equal(buildDay({ kidId: "connor", date }).cards.some((card) => card.gameId === "sail-that-wouldnt-stay"), false, date);
    assert.equal(buildDay({ kidId: "gabi", date }).cards.some((card) => card.gameId === "fan-at-the-fork"), false, date);
  }
});

test("a finished episode never comes back, and with none left the story day keeps its usual cards", () => {
  const connor = buildDay({ kidId: "connor", date: "2026-11-09", state: ALL_FINISHED("connor") });
  assert.deepEqual(connor.cards.filter((card) => card.part === "ela").map((card) => card.stepId), ["connor-names-1"]);
  assert.equal(connor.cards.some((card) => card.gameId === "moon-path"), false);
  const gabi = buildDay({ kidId: "gabi", date: "2026-11-09", state: ALL_FINISHED("gabi") });
  assert.deepEqual(ela(gabi), ["otter-slide"]);
  assert.equal(gabi.cards.some((card) => card.stepId === "gabi-count-10"), true);
  assert.equal(nextEpisode("connor", ALL_FINISHED("connor")), null);
});

test("Connor's reading is a letter lesson, never The Moon Path", () => {
  const tuesday = buildDay({ kidId: "connor", date: "2026-11-10" });
  assert.deepEqual(tuesday.cards.filter((card) => card.part === "ela").map((card) => card.stepId), ["connor-names-1"]);
  assert.deepEqual(tuesday.cards.filter((card) => card.part === "bonus" && card.kind === "game").map((card) => card.gameId), ["hatch-match"]);
  const storyDay = buildDay({ kidId: "connor", date: "2026-11-09" });
  assert.deepEqual(storyDay.cards.filter((card) => card.part === "bonus" && card.kind === "game").map((card) => card.gameId), ["lost-helpers"]);
  for (const date of [...STORY_DAYS, ...OTHER_DAYS]) {
    const day = buildDay({ kidId: "connor", date });
    assert.equal(day.cards.some((card) => card.gameId === "moon-path"), false, date);
    assert.equal(day.cards.some((card) => card.stepId === "connor-count-5"), true, date);
  }
});

test("a story card checked off on an earlier board counts as finished", () => {
  const state = { days: { "2026-11-04": { done: ["2026-11-04:game:sail-that-wouldnt-stay"] } } };
  assert.equal(finishedEpisodes("connor", state)["sail-that-wouldnt-stay"], "2026-11-04");
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-09", state }).cards.some((card) => card.gameId === "sail-that-wouldnt-stay"), false);
  const s = {};
  assert.equal(recordFinished(s, "fan-at-the-fork", "2026-11-09"), true);
  assert.equal(recordFinished(s, "fan-at-the-fork", "2026-11-11"), false);
  assert.equal(recordFinished(s, "made-up", "2026-11-11"), false);
  assert.deepEqual(s.episodes, { "fan-at-the-fork": "2026-11-09" });
});

test("Gabi's finish is saved, today's card stays put, and her next story day moves on", async () => {
  const store = memoryStore();
  const start = at("2026-11-09T15:00:00Z");
  const today = await call(store, "gabi", { action: "today" }, start);
  const card = today.body.cards.find((entry) => entry.gameId === FAN_EPISODE.gameId);
  assert.ok(card);
  const done = (seconds) => call(store, "gabi", { action: "card", cardId: card.id, status: "done" }, at("2026-11-09T15:00:00Z", seconds));
  assert.equal((await done(1)).body.notYet, true);
  await call(store, "gabi", { action: "open", cardId: card.id }, at("2026-11-09T15:00:00Z", 2));
  await store.setJSON(`events/2026-11-09/${start.getTime() + 3000}-story`, [
    { kid: "connor", game: FAN_EPISODE.gameId, item: FAN_EPISODE.completionItem, extra: { completed: true } },
    { kid: "gabi", game: "bag-at-the-door", item: FAN_EPISODE.completionItem, extra: { completed: true } },
    { kid: "gabi", game: FAN_EPISODE.gameId, item: FAN_EPISODE.completionItem, extra: { completed: false } }
  ]);
  assert.equal((await done(4)).body.notYet, true);
  const before = structuredClone((await store.get("classroom/kid/gabi", { type: "json" })).steps);
  await finish(store, "gabi", FAN_EPISODE.gameId, FAN_EPISODE.completionItem, at("2026-11-09T15:00:00Z", 5));
  assert.equal((await done(6)).body.ok, true);
  const saved = await store.get("classroom/kid/gabi", { type: "json" });
  assert.equal(saved.episodes[FAN_EPISODE.gameId], "2026-11-09");
  assert.deepEqual(saved.steps, before, "a finished episode is not mastery");
  const later = await call(store, "gabi", { action: "today" }, at("2026-11-09T18:00:00Z"));
  assert.equal(later.body.cards.find((entry) => entry.id === card.id).done, true);
  assert.equal(later.body.dose.parts.find((part) => part.id === "ela").done, true);
  const wednesday = await call(store, "gabi", { action: "today" }, at("2026-11-11T15:00:00Z"));
  assert.equal(wednesday.body.cards.some((entry) => entry.gameId === FAN_EPISODE.gameId), false);
});

test("a missed story day waits: the same episode comes back on the next story day", async () => {
  const store = memoryStore();
  const monday = await call(store, "connor", { action: "today" }, at("2026-11-09T15:00:00Z"));
  assert.deepEqual(ela(monday.body), [SAIL_EPISODE.gameId]);
  const wednesday = await call(store, "connor", { action: "today" }, at("2026-11-11T15:00:00Z"));
  assert.deepEqual(ela(wednesday.body), [SAIL_EPISODE.gameId]);
});

test("a finish outside Joyce's card is found the next morning", async () => {
  const store = memoryStore();
  // Sunday evening in Chicago is already Monday in UTC.
  await finish(store, "connor", SAIL_EPISODE.gameId, SAIL_EPISODE.completionItem, at("2026-11-09T01:30:00Z"));
  const monday = await call(store, "connor", { action: "today" }, at("2026-11-09T15:00:00Z"));
  assert.equal(monday.body.cards.some((entry) => entry.gameId === SAIL_EPISODE.gameId), false);
  assert.deepEqual(monday.body.cards.filter((card) => card.part === "ela").map((card) => card.stepId), ["connor-names-1"]);
  const saved = await store.get("classroom/kid/connor", { type: "json" });
  assert.equal(saved.episodes[SAIL_EPISODE.gameId], "2026-11-08");
});

test("practice games get the sounds and words of episodes finished in the last two weeks", async () => {
  const gabi = focusFor("gabi", { episodes: { "fan-at-the-fork": "2026-11-09" } }, "2026-11-10");
  assert.deepEqual(gabi.sounds, ["f", "d"]);
  assert.deepEqual(gabi.words, ["fan", "fin", "fit", "pad", "sad", "did", "dim"]);
  assert.equal(gabi.until, "2026-11-23");
  assert.deepEqual(focusFor("gabi", {}, "2026-11-16").sounds, [], "the boost ends after 14 days");
  assert.deepEqual(focusFor("connor", {}, "2026-11-09").sounds, ["a"]);
  assert.deepEqual(focusFor("max", {}, "2026-11-09"), { kid: "max", sounds: [], words: [], episodes: [], until: null });

  const store = memoryStore();
  const asked = await call(store, "connor", { action: "focus" }, at("2026-11-09T14:00:00Z"));
  assert.equal(asked.status, 200);
  assert.deepEqual(asked.body.sounds, ["a"]);
  const saved = await store.get("classroom/kid/connor", { type: "json" });
  assert.equal(saved.days?.["2026-11-09"]?.board, undefined, "asking for focus does not pin the board");
});

test("today's story is pinned with the board", async () => {
  const store = memoryStore();
  await call(store, "connor", { action: "today" }, at("2026-11-09T15:00:00Z"));
  const saved = await store.get("classroom/kid/connor", { type: "json" });
  assert.equal(saved.days["2026-11-09"].board.lark, SAIL_EPISODE.gameId);
  saved.episodes = { [SAIL_EPISODE.gameId]: "2026-11-09" };
  await store.setJSON("classroom/kid/connor", saved);
  const again = await call(store, "connor", { action: "today" }, at("2026-11-09T16:00:00Z"));
  assert.deepEqual(ela(again.body), [SAIL_EPISODE.gameId]);
  const tuesday = await call(store, "connor", { action: "today" }, at("2026-11-10T15:00:00Z"));
  assert.equal((await store.get("classroom/kid/connor", { type: "json" })).days["2026-11-10"].board.lark, null);
  assert.deepEqual(tuesday.body.cards.filter((card) => card.part === "ela").map((card) => card.stepId), ["connor-names-1"]);
});

test("an episode is the second mission, and the day card can fetch its opening pictures", () => {
  for (const kidId of ["connor", "gabi"]) {
    const day = buildDay({ kidId, date: "2026-11-09" });
    assert.deepEqual(day.dose.parts.slice(0, 2).map((part) => part.id), ["math", "ela"], kidId);
    const story = day.cards.find((card) => card.part === "ela");
    assert.ok(story.prefetch.length > 0);
    for (const href of story.prefetch) {
      assert.ok(href.endsWith(`?v=${STORY_ASSET_REV}`));
      assert.ok(readFileSync(new URL(href, import.meta.url)).length > 0, href);
    }
  }
  assert.deepEqual(buildDay({ kidId: "gabi", date: "2026-11-10" }).dose.parts[0].id, "ela");
});

test("weekends, earlier days, and the other children are left alone", () => {
  assert.equal(buildDay({ kidId: "gabi", date: "2026-11-14" }).dose, null);
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-15" }).dose, null);
  assert.equal(buildDay({ kidId: "connor", date: "2026-10-30" }).cards.some((card) => card.gameId === "sail-that-wouldnt-stay"), false);
  for (const kidId of ["max", "ethan"]) {
    for (const date of STORY_DAYS) {
      assert.equal(buildDay({ kidId, date }).cards.some((card) => SERIES.connor.concat(SERIES.gabi).some((entry) => entry.gameId === card.gameId)), false);
    }
  }
});
