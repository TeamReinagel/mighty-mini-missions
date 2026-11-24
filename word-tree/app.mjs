// Essential skill: listening-1 (Focusing). She listens to the whole word before she taps,
// and a miss says what she tapped, so she listens once more and looks again.
// Academic skill: sight words, Joyce's sets 1 and 2 (steps gabi-sight-1, gabi-sight-2).
import { mountSteps, choice, makeMemory } from "../play/steps.mjs";
import { SKIN } from "./skin.mjs";
import { LEVELS, wordRound, shown, prompt, missLine, hintLine } from "./words.mjs";

const memory = makeMemory();

mountSteps({
  root: document.querySelector("#app"),
  game: "word-tree",
  skin: SKIN,
  levels: LEVELS,
  async play({ rng, board, level, ask }) {
    const again = memory.due();
    const deal = wordRound(level.words, rng, { recent: memory.recent, again: again || "" });
    const row = document.createElement("div");
    row.className = "row picks";
    const buttons = deal.choices.map((word, index) => {
      const button = choice(shown(word), { value: word, label: shown(word) });
      SKIN.dress(button, index);
      row.append(button);
      return button;
    });
    board.append(row);
    // The words still on screen (a missed one greys out), so a clue tells them apart.
    const left = () => buttons.filter((button) => !button.disabled).map((button) => button.dataset.value);
    const clean = await ask({
      prompt: prompt(deal.target),
      buttons,
      right: (button) => button.dataset.value === deal.target,
      miss: (button) => missLine(button.dataset.value, deal.target, left()),
      hint: () => hintLine(deal.target, left())
    });
    memory.done(deal.target, clean, deal.target === again);
    return { clean, item: deal.target, piece: shown(deal.target) };
  }
});
