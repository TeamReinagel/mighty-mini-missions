// Every produced Lark and Nib episode, in the order each child watches them.
// Joyce gives a child the first episode here they have not finished. A finished
// episode never comes back as an assignment.
//
// `sounds` and `words` are what the episode introduces. Finishing an episode is not
// mastery of them. For FOCUS_DAYS after the finish, the practice games (Otter Slide,
// Hatch Match, The Lost Helpers, Jungle Jump) show them more often.
//
// To add an episode: append it to that child's list with its card builder,
// completion item, and what it introduces (from its episode.mjs).

import { moonPathCard, COMPLETION_ITEM as MOON_PATH } from "../moon-path/integration.mjs";
import { appleCatcherCard, COMPLETION_ITEM as APPLE_CATCHER } from "../apple-catcher/integration.mjs";
import { episodeCard as sailCard, COMPLETION_ITEM as SAIL } from "../sail-that-wouldnt-stay/integration.mjs";
import { bagAtDoorCard, COMPLETION_ITEM as BAG_AT_DOOR } from "../bag-at-the-door/integration.mjs";
import { episodeCard as fanCard, COMPLETION_ITEM as FAN } from "../fan-at-the-fork/integration.mjs";

export const FOCUS_DAYS = 14;

export const SERIES = {
  connor: [
    { gameId: "moon-path", label: "S1E1", title: "The Moon Path", card: moonPathCard, completionItem: MOON_PATH, sounds: ["m"], words: [] },
    {
      gameId: "apple-catcher", label: "S1E2", title: "The Apple Catcher", card: appleCatcherCard, completionItem: APPLE_CATCHER, sounds: ["a"], words: ["am"],
      handsOn: { title: "Apple catcher line", say: "Tell someone, I am an apple catcher. Then tap I did it." }
    },
    { gameId: "sail-that-wouldnt-stay", label: "S1E3", title: "The Sail That Wouldn’t Stay", card: sailCard, completionItem: SAIL, sounds: ["s"], words: ["am"] }
  ],
  gabi: [
    {
      gameId: "bag-at-the-door", label: "S2E1", title: "The Bag at the Door", card: bagAtDoorCard, completionItem: BAG_AT_DOOR, sounds: ["d"], words: ["pad", "sad", "did", "dim"],
      handsOn: { title: "Three invitations", say: "Fold three little papers into invitations and put them in a bag. Then tap I did it." }
    },
    { gameId: "fan-at-the-fork", label: "S2E2", title: "The Fan at the Fork", card: fanCard, completionItem: FAN, sounds: ["f"], words: ["fan", "fin", "fit"] }
  ]
};

// Finished before Joyce kept this list (Stephanie, November 8, 2026). The dates are
// the days these episodes were on the board, so the newest still get their practice boost.
export const FINISHED_BEFORE = {
  connor: { "moon-path": "2026-10-19", "apple-catcher": "2026-11-02" },
  gabi: { "bag-at-the-door": "2026-11-02" }
};

export const EPISODE_IDS = new Set(Object.values(SERIES).flat().map((entry) => entry.gameId));

export function episodeById(gameId) {
  return Object.values(SERIES).flat().find((entry) => entry.gameId === gameId) || null;
}

export function seriesFor(kidId) {
  return SERIES[kidId] || [];
}

// gameId -> the earliest day that child finished it. Joyce's saved list, the
// story cards checked off on past boards, and the starting list all count.
export function finishedEpisodes(kidId, state = {}) {
  const out = { ...(FINISHED_BEFORE[kidId] || {}) };
  const keep = (gameId, date) => {
    if (!EPISODE_IDS.has(gameId) || !date) return;
    if (!out[gameId] || date < out[gameId]) out[gameId] = date;
  };
  for (const [gameId, date] of Object.entries(state.episodes || {})) keep(gameId, date);
  for (const [date, day] of Object.entries(state.days || {})) {
    for (const id of day?.done || []) {
      const [cardDate, kind, gameId] = String(id).split(":");
      if (cardDate === date && kind === "game") keep(gameId, date);
    }
  }
  return out;
}

// Saves a finish. Returns true when the list changed.
export function recordFinished(state, gameId, date) {
  if (!EPISODE_IDS.has(gameId) || !date) return false;
  const saved = state.episodes || {};
  if (saved[gameId] && saved[gameId] <= date) return false;
  state.episodes = { ...saved, [gameId]: date };
  return true;
}

export function nextEpisode(kidId, state = {}) {
  const finished = finishedEpisodes(kidId, state);
  return seriesFor(kidId).find((entry) => !finished[entry.gameId]) || null;
}

function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// What a child's practice games should show more often today: the sounds and words from
// episodes finished in the last FOCUS_DAYS days, newest episode first.
export function focusFor(kidId, state = {}, date) {
  const finished = finishedEpisodes(kidId, state);
  const recent = seriesFor(kidId)
    .filter((entry) => finished[entry.gameId] && date && finished[entry.gameId] <= date && addDays(finished[entry.gameId], FOCUS_DAYS) > date)
    .sort((a, b) => finished[b.gameId].localeCompare(finished[a.gameId]));
  const sounds = [];
  const words = [];
  for (const entry of recent) {
    for (const sound of entry.sounds) if (!sounds.includes(sound)) sounds.push(sound);
    for (const word of entry.words) if (!words.includes(word)) words.push(word);
  }
  const until = recent.length ? addDays(finished[recent[0].gameId], FOCUS_DAYS) : null;
  return { kid: kidId, sounds, words, episodes: recent.map((entry) => entry.title), until };
}
