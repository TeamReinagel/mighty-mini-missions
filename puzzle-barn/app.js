// The Gem Gym (the folder is puzzle-barn): problem-solving puzzles for Max. See docs/puzzle-barn-brief.md.
// The look is Word Monsters: crystal block towers, monster scales with gems, and a team that evolves.
// Essential skill: adapting-3 (Persisting). The moment: a miss or a hint, then the solve.
// Puzzles come only from bank.json, which tools/build-bank.mjs builds and the tests check.

import { openGame, el, load, save, chime, shake, levelRow, streak, quiet } from "../play/stage.mjs";
import { log } from "../play/kit.mjs";
import { runRounds } from "../play/set.mjs";
import { stackHint, stackMiss, scaleHint, scaleMiss } from "./puzzles/hints.mjs";
import { monster, SPECIES } from "./monster.mjs";

// Max named it (2026-11-06). The folder and saved progress keep "puzzle-barn".
export const NAME = "The Gem Gym";

const GAME = "puzzle-barn";
const TYPES = {
  stack: { label: "Towers", skill: "Number stacks" },
  scale: { label: "Scales", skill: "Balance puzzles" }
};
const LEVELS = ["stack", "scale"].flatMap((type) => [1, 2, 3, 4].map((n) => ({ id: `${type}-${n}`, type, n, label: `${TYPES[type].label} ${n}` })));
const IDLE_MS = 45000;
const EXPLAIN_EVERY = 3;
const MAX_GEMS = 12;
const SPARKS_TO_GROW = 2; // solved puzzles before the partner evolves, or a new monster hatches
const WORLD = { stack: "../word-monsters/images/bg-cave.webp", scale: "../word-monsters/images/bg-castle.webp" };

const state = load(GAME) || {};
const ui = openGame(document.querySelector("#app"), { title: NAME, background: WORLD.stack });
document.title = NAME;
state.open = state.open?.length ? state.open : ["stack-1", "scale-1"];
state.stars = state.stars || {};
state.seen = state.seen || {};
state.solves = state.solves || 0;
state.team = state.team || []; // [{ species, stage, sparks }]
state.partner = state.partner || 0;
let level = state.open.includes(state.level) ? state.level : state.open[0];
const bank = await fetch("bank.json").then((r) => r.json());
let active = null;

const button = (className, text, label) => {
  const b = el("button", className, text);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  return b;
};

function pick(spec) {
  const list = bank[spec.type][spec.n];
  const recent = state.seen[spec.id] || [];
  const fresh = list.filter((p) => !recent.includes(p.id));
  const chosen = (fresh.length ? fresh : list)[Math.floor(Math.random() * (fresh.length || list.length))];
  state.seen[spec.id] = [...recent, chosen.id].slice(-Math.min(25, Math.floor(list.length * 0.6)));
  return chosen;
}

/** The Hint button glows after a quiet spell. It never offers a hint by itself. */
function idleGlow(hint) {
  let timer = 0;
  const arm = () => {
    hint.classList.remove("glow");
    clearTimeout(timer);
    timer = setTimeout(() => hint.classList.add("glow"), IDLE_MS);
  };
  ui.scene.addEventListener("pointerdown", arm);
  arm();
  return () => {
    clearTimeout(timer);
    ui.scene.removeEventListener("pointerdown", arm);
  };
}

function frame() {
  ui.scene.replaceChildren();
  const board = el("div", "board");
  const twin = el("div", "twin");
  const below = el("div", "below");
  const tools = el("div", "tools");
  const hint = button("go hint", "Hint", "Get a hint");
  tools.append(hint);
  ui.scene.append(board, twin, below, tools);
  return { board, twin, below, tools, hint };
}

async function speakAll(lines) {
  for (const line of lines) await ui.speak(line);
}

// ---------- "How did you know?" ----------

