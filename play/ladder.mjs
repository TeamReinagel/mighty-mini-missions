import { el, fresh, load, openGame, record, levelRow } from "./stage.mjs";

export function mountLadder({ root, game, title, background, ladder, play, skill, prizeSrc, win, keep }) {
  const rng = fresh();
  const ui = openGame(root, { title, background });
  const state = load(game) || { stars: {}, open: [ladder[0].id], prizes: [] };
  if (!state.open?.length) state.open = [ladder[0].id];
  let level = [...state.open].reverse().find((id) => ladder.some((item) => item.id === id)) || ladder[0].id;

  function spec() {
    return ladder.find((item) => item.id === level) || ladder[0];
  }

  function lobby() {
    ui.scene.replaceChildren();
    ui.stars(state.stars?.[level]?.streak || 0);
    ui.prizes(state.prizes);
    ui.speak(spec().hello);
    const hero = document.createElement("img");
    hero.className = "hero";
    hero.src = prizeSrc;
    hero.alt = "";
    const go = el("button", "go play", spec().go || "Play");
    go.type = "button";
    go.addEventListener("click", () => round());
    ui.scene.append(hero, go);
    levelRow(ui.scene, ladder, state, level, (id) => {
      level = id;
      lobby();
    });
  }

  async function round() {
    const current = spec();
    const result = await play({ rng, ui, spec: current });
    const clean = result === true || result?.clean === true;
    const opened = record(state, {
      game,
      level,
      flag: current.flag,
      next: current.next,
      clean,
      prize: clean ? { id: `${game}-${(state.prizes || []).length}`, src: prizeSrc, alt: title } : null,
      skill,
      item: result?.item || current.id
    });
    ui.stars(state.stars?.[level]?.streak || 0);
    ui.prizes(state.prizes);
    ui.speak(opened ? "The next one is ready." : clean ? win : keep);
    setTimeout(lobby, 1000);
  }

  lobby();
}
