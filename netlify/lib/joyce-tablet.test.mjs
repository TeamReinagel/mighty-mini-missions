import assert from "node:assert/strict";
import test from "node:test";
import { HINT_SYSTEM, REVEAL_SYSTEM, checkKey, handleTabletRequest, helpNote, speakable } from "./joyce-tablet.mjs";

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
    fetchImpl: fetchImpl({ saw: "the word frog", say: "What sounds do you hear at the beginning?", answer: "frog", kind: "word" }),
    body: { kid: "gabi", imageBase64: image, question: "what is this word" }
  });
  assert.match(result.body.say, /letter f/i);
  assert.doesNotMatch(result.body.say, /sounds/i);
  assert.doesNotMatch(result.body.say, /\bfrog\b/i);
});

test("sight-word help does not tell the child to sound the word out", () => {
  assert.match(HINT_SYSTEM, /sight word/i);
  assert.match(HINT_SYSTEM, /do not explain the letters/i);
  assert.match(HINT_SYSTEM, /Say the whole word and ask them to say it/);
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
    body: { kid: "gabi", imageBase64: image, cropBase64: image, question: "I need help with this word." }
  });
  const second = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "gabi", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "/oh/" }
  });
  assert.equal(second.body.revealed, undefined);
  assert.match(second.body.say, /starts with the letter p/i);
  assert.match(second.body.say, /\/ow\//i);
  assert.doesNotMatch(second.body.say, /great|that's right/i);
  assert.doesNotMatch(second.body.say, /\bpounds\b/i);
  const third = await handleTabletRequest({
    store, env, fetchImpl: fetchStep,
    body: { kid: "gabi", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "/oh/" }
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
    body: { kid: "gabi", imageBase64: image, question: "what is this word" }
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
    body: { kid: "gabi", imageBase64: image, question: "what is this word" }
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

test("sounds are spoken as sounds, so pounds is not heard as ponds", () => {
  const blend = speakable("Yes, /p/ /ow/ /n/ /d/ /s/. The word is pounds.");
  assert.doesNotMatch(blend, /\//);
  assert.match(blend, /puh\.\.\. ow\.\.\. nnn\.\.\. duh\.\.\. sss\.\.\./);
  assert.match(blend, /The word is pounds\.$/);
  const one = speakable("O and u are in the middle. They say /ow/. Say /ow/.");
  assert.match(one, /They say ow, like in cow\. Say ow, like in cow\./);
});

test("a made-up letter pair is replaced", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word friends", say: "The letters r and i together say /r/. Say /r/.", answer: "friends", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "I need help with it." }
  });
  assert.doesNotMatch(result.body.say, /r and i together/i);
});

test("could keeps its own ou sound", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word could", say: "O and u together say /oo/ here. Say /oo/.", answer: "could", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "what is this word" }
  });
  assert.doesNotMatch(result.body.say, /\/ow\//);
});

test("would is taught as a whole sight word in one turn, with no letter rule", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word would", say: "The word starts with the letter w. What sound does w make?", answer: "would", kind: "word" }),
    body: { kid: "max", imageBase64: image, cropBase64: image, question: "what is this word" }
  });
  assert.notEqual(result.body.revealed, true);
  assert.match(result.body.say, /sight word\. It says would\. Say would\./i);
  assert.doesNotMatch(result.body.say, /\/oo\/|quiet/i);
  assert.doesNotMatch(result.body.say, /sound does w make|letter w/i);
});

test("eight is said as a whole sight word", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word eight", say: "I, g, and h say /eye/.", answer: "eight", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "help" }
  });
  assert.match(result.body.say, /It says eight\. Say eight\./i);
  assert.doesNotMatch(result.body.say, /\/eye\/|\/ay\//);
});

test("Max gets the tricky part, then is asked to read the word, without single-letter drills", async () => {
  const store = memoryStore();
  const requests = [];
  let n = 0;
  const replies = [
    { saw: "the word pounds", say: "O and u say /ow/.", answer: "pounds", kind: "word" },
    { saw: "the word pounds", say: "Yes! Now what sound does p make?", answer: "pounds", kind: "word" }
  ];
  const impl = fetchImpl(null);
  const fetchStep = async (url, opts) => {
    if (String(url).includes("/chat/completions")) {
      requests.push(JSON.parse(opts.body));
      return jsonResponse({ choices: [{ message: { content: JSON.stringify(replies[n++] || replies[1]) } }] });
    }
    return impl(url, opts);
  };
  const first = await handleTabletRequest({ store, env, fetchImpl: fetchStep, body: { kid: "max", imageBase64: image, cropBase64: image, question: "help" } });
  assert.match(first.body.say, /in this word, o and u in the middle say \/ow\//i);
  assert.doesNotMatch(first.body.say, /letter p/i);
  const second = await handleTabletRequest({ store, env, fetchImpl: fetchStep, body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "/ow/" } });
  assert.doesNotMatch(second.body.say, /sound does p make/i);
  assert.match(second.body.say, /read the whole word/i);
  const followUpPictures = requests[1].messages[1].content.filter((part) => part.type === "image_url");
  assert.equal(followUpPictures.length, 0);
});

test("a single consonant drill from the model is replaced for Max", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word wants", say: "The letter n in this word says /n/. Say /n/.", answer: "wants", kind: "word" }),
    body: { kid: "max", imageBase64: image, question: "help" }
  });
  assert.doesNotMatch(result.body.say, /letter n/i);
});

test("a quoted made-up pair is still caught", async () => {
  const result = await handleTabletRequest({
    store: memoryStore(),
    env,
    fetchImpl: fetchImpl({ saw: "the word has", say: "'H' and 'a' together say /h/. Say /h/.", answer: "has", kind: "word" }),
    body: { kid: "gabi", imageBase64: image, question: "help" }
  });
  assert.doesNotMatch(result.body.say, /h and a together|'h' and 'a'/i);
});

test("after a sight word, saying it gets praise and ends the turn", async () => {
  const store = memoryStore();
  const reply = { saw: "the word would", say: "What sound does w make?", answer: "would", kind: "word" };
  const first = await handleTabletRequest({ store, env, fetchImpl: fetchImpl(reply), body: { kid: "max", imageBase64: image, question: "help" } });
  const second = await handleTabletRequest({ store, env, fetchImpl: fetchImpl(reply), body: { kid: "max", imageBase64: image, followUp: true, sessionId: first.body.sessionId, question: "Would." } });
  assert.equal(second.body.revealed, true);
  assert.match(second.body.say, /Yes, Max\. You read would/);
});
