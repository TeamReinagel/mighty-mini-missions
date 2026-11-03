// Essential skill: planning-3. He looks carefully and puts each thing in the matching basket.
import { el } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { untilRight } from "../play/until.mjs";
import { MEADOW, THING_SRC, colorRound, kindRound, missSort } from "../play/readiness.mjs";

const LADDER = [
  { id: "color", label: "Color", hello: "Each basket keeps one color.", go: "Sort by color", by: "color", flag: "sort-color", next: "kind" },
  { id: "kind", label: "Kind", hello: "Food goes with food. Toys go with toys.", go: "Sort by kind", by: "kind", flag: "sort-kind" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "basket-sort",
  title: "Basket Sort",
  background: MEADOW,
  ladder: LADDER,
  skill: "Sorting into groups",
  prizeSrc: "assets/icon.jpg",
  win: "That basket matches.",
  keep: "That basket was the match.",
  async play({ rng, ui, spec }) {
    const deal = spec.by === "kind" ? kindRound(rng) : colorRound(rng);
    ui.scene.replaceChildren();
    const held = document.createElement("img");
    held.className = "hero";
    held.src = THING_SRC[deal.item.id];
    held.alt = "";
    const row = el("div", "row");
    const buttons = deal.models.map((model) => {
      const button = el("button", "basket");
      button.type = "button";
      button.dataset.id = model.id;
      button.setAttribute("aria-label", `${model.color} ${model.kind} basket`);
      const img = document.createElement("img");
      img.src = THING_SRC[model.id];
      img.alt = "";
      button.append(img);
      row.append(button);
      return button;
    });
    ui.scene.append(held, row);
    const prompt = deal.by === "kind"
      ? `Put the ${deal.item.name} with the same kind.`
      : `Put the ${deal.item.name} with the same color.`;
    const clean = await untilRight(ui, buttons, {
      prompt,
      right: (button) => {
        const model = deal.models.find((item) => item.id === button.dataset.id);
        return deal.by === "kind" ? model.kind === deal.item.kind : model.color === deal.item.color;
      },
      miss: (button) => missSort(deal.item, deal.models.find((item) => item.id === button.dataset.id), deal.by)
    });
    return { clean, item: `${deal.by}-${deal.item.id}` };
  }
});
