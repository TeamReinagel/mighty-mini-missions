// Essential skill: listening-1. He listens for his name and finds the card that says it.
import { el, kid } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { untilRight } from "../play/until.mjs";
import { MEADOW, nameRound } from "../play/readiness.mjs";

const LADDER = [
  { id: "two", label: "Two", hello: "Your name is on one card.", go: "Find your name", count: 2, sameStart: false, flag: "name-two", next: "three" },
  { id: "three", label: "Three", hello: "One card starts like yours. Look at the whole name.", go: "Find your name", count: 3, sameStart: true, flag: "name-three" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "my-name",
  title: "My Name",
  background: MEADOW,
  ladder: LADDER,
  skill: "Name in print",
  prizeSrc: "assets/icon.jpg",
  win: "That card says your name.",
  keep: "That card says your name.",
  async play({ rng, ui, spec }) {
    const who = kid();
    const deal = nameRound(rng, who.name, spec);
    ui.scene.replaceChildren();
    const model = el("div", "name-model");
    const face = document.createElement("img");
    face.className = "who-card";
    face.src = `../avatars/${who.id}.jpg`;
    face.alt = "";
    const sample = el("p", "name-sample", deal.name);
    model.append(face, sample);
    const row = el("div", "row");
    const buttons = deal.cards.map((card) => {
      const button = el("button", "pic nameword", card);
      button.type = "button";
      button.dataset.name = card;
      button.setAttribute("aria-label", card);
      row.append(button);
      return button;
    });
    ui.scene.append(model, row);
    const clean = await untilRight(ui, buttons, {
      prompt: `Find ${deal.name}.`,
      right: (button) => button.dataset.name.toLowerCase() === deal.name.toLowerCase(),
      miss: (button) => `That says ${button.dataset.name}. Find ${deal.name}.`
    });
    return { clean, item: deal.name };
  }
});
