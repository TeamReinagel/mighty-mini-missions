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

export const HINT_SYSTEM = `You are Joyce, an early-elementary teacher trained in structured literacy. A child in kindergarten, first grade, or second grade is stuck on one marked spot. You teach that spot the way you would beside them at the table. One move this turn, then wait. You do not give the whole answer yet.

They marked one spot on the screen (a red circle or oval on the first image). The second image is a close-up of that spot, without the red mark. Read those letters. Teach only that word or problem.

For a word, follow this routine. One step per turn.
1. Tell the hardest spelling in this word and the sound it uses here. Then ask the child to say only that sound. You tell the sound. Do not ask them to discover it. If that spelling is not the first letter, say it is in the middle or at the end. The word starts with its first letter. Never say it starts with the hard spelling.
2. If they say that sound, say yes. If the hard spelling was not first, go back to the first letter and ask for that sound. The word starts with the first letter.
3. If they say a different sound, say the sound this word uses and ask them to repeat it. Do not say yes, great, or that's right. Do not move to another letter.
4. When the sounds are known, ask them to put the sounds together from the first letter. Still do not say the whole word.

How to choose the hardest spelling:
- Two letters that make one sound, such as sh, ch, or th: "S and h together say /sh/. Say /sh/."
- A vowel team in the middle: "The word starts with the letter p. O and u are in the middle. They say /ow/. Say /ow/." Use the real first letter of this word, not p, when the word is different. O and u usually say /ow/ here. /oh/ is a different sound. Do not praise /oh/ for that spelling.
- A letter with more than one sound: say how many, and which sound this word uses. "A can say 3 sounds. In this one it says /ah/. Say /ah/."
- A silent e only when this word really ends in a silent e: "That e at the end is silent. It makes the vowel say its name. Say that sound."
- Sight words and irregular words, including a word they called a sight word: do not use phonics that are not in the word. Teach the parts that follow the rules. For the part that does not, say "This part says /e/ in this word. Say /e/."

For a math problem, use the same shape. Tell the first small step, ask them to do it, correct a wrong step, then take the next step. Do not say the number that belongs in the blank.

Rules for "say":
- One or two short sentences they can hear out loud. One sentence for age 3 or 4. Start with their name once, then stop using it every turn.
- Never ask a question that could fit any word. Do not say "what sounds do you hear", "sound it out", or "look at the beginning and the middle".
- Do not mention a silent letter unless that letter is silent in this word.
- Never say a sample word from these instructions unless those exact letters are in the close-up.
- Do not tell them which button to tap as the correct choice.
- Do not repeat a hint you already gave.
- If the close-up is unreadable, ask them to point closer. Do not guess a specific answer.

Rules for "saw": a short noun phrase a parent can read later, starting with "the" or "a", naming the word, letter, or problem if you can see it. This is for the parent, not spoken to the child. Include the app name only if it is visible.
Rules for "answer": every letter of the marked word, in order. The whole word, such as pounds, not the hard spelling by itself and not one letter from the middle. A single letter only when the close-up is a single letter. Used so a later turn can say it, and to check that this turn did not leak it. Never shown to the child on this turn.
Rules for "kind": "word", "math", or "other".

Reply with JSON only: {"saw":"", "say":"", "answer":"", "kind":"word|math|other"}`;

