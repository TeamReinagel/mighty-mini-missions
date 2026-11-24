// Shared loop for the step games (Word Tree, Word Workshop, Penguin Pond, Letter Lights).
//
// One problem at a time. A picture at the top of the scene fills one piece per finished problem,
// so what "done" looks like stays in view the whole round. Each level is one of Joyce's steps:
// opened from a Joyce card (?step=...), the game stays on that level and reports to that step.
// Opened from the home screen, three clean first tries in a row opens the next level.
//
// The game supplies `play({ rng, board, ui, level, ask })`, which draws one problem into `board`
// and resolves `{ clean, item, piece }`. `piece` is what the picture gets (a word, a letter, a fish).
// The skin supplies the look: `title`, `background`, `prize`, `goal(total)` and `fill(goal, i, piece)`.

import { el, fresh, load, save, openGame, streak, markReady, practice, stepParam, kid } from "./stage.mjs";
import { runRounds } from "./set.mjs";
import { roundsFor } from "./round-length.mjs";
import { bump } from "./bump.mjs";

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Which level a Joyce step opens, or null. */
export function levelForStep(levels, step) {
  if (!step) return null;
  return levels.find((level) => (level.steps || []).includes(step)) || null;
}

/** Opens every level up to and including `id`, keeping what was already open. */
export function openThrough(levels, open, id) {
  const index = levels.findIndex((level) => level.id === id);
  const have = new Set(open || []);
  levels.slice(0, index + 1).forEach((level) => have.add(level.id));
  return levels.map((level) => level.id).filter((levelId) => have.has(levelId));
}

/**
 * One choice with a single right answer. The first tap is the try that counts. A miss greys
 * that choice out (the choice narrows), says what the tapped one is, and the child keeps going.
 * `hint` is spoken by the hint button; using it before the first tap means the try is not clean.
 */
export function makeAsk(ui) {
  return function ask({ prompt, buttons, right, miss, hint, onMiss }) {
    ui.speak(prompt);
    return new Promise((resolve) => {
      let clean = true;
      let settled = false;
      // For the browser checks in tools: which choice is right on this problem.
      window.__answer = () => buttons.find((button) => right(button))?.dataset.value ?? null;
      ui.setHint(hint ? () => {
        clean = false;
        ui.speak(typeof hint === "function" ? hint() : hint);
      } : null);
      for (const button of buttons) {
        button.addEventListener("click", () => {
          if (settled || button.disabled) return;
          button.classList.add("pressed");
          setTimeout(() => button.classList.remove("pressed"), 160);
          if (!right(button)) {
            clean = false;
            bump(false);
            button.disabled = true;
            button.classList.add("tried");
            if (!reduced()) {
              button.classList.remove("bad");
              void button.offsetWidth;
              button.classList.add("bad");
            }
            ui.speak(typeof miss === "function" ? miss(button) : miss);
            onMiss?.(button);
            // With one choice left, it is the answer; leave it for the child to tap.
            return;
          }
          settled = true;
          bump(true);
          button.classList.add("right");
          for (const other of buttons) if (other !== button) other.disabled = true;
          ui.setHint(null);
          resolve(clean);
        });
      }
    });
  };
}

