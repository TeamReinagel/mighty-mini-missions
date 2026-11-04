import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildDay, handleClassroom, memoryStore, weekdayIndex } from "../netlify/lib/classroom.mjs";
import { COMPLETION_ITEM as SAIL_COMPLETION } from "../sail-that-wouldnt-stay/integration.mjs";
import { EPISODE as SAIL_EPISODE } from "../sail-that-wouldnt-stay/episode.mjs";
import { STORY_ASSET_REV } from "../shared/story-cache.mjs";
import { chicagoWeekday } from "./plan.mjs";

const EPISODE = {
  "2026-11-02": ["apple-catcher", "bag-at-the-door"],
  "2026-11-06": ["apple-catcher", "bag-at-the-door"],
  "2026-11-11": ["apple-catcher", "bag-at-the-door"],
  "2026-11-16": ["apple-catcher", "bag-at-the-door"]
};

const USUAL = [
  "2026-11-03",
  "2026-11-05",
  "2026-11-09",
  "2026-11-10",
  "2026-11-12",
  "2026-11-13",
  "2026-11-17"
];

test("the Chicago weekday matches the classroom", () => {
  for (const date of [...Object.keys(EPISODE), ...USUAL, "2026-11-04"]) assert.equal(chicagoWeekday(date), weekdayIndex(date));
});

test("Connor gets S1E3 instead of Moon Path on November 4, preserving the rest of his board", () => {
  const date = "2026-11-04";
  const counting = `${date}:game:snack-count:connor-count-5`;
  const previousReading = `${date}:game:moon-path`;
  const state = { steps: {}, days: { [date]: {
    done: [counting, previousReading],
    opened: { [previousReading]: `${date}T15:00:00Z` },
    board: { shorter: false, lessons: [{ id: "connor-count-5", missed: [] }],
      check: { stepId: "connor-names-1", items: [{ item: "letter-a" }] } }
  } } };
  const day = buildDay({ kidId: "connor", date, state });
  const story = day.cards.find((card) => card.part === "ela");
  assert.deepEqual(day.cards.filter((card) => card.part === "ela").map((card) => card.gameId), ["sail-that-wouldnt-stay"]);
  assert.equal(story.title, SAIL_EPISODE.title);
  assert.equal(story.href, "../sail-that-wouldnt-stay/?kid=connor");
  assert.equal(story.done, false);
  assert.equal(day.cards.find((card) => card.id === counting).done, true);
  assert.equal(day.cards.find((card) => card.part === "ready").gameId, "big-little");
  assert.equal(day.cards.filter((card) => card.part === "bonus").length, 2);
  assert.deepEqual(day.dose.parts.slice(0, 2).map((part) => part.id), ["math", "ela"]);
  assert.equal(day.dose.parts.find((part) => part.id === "ela").done, false);
  for (const href of story.prefetch) {
    assert.ok(href.endsWith(`?v=${STORY_ASSET_REV}`));
    assert.ok(readFileSync(new URL(href, import.meta.url)).length > 0);
  }
  assert.equal(SAIL_COMPLETION, SAIL_EPISODE.completionItem);
  assert.equal(buildDay({ kidId: "gabi", date }).cards.find((card) => card.part === "ela").gameId, "otter-slide");
  for (const kidId of ["max", "gabi", "ethan"]) {
    assert.equal(buildDay({ kidId, date }).cards.some((card) => card.gameId === SAIL_EPISODE.gameId), false);
  }
  for (const otherDate of [...Object.keys(EPISODE), ...USUAL]) {
    assert.equal(buildDay({ kidId: "connor", date: otherDate }).cards.some((card) => card.gameId === SAIL_EPISODE.gameId), false);
  }
});

test("S1E3 needs Connor's real episode finish and does not grant reading mastery", async () => {
  const store = memoryStore();
  const start = Date.parse("2026-11-04T15:00:00Z");
  const call = (body, seconds) => handleClassroom({ store, env: {}, body: { kid: "connor", ...body }, now: new Date(start + seconds * 1000) });
  const today = await call({ action: "today" }, 0);
  const card = today.body.cards.find((entry) => entry.gameId === SAIL_EPISODE.gameId);
  const done = (seconds) => call({ action: "card", cardId: card.id, status: "done" }, seconds);
  const events = (seconds, rows) => store.setJSON(`events/2026-11-04/${start + seconds * 1000}-story`, rows);
  const completion = { kid: "connor", game: SAIL_EPISODE.gameId, skill: "Story participation", item: SAIL_COMPLETION, correct: null, extra: { episode: SAIL_EPISODE.id, completed: true } };
  assert.equal((await done(1)).body.notYet, true);
  await call({ action: "open", cardId: card.id }, 2);
  await events(3, [
    { ...completion, kid: "gabi" },
    { ...completion, game: "moon-path" },
    { ...completion, item: "sail-that-wouldnt-stay:new-s", correct: true },
    { ...completion, extra: { completed: false } }
  ]);
  assert.equal((await done(4)).body.notYet, true);
  const before = structuredClone((await store.get("classroom/kid/connor", { type: "json" })).steps);
  await events(5, [completion]);
  assert.equal((await done(6)).body.ok, true);
  const after = await call({ action: "today" }, 7);
  assert.equal(after.body.cards.find((entry) => entry.id === card.id).done, true);
  assert.equal(after.body.dose.parts.find((part) => part.id === "ela").done, true);
  assert.equal(after.body.dose.parts.find((part) => part.id === "math").done, false);
  assert.deepEqual((await store.get("classroom/kid/connor", { type: "json" })).steps, before);
});

