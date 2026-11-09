// Monday, Wednesday, and Friday are Lark and Nib story days for Connor and Gabi.
// A story day gives that child the next episode in lark-play/episodes.mjs that they
// have not finished. A missed day just waits for the next story day, and a finished
// episode never comes back. With no unfinished episode, the day keeps its usual cards.
// Tuesday and Thursday keep the usual cards.

import { nextEpisode, episodeById } from "./episodes.mjs";

export const LARK_START = "2026-11-02";

// Same Chicago weekday as classroom.mjs. Noon US Central, so the date does not flip in the evening.
export function chicagoWeekday(date) {
  const [year, month, day] = date.split("-").map(Number);
  const stamp = new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short" }).format(stamp);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[name];
}

export function isStoryDay(date) {
  if (!date || date < LARK_START) return false;
  const day = chicagoWeekday(date);
  return day === 1 || day === 3 || day === 5;
}

// The episode gameId for this child's story slot today, or null. Joyce pins this on the
// day's board, so finishing the episode does not swap in the next one until tomorrow.
export function larkPick(kidId, date, state = {}) {
  if (kidId !== "connor" && kidId !== "gabi") return null;
  if (!isStoryDay(date)) return null;
  return nextEpisode(kidId, state)?.gameId || null;
}

// `pinned` is the gameId saved on today's board (null for no story). Undefined means
// the board was not pinned yet, so the pick comes from what the child has finished.
export function larkAssignment(kidId, date, state = {}, pinned) {
  const gameId = pinned === undefined ? larkPick(kidId, date, state) : pinned;
  const entry = gameId ? episodeById(gameId) : null;
  if (!entry) return null;
  return { card: entry.card(date, kidId), handsOn: entry.handsOn || null };
}
