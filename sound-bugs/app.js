import { SOUND, SOUND_GROUPS, soundRound } from "../play/rounds.mjs";
import { openGame, pic, chime, shake, record, forceOpen, levelRow, el, load, save, fresh, stepParam } from "../play/stage.mjs";

const GAME = "sound-bugs";
const FACES = [
  { src: "assets/monkey.jpg", name: "monkey" },
  { src: "assets/parrot.jpg", name: "parrot" },
  { src: "assets/frog.jpg", name: "frog" }
];
const LEVELS = [
  { id: "1", label: "A to F" },
  { id: "2", label: "G to L" }
];
const STEPS = { "connor-sounds-1": "1", "connor-sounds-2": "2" };
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Jungle Jump", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["1"], prizes: [] };
forceOpen(state, ["1", "2"], STEPS[stepParam()]);
if (!state.open?.length) state.open = ["1"];
let level = state.open.at(-1);

function letters() {
  return SOUND_GROUPS[Number(level) - 1] || SOUND_GROUPS[0];
}

function animal(letter, face) {
  const button = pic(face.src, "", letter);
  button.append(el("span", "letter", letter));
  button.setAttribute("aria-label", letter);
  return button;
}

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("The jungle drum is ready.");
  levelRow(ui.scene, LEVELS, state, level, (id) => { level = id; lobby(); });
  const play = el("button", "go play", "Cross the stream");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(play);
}

async function dance(item) {
  ui.scene.replaceChildren();
  ui.speak(`The drum says ${item.sound}. Tap that animal.`);
  const row = el("div", "row");
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    item.choices.forEach((letter, index) => {
      const button = animal(letter, FACES[index % FACES.length]);
      button.addEventListener("click", () => {
        if (settled) return;
        if (letter !== item.answer) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak(`That letter says ${SOUND[letter]}. Listen for ${item.sound}.`);
          return;
        }
        settled = true;
        chime(true);
        resolve(clean);
      });
      row.append(button);
    });
    ui.scene.append(row);
  });
  return first;
}

async function jumpPath() {
  ui.scene.replaceChildren();
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/monkey.jpg";
  hero.alt = "";
  const pads = el("div", "row");
  ui.scene.append(hero, pads);
  let first = true;
  for (let step = 0; step < 3; step += 1) {
    const item = soundRound(letters(), rng);
    pads.replaceChildren();
    ui.speak(`Jump to ${item.sound}.`);
    const landed = await new Promise((resolve) => {
      let settled = false;
      item.choices.forEach((letter) => {
        const button = pic("assets/pad.jpg", "", letter);
        button.append(el("span", "letter", letter));
        button.addEventListener("click", () => {
          if (settled) return;
          if (letter !== item.answer) {
            first = false;
            shake(button);
            chime(false);
            ui.speak(`That pad says ${SOUND[letter]}.`);
            return;
          }
          settled = true;
          chime(true);
          resolve(true);
        });
        pads.append(button);
      });
    });
    if (!landed) return false;
  }
  hero.classList.add("launch");
  return first;
}

async function round() {
  const danced = await dance(soundRound(letters(), rng));
  const jumped = await jumpPath();
  const clean = danced && jumped;
  const next = level === "1" ? "2" : null;
  const opened = record(state, {
    game: GAME,
    level,
    flag: level === "1" ? "letter-sounds" : "letter-sounds-2",
    next,
    clean,
    prize: clean ? { id: `pal-${(state.prizes || []).length}`, src: FACES[(state.prizes || []).length % 3].src, alt: "animal" } : null,
    skill: "Letter sounds",
    item: letters()[0]
  });
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "New animals are in the next part of the jungle." : clean ? "The monkey made it across." : "The stream is still there.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
