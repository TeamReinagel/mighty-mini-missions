import { fresh, load, openGame, record, levelRow } from "./stage.mjs";
import { runRounds } from "./set.mjs";

export function mountLadder({ root, game, title, background, ladder, play, skill, prizeSrc, win, keep }) {
  const rng = fresh();
  const ui = openGame(root, { title, background });
  const state = load(game) || { stars: {}, open: [ladder[0].id], prizes: [] };
  if (!state.open?.length) state.open = [ladder[0].id];
  let level = [...state.open].reverse().find((id) => ladder.some((item) => item.id === id)) || ladder[0].id;
  let pending = null;
  let farewell = "That round is done.";

  function spec() {
    return ladder.find((item) => item.id === level) || ladder[0];
  }

  async function one() {
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
    if (opened && current.next) pending = current.next;
    ui.speak(clean ? win : keep);
  }

  runRounds({
    ui,
    game,
    play: one,
    line: () => farewell,
    before() {
      pending = null;
      farewell = "That round is done.";
    },
    after() {
      if (!pending) return;
      level = pending;
      pending = null;
      farewell = "The next one is ready. That round is done.";
    },
    rest(scene, redraw) {
      levelRow(scene, ladder, state, level, (id) => {
        level = id;
        redraw();
      });
    }
  });
}
