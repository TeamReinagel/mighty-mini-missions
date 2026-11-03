// Essential skill: listening-1. He listens for a shape and taps that block.
import { el } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { untilRight } from "../play/until.mjs";
import { MEADOW, SHAPES, shapeRound } from "../play/readiness.mjs";

const LADDER = [
  { id: "three", label: "Three", hello: "Circle, square, and triangle.", go: "Find a shape", count: 3, flag: "shapes-three", next: "four" },
  { id: "four", label: "Four", hello: "Now there is a rectangle too.", go: "Find a shape", count: 4, flag: "shapes-four" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "shape-tap",
  title: "Shape Blocks",
  background: MEADOW,
  ladder: LADDER,
  skill: "Basic shapes",
  prizeSrc: "assets/icon.jpg",
  win: "That block is the one.",
  keep: "That was the right block.",
  async play({ rng, ui, spec }) {
    const deal = shapeRound(rng, SHAPES, spec.count);
    ui.scene.replaceChildren();
    const row = el("div", "row");
    const buttons = deal.choices.map((shape) => {
      const button = el("button", "pic shape");
      button.type = "button";
      button.dataset.id = shape.id;
      button.setAttribute("aria-label", shape.name);
      const img = document.createElement("img");
      img.src = shape.src;
      img.alt = "";
      button.append(img);
      row.append(button);
      return button;
    });
    ui.scene.append(row);
    const clean = await untilRight(ui, buttons, {
      prompt: `Tap the ${deal.target.name}.`,
      right: (button) => button.dataset.id === deal.target.id,
      miss: (button) => `That one is a ${button.dataset.id}. Find the ${deal.target.name}.`
    });
    return { clean, item: deal.target.id };
  }
});
