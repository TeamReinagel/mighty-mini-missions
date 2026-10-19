// Help a child asks for from the Android overlay: one screenshot, a point or circle,
// an optional spoken question. Joyce hints about the marked spot, then says the
// answer. The spoken line is also returned as natural speech. The moment is saved
// as an observation Friday's report already reads.

import { timingSafeEqual } from "node:crypto";
import { chatVisionJSON } from "./ai.mjs";
import { KIDS, kidById } from "./kids.mjs";

const MAX_IMAGE = 1_800_000;
const MAX_AUDIO = 2_000_000;
const HINT_LIMIT = 2;

const SETUP = "A grown-up still needs to finish Joyce's setup on the website.";
const KEY_NO = "That key didn't work. A grown-up can fix it in the Joyce app.";
const FALLBACK = {
  word: "Look at the whole word you marked. Do you know a part of it?",
  math: "Look at the numbers you marked. Try the first small step.",
  other: "Look at the part you marked and tell me what you notice."
};

export const HINT_SYSTEM = `You help a young child who is stuck on a tablet app during homeschool. You are Joyce, a warm teacher sitting beside them. This is a conversation. On this turn you say one teaching move, then wait for their answer. You do not give the whole answer yet.

They marked one spot on the screen (a red circle or oval on the first image). The second image is a close-up of that spot, without the red mark.

Rules for "say":
- One or two short sentences they can hear out loud. One sentence for age 3 or 4. Start with their name once, then stop using it every turn.
- Respond to what they just said. If they got a piece right, say yes and ask the next piece. If they guessed wrong, correct that piece kindly.
- Use a pattern that is actually in this exact word. Read the letters in the close-up. The answer is those letters, not a different word.
  - A letter with more than one sound: say how many, and which sound this word uses. "A can say 3 sounds. In this one it says /ah/."
  - A silent e only when this word really ends in a silent e: "That e at the end is silent. What does it do to the vowel in the word?"
  - Two letters that make one sound, such as sh, ch, or th: name those letters and the sound, then ask about the rest.
- Do not mention a silent letter unless that letter is silent in this word.
- Never ask a question that could fit any word. Do not say "what sounds do you hear", "sound it out", or "look at the beginning and the middle".
- Sight words and irregular words, including a word they called a sight word: do not use phonics that are not in the word. Notice a part they can see.
- Do not say the whole answer word yet, and do not say the number that belongs in the blank.
- Never say a sample word from these instructions unless those exact letters are in the close-up.
- Do not tell them which button to tap as the correct choice.
- Do not repeat a hint you already gave.
- If the close-up is unreadable, ask them to point closer. Do not guess a specific answer.

Rules for "saw": a short noun phrase a parent can read later, starting with "the" or "a", naming the word, letter, or problem if you can see it. This is for the parent, not spoken to the child. Include the app name only if it is visible.
Rules for "answer": the real answer in a few words (the sight word, the letter, or the number). Used so a later turn can say it, and to check that this turn did not leak it. Never shown to the child on this turn.
Rules for "kind": "word", "math", or "other".

Reply with JSON only: {"saw":"", "say":"", "answer":"", "kind":"word|math|other"}`;

