// Gaps in the kids' paths: for each subject Today with Joyce teaches, the milestone-sheet goal a
// child is on now and the one after it. A goal with no game that practices it is a gap, and
// Stephanie gets one Slack DM listing the new ones (weekday mornings, from joyce-clock).
// Each gap is sent once while the child is heading toward it, and once more when they reach it.

import { baselineMet } from "./baselines.mjs";
import { allSteps, goalsOf, localDate, reportCredits, stepGame, stepMilestones } from "./classroom.mjs";
import { guideFor, kidById } from "./kids.mjs";
import { post } from "./slack.mjs";

// The milestone-sheet subjects each child's board teaches. Other subjects (fitness, life skills,
// science, Bible) are real-world missions, not games, so they never count as gaps.
export const BOARD_AREAS = {
  gabi: ["Reading", "Math"],
  max: ["ELA", "Math"],
  // The readiness checklist first; the Kindergarten sheet's subjects once it's done.
  connor: ["Reading and writing", "Math and reasoning", "Reading", "Math"]
};

// Goals a board card covers that aren't games by nature.
const OTHER_COVER = {
  connor: { "KR-Read-6": "his writing card", "KR-Read-8": "his writing card" }
};

const LOOKAHEAD = 2;
const TOLD_KEY = "classroom/gaps-told";

export function coverage(kidId, goalId) {
  const steps = allSteps(kidId).filter((def) => goalsOf(def).includes(goalId));
  const games = [...new Set(steps.map((def) => stepGame(def)?.title).filter(Boolean))];
  if (games.length) return { kind: "game", games };
  if (OTHER_COVER[kidId]?.[goalId]) return { kind: "other", by: OTHER_COVER[kidId][goalId] };
  if (steps.length) return { kind: "lesson", lessons: steps.map((def) => def.title) };
  return { kind: "none" };
}

/** The current and next goal in each board subject that no game practices. */
export function findGaps(kidId, met) {
  const kid = kidById(kidId);
  const areas = BOARD_AREAS[kidId];
  if (!kid || !areas) return [];
  const { next } = guideFor(kid, met, LOOKAHEAD);
  const gaps = [];
  for (const area of areas) {
    next.filter((goal) => goal.area === area).slice(0, LOOKAHEAD).forEach((goal, index) => {
      const found = coverage(kidId, goal.id);
      if (found.kind === "game" || found.kind === "other") return;
      gaps.push({ kidId, name: kid.name, goal, when: index === 0 ? "now" : "next", ...found });
    });
  }
  return gaps;
}

export const gapKey = (gap) => `${gap.kidId}:${gap.goal.id}:${gap.kind}:${gap.when}`;

function gapLine(gap) {
  const when = gap.when === "now" ? "working on now" : "up next";
  const head = `• *${gap.name}*, ${gap.goal.grade} ${gap.goal.area} (${when}): ${gap.goal.text} _(${gap.goal.id})_`;
  const tail = gap.kind === "lesson"
    ? `Joyce teaches it as a lesson (${gap.lessons.join("; ")}), but no game practices it.`
    : `Nothing on ${gap.name}'s path covers it yet, so Joyce skips ahead to the next goal she can teach.`;
  return `${head}\n    ${tail}`;
}

export function gapMessage(gaps) {
  return [
    "*Game gaps to fill*",
    "These milestone goals have no game yet. I checked the goal each child is on now and the one after it.",
    ...gaps.map(gapLine),
    "Tell me what to build and I'll propose the change for your OK."
  ].join("\n");
}

/** Goals met so far: Stephanie's baseline, the Friday report's credits, and learned Joyce steps. */
async function metGoals(store) {
  const fromSteps = await stepMilestones(store);
  const out = {};
  for (const kidId of Object.keys(BOARD_AREAS)) {
    out[kidId] = new Set([...baselineMet(kidId), ...(await reportCredits(store, kidId)), ...(fromSteps[kidId] || [])]);
  }
  return out;
}

/** Weekday mornings: DM Stephanie any gap she hasn't heard about. Runs once a day. */
export async function runGapCheck({ store, env = process.env, fetchImpl = fetch, now = new Date() }) {
  const runKey = `joyce/runs/gap-check-${localDate(env, now)}`;
  if (await store.get(runKey)) return { sent: false, gaps: [] };
  await store.set(runKey, now.toISOString());
  const met = await metGoals(store);
  const gaps = Object.keys(BOARD_AREAS).flatMap((kidId) => findGaps(kidId, met[kidId]));
  const told = (await store.get(TOLD_KEY, { type: "json" })) || {};
  const fresh = gaps.filter((gap) => !told[gapKey(gap)]);
  if (!fresh.length) return { sent: false, gaps };
  const stephanie = String(env.JOYCE_APPROVERS || "").split(/[\s,]+/).filter(Boolean)[0];
  await post({ channel: stephanie, text: gapMessage(fresh) }, { env, fetchImpl });
  const date = localDate(env, now);
  for (const gap of fresh) told[gapKey(gap)] = date;
  await store.setJSON(TOLD_KEY, told);
  return { sent: true, gaps, fresh };
}
