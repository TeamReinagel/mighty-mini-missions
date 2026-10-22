import { openGame, pic, chime, shake, record, forceOpen, levelRow, el, kid, load, save, fresh, word, stepParam } from "../play/stage.mjs";

const GAME = "snack-count";
const SCOOPS = ["assets/berry.png", "assets/cocoa.png", "assets/vanilla.png"];
const CONE_AT = 5;
const ROW = 5;
const LADDERS = {
  ethan: [
    { id: "3", label: "To 3", min: 1, max: 3, flag: "count-3" },
    { id: "5", label: "To 5", min: 1, max: 5, flag: "count-5" }
  ],
  connor: [
    { id: "5", label: "To 5", min: 1, max: 5, flag: "count-5" },
    { id: "10", label: "To 10", min: 6, max: 10, flag: "count-10" },
    { id: "20", label: "To 20", min: 11, max: 20, flag: "count-20" }
  ],
  gabi: [
    { id: "10", label: "To 10", min: 1, max: 10, flag: "count-10" },
    { id: "20", label: "To 20", min: 11, max: 20, flag: "count-20" },
    { id: "names", label: "Names", min: 1, max: 10, flag: "numbers" }
  ]
};
const STEPS = {
  "ethan-count": "3",
  "connor-count-5": "5",
  "connor-count-10": "10",
  "connor-count-20": "20",
  "gabi-count-10": "10",
  "gabi-count-20": "20",
  "gabi-numbers": "names"
};

const ladder = LADDERS[kid().id] || LADDERS.gabi;
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Sundae Stand", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: [ladder[0].id], prizes: [] };
forceOpen(state, ladder.map((item) => item.id), STEPS[stepParam()]);
if (!state.open?.length) state.open = [ladder[0].id];
let level = state.open.at(-1);

function spec() {
  return ladder.find((item) => item.id === level) || ladder[0];
}

function orderSize() {
  const item = spec();
  return item.min + Math.floor(rng() * (item.max - item.min + 1));
}

function vesselFor(count) {
  return count <= CONE_AT ? "cone" : "dish";
}

function layer(box, src, { x, y, w, z, rotate, cls }) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  if (cls) img.className = cls;
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.width = `${w}px`;
  img.style.zIndex = String(z);
  if (rotate) img.style.rotate = `${rotate}deg`;
  box.append(img);
  return img;
}

/** A sundae built from real parts: scoops stack on a cone, or sit in rows of five in a dish. */
function sundae(count, vessel, unit, { capacity = count, cherry = false, fresh: freshest = false } = {}) {
  const u = unit;
  const box = el("div", `sundae ${vessel}`);
  const tilt = (i) => [-3, 2, -1, 3, -2][i % 5];
  if (vessel === "cone") {
    const coneW = 0.8 * u;
    const coneH = coneW * (420 / 218);
    const step = 0.7 * u;
    const head = 0.8 * u + 0.45 * u;
    const H = coneH + head + (Math.max(capacity, 1) - 1) * step;
    const width = 1.3 * u;
    box.style.width = `${width}px`;
    box.style.height = `${H}px`;
    const coneTop = H - coneH;
    layer(box, "assets/cone.png", { x: (width - coneW) / 2, y: coneTop, w: coneW, z: 1 });
    for (let i = 0; i < count; i += 1) {
      const nudge = [0, 0.04, -0.03, 0.02, -0.04][i % 5] * u;
      layer(box, SCOOPS[i % SCOOPS.length], {
        x: (width - u) / 2 + nudge,
        y: coneTop - 0.8 * u - i * step,
        w: u,
        z: 2 + i,
        rotate: tilt(i),
        cls: freshest && i === count - 1 ? "scoop new" : "scoop"
      });
    }
    if (cherry && count > 0) {
      layer(box, "assets/cherry.png", { x: (width - 0.34 * u) / 2, y: coneTop - 0.8 * u - (count - 1) * step - 0.22 * u, w: 0.34 * u, z: 40 });
    }
    return box;
  }
  const dishW = 5.7 * u;
  const dishH = dishW * (344 / 900);
  const rows = Math.max(1, Math.ceil(Math.max(capacity, 1) / ROW));
  const rise = 0.62 * u;
  const frontTop = 0.67 * u;
  const above = Math.max(0, (rows - 1) * rise - frontTop) + 0.45 * u;
  box.style.width = `${dishW}px`;
  box.style.height = `${above + dishH}px`;
  layer(box, "assets/dish.png", { x: 0, y: above, w: dishW, z: 1 });
  const left = (dishW - (ROW - 1) * 0.96 * u - u) / 2;
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / ROW);
    const col = i % ROW;
    const shift = row % 2 ? 0.45 * u : 0;
    layer(box, SCOOPS[i % SCOOPS.length], {
      x: left + col * 0.96 * u + shift - (row % 2 ? 0.22 * u : 0),
      y: above + frontTop - row * rise,
      w: u,
      z: 2 + (rows - row) * 10 + col,
      rotate: tilt(i),
      cls: freshest && i === count - 1 ? "scoop new" : "scoop"
    });
  }
  const front = layer(box, "assets/dish.png", { x: 0, y: above, w: dishW, z: 60 });
  front.style.clipPath = "inset(54% 0 0 0)";
  if (cherry && count > 0) {
    const row = Math.floor((count - 1) / ROW);
    const col = (count - 1) % ROW;
    layer(box, "assets/cherry.png", {
      x: left + col * 0.96 * u + (row % 2 ? 0.23 * u : 0) + 0.33 * u,
      y: above + frontTop - row * rise - 0.2 * u,
      w: 0.34 * u,
      z: 70
    });
  }
  return box;
}

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("A bunny is at the counter.");
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/bunny.jpg";
  hero.alt = "";
  const play = el("button", "go play", "Open the shop");
  play.type = "button";
  play.addEventListener("click", () => round());
  levelRow(ui.scene, ladder, state, level, (id) => { level = id; lobby(); });
  ui.scene.append(hero, play);
}

