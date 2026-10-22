import { openGame, pic, chime, shake, record, el, load, save, fresh, word } from "../play/stage.mjs";

const GAME = "more-or-fewer";
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Lost Sheep", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["field"], prizes: [] };

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.field?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("The sheep are out in the field.");
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/sheep.jpg";
  hero.alt = "";
  const play = el("button", "go play", "Check the pens");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(hero, play);
}

function herd(parent, count) {
  for (let i = 0; i < count; i += 1) {
    const img = document.createElement("img");
    img.src = "assets/sheep.jpg";
    img.alt = "";
    img.className = "mini";
    parent.append(img);
  }
}

async function pens() {
  const cap = (state.stars?.field?.streak || 0) >= 3 ? 6 : 4;
  let left = 1 + Math.floor(rng() * cap);
  let right = 1 + Math.floor(rng() * cap);
  if (left === right) right = left === cap ? left - 1 : left + 1;
  const fewer = rng() < 0.5;
  const answer = fewer ? (left < right ? "left" : "right") : (left > right ? "left" : "right");
  ui.scene.replaceChildren();
  ui.speak(fewer ? "Which pen has fewer sheep?" : "Which pen has more sheep?");
  const row = el("div", "row");
  const made = {};
  for (const side of ["left", "right"]) {
    const pen = el("button", "pen");
    pen.type = "button";
    pen.setAttribute("aria-label", side === "left" ? "left pen" : "right pen");
    herd(pen, side === "left" ? left : right);
    made[side] = pen;
    row.append(pen);
  }
  ui.scene.append(row);
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const side of ["left", "right"]) {
      made[side].addEventListener("click", () => {
        if (settled) return;
        if (side !== answer) {
          clean = false;
          shake(made[side]);
          chime(false);
          ui.speak("Count one pen, then the other pen.");
          return;
        }
        settled = true;
        chime(true);
        resolve(clean);
      });
    }
  });
  return first;
}

async function findMissing() {
  const total = 5 + Math.floor(rng() * 4);
  const missing = 2 + Math.floor(rng() * 2);
  const home = total - missing;
  const tufts = [
    ...Array.from({ length: missing }, () => true),
    ...Array.from({ length: 2 }, () => false)
  ].sort(() => rng() - 0.5);
  ui.scene.replaceChildren();
  const barn = el("div", "pen");
  herd(barn, home);
  ui.scene.append(barn);
  ui.speak(`${word(total)} sheep belong here. ${word(home)} are in the pen. Find the others in the grass.`);
  const field = el("div", "row");
  let found = 0;
  let first = true;
  await new Promise((resolve) => {
    for (const hasSheep of tufts) {
      const button = pic("assets/grass.jpg", "", "grass");
      button.dataset.sheep = hasSheep ? "yes" : "no";
      button.addEventListener("click", () => {
        if (button.disabled) return;
        if (button.dataset.sheep !== "yes") {
          first = false;
          shake(button);
          chime(false);
          ui.speak("Just grass.");
          return;
        }
        button.disabled = true;
        button.querySelector("img").src = "assets/sheep.jpg";
        found += 1;
        chime(true);
        ui.speak(word(found));
        if (found === missing) resolve();
      });
      field.append(button);
    }
    ui.scene.append(field);
  });
  const choices = [missing, missing + 1, Math.max(1, missing - 1)];
  ui.speak("How many were hiding?");
  const row = el("div", "row");
  const picked = await new Promise((resolve) => {
    let clean = first;
    let settled = false;
    for (const choice of [...new Set(choices)]) {
      const button = el("button", "go", String(choice));
      button.type = "button";
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== missing) {
          clean = false;
          shake(button);
          ui.speak(`Count the ones you found. ${word(missing)}.`);
          return;
        }
        settled = true;
        chime(true);
        resolve(clean);
      });
      row.append(button);
    }
    ui.scene.append(row);
  });
  return picked;
}

async function round() {
  const compared = await pens();
  const found = await findMissing();
  const clean = compared && found;
  const opened = record(state, {
    game: GAME,
    level: "field",
    flag: "compare",
    clean,
    prize: clean ? { id: `lamb-${(state.prizes || []).length}`, src: "assets/sheep.jpg", alt: "sheep" } : null,
    skill: "More and fewer",
    item: "sheep"
  });
  ui.stars(state.stars?.field?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "The next field is ready." : clean ? "That sheep came home." : "The farmer is still counting.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
