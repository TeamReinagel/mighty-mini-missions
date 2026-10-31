// Essential skill: planning-3 (Working carefully). The child counts the scoops and
// serves when the sundae matches the order. Extra scoops still land, so the stand
// never signals when to stop.
import { fewestCoins } from "../play/rounds.mjs";
import { openGame, pic, chime, shake, record, forceOpen, levelRow, el, kid, load, save, fresh, word, stepParam, practice } from "../play/stage.mjs";
import { checkOrder, emptyPrompt, missPrompt, orderPrompt, placeScoops } from "./stand.mjs";

const GAME = "snack-count";
const SCOOPS = ["assets/berry.png", "assets/cocoa.png", "assets/vanilla.png"];
const CONE_AT = 5;
const ROW = 5;
const DISH = 10;
const COIN_ART = {
  1: "../coin-record-run/assets/coin_1.png",
  5: "../coin-record-run/assets/coin_5.png",
  10: "../coin-record-run/assets/coin_10.png",
  25: "../coin-record-run/assets/coin_25.png"
};
const COIN_NAME = { 1: "penny", 5: "nickel", 10: "dime", 25: "quarter" };
const ADD_ART = { 10: SCOOPS[2], 5: SCOOPS[1], 1: SCOOPS[0] };
// Party levels have `adds` (the scoop buttons) and `coins` (what the bunny can pay with).
// Each scoop costs one cent, so a full dish of ten is a dime.
const LADDERS = {
  max: [
    { id: "fives", label: "Fives", min: 12, max: 45, adds: [5, 1], coins: [5, 1], skill: "Counting" },
    { id: "tens", label: "Tens", min: 21, max: 99, adds: [10, 1], coins: [10, 1], skill: "Place value (tens) (2nd)" },
    { id: "party", label: "Party", min: 35, max: 99, adds: [10, 5, 1], coins: [10, 5, 1], skill: "Place value (tens) (2nd)" },
    { id: "quarters", label: "Quarters", min: 26, max: 99, adds: [10, 5, 1], coins: [25, 10, 5, 1], skill: "Place value (tens) (2nd)" }
  ],
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
function sundae(count, vessel, unit, { capacity = count, cherry = false, fresh: freshest = false, newFrom = freshest ? count - 1 : Infinity, flavor = null } = {}) {
  const u = unit;
  const box = el("div", `sundae ${vessel}`);
  const tilt = (i) => [-3, 2, -1, 3, -2][i % 5];
  const art = (i) => SCOOPS[(flavor ?? i) % SCOOPS.length];
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
      layer(box, art(i), {
        x: (width - u) / 2 + nudge,
        y: coneTop - 0.8 * u - i * step,
        w: u,
        z: 2 + i,
        rotate: tilt(i),
        cls: i >= newFrom ? "scoop new" : "scoop"
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
    layer(box, art(i), {
      x: left + col * 0.96 * u + shift - (row % 2 ? 0.22 * u : 0),
      y: above + frontTop - row * rise,
      w: u,
      z: 2 + (rows - row) * 10 + col,
      rotate: tilt(i),
      cls: i >= newFrom ? "scoop new" : "scoop"
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

/** A party order sits in dishes of ten, one flavor per dish, so the tens are easy to see. */
function tray(count, unit, { from = count, cherry = false } = {}) {
  const box = el("div", "tray");
  const dishes = Math.max(1, Math.ceil(count / DISH));
  for (let d = 0; d < dishes; d += 1) {
    const here = Math.max(0, Math.min(DISH, count - d * DISH));
    box.append(sundae(here, "dish", unit, { capacity: DISH, flavor: d, newFrom: from - d * DISH, cherry: cherry && d === dishes - 1 }));
  }
  return box;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(spec().adds ? "Party orders are in. A full dish holds ten scoops." : "A bunny is at the counter.");
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

function prefersStill() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Adding never checks the order. Serving does. A miss leaves the scoops to be counted. */
function runStand({ count, adds, back, serve, hero, counter, prompt, emptyLine, missLine, paint, onPlaced }) {
  let made = 0;
  const stack = [];
  let first = true;
  let settled = false;
  let reviewing = false;
  const sync = () => {
    const locked = settled || reviewing;
    for (const button of adds) button.disabled = locked;
    if (back) back.disabled = locked || stack.length === 0;
  };
  return new Promise((resolve) => {
    const give = () => {
      if (settled) return;
      if (reviewing) {
        reviewing = false;
        made = 0;
        stack.length = 0;
        serve.textContent = "Serve";
        paint(0, {});
        sync();
        ui.speak(prompt);
        return;
      }
      if (made === 0) {
        first = false;
        chime(false);
        ui.speak(emptyLine);
        return;
      }
      const verdict = checkOrder(made, count);
      if (verdict === "exact") {
        settled = true;
        serve.disabled = true;
        sync();
        resolve(first);
        return;
      }
      first = false;
      reviewing = true;
      serve.textContent = "Try again";
      sync();
      if (!prefersStill()) shake(counter);
      chime(false);
      ui.speak(missLine(verdict));
    };
    for (const button of adds) {
      button.addEventListener("click", () => {
        if (settled || reviewing) return;
        const size = placeScoops(0, button.dataset.value);
        const before = made;
        stack.push(size);
        made = placeScoops(made, size);
        chime(true);
        if (onPlaced) onPlaced(made);
        paint(made, { plop: true, from: before });
        sync();
        if (document.querySelector(".line")?.textContent !== prompt) ui.speak(prompt);
      });
    }
    if (back) {
      back.addEventListener("click", () => {
        if (settled || reviewing || stack.length === 0) return;
        made -= stack.pop();
        if (onPlaced) onPlaced(made);
        paint(made, { from: made });
        sync();
      });
    }
    hero.addEventListener("click", give);
    serve.addEventListener("click", give);
    sync();
    ui.speak(prompt);
  });
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
  const say = word;
  const prompt = orderPrompt({ count, names, holder, say });
  const unit = buildUnit(vessel, count);
  const paint = (made, { plop = false } = {}) => {
    counter.replaceChildren(sundae(made, vessel, unit, { capacity: Math.max(made, 1), fresh: plop }));
  };
  paint(0);
  const add = pic(SCOOPS[0], "Add a scoop", "1");
  add.classList.add("scooper");
  const back = el("button", "level", "Put back");
  back.type = "button";
  const serve = el("button", "go play", "Serve");
  serve.type = "button";
  const buttons = el("div", "row");
  buttons.append(add, back, serve);
  ui.scene.append(buttons);
  const first = await runStand({
    count,
    adds: [add],
    back,
    serve,
    hero,
    counter,
    prompt,
    emptyLine: emptyPrompt({ count, names, holder, say }),
    missLine: (verdict) => missPrompt({ verdict, count, names, holder, say }),
    paint,
    onPlaced: (made) => {
      add.querySelector("img").src = SCOOPS[made % SCOOPS.length];
    }
  });
  counter.replaceChildren(sundae(count, vessel, unit, { capacity: count, cherry: true }));
  hero.src = "assets/bunny-happy.jpg";
  chime(true);
  ui.speak("Here you go!");
  await wait(1300);
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

async function buildParty(count, item) {
  ui.scene.replaceChildren();
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/bunny.jpg";
  hero.alt = "Serve the bunny";
  const pair = el("div", "pair");
  pair.append(hero, el("p", "big-num", String(count)));
  const counter = el("div", "counter");
  ui.scene.append(pair, counter);
  const unit = count > 40 ? 22 : 30;
  const say = word;
  const prompt = orderPrompt({ count, party: true, say });
  const paint = (made, opts = {}) => {
    counter.replaceChildren(tray(made, unit, { from: opts.from ?? made }));
  };
  paint(0);
  const buttons = el("div", "row");
  const adds = item.adds.map((size) => {
    const add = pic(ADD_ART[size], `+${size}`, String(size));
    add.classList.add("scooper");
    add.setAttribute("aria-label", `Add ${size}`);
    buttons.append(add);
    return add;
  });
  const back = el("button", "level", "Put back");
  back.type = "button";
  const serve = el("button", "go play", "Serve");
  serve.type = "button";
  buttons.append(back, serve);
  ui.scene.append(buttons);
  const first = await runStand({
    count,
    adds,
    back,
    serve,
    hero,
    counter,
    prompt,
    emptyLine: emptyPrompt({ count, party: true, say }),
    missLine: (verdict) => missPrompt({ verdict, count, party: true, say }),
    paint
  });
  counter.replaceChildren(tray(count, unit, { cherry: true }));
  hero.src = "assets/bunny-happy.jpg";
  chime(true);
  ui.speak("Here you go!");
  await wait(1300);
  return first;
}

/** One scoop costs one cent. The bunny pays exactly; using the fewest coins earns a bonus coin. */
async function payBill(price, item) {
  ui.scene.replaceChildren();
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/bunny-happy.jpg";
  hero.alt = "";
  const pair = el("div", "pair");
  pair.append(hero, el("p", "big-num", `${price}¢`));
  const till = el("div", "row till");
  ui.scene.append(pair, till);
  const coins = [...item.coins].sort((a, b) => b - a);
  const best = fewestCoins(price, coins);
  ui.speak(`That's ${price} cents. Help the bunny pay. Can you do it with just ${best} coins?`);
  let paid = 0;
  let used = 0;
  let exact = true;
  let settled = false;
  await new Promise((resolve) => {
    const purse = el("div", "row");
    for (const coin of coins) {
      const button = pic(COIN_ART[coin], `${coin}¢`, String(coin));
      button.classList.add("coin");
      button.setAttribute("aria-label", COIN_NAME[coin]);
      button.addEventListener("click", () => {
        if (settled) return;
        if (paid + coin > price) {
          exact = false;
          shake(button);
          chime(false);
          ui.speak(`A ${COIN_NAME[coin]} makes ${paid + coin}. Too much. Try a smaller coin.`);
          return;
        }
        paid += coin;
        used += 1;
        const dropped = document.createElement("img");
        dropped.src = COIN_ART[coin];
        dropped.alt = COIN_NAME[coin];
        till.append(dropped);
        chime(true);
        if (paid === price) {
          settled = true;
          resolve();
        } else {
          ui.speak(`${paid} cents`);
        }
      });
      purse.append(button);
    }
    ui.scene.append(purse);
  });
  const fewest = used === best;
  ui.speak(fewest ? `Paid with ${used} coins. Record pay!` : `Paid! Next time, try it with ${best} coins.`);
  await wait(1600);
  return { exact, fewest };
}

async function partyRound() {
  const item = spec();
  const count = orderSize();
  const built = await buildParty(count, item);
  const pay = await payBill(count, item);
  const clean = built && pay.exact;
  const next = ladder[ladder.findIndex((entry) => entry.id === item.id) + 1];
  const wasOpen = Boolean(next && (state.open || []).includes(next.id));
  state.prizes = state.prizes || [];
  if (clean && pay.fewest) {
    const top = Math.max(...item.coins);
    state.prizes.push({ id: `coin-${state.prizes.length}`, src: COIN_ART[top], alt: COIN_NAME[top] });
  }
  const opened = record(state, {
    game: GAME,
    level: item.id,
    next: next?.id,
    clean,
    prize: clean ? { id: `cherry-${state.prizes.length}`, src: "assets/cherry.png", alt: "cherry" } : null,
    skill: item.skill,
    item: `${count} scoops`
  });
  practice({ game: GAME, skill: "Counting coins (2nd)", step: "", item: `${count} cents`, correct: pay.exact });
  ui.stars(state.stars?.[item.id]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened && next && !wasOpen ? "A bigger party is ready." : clean ? "The bunny left a cherry." : "The shop is still open.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

async function round() {
  if (spec().adds) return partyRound();
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