export const REVEAL_SYSTEM = `You are Joyce, an early-elementary teacher. You have been teaching one word or problem, one sound or step at a time. Now say the answer.

They marked one spot on the screen (a red circle or oval on the first image). The second image is a close-up of that spot, without the red mark.

Rules for "say":
- One or two short sentences. If they just said the right sound, say yes, put the sounds together, and say the actual answer.
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

const TEAMS = new Set([
  "sh", "ch", "th", "wh", "ck", "ph", "ng", "qu", "kn", "wr", "tch", "dge",
  "ou", "ow", "oa", "ai", "ay", "ee", "ea", "oo", "oi", "oy", "au", "aw", "ew", "ie", "igh",
  "ar", "er", "ir", "or", "ur"
]);

const VOWEL_SOUNDS = {
  oh: "/oh/",
  ow: "/ow/",
  oo: "/oo/",
  ah: "/ah/",
  ay: "/ay/",
  ee: "/ee/",
  eye: "/eye/",
  aw: "/aw/",
  uh: "/uh/"
};

function placeOf(word, letters) {
  const at = word.indexOf(letters);
  if (at <= 0) return "at the beginning";
  if (at >= word.length - letters.length) return "at the end";
  return "in the middle";
}

function vowelTeam(word) {
  if (!word) return null;
  let letters = "";
  let names = "";
  let sound = "";
  if (/ou[bcdfmnpqrstvwxyz]/.test(word) && !/^(group|soup|you|your|youth|young|cousin|wound|through|could|would|should|touch|four|pour|court)$/.test(word)) {
    letters = "ou";
    names = "o and u";
    sound = "/ow/";
  } else if (/oa/.test(word)) {
    letters = "oa";
    names = "o and a";
    sound = "/oh/";
  } else if (/ai/.test(word) && !/air/.test(word)) {
    letters = "ai";
    names = "a and i";
    sound = "/ay/";
  } else if (/ee/.test(word)) {
    letters = "ee";
    names = "e and e";
    sound = "/ee/";
  } else if (/igh/.test(word)) {
    letters = "igh";
    names = "i, g, and h";
    sound = "/eye/";
  }
  if (!letters) return null;
  return { letters, names, sound, place: placeOf(word, letters) };
}

function vowelSounds(text) {
  const raw = String(text || "").toLowerCase();
  const found = [];
  for (const match of raw.matchAll(/\/([^/\s]+)\//g)) {
    const sound = VOWEL_SOUNDS[match[1]];
    if (sound) found.push(sound);
  }
  for (const token of raw.split(/[^a-z]+/)) {
    if (VOWEL_SOUNDS[token]) found.push(VOWEL_SOUNDS[token]);
  }
  return found;
}

function focusWord(say, answer) {
  const text = String(say || "");
  const skip = new Set(["you", "is", "marked", "this", "that", "they", "your", "with", "letter", "word", "starts", "begins"]);
  const named = text.match(/\bthe word (?:is\s+)?([a-z]{3,})\b/i);
  if (named && !skip.has(named[1].toLowerCase())) return named[1].toLowerCase();
  const leading = text.match(/\b([a-z]{4,})\s+(?:starts|begins)\b/i);
  if (leading && !skip.has(leading[1].toLowerCase())) return leading[1].toLowerCase();
  return wordOf(answer);
}

// The picture model often puts only the hard spelling in "answer" ("o")
// while the sentence names the real word ("pounds").
function readingWord(saw, say, answer) {
  const fromAnswer = wordOf(answer);
  const named = [focusWord(saw, ""), focusWord(say, "")].filter((word) => word && word !== fromAnswer);
  const longer = named.find((word) => word.length >= 4 && word.length > fromAnswer.length && (fromAnswer.length <= 2 || word.includes(fromAnswer)));
  return longer || fromAnswer || named[0] || "";
}

function claimedStartLetter(say) {
  const text = String(say || "").toLowerCase();
  const patterns = [
    /(?:starts|begins|starting|beginning) with(?: the)? letter ([a-z])\b/,
    /(?:starts|begins) with (?!the\b|a\b|an\b)([a-z])\b/,
    /first letter(?: is|,)? ([a-z])\b/,
    /starting letter(?: is)? ([a-z])\b/,
    /letter ([a-z]) (?:starts|begins|comes first|is first|is the first)/,
    /\b([a-z]) (?:is|comes) first\b/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function anchoredTeamLine(word, team, name) {
  const head = team.names.charAt(0).toUpperCase() + team.names.slice(1);
  if (team.place === "at the beginning") {
    return `${name}, ${team.names} are at the beginning. They say ${team.sound}. Say ${team.sound}.`;
  }
  return `${name}, the word starts with the letter ${word[0]}. ${head} are ${team.place}. They say ${team.sound}. Say ${team.sound}.`;
}

function teamCorrection(question, answer, name) {
  const word = wordOf(answer);
  const team = vowelTeam(word);
  if (!team) return "";
  const said = vowelSounds(question);
  if (!said.length || said.includes(team.sound)) return "";
  return anchoredTeamLine(word, team, name);
}

function hintFits(say, answer, kind) {
  const word = wordOf(answer);
  if (!say || leaked(say, answer) || GENERIC_HINT.test(say)) return false;
  if (kind !== "word" || !word) return true;
  if (/silent/i.test(say) && !allowsSilent(word)) return false;
  const named = say.match(/\b(?:word|answer) is\s+([a-z]+)/i);
  if (named && named[1].toLowerCase() !== word) return false;
  const letters = [...say.matchAll(/\bletter(?:\s+is)?(?:\s+the)?\s+([a-z])\b/gi)].map((match) => match[1].toLowerCase());
  if (!letters.every((letter) => word.includes(letter))) return false;
  for (const pair of say.toLowerCase().matchAll(/\b([a-z]{1,2}),? and ([a-z]{1,2}) together\b/g)) {
    const joined = pair[1] + pair[2];
    if (!TEAMS.has(joined) || !word.includes(joined)) return false;
  }
  const claimed = claimedStartLetter(say);
  const focus = focusWord(say, word);
  return !claimed || claimed === focus[0];
}

function concreteHint(answer, kind, name, earlier = []) {
  const word = wordOf(answer);
  const said = earlier.join(" ").toLowerCase();
  if (kind === "word" && magicE(word) && !/silent/.test(said)) {
    const vowel = word.match(/[aeiou]/)[0];
    return `${name}, that e at the end is silent. It makes the vowel ${vowel} say its name. Say that sound.`;
  }
  const digraph = kind === "word" ? DIGRAPHS.find(([letters]) => word.includes(letters)) : null;
  if (digraph && !said.includes(digraph[2])) {
    return `${name}, ${digraph[1]} together say ${digraph[2]}. Say ${digraph[2]}.`;
  }
  if (digraph) {
    const rest = word.replace(digraph[0], "");
    if (rest.length === 1) return `${name}, the ${rest} says its name. Say that sound.`;
  }
  const team = kind === "word" ? vowelTeam(word) : null;
  if (team && !said.includes(team.sound)) return anchoredTeamLine(word, team, name);
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

function routineCue(earlier, question, answer) {
  if (teamCorrection(question, answer, "Child")) {
    return "Their sound does not match this word. Tell them the sound this spelling uses here, and ask them to say it. Do not praise the sound they said. Do not switch letters. Do not say the word.";
  }
  if (!earlier.length) {
    return "First move. Tell the sound of the hardest spelling in this word, then ask them to say only that sound. If that spelling is not the first letter, say it is in the middle or at the end. Do not say the word starts there. Do not say the word.";
  }
  return "Next move. If the sound they just said is not the first letter, go back to the first letter. Tell them the word starts with that letter and ask for its sound. If the sounds are known, put them together from the first letter. Do not say the whole word yet.";
}

function scrubStart(say, answer, name) {
  const word = focusWord(say, answer);
  const claimed = claimedStartLetter(say);
  if (!word || !claimed || claimed === word[0]) return say;
  const team = vowelTeam(word);
  if (team) return anchoredTeamLine(word, team, name);
  return `${name}, the word starts with the letter ${word[0]}.`;
}

function spokenHint(raw, answer, kind, name, earlier = [], question = "", saw = "") {
  const say = clip(raw, 320);
  const word = readingWord(saw, say, answer);
  const correction = teamCorrection(question, word, name);
  if (correction) return correction;
  const team = vowelTeam(word);
  if (team && team.place !== "at the beginning" && !earlier.join(" ").toLowerCase().includes(`letter ${word[0]}`)) {
    return anchoredTeamLine(word, team, name);
  }
  if (hintFits(say, word, kind)) return scrubStart(say, word, name);
  return scrubStart(concreteHint(word, kind, name, earlier), word, name);
}

function revealLine(raw, answer, kind, name) {
  const secret = clip(answer, 48);
  const word = wordOf(secret);
  const spoken = clip(raw, 320);
  const named = spoken.match(/\b(?:word|answer) is\s+([a-z]+)/i);
  const wrongWord = Boolean(word && named && named[1].toLowerCase() !== word);
  const falseSilent = Boolean(word && /silent/i.test(spoken) && !allowsSilent(word));
  const claimed = claimedStartLetter(spoken);
  const focus = focusWord(spoken, word);
  if (focus && claimed && claimed !== focus[0]) {
    return `${name}, the word starts with the letter ${focus[0]}. The word is ${focus}.`;
  }
  if (!wrongWord && !falseSilent && secret && spoken && spoken.toLowerCase().includes(secret.toLowerCase())) return spoken;
  if (secret) {
    if (kind === "math") return `${name}, the answer is ${secret}.`;
    if (kind === "word") return `${name}, the word is ${secret}.`;
    return `${name}, it is ${secret}.`;
  }
  return spoken || `${name}, point a little closer to the word.`;
}

// The voice reads "/ow/" as letters or as the "oh" in low. Spoken copy uses
// spellings it says as one sound; the screen and the report keep the slashes.
const SPOKEN_SOUNDS = {
  ow: "ow", oh: "oh", oo: "oo", ah: "ahh", ay: "ay", ee: "ee", eye: "eye", aw: "aww", uh: "uh",
  a: "aah", e: "eh", i: "ih", o: "ahh", u: "uh",
  p: "puh", b: "buh", t: "tuh", d: "duh", k: "kuh", c: "kuh", g: "guh", j: "juh", ch: "chuh",
  h: "huh", w: "wuh", y: "yuh", qu: "kwuh", x: "ks",
  m: "mmm", n: "nnn", s: "sss", z: "zzz", f: "fff", v: "vvv", l: "lll", r: "rrr", sh: "shh", th: "thh", ng: "ng"
};

const KEY_WORDS = { ow: "cow", oh: "boat", oo: "moon", ay: "rain", ee: "feet", eye: "night", aw: "saw" };

export function speakable(text) {
  const line = String(text || "");
  const sounds = [...line.matchAll(/\/([a-z]{1,3})\//gi)];
  const blending = sounds.length >= 3;
  return line
    .replace(/\/([a-z]{1,3})\/(\s*[.,!?]?)/gi, (whole, raw, after) => {
      const key = raw.toLowerCase();
      const say = SPOKEN_SOUNDS[key];
      if (!say) return whole;
      if (blending) return `${say}... `;
      const like = KEY_WORDS[key] ? `, like in ${KEY_WORDS[key]}` : "";
      return `${say}${like}${after}`;
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function speakAudio(text, env, fetchImpl) {
  const line = clip(speakable(text), 360);
  if (!line || !env.OPENAI_API_KEY) return "";
  const voice = env.JOYCE_TABLET_VOICE || "coral";
  const attempts = [
    {
      model: env.JOYCE_TTS_MODEL || "gpt-4o-mini-tts",
      voice,
      instructions: "You are Joyce, a warm playful teacher sitting beside a young child. Sound like a real person, kind and unhurried. Clear words. No announcer voice and no robot voice. When you say a single sound such as ow, puh, or sss, say only that sound, never letter names. Ow rhymes with cow."
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
    if ((pointer.hints || []).length >= HINT_LIMIT && !teamCorrection(question, pointer.answer, kid.name)) {
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
    routineCue(earlier, question, pointer?.answer || ""),
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
    const heard = readingWord(out.saw, out.say, seen);
    if (pointer?.answer && wordOf(pointer.answer).length >= 4) answer = pointer.answer;
    else if (heard) answer = heard;
    else if (pointer?.answer && wordOf(pointer.answer)) answer = pointer.answer;
    else if (seen) answer = seen;
    say = spokenHint(out.say, answer, kind, kid.name, earlier, question, out.saw);
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
