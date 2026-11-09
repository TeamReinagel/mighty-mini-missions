// Essential skill: listening-1. The child listens to the opening story and to each spoken find.
import { openGame, pic, chime, shake, el, kid, load, save, fresh, practice, say, afterLine, quiet } from "../play/stage.mjs";
import { roundsFor } from "../play/round-length.mjs";
import { SHOPS, STORY, NEED, defaultState, shopOpen, makeFind, noteStreak } from "./shops.mjs";
import { runTrace } from "./trace.mjs";

const GAME = "lost-helpers";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const who = kid();
const rng = fresh();
const ui = openGame(document.querySelector("#app"), {
  title: "The Lost Helpers",
  background: "assets/street.jpg"
});
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

const storyAudio = new Audio(new URL("assets/story.mp3", import.meta.url).href);
storyAudio.preload = "auto";

// Lines play through the games' shared voice (../play/kit.mjs): one player that iPads allow,
// lines saved on the tablet, and each line finishing before the next one starts. Natural voice
// only here; if the server cannot say a line, the picture still carries the find.
function stopVoice() {
  quiet();
  try { storyAudio.pause(); } catch { /* ok */ }
  try { storyAudio.currentTime = 0; } catch { /* ok */ }
}

function naturalSay(text, { force = false } = {}) {
  if (!text) return Promise.resolve();
  const line = document.querySelector(".line");
  if (line) line.textContent = text;
  try { storyAudio.pause(); } catch { /* ok */ }
  return say(text, { device: false, force });
}

ui.speak = naturalSay;

let storyPlaying = false;
let storyGen = 0;
let busy = false;

function marks(shopId) {
  const streak = state.shops[shopId]?.home ? NEED : (state.shops[shopId]?.streak || 0);
  ui.stars(Math.min(NEED, streak));
}

function helperImg(shop) {
  const img = document.createElement("img");
  img.className = "helper-face";
  img.src = shop.helper;
  img.alt = "";
  return img;
}

function optionButton(option) {
  if (option.kind === "tile") {
    const button = el("button", "pic tile");
    button.type = "button";
    button.dataset.value = option.label;
    button.setAttribute("aria-label", option.label);
    const face = el("span", "tile-face", option.label);
    button.append(face);
    return button;
  }
  if (option.kind === "count") {
    const button = el("button", "pic count-card");
    button.type = "button";
    button.dataset.value = option.value;
    button.setAttribute("aria-label", option.label);
    const stack = el("div", "count-stack");
    for (let i = 0; i < option.count; i += 1) {
      const img = document.createElement("img");
      img.src = option.src;
      img.alt = "";
      stack.append(img);
    }
    button.append(stack, el("span", "cap", option.label));
    return button;
  }
  if (option.kind === "size") {
    const button = el("button", `pic size-${option.size}`);
    button.type = "button";
    button.dataset.value = option.value;
    button.setAttribute("aria-label", option.label);
    const img = document.createElement("img");
    img.src = option.src;
    img.alt = "";
    button.append(img);
    return button;
  }
  return pic(option.src, option.label, option.value);
}

async function playFind(shop) {
  const find = makeFind(shop.id, who.id, state, rng, window.MightyFocus?.get(who.id));
  ui.scene.replaceChildren();
  ui.scene.classList.add("shop-scene");
  ui.scene.style.backgroundImage = `linear-gradient(rgba(20,16,30,.18), rgba(20,16,30,.05)), url("assets/paper.jpg")`;

  const head = el("div", "shop-head");
  head.append(helperImg(shop), el("p", "shop-title", shop.title));
  ui.scene.append(head);
  marks(shop.id);

  if (find.kind === "trace") {
    const clean = await runTrace(ui, { paths: find.paths, missLine: find.miss() });
    practice({ game: GAME, skill: find.skill, item: find.item, correct: clean });
    return clean;
  }

  if (find.held) {
    const held = optionButton(find.held);
    held.disabled = true;
    held.classList.add("held");
    ui.scene.append(held);
  }
  if (find.heldCount) {
    const row = el("div", "bakery-sum");
    const left = el("div", "count-stack");
    for (let i = 0; i < find.heldCount.left; i += 1) {
      const img = document.createElement("img");
      img.src = "assets/bun.png";
      img.alt = "";
      left.append(img);
    }
    const right = el("div", "count-stack");
    for (let i = 0; i < find.heldCount.right; i += 1) {
      const img = document.createElement("img");
      img.src = "assets/bun.png";
      img.alt = "";
      right.append(img);
    }
    row.append(left, el("span", "op", find.heldCount.op), right);
    ui.scene.append(row);
  }
  if (find.sequence) {
    const track = el("div", "track");
    for (const piece of find.sequence) {
      if (piece.count) {
        const card = el("div", "pic count-card");
        const stack = el("div", "count-stack");
        for (let i = 0; i < piece.count; i += 1) {
          const img = document.createElement("img");
          img.src = piece.src;
          img.alt = "";
          stack.append(img);
        }
        card.append(stack);
        track.append(card);
      } else {
        const card = el("div", "pic");
        const img = document.createElement("img");
        img.src = piece.src;
        img.alt = piece.name || "";
        card.append(img);
        track.append(card);
      }
    }
    track.append(el("div", "blank"));
    ui.scene.append(track);
  }

  const row = el("div", "row");
  ui.scene.append(row);
  ui.speak(find.prompt);

  const clean = await new Promise((resolve) => {
    let first = true;
    let settled = false;
    for (const option of find.options) {
      const button = optionButton(option);
      button.addEventListener("click", () => {
        if (settled || button.disabled) return;
        const value = button.dataset.value;
        if (!find.right(value)) {
          first = false;
          shake(button);
          chime(false);
          ui.speak(typeof find.miss === "function" ? find.miss({ label: option.label || value }) : find.miss);
          return;
        }
        settled = true;
        for (const node of row.querySelectorAll("button")) node.disabled = true;
        chime(true);
        resolve(first);
      });
      row.append(button);
    }
  });

  practice({ game: GAME, skill: find.skill, item: find.item, correct: clean });
  return clean;
}