export const REVEAL_SYSTEM = `You help a young child who is stuck on a tablet app during homeschool. You are Joyce, a warm teacher. You have been talking this through together. Now bring them to the answer in the same conversation.

They marked one spot on the screen (a red circle or oval on the first image). The second image is a close-up of that spot, without the red mark.

Rules for "say":
- One or two short sentences. Respond to what they just said, then say the answer that is in the picture.
- Say the actual answer. Do not ask another question. Do not tell them to sound it out or to get a grown-up.
- Do not name any word except the one in the close-up. Do not invent a silent letter on the way to the answer.
- If you truly cannot see an answer, ask them to point closer.

Rules for "saw": a short noun phrase a parent can read later, naming the word, letter, or problem.
Rules for "answer": the same answer you spoke, in a few words.
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

const GENERIC_HINT = /what sounds? do you hear|sound (it|this|the word) out|beginning\/middle|at the beginning|in the middle|say the first sound/i;

function wordOf(answer) {
  return (clip(answer, 48).toLowerCase().match(/[a-z]+/) || [""])[0];
}

function magicE(word) {
  return word.length >= 4 && /[aeiou][^aeiou]+e$/.test(word) && !/(ee|le)$/.test(word);
}

function allowsSilent(word) {
  if (!word) return false;
  if (magicE(word)) return true;
  if (/^(kn|wr|gn)/.test(word)) return true;
  if (/(?:mb|mn|gn)$/.test(word)) return true;
  if (/gh/.test(word)) return true;
  return false;
}

const DIGRAPHS = [
  ["sh", "s and h", "/sh/"],
  ["ch", "c and h", "/ch/"],
  ["th", "t and h", "/th/"],
  ["wh", "w and h", "/w/"],
  ["ck", "c and k", "/k/"],
  ["ph", "p and h", "/f/"]
];

function hintFits(say, answer, kind) {
  const word = wordOf(answer);
  if (!say || leaked(say, answer) || GENERIC_HINT.test(say)) return false;
  if (kind !== "word" || !word) return true;
  if (/silent/i.test(say) && !allowsSilent(word)) return false;
  const named = say.match(/\b(?:word|answer) is\s+([a-z]+)/i);
  if (named && named[1].toLowerCase() !== word) return false;
  const letters = [...say.matchAll(/\bletter(?:\s+is)?(?:\s+the)?\s+([a-z])\b/gi)].map((match) => match[1].toLowerCase());
  return letters.every((letter) => word.includes(letter));
}

function concreteHint(answer, kind, name, earlier = []) {
  const word = wordOf(answer);
  const said = earlier.join(" ").toLowerCase();
  if (kind === "word" && magicE(word) && !/silent/.test(said)) {
    const vowel = word.match(/[aeiou]/)[0];
    return `${name}, that e at the end is silent. What does it do to the ${vowel}?`;
  }
  const digraph = kind === "word" ? DIGRAPHS.find(([letters]) => word.includes(letters)) : null;
  if (digraph && !said.includes(digraph[2])) {
    const rest = word.replace(digraph[0], "");
    if (rest.length === 1) return `${name}, ${digraph[1]} together say ${digraph[2]}. What does the ${rest} say?`;
    return `${name}, ${digraph[1]} together say ${digraph[2]}. What does the rest of the word say?`;
  }
  if (digraph) {
    const rest = word.replace(digraph[0], "");
    if (rest.length === 1) return `${name}, the ${rest} says its name. Put that with ${digraph[2]}.`;
  }
  const first = word[0];
  if (kind === "word" && first) {
    return `${name}, the word you marked starts with the letter ${first}.`;
  }
  if (kind === "math") return `${name}, look at the numbers you marked and try the first small step.`;
  return FALLBACK[kind] || FALLBACK.other;
}

function childSaidIt(said, answer) {
  return Boolean(clip(answer, 48)) && leaked(said, answer);
}

function agreeLine(name, answer, kind) {
  if (kind === "math") return `${name}, yes. The answer is ${answer}.`;
  return `${name}, yes. The word is ${answer}.`;
}

function spokenHint(raw, answer, kind, name, earlier = []) {
  const say = clip(raw, 320);
  if (hintFits(say, answer, kind)) return say;
  return concreteHint(answer, kind, name, earlier);
}

function revealLine(raw, answer, kind, name) {
  const secret = clip(answer, 48);
  const word = wordOf(secret);
  const spoken = clip(raw, 320);
  const named = spoken.match(/\b(?:word|answer) is\s+([a-z]+)/i);
  const wrongWord = Boolean(word && named && named[1].toLowerCase() !== word);
  const falseSilent = Boolean(word && /silent/i.test(spoken) && !allowsSilent(word));
  if (!wrongWord && !falseSilent && secret && spoken && spoken.toLowerCase().includes(secret.toLowerCase())) return spoken;
  if (secret) {
    if (kind === "math") return `${name}, the answer is ${secret}.`;
    if (kind === "word") return `${name}, the word is ${secret}.`;
    return `${name}, it is ${secret}.`;
  }
  return spoken || `${name}, point a little closer to the word.`;
}

async function speakAudio(text, env, fetchImpl) {
  const line = clip(text, 320);
  if (!line || !env.OPENAI_API_KEY) return "";
  const voice = env.JOYCE_TABLET_VOICE || "coral";
  const attempts = [
    {
      model: env.JOYCE_TTS_MODEL || "gpt-4o-mini-tts",
      voice,
      instructions: "You are Joyce, a warm playful teacher sitting beside a young child. Sound like a real person, kind and unhurried. Clear words. No announcer voice and no robot voice."
    },
    { model: "tts-1-hd", voice: "shimmer" }
  ];
  for (const attempt of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetchImpl("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: attempt.model,
          voice: attempt.voice,
          input: line,
          response_format: "mp3",
          ...(attempt.instructions ? { instructions: attempt.instructions } : {})
        })
      });
      if (!res.ok || typeof res.arrayBuffer !== "function") continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 20 || bytes.length > 800_000) continue;
      return bytes.toString("base64");
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return "";
}

export function helpNote({ name, saw, question, hints, outcome, revealed }) {
  const target = clip(saw, 300) || "something on the screen";
  const asked = clip(question, 300) ? ` and asked "${clip(question, 300)}"` : "";
  const list = (hints || []).map((h) => clip(h, 400)).filter(Boolean);
  let hint = "";
  if (revealed && list.length) {
    const answer = list[list.length - 1];
    const earlier = list.slice(0, -1);
    const hintsText = earlier.length
      ? ` Joyce hinted: ${earlier.map((h, i) => `${i + 1}) "${h}"`).join(" ")}`
      : "";
    hint = `${hintsText} Joyce then gave the answer: "${answer}"`;
  } else if (list.length === 1) {
    hint = ` Joyce hinted, without giving the answer: "${list[0]}"`;
  } else if (list.length > 1) {
    hint = ` Joyce hinted, without giving the answer: ${list.map((h, i) => `${i + 1}) "${h}"`).join(" ")}`;
  }
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

function recordOf({ id, t, kid, saw, question, hints, outcome, revealed }) {
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
    revealed: Boolean(revealed),
    outcome: outcome || null,
    text: helpNote({ name, saw, question, hints, outcome, revealed })
  };
}

async function agreeAnswer({ store, env, fetchImpl, pointer, kid, question }) {
  const say = agreeLine(kid.name, pointer.answer, pointer.kind || "word");
  const hints = [...(pointer.hints || []), say];
  const next = { ...pointer, question: question || pointer.question || "", hints, revealed: true, outcome: null };
  let saved = true;
  try {
    await writeSession(store, next);
  } catch {
    saved = false;
  }
  const audioBase64 = await speakAudio(say, env, fetchImpl);
  return {
    status: 200,
    body: { say, question, sessionId: pointer.id, hintsUsed: hints.length, done: false, revealed: true, saved, audioBase64 }
  };
}

async function revealAnswer({ store, env, fetchImpl, pointer, kid, image, crop, question }) {
  const asked = question || pointer.question || "";
  const earlier = pointer.hints || [];
  const userText = [
    `Child: ${kid.name}, age ${kid.age}.`,
    asked ? `They just said: "${asked}"` : "They just said: (nothing this turn)",
    pointer.saw ? `What they pointed at: ${pointer.saw}` : "",
    earlier.length ? `The conversation so far, from you: ${earlier.map((h) => `"${h}"`).join(" ")}` : "",
    pointer.answer ? `The answer in the picture is "${pointer.answer}". Say that. Do not name any other word.` : "Answer them, then say the word or the number."
  ].filter(Boolean).join("\n");
  let saw = pointer.saw || "";
  let say = `${kid.name}, point a little closer to the word.`;
  const answer = clip(pointer.answer, 48);
  try {
    const out = await chatVisionJSON({
      env,
      fetchImpl,
      timeoutMs: 14000,
      temperature: 0.2,
      system: REVEAL_SYSTEM,
      text: userText,
      images: [
        { base64: image, detail: "low" },
        crop ? { base64: crop, detail: "high" } : null
      ].filter(Boolean)
    });
    const kind = pointer.kind || (["word", "math", "other"].includes(out.kind) ? out.kind : "other");
    if (!saw) saw = clip(out.saw, 300) || "something on the screen";
    say = revealLine(out.say, answer || out.answer, kind, kid.name);
  } catch {
    say = `${kid.name}, point a little closer to the word.`;
  }
  const hints = [...earlier, say];
  const next = {
    ...pointer,
    saw,
    question: asked,
    hints,
    revealed: true,
    outcome: null
  };
  let saved = true;
  try {
    await writeSession(store, next);
  } catch {
    saved = false;
  }
  const audioBase64 = await speakAudio(say, env, fetchImpl);
  return {
    status: 200,
    body: { say, question: asked, sessionId: pointer.id, hintsUsed: hints.length, done: false, revealed: true, saved, audioBase64 }
  };
}

async function loadPointer(store, sessionId) {
  return store.get(`tablet-sessions/${sessionId}`, { type: "json" });
}

export async function handleTabletRequest({ store, env = process.env, fetchImpl = fetch, body }) {
  if (!env.OPENAI_API_KEY) return fail(503, SETUP, "OPENAI_API_KEY is not set on the site.");
  const action = body?.action === "outcome" || body?.action === "speak" ? body.action : "help";
  const sessionId = clip(body?.sessionId, 80);
  if (sessionId && !/^[A-Za-z0-9-]{8,80}$/.test(sessionId)) return fail(400, "Joyce couldn't save that. Try again.");

  if (action === "outcome") return recordOutcome({ store, sessionId, outcome: body?.outcome });
  if (action === "speak") {
    const text = clip(body?.text, 320);
    if (!text) return fail(400, "Joyce couldn't say that.");
    const audioBase64 = await speakAudio(text, env, fetchImpl);
    return { status: 200, body: { say: text, audioBase64 } };
  }

  const kid = kidById(clip(body?.kid, 32));
  if (!kid) return fail(400, "A grown-up needs to pick whose tablet this is.");
  const image = cleanB64(body?.imageBase64, MAX_IMAGE);
  const crop = cleanB64(body?.cropBase64, MAX_IMAGE);
  if (!image) return fail(400, "Joyce couldn't see the screen. Try again.");

  let question = clip(body?.question, 300);
  const audio = cleanB64(body?.audioBase64, MAX_AUDIO);
  if (!question && audio) {
    question = await transcribe({ audioBase64: audio, audioType: body?.audioType, env, fetchImpl });
  }

  const followUp = Boolean(body?.followUp);
  let pointer = null;
  if (followUp) {
    if (!sessionId) return fail(400, "Joyce couldn't save that. Try again.");
    pointer = await loadPointer(store, sessionId);
    if (!pointer || pointer.kid !== kid.id) return fail(404, "Joyce couldn't find that question. Point again.");
    if (pointer.revealed) {
      const last = (pointer.hints || []).slice(-1)[0] || `${kid.name}, point a little closer to the word.`;
      const audioBase64 = await speakAudio(last, env, fetchImpl);
      return { status: 200, body: { say: last, question, sessionId, hintsUsed: (pointer.hints || []).length, done: false, revealed: true, saved: true, audioBase64 } };
    }
    if (childSaidIt(question, pointer.answer)) {
      return agreeAnswer({ store, env, fetchImpl, pointer, kid, question });
    }
    if ((pointer.hints || []).length >= HINT_LIMIT) {
      return revealAnswer({ store, env, fetchImpl, pointer, kid, image, crop, question });
    }
  }

  const earlier = pointer?.hints || [];
  const userText = [
    `Child: ${kid.name}, age ${kid.age}.`,
    kid.where ? `Where they are: ${kid.where}` : "",
    kid.note ? `Note: ${kid.note}` : "",
    question ? `They just said: "${question}"` : "They just said: (nothing yet; they only pointed)",
    pointer?.answer ? `The marked answer is "${pointer.answer}". Teach only that. Do not name a different word.` : "",
    `This is turn ${earlier.length + 1} of the conversation. Respond to what they just said. One pattern that is really in this word, then a question. Do not say the whole answer yet.`,
    /sight word/i.test(question) ? "They called this a sight word. Do not use phonics that are not in the word." : "",
    earlier.length ? `You already said: ${earlier.map((h) => `"${h}"`).join(" ")} Continue from their answer. Do not repeat yourself.` : ""
  ].filter(Boolean).join("\n");

  let saw = pointer?.saw || "";
  let answer = pointer?.answer || "";
  let savedKind = pointer?.kind || "word";
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
    const seen = clip(out.answer, 48);
    if (pointer?.answer && wordOf(pointer.answer)) answer = pointer.answer;
    else if (seen) answer = seen;
    say = spokenHint(out.say, answer, kind, kid.name, earlier);
    savedKind = pointer?.kind || kind;
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
  const next = { id, t, kid: kid.id, saw, answer, kind: savedKind, question: question || pointer?.question || "", hints, outcome: null, obsKey };
  let saved = true;
  try {
    await writeSession(store, next);
  } catch {
    saved = false;
  }
  const audioBase64 = await speakAudio(say, env, fetchImpl);
  return {
    status: 200,
    body: { say, question, sessionId: id, hintsUsed: hints.length, done: false, saved, audioBase64 }
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
  const say = outcome === "got-it" ? `${kidById(pointer.kid).name}, you did it.` : "";
  return { status: 200, body: { ok: true, say, sessionId, done: true, saved: true } };
}

export { KIDS };
