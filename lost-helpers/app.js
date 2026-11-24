// Essential skill: listening-1. The child listens to each spoken find ("Find red.") and acts on it;
// the line stays on screen and the Hear it button says it again.
import { openGame, shake, el, kid, load, save, fresh, practice, say, afterLine, quiet } from "../play/stage.mjs";
import { soundContext } from "../play/bump.mjs";
import { roundsFor } from "../play/round-length.mjs";
import { SHOPS, NEED, defaultState, shopOpen, makeFind, noteStreak } from "./shops.mjs";
import { runTrace } from "./trace.mjs";
import { SKIN } from "./skin.mjs";

const GAME = "lost-helpers";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// How far a finger may wander from the middle of a tracing road (the pad is 100 units wide).
const TRACE_ROOM = { ethan: 18, connor: 17, gabi: 16, max: 13 };

const who = kid();
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: SKIN.title, background: "" });
document.body.classList.add("lost-helpers");

const state = load(GAME) || defaultState(who.id);
state.shops = state.shops || defaultState(who.id).shops;
for (const shop of SHOPS) {
  if (!state.shops[shop.id]) state.shops[shop.id] = { streak: 0, home: false };
}
if (who.id === "max") {
  state.shops.quilt.hard = true;
  state.shops.laundry.hard = true;
}
save(GAME, state);

// Lines use the games' natural voice only (../play/kit.mjs). If the server can't say a line,
// the line still shows and the picture still carries the find.
const lineNode = document.querySelector(".line");
function speak(text, { force = false } = {}) {
  if (!text) return Promise.resolve();
  if (lineNode) lineNode.textContent = text;
  return say(text, { device: false, force });
}
ui.speak = speak;

const hear = document.querySelector(".hear");
if (hear) {
  const again = hear.cloneNode(true);
  hear.replaceWith(again);
  again.addEventListener("click", () => speak(lineNode?.textContent?.trim(), { force: true }));
}

function sound(name) {
  const notes = SKIN.sounds[name];
  if (!notes) return;
  try {
    const ctx = soundContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type || "sine";
      osc.frequency.value = n.f;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = now + (n.at || 0);
      gain.gain.setValueAtTime(n.v || 0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.t);
      osc.start(start);
      osc.stop(start + n.t + 0.01);
    }
  } catch { /* a quiet tablet is fine */ }
}

