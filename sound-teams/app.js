import { teamRound } from "../play/rounds.mjs";
import { openGame, pic, chime, shake, record, forceOpen, levelRow, el, load, save, fresh, stepParam } from "../play/stage.mjs";

const GAME = "sound-teams";
const LEVELS = [
  { id: "sh", label: "sh" },
  { id: "ch", label: "ch" },
  { id: "th", label: "th" }
];
const STEPS = { "gabi-sh": "sh", "gabi-ch": "ch", "gabi-th": "th" };
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Tide Pool", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["sh"], prizes: [] };
forceOpen(state, LEVELS.map((item) => item.id), STEPS[stepParam()]);
if (!state.open?.length) state.open = ["sh"];
let level = state.open.at(-1);

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("The crab is looking for letter teams.");
  levelRow(ui.scene, LEVELS, state, level, (id) => { level = id; lobby(); });
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/crab.jpg";
  hero.alt = "";
  const play = el("button", "go play", "Search the pool");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(hero, play);
}

function shell(word) {
  const button = pic("assets/shell.jpg", word, word);
  return button;
}

async function chooseShell(item) {
  ui.scene.replaceChildren();
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/crab.jpg";
  hero.alt = "";
  ui.scene.append(hero);
  ui.speak(`Tap the shell with ${item.team}, like in ${item.answer}.`);
  const row = el("div", "row");
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const choice of item.choices) {
      const button = shell(choice);
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== item.answer) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak(`${choice} does not have ${item.team}.`);
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
  return first;
}

async function current(item) {
  ui.scene.replaceChildren();
  ui.speak(`Words are floating by. Catch only ${item.team}.`);
  const lane = el("div", "lane");
  const hero = document.createElement("img");
  hero.src = "assets/fish.jpg";
  hero.alt = "";
  hero.className = "hero";
  ui.scene.append(hero, lane);
  const timers = [];
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      timers.forEach((timer) => clearInterval(timer));
      resolve(ok);
    };
    item.choices.forEach((choice, index) => {
      const button = shell(choice);
      button.classList.add("drifter");
      button.style.left = `${80 + index * 28}%`;
      lane.append(button);
      const timer = setInterval(() => {
        const left = parseFloat(button.style.left);
        const next = left - 0.7;
        button.style.left = `${next}%`;
        if (next < -30 && choice === item.answer) finish(false);
      }, 40);
      timers.push(timer);
      button.addEventListener("click", () => {
        if (settled) return;
        if (choice !== item.answer) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak("Let that one float by.");
          return;
        }
        chime(true);
        finish(clean);
      });
    });
  });
  return first;
}

async function round() {
  const item = teamRound(level, rng);
  const caught = await chooseShell(item);
  const drifted = await current(teamRound(level, rng));
  const clean = caught && drifted;
  const order = LEVELS.map((entry) => entry.id);
  const next = order[order.indexOf(level) + 1];
  const opened = record(state, {
    game: GAME,
    level,
    flag: `digraph-${level}`,
    next,
    clean,
    prize: clean ? { id: `pearl-${(state.prizes || []).length}`, src: "assets/chest.jpg", alt: "pearl" } : null,
    skill: "Digraphs",
    item: item.answer
  });
  ui.stars(state.stars?.[level]?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "A new letter team washed in." : clean ? "The crab kept a pearl." : "The pool is still full of shells.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
