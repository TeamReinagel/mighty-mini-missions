// Essential skill: listening-1. He listens for bigger or smaller and taps that one.
import { el } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { untilRight } from "../play/until.mjs";
import { MEADOW, THING_SRC, missSize, sizeRound } from "../play/readiness.mjs";

const LADDER = [
  { id: "two", label: "Two", hello: "One is big. One is little.", go: "Look at the sizes", count: 2, flag: "size-two", next: "three" },
  { id: "three", label: "Three", hello: "Now there is a middle size too.", go: "Look at the sizes", count: 3, flag: "size-three" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "big-little",
  title: "Big or Little",
  background: MEADOW,
  ladder: LADDER,
  skill: "Larger and smaller",
  prizeSrc: "assets/icon.jpg",
  win: "That size is the one.",
  keep: "That was the right size.",
  async play({ rng, ui, spec }) {
    const deal = sizeRound(rng, undefined, spec.count);
    ui.scene.replaceChildren();
    const row = el("div", "row");
    const buttons = deal.sizes.map((size) => {
      const button = el("button", `pic ${size}`);
      button.type = "button";
      button.dataset.size = size;
      button.setAttribute("aria-label", `${size} ${deal.thing.name}`);
      const img = document.createElement("img");
      img.src = THING_SRC[deal.thing.id];
      img.alt = "";
      button.append(img);
      row.append(button);
      return button;
    });
    ui.scene.append(row);
    const word = deal.ask === "bigger" ? "bigger" : "smaller";
    const clean = await untilRight(ui, buttons, {
      prompt: `Tap the ${word} ${deal.thing.name}.`,
      right: (button) => button.dataset.size === deal.answer,
      miss: (button) => missSize(deal.ask, button.dataset.size)
    });
    return { clean, item: `${deal.thing.id}-${deal.ask}` };
  }
});
