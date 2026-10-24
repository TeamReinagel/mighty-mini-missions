import { addWithTrade, subWithTrade } from "../play/rounds.mjs";
import { openGame, pic, chime, shake, record, forceOpen, levelRow, el, kid, load, save, fresh, word, stepParam } from "../play/stage.mjs";

const GAME = "block-trade";
const LEVELS = [
  { id: "show", label: "First launch" },
  { id: "add", label: "Add a cargo" },
  { id: "sub", label: "Send cargo home" }
];
const FLAGS = { show: "trade-show", add: "trade-add", sub: "trade-sub" };
const STEPS = { "max-regroup-show": "show", "max-regroup": "add" };
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Moon Crates", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["show"], prizes: [] };
forceOpen(state, LEVELS.map((item) => item.id), STEPS[stepParam()] || (kid().id === "max" ? "" : ""));
if (!state.open?.length) state.open = ["show"];
let level = state.open.at(-1);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function image(src, className) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  if (className) img.className = className;
  return img;
}

function rockButton() {
  const button = pic("assets/rock.jpg", "", "rock");
  button.classList.add("small");
  return button;
}

function crateButton() {
  const button = pic("assets/sealed.jpg", "", "crate");
  button.classList.add("small");
  return button;
}

function sealedImage() {
  const holder = el("div", "pic small still");
  holder.append(image("assets/sealed.jpg"));
  return holder;
}

function looseRock() {
  const holder = el("div", "pic small still");
  holder.append(image("assets/rock.jpg"));
  return holder;
}

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("Pip runs the moon cargo base. Ten rocks fill one crate.");
  levelRow(ui.scene, LEVELS, state, level, (id) => { level = id; lobby(); });
  const pip = image("assets/pip.jpg", "hero");
  const play = el("button", "go play", "Start a mission");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(pip, play);
}

/** A short story card before each mission, so the numbers belong to someone. */
function story(text, src) {
  ui.scene.replaceChildren();
  const tale = el("p", "tale", text);
  const go = el("button", "go play", "Let's go");
  go.type = "button";
  ui.scene.append(image(src, "hero"), tale, go);
  ui.speak(text);
  return new Promise((resolve) => go.addEventListener("click", () => resolve(), { once: true }));
}

function pile(name, total) {
  const box = el("div", "pile");
  box.append(el("p", "tag", `${name}: ${total}`));
  const crates = el("div", "row");
  for (let i = 0; i < Math.floor(total / 10); i += 1) crates.append(sealedImage());
  const loose = el("div", "row");
  for (let i = 0; i < total % 10; i += 1) loose.append(rockButton());
  box.append(crates, loose);
  return { box, loose };
}

async function addRound(problem) {
  const { a, b } = problem;
  await story(`Moon Base A dug up ${a} rocks. Moon Base B dug up ${b} rocks. Pip wants them all on one rocket.`, "assets/pip.jpg");
  ui.scene.replaceChildren();
  const eq = el("p", "eq", `${a} + ${b}`);
  const left = pile("Base A", a);
  const right = pile("Base B", b);
  const piles = el("div", "piles");
  piles.append(left.box, right.box);
  const packer = el("div", "packer");
  const count = el("p", "tag", "In the crate: 0 of 10");
  const open = image("assets/crate.jpg", "hero small-hero");
  const inside = el("div", "row inside");
  const ready = el("div", "row");
  packer.append(el("p", "tag", "Pack here"), open, count, inside, el("p", "tag", "Ready for the rocket"), ready);
  ui.scene.append(eq, piles, packer);
  ui.speak("Loose rocks cannot fly. Tap the loose rocks to fill the empty crate. Ten rocks close it.");
  const buttons = [...left.loose.querySelectorAll("button"), ...right.loose.querySelectorAll("button")];
  const sealedAlready = Math.floor(a / 10) + Math.floor(b / 10);
  let inCrate = 0;
  let packedAll = 0;
  let sealedNow = 0;
  await new Promise((resolve) => {
    for (const button of buttons) {
      button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true;
        button.remove();
        inCrate += 1;
        packedAll += 1;
        chime(true);
        count.textContent = `In the crate: ${inCrate} of 10`;
        inside.append(looseRock());
        ui.speak(word(inCrate));
        if (inCrate === 10) {
          sealedNow += 1;
          open.src = "assets/sealed.jpg";
          ready.append(sealedImage());
          ui.speak("Ten rocks. The crate closes. That is one more ten.");
          await wait(700);
          open.src = "assets/crate.jpg";
          inside.replaceChildren();
          inCrate = 0;
          count.textContent = "In the crate: 0 of 10";
        }
        if (packedAll === buttons.length) resolve();
      });
    }
  });
  const ones = buttons.length - sealedNow * 10;
  return launch(a + b, sealedAlready + sealedNow, ones);
}