function explain() {
  state.solves += 1;
  save(GAME, state);
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (state.solves % EXPLAIN_EVERY !== 0 || !Rec) return Promise.resolve(null);
  return new Promise((resolve) => {
    ui.scene.replaceChildren();
    const panel = el("div", "explain");
    const talk = button("go play", "Tap and tell me", "Tap, then say how you figured it out");
    const skip = button("go", "Skip");
    panel.append(el("p", "tale", "How did you figure that out?"), talk, skip);
    ui.scene.append(panel);
    ui.speak("How did you figure that out? Tap the button and tell me.");
    let listening = false;
    talk.addEventListener("click", () => {
      if (listening) return;
      quiet();
      listening = true;
      talk.textContent = "Listening…";
      const rec = new Rec();
      rec.lang = "en-US";
      rec.interimResults = false;
      let heard = "";
      rec.onresult = (event) => { heard = [...event.results].map((r) => r[0].transcript).join(" ").trim(); };
      rec.onerror = () => {};
      rec.onend = () => {
        listening = false;
        if (!heard) {
          talk.textContent = "Tap and tell me";
          ui.speak("I didn't catch that. You can try again, or skip.");
          return;
        }
        ui.speak("Thanks for telling me how you thought about it.");
        resolve(heard);
      };
      try { rec.start(); } catch { listening = false; resolve(null); }
    });
    skip.addEventListener("click", () => resolve("skipped"));
  });
}

function finish(entry) {
  entry.logged = true;
  log({ game: GAME, skill: TYPES[entry.type].skill, item: entry.id, correct: entry.firstRight, extra: entry.extra() });
}

// A puzzle left unfinished still counts as what happened.
window.addEventListener("pagehide", () => {
  if (!active || active.logged) return;
  active.logged = true;
  log({ game: GAME, skill: TYPES[active.type].skill, item: active.id, correct: null, extra: { ...active.extra(), solved: false } });
});

// ---------- Block Towers ----------

function blockRows(parent, size, label) {
  const cells = {};
  for (let r = size - 1; r >= 0; r -= 1) {
    const row = el("div", "block-row");
    for (let c = 0; c < size - r; c += 1) {
      const id = `${r},${c}`;
      cells[id] = label(id, row);
    }
    parent.append(row);
  }
  return cells;
}