async function visitShop(shop) {
  if (busy || storyPlaying || !state.storyHeard) return;
  busy = true;
  try {
    const count = roundsFor(GAME, who.id);
    for (let i = 0; i < count; i += 1) {
      const clean = await playFind(shop);
      const rec = noteStreak(state, shop.id, clean);
      marks(shop.id);
      save(GAME, state);
      if (clean && !rec.home) {
        ui.speak("They darted off again. Find them once more.");
        await afterLine(700);
      } else if (!clean) {
        ui.speak("They slipped away. Try that find again next.");
        await afterLine(700);
      } else if (rec.home && i === count - 1) {
        ui.speak("They curled up and stayed.");
        await afterLine(800);
      } else if (rec.home) {
        ui.speak("Home for good.");
        await afterLine(600);
      } else {
        await wait(450);
      }
    }
  } finally {
    busy = false;
    showStreet();
  }
}

function showStreet() {
  ui.scene.replaceChildren();
  ui.scene.classList.remove("shop-scene");
  ui.scene.style.backgroundImage = "none";
  ui.scene.classList.add("map-scene");
  ui.stars(0);

  const map = el("div", "street-map");
  const art = document.createElement("img");
  art.className = "street-art";
  art.src = "assets/street.jpg?v=map13";
  art.alt = "Village map with labeled shops";
  art.draggable = false;
  map.append(art);

  const homeHelpers = [];
  for (const shop of SHOPS) {
    const open = shopOpen(who.id, shop.id, state);
    const home = Boolean(state.shops[shop.id]?.home);
    const door = el("button", `shop-door ${open ? "open" : "shut"} ${home ? "home" : "loose"}`);
    door.type = "button";
    door.style.left = `${shop.x}%`;
    door.style.top = `${shop.y}%`;
    door.style.width = `${shop.w}%`;
    door.style.height = `${shop.h}%`;
    door.setAttribute("aria-label", open ? shop.title : `${shop.title}, closed`);
    door.disabled = !open || storyPlaying || !state.storyHeard;
    if (!open) door.append(el("span", "shutter"));
    if (home) {
      const face = helperImg(shop);
      face.classList.add("in-window");
      door.append(face);
      homeHelpers.push(shop);
    } else if (open && state.storyHeard && !storyPlaying) {
      door.append(el("span", "door-glow"));
    }
    door.addEventListener("click", () => visitShop(shop));
    map.append(door);
  }
  ui.scene.append(map);
  ui.prizes(homeHelpers.map((shop) => ({ id: shop.id, src: shop.helper, alt: shop.title })));

  if (storyPlaying) return;
  if (!state.storyHeard) {
    const line = document.querySelector(".line");
    if (line) line.textContent = "Tap the map to hear what happened.";
  } else {
    ui.speak("Pick a shop.");
  }
}

async function playStory() {
  if (busy) return;
  const gen = ++storyGen;
  storyPlaying = true;
  stopVoice();
  showStreet();
  const caption = el("p", "story-caption", STORY);
  ui.scene.append(caption);
  const line = document.querySelector(".line");
  if (line) line.textContent = STORY;

  try {
    storyAudio.currentTime = 0;
    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        storyAudio.removeEventListener("ended", onEnd);
        storyAudio.removeEventListener("error", onErr);
        if (ok) resolve();
        else reject(new Error("story missing"));
      };
      const onEnd = () => finish(true);
      const onErr = () => finish(false);
      storyAudio.addEventListener("ended", onEnd);
      storyAudio.addEventListener("error", onErr);
      // play() stays on the tap stack so the browser allows sound
      storyAudio.play().then(() => {}).catch(() => finish(false));
    });
  } catch {
    if (gen === storyGen) await naturalSay(STORY);
  }

  if (gen !== storyGen) return;
  state.storyHeard = true;
  save(GAME, state);
  storyPlaying = false;
  showStreet();
}

function wireStreetStart() {
  const hear = document.querySelector(".hear");
  if (hear) {
    const fresh = hear.cloneNode(true);
    hear.replaceWith(fresh);
    fresh.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      // On the street, Hear it always plays the recorded story. In a shop, it re-says the line.
      if (ui.scene.querySelector(".street-map") || !state.storyHeard || storyPlaying) {
        playStory();
        return;
      }
      const text = document.querySelector(".line")?.textContent?.trim();
      if (text) naturalSay(text, { force: true });
      else playStory();
    });
  }
  ui.scene.addEventListener("pointerdown", () => {
    if (!state.storyHeard && !storyPlaying && !busy) playStory();
  });
}

showStreet();
wireStreetStart();
