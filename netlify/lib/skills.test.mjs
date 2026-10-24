import assert from "node:assert/strict";
import test from "node:test";
import {
  ESSENTIAL, FRAMEWORK, addSpot, applyCheck, catalogText, checkDue, cleanStepIds, describeEssential,
  essentialStatus, nextSchoolDay, noticeLine, reportView, skillMap
} from "./skills.mjs";

test("the catalog is the first six steps of each Skills Builder skill", () => {
  assert.equal(ESSENTIAL.length, 8);
  assert.match(FRAMEWORK, /Skills Builder/);
  for (const skill of ESSENTIAL) {
    assert.equal(skill.steps.length, 6);
    assert.equal(skill.steps[0].n, 1);
    assert.equal(skill.steps[5].id, `${skill.id}-6`);
    assert.match(skill.steps[0].statement, /^I /);
  }
  assert.equal(describeEssential("teamwork-1"), "Teamwork: working together");
  assert.match(catalogText(), /planning-2/);
  assert.deepEqual(cleanStepIds(["teamwork-1", "nope", "teamwork-1", "planning-2", "listening-1"], ["teamwork-1", "planning-2"]), ["teamwork-1", "planning-2"]);
});

test("a parent note counts, and the same automatic signal twice does not", () => {
  let spots = [];
  spots = addSpot(spots, { stepId: "teamwork-1", day: "2026-10-19", source: "note" });
  spots = addSpot(spots, { stepId: "teamwork-1", day: "2026-10-19", source: "note" });
  assert.equal(spots.length, 1);
  assert.equal(essentialStatus(spots, "teamwork-1").confirmed, false);

  spots = addSpot(spots, { stepId: "teamwork-1", day: "2026-10-21", source: "note" });
  assert.equal(essentialStatus(spots, "teamwork-1").confirmed, true);

  let signals = addSpot([], { stepId: "adapting-3", day: "2026-10-19", source: "persist" });
  signals = addSpot(signals, { stepId: "adapting-3", day: "2026-10-20", source: "persist" });
  assert.equal(essentialStatus(signals, "adapting-3").confirmed, false);
  signals = addSpot(signals, { stepId: "adapting-3", day: "2026-10-21", source: "help" });
  assert.equal(essentialStatus(signals, "adapting-3").confirmed, true);

  let mixed = addSpot([], { stepId: "problem-solving-2", day: "2026-10-19", source: "help" });
  mixed = addSpot(mixed, { stepId: "problem-solving-2", day: "2026-10-20", source: "note" });
  assert.equal(essentialStatus(mixed, "problem-solving-2").confirmed, true);
});

test("the next thing to notice is the lowest open step of the skill just spotted", () => {
  const spots = addSpot([], { stepId: "planning-1", day: "2026-10-22", source: "note" });
  const map = skillMap({ essential: { spots } });
  assert.equal(map.notice.step.id, "planning-1");
  assert.match(noticeLine("Max", map.notice), /Planning step 1/);
  assert.match(noticeLine("Max", map.notice), /when Max says a job is too hard/);
  const view = reportView(map);
  assert.deepEqual(view.essentialStrengths, ["Planning: Sensing difficulty (spotted)"]);
  assert.equal(view.shown.length, 0);
});

test("a cold check confirms a shown skill, then reviews at 7 and 21 days", () => {
  assert.equal(nextSchoolDay("2026-10-23"), "2026-10-26");
  const def = { id: "gabi-cvc-a", activity: "cvc", title: "Short a words" };
  const shown = { mastered: true, shownAt: "2026-10-19", nextCheck: "2026-10-20", graded: 6, correct: 6, recent: [true, true, true, true, true, true] };
  assert.equal(checkDue({ "gabi-cvc-a": shown }, [def], "2026-10-19"), null);
  assert.equal(checkDue({ "gabi-cvc-a": shown }, [def], "2026-10-20").id, "gabi-cvc-a");

  let rec = applyCheck(shown, { date: "2026-10-20", passed: true, right: 3 });
  assert.equal(rec.confirmedAt, "2026-10-20");
  assert.equal(rec.nextCheck, "2026-10-27");
  assert.equal(checkDue({ "gabi-cvc-a": rec }, [def], "2026-10-21"), null);

  rec = applyCheck(rec, { date: "2026-10-27", passed: true, right: 2 });
  assert.equal(rec.nextCheck, "2026-11-10");
  rec = applyCheck(rec, { date: "2026-11-10", passed: false, right: 1 });
  assert.equal(rec.slipping, true);
  assert.equal(rec.mastered, false);
  assert.equal(rec.confirmedAt, null);
  assert.equal(rec.checkMisses, 1);
  assert.equal(checkDue({ "gabi-cvc-a": rec }, [def], "2026-11-11"), null);

  const review = { slipping: false, confirmedAt: "2026-10-01", nextCheck: "2026-10-20", shownAt: "2026-09-01" };
  const picked = checkDue(
    { "gabi-cvc-a": shown, review },
    [def, { id: "review", activity: "count", title: "Counting" }],
    "2026-10-20"
  );
  assert.equal(picked.id, "gabi-cvc-a");
});

test("the report view keeps essential skills as strengths", () => {
  const map = skillMap({
    stepDefs: [
      { id: "gabi-cvc-a", title: "Short a words", skill: "Blending CVC words" },
      { id: "gabi-cvc-e", title: "Short e words", skill: "Blending CVC words" }
    ],
    records: {
      "gabi-cvc-a": { confirmedAt: "2026-10-20", mastered: true, shownAt: "2026-10-16" },
      "gabi-cvc-e": { mastered: true, shownAt: "2026-10-21", nextCheck: "2026-10-22" }
    },
    essential: { spots: addSpot([], { stepId: "teamwork-1", day: "2026-10-22", source: "note" }) }
  });
  const view = reportView(map);
  assert.deepEqual(view.confirmed, ["Short a words"]);
  assert.deepEqual(view.shown, ["Short e words"]);
  assert.deepEqual(view.slipping, []);
  assert.deepEqual(view.essentialStrengths, ["Teamwork: Working together (spotted)"]);
  assert.equal(JSON.stringify(view).includes("missing"), false);
});