function playStack(p) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const known = Object.fromEntries(p.shown.map((id) => [id, p.values[id]]));
    const firsts = {};
    const hinted = new Set(); // a first try after a hint on that block is not a first try
    let misses = 0;
    let maxHint = 0;
    let ladder = { cell: null, step: 0 };
    let selected = null;
    let typed = "";
    const view = frame();
    const stack = el("div", "tower");
    view.board.append(stack);
    const blocks = blockRows(stack, p.size, (id, row) => {
      const shown = p.shown.includes(id);
      const block = shown ? el("div", "block", String(p.values[id])) : button("block blank", "", "Empty block");
      if (!shown) block.addEventListener("click", () => select(id));
      row.append(block);
      return block;
    });
    const entry = active = {
      type: "stack",
      id: p.id,
      firstRight: true,
      extra: () => ({ level: p.level, solved: Object.keys(known).length === p.size * (p.size + 1) / 2, misses, hint: maxHint, seconds: Math.round((Date.now() - t0) / 1000), firsts })
    };

    const pad = el("div", "pad");
    for (const key of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Back", "0", "OK"]) {
      const k = button(key === "OK" ? "key ok" : key === "Back" ? "key word" : "key", key, key === "Back" ? "Erase" : key === "OK" ? "Put it in" : key);
      k.addEventListener("click", () => press(key));
      pad.append(k);
    }
    view.below.append(pad);
    pad.hidden = true;

    const marks = () => {
      for (const [id, block] of Object.entries(blocks)) {
        block.classList.remove("look", "clash", "pencil", "on");
        if (known[id] === undefined) block.textContent = id === selected ? typed || "?" : "";
      }
      if (selected) blocks[selected].classList.add("on");
    };

    function select(id) {
      if (known[id] !== undefined) return;
      selected = id;
      typed = "";
      view.twin.replaceChildren();
      pad.hidden = false;
      marks();
    }

    function press(key) {
      if (!selected) return;
      if (key === "Back") typed = typed.slice(0, -1);
      else if (key === "OK") return typed && submit(Number(typed));
      else if (typed.length < 3) typed = typed === "0" ? key : typed + key;
      marks();
    }

    function submit(value) {
      const id = selected;
      const block = blocks[id];
      const right = value === p.values[id];
      if (firsts[id] === undefined) firsts[id] = right && !hinted.has(id);
      if (!firsts[id]) entry.firstRight = false;
      typed = "";
      if (right) {
        known[id] = value;
        selected = null;
        pad.hidden = true;
        block.textContent = String(value);
        block.className = "block inked";
        block.disabled = true;
        chime(true);
        marks();
        if (Object.keys(known).length === p.size * (p.size + 1) / 2) return solved();
        ui.speak("That fits.");
        return;
      }
      misses += 1;
      chime(false);
      shake(block);
      const miss = stackMiss(p, known, id, value);
      marks();
      if (miss.pencil) {
        for (const [cell, v] of Object.entries(miss.pencil)) {
          if (known[cell] !== undefined) continue;
          blocks[cell].textContent = String(v);
          blocks[cell].classList.add("pencil");
        }
        if (miss.clash) blocks[miss.clash.cell].classList.add("clash");
      }
      ui.speak(miss.line);
    }

    view.hint.addEventListener("click", async () => {
      const focus = stackHint(p, known, 1).cell;
      if (ladder.cell !== focus) ladder = { cell: focus, step: 0 };
      ladder.step = Math.min(3, ladder.step + 1);
      maxHint = Math.max(maxHint, ladder.step);
      const hint = stackHint(p, known, ladder.step);
      hinted.add(hint.cell);
      selected = null;
      pad.hidden = true;
      marks();
      blocks[hint.cell].classList.add("look");
      if (hint.step < 3) return ui.speak(hint.line);
      view.twin.replaceChildren(el("p", "tag", "One like it"));
      const mini = el("div", "tower mini-tower");
      view.twin.append(mini);
      const hidden = [];
      blockRows(mini, hint.twin.size, (id, row) => {
        const shown = hint.twin.shown.includes(id);
        const block = el("div", shown ? "block" : "block blank", shown ? String(hint.twin.values[id]) : "?");
        if (!shown) hidden.push([block, hint.twin.values[id]]);
        row.append(block);
        return block;
      });
      for (const [i, line] of hint.lines.entries()) {
        await ui.speak(line);
        if (i === hint.lines.length - 2) for (const [block, v] of hidden) { block.textContent = String(v); block.className = "block inked"; }
      }
    });

    const stopGlow = idleGlow(view.hint);
    ui.speak(p.level === 4
      ? "Each block is the two blocks under it put together. This tower needs a good guess somewhere."
      : "Each block is the two blocks under it put together. Tap an empty block and fill it in.");

    async function solved() {
      stopGlow();
      stack.classList.add("done");
      await ui.speak(misses || maxHint ? "You stuck with it, and the tower is done." : "The whole tower is done.");
      const said = await explain();
      entry.extra = ((base) => () => ({ ...base(), explained: said }))(entry.extra);
      finish(entry);
      resolve({ clean: maxHint < 3 });
    }
  });
}

// ---------- Monster Scales ----------
// The little and big monsters are the partner's own species: stage 1 and stage 3.

function gem() {
  const img = document.createElement("img");
  img.src = "assets/gem.png";
  img.alt = "gem";
  img.className = "thing gem";
  img.draggable = false;
  return img;
}

function picture(thing) {
  if (thing === "gem") return gem();
  return monster(partner().species, thing === "big" ? 3 : 1, `thing ${thing}`);
}

function things(side) {
  const pan = el("div", "pan");
  for (const thing of ["big", "little", "gem"]) for (let i = 0; i < (side[thing] || 0); i += 1) pan.append(picture(thing));
  return pan;
}

function scaleView({ left, right }, className = "") {
  const scale = el("div", `scale ${className}`.trim());
  const beam = el("div", "beam");
  const leftPan = things(left);
  const rightPan = right ? things(right) : el("div", "pan gems");
  beam.append(leftPan, el("span", "pivot"), rightPan);
  const stand = document.createElement("img");
  stand.src = "assets/stand.png";
  stand.alt = "";
  stand.className = "stand";
  scale.append(beam, stand);
  return { scale, beam, rightPan };
}

