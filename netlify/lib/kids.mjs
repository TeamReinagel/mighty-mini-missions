import { MILESTONES } from "./milestones.mjs";

// Who Joyce reports on, and which milestone sheets guide "what to introduce next".
// `id` must match the profile id in the Mighty Mini Missions app (lowercase name for the defaults).
// `guides` picks grade sheets from the milestones spreadsheet; `areas` limits a sheet to some columns.
// Levels come from Learning Land/CHILD_LANES.md (updated 2026-10-01); edit as the kids grow.
export const KIDS = [
  {
    id: "max",
    name: "Max",
    age: 5,
    where: "Reading.com lesson 94 of 120; wrapping up 1st-grade math, moving into 2nd. Known gaps: coins, regrouping. Handwriting is well behind reading.",
    guides: [
      { grade: "Second Grade", areas: ["Math"] },
      { grade: "First Grade", areas: ["ELA", "Science", "Social Studies", "Bible/Character"] },
      { grade: "Kindergarten", areas: ["Writing", "Physical Fitness and Gross Motor Skills", "Life Skills", "Social-Emotional Development", "Practical Arts and Creativity"] }
    ]
  },
  {
    id: "gabi",
    name: "Gabi",
    age: 4,
    where: "Reading.com around lesson 25, blending simple words; pre-K math. Relational, story-loving, tactile learner.",
    guides: [{ grade: "Kindergarten" }]
  },
  {
    id: "connor",
    name: "Connor",
    age: 3,
    where: "Pre-reading (letter play and songs). Counts objects well; counts to 50 on the abacus with prompting. Next: counting past 10, more/fewer, simple patterns, letter names and sounds through play.",
    note: "Kindergarten milestones are a far horizon for Connor. Suggest only the earliest, playful ones.",
    guides: [{ grade: "Kindergarten", areas: ["Reading", "Math", "Physical Fitness and Gross Motor Skills", "Life Skills", "Social-Emotional Development", "Practical Arts and Creativity"] }]
  },
  {
    id: "ethan",
    name: "Ethan",
    age: 2,
    where: "Toddler; starting to recognize shapes and colors. Plays Train Set.",
    // Only gets a report section in weeks with app activity or observations.
    quiet: true,
    guides: []
  }
];

const GRADE_CODE = { Kindergarten: "K", "First Grade": "G1", "Second Grade": "G2" };
const areaCode = (area) => area.split(/[ /]/)[0].replace(/:$/, "");

/** Every milestone as { id, grade, month, area, text }. Ids look like "K-Oct-Math-1". */
export function allMilestones() {
  const out = [];
  for (const [grade, sheet] of Object.entries(MILESTONES)) {
    for (const [month, areas] of Object.entries(sheet.months)) {
      for (const [area, goals] of Object.entries(areas)) {
        goals.forEach((text, i) => {
          out.push({ id: `${GRADE_CODE[grade] || grade}-${month.slice(0, 3)}-${areaCode(area)}-${i + 1}`, grade, month, area, text });
        });
      }
    }
  }
  return out;
}

/**
 * One child's unmet milestones in spreadsheet order: `next` holds the first few per subject
 * (where "try next" comes from); `later` holds the rest, which can still be credited when a
 * child shows a skill early.
 */
export function guideFor(kid, metIds, perArea = 3) {
  const all = allMilestones();
  const next = [];
  const later = [];
  for (const { grade, areas } of kid?.guides || []) {
    for (const area of areas || MILESTONES[grade].areas) {
      const unmet = all.filter((m) => m.grade === grade && m.area === area && !metIds.has(m.id));
      next.push(...unmet.slice(0, perArea));
      later.push(...unmet.slice(perArea));
    }
  }
  return { next, later };
}

export function findKidsIn(text) {
  return KIDS.filter((k) => new RegExp(`\\b${k.name}\\b`, "i").test(text));
}

export const kidById = (id) => KIDS.find((k) => k.id === id);
