import assert from "node:assert/strict";
import test from "node:test";
import { HINT_SYSTEM, REVEAL_SYSTEM, checkKey, handleTabletRequest, helpNote } from "./joyce-tablet.mjs";

const KEY = "family-tablet-key";
const env = { JOYCE_TABLET_KEY: KEY, OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-4o-mini" };
const image = Buffer.from("not-a-real-jpeg-but-valid-base64-input").toString("base64");

function memoryStore() {
  const data = new Map();
  return {
    data,
    async setJSON(key, value) { data.set(key, value); },
    async get(key) { return data.get(key) ?? null; }
  };
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(payload); },
    async json() { return payload; }
  };
}

function fetchImpl(reply) {
  return async (url) => {
    const href = String(url);
    if (href.includes("/audio/transcriptions")) return jsonResponse({ text: "what is this word" });
    if (href.includes("/audio/speech")) {
      return { ok: true, status: 200, async arrayBuffer() { return new Uint8Array(40).buffer; } };
    }
    if (href.includes("/chat/completions")) return jsonResponse({ choices: [{ message: { content: JSON.stringify(reply) } }] });
    throw new Error(`unexpected ${href}`);
  };
}

test("checkKey rejects a missing or wrong key", () => {
  assert.equal(checkKey("Bearer no", env).status, 401);
  assert.equal(checkKey("Bearer " + KEY, env).ok, true);
  assert.equal(checkKey("Bearer " + KEY, {}).status, 503);
});

test("helpNote names the point, the hint, and the outcome", () => {
  const text = helpNote({
    name: "Max",
    saw: "the word ship in a reading app",
    question: "what's this word?",
    hints: ["Say the first two letters together."],
    outcome: "got-it"
  });
  assert.match(text, /Max pointed at the word ship/);
  assert.match(text, /what's this word\?/);
  assert.match(text, /without giving the answer/);
  assert.match(text, /tapped that they got it/);
});

test("a leaked answer is replaced with a hint", async () => {
  const store = memoryStore();
  const result = await handleTabletRequest({
    store,
    env,
    fetchImpl: fetchImpl({ saw: "the word ship", say: "The word is ship.", answer: "ship", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "what's this word?" }
  });
  assert.equal(result.status, 200);
  assert.doesNotMatch(result.body.say, /\bship\b/i);
  assert.match(result.body.say, /s and h together say \/sh\//i);
  assert.ok(result.body.audioBase64);
  const saved = [...store.data.values()].find((v) => v.kind === "tablet-help");
  assert.equal(saved.kids[0], "max");
  assert.equal(saved.imageBase64, undefined);
  assert.match(saved.text, /the word ship/);
  assert.match(saved.text, /had not yet tapped/);
});

test("a clean hint is saved and an outcome updates the same note", async () => {
  const store = memoryStore();
  const hint = "Say the first two letters together.";
  const first = await handleTabletRequest({
    store,
    env,
    fetchImpl: fetchImpl({ saw: "the word ship in a reading app", say: hint, answer: "ship", kind: "word" }),
    body: { kid: "gabi", imageBase64: image, question: "help" }
  });
  assert.equal(first.body.say, hint);
  const outcome = await handleTabletRequest({
    store,
    env,
    fetchImpl: fetchImpl({}),
    body: { action: "outcome", sessionId: first.body.sessionId, outcome: "got-it" }
  });
  assert.equal(outcome.status, 200);
  const saved = [...store.data.values()].find((v) => v.kind === "tablet-help");
  assert.match(saved.text, /Gabi/);
  assert.match(saved.text, /tapped that they got it/);
  assert.equal([...store.data.keys()].filter((k) => k.startsWith("observations/")).length, 1);
});

test("a second hint still withholds the answer and a third says it", async () => {
  const store = memoryStore();
  let n = 0;
  const replies = [
    { saw: "the problem 14 minus 6", say: "Start at 14.", answer: "8", kind: "math" },
    { saw: "the problem 14 minus 6", say: "Count back six from 14.", answer: "8", kind: "math" },
    { saw: "the problem 14 minus 6", say: "Look at it again.", answer: "8", kind: "math" }
  ];
  const impl = fetchImpl(null);
  const fetchStep = async (url, opts) => {
    if (String(url).includes("/chat/completions")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify(replies[n++] || replies[2]) } }] });
    }
    return impl(url, opts);
  };
  const first = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, cropBase64: image }
  });
  const second = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId }
  });
  assert.equal(second.body.hintsUsed, 2);
  assert.equal(second.body.revealed, undefined);
  assert.match(second.body.say, /Count back/);
  assert.doesNotMatch(second.body.say, /\b8\b/);
  const third = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "what is this" }
  });
  assert.equal(third.body.done, false);
  assert.equal(third.body.revealed, true);
  assert.match(third.body.say, /the answer is 8/i);
  const saved = [...store.data.values()].find((v) => v.kind === "tablet-help");
  assert.equal(saved.outcome, null);
  assert.match(saved.text, /1\)/);
  assert.match(saved.text, /gave the answer/);
  assert.match(saved.text, /the answer is 8/i);
});

