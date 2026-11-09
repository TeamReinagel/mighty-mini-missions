import { MILESTONES } from "./milestones.mjs";
import { REVIEW_MILESTONES, baselineNote } from "./baselines.mjs";

// Who Joyce reports on, and which milestone sheets guide "what to introduce next".
// `id` must match the profile id in the Mighty Mini Missions app (lowercase name for the defaults).
// `guides` picks grade sheets from the milestones spreadsheet; `areas` limits a sheet to some columns.
// Levels come from Learning Land/CHILD_LANES.md (updated 2026-10-01); edit as the kids grow.
export const KIDS = [
  {
    id: "max",
    name: "Max",
    age: 5,
    where: "Reading.com lesson 110 of 120, finished from Today with Joyce; AdaptedMind on smart practice. First Grade comes first: Stephanie's 2026-11-08 check found 33 of 60 First Grade goals met, and Second Grade work in a subject waits until that subject's First Grade goals are all met. Joyce teaches the gaps: compound words, contractions, nouns/verbs/adjectives and sentences after Reading.com; skip counting and 3D shapes (cold checks first), odd and even, and bar graphs on Monday, Wednesday, and Friday; regrouping (a Second Grade goal, kept on purpose) on Tuesday and Thursday. Coins are doing well now (First Grade money met; Coin Record Run continues). Writing is the main gap: tracing is fine, writing on his own is more comfortable but still well behind reading, and he can dictate stories but not write them. Today with Joyce has a daily writing card (one lowercase letter by formation family, paper that narrows from big boxes to lines), and every other writing day he writes one sentence of a story he tells. Science and social studies gaps (plants, life cycles, space, maps of Arkansas and US symbols, local government, landforms) are topics to cover with real-world missions, not drills.",
    // The tablet helper skips single-letter sounds for a reader at this level.
    knowsLetterSounds: true,
    // First Grade in every subject; a subject moves on to Second Grade only when its First Grade goals are all met.
    guides: [
      { grade: "First Grade", then: "Second Grade" },
      { grade: "Kindergarten", areas: ["Writing", "Physical Fitness and Gross Motor Skills", "Life Skills", "Social-Emotional Development", "Practical Arts and Creativity"] }
    ]
  },
  {
    id: "gabi",
    name: "Gabi",
    age: 4,
    where: "Today with Joyce leads reading from short-vowel blending (through Reading.com lesson 34: letters, capitals, and sounds are known; b/d/p/q still mix, and blending is the hard part), then digraphs, blends, sight words, and short stories. Joyce also leads pre-K math: counting, more and fewer, patterns, adding within 5. Reading.com and AdaptedMind stay installed and are not her daily apps.",
    guides: [{ grade: "Kindergarten" }]
  },
  {
    id: "connor",
    name: "Connor",
    age: 3,
    where: "Today with Joyce leads letter names and sounds, and counting to 10 then 20, more and fewer, and patterns. From November 3, 2026 each school day also has one practice game, rotating Nest Numbers, Big or Little, Basket Sort, Shape Blocks, My Name, and Two Jobs. Preschool Prep and Duck Duck Moose stay available and are not the daily assignment. Counts objects well; counts to 50 on the abacus with prompting.",
    note: "Kindergarten milestones are a far horizon for Connor. Suggest only the earliest, playful ones.",
    guides: [{ grade: "Kindergarten", areas: ["Reading", "Math", "Physical Fitness and Gross Motor Skills", "Life Skills", "Social-Emotional Development", "Practical Arts and Creativity"] }]
  },
  {
    id: "ethan",
    name: "Ethan",
    age: 2,
    where: "Toddler. Today with Joyce offers a short colors or counting card plus Train Set.",
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
  const met = withReviews(all, metIds);
  const next = [];
  const later = [];
  const note = (m) => {
    const open = baselineNote(kid?.id, m.id);
    return open ? { ...m, status: open.status, ...(open.note ? { note: open.note } : {}) } : m;
  };
  for (const { grade, areas, then } of kid?.guides || []) {
    for (const area of areas || MILESTONES[grade].areas) {
      let unmet = all.filter((m) => m.grade === grade && m.area === area && !met.has(m.id));
      // This subject's grade is done: move on to the next grade's same subject.
      if (!unmet.length && then && MILESTONES[then]?.areas.includes(area)) {
        unmet = all.filter((m) => m.grade === then && m.area === area && !met.has(m.id));
      }
      next.push(...unmet.slice(0, perArea).map(note));
      later.push(...unmet.slice(perArea).map(note));
    }
  }
  return { next, later };
}

// A review month (REVIEW_MILESTONES) is met once the rest of its grade and subject is met.
export function withReviews(all, metIds) {
  const met = new Set(metIds);
  for (const id of REVIEW_MILESTONES) {
    const goal = all.find((m) => m.id === id);
    if (!goal || met.has(id)) continue;
    const rest = all.filter((m) => m.grade === goal.grade && m.area === goal.area && m.id !== id);
    if (rest.every((m) => met.has(m.id))) met.add(id);
  }
  return met;
}

export function findKidsIn(text) {
  return KIDS.filter((k) => new RegExp(`\\b${k.name}\\b`, "i").test(text));
}

export const kidById = (id) => KIDS.find((k) => k.id === id);
