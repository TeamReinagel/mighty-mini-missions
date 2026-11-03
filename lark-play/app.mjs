// Essential skills, never shown to the child:
// pockets and ant: listening-1, stay with the sound until that sort is finished.
// i-am and strap: problem-solving-1, follow the sound order, then the story object moves.
// folio: listening-2, hold the word just heard and find that cover.

import { activityChoose, activityView, COMPLETIONS, startActivity, startLine } from "./logic.mjs";
import { chime, el, kid, say, shake } from "../play/stage.mjs";

const SVG = {
  apple: `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="46" r="22" fill="#d84a3a"/><path d="M40 24c6-10 16-10 18-2" fill="none" stroke="#6a8f3a" stroke-width="4" stroke-linecap="round"/><rect x="37" y="18" width="4" height="12" rx="2" fill="#6b4423"/></svg>`,
  moon: `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="34" cy="40" r="22" fill="#e2a31b" stroke="#8a5a12" stroke-width="3"/><circle cx="48" cy="32" r="16" fill="#f4ead8"/></svg>`,
  ant: `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="22" cy="40" rx="10" ry="8" fill="#5c3317"/><ellipse cx="40" cy="40" rx="8" ry="7" fill="#6b3e22"/><ellipse cx="58" cy="41" rx="12" ry="10" fill="#5c3317"/><path d="M14 34c-4-8 0-14 6-14M16 32c-6-2-8-10-2-14" fill="none" stroke="#5c3317" stroke-width="2" stroke-linecap="round"/><path d="M34 32l-8-12M40 30v-14M46 32l8-12M34 48l-8 14M40 50v14M46 48l8 14" fill="none" stroke="#5c3317" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  map: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="12" y="16" width="56" height="48" rx="4" fill="#f3e2b8" stroke="#b08958"/><path d="M22 52c10-16 18-6 28-18 4 8 8 6 12-2" fill="none" stroke="#7a4e2d" stroke-width="3" stroke-linecap="round"/></svg>`,
  mouse: `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="36" cy="44" rx="18" ry="14" fill="#e2b15a"/><circle cx="24" cy="30" r="7" fill="#e2b15a"/><circle cx="34" cy="28" r="7" fill="#e2b15a"/><circle cx="26" cy="30" r="2" fill="#3a2a1c"/><path d="M52 46c14 2 18 14 10 18" fill="none" stroke="#e2b15a" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="46" r="2" fill="#3a2a1c"/></svg>`,
  mat: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="10" y="28" width="60" height="28" rx="6" fill="#d86b4a"/><path d="M10 36h60M10 44h60M10 52h60" stroke="#f4d7b0" stroke-width="3"/></svg>`,
  pad: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="14" y="30" width="52" height="24" rx="12" fill="#f0d7a2" stroke="#c49a62"/><rect x="22" y="36" width="36" height="12" rx="6" fill="#fff6e4"/></svg>`,
  bird: `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="44" rx="18" ry="14" fill="#2f8f86"/><circle cx="56" cy="36" r="10" fill="#2f8f86"/><path d="M64 36l12 4-12 4z" fill="#e2b15a"/><circle cx="60" cy="34" r="2" fill="#241c33"/><path d="M22 44c-10 8-8 16 2 14" fill="none" stroke="#2f8f86" stroke-width="4"/></svg>`,
  door: `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="22" y="12" width="36" height="56" rx="4" fill="#c48a4a"/><circle cx="48" cy="42" r="3" fill="#f2c14e"/></svg>`,
  strap: `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M10 28h60v12H10z" fill="#8a5a32"/><path d="M10 44h60v8H10z" fill="#6e4528"/><rect x="30" y="24" width="20" height="32" rx="4" fill="#d7b07a"/></svg>`
};

const query = new URLSearchParams(location.search);
const play = query.get("play") || "";
const scene = query.get("scene") || "";
const review = query.get("review") === "1";
const who = kid();
const titles = {
  pockets: "Two Pockets",
  ant: "Apple or Moon",
  "i-am": "I Am",
  folio: "Map or Mat",
  strap: "Pad the Strap"
};

const root = document.querySelector("#app");
document.body.style.setProperty("--kid", who.color || "#7c6cf0");
document.title = titles[play] ? `${titles[play]} · Lark and Nib` : "Lark and Nib";

