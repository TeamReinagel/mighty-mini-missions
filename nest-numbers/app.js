// Essential skill: listening-1. He listens for a number and taps the nest that says it.
import { el, word } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { untilRight } from "../play/until.mjs";
import { MEADOW, missNumber, numberRound } from "../play/readiness.mjs";

const LADDER = [
  { id: "5", label: "To 5", hello: "The nests have numbers.", go: "Find a number", min: 1, max: 5, preferHigh: false, flag: "numbers-5", next: "10" },
  { id: "10", label: "To 10", hello: "These numbers go higher.", go: "Find a number", min: 1, max: 10, preferHigh: true, flag: "numbers-10" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "nest-numbers",
  title: "Nest Numbers",
  background: MEADOW,
  ladder: LADDER,
  skill: "Identifies numbers 1-10",
  prizeSrc: "assets/icon.jpg",
  win: "That nest is the one.",
  keep: "That was the right nest.",
  async play({ rng, ui, spec }) {
    const deal = numberRound(rng, spec);
    ui.scene.replaceChildren();
    const row = el("div", "row");
    const buttons = deal.choices.map((n) => {
      const button = el("button", "pic");
      button.type = "button";
      button.dataset.value = String(n);
      button.setAttribute("aria-label", word(n));
      button.append(el("span", "letter numeral", String(n)));
      row.append(button);
      return button;
    });
    ui.scene.append(row);
    const clean = await untilRight(ui, buttons, {
      prompt: `Find ${word(deal.target)}.`,
      right: (button) => button.dataset.value === String(deal.target),
      miss: (button) => missNumber(Number(button.dataset.value), deal.target, word)
    });
    return { clean, item: String(deal.target) };
  }
});