test("Connor and Gabi get a produced episode only on the story days that have one", () => {
  for (const [date, [connorGame, gabiGame]] of Object.entries(EPISODE)) {
    const connor = buildDay({ kidId: "connor", date });
    const gabi = buildDay({ kidId: "gabi", date });
    assert.deepEqual(connor.cards.filter((card) => card.part === "ela").map((card) => card.gameId), [connorGame], date);
    assert.deepEqual(gabi.cards.filter((card) => card.part === "ela").map((card) => card.gameId), [gabiGame], date);
    assert.equal(connor.cards.some((card) => card.stepId === "connor-count-5"), true);
    assert.equal(gabi.cards.some((card) => card.stepId === "gabi-count-10"), true);
    assert.match(connor.cards.find((card) => card.kind === "move").say, /Then tap I did it\.$/);
    assert.match(gabi.cards.find((card) => card.kind === "move").say, /Then tap I did it\.$/);
    assert.equal(gabi.cards.some((card) => card.gameId === "otter-slide"), false);
  }
});

test("other school days keep Moon Path, Otter Slide, and the games already on the board", () => {
  for (const date of USUAL) {
    const connor = buildDay({ kidId: "connor", date });
    const gabi = buildDay({ kidId: "gabi", date });
    assert.equal(connor.cards.find((card) => card.part === "ela").gameId, "moon-path", date);
    assert.equal(gabi.cards.find((card) => card.part === "ela").gameId, "otter-slide", date);
    assert.equal(connor.cards.some((card) => String(card.href || "").includes("lark-play")), false, date);
    assert.equal(gabi.cards.some((card) => String(card.href || "").includes("lark-play")), false, date);
    assert.equal(connor.cards.some((card) => card.stepId === "connor-count-5"), true, date);
    assert.equal(gabi.cards.some((card) => card.stepId === "gabi-count-10"), true, date);
  }
});

test("a Lark and Nib episode is the second mission, and the day card can fetch its opening pictures", () => {
  for (const date of [...Object.keys(EPISODE), ...USUAL]) {
    const connor = buildDay({ kidId: "connor", date });
    assert.deepEqual(connor.dose.parts.slice(0, 2).map((part) => part.id), ["math", "ela"], date);
    const story = connor.cards.find((card) => card.part === "ela");
    assert.ok(story.prefetch?.some((href) => href.includes(`/assets/camp.png?v=${STORY_ASSET_REV}`) || href.includes(`/assets/orchard.png?v=${STORY_ASSET_REV}`)), date);
    assert.ok(story.prefetch.every((href) => href.includes(`?v=${STORY_ASSET_REV}`)));
  }
  for (const [date] of Object.entries(EPISODE)) {
    const gabi = buildDay({ kidId: "gabi", date });
    assert.deepEqual(gabi.dose.parts.slice(0, 2).map((part) => part.id), ["math", "ela"], date);
    const story = gabi.cards.find((card) => card.part === "ela");
    assert.ok(story.prefetch.some((href) => href.includes(`library.png?v=${STORY_ASSET_REV}`)));
  }
  for (const date of USUAL) {
    assert.equal(buildDay({ kidId: "gabi", date }).dose.parts[0].id, "ela", date);
  }
  const html = [
    "apple-catcher/index.html",
    "bag-at-the-door/index.html"
  ].map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8")).join("\n");
  assert.equal(html.includes("assets/") && html.includes(".png\""), false);
});

test("the plan leaves earlier days, weekends, and the other children alone", () => {
  assert.equal(buildDay({ kidId: "connor", date: "2026-10-30" }).cards.find((card) => card.part === "ela").gameId, "moon-path");
  assert.equal(buildDay({ kidId: "gabi", date: "2026-11-07" }).dose, null);
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-08" }).dose, null);
  assert.equal(buildDay({ kidId: "max", date: "2026-11-02" }).cards[0].kind, "app");
  assert.equal(buildDay({ kidId: "ethan", date: "2026-11-04" }).cards.some((card) => String(card.gameId || "").startsWith("lark-")), false);
});
