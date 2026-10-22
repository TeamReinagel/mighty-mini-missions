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
  return { id: query || "player", name: "friend", color: "#7c6cf0" };
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

export function say(text) {
  if (!text) return Promise.resolve();
  const job = (say.chain || Promise.resolve()).then(() => new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    const timer = setTimeout(resolve, Math.min(8000, 700 + text.length * 70));
    const done = () => { clearTimeout(timer); resolve(); };
    utter.onend = done;
    utter.onerror = done;
    synth.speak(utter);
  }));
  say.chain = job.catch(() => {});
  return job;
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