function look(shop) {
  return SKIN.shops[shop.id] || { color: "#7c6cf0", badge: "⭐" };
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function paintShop(target, shop) {
  const { color } = look(shop);
  target.style.setProperty("--c", color);
  target.style.setProperty("--c-dark", shade(color, -0.28));
  target.style.setProperty("--c-light", shade(color, 0.78));
  target.style.setProperty("--c-mid", shade(color, 0.45));
}

function img(src, className) {
  const node = document.createElement("img");
  node.src = src;
  node.alt = "";
  node.draggable = false;
  if (className) node.className = className;
  return node;
}

let visit = 0; // bumps whenever the screen changes, so a find left behind stops quietly

// ---------- Street ----------

function showStreet({ first = false } = {}) {
  visit += 1;
  quiet();
  ui.scene.className = "scene street-scene";
  ui.scene.removeAttribute("style");
  ui.scene.replaceChildren();

  const open = SHOPS.filter((shop) => shopOpen(who.id, shop.id, state));
  const street = el("div", open.length > 9 ? "street many" : "street");
  const next = open.find((shop) => !state.shops[shop.id]?.home);

  for (const shop of open) {
    const home = Boolean(state.shops[shop.id]?.home);
    const door = el("button", `door ${home ? "home" : "lost"}${shop === next ? " next" : ""}`);
    door.type = "button";
    door.setAttribute("aria-label", home ? `${shop.title}, helper is home` : `${shop.title}, helper is hiding`);
    paintShop(door, shop);
    const roof = el("span", "roof");
    const badge = el("span", "badge", look(shop).badge);
    const house = el("span", "house");
    const win = el("span", "window");
    win.append(img(shop.helper, "who"));
    const stones = el("span", "stones");
    const at = home ? NEED : (state.shops[shop.id]?.streak || 0);
    for (let i = 0; i < NEED; i += 1) stones.append(el("span", i < at ? "stone on" : "stone"));
    house.append(win, stones);
    door.append(roof, badge, house);
    door.addEventListener("click", () => {
      sound("tap");
      visitShop(shop);
    });
    street.append(door);
  }
  ui.scene.append(street);

  const line = next ? (first && !state.seen ? SKIN.intro : SKIN.pick) : SKIN.allHome;
  state.seen = true;
  save(GAME, state);
  speak(line);
}

// ---------- Shop ----------

function pathHome(shop) {
  const bar = el("div", "home-path");
  for (let i = 0; i < NEED; i += 1) bar.append(el("span", "stone"));
  const door = el("span", "mini-house");
  door.append(el("span", "mini-roof"), el("span", "mini-door"));
  bar.append(door);
  const walker = img(shop.helper, "walker");
  bar.append(walker);
  const set = (at, { hop = false } = {}) => {
    const spot = Math.max(0, Math.min(NEED, at));
    walker.style.left = `calc(${((spot + 0.5) * 100) / (NEED + 1)}% )`;
    bar.querySelectorAll(".stone").forEach((s, i) => s.classList.toggle("on", i < spot));
    bar.classList.toggle("arrived", spot >= NEED);
    if (hop && !still()) {
      walker.classList.remove("hop");
      void walker.offsetWidth;
      walker.classList.add("hop");
    }
  };
  return { bar, set };
}

// Every tile in a row uses the size the longest word needs, so size never hints at the answer.
function tileSize(options) {
  const len = Math.max(...options.filter((o) => o.kind === "tile").map((o) => String(o.label).length), 1);
  return len <= 2 ? "3.4rem" : len <= 4 ? "2.6rem" : "2rem";
}

function face(text, size) {
  const n = el("span", "tile-face", text);
  n.style.fontSize = size;
  return n;
}

function bunStack(count, src = "assets/bun.png") {
  const stack = el("span", "count-stack");
  for (let i = 0; i < count; i += 1) stack.append(img(src));
  return stack;
}

function spotButton(option, size) {
  const button = el("button", "spot");
  button.type = "button";
  button.setAttribute("aria-label", option.label || String(option.value));
  if (option.kind === "tile") {
    button.dataset.value = option.label;
    button.classList.add("word");
    button.append(face(option.label, size));
  } else if (option.kind === "count") {
    button.dataset.value = option.value;
    button.classList.add("counts");
    button.append(bunStack(option.count, option.src));
  } else if (option.kind === "size") {
    button.dataset.value = option.value;
    button.classList.add(`size-${option.size}`);
    button.append(img(option.src, "thing"));
  } else {
    button.dataset.value = option.value ?? option.label;
    button.append(img(option.src, "thing"));
  }
  return button;
}

function clueFor(find) {
  const clue = el("div", "clue");
  if (find.held) {
    const card = el("div", "clue-card");
    card.append(img(find.held.src, "thing"));
    clue.append(card);
  }
  if (find.heldCount) {
    const sum = el("div", "clue-card sum");
    sum.append(bunStack(find.heldCount.left), el("span", "op", find.heldCount.op), bunStack(find.heldCount.right));
    clue.append(sum);
  }
  if (find.sequence) {
    const track = el("div", "clue-card track");
    for (const piece of find.sequence) {
      const cell = el("span", "cell");
      cell.append(piece.count ? bunStack(piece.count, piece.src) : img(piece.src, "thing"));
      track.append(cell);
    }
    track.append(el("span", "cell blank", "?"));
    clue.append(track);
  }
  return clue.childElementCount ? clue : null;
}

// One find. Resolves { clean, delta }: clean is the first try; delta moves the helper.
async function playFind(shop, area, path, at, mine) {
  const find = makeFind(shop.id, who.id, state, rng, window.MightyFocus?.get(who.id));
  area.replaceChildren();

  if (find.kind === "trace") {
    let first = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      area.replaceChildren();
      const result = await runTrace(area, {
        strokes: find.paths,
        tolerance: TRACE_ROOM[who.id] || 15,
        say: (text) => speak(text),
        sound,
        words: SKIN.trace,
        helperSrc: shop.helper
      });
      if (mine !== visit) return null;
      if (first === null) {
        first = result.clean;
        practice({ game: GAME, skill: find.skill, item: find.item, correct: first });
      }
      // A slip gets the same shape once more, so the next try can fix it.
      if (result.clean || attempt === 1) break;
      await afterLine(300);
      if (mine !== visit) return null;
    }
    return { clean: first, delta: first ? 1 : 0 };
  }

  const clue = clueFor(find);
  if (clue) area.append(clue);
  const row = el("div", "spots");
  area.append(row);
  speak(find.prompt);

  const size = tileSize(find.options);
  const clean = await new Promise((resolve) => {
    let missed = false;
    let settled = false;
    for (const option of find.options) {
      const button = spotButton(option, size);
      button.addEventListener("click", () => {
        if (settled || button.classList.contains("empty")) return;
        const value = button.dataset.value;
        if (!find.right(value)) {
          sound("miss");
          shake(button);
          // That spot is empty now, so the choice narrows.
          button.classList.add("empty");
          button.setAttribute("aria-disabled", "true");
          if (!missed) {
            missed = true;
            if (at < NEED) path.set(at - 1, { hop: true });
          }
          speak(typeof find.miss === "function" ? find.miss({ label: option.label || value }) : find.miss);
          return;
        }
        settled = true;
        row.classList.add("settled");
        button.classList.add("found");
        const peek = img(shop.helper, "peek");
        button.append(peek);
        sound("found");
        speak(SKIN.found[Math.floor(rng() * SKIN.found.length)]);
        resolve(!missed);
      });
      row.append(button);
    }
  });

  practice({ game: GAME, skill: find.skill, item: find.item, correct: clean });
  return { clean, delta: clean ? 1 : -1 };
}

