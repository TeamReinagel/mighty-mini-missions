// One round is this many finished problems. Joyce asks for the same number,
// so playing the round fills that mission.
export const ROUND_LENGTH = {
  "otter-slide": 5,
  "hatch-match": 5,
  "sound-bugs": 8,
  "sound-teams": 8,
  "snack-count": 6,
  "flower-beds": 6,
  "more-or-fewer": 6,
  "pattern-park": 6,
  "color-tap": 5,
  "block-trade": 5,
  "coin-record-run": 3,
  "monster-hunt": 6,
  "lost-helpers": 4,
  "train-set": 3,
  "ghost-word-run": 10,
  "nest-numbers": 4,
  "big-little": 4,
  "basket-sort": 4,
  "shape-tap": 4,
  "my-name": 4,
  "two-jobs": 4
};

export function roundsFor(game, kidId) {
  const full = ROUND_LENGTH[game] ?? 4;
  return kidId === "ethan" ? Math.ceil(full / 2) : full;
}
