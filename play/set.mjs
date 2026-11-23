import { el, kid, afterLine } from "./stage.mjs";
import { roundsFor } from "./round-length.mjs";

// Plays the set with no button between problems. One button after the set starts another.
export function runRounds({ ui, game, play, pause = 700, line = "That round is done.", before, after, rest }) {
  const count = roundsFor(game, kid().id);
  let running = false;
  const done = ({ speak = true } = {}) => {
    ui.scene.replaceChildren();
    // Sent from a Joyce card: going back to Joyce is the big next touch, another round the small one.
    const back = window.MightyProgress?.joyceButton?.() || null;
    if (speak) {
      const said = typeof line === "function" ? line() : line;
      ui.speak(back ? `${said} Tap the big button to go back to Joyce.` : said);
    }
    const again = el("button", back ? "level" : "go play", "Play another round");
    again.type = "button";
    again.addEventListener("click", () => start());
    if (back) ui.scene.append(back);
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
        if (i < count - 1) await afterLine(pause); // let the last line finish first
      }
      after?.();
    } finally {
      running = false;
    }
    // Send the round's answers now, so Joyce sees all of them when he taps I'm done.
    try { window.MightyProgress?.flush?.(); } catch { /* The queue keeps them for later. */ }
    done();
  };
  return start();
}
