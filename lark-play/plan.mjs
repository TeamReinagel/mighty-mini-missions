// Monday, Wednesday, and Friday can hold a produced Lark and Nib episode.
// Tuesday, Thursday, and a story day with no episode yet keep the games
// already in Today with Joyce. The short Lark games are not part of this plan.
// Produced now: The Apple Catcher (Connor) and The Bag at the Door (Gabi).
// When the next episode is ready, replace that child's empty story slot and
// add its card beside the two builders below.

import { appleCatcherCard } from "../apple-catcher/integration.mjs";
import { bagAtDoorCard } from "../bag-at-the-door/integration.mjs";
import { episodeCard as sailCard } from "../sail-that-wouldnt-stay/integration.mjs";

export const LARK_START = "2026-11-02";

const CONNOR_STORY = ["apple-catcher", null];
const GABI_STORY = ["bag-at-the-door", null];

const HANDS = {
  "apple-catcher": {
    title: "Apple catcher line",
    say: "Tell someone, I am an apple catcher. Then tap I did it."
  },
  "bag-at-the-door": {
    title: "Three invitations",
    say: "Fold three little papers into invitations and put them in a bag. Then tap I did it."
  }
};

// Same Chicago weekday as classroom.mjs. Noon US Central, so the date does not flip in the evening.
export function chicagoWeekday(date) {
  const [year, month, day] = date.split("-").map(Number);
  const stamp = new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short" }).format(stamp);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[name];
}

function role(date) {
  if (!date || date < LARK_START) return null;
  const day = chicagoWeekday(date);
  if (day === 1 || day === 3 || day === 5) return "story";
  if (day === 2 || day === 4) return "practice";
  return null;
}

function eachDate(from, to) {
  const [year, month, day] = from.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  const out = [];
  while (cursor.toISOString().slice(0, 10) <= to) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function roleIndex(date, wanted) {
  let index = -1;
  for (const iso of eachDate(LARK_START, date)) {
    if (role(iso) === wanted) index += 1;
  }
  return index;
}

function cardFor(kidId, date, kind, index) {
  if (kind !== "story") return null;
  if (kidId === "connor") {
    const play = CONNOR_STORY[index % CONNOR_STORY.length];
    return play === "apple-catcher" ? appleCatcherCard(date, kidId) : null;
  }
  if (kidId === "gabi") {
    const play = GABI_STORY[index % GABI_STORY.length];
    return play === "bag-at-the-door" ? bagAtDoorCard(date, kidId) : null;
  }
  return null;
}

export function larkAssignment(kidId, date) {
  // Stephanie's one-day assignment replaces the Moon Path fallback, not the recurring plan.
  if (kidId === "connor" && date === "2026-11-04") return { card: sailCard(date, kidId), handsOn: null };
  if (kidId !== "connor" && kidId !== "gabi") return null;
  const kind = role(date);
  if (!kind) return null;
  const card = cardFor(kidId, date, kind, roleIndex(date, kind));
  if (!card) return null;
  return { card, handsOn: HANDS[card.gameId] || null };
}
