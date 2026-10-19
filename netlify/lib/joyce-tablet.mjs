// Help a child asks for from the Android overlay: one screenshot, a point or circle,
// an optional spoken question. Joyce hints and never gives the answer. The moment
// is saved as an observation Friday's report already reads.

import { timingSafeEqual } from "node:crypto";
import { chatVisionJSON } from "./ai.mjs";
import { KIDS, kidById } from "./kids.mjs";

const MAX_IMAGE = 1_800_000;
const MAX_AUDIO = 2_000_000;
const HINT_LIMIT = 2;

const SETUP = "A grown-up still needs to finish Joyce's setup on the website.";
const KEY_NO = "That key didn't work. A grown-up can fix it in the Joyce app.";
const GROWNUP = "Ask a grown-up to sit with you for this one.";

const FALLBACK = {
  word: "Look at the part you marked. Say the first sound, then the next one.",
  math: "Look at the numbers you marked. Try the first small step.",
  other: "Look at the part you marked and tell me what you notice."
};

const HINT_SYSTEM = `You help a young child who is stuck on a tablet app during homeschool. You are Joyce, a warm teacher. You never give the answer.

They marked one spot on the screen (a red circle or oval on the first image). The second image is a close-up of that spot, without the red mark.

Rules for "say":
- One or two short sentences they can hear out loud. One sentence for age 3 or 4.
- Hint at the next step only: a sound to try, which part to look at, or one thing to count.
- Do not say the word they are stuck on, do not name the correct letter if that is the whole task, and do not say the number that belongs in the blank.
- Do not tell them which button to tap as the correct choice.
- If the close-up is unreadable, ask them to point closer. Do not guess a specific answer.
- Start with their name once.

Rules for "saw": a short noun phrase a parent can read later, starting with "the" or "a", naming the word, letter, or problem if you can see it. This is for the parent, not spoken to the child. Include the app name only if it is visible.
Rules for "answer": the withheld answer in a few words, or "" if there isn't one. Used only to check that "say" did not leak it. Never shown to the child.
Rules for "kind": "word", "math", or "other".

Reply with JSON only: {"saw":"", "say":"", "answer":"", "kind":"word|math|other"}`;

const clip = (value, n) => String(value || "").trim().slice(0, n);

function keysMatch(given, expected) {
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function checkKey(headerValue, env) {
  const expected = env.JOYCE_TABLET_KEY || "";
  if (!expected) return { ok: false, status: 503, error: SETUP, detail: "JOYCE_TABLET_KEY is not set on the site." };
  const got = String(headerValue || "").replace(/^Bearer\s+/i, "").trim();
  if (!keysMatch(got, expected)) return { ok: false, status: 401, error: KEY_NO, detail: KEY_NO };
  return { ok: true };
}

function cleanB64(value, maxChars) {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!trimmed || trimmed.length > maxChars) return "";
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return "";
  return trimmed;
}

