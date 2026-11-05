const READY_KEY = "mighty-ready.v1";
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

export function word(n) {
  return WORDS[n] || String(n);
}

export function kid() {
  const query = new URLSearchParams(location.search).get("kid");
  try {
    const data = JSON.parse(localStorage.getItem("mighty-mini-missions:profiles") || "{}");
    const list = Array.isArray(data.profiles) ? data.profiles : [];
    const found = list.find((profile) => profile.id === (query || data.activeProfileId));
    if (found) return { id: found.id, name: found.name, color: found.color };
  } catch { /* keep going */ }
  const id = query || "player";
  const colors = { max: "#4fa3ff", gabi: "#e27bd0", connor: "#ff9f1c", ethan: "#2fbf8f" };
  const name = id === "player" ? "friend" : id.charAt(0).toUpperCase() + id.slice(1);
  return { id, name, color: colors[id] || "#7c6cf0" };
}

export function stepParam() {
  return new URLSearchParams(location.search).get("step") || "";
}

export function load(game) {
  try {
    return JSON.parse(localStorage.getItem(`play.${game}.v1:${kid().id}`) || "null");
  } catch {
    return null;
  }
}

export function save(game, state) {
  localStorage.setItem(`play.${game}.v1:${kid().id}`, JSON.stringify(state));
}

export function markReady(flag) {
  const id = kid().id;
  let all = {};
  try { all = JSON.parse(localStorage.getItem(READY_KEY) || "{}"); } catch { all = {}; }
  all[id] = { ...(all[id] || {}), [flag]: true };
  localStorage.setItem(READY_KEY, JSON.stringify(all));
}

// Browsers keep a page quiet until someone has tapped it, and a line spoken before that can jam
// the speech queue. So nothing speaks until the first tap.
//
// Every line plays through one player. Safari on an iPad lets a player start sound only right
// after a tap, and a line the server has never said before can take a few seconds to arrive. A
// player that played once during a tap may play again later, so the first tap wakes this one
// with a blink of silence.
//
// A line the child's own tap starts (a "Yes" or a hint) cuts off what was playing before the tap.
// A line the game starts on its own, like the next question, waits for the line playing to finish,
// and so does a second line started by the same tap.
const SILENCE = "data:audio/wav;base64,UklGRhQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=";
const TAP_MS = 350;
const LINE_CAP_MS = 9000;
let tapped = false;
let tapStart = -Infinity;
let lastTouch = -Infinity;
let lastLineAt = -Infinity;
let linePlayer = null;
let playerAwake = false;
let clipEnd = null;

function voicePlayer() {
  if (!linePlayer) {
    linePlayer = new Audio();
    linePlayer.preload = "auto";
  }
  return linePlayer;
}

function wakePlayer() {
  if (playerAwake) return;
  playerAwake = true;
  if (clipEnd) return; // a line is already playing, so the player is awake
  const audio = voicePlayer();
  audio.src = SILENCE;
  // A line that pauses the silence early is fine; only a refusal means it is still asleep.
  audio.play().catch((err) => { if (err?.name === "NotAllowedError") playerAwake = false; });
}

