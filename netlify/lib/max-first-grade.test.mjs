import assert from "node:assert/strict";
import test from "node:test";
import { BASELINES, baselineMet } from "./baselines.mjs";
import { allMilestones, guideFor, kidById } from "./kids.mjs";
import { buildDay, handleClassroom, memoryStore, milestonesFromSteps, seedChecks, stepById } from "./classroom.mjs";
import { itemsFor } from "./classroom-content.mjs";
import { writeLesson, writeToday } from "./handwriting.mjs";

const FIRST = allMilestones().filter((m) => m.grade === "First Grade").map((m) => m.id);
const at = (iso) => new Date(iso);
const call = (store, body, when) => handleClassroom({ store, env: {}, body: { kid: "max", ...body }, now: at(when) });

test("Stephanie's First Grade check covers every goal once: 33 met, 27 open", () => {
  const { met, open } = BASELINES.max;
  assert.equal(met.length, 33);
  assert.equal(Object.keys(open).length, 27);
  assert.deepEqual([...met, ...Object.keys(open)].sort(), FIRST.slice().sort());
  assert.equal(met.filter((id) => open[id]).length, 0);
});

test("Max's guide stays in First Grade for each subject until that subject is done", () => {
  const max = kidById("max");
  const guide = guideFor(max, new Set(baselineMet("max")));
  const grades = (area) => new Set(guide.next.filter((m) => m.area === area).map((m) => m.grade));
  assert.deepEqual([...grades("Math")], ["First Grade"]);
  assert.deepEqual([...grades("ELA")], ["First Grade"]);
  assert.deepEqual([...grades("Bible/Character")], ["Second Grade"], "all 12 First Grade Bible goals are met");
  assert.ok(guide.next.some((m) => m.id === "K-Sep-Writing-1"), "Kindergarten writing stays");
  const skip = guide.next.find((m) => m.id === "G1-Dec-Math-1");
  assert.equal(skip.status, "not sure");
  assert.match(skip.note, /odd and even/i);

  // Every First Grade math goal but the review month met: the review counts, and Second Grade math opens.
  const mathDone = new Set([...baselineMet("max"), "G1-Dec-Math-1", "G1-Apr-Math-1", "G1-May-Math-1"]);
  const next = guideFor(max, mathDone).next.filter((m) => m.area === "Math");
  assert.equal(next[0].id, "G2-Sep-Math-1");
});

test("skip counting and 3D shapes start with a cold check, not a lesson", async () => {
  const store = memoryStore();
  const monday = await call(store, { action: "today" }, "2026-11-09T15:00:00Z");
  const check = monday.body.cards.find((card) => card.kind === "check");
  assert.equal(check.stepId, "max-skip-count");
  assert.equal(check.items.length, 3);
  const lessons = monday.body.cards.filter((card) => card.kind === "lesson").map((card) => card.stepId);
  assert.deepEqual(lessons, ["max-compound", "max-odd-even"]);
  const saved = await store.get("classroom/kid/max", { type: "json" });
  assert.equal(saved.steps["max-3d-shapes"].nextCheck, "2026-11-09");
});

test("a missed cold check sends skip counting back to lessons; a pass confirms it", () => {
  const failed = seedChecks("max", { steps: { "max-skip-count": { mastered: false, slipping: true, shownAt: "2026-11-09", checks: [{ date: "2026-11-09", right: 1, passed: false }] } } });
  const day = buildDay({ kidId: "max", date: "2026-11-11", state: failed });
  assert.ok(day.cards.some((card) => card.stepId === "max-skip-count" && card.kind === "lesson"));

  const state = seedChecks("max", {});
  assert.deepEqual(milestonesFromSteps("max", state), [], "shown is not confirmed");
  state.steps["max-skip-count"].confirmedAt = "2026-11-09";
  state.steps["max-3d-shapes"].confirmedAt = "2026-11-10";
  assert.deepEqual(milestonesFromSteps("max", state), ["G1-May-Math-1"]);
  state.steps["max-odd-even"] = { graded: 6, correct: 6, recent: [true, true, true, true, true, true], mastered: true };
  state.steps["max-bar-graphs"] = { graded: 6, correct: 6, recent: [true, true, true, true, true, true], mastered: true };
  assert.deepEqual(milestonesFromSteps("max", state).sort(), ["G1-Apr-Math-1", "G1-Dec-Math-1", "G1-May-Math-1"]);
});

test("Max's math lesson is a First Grade gap on Mon/Wed/Fri and regrouping on Tue/Thu, then regrouping daily", () => {
  const state = seedChecks("max", {});
  const mathLesson = (date, s = state) => buildDay({ kidId: "max", date, state: s }).cards.find((card) => card.part === "math" && card.kind !== "app");
  assert.equal(mathLesson("2026-11-09").stepId, "max-odd-even");
  assert.equal(mathLesson("2026-11-10").gameId, "block-trade");
  assert.equal(mathLesson("2026-11-11").stepId, "max-odd-even");
  const done = structuredClone(state);
  for (const id of ["max-odd-even", "max-bar-graphs"]) done.steps[id] = { graded: 6, correct: 6, recent: [true, true, true, true, true, true], mastered: true };
  assert.equal(mathLesson("2026-11-09", done).gameId, "block-trade");
  for (const date of ["2026-11-09", "2026-11-10"]) {
    const words = buildDay({ kidId: "max", date, state }).cards.filter((card) => card.part === "ela").map((card) => card.stepId || card.kind);
    assert.deepEqual(words, ["app", "max-compound"], date);
  }
});

test("every new question has its answer among the choices", () => {
  for (const id of ["max-skip-count", "max-odd-even", "max-bar-graphs", "max-3d-shapes", "max-compound", "max-contractions", "max-parts-of-speech", "max-sentences"]) {
    const def = stepById("max", id);
    for (const seed of ["2026-11-09", "2026-11-10", "2026-11-11"]) {
      const items = itemsFor({ ...def, items: 6 }, seed);
      assert.ok(items.length >= 4, id);
      for (const item of items) {
        assert.ok(item.choices.some((choice) => choice.id === item.answer), `${id}: ${item.say} -> ${item.answer}`);
        assert.equal(new Set(item.choices.map((choice) => choice.id)).size, item.choices.length, `${id}: duplicate choice`);
        assert.ok(item.item && item.hint, id);
      }
    }
  }
  const graph = itemsFor({ ...stepById("max", "max-bar-graphs"), items: 3 }, "2026-11-09");
  for (const item of graph) {
    assert.equal(item.type, "graph");
    assert.equal(item.graph.bars.length, 3);
    assert.ok(item.graph.bars.every((bar) => bar.value >= 1 && bar.value <= item.graph.max));
  }
  const odd = itemsFor(stepById("max", "max-odd-even"), "2026-11-09");
  for (const item of odd) assert.equal(item.answer, Number(item.show) % 2 ? "odd" : "even");
});

test("every other writing day adds one sentence of a story he tells", () => {
  assert.equal(writeLesson(writeToday({ count: 0 })).sentenceSay, null);
  assert.match(writeLesson(writeToday({ count: 1 })).sentenceSay, /Tell a grown-up a short story/);
  assert.equal(writeLesson(writeToday({ count: 2 })).sentenceSay, null);
});
