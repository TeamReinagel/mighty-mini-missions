// Connor's writing card: pre-writing strokes, then the letters of his name, then his name.
// Kindergarten Readiness Checklist: "Draws straight and curved lines and simple shapes" and
// "Prints first name" (both Not yet, Stephanie 2026-11-09). Joyce shows a stroke with a green dot
// where the crayon starts; he copies it on big-box paper and checks his own page.
// Two "they look like Joyce's" days in a row move him to the next stage. A "not yet" keeps him there.

const s = (d, text) => ({ d, text, cue: text });

const CIRCLE = "M 50 12 A 38 38 0 1 0 50 88 A 38 38 0 1 0 50 12";
const C_CURVE = "M 78 26 A 38 38 0 1 0 78 74";

export const PREWRITE_STAGES = [
  {
    id: "down", title: "Lines down", name: "a line down",
    strokes: [s("M 50 12 L 50 88", "Start at the top. Pull straight down.")],
    write: "Now you. On your paper, make three lines down. Start at the top each time."
  },
  {
    id: "across", title: "Lines across", name: "a line across",
    strokes: [s("M 14 50 L 86 50", "Start on the left side. Slide straight across.")],
    write: "Now you. On your paper, make three lines across. Start on the left each time."
  },
  {
    id: "circle", title: "Circles", name: "a circle",
    strokes: [s(CIRCLE, "Start at the top. Go back and around, and close it up. A circle is also the letter O.")],
    write: "Now you. On your paper, make three circles. Start at the top and go back and around."
  },
  {
    id: "curve", title: "The letter C", name: "the letter C",
    strokes: [s(C_CURVE, "Start up high. Go back and around, and stop. That curve is the letter C, the first letter in Connor.")],
    write: "Now you. On your paper, make three C's. Start up high, go back and around, and stop."
  },
  {
    id: "n", title: "The letter N", name: "the letter N",
    strokes: [
      s("M 26 88 L 26 12", "Start at the bottom. Go straight up."),
      s("M 26 12 L 74 88", "Slide down to the other side."),
      s("M 74 88 L 74 12", "Go straight up again. That's N.")
    ],
    write: "Now you. On your paper, make three N's. Up, slide down, up."
  },
  {
    id: "r", title: "The letter R", name: "the letter R",
    strokes: [
      s("M 30 88 L 30 12", "Start at the top. Pull straight down."),
      s("M 30 12 L 54 12 Q 74 12 74 31 Q 74 50 54 50 L 30 50", "Back to the top. Go around in a bump to the middle."),
      s("M 48 50 L 74 88", "Then kick out a leg. That's R.")
    ],
    write: "Now you. On your paper, make three R's. Down, a bump, and a leg."
  },
  {
    id: "name", title: "Your name", name: "your name",
    strokes: [s(C_CURVE, "Your name starts with C. Back and around, and stop.")],
    write: "Now you. Make a C on your paper.",
    word: "CONNOR",
    wordSay: "Now write your whole name. C, O, N, N, O, R. Connor!"
  }
];

const FITS_TO_MOVE = 2;
const NAME_INDEX = PREWRITE_STAGES.findIndex((stage) => stage.id === "name");
const LINES_DONE_INDEX = PREWRITE_STAGES.findIndex((stage) => stage.id === "n");

export function prewriteToday(prewrite = {}) {
  const stage = Math.min(PREWRITE_STAGES.length - 1, Math.max(0, Number(prewrite.stage) || 0));
  return { prewrite: PREWRITE_STAGES[stage].id, stage };
}

/** The card fields the classroom writing screen reads (same shape as Max's writing card). */
export function prewriteLesson(plan) {
  const stage = PREWRITE_STAGES.find((entry) => entry.id === plan.prewrite) || PREWRITE_STAGES[0];
  const say = stage.id === "name" ? "Today you write your name. Watch the first letter." : `Today we make ${stage.name}. Watch how I make it.`;
  return {
    letter: stage.name,
    title: `Writing: ${stage.title.toLowerCase()}`,
    say,
    sayText: say,
    strokes: stage.strokes,
    write: stage.write,
    writeText: stage.write,
    word: stage.word || null,
    wordSay: stage.wordSay || null,
    sentenceSay: null,
    check: stage.id === "name" ? "Look at your name. Does it look like Joyce's letters?" : "Look at your page. Do yours look like the one Joyce made?",
    paper: "big"
  };
}

/** Saves his own check once a day. Two yes days in a row move to the next stage. */
export function recordPrewrite(prewrite = {}, { date, fits }) {
  const before = { stage: 0, fits: 0, ...prewrite };
  if (before.day === date) return { prewrite: before, moved: false, repeat: true };
  const next = { ...before, day: date, last: { day: date, stage: PREWRITE_STAGES[before.stage]?.id, fits } };
  let moved = false;
  if (fits) {
    next.fits = before.fits + 1;
    if (next.fits >= FITS_TO_MOVE) {
      if (before.stage === NAME_INDEX) next.nameDone = next.nameDone || date;
      if (before.stage < PREWRITE_STAGES.length - 1) {
        next.stage = before.stage + 1;
        moved = true;
      }
      next.fits = 0;
    }
  } else {
    next.fits = 0;
  }
  return { prewrite: next, moved, repeat: false };
}

/** Readiness checklist items his writing has shown, by his own two-day checks. */
export function prewriteMilestones(prewrite = {}) {
  const met = [];
  if ((Number(prewrite.stage) || 0) >= LINES_DONE_INDEX) met.push("KR-Read-8");
  if (prewrite.nameDone) met.push("KR-Read-6");
  return met;
}

export const prewriteStageName = (prewrite = {}) => PREWRITE_STAGES[Math.min(PREWRITE_STAGES.length - 1, Number(prewrite.stage) || 0)].name;
