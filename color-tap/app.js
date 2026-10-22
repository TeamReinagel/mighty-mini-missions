import { openGame, pic, chime, shake, record, el, load, save, fresh } from "../play/stage.mjs";

const GAME = "color-tap";
const FOODS = [
  { id: "red", src: "assets/apple.jpg", name: "red apple" },
  { id: "blue", src: "assets/blue.jpg", name: "blueberries" },
  { id: "yellow", src: "assets/lemon.jpg", name: "lemon" },
  { id: "green", src: "assets/pear.jpg", name: "pear" }
];
const TOYS = [
  { id: "red", src: "assets/ball.jpg", name: "red ball" },
  { id: "yellow", src: "assets/duck.jpg", name: "yellow duck" },
  { id: "blue", src: "assets/cup.jpg", name: "blue cup" },
  { id: "green", src: "assets/frog.jpg", name: "green frog" }
];

const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Dino Picnic", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["picnic"], prizes: [] };
let level = "picnic";

function pickColor() {
  return FOODS[Math.floor(rng() * FOODS.length)].id;
}

function lobby() {
  ui.scene.replaceChildren();
  ui.scene.classList.remove("picnic");
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("The little dino is hungry.");
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/dino.jpg";
  hero.alt = "";
  const play = el("button", "go play", "Start the picnic");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(hero, play);
}

async function feed(color) {
  ui.scene.replaceChildren();
  ui.scene.classList.remove("picnic");
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/dino.jpg";
  hero.alt = "";
  ui.scene.append(hero);
  ui.speak(`Feed the dino something ${color}.`);
  const row = el("div", "row");
  let first = true;
  const ok = await new Promise((resolve) => {
    for (const food of FOODS) {
      const button = pic(food.src, food.name, food.id);
      button.addEventListener("click", () => {
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (food.id !== color) {
          first = false;
          shake(button);
          chime(false);
          ui.speak(`That one is ${food.id}. The dino wants ${color}.`);
          setTimeout(() => resolve(false), 700);
          return;
        }
        chime(true);
        hero.classList.add("launch");
        resolve(true);
      });
      row.append(button);
    }
    ui.scene.append(row);
  });
  return ok && first;
}

async function blanket(color) {
  const pool = [...FOODS, ...TOYS].filter((item, index, list) => list.findIndex((entry) => entry.src === item.src) === index);
  const wanted = pool.filter((item) => item.id === color);
  const decoys = pool.filter((item) => item.id !== color).slice(0, 3);
  const items = [...wanted, ...decoys].sort(() => rng() - 0.5);
  ui.scene.replaceChildren();
  ui.scene.classList.add("picnic");
  ui.speak(`Set every ${color} thing on the blanket. Tap each one.`);
  const meadow = el("div", "meadow");
  const cloth = el("div", "blanket-zone");
  let first = true;
  let got = 0;
  await new Promise((resolve) => {
    for (const item of items) {
      const button = pic(item.src, item.name, item.id);
      button.addEventListener("click", () => {
        if (button.disabled) return;
        if (item.id !== color) {
          first = false;
          shake(button);
          chime(false);
          ui.speak(`That one is ${item.id}. Leave it in the grass.`);
          return;
        }
        button.disabled = true;
        button.classList.add("small", "landed");
        button.querySelector(".cap")?.remove();
        cloth.append(button);
        got += 1;
        chime(true);
        ui.speak(item.name);
        if (got === wanted.length) resolve();
      });
      meadow.append(button);
    }
    ui.scene.append(meadow, cloth);
  });
  return first;
}

async function round() {
  const color = pickColor();
  const fed = await feed(color);
  const packed = await blanket(pickColor());
  const clean = fed && packed;
  const opened = record(state, {
    game: GAME,
    level,
    flag: "colors",
    clean,
    prize: clean ? { id: `dino-${(state.prizes || []).length}`, src: "assets/dino.jpg", alt: "dino" } : null,
    skill: "Colors",
    item: color
  });
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "A new picnic friend can come next time." : clean ? "The dino saved you a flower." : "The dino is still hungry.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