async function visitShop(shop) {
  const mine = ++visit;
  quiet();
  ui.scene.className = "scene shop-scene";
  ui.scene.replaceChildren();
  paintShop(ui.scene, shop);

  const top = el("div", "shop-top");
  const back = el("button", "back", "⬅");
  back.type = "button";
  back.setAttribute("aria-label", "Back to the street");
  back.addEventListener("click", () => showStreet());
  const path = pathHome(shop);
  top.append(back, path.bar);
  const area = el("div", "find-area");
  ui.scene.append(top, area);

  const rec = () => state.shops[shop.id];
  const position = () => (rec().home ? NEED : rec().streak || 0);
  path.set(position());

  if (rec().home) {
    speak(SKIN.playAgain);
    await afterLine(200);
    if (mine !== visit) return;
  }

  const count = roundsFor(GAME, who.id);
  for (let i = 0; i < count; i += 1) {
    const wasHome = Boolean(rec().home);
    const result = await playFind(shop, area, path, position(), mine);
    if (!result || mine !== visit) return;
    noteStreak(state, shop.id, result.delta);
    save(GAME, state);
    await afterLine(500);
    if (mine !== visit) return;
    path.set(position(), { hop: result.delta > 0 });
    if (result.delta > 0 && !wasHome) sound("hop");
    if (rec().home && !wasHome) {
      ui.scene.classList.add("celebrate");
      sound("home");
      speak(SKIN.home);
      await afterLine(900);
      if (mine !== visit) return;
      ui.scene.classList.remove("celebrate");
    } else {
      await wait(350);
    }
  }
  if (mine !== visit) return;
  showStreet();
  // Send the visit's answers now, so Joyce sees all of them when he taps I'm done.
  try { window.MightyProgress?.flush?.(); } catch { /* The queue keeps them for later. */ }
  // Sent from a Joyce card: after a full visit, a big button goes back to her.
  const toJoyce = window.MightyProgress?.joyceButton?.({ className: "go play joyce-back" });
  if (toJoyce) {
    ui.scene.append(toJoyce);
    speak("Tap the big button to go back to Joyce.");
  }
}

showStreet({ first: true });
