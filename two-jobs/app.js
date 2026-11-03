// Essential skill: problem-solving-1. He follows the two pictured jobs in order.
import { el, shake } from "../play/stage.mjs";
import { mountLadder } from "../play/ladder.mjs";
import { bump } from "../play/bump.mjs";
import { MEADOW, THING_SRC, jobRound } from "../play/readiness.mjs";

const LADDER = [
  { id: "two", label: "Two", hello: "Two jobs. Do the first one, then the next.", go: "Do two jobs", extra: 0, flag: "jobs-two", next: "extra" },
  { id: "extra", label: "Extra", hello: "One picture is not a job. Do the two in the row.", go: "Do two jobs", extra: 1, flag: "jobs-extra" }
];

mountLadder({
  root: document.querySelector("#app"),
  game: "two-jobs",
  title: "Two Jobs",
  background: MEADOW,
  ladder: LADDER,
  skill: "Two-step directions",
  prizeSrc: "assets/icon.jpg",
  win: "You did the first job, then the next.",
  keep: "Those were the two jobs.",
  play({ rng, ui, spec }) {
    const deal = jobRound(rng, undefined, { steps: 2, extra: spec.extra });
    ui.scene.replaceChildren();
    const strip = el("div", "strip");
    const marks = deal.order.map((item, index) => {
      const step = el("div", index === 0 ? "step on" : "step");
      const img = document.createElement("img");
      img.src = THING_SRC[item.id];
      img.alt = "";
      step.append(img);
      if (index === 0) strip.append(step);
      else {
        strip.append(el("span", "then", "then"), step);
      }
      return step;
    });
    const row = el("div", "row");
    const buttons = deal.crowd.map((item) => {
      const button = el("button", "pic");
      button.type = "button";
      button.dataset.id = item.id;
      button.setAttribute("aria-label", item.name);
      const img = document.createElement("img");
      img.src = THING_SRC[item.id];
      img.alt = "";
      button.append(img);
      row.append(button);
      return button;
    });
    ui.scene.append(strip, row);
    const [first, second] = deal.order;
    ui.speak(`Tap the ${first.name}, then the ${second.name}.`);
    return new Promise((resolve) => {
      let at = 0;
      let clean = true;
      let settled = false;
      for (const button of buttons) {
        button.addEventListener("click", () => {
          if (settled || button.disabled) return;
          const want = deal.order[at];
          if (button.dataset.id !== want.id) {
            clean = false;
            shake(button);
            bump(false);
            ui.speak(`The ${want.name} is next.`);
            return;
          }
          bump(true);
          button.disabled = true;
          marks[at].classList.remove("on");
          marks[at].classList.add("done");
          at += 1;
          if (at < deal.order.length) {
            marks[at].classList.add("on");
            ui.speak(`Now the ${deal.order[at].name}.`);
            return;
          }
          settled = true;
          for (const other of buttons) other.disabled = true;
          resolve({ clean, item: deal.order.map((item) => item.id).join("-") });
        });
      }
    });
  }
});
