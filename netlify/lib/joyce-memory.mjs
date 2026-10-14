import { randomUUID } from "node:crypto";
import { KIDS } from "./kids.mjs";

// What Joyce has learned, kept in one Blobs document so it is easy to read, back up, or reset.
//   lessons       corrections and preferences Stephanie approved
//   skills        prompt-defined abilities (built-in or approved); each reads only the data sources below
//   proposals     things Joyce asked to adopt, with their Approve / Not now outcome
//   codeRequests  approved code changes handed to a Cursor cloud agent, until their PR is posted
const MEMORY_KEY = "joyce/memory.json";
const MAX_LESSONS = 60;
const PROPOSAL_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

/** What a skill may read. Skills can't fetch anything else, write anything, or run code. */
export const DATA_SOURCES = {
  profiles: "each child's age, where they are, and notes",
  progress: "game practice since the last report: skills, accuracy, newly mastered, tricky items, missions done",
  activity: "day-by-day game practice for the last 7 days (which games and skills, tries, first-try accuracy) and when each child last played",
  observations: "things the family noticed at home since the last report",
  milestones: "how many milestones each child has met and their next unmet milestones from the monthly spreadsheet",
  lastReport: "the text of the last weekly report"
};

export const SCHEDULES = {
  "on-request": "when someone asks",
  "weekday-morning": "every weekday morning",
  friday: "Fridays, right after the weekly report"
};

export const BUILTIN_SKILLS = [
  {
    id: "today",
    name: "Activity for today",
    when: "Someone asks what to do today, for an activity or lesson idea, or what to work on with one or more of the kids.",
    instructions: [
      "Suggest one activity for today for each child asked about (every child with a milestone guide when no one is named).",
      "Ground each one in where the child is right now: a next-up milestone, something tricky in recent game practice, or a recent observation, and say which in a few words.",
      "Keep each one 5-20 minutes, playful, and hands-on with things a family has at home; prefer off-screen. When a Mighty Mini Missions game fits, you may mention it as an optional follow-up.",
      "Format per child: *Name*: the activity in one or two sentences, then a line starting with _Why:_. No greeting or preamble."
    ].join(" "),
    data: ["profiles", "progress", "activity", "observations", "milestones"],
    schedule: "on-request",
    builtin: true
  },
  {
    id: "recap",
    name: "What they practiced",
    when: "Someone asks what the kids did, worked on, practiced, or played (today, yesterday, this week), how a child is doing in the games, or whether they used Mighty Mini Missions. This looks back; it never suggests activities.",
    instructions: [
      "Answer the question about what already happened, using only the activity and observations data. Do not suggest activities or next steps unless asked.",
      "For the day or period asked about (today if not said), for each child asked about (all children if no one is named): say whether they played, which games and skills, roughly how many tries, and how it went (first-try right, and any item that was tricky). Mention observations from that period too.",
      "If a child didn't play in that period, say so plainly in one line, with when they last played. No judgment.",
      "If nobody played, say that in one or two lines, and add that tablets sync when they're online, so play on an offline tablet shows up later.",
      "Format: one short paragraph or a few bullets per child, *Name* first. No greeting."
    ].join(" "),
    data: ["activity", "observations"],
    schedule: "on-request",
    builtin: true
  }
];

const empty = () => ({ lessons: [], skills: [], proposals: {}, codeRequests: [] });

export async function loadMemory(store) {
  const mem = { ...empty(), ...((await store.get(MEMORY_KEY, { type: "json" })) || {}) };
  // Built-ins nobody has changed track the latest version in code; approved changes drop the builtin flag.
  mem.skills = mem.skills.map((s) => (s.builtin && BUILTIN_SKILLS.find((b) => b.id === s.id)) || s);
  for (const builtin of BUILTIN_SKILLS) {
    if (!mem.skills.some((s) => s.id === builtin.id)) mem.skills.push({ ...builtin });
  }
  return mem;
}

export async function saveMemory(store, mem) {
  const cutoff = Date.now() - PROPOSAL_DAYS * DAY_MS;
  for (const [id, p] of Object.entries(mem.proposals)) {
    if (p.status !== "pending" && Date.parse(p.decidedAt || p.createdAt) < cutoff) delete mem.proposals[id];
  }
  mem.lessons = mem.lessons.slice(-MAX_LESSONS);
  await store.setJSON(MEMORY_KEY, mem);
}

export const newId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`;

const kidNames = (ids = []) => ids.map((id) => KIDS.find((k) => k.id === id)?.name).filter(Boolean);

/** Approved lessons as prompt text, or "" when there are none. */
export function lessonsText(mem) {
  if (!mem.lessons.length) return "";
  const lines = mem.lessons.map((l) => {
    const who = kidNames(l.kids);
    return `- ${who.length ? `(${who.join(", ")}) ` : ""}${l.text}`;
  });
  return `Lessons Stephanie has taught you (always follow these; they override your defaults):\n${lines.join("\n")}`;
}

/** Make an AI-proposed skill safe to store: known data sources and schedule, trimmed text. */
export function cleanSkill(raw, existing = []) {
  const name = String(raw?.name || "").trim().slice(0, 60);
  const instructions = String(raw?.instructions || "").trim().slice(0, 2000);
  if (!name || !instructions) return null;
  const replaces = existing.find((s) => s.id === raw.replaces);
  const data = (Array.isArray(raw.data) ? raw.data : []).filter((d) => d in DATA_SOURCES);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "skill";
  return {
    id: replaces ? replaces.id : existing.some((s) => s.id === slug) ? newId(slug) : slug,
    name,
    when: String(raw.when || "").trim().slice(0, 400),
    instructions,
    data: data.length ? [...new Set(data)] : Object.keys(DATA_SOURCES),
    schedule: raw.schedule in SCHEDULES ? raw.schedule : "on-request",
    replaces: replaces?.id
  };
}

// ---------------------------------------------------------------- conversation log (for weekly reflection)

export async function logTurn(store, entry) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  await store.setJSON(`joyce/log/${day}/${now}-${randomUUID().slice(0, 8)}`, { t: new Date(now).toISOString(), ...entry });
}

export async function loadLog(store, days, now = Date.now()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    const { blobs } = await store.list({ prefix: `joyce/log/${day}/` });
    for (const { key } of blobs) {
      const entry = await store.get(key, { type: "json" });
      if (entry) out.push(entry);
    }
  }
  return out.sort((a, b) => String(a.t).localeCompare(String(b.t)));
}