test("a generic sound-it-out hint is replaced with the first letter", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word friends", say: "What sounds do you hear at the beginning?", answer: "friends", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "what is this sight word" }
  });
  assert.match(result.body.say, /letter f/i);
  assert.doesNotMatch(result.body.say, /sounds/i);
  assert.doesNotMatch(result.body.say, /\bfriends\b/i);
});

test("sight-word help does not tell the child to sound the word out", () => {
  assert.match(HINT_SYSTEM, /sight word/i);
  assert.match(HINT_SYSTEM, /do not use phonics/i);
  assert.match(HINT_SYSTEM, /3 sounds/);
  assert.match(HINT_SYSTEM, /e at the end is silent/);
  assert.match(HINT_SYSTEM, /structured literacy/i);
  assert.match(HINT_SYSTEM, /Say only that sound|say only that sound/);
  assert.match(REVEAL_SYSTEM, /Say the actual answer/);
});

test("a silent e word gets that hint instead of a generic one", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word cake", say: "What sounds do you hear?", answer: "cake", kind: "word" }),
    body: { kid: "gabi", imageBase64: image, question: "help" }
  });
  assert.match(result.body.say, /e at the end is silent/i);
  assert.match(result.body.say, /vowel|a\?/);
  assert.doesNotMatch(result.body.say, /\bcake\b/i);
});

test("she stays she, with the sh sound, and is not renamed friends", async () => {
  const store = memoryStore();
  let n = 0;
  const replies = [
    { saw: "the word she", say: "That word has a silent letter. Can you find it?", answer: "she", kind: "word" },
    { saw: "the word she", say: "The silent letter is at the end. Can you find it?", answer: "she", kind: "word" },
    { saw: "the word friends", say: "The silent letter is the D. The word is friends.", answer: "friends", kind: "word" }
  ];
  const impl = fetchImpl(null);
  const fetchStep = async (url, opts) => {
    if (String(url).includes("/chat/completions")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify(replies[n++] || replies[2]) } }] });
    }
    return impl(url, opts);
  };
  const first = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, cropBase64: image, question: "I need help with this word." }
  });
  assert.match(first.body.say, /s and h together say \/sh\//i);
  assert.doesNotMatch(first.body.say, /silent/i);
  assert.doesNotMatch(first.body.say, /\bfriends\b/i);
  const second = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "Is it the H?" }
  });
  assert.doesNotMatch(second.body.say, /silent/i);
  assert.doesNotMatch(second.body.say, /\bfriends\b/i);
  const third = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "No" }
  });
  assert.equal(third.body.revealed, true);
  assert.match(third.body.say, /the word is she/i);
  assert.doesNotMatch(third.body.say, /\bfriends\b/i);
  assert.doesNotMatch(third.body.say, /\bD\b/);
});