if (typeof document !== "undefined") {
  const touch = (event) => {
    tapped = true;
    lastTouch = performance.now();
    if (event.type === "pointerdown" || event.type === "keydown") tapStart = lastTouch;
    wakePlayer();
  };
  for (const type of ["pointerdown", "pointerup", "click", "keydown"]) {
    document.addEventListener(type, touch, { capture: true });
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The shared ranking lives in ../voice-pick.js so every game gets the same, best-sounding voice.
import "../voice-pick.js";

let voice = null;
function pickVoice() {
  voice = window.MightyVoice?.pick() || null;
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

// Grown-ups: open any game with ?voice=pick to choose the voice from this device's list.
export function voicePicker() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth || !window.MightyVoice || new URLSearchParams(location.search).get("voice") !== "pick") return null;
  const wrap = el("label", "voice-pick", "Voice ");
  const select = el("select");
  const fill = () => {
    select.replaceChildren();
    const auto = el("option", "", `Best available${voice ? ` (${voice.name})` : ""}`);
    auto.value = "";
    select.append(auto);
    for (const entry of window.MightyVoice.list()) {
      const option = el("option", "", `${entry.name} (${entry.lang})`);
      option.value = entry.name;
      select.append(option);
    }
    select.value = window.MightyVoice.saved();
  };
  fill();
  synth.addEventListener?.("voiceschanged", fill);
  select.addEventListener("change", () => {
    window.MightyVoice.choose(select.value);
    pickVoice();
    say("Hi. This is how I sound.", { force: true });
  });
  wrap.append(select);
  return wrap;
}

// Games speak in one of three OpenAI voices (the server caches every line, so a line costs a
// fraction of a cent the first time any child hears it and nothing after). Open a game with
// ?tts=marin, ?tts=coral or ?tts=ash to try another. If the voice service is down, the device's
// own voice takes over so a game never goes silent.
const VOICE_BY_KID = { ethan: "coral", connor: "marin", gabi: "marin", max: "ash" };
const GAME_VOICES = ["marin", "coral", "ash"];

function gameVoice() {
  const asked = new URLSearchParams(location.search).get("tts");
  if (GAME_VOICES.includes(asked)) return asked;
  return VOICE_BY_KID[kid().id] || "marin";
}

const clips = new Map();
let voiceDownUntil = 0;
let spoken = 0;
let current = Promise.resolve();
let queued = null;

function stopClip() {
  if (!linePlayer) return;
  linePlayer.onended = null;
  linePlayer.onerror = null;
  try { linePlayer.pause(); } catch { /* already stopped */ }
  if (clipEnd) {
    const end = clipEnd;
    clipEnd = null;
    end(true);
  }
}

function hush() {
  stopClip();
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

// Lines the tablet has already heard are kept in the browser's cache, so a prompt plays at
// once (and offline) the next time instead of waiting on the server. Bump VOICE_CACHE if the
// voices change.
const VOICE_CACHE = "mighty-voice-v1";
const VOICE_CACHE_MAX = 600;

function voiceCacheUrl(key) {
  return new URL(`/__voice/${encodeURIComponent(key)}`, location.href).href;
}

async function savedClip(key) {
  try {
    if (typeof caches === "undefined") return "";
    const cache = await caches.open(VOICE_CACHE);
    const hit = await cache.match(voiceCacheUrl(key));
    if (!hit) return "";
    return URL.createObjectURL(await hit.blob());
  } catch {
    return "";
  }
}

async function keepClip(key, blob) {
  try {
    if (typeof caches === "undefined") return;
    const cache = await caches.open(VOICE_CACHE);
    await cache.put(voiceCacheUrl(key), new Response(blob, { headers: { "Content-Type": blob.type || "audio/mpeg" } }));
    const keys = await cache.keys();
    for (const old of keys.slice(0, Math.max(0, keys.length - VOICE_CACHE_MAX))) await cache.delete(old);
  } catch { /* storage full or private mode: the line still plays */ }
}

async function fetchClip(text, voiceName) {
  const key = `${voiceName}:${text}`;
  if (clips.has(key)) return clips.get(key);
  const saved = await savedClip(key);
  if (saved) {
    clips.set(key, saved);
    return saved;
  }
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), 6000);
  try {
    const res = await fetch("/api/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "speak", kid: kid().id, voice: voiceName, text }),
      signal: control.signal
    });
    const data = res.ok ? await res.json() : null;
    if (!data?.audioBase64) return "";
    const dataUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
    let src = dataUrl;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      src = URL.createObjectURL(blob);
      keepClip(key, blob);
    } catch { /* play the data address instead */ }
    clips.set(key, src);
    return src;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// Resolves true when the line finished or was cut off, false when it could not play.
