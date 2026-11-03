import { shake } from "./stage.mjs";
import { bump } from "./bump.mjs";

// The first tap is the one that counts. A miss stays on this same choice.
export function untilRight(ui, buttons, { prompt, right, miss }) {
  ui.speak(prompt);
  return new Promise((resolve) => {
    let clean = true;
    let settled = false;
    for (const button of buttons) {
      button.addEventListener("click", () => {
        if (settled || button.disabled) return;
        if (!right(button)) {
          clean = false;
          shake(button);
          bump(false);
          ui.speak(typeof miss === "function" ? miss(button) : miss);
          return;
        }
        settled = true;
        for (const other of buttons) other.disabled = true;
        bump(true);
        resolve(clean);
      });
    }
  });
}
