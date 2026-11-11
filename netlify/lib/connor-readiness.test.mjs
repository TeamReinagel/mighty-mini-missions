import assert from "node:assert/strict";
import test from "node:test";
import { BASELINES, baselineMet } from "./baselines.mjs";
import { READINESS_ITEMS } from "./readiness-checklist.mjs";
import { guideFor, kidById } from "./kids.mjs";
import { buildDay, handleClassroom, memoryStore, milestonesFromSteps } from "./classroom.mjs";
import { PREWRITE_STAGES, prewriteMilestones, prewriteToday, recordPrewrite } from "./prewriting.mjs";

const LEARNED = { graded: 6, correct: 6, recent: [true, true, true, true, true, true], mastered: true };
const at = (iso) => new Date(iso);

test("Stephanie's readiness marks cover all 33 checklist items once", () => {
  const { met, open } = BASELINES.connor;
  assert.equal(met.length, 19);
  assert.equal(READINESS_ITEMS.length, 33);
  assert.deepEqual([...met, ...Object.keys(open)].sort(), READINESS_ITEMS.map((item) => item.id).sort());
  assert.equal(met.filter((id) => open[id]).length, 0);
});

test("Connor's Friday goals come from the checklist, and the Kindergarten sheet waits until it's done", () => {
  const connor = kidById("connor");
  const guide = guideFor(connor, new Set(baselineMet("connor")));
  assert.ok(guide.next.length > 0);
  assert.ok([...guide.next, ...guide.later].every((m) => m.grade === "Kindergarten Readiness"));
  assert.equal(guide.next.find((m) => m.id === "KR-Read-3").status, "not yet");
  const allMet = new Set(READINESS_ITEMS.map((item) => item.id));
  const after = guideFor(connor, allMet);
  assert.ok(after.next.length > 0 && after.next.every((m) => m.grade === "Kindergarten"));
});

test("letter names and the last sound groups are Joyce lessons; Jungle Jump reports sounds A to L", () => {
  const day = buildDay({ kidId: "connor", date: "2026-11-10" });
  const reading = day.cards.find((card) => card.part === "ela");
  assert.equal(reading.kind, "lesson");
  assert.equal(reading.stepId, "connor-names-1");
  const names = Object.fromEntries([1, 2, 3, 4].map((n) => [`connor-names-${n}`, LEARNED]));
  const sounds = buildDay({ kidId: "connor", date: "2026-11-10", state: { steps: names } }).cards.find((card) => card.part === "ela");
  assert.equal(sounds.gameId, "sound-bugs");
  assert.match(sounds.href, /step=connor-sounds-1/);
  const later = { ...names, "connor-sounds-1": LEARNED, "connor-sounds-2": LEARNED };
  const third = buildDay({ kidId: "connor", date: "2026-11-10", state: { steps: later } }).cards.find((card) => card.part === "ela");
  assert.equal(third.kind, "lesson");
  assert.equal(third.stepId, "connor-sounds-3");
});

test("his steps close checklist items: the alphabet, letters and sounds, counting, numbers, sorting", () => {
  const names = Object.fromEntries([1, 2, 3, 4].map((n) => [`connor-names-${n}`, LEARNED]));
  assert.deepEqual(milestonesFromSteps("connor", { steps: names }), ["KR-Read-5"]);
  const all = { ...names, ...Object.fromEntries([1, 2, 3, 4].map((n) => [`connor-sounds-${n}`, LEARNED])) };
  assert.deepEqual(milestonesFromSteps("connor", { steps: all }).sort(), ["KR-Read-3", "KR-Read-5"]);
  const more = { "connor-count-10": { ...LEARNED, coverRule: true }, "connor-numbers": LEARNED, "connor-sort": LEARNED };
  assert.deepEqual(milestonesFromSteps("connor", { steps: more }).sort(), ["KR-Math-1", "KR-Math-3", "KR-Math-8"]);
  assert.deepEqual(milestonesFromSteps("connor", { steps: {}, prewrite: { stage: 4, nameDone: "2026-12-01" } }).sort(), ["KR-Read-6", "KR-Read-8"]);
});

test("the writing card moves on after two good days, and stays put after a not yet", () => {
  assert.deepEqual(PREWRITE_STAGES.map((stage) => stage.id), ["down", "across", "circle", "curve", "n", "r", "name"]);
  let pw = {};
  ({ prewrite: pw } = recordPrewrite(pw, { date: "2026-11-10", fits: true }));
  assert.equal(recordPrewrite(pw, { date: "2026-11-10", fits: true }).repeat, true);
  let moved;
  ({ prewrite: pw, moved } = recordPrewrite(pw, { date: "2026-11-11", fits: true }));
  assert.equal(moved, true);
  assert.equal(prewriteToday(pw).prewrite, "across");
  ({ prewrite: pw } = recordPrewrite(pw, { date: "2026-11-12", fits: true }));
  ({ prewrite: pw, moved } = recordPrewrite(pw, { date: "2026-11-13", fits: false }));
  assert.equal(moved, false);
  assert.equal(pw.fits, 0);
  let name = { stage: 6 };
  ({ prewrite: name } = recordPrewrite(name, { date: "2026-12-01", fits: true }));
  ({ prewrite: name } = recordPrewrite(name, { date: "2026-12-02", fits: true }));
  assert.equal(name.nameDone, "2026-12-02");
  assert.equal(name.stage, 6);
  assert.deepEqual(prewriteMilestones(name).sort(), ["KR-Read-6", "KR-Read-8"]);
});

test("Connor's writing card saves his own check through Joyce", async () => {
  const store = memoryStore();
  const call = (body, when) => handleClassroom({ store, env: {}, body: { kid: "connor", ...body }, now: at(when) });
  const day = await call({ action: "today" }, "2026-11-10T15:00:00Z");
  const card = day.body.cards.find((entry) => entry.kind === "write");
  assert.equal(card.title, "Writing: lines down");
  assert.equal(card.strokes.length, 1);
  assert.match(card.paperHref, /size=big/);
  assert.equal((await call({ action: "write", fits: true }, "2026-11-10T15:10:00Z")).body.ok, true);
  await call({ action: "today" }, "2026-11-11T15:00:00Z");
  const second = await call({ action: "write", fits: true }, "2026-11-11T15:10:00Z");
  assert.equal(second.body.moved, true);
  const next = await call({ action: "today" }, "2026-11-12T15:00:00Z");
  assert.equal(next.body.cards.find((entry) => entry.kind === "write").title, "Writing: lines across");
  const max = buildDay({ kidId: "max", date: "2026-11-12" }).cards.find((entry) => entry.kind === "write");
  assert.equal(max.letter, "c", "Max keeps his own letter card");
});
