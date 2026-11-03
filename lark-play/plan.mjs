// Monday, Wednesday, and Friday are Lark and Nib story days.
// Tuesday and Thursday are short games that reuse the sounds from the latest story.
// The produced episodes are The Apple Catcher (Connor: m, short a, am) and
// The Bag at the Door (Gabi: map, mat, d, pad). Later episodes are not built,
// so the other story day is a short scene in the same world, not a new sound.
// When Episode 3 is ready, put it in CONNOR_STORY in place of a repeated Apple Catcher.
// When Gabi's next episode is ready, put it in GABI_STORY in place of a repeated Bag at the Door.

import { appleCatcherCard } from "../apple-catcher/integration.mjs";
import { bagAtDoorCard } from "../bag-at-the-door/integration.mjs";

export const LARK_START = "2026-11-02";

const CONNOR_STORY = ["apple-catcher", "i-am"];
const CONNOR_PRACTICE = ["pockets", "ant"];
const GABI_STORY = ["bag-at-the-door", "strap"];
const GABI_PRACTICE = ["folio"];

const PLAYS = {
  pockets: {
    gameId: "lark-pockets",
    title: "Two Pockets",
    say: "Nib has two pockets. One hums mmm. One is for apples. Help him sort, then make am.",
    skill: "Letter sounds",
    play: "pockets"
  },
  ant: {
    gameId: "lark-ant",
    title: "Apple or Moon",
    say: "Lark is holding two pictures. Find the one that starts like apple, then make am.",
    skill: "Letter sounds",
    play: "ant"
  },
  "i-am": {
    gameId: "lark-i-am",
    title: "I Am",
    say: "Help Nib write am in the journal. a like apple, then mmm.",
    skill: "Letter sounds",
    play: "i-am"
  },
  folio: {
    gameId: "lark-folio",
    title: "Map or Mat",
    say: "The map and the mat look alike. Listen to the last sound and pick the cover. Pad is there too.",
    skill: "Word recognition",
    play: "folio"
  },
  strap: {
    gameId: "lark-strap",
    title: "Pad the Strap",
    say: "The strap is stuck. Find d, build pad, and tuck the pad under the strap.",
    skill: "Word recognition",
    play: "strap"
  }
};

const HANDS = {
  "apple-catcher": {
    title: "Apple catcher line",
    say: "Tell someone, I am an apple catcher. Then tap I did it."
  },
  "lark-i-am": {
    title: "Say am",
    say: "Say am. Then point to yourself and say, I am. Then tap I did it."
  },
  "lark-pockets": {
    title: "Two cups",
    say: "Set out two cups. Hum mmm and put in something like a mitten or a mirror. Say the apple sound and put in an apple. Then tap I did it."
  },
  "lark-ant": {
    title: "Apple or mmm",
    say: "Hold up an apple and something that hums mmm. Ask which one starts like apple. Then tap I did it."
  },
  "bag-at-the-door": {
    title: "Three invitations",
    say: "Fold three little papers into invitations and put them in a bag. Then tap I did it."
  },
  "lark-strap": {
    title: "A little pad",
    say: "Fold a small paper pad and slip it under a strap or a handle. Say pad. Then tap I did it."
  },
  "lark-folio": {
    title: "Map or mat",
    say: "Ask a grown-up to write map and mat. Pick up the word they say. Then tap I did it."
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

function playCard(date, kidId, play, scene) {
  const spec = PLAYS[play];
  const sceneQuery = scene ? `&scene=${encodeURIComponent(scene)}` : "";
  return {
    id: `${date}:game:${spec.gameId}`,
    kind: "game",
    part: "ela",
    gameId: spec.gameId,
    title: spec.title,
    href: `../lark-play/?kid=${encodeURIComponent(kidId)}&play=${spec.play}${sceneQuery}`,
    say: spec.say,
    goal: "Finish, then come back",
    skill: spec.skill
  };
}

function iamScene(storyIndex) {
  return ["apple", "mouse", "bird"][Math.floor(storyIndex / 2) % 3];
}

function cardFor(kidId, date, kind, index) {
  if (kidId === "connor" && kind === "story") {
    const play = CONNOR_STORY[index % CONNOR_STORY.length];
    if (play === "apple-catcher") return appleCatcherCard(date, kidId);
    return playCard(date, kidId, "i-am", iamScene(index));
  }
  if (kidId === "connor") return playCard(date, kidId, CONNOR_PRACTICE[index % CONNOR_PRACTICE.length]);
  if (kidId === "gabi" && kind === "story") {
    const play = GABI_STORY[index % GABI_STORY.length];
    if (play === "bag-at-the-door") return bagAtDoorCard(date, kidId);
    return playCard(date, kidId, "strap");
  }
  if (kidId === "gabi") return playCard(date, kidId, GABI_PRACTICE[index % GABI_PRACTICE.length]);
  return null;
}

export function larkAssignment(kidId, date) {
  if (kidId !== "connor" && kidId !== "gabi") return null;
  const kind = role(date);
  if (!kind) return null;
  const card = cardFor(kidId, date, kind, roleIndex(date, kind));
  if (!card) return null;
  return { card, handsOn: HANDS[card.gameId] || null };
}
