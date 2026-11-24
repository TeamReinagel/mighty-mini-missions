// Essential skill: listening-1 (Focusing). He listens for the letter's name and holds it while
// he looks at the three bulbs. A miss names the one he tapped and says the name again.
// Academic skill: letter names, A to Z in Joyce's four groups (steps connor-names-1 to 4).
import { el } from "../play/stage.mjs";
import { mountSteps, choice, makeMemory } from "../play/steps.mjs";
import { SKIN } from "./skin.mjs";
import { LEVELS, letterRound, big, lines } from "./letters.mjs";

const memory = makeMemory();

mountSteps({
  root: document.querySelector("#app"),
  game: "letter-lights",
  skin: SKIN,
  levels: LEVELS,
  async play({ rng, board, ask, level }) {
    const again = memory.due();
    const deal = letterRound(level.letters, rng, { recent: memory.recent, again: again || "" });
    // The help shows the letter to match, so he can find it by its shape.
    const model = el("p", "ask-card model", big(deal.target));
    model.hidden = true;
    board.append(model);
    const row = el("div", "row picks");
    const buttons = deal.choices.map((letter, index) => {
      const button = choice(big(letter), { value: letter, label: big(letter) });
      SKIN.dress(button, index);
      row.append(button);
      return button;
    });
    board.append(row);
    const clean = await ask({
      prompt: lines.prompt(deal.target),
      buttons,
      right: (button) => button.dataset.value === deal.target,
      miss: (button) => lines.miss(button.dataset.value, deal.target),
      hint: () => { model.hidden = false; return lines.hint(deal.target); }
    });
    memory.done(deal.target, clean, deal.target === again);
    return { clean, item: big(deal.target), piece: big(deal.target), said: lines.right(deal.target) };
  }
});