test("ou in pounds says ow, so oh is corrected instead of praised", async () => {
  const store = memoryStore();
  let n = 0;
  const replies = [
    { saw: "the word pounds", say: "Do you see the letters ou? What sound do they make together?", answer: "pounds", kind: "word" },
    { saw: "the word pounds", say: "Great! Now, what does the letter p make?", answer: "pounds", kind: "word" },
    { saw: "the word pounds", say: "That's right. The word is pounds.", answer: "pounds", kind: "word" }
  ];
  const impl = fetchImpl(null);
  const fetchStep = async (url, opts) => {
    if (String(url).includes("/chat/completions")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify(replies[n++] || replies[2]) } }] });
    }
    return impl(url, opts);
  };
  const first = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, cropBase64: image, question: "I need help with this word." }
  });
  const second = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "/oh/" }
  });
  assert.equal(second.body.revealed, undefined);
  assert.match(second.body.say, /starts with the letter p/i);
  assert.match(second.body.say, /\/ow\//i);
  assert.doesNotMatch(second.body.say, /great|that's right/i);
  assert.doesNotMatch(second.body.say, /\bpounds\b/i);
  const third = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "/oh/" }
  });
  assert.notEqual(third.body.revealed, true);
  assert.match(third.body.say, /\/ow\//i);
  assert.doesNotMatch(third.body.say, /\bpounds\b/i);
});

test("pounds does not start with o or ow", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({
      saw: "the word pounds",
      say: "The word starts with the letter o and the sound /ow/.",
      answer: "pounds",
      kind: "word"
    }),
    body: { kid: "max", imageBase64: image, question: "what is this word" }
  });
  assert.match(result.body.say, /starts with the letter p/i);
  assert.match(result.body.say, /in the middle/i);
  assert.match(result.body.say, /\/ow\//);
  assert.doesNotMatch(result.body.say, /starts with the letter o/i);
  assert.doesNotMatch(result.body.say, /\bpounds\b/i);
});

test("pounds stays pounds when the model answers with only the letter o", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({
      saw: "the word pounds",
      say: "The word pounds starts with the letter O.",
      answer: "O",
      kind: "word"
    }),
    body: { kid: "max", imageBase64: image, question: "what is this word" }
  });
  assert.match(result.body.say, /starts with the letter p/i);
  assert.match(result.body.say, /in the middle/i);
  assert.match(result.body.say, /\/ow\//);
  assert.doesNotMatch(result.body.say, /starts with the letter o/i);
  assert.doesNotMatch(result.body.say, /\bpounds\b/i);
});

test("Joyce agrees when the child says the word", async () => {
  const store = memoryStore();
  const first = await handleTabletRequest({
    store,
    env,
    fetchImpl: fetchImpl({ saw: "the word cake", say: "That e at the end is silent. What does it do to the a?", answer: "cake", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "what is this word" }
  });
  const second = await handleTabletRequest({
    store,
    env,
    fetchImpl: fetchImpl({}),
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "cake" }
  });
  assert.equal(second.body.revealed, true);
  assert.match(second.body.say, /yes/i);
  assert.match(second.body.say, /cake/i);
});

test("audio is transcribed when the child didn't get on-device speech", async () => {
  const store = memoryStore();
  let sawAudio = false;
  const result = await handleTabletRequest({
    store,
    env,
    fetchImpl: async (url) => {
      if (String(url).includes("/audio/transcriptions")) {
        sawAudio = true;
        return jsonResponse({ text: "what's this word" });
      }
      return jsonResponse({ choices: [{ message: { content: JSON.stringify({ saw: "the letter b", say: "Find the straight line first.", answer: "b", kind: "word" }) } }] });
    },
    body: { kid: "connor", imageBase64: image, audioBase64: Buffer.from("fake-audio").toString("base64"), audioType: "audio/mp4" }
  });
  assert.equal(sawAudio, true);
  assert.equal(result.status, 200);
  const saved = [...store.data.values()].find((v) => v.kind === "tablet-help");
  assert.match(saved.text, /Connor/);
  assert.match(saved.text, /what's this word/);
});

test("an unknown child is refused", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({}),
    body: { kid: "nobody", imageBase64: image }
  });
  assert.equal(result.status, 400);
});