function playClip(src) {
  stopClip();
  const audio = voicePlayer();
  return new Promise((resolve) => {
    const end = (ok) => {
      if (clipEnd === end) {
        clipEnd = null;
        audio.onended = null;
        audio.onerror = null;
      }
      resolve(ok);
    };
    clipEnd = end;
    audio.onended = () => end(true);
    audio.onerror = () => end(false);
    audio.src = src;
    audio.play().catch(() => end(false));
  });
}

function deviceSay(text) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth) return Promise.resolve();
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (!voice) pickVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  }
  utter.rate = 0.85;
  utter.pitch = 1;
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 1200 + text.length * 90);
    const done = () => { clearTimeout(timer); resolve(); };
    utter.onend = done;
    utter.onerror = done;
    synth.resume();
    synth.speak(utter);
  });
}

// Speaks a line and resolves when it has finished (or was cut off).
// { force: true } speaks even before the first tap and cuts off the line playing ("Hear it").
// { device: false } stays quiet instead of using the device's own voice when the server fails.
export function say(text, { force = false, device = true } = {}) {
  if (!text) return Promise.resolve();
  say.last = text;
  if (!tapped && !force) return Promise.resolve();
  const now = performance.now();
  const interrupt = force || (now - lastTouch < TAP_MS && lastLineAt < tapStart);
  lastLineAt = now;
  if (interrupt) {
    spoken += 1; // drops every line still waiting or loading
    hush();
  } else if (queued && queued.text === text && !queued.over) {
    return queued.line; // the same line is already on its way
  }
  const entry = { text, over: false, line: null };
  entry.line = speakLine(text, { mine: spoken, before: interrupt ? Promise.resolve() : current, device }).finally(() => { entry.over = true; });
  queued = entry;
  current = entry.line;
  return entry.line;
}

async function speakLine(text, { mine, before, device }) {
  // With no device voice to fall back on, always ask the server.
  const natural = !device || Date.now() >= voiceDownUntil;
  const loading = natural ? fetchClip(text, gameVoice()) : Promise.resolve("");
  await Promise.race([before, wait(LINE_CAP_MS)]);
  if (mine !== spoken) return; // a tap moved on while this line waited
  const src = await loading;
  if (mine !== spoken) return; // a tap moved on while this line loaded
  hush();
  if (natural) {
    if (src) {
      if (await playClip(src)) return;
      if (mine !== spoken) return;
    } else if (device) {
      voiceDownUntil = Date.now() + 60_000;
    }
  }
  if (device) await deviceSay(text);
}

// Resolves once the line playing now (and any line it is waiting behind) has finished.
export function lineDone() {
  return Promise.race([current, wait(LINE_CAP_MS)]);
}

// For moving to the next screen: waits at least ms, and longer if a line is still playing.
export async function afterLine(ms = 0) {
  await Promise.all([wait(ms), lineDone()]);
}

// Stops the voice now and drops any line still loading.
export function quiet() {
  spoken += 1;
  current = Promise.resolve();
  queued = null;
  hush();
}

export function log(entry) {
  window.MightyProgress?.log(entry);
}

export function practice({ game, skill, step, item, correct }) {
  log({ game, skill, item, correct });
  const who = kid().id;
  if (!who || !step) return;
  fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "practice", kid: who, step, item, correct })
  }).catch(() => {});
}

export function fresh(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function shell(root, title) {
  const who = kid();
  document.body.style.setProperty("--kid", who.color || "#7c6cf0");
  root.replaceChildren();
  const bar = el("div", "bar");
  const home = el("a", "home", "Home");
  home.href = "../";
  bar.append(home, el("h1", "", title), el("p", "who", who.name));
  const stage = el("div", "stage");
  const note = el("p", "note");
  root.append(bar, note, stage);
  return {
    stage,
    say(text) {
      note.textContent = text;
      return say(text);
    }
  };
}

export function streak(state, level, correct) {
  const stars = state.stars || {};
  const rec = stars[level] || { streak: 0 };
  rec.streak = correct ? rec.streak + 1 : 0;
  stars[level] = rec;
  state.stars = stars;
  return rec.streak >= 3;
}
