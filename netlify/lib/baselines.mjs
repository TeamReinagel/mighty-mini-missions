// Starting points Stephanie set by hand. They count as met milestones from the start, beside the
// ones Joyce's weekly report credits and the ones a child's Joyce steps close.
//
// Max's First Grade check, marked 2026-11-08 on the "Max's First Grade Check" artifact
// (https://claude.ai/artifact/D5XfKFCrPaepPtwyj6GUAD). Second Grade work in a subject waits
// until every First Grade goal in that subject is met.

export const BASELINES = {
  max: {
    date: "2026-11-08",
    source: "Stephanie's First Grade check",
    met: [
      "G1-Sep-ELA-1", "G1-Oct-ELA-1", "G1-Nov-ELA-1", "G1-Jan-ELA-1", "G1-May-ELA-1",
      "G1-Sep-Math-1", "G1-Oct-Math-1", "G1-Nov-Math-1", "G1-Jan-Math-1", "G1-Feb-Math-1",
      "G1-Mar-Math-1", "G1-Jun-Math-1", "G1-Jul-Math-1",
      "G1-Sep-Science-1", "G1-Oct-Science-1", "G1-Dec-Science-1", "G1-Jan-Science-1", "G1-Mar-Science-1", "G1-Jun-Science-1",
      "G1-Sep-Social-1", "G1-Nov-Social-1",
      "G1-Sep-Bible-1", "G1-Oct-Bible-1", "G1-Nov-Bible-1", "G1-Dec-Bible-1", "G1-Jan-Bible-1", "G1-Feb-Bible-1",
      "G1-Mar-Bible-1", "G1-Apr-Bible-1", "G1-May-Bible-1", "G1-Jun-Bible-1", "G1-Jul-Bible-1", "G1-Aug-Bible-1"
    ],
    // Not yet: a gap to fill. Not sure: check it, or watch for it.
    open: {
      "G1-Dec-ELA-1": { status: "not yet", note: "Reading.com taught some compound words without naming them, and no contractions." },
      "G1-Feb-ELA-1": { status: "not yet" },
      "G1-Mar-ELA-1": { status: "not yet", note: "He can dictate stories but not write them yet." },
      "G1-Apr-ELA-1": { status: "not yet" },
      "G1-Jun-ELA-1": { status: "not sure", note: "Reading.com texts get harder near the end, and he asks what new words from movies and adult talk mean." },
      "G1-Jul-ELA-1": { status: "not yet" },
      "G1-Aug-ELA-1": { status: "not yet" },
      "G1-Dec-Math-1": { status: "not sure", note: "Good at skip counting but not tested lately. Odd and even is fairly new." },
      "G1-Apr-Math-1": { status: "not sure", note: "Time is known. Bar graphs have not been taught." },
      "G1-May-Math-1": { status: "not sure", note: "Knows halves and quarters. 3D shapes may not be mastered." },
      "G1-Aug-Math-1": { status: "not sure" },
      "G1-Nov-Science-1": { status: "not yet" },
      "G1-Feb-Science-1": { status: "not sure" },
      "G1-Apr-Science-1": { status: "not sure", note: "Weather changes, but not the water cycle." },
      "G1-May-Science-1": { status: "not yet" },
      "G1-Jul-Science-1": { status: "not yet" },
      "G1-Aug-Science-1": { status: "not sure" },
      "G1-Oct-Social-1": { status: "not sure" },
      "G1-Dec-Social-1": { status: "not sure" },
      "G1-Jan-Social-1": { status: "not sure" },
      "G1-Feb-Social-1": { status: "not yet" },
      "G1-Mar-Social-1": { status: "not yet" },
      "G1-Apr-Social-1": { status: "not yet" },
      "G1-May-Social-1": { status: "not sure" },
      "G1-Jun-Social-1": { status: "not yet" },
      "G1-Jul-Social-1": { status: "not sure" },
      "G1-Aug-Social-1": { status: "not sure" }
    }
  }
};

// A review month counts as met once every other goal in its grade and subject is met.
export const REVIEW_MILESTONES = new Set(["G1-Aug-Math-1"]);

export function baselineMet(kidId) {
  return BASELINES[kidId]?.met || [];
}

export function baselineNote(kidId, id) {
  return BASELINES[kidId]?.open?.[id] || null;
}
