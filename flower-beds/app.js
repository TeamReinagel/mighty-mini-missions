// Essential skill: planning-3 (Working carefully). She counts the flowers and taps the
// watering can when the beds match the card. Extra flowers still go in the next pot,
// so the garden never signals when to stop.
import { openGame, chime, shake, record, el, load, save, fresh, word } from "../play/stage.mjs";
import { gardenEmpty, gardenMiss, gardenPrompt, gardenRemind, nearby, shape, splitBeds } from "./beds.mjs";

const GAME = "flower-beds";
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Flower Beds", background: "assets/bg.jpg" });
ui.scene.classList.add("garden-scene");
const state = load(GAME) || { stars: {}, open: ["beds"], prizes: [] };

function picture(src, className) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  if (className) img.className = className;
  return img;
}

function piece(filled) {
  return picture(filled ? "assets/flower.png" : "assets/pot.png", filled ? "bloom" : "");
}

function bed(filled, start, { next, fresh }) {
  const box = el("div", filled === 10 ? "bed full" : "bed");
  box.setAttribute("aria-label", start === 0 ? "first bed" : "second bed");
  for (let i = 0; i < 10; i += 1) {
    const index = start + i;
    const planted = i < filled;
    const isNext = next && i === filled;
    const spot = el(isNext ? "button" : "div", ["pot", planted ? "filled" : isNext ? "next" : "wait", index === fresh ? "fresh" : ""].filter(Boolean).join(" "));
    if (isNext) {
      spot.type = "button";
      spot.setAttribute("aria-label", "Plant the next flower");
    }
    spot.append(piece(planted));
    box.append(spot);
  }
  return box;
}

function view(count, { next = false, fresh = -1, layout = "stack" } = {}) {
  const { first, second } = splitBeds(count);
  const garden = el("div", layout === "row" ? "garden row-beds" : "garden stack-beds");
  garden.append(bed(first, 0, { next: next && count < 10, fresh }));
  garden.append(bed(second, 10, { next: next && count >= 10 && count < 20, fresh }));
  return garden;
}

function wateringCan() {
  const button = el("button", "can");
  button.type = "button";
  button.setAttribute("aria-label", "Watering can");
  button.append(picture("assets/can.png"), el("span", "cap", ""));
  return button;
}

function askHint(onHint) {
  const hint = el("button", "hint");
  hint.type = "button";
  hint.setAttribute("aria-label", "Count with me");
  hint.append(picture("assets/glass.png"));
  hint.addEventListener("click", onHint);
  return hint;
}

function orderSize() {
  return 10 + Math.floor(rng() * 11);
}

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.beds?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("A full bed holds ten. Tap the seed.");
  const model = el("div", "garden stack-beds");
  model.append(bed(10, 0, { next: false, fresh: -1 }));
  const play = el("button", "seed");
  play.type = "button";
  play.setAttribute("aria-label", "Seed");
  play.append(picture("assets/seed.png"));
  play.addEventListener("click", () => round());
  ui.scene.append(model, play);
}

function prefersStill() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function plant(count) {
  ui.scene.replaceChildren();
  const stage = el("div", "gardens");
  const done = wateringCan();
  const back = el("button", "level", "Put back");
  back.type = "button";
  const row = el("div", "row tools");
  const say = word;
  const prompt = gardenPrompt(count, say);
  let made = 0;
  let clean = true;
  let settled = false;
  let reviewing = false;
  const paint = (fresh = -1) => {
    stage.replaceChildren(view(made, { next: !reviewing && made < 20, fresh, layout: "stack" }));
    back.disabled = reviewing || made === 0;
    done.setAttribute("aria-label", reviewing ? "Try again" : "Watering can");
    done.querySelector(".cap").textContent = reviewing ? "Try again" : "";
  };
  const hint = askHint(() => {
    if (settled) return;
    ui.speak(gardenRemind(count, say));
  });
  row.append(hint, back, done);
  ui.scene.append(el("p", "big-num", String(count)), stage, row);
  paint();
  ui.speak(prompt);
  await new Promise((resolve) => {
    stage.addEventListener("click", (event) => {
      if (settled || reviewing || !event.target.closest(".pot.next")) return;
      if (made >= 20) return;
      made += 1;
      chime(true);
      paint(made - 1);
      if (document.querySelector(".line")?.textContent !== prompt) ui.speak(prompt);
    });
    back.addEventListener("click", () => {
      if (settled || reviewing || made === 0) return;
      made -= 1;
      paint();
    });
    done.addEventListener("click", () => {
      if (settled) return;
      if (reviewing) {
        reviewing = false;
        made = 0;
        paint();
        ui.speak(prompt);
        return;
      }
      if (made === 0) {
        clean = false;
        chime(false);
        ui.speak(gardenEmpty(count, say));
        return;
      }
      const verdict = made < count ? "short" : made > count ? "over" : "exact";
      if (verdict === "exact") {
        settled = true;
        chime(true);
        resolve();
        return;
      }
      clean = false;
      reviewing = true;
      paint();
      if (!prefersStill()) shake(stage);
      chime(false);
      ui.speak(gardenMiss(verdict, count, say));
    });
  });
  return clean;
}

async function choose(count) {
  ui.scene.replaceChildren();
  const options = nearby(count).sort(() => rng() - 0.5);
  const column = el("div", "choices");
  let hinted = false;
  let settled = false;
  const hint = askHint(() => {
    if (settled) return;
    hinted = true;
    ui.speak(`A full bed is ten. ${shape(count, word)}`);
  });
  ui.scene.append(el("p", "big-num", String(count)), column, hint);
  ui.speak(`The card says ${word(count)}. Tap that garden.`);
  let clean = true;
  await new Promise((resolve) => {
    for (const choice of options) {
      const button = el("button", "garden-choice");
      button.type = "button";
      button.setAttribute("aria-label", `${choice} flowers`);
      button.append(view(choice, { layout: "row" }));
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== count) {
          clean = false;
          button.classList.add("tried");
          shake(button);
          chime(false);
          ui.speak(`That garden has ${word(choice)}. ${shape(choice, word)}`);
          return;
        }
        settled = true;
        chime(true);
        ui.speak(`${word(count)}. ${shape(count, word)}`);
        resolve();
      });
      column.append(button);
    }
  });
  return clean && !hinted;
}

async function round() {
  const count = orderSize();
  const planted = await plant(count);
  const chosen = await choose(count);
  const clean = planted && chosen;
  record(state, {
    game: GAME,
    level: "beds",
    flag: "count-20",
    clean,
    prize: clean ? { id: `flower-${(state.prizes || []).length}`, src: "assets/flower.png", alt: "flower" } : null,
    skill: "Counting",
    item: `${count} flowers`
  });
  ui.stars(state.stars?.beds?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(clean ? "A flower for the shelf." : "The beds are still open.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