const top = el("header", "top");
const home = el("a", "home", "Home");
home.href = "../";
const pips = el("div", "pips");
top.append(home, el("h1", "", titles[play] || "Lark and Nib"), pips, el("p", "who", who.name));
const line = el("p", "line");
const hear = el("button", "hear", "Hear it");
hear.type = "button";
const lineRow = el("div", "line-row");
lineRow.append(line, hear);
const sceneEl = el("main", "scene lark");
root.replaceChildren(top, lineRow, sceneEl);

let state = null;
let reported = false;
let said = "";

hear.addEventListener("click", () => say(line.textContent, { force: true }));

function report(entry) {
  if (review || !entry?.game) return;
  window.MightyProgress?.log({ player: who.name, ...entry });
}

function drawing(name) {
  const node = el("span", "drawing");
  node.innerHTML = SVG[name] || "";
  return node;
}

function wordMark(word) {
  const node = el("span", "word");
  if (!word) return node;
  node.append(el("span", "", word.slice(0, -1)), el("span", "last", word.slice(-1)));
  return node;
}

function paintPips(step, total) {
  pips.replaceChildren();
  for (let i = 0; i < total; i += 1) pips.append(el("span", i < step ? "pip on" : "pip"));
}

function speak(text) {
  line.textContent = text;
  if (text === said) return;
  said = text;
  say(text);
}

function choiceButton(choice) {
  const button = el("button", "pic lark-choice");
  button.type = "button";
  button.dataset.choice = choice.id;
  button.setAttribute("aria-label", choice.label || choice.id);
  if (choice.word) {
    button.append(wordMark(choice.word));
    if (SVG[choice.picture]) button.append(drawing(choice.picture));
  } else if (choice.picture === "letter") {
    button.append(wordMark(choice.letter || choice.id));
  } else {
    button.append(drawing(choice.picture));
    if (choice.letter) button.append(el("span", "letter-mark", choice.letter));
    else if (choice.label) button.append(el("span", "cap", choice.label));
  }
  return button;
}

function render() {
  const view = activityView(state);
  paintPips(view.step, view.total);
  sceneEl.replaceChildren();
  if (view.done) {
    sceneEl.append(drawing(play === "folio" || play === "strap" ? "pad" : "apple"));
    speak(view.prompt);
    return;
  }
  if (view.show && SVG[view.show]) sceneEl.append(drawing(view.show));
  if (view.kind === "blend" || view.kind === "swap") {
    const built = el("div", "built");
    const letters = view.kind === "blend" ? view.built : view.base;
    for (const letter of letters) built.append(el("span", "tile", letter));
    built.append(el("span", "tile blank", ""));
    sceneEl.append(built);
  }
  const row = el("div", "row");
  for (const choice of view.choices) {
    const button = choiceButton(choice);
    button.addEventListener("click", () => onChoice(button, choice.id));
    row.append(button);
  }
  if (view.choices.length) sceneEl.append(row);
  speak(view.prompt);
}

function onChoice(button, choice) {
  const result = activityChoose(state, choice);
  state = result.state;
  if (result.first) {
    report({
      game: `lark-${play}`,
      skill: play === "folio" || play === "strap" ? "Word recognition" : "Letter sounds",
      item: result.item,
      correct: result.correct
    });
  }
  if (!result.correct) {
    shake(button);
    chime(false);
    said = "";
    speak(result.feedback);
    return;
  }
  chime(true);
  if (result.complete && !reported) {
    reported = true;
    report({
      game: `lark-${play}`,
      skill: "Story participation",
      item: COMPLETIONS[play],
      correct: null,
      extra: { completed: true, play }
    });
  }
  render();
}

function begin() {
  state = startActivity(play, { scene });
  if (!state) {
    speak("This game opens from Today with Joyce.");
    return;
  }
  said = "";
  render();
}

if (!startActivity(play, { scene })) {
  speak("This game opens from Today with Joyce.");
} else {
  const start = el("button", "go play", "Start");
  start.type = "button";
  sceneEl.append(drawing(play === "folio" || play === "strap" ? "pad" : "mouse"), start);
  speak(startLine(play));
  start.addEventListener("click", begin);
}