async function launch(total, tens, ones) {
  const choices = [...new Set([total, total + 1, Math.max(0, total - 10)])].sort(() => rng() - 0.5);
  ui.scene.replaceChildren();
  const cargo = el("div", "pile");
  cargo.append(el("p", "tag", "Rocket cargo"));
  const crates = el("div", "row");
  for (let i = 0; i < tens; i += 1) crates.append(sealedImage());
  const loose = el("div", "row");
  for (let i = 0; i < ones; i += 1) loose.append(looseRock());
  cargo.append(crates, loose);
  const rocket = image("assets/rocket.jpg", "hero");
  ui.scene.append(cargo, rocket);
  ui.speak("Count the crates, then the loose rocks. What number goes on the rocket?");
  const row = el("div", "row");
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const choice of choices) {
      const button = el("button", "go", String(choice));
      button.type = "button";
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== total) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak("Count the crates by tens, then add the loose rocks.");
          return;
        }
        settled = true;
        rocket.classList.add("launch");
        chime(true);
        ui.speak(`${total}. Blast off.`);
        resolve(clean);
      });
      row.append(button);
    }
    ui.scene.append(row);
  });
  return first;
}

function leftover(tens, ones, a, b) {
  const answer = tens * 10 + ones;
  const skipped = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10));
  return [...new Set([answer, skipped, answer + 10])].sort(() => rng() - 0.5);
}

