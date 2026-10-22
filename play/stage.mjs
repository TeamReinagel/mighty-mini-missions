import { kid, say, load, save, markReady, practice, stepParam, el, streak, fresh, word } from "./kit.mjs";

export { kid, say, load, save, markReady, practice, stepParam, el, streak, fresh, word };

export function openGame(root, { title, background }) {
  const who = kid();
  document.body.style.setProperty("--kid", who.color || "#7c6cf0");
  root.replaceChildren();
  const top = el("header", "top");
  const home = el("a", "home", "Home");
  home.href = "../";
  const stars = el("div", "pips");
  top.append(home, el("h1", "", title), stars, el("p", "who", who.name));
  const line = el("p", "line");
  const hear = el("button", "hear", "Hear it");
  hear.type = "button";
  hear.setAttribute("aria-label", "Hear the instructions again");
  hear.addEventListener("click", () => say(line.textContent, { force: true }));
  const lineRow = el("div", "line-row");
  lineRow.append(line, hear);
  const scene = el("main", "scene");
  scene.style.backgroundImage = `linear-gradient(rgba(20,16,30,.12), rgba(20,16,30,.02)), url("${background}")`;
  const shelf = el("section", "shelf");
  root.append(top, lineRow, scene, shelf);
  return {
    scene,
    who,
    speak(text) {
      line.textContent = text;
      return say(text);
    },
    stars(n) {
      stars.replaceChildren();
      for (let i = 0; i < 3; i += 1) stars.append(el("span", i < n ? "pip on" : "pip"));
    },
    prizes(list) {
      shelf.replaceChildren();
      if (!list?.length) {
        shelf.append(el("p", "who", "Prizes land here."));
        return;
      }
      for (const prize of list) {
        const img = document.createElement("img");
        img.src = prize.src;
        img.alt = prize.alt || "prize";
        shelf.append(img);
      }
    }
  };
}

export function pic(src, label, value) {
  const button = el("button", "pic");
  button.type = "button";
  button.dataset.value = value ?? label ?? "";
  button.setAttribute("aria-label", label || value || "choice");
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  button.append(img);
  if (label) button.append(el("span", "cap", label));
  return button;
}

export function chime(good) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = good ? 660 : 196;
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* a quiet tablet is fine */ }
}

export function shake(node) {
  node.classList.remove("bad");
  void node.offsetWidth;
  node.classList.add("bad");
}

export function record(state, { game, level, flag, next, clean, prize, skill, item }) {
  const opened = streak(state, level, clean);
  state.prizes = state.prizes || [];
  if (clean && prize && !state.prizes.some((entry) => entry.id === prize.id)) state.prizes.push(prize);
  if (opened && flag) markReady(flag);
  if (opened && next && !(state.open || []).includes(next)) state.open = [...(state.open || []), next];
  save(game, state);
  practice({ game, skill, step: stepParam(), item, correct: clean });
  return opened;
}

export function forceOpen(state, ids, forced) {
  const index = ids.indexOf(forced);
  if (index < 0) return;
  const have = new Set(state.open || []);
  ids.slice(0, index + 1).forEach((id) => have.add(id));
  state.open = [...have];
}

export function levelRow(parent, specs, state, current, onPick) {
  const row = el("div", "row");
  for (const spec of specs) {
    const button = el("button", spec.id === current ? "level on" : "level", spec.label);
    button.type = "button";
    button.disabled = !(state.open || []).includes(spec.id);
    button.addEventListener("click", () => onPick(spec.id));
    row.append(button);
  }
  parent.append(row);
}