function leaked(say, answer) {
  const secret = clip(answer, 48);
  if (!secret) return false;
  const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Za-z0-9])${escaped}(?:[^A-Za-z0-9]|$)`, "i").test(say);
}

function spokenHint(raw, answer, kind) {
  const say = clip(raw, 320);
  const fallback = FALLBACK[kind] || FALLBACK.other;
  if (!say || leaked(say, answer)) return fallback;
  return say;
}

export function helpNote({ name, saw, question, hints, outcome }) {
  const target = clip(saw, 300) || "something on the screen";
  const asked = clip(question, 300) ? ` and asked "${clip(question, 300)}"` : "";
  const list = (hints || []).map((h) => clip(h, 400)).filter(Boolean);
  let hint = "";
  if (list.length === 1) hint = ` Joyce hinted, without giving the answer: "${list[0]}"`;
  if (list.length > 1) hint = ` Joyce hinted, without giving the answer: ${list.map((h, i) => `${i + 1}) "${h}"`).join(" ")}`;
  const ending = {
    "got-it": " The child tapped that they got it.",
    "still-stuck": " The child was still stuck.",
    left: " The child went back to the app before saying whether they got it."
  }[outcome] || " The child had not yet tapped whether they got it.";
  return `On the tablet, ${name} pointed at ${target}${asked}.${hint}${ending}`;
}

function fail(status, error, detail = error) {
  return { status, body: { error, detail } };
}

async function transcribe({ audioBase64, audioType, env, fetchImpl }) {
  let bytes;
  try {
    bytes = Buffer.from(audioBase64, "base64");
  } catch {
    return "";
  }
  if (!bytes.length) return "";
  const type = clip(audioType, 40) || "audio/mp4";
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), type.includes("mp4") || type.includes("m4a") ? "question.m4a" : "question.webm");
  form.append("model", env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
  form.append("language", "en");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetchImpl("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form
    });
    if (!res.ok) return "";
    const data = await res.json();
    return clip(data.text, 300);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function recordOf({ id, t, kid, saw, question, hints, outcome }) {
  const name = kidById(kid).name;
  return {
    id,
    t,
    kids: [kid],
    from: "tablet",
    kind: "tablet-help",
    saw,
    question,
    hints,
    outcome: outcome || null,
    text: helpNote({ name, saw, question, hints, outcome })
  };
}

async function loadPointer(store, sessionId) {
  return store.get(`tablet-sessions/${sessionId}`, { type: "json" });
}

export async function handleTabletRequest({ store, env = process.env, fetchImpl = fetch, body }) {
  if (!env.OPENAI_API_KEY) return fail(503, SETUP, "OPENAI_API_KEY is not set on the site.");
  const action = body?.action === "outcome" ? "outcome" : "help";
  const sessionId = clip(body?.sessionId, 80);
  if (sessionId && !/^[A-Za-z0-9-]{8,80}$/.test(sessionId)) return fail(400, "Joyce couldn't save that. Try again.");

  if (action === "outcome") return recordOutcome({ store, sessionId, outcome: body?.outcome });

  const kid = kidById(clip(body?.kid, 32));
  if (!kid) return fail(400, "A grown-up needs to pick whose tablet this is.");
  const image = cleanB64(body?.imageBase64, MAX_IMAGE);
  const crop = cleanB64(body?.cropBase64, MAX_IMAGE);
  if (!image) return fail(400, "Joyce couldn't see the screen. Try again.");

  const followUp = Boolean(body?.followUp);
  let pointer = null;
  if (followUp) {
    if (!sessionId) return fail(400, "Joyce couldn't save that. Try again.");
    pointer = await loadPointer(store, sessionId);
    if (!pointer || pointer.kid !== kid.id) return fail(404, "Joyce couldn't find that question. Point again.");
    if ((pointer.hints || []).length >= HINT_LIMIT) {
      await writeSession(store, { ...pointer, outcome: "still-stuck" });
      return { status: 200, body: { say: GROWNUP, sessionId, hintsUsed: HINT_LIMIT, done: true, saved: true } };
    }
  }

  let question = clip(body?.question, 300);
  const audio = cleanB64(body?.audioBase64, MAX_AUDIO);
  if (!question && audio) {
    question = await transcribe({ audioBase64: audio, audioType: body?.audioType, env, fetchImpl });
  }

  const earlier = pointer?.hints || [];
  const userText = [
    `Child: ${kid.name}, age ${kid.age}.`,
    kid.where ? `Where they are: ${kid.where}` : "",
    kid.note ? `Note: ${kid.note}` : "",
    question ? `What they said: "${question}"` : "What they said: (they didn't say anything; they only pointed)",
    `This is hint ${earlier.length + 1} of ${HINT_LIMIT}.`,
    earlier.length ? `You already told them: ${earlier.map((h) => `"${h}"`).join(" ")} Give a different hint.` : ""
  ].filter(Boolean).join("\n");

  let saw = pointer?.saw || "";
  let say = FALLBACK.other;
  try {
    const out = await chatVisionJSON({
      env,
      fetchImpl,
      timeoutMs: 14000,
      temperature: 0.3,
      system: HINT_SYSTEM,
      text: userText,
      images: [
        { base64: image, detail: "low" },
        crop ? { base64: crop, detail: "high" } : null
      ].filter(Boolean)
    });
    const kind = ["word", "math", "other"].includes(out.kind) ? out.kind : "other";
    if (!saw) saw = clip(out.saw, 300) || "something on the screen";
    say = spokenHint(out.say, out.answer, kind);
  } catch {
    say = "Joyce couldn't see that clearly. Point a little closer and try again.";
    if (!saw) saw = "something on the screen";
  }

  const hints = [...earlier, say];
  const id = pointer?.id || sessionId || crypto.randomUUID();
  const t = pointer?.t || new Date().toISOString();
  const now = Date.now();
  const day = t.slice(0, 10);
  const obsKey = pointer?.obsKey || `observations/${day}/${now}-tablet-${id}`;
  const next = { id, t, kid: kid.id, saw, question: question || pointer?.question || "", hints, outcome: null, obsKey };
  let saved = true;
  try {
    await writeSession(store, next);
  } catch {
    saved = false;
  }
  return {
    status: 200,
    body: { say, sessionId: id, hintsUsed: hints.length, done: false, saved }
  };
}

async function writeSession(store, session) {
  const record = recordOf(session);
  await store.setJSON(session.obsKey, record);
  await store.setJSON(`tablet-sessions/${session.id}`, session);
}

async function recordOutcome({ store, sessionId, outcome }) {
  if (!sessionId) return fail(400, "Joyce couldn't save that. Try again.");
  if (!["got-it", "still-stuck", "left"].includes(outcome)) return fail(400, "Joyce couldn't save that. Try again.");
  const pointer = await loadPointer(store, sessionId);
  if (!pointer) return fail(404, "Joyce couldn't find that question.");
  try {
    await writeSession(store, { ...pointer, outcome });
  } catch {
    return fail(502, "Joyce couldn't save that. Try again.");
  }
  const say = outcome === "got-it" ? `${kidById(pointer.kid).name}, you did it.` : outcome === "still-stuck" ? GROWNUP : "";
  return { status: 200, body: { ok: true, say, sessionId, done: true, saved: true } };
}

export { KIDS };
