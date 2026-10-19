import assert from "node:assert/strict";
import test from "node:test";
import { checkKey, handleTabletRequest, helpNote } from "./joyce-tablet.mjs";

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
  assert.match(result.body.say, /first sound/);
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

test("a second hint is different and a third asks for a grown-up", async () => {
  const store = memoryStore();
  let n = 0;
  const replies = [
    { saw: "the problem 14 minus 6", say: "Start at 14.", answer: "8", kind: "math" },
    { saw: "the problem 14 minus 6", say: "Count back six from 14.", answer: "8", kind: "math" }
  ];
  const impl = fetchImpl(null);
  const fetchStep = async (url, opts) => {
    if (String(url).includes("/chat/completions")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify(replies[n++] || replies[1]) } }] });
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
  assert.match(second.body.say, /Count back/);
  const third = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId }
  });
  assert.equal(third.body.done, true);
  assert.match(third.body.say, /grown-up/);
  const saved = [...store.data.values()].find((v) => v.kind === "tablet-help");
  assert.equal(saved.outcome, "still-stuck");
  assert.match(saved.text, /1\)/);
  assert.match(saved.text, /still stuck/);
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
