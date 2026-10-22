import { openGame, pic, chime, shake, record, el, load, save, fresh } from "../play/stage.mjs";

const GAME = "pattern-park";
const DINOS = [
  { id: "stego", src: "assets/stego.jpg", name: "stego" },
  { id: "rex", src: "assets/rex.jpg", name: "rex" },
  { id: "tri", src: "assets/tri.jpg", name: "tri" }
];
const rng = fresh();
const ui = openGame(document.querySelector("#app"), { title: "Dino Express", background: "assets/bg.jpg" });
const state = load(GAME) || { stars: {}, open: ["line"], prizes: [] };

function pair() {
  const copy = [...DINOS].sort(() => rng() - 0.5);
  return [copy[0], copy[1]];
}

function lobby() {
  ui.scene.replaceChildren();
  ui.stars(state.stars?.line?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak("The dino train is at the station.");
  const hero = document.createElement("img");
  hero.className = "hero";
  hero.src = "assets/stego.jpg";
  hero.alt = "";
  const play = el("button", "go play", "Start the train");
  play.type = "button";
  play.addEventListener("click", () => round());
  ui.scene.append(hero, play);
}

function car(dino) {
  return pic(dino.src, dino.name, dino.id);
}

function showCar(dino) {
  const card = el("div", "pic");
  const img = document.createElement("img");
  img.src = dino.src;
  img.alt = dino.name;
  card.append(img, el("span", "cap", dino.name));
  return card;
}

async function nextCar() {
  const [a, b] = pair();
  const repeat = rng() < 0.5;
  const sequence = repeat ? [a, b, a, b] : [a, b, b, a];
  const answer = repeat ? a : b;
  ui.scene.replaceChildren();
  ui.speak(`${sequence.map((dino) => dino.name).join(", ")}. Who comes next?`);
  const track = el("div", "track");
  for (const dino of sequence) track.append(showCar(dino));
  track.append(el("div", "blank"));
  const depot = el("div", "row");
  ui.scene.append(track, depot);
  const first = await new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const dino of DINOS) {
      const button = car(dino);
      button.addEventListener("click", () => {
        if (settled) return;
        if (dino.id !== answer.id) {
          clean = false;
          shake(button);
          chime(false);
          ui.speak("Say the cars out loud, then look at what repeats.");
          return;
        }
        settled = true;
        chime(true);
        track.lastElementChild.replaceWith(showCar(dino));
        resolve(clean);
      });
      depot.append(button);
    }
  });
  return first;
}

async function buildTrain() {
  const [a, b] = pair();
  const pattern = [a, b, a, b];
  ui.scene.replaceChildren();
  ui.speak(`Build the train. ${a.name}, ${b.name}, ${a.name}, ${b.name}.`);
  const sample = el("div", "track");
  sample.append(showCar(a), showCar(b));
  const track = el("div", "track");
  const holes = [];
  for (let i = 0; i < 4; i += 1) {
    const hole = el("div", "blank");
    holes.push(hole);
    track.append(hole);
  }
  const depot = el("div", "row");
  ui.scene.append(sample, track, depot);
  let placed = 0;
  let first = true;
  await new Promise((resolve) => {
    for (const dino of DINOS) {
      const button = car(dino);
      button.addEventListener("click", () => {
        if (placed >= 4) return;
        if (dino.id !== pattern[placed].id) {
          first = false;
          shake(button);
          chime(false);
          ui.speak(`${pattern[placed].name} comes next.`);
          return;
        }
        chime(true);
        holes[placed].replaceWith(showCar(dino));
        placed += 1;
        if (placed === 4) resolve();
      });
      depot.append(button);
    }
  });
  return first;
}

async function round() {
  const guessed = await nextCar();
  const built = await buildTrain();
  const clean = guessed && built;
  const opened = record(state, {
    game: GAME,
    level: "line",
    flag: "patterns",
    clean,
    prize: clean ? { id: `car-${(state.prizes || []).length}`, src: DINOS[(state.prizes || []).length % 3].src, alt: "dino car" } : null,
    skill: "Patterns",
    item: "dino train"
  });
  ui.stars(state.stars?.line?.streak || 0);
  ui.prizes(state.prizes);
  ui.speak(opened ? "A longer track is ready." : clean ? "The train got a stamp." : "The cars rolled back. The track is still here.");
  save(GAME, state);
  setTimeout(lobby, 1100);
}

lobby();