async function subRound(problem) {
  const { a, b } = problem;
  const tensA = Math.floor(a / 10);
  const onesA = a % 10;
  const tensB = Math.floor(b / 10);
  const onesB = b % 10;
  await story(`Rusty the rover drove up to the moon base. It needs ${b} rocks for the museum. The pad has ${a} rocks.`, "assets/rover.jpg");
  ui.scene.replaceChildren();
  const eq = el("p", "eq", `${a} − ${b}`);
  const step = el("p", "tale", "");
  const pad = el("div", "pile");
  pad.append(el("p", "tag", `Moon pad: ${a}`));
  const padCrates = el("div", "row");
  const padRocks = el("div", "row");
  pad.append(padCrates, padRocks);
  const truck = el("div", "pile rover");
  const roverImg = image("assets/rover.jpg", "hero small-hero");
  const need = el("p", "tag", `Rover has 0 of ${b}`);
  const cargo = el("div", "row");
  truck.append(roverImg, need, cargo);
  const board = el("div", "piles");
  board.append(pad, truck);
  ui.scene.append(eq, step, board);

  let phase = "open";
  let loaded = 0;
  let onesLoaded = 0;
  let tensLoaded = 0;
  let first = true;
  let finish = () => {};
  const done = new Promise((resolve) => { finish = resolve; });
  const tell = (text) => { step.textContent = text; ui.speak(text); };
  const gauge = () => { need.textContent = `Rover has ${loaded} of ${b}`; };

  const addRock = () => {
    const button = rockButton();
    button.addEventListener("click", () => {
      if (button.disabled) return;
      if (phase === "open") {
        first = false;
        shake(button);
        chime(false);
        tell(`The rover needs ${onesB} loose rocks, but the pad has only ${onesA}. Tap a crate to open it.`);
        return;
      }
      if (phase === "tens" || onesLoaded >= onesB) {
        shake(button);
        tell(phase === "tens" ? "The loose rocks are done. Now load one crate." : "That is enough loose rocks.");
        return;
      }
      button.disabled = true;
      button.classList.add("landed");
      cargo.append(button);
      onesLoaded += 1;
      loaded += 1;
      gauge();
      chime(true);
      ui.speak(word(onesLoaded));
      if (onesLoaded === onesB) {
        phase = "tens";
        tell(`Now load ${word(tensB)} ${tensB === 1 ? "crate" : "crates"}. A crate is ten rocks.`);
      }
    });
    padRocks.append(button);
  };

  for (let i = 0; i < onesA; i += 1) addRock();
  for (let i = 0; i < tensA; i += 1) {
    const crate = crateButton();
    crate.addEventListener("click", () => {
      if (crate.disabled) return;
      if (phase === "open") {
        crate.remove();
        for (let r = 0; r < 10; r += 1) addRock();
        chime(true);
        phase = "ones";
        tell(`The crate opened. Ten more loose rocks. Now load ${word(onesB)} loose ${onesB === 1 ? "rock" : "rocks"} on the rover.`);
        return;
      }
      if (phase === "ones") {
        first = false;
        shake(crate);
        chime(false);
        tell(`Load the ${word(onesB)} loose rocks first. Then the crate.`);
        return;
      }
      crate.disabled = true;
      crate.classList.add("landed");
      cargo.append(crate);
      tensLoaded += 1;
      loaded += 10;
      gauge();
      chime(true);
      ui.speak(`${tensLoaded * 10}`);
      if (tensLoaded === tensB) finish();
    });
    padCrates.append(crate);
  }
  tell(`The rover needs ${b}. That is ${word(tensB)} ${tensB === 1 ? "crate" : "crates"} and ${word(onesB)} loose rocks. The pad has ${word(onesA)} loose rocks. Not enough. Tap a crate to open it.`);
  await done;

  roverImg.classList.add("drive");
  chime(true);
  await wait(900);
  ui.scene.replaceChildren();
  const tensLeft = tensA - 1 - tensB;
  const onesLeft = onesA + 10 - onesB;
  const rest = el("div", "pile");
  rest.append(el("p", "tag", "Left on the moon pad"));
  const restCrates = el("div", "row");
  for (let i = 0; i < tensLeft; i += 1) restCrates.append(sealedImage());
  const restRocks = el("div", "row");
  for (let i = 0; i < onesLeft; i += 1) restRocks.append(looseRock());
  rest.append(restCrates, restRocks);
  ui.scene.append(el("p", "eq", `${a} − ${b}`), rest);
  ui.speak("Rusty drove away with the rocks. Count the crates, then the loose rocks. How many are left on the pad?");
  const total = a - b;
  const row = el("div", "row");
  const right = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const choice of leftover(tensLeft, onesLeft, a, b)) {
      const button = el("button", "go", String(choice));
      button.type = "button";
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== total) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak("Count the crates by tens, then add the loose rocks.");
          return;
        }
        settled = true;
        chime(true);
        ui.speak(`${total} rocks are left. Good job, Pip.`);
        resolve(clean);
      });
      row.append(button);
    }
    ui.scene.append(row);
  });
  return first && right;
}

let last = "";

/** 27 + 15 is the worked example for the very first launch only. */
function pick() {
  if (level === "show" && !state.stars?.show) return addWithTrade(rng, true);
  let problem;
  for (let tries = 0; tries < 10; tries += 1) {
    problem = level === "sub" ? subWithTrade(rng) : addWithTrade(rng, false);
    if (`${problem.a} ${problem.op} ${problem.b}` !== last) break;
  }
  return problem;
}

async function round() {
  const problem = pick();
  last = `${problem.a} ${problem.op} ${problem.b}`;
  const clean = level === "sub" ? await subRound(problem) : await addRound(problem);
  const order = LEVELS.map((item) => item.id);
  const next = order[order.indexOf(level) + 1];
  const opened = record(state, {
    game: GAME,
    level,
    flag: FLAGS[level],
    next,
    clean,
    prize: clean ? { id: `patch-${(state.prizes || []).length}`, src: "assets/rocket.jpg", alt: "rocket" } : null,
    skill: "Regrouping",
    item: `${problem.a} ${problem.op} ${problem.b}`
  });
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "Pip says the next mission is on the map." : clean ? "Pip pinned a rocket patch on your suit." : "The rocks are still on the moon. Try again.");
  save(GAME, state);
  setTimeout(lobby, 1400);
}

lobby();
