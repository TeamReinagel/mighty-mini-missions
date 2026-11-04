import { el, kid } from "./stage.mjs";
import { roundsFor } from "./round-length.mjs";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays the set with no button between problems. One button after the set starts another.
export function runRounds({ ui, game, play, pause = 700, line = "That round is done.", before, after, rest }) {
  const count = roundsFor(game, kid().id);
  let running = false;
  const done = ({ speak = true } = {}) => {
    ui.scene.replaceChildren();
    if (speak) ui.speak(typeof line === "function" ? line() : line);
    const again = el("button", "go play", "Play another round");
    again.type = "button";
    again.addEventListener("click", () => start());
    ui.scene.append(again);
    rest?.(ui.scene, () => done({ speak: false }));
  };
  const start = async () => {
    if (running) return;
    running = true;
    try {
      before?.();
      for (let i = 0; i < count; i += 1) {
        await play();
        if (i < count - 1) await wait(pause);
      }
      after?.();
    } finally {
      running = false;
    }
    done();
  };
  return start();
}
