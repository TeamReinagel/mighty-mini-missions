import assert from "node:assert/strict";
import test from "node:test";
import { buildDay, evidenceFor, weekdayIndex } from "../netlify/lib/classroom.mjs";
import { COMPLETIONS } from "./logic.mjs";
import { chicagoWeekday } from "./plan.mjs";

const CONNOR = {
  "2026-11-02": ["apple-catcher", ""],
  "2026-11-03": ["lark-pockets", "play=pockets"],
  "2026-11-04": ["lark-i-am", "scene=apple"],
  "2026-11-05": ["lark-ant", "play=ant"],
  "2026-11-06": ["apple-catcher", ""],
  "2026-11-09": ["lark-i-am", "scene=mouse"],
  "2026-11-10": ["lark-pockets", "play=pockets"],
  "2026-11-11": ["apple-catcher", ""],
  "2026-11-12": ["lark-ant", "play=ant"],
  "2026-11-13": ["lark-i-am", "scene=bird"]
};

const GABI = {
  "2026-11-02": "bag-at-the-door",
  "2026-11-03": "lark-folio",
  "2026-11-04": "lark-strap",
  "2026-11-05": "lark-folio",
  "2026-11-06": "bag-at-the-door",
  "2026-11-09": "lark-strap",
  "2026-11-10": "lark-folio",
  "2026-11-11": "bag-at-the-door",
  "2026-11-12": "lark-folio",
  "2026-11-13": "lark-strap"
};

test("the Chicago weekday matches the classroom", () => {
  for (const date of Object.keys(CONNOR)) assert.equal(chicagoWeekday(date), weekdayIndex(date));
});

test("Connor and Gabi have one Lark and Nib reading card on each of the next ten school days", () => {
  for (const [date, [gameId, href]] of Object.entries(CONNOR)) {
    const day = buildDay({ kidId: "connor", date });
    const reading = day.cards.filter((card) => card.part === "ela");
    assert.equal(reading.length, 1, date);
    assert.equal(reading[0].gameId, gameId, date);
    if (href) assert.match(reading[0].href, new RegExp(href));
    assert.equal(day.cards.some((card) => card.stepId === "connor-count-5"), true);
    const move = day.cards.find((card) => card.kind === "move");
    assert.match(move.say, /Then tap I did it\.$/);
  }
  for (const [date, gameId] of Object.entries(GABI)) {
    const day = buildDay({ kidId: "gabi", date });
    const reading = day.cards.filter((card) => card.part === "ela");
    assert.equal(reading.length, 1, date);
    assert.equal(reading[0].gameId, gameId, date);
    assert.equal(day.cards.some((card) => card.stepId === "gabi-count-10"), true);
    assert.equal(day.cards.some((card) => card.gameId === "otter-slide"), false);
  }
});

test("the plan leaves earlier days, weekends, and the other children alone", () => {
  assert.equal(buildDay({ kidId: "connor", date: "2026-10-30" }).cards.find((card) => card.part === "ela").gameId, "moon-path");
  assert.equal(buildDay({ kidId: "gabi", date: "2026-11-07" }).dose, null);
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-08" }).dose, null);
  assert.equal(buildDay({ kidId: "max", date: "2026-11-02" }).cards[0].kind, "app");
  assert.equal(buildDay({ kidId: "ethan", date: "2026-11-04" }).cards.some((card) => String(card.gameId || "").startsWith("lark-")), false);
});

test("the following Monday continues the same story rotation", () => {
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-16" }).cards.find((card) => card.part === "ela").gameId, "apple-catcher");
  assert.equal(buildDay({ kidId: "gabi", date: "2026-11-16" }).cards.find((card) => card.part === "ela").gameId, "bag-at-the-door");
  assert.equal(buildDay({ kidId: "connor", date: "2026-11-17" }).cards.find((card) => card.part === "ela").gameId, "lark-pockets");
});

test("a finished Lark game is the reading evidence, and a retry is not", () => {
  assert.equal(evidenceFor("connor", "lark-pockets").item, COMPLETIONS.pockets);
  assert.equal(evidenceFor("connor", "lark-pockets").need, 1);
  assert.equal(evidenceFor("gabi", "lark-folio").item, COMPLETIONS.folio);
  assert.equal(evidenceFor("gabi", "lark-strap").item, COMPLETIONS.strap);
  assert.equal(evidenceFor("connor", "lark-i-am").item, COMPLETIONS["i-am"]);
});