function buildUnit(vessel, count) {
  if (vessel === "dish") return 54;
  return count <= 3 ? 66 : 50;
}

function chooseUnit(vessel, biggest) {
  if (vessel === "dish") return 40;
  return biggest <= 3 ? 52 : 42;
}

async function buildOrder(count, names) {
  ui.scene.replaceChildren();
  const vessel = vesselFor(count);
  const holder = vessel === "cone" ? "on a cone" : "in the dish";
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/bunny.jpg";
  hero.alt = "Serve the bunny";
  const number = el("p", "big-num", names ? String(count) : "");
  const counter = el("div", "counter");
  const pair = el("div", "pair");
  pair.append(hero, number, counter);
  ui.scene.append(pair);
  let made = 0;
  let first = true;
  const paint = ({ plop = false, cherry = false } = {}) => {
    counter.replaceChildren(sundae(made, vessel, buildUnit(vessel, count), { capacity: count, cherry, fresh: plop }));
  };
  paint();
  ui.speak(names
    ? `This card says ${word(count)}. Put that many scoops ${holder}, then tap the bunny.`
    : `The bunny wants ${word(count)} ${count === 1 ? "scoop" : "scoops"} ${holder}. Add them, then tap the bunny.`);
  const add = pic(SCOOPS[0], "Add a scoop", "add");
  add.classList.add("scooper");
  const serve = el("button", "go play", "Serve");
  serve.type = "button";
  const buttons = el("div", "row");
  buttons.append(add, serve);
  ui.scene.append(buttons);
  await new Promise((resolve) => {
    const give = () => {
      if (made === count) resolve();
      else {
        first = false;
        shake(serve);
        ui.speak(`Not yet. I asked for ${word(count)}.`);
      }
    };
    add.addEventListener("click", () => {
      if (made >= count) {
        first = false;
        shake(add);
        chime(false);
        ui.speak(`That's enough. I asked for ${word(count)}.`);
        return;
      }
      made += 1;
      chime(true);
      ui.speak(word(made));
      add.querySelector("img").src = SCOOPS[made % SCOOPS.length];
      paint({ plop: true });
    });
    hero.addEventListener("click", give);
    serve.addEventListener("click", give);
  });
  paint({ cherry: true });
  hero.src = "assets/bunny-happy.jpg";
  chime(true);
  ui.speak("Here you go!");
  await new Promise((resolve) => setTimeout(resolve, 1300));
  return first;
}

async function chooseSundae(count, names) {
  ui.scene.replaceChildren();
  const wrongs = [count - 1, count + 1, count + 2].filter((n) => n > 0 && n !== count).slice(0, 2);
  const choices = [count, ...wrongs].sort(() => rng() - 0.5);
  const vessel = vesselFor(Math.max(...choices));
  const unit = chooseUnit(vessel, Math.max(...choices));
  ui.speak(names
    ? `The card says ${word(count)}. Tap that sundae.`
    : `This bunny wants ${word(count)}. Tap that sundae.`);
  const row = el("div", "row");
  let first = true;
  let settled = false;
  const picked = await new Promise((resolve) => {
    for (const choice of choices) {
      const button = el("button", "pic");
      button.type = "button";
      button.setAttribute("aria-label", `${choice} ${choice === 1 ? "scoop" : "scoops"}`);
      button.append(sundae(choice, vessel, unit, { capacity: Math.max(...choices) }));
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== count) {
          first = false;
          shake(button);
          chime(false);
          ui.speak(`Count again. That is ${word(choice)}.`);
          return;
        }
        settled = true;
        chime(true);
        resolve(first);
      });
      row.append(button);
    }
    ui.scene.append(row);
  });
  return picked;
}

async function round() {
  const count = orderSize();
  const names = spec().id === "names";
  const built = await buildOrder(count, names);
  const chosen = await chooseSundae(count, names);
  const clean = built && chosen;
  const item = spec();
  const next = ladder[ladder.findIndex((entry) => entry.id === item.id) + 1];
  const opened = record(state, {
    game: GAME,
    level: item.id,
    flag: item.flag,
    next: next?.id,
    clean,
    prize: clean ? { id: `cherry-${(state.prizes || []).length}`, src: "assets/cherry.png", alt: "cherry" } : null,
    skill: "Counting",
    item: `${count} scoops`
  });
  ui.stars(state.stars?.[item.id]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "The next order is ready." : clean ? "The bunny left a cherry." : "The shop is still open.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