function playScale(p) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let misses = 0;
    let maxHint = 0;
    let step = 0;
    let checks = 0;
    let gems = 0;
    const view = frame();
    const facts = p.facts.map((fact) => scaleView(fact, "fact"));
    const known = el("div", "facts");
    facts.forEach((f) => known.append(f.scale));
    const ask = scaleView({ left: p.ask }, "ask");
    view.board.append(known, el("p", "tag", "How many gems balance this one?"), ask.scale);
    const entry = active = {
      type: "scale",
      id: p.id,
      firstRight: false,
      extra: () => ({ level: p.level, kind: p.kind, solved: false, misses, hint: maxHint, seconds: Math.round((Date.now() - t0) / 1000), checks })
    };

    const add = button("go add", "", "Add a gem");
    add.append(gem(), el("span", "", "Add a gem"));
    const letGo = button("go play", "Let go", "Let go of the scale");
    view.below.append(add, letGo);
    const level = () => ask.beam.classList.remove("tilt-left", "tilt-right");

    const drawGems = () => {
      ask.rightPan.replaceChildren();
      for (let i = 0; i < gems; i += 1) {
        const one = button("take", "", "Take this gem off");
        one.append(gem());
        one.addEventListener("click", () => { gems -= 1; level(); drawGems(); });
        ask.rightPan.append(one);
      }
      add.disabled = gems >= MAX_GEMS;
    };
    add.addEventListener("click", () => {
      if (gems >= MAX_GEMS) return;
      gems += 1;
      level();
      drawGems();
      chime(true);
    });
    letGo.addEventListener("click", async () => {
      if (!gems) return ui.speak("Put some gems on the empty pan first.");
      checks += 1;
      if (gems === p.answer) {
        if (checks === 1 && !maxHint) entry.firstRight = true;
        level();
        ask.scale.classList.add("done");
        add.disabled = true;
        letGo.disabled = true;
        chime(true);
        stopGlow();
        await ui.speak(misses || maxHint ? `${gems} gems. It balances. You stuck with it.` : `${gems} gems. It balances.`);
        const said = await explain();
        entry.extra = ((base) => () => ({ ...base(), solved: true, explained: said }))(entry.extra);
        finish(entry);
        resolve({ clean: maxHint < 3 });
        return;
      }
      misses += 1;
      const miss = scaleMiss(p, gems);
      ask.beam.classList.add(miss.tip === "down" ? "tilt-right" : "tilt-left");
      chime(false);
      ui.speak(miss.line);
    });

    view.hint.addEventListener("click", async () => {
      step = Math.min(3, step + 1);
      maxHint = Math.max(maxHint, step);
      const hint = scaleHint(p, step);
      facts.forEach((f) => f.scale.classList.remove("look"));
      if (hint.focus !== undefined) facts[hint.focus]?.scale.classList.add("look");
      if (step < 3) return ui.speak(hint.line);
      view.twin.replaceChildren(el("p", "tag", "One like it"));
      const box = el("div", "facts mini-facts");
      hint.twin.facts.forEach((fact) => box.append(scaleView(fact, "fact").scale));
      box.append(scaleView({ left: hint.twin.ask }, "ask").scale);
      view.twin.append(box);
      await speakAll(hint.lines);
    });

    drawGems();
    const stopGlow = idleGlow(view.hint);
    ui.speak("Every scale on top is balanced. How many gems balance the last scale? Tap Add a gem, then let go.");
  });
}

// ---------- The team ----------
// Every solved puzzle powers up the partner, hints or not: sticking with it is what counts.
// Two sparks evolve it. A partner at stage 3 hatches a new monster for the team instead.

const partner = () => state.team[state.partner] || state.team[0] || { species: 0, stage: 1, sparks: 0 };

function shelf() {
  const row = document.querySelector(".shelf");
  if (!row) return;
  row.replaceChildren();
  state.team.forEach((m, i) => {
    const pick = button(i === state.partner ? "mate on" : "mate", "", i === state.partner ? "Your partner" : "Make this monster your partner");
    pick.append(monster(m.species, m.stage));
    pick.addEventListener("click", () => {
      state.partner = i;
      save(GAME, state);
      shelf();
    });
    row.append(pick);
  });
}

