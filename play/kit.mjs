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
// the speech queue. So nothing speaks until the first tap, and each new line replaces the last
// one so the voice always matches the screen.
let tapped = false;
if (typeof document !== "undefined") {
  const unlock = () => { tapped = true; };
  document.addEventListener("pointerdown", unlock, { capture: true, once: true });
  document.addEventListener("keydown", unlock, { capture: true, once: true });
}

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

export function say(text, { force = false } = {}) {
  if (!text) return Promise.resolve();
  say.last = text;
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth) return Promise.resolve();
  if (!tapped && !force) return Promise.resolve();
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
