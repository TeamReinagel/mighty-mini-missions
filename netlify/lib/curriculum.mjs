// The order skills build on each other across the Mighty Mini Missions games.
// Keep these labels in sync with the skill names the games log (see progress.js callers).
// Used to suggest "what to introduce next" in the weekly report.

export const STRANDS = [
  {
    id: "early-concepts",
    name: "Colors, shapes and size (Monster Hunt, Train Set)",
    steps: ["Colors & Shapes", "More Colors", "Tricky Shapes", "Big & Small"]
  },
  {
    id: "early-literacy",
    name: "Letters to reading (Monster Hunt, Hatch Match, Otter Slide, then Ghost Word Run)",
    steps: [
      "Letters A to Z",
      "Big & little letters",
      "Letter Sounds",
      "Blending CVC words",
      "Sight words: Moonlit Meadow (Words 1-50)",
      "Sight words: Pumpkin Path (Words 51-100)",
      "Sight words: Bat Cave (Words 101-150)",
      "Sight words: Haunted Hill (Words 151-200)",
      "Sight words: Graveyard Grand Tour (All of words 1-200 mixed)",
      "Sight words: Witch's Woods (Stretch words 201-250)",
      "Sight words: Midnight Mansion (Stretch words 251-300)"
    ]
  },
  {
    id: "phonological",
    name: "Hearing sounds in words",
    steps: ["Rhyming (Trick-or-Treat Street)"]
  },
  {
    id: "money",
    name: "Money (Coin Record Run levels)",
    unit: "item",
    steps: [
      "Little Counters",
      "Penny & Nickel Park",
      "Dime Drive",
      "Quarter Canyon",
      "Mystery Mountain",
      "Dollar Summit",
      "Endless Castle"
    ]
  },
  {
    id: "math",
    name: "Number sense and math facts (Monster Hunt numbers, then Monster Maker)",
    steps: [
      "Numbers 1 to 10",
      "Counting objects (Pre-K)",
      "Subitizing (dice dots) (Pre-K)",
      "One more (Pre-K)",
      "Counting objects (K)",
      "Ten frames (K)",
      "What number comes next (K)",
      "Addition within 10 (K)",
      "Subtraction within 10 (K)",
      "Doubles (1st)",
      "Make 10 (1st)",
      "Addition within 20 (1st)",
      "Subtraction within 20 (1st)",
      "Missing addend (1st)",
      "Addition word problems (1st)",
      "Subtraction word problems (1st)",
      "Skip counting by 2s (2nd)",
      "Place value (tens) (2nd)",
      "Counting coins (2nd)",
      "Adding three numbers (2nd)",
      "Arrays (early multiplication) (2nd)",
      "Missing number subtraction (2nd)",
      "Two-digit subtraction with regrouping (2nd)",
      "Two-digit subtraction word problems (2nd)"
    ]
  }
];

// Games pick their own level, so a skill only appears in the data once a child tries it.
// The report treats the first untried step after a solid step as "ready to introduce".
export function nextSteps(solidUnits, triedUnits) {
  const out = [];
  for (const strand of STRANDS) {
    let lastSolid = -1;
    strand.steps.forEach((step, i) => { if (solidUnits.has(step)) lastSolid = i; });
    if (lastSolid < 0) continue;
    const next = strand.steps.slice(lastSolid + 1).find((step) => !solidUnits.has(step));
    if (next) out.push({ strand: strand.name, after: strand.steps[lastSolid], next, alreadyTried: triedUnits.has(next) });
  }
  return out;
}

export function curriculumText() {
  return STRANDS.map((s) => `${s.name}:\n${s.steps.map((step, i) => `  ${i + 1}. ${step}`).join("\n")}`).join("\n\n");
}

export const GAME_NAMES = {
  "word-monsters": "Monster Hunt",
  "ghost-word-run": "Ghost Word Run",
  "coin-record-run": "Coin Record Run",
  "monster-maker": "Monster Maker",
  "train-set": "Train Set",
  "hatch-match": "Hatch Match",
  "otter-slide": "Otter Slide",
  missions: "Missions",
  joyce: "Today with Joyce"
};