export function mountSteps({ root, game, skin, levels, play }) {
  const rng = fresh();
  const forced = levelForStep(levels, stepParam());
  const state = load(game) || { stars: {}, open: [levels[0].id], prizes: [] };
  state.open = (state.open || []).filter((id) => levels.some((level) => level.id === id));
  if (!state.open.length) state.open = [levels[0].id];
  if (forced) state.open = openThrough(levels, state.open, forced.id);
  save(game, state);

  let level = forced?.id || state.at || state.open.at(-1);
  if (!state.open.includes(level)) level = state.open.at(-1);
  let pending = null;
  let farewell = skin.say.roundDone;
  let filled = 0;

  const base = openGame(root, { title: skin.title, background: skin.background });
  document.body.classList.add(`skin-${game}`);
  const hintButton = el("button", "hint-btn", skin.say.hintLabel || "Hint");
  hintButton.type = "button";
  hintButton.hidden = true;
  hintButton.setAttribute("aria-label", "Get a hint");
  let hintFn = null;
  hintButton.addEventListener("click", () => hintFn?.());
  document.querySelector(".line-row")?.append(hintButton);

  const ui = {
    ...base,
    setHint(fn) {
      hintFn = fn;
      hintButton.hidden = !fn;
    }
  };
  const ask = makeAsk(ui);

  const current = () => levels.find((item) => item.id === level) || levels[0];
  const total = () => roundsFor(game, kid().id);
  let goal = null;

  function drawGoal() {
    goal = skin.goal(total());
    goal.classList.add("goal");
    return goal;
  }

  function showPrizes() {
    base.prizes((state.prizes || []).slice(-12));
  }

  async function one() {
    const spec = current();
    base.scene.replaceChildren();
    const board = el("div", "board");
    base.scene.append(goal, board);
    const result = await play({ rng, board, ui, level: spec, ask });
    const clean = result?.clean === true;
    skin.fill(goal, filled, result?.piece, { still: reduced() });
    filled += 1;
    const opened = streak(state, spec.id, clean);
    if (opened && spec.flag) markReady(spec.flag);
    if (opened && spec.next && !forced && !state.open.includes(spec.next)) {
      state.open = openThrough(levels, state.open, spec.next);
      pending = spec.next;
    }
    save(game, state);
    // Only a level that is the Joyce step this card opened reports to that step.
    const step = forced && forced.id === spec.id ? stepParam() : "";
    practice({ game, skill: spec.skill, step, item: String(result?.item ?? spec.id), correct: clean });
    base.stars(state.stars?.[spec.id]?.streak || 0);
    // A game can name what was just made ("snow plus man makes snowman"); else the skin cheers.
    const cheer = clean ? pickLine(skin.say.right) : pickLine(skin.say.kept);
    ui.speak(result?.said ? `${result.said} ${cheer}` : cheer);
  }

  function pickLine(lines) {
    return Array.isArray(lines) ? lines[Math.floor(rng() * lines.length)] : lines;
  }

  function levelRow(scene, redraw) {
    if (forced || levels.length < 2) return;
    const row = el("div", "row levels");
    for (const spec of levels) {
      const button = el("button", spec.id === level ? "level on" : "level", spec.label);
      button.type = "button";
      button.disabled = !state.open.includes(spec.id);
      button.addEventListener("click", () => {
        level = spec.id;
        state.at = level;
        save(game, state);
        redraw();
      });
      row.append(button);
    }
    scene.append(row);
  }

  base.stars(state.stars?.[level]?.streak || 0);
  showPrizes();

  runRounds({
    ui: base,
    game,
    play: one,
    pause: 650,
    line: () => farewell,
    before() {
      pending = null;
      filled = 0;
      farewell = skin.say.roundDone;
      drawGoal();
      const spec = current();
      if (spec.hello) ui.speak(spec.hello);
    },
    after() {
      ui.setHint(null);
      state.prizes = [...(state.prizes || []), { id: `${game}-${Date.now()}`, src: skin.prize, alt: skin.title }];
      save(game, state);
      showPrizes();
      if (pending) {
        level = pending;
        state.at = level;
        save(game, state);
        pending = null;
        farewell = `${skin.say.roundDone} ${skin.say.nextOpen}`;
      }
    },
    rest(scene, redraw) {
      if (goal) scene.prepend(goal);
      levelRow(scene, redraw);
    }
  });
}

/**
 * Items missed on their first try come back a couple of problems later (a try changes what
 * happens next). `recent` keeps the last few items from repeating right away.
 */
export function makeMemory({ wait = 2, keep = 4 } = {}) {
  const owed = [];
  const recent = [];
  return {
    recent,
    /** The item owed now, if any. Call once per problem. */
    due() {
      owed.forEach((entry) => { entry.wait -= 1; });
      const index = owed.findIndex((entry) => entry.wait <= 0);
      return index < 0 ? null : owed.splice(index, 1)[0].item;
    },
    /** After a problem: remember it, and owe it back if it was missed. */
    done(item, clean, wasOwed) {
      recent.push(item);
      if (recent.length > keep) recent.shift();
      if (!clean && !wasOwed) owed.push({ item, wait });
    }
  };
}

/** A big choice button that holds text (a word, a number, a letter). */
export function choice(text, { className = "", label, value } = {}) {
  const button = el("button", `pick ${className}`.trim());
  button.type = "button";
  button.dataset.value = value ?? text;
  button.setAttribute("aria-label", label || String(text));
  button.append(el("span", "pick-text", String(text)));
  return button;
}
