import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildDay, weekdayIndex } from "../netlify/lib/classroom.mjs";
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
  "2026-11-04",
  "2026-11-05",
  "2026-11-09",
  "2026-11-10",
  "2026-11-12",
  "2026-11-13",
  "2026-11-17"
];

test("the Chicago weekday matches the classroom", () => {
  for (const date of [...Object.keys(EPISODE), ...USUAL]) assert.equal(chicagoWeekday(date), weekdayIndex(date));
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