function sparks(m) {
  const meter = el("div", "sparks");
  for (let i = 0; i < SPARKS_TO_GROW; i += 1) meter.append(el("span", i < m.sparks ? "spark on" : "spark"));
  return meter;
}

function chooseStarter() {
  return new Promise((resolve) => {
    ui.scene.replaceChildren();
    const row = el("div", "starters");
    const offered = [0, 1, 2].map((i) => (Math.floor(Math.random() * SPECIES) + i * 3) % SPECIES);
    for (const species of offered) {
      const pick = button("starter", "", "Pick this monster");
      pick.append(monster(species, 1));
      pick.addEventListener("click", () => {
        state.team = [{ species, stage: 1, sparks: 0 }];
        state.partner = 0;
        save(GAME, state);
        shelf();
        chime(true);
        resolve();
      });
      row.append(pick);
    }
    ui.scene.append(el("p", "tale", "Pick a partner"), row);
    ui.speak("Pick a monster to be your partner. Solving puzzles helps it grow.");
  });
}

async function grow() {
  const m = partner();
  m.sparks += 1;
  ui.scene.replaceChildren();
  const stage = el("div", "grow");
  let pic = monster(m.species, m.stage, "star");
  stage.append(pic, sparks(m));
  ui.scene.append(stage);
  if (m.sparks < SPARKS_TO_GROW) {
    save(GAME, state);
    return ui.speak("Your partner got a spark.");
  }
  m.sparks = 0;
  if (m.stage < 3) {
    m.stage += 1;
    const next = monster(m.species, m.stage, "star evolved");
    pic.replaceWith(next);
    pic = next;
    stage.querySelector(".sparks").replaceWith(sparks(m));
    save(GAME, state);
    shelf();
    chime(true);
    return ui.speak(m.stage === 3 ? "Your partner evolved! It's fully grown now." : "Your partner evolved!");
  }
  const owned = new Set(state.team.map((t) => t.species));
  const left = [...Array(SPECIES).keys()].filter((s) => !owned.has(s));
  if (!left.length) {
    save(GAME, state);
    return ui.speak("Your whole team is grown. What a team.");
  }
  const species = left[Math.floor(Math.random() * left.length)];
  state.team.push({ species, stage: 1, sparks: 0 });
  state.partner = state.team.length - 1;
  pic.replaceWith(monster(species, 1, "star evolved"));
  stage.querySelector(".sparks").replaceWith(sparks(partner()));
  save(GAME, state);
  shelf();
  chime(true);
  return ui.speak("A new monster hatched and joined your team. It's your partner now.");
}

// ---------- Rounds and levels ----------

async function round() {
  const spec = LEVELS.find((l) => l.id === level);
  if (!state.team.length) await chooseStarter();
  const puzzle = pick(spec);
  save(GAME, state);
  ui.scene.style.backgroundImage = `linear-gradient(rgba(20,16,30,.12), rgba(20,16,30,.02)), url("${WORLD[spec.type]}")`;
  const { clean } = spec.type === "stack" ? await playStack(puzzle) : await playScale(puzzle);
  active = null;
  await grow();
  const ready = streak(state, level, clean);
  const next = LEVELS.find((l) => l.type === spec.type && l.n === spec.n + 1);
  if (ready && next && !state.open.includes(next.id)) {
    state.open.push(next.id);
    await ui.speak(`${next.label} is open now. You can pick it after this round.`);
  }
  save(GAME, state);
  ui.stars(state.stars[level]?.streak || 0);
}

function levels(scene, redraw) {
  for (const type of ["stack", "scale"]) {
    levelRow(scene, LEVELS.filter((l) => l.type === type), state, level, (id) => {
      level = id;
      state.level = id;
      save(GAME, state);
      ui.stars(state.stars[level]?.streak || 0);
      redraw();
    });
  }
}

ui.stars(state.stars[level]?.streak || 0);
shelf();
runRounds({ ui, game: GAME, play: round, rest: levels, line: "That round is done. Pick a level, or play another round." });
