// The games' shared voice (kit.mjs), run against a pretend tablet browser. The pretend browser
// acts like Safari on an iPad: a sound player may start only within a second of a tap, unless
// that same player already played during a tap.
import assert from "node:assert/strict";
import test from "node:test";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const listeners = {};
const events = [];
const asked = [];
const deviceLines = [];
let activeTap = false;
let tapTimer = null;
let serverDelay = 30;
let serverDown = false;

function textOf(src) {
  if (src.startsWith("data:audio/wav")) return "(silence)";
  const comma = src.indexOf(",");
  return Buffer.from(src.slice(comma + 1), "base64").toString();
}

class FakeAudio {
  static made = 0;
  constructor(src = "") {
    FakeAudio.made += 1;
    this.src = src;
    this.paused = true;
    this.timer = null;
    this.onended = null;
    this.onerror = null;
  }
  play() {
    if (activeTap) this.unlocked = true;
    const text = textOf(this.src);
    if (!this.unlocked) {
      events.push(`blocked ${text}`);
      return Promise.reject(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    }
    clearTimeout(this.timer);
    this.paused = false;
    events.push(`start ${text}`);
    this.timer = setTimeout(() => {
      this.paused = true;
      events.push(`end ${text}`);
      this.onended?.();
    }, text === "(silence)" ? 5 : 80);
    return Promise.resolve();
  }
  pause() {
    if (this.paused) return;
    clearTimeout(this.timer);
    this.paused = true;
    events.push(`cut ${textOf(this.src)}`);
  }
}

globalThis.window = globalThis;
globalThis.Audio = FakeAudio;
globalThis.location = { search: "?kid=gabi", href: "http://tablet.test/sound-bugs/" };
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = { addEventListener: (type, fn) => (listeners[type] ||= []).push(fn) };
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
globalThis.speechSynthesis = {
  getVoices: () => [],
  cancel() {},
  resume() {},
  speak(utter) {
    deviceLines.push(utter.text);
    setTimeout(() => utter.onend?.(), 5);
  }
};
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith("data:")) throw new Error("plays the data address instead");
  const body = JSON.parse(options.body);
  asked.push(body.text);
  await sleep(serverDelay);
  if (serverDown) return { ok: false, json: async () => null };
  return { ok: true, json: async () => ({ audioBase64: Buffer.from(body.text).toString("base64") }) };
};

const { say, afterLine } = await import("./kit.mjs");

function tap() {
  activeTap = true;
  for (const type of ["pointerdown", "pointerup", "click"]) {
    for (const fn of listeners[type] || []) fn({ type });
  }
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => { activeTap = false; }, 1000);
}

function heard(from) {
  return events.slice(from).filter((e) => !e.endsWith("(silence)"));
}

test("a line that arrives long after the tap still plays, through one player", async () => {
  serverDelay = 1500; // a word the server has never said, longer than an iPad allows
  const from = events.length;
  tap();
  await say("Find the word said.");
  assert.deepEqual(heard(from), ["start Find the word said.", "end Find the word said."]);
  await say("Find the word was."); // no tap at all this time
  assert.deepEqual(heard(from).slice(2), ["start Find the word was.", "end Find the word was."]);
  assert.equal(FakeAudio.made, 1);
  serverDelay = 30;
});

test("the next question waits for the Yes to finish", async () => {
  const from = events.length;
  tap();
  const yes = say("Yes. That is the cup.");
  await sleep(400); // the game moves on by itself, like runRounds does
  const next = say("Tap the ball.");
  await Promise.all([yes, next]);
  assert.deepEqual(heard(from), ["start Yes. That is the cup.", "end Yes. That is the cup.", "start Tap the ball.", "end Tap the ball."]);
});

test("a tap cuts off the line from before it", async () => {
  const from = events.length;
  tap();
  const question = say("Which pen has fewer sheep?");
  await sleep(60); // the question is playing
  tap();
  const hint = say("Count one pen, then the other pen.");
  await Promise.all([question, hint]);
  assert.deepEqual(heard(from), [
    "start Which pen has fewer sheep?",
    "cut Which pen has fewer sheep?",
    "start Count one pen, then the other pen.",
    "end Count one pen, then the other pen."
  ]);
});

test("two lines from the same tap both play, in order", async () => {
  const from = events.length;
  tap();
  say("Ten rocks.");
  await say("The crate closes.");
  assert.deepEqual(heard(from), ["start Ten rocks.", "end Ten rocks.", "start The crate closes.", "end The crate closes."]);
});

test("the same line asked for twice in a row plays once", async () => {
  const from = events.length;
  tap();
  await sleep(400);
  say("Pick a shop.");
  await say("Pick a shop.");
  assert.deepEqual(heard(from), ["start Pick a shop.", "end Pick a shop."]);
});

test("afterLine holds the screen until the line has finished", async () => {
  tap();
  say("Here you go!");
  const start = Date.now();
  await afterLine(10);
  assert.ok(events.includes("end Here you go!"));
  assert.ok(Date.now() - start >= 100);
});

test("with no device voice, a failed line stays quiet and the next line still asks the server", async () => {
  serverDown = true;
  tap();
  await say("They darted off again.", { device: false });
  assert.deepEqual(deviceLines, []);
  serverDown = false;
  const from = events.length;
  await say("Find them once more.", { device: false });
  assert.equal(asked.at(-1), "Find them once more.");
  assert.deepEqual(heard(from), ["start Find them once more.", "end Find them once more."]);
});

test("when the server fails, the device voice says the line instead", async () => {
  serverDown = true;
  tap();
  await say("The monkey made it across.");
  assert.equal(deviceLines.at(-1), "The monkey made it across.");
  serverDown = false;
});
