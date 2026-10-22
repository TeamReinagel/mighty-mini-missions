import { kid, stepParam, load, save, markReady, say, practice, fresh, el, shell, streak, word } from "./kit.mjs";
import { COLORS, countRound, nameRound, compareRound, patternRound, addWithTrade, subWithTrade, soundRound, teamRound, SOUND_GROUPS, SOUND } from "./rounds.mjs";

const STEP_LEVEL = {
  "ethan-count": "3",
  "connor-count-5": "5",
  "connor-count-10": "10",
  "connor-count-20": "20",
  "gabi-count-10": "10",
  "gabi-count-20": "20",
  "gabi-numbers": "names",
  "connor-sounds-1": "1",
  "connor-sounds-2": "2",
  "gabi-sh": "sh",
  "gabi-ch": "ch",
  "gabi-th": "th",
  "max-regroup-show": "show",
  "max-regroup": "add"
};

function openThrough(ladder, level) {
  const index = ladder.indexOf(level);
  return index < 0 ? [ladder[0]] : ladder.slice(0, index + 1);
}

function remember(game, state) {
  save(game, state);
}

export function mount(id) {
  const root = document.querySelector("#app");
  const games = {
    "color-tap": colorTap,
    "snack-count": snackCount,
    "more-or-fewer": moreOrFewer,
    "pattern-park": patternPark,
    "block-trade": blockTrade,
    "sound-bugs": soundBugs,
    "sound-teams": soundTeams
  };
  (games[id] || missing)(root);
}

function missing(root) {
  root.textContent = "That game is still on the workbench.";
}

function colorTap(root) {
  const ui = shell(root, "Color Tap");
  const state = load("color-tap") || { stars: {} };
  let first = true;
  const rng = fresh();
  const play = () => {
    first = true;
    const answer = COLORS[Math.floor(rng() * COLORS.length)];
    ui.stage.replaceChildren();
    ui.say(`Tap the ${answer.label} one.`);
    const row = el("div", "row");
    for (const color of COLORS) {
      const button = el("button", "swatch", color.label);
      button.style.background = color.hex;
      button.addEventListener("click", async () => {
        const correct = color.id === answer.id;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (!correct) first = false;
        if (streak(state, "colors", correct && first)) markReady("colors");
        remember("color-tap", state);
        practice({ game: "color-tap", skill: "Colors", step: stepParam(), item: answer.label, correct });
        ui.say(correct ? `Yes. ${answer.label}.` : `That one is ${color.label}. Listen for ${answer.label}.`);
        if (correct) setTimeout(play, 700);
        else setTimeout(() => { first = true; play(); }, 900);
      });
      row.append(button);
    }
    ui.stage.append(row);
  };
  play();
}

const COUNT_LADDER = {
  ethan: [["3", 1, 3, "count-3"], ["5", 1, 5, "count-5"]],
  connor: [["5", 1, 5, "count-5"], ["10", 6, 10, "count-10"], ["20", 11, 20, "count-20"]],
  gabi: [["10", 1, 10, "count-10"], ["20", 11, 20, "count-20"], ["names", 1, 10, "numbers"]]
};

function snackCount(root) {
  const who = kid().id;
  const ladder = COUNT_LADDER[who] || COUNT_LADDER.gabi;
  const forced = STEP_LEVEL[stepParam()];
  const state = load("snack-count") || { stars: {}, open: [ladder[0][0]] };
  if (forced) state.open = [...new Set([...state.open, ...openThrough(ladder.map((row) => row[0]), forced)])];
  const ui = shell(root, "Snack Count");
  let level = state.open.at(-1);
  const rng = fresh();

  const choose = () => {
    ui.stage.replaceChildren();
    const row = el("div", "row");
    for (const [id, , , flag] of ladder) {
      const open = state.open.includes(id);
      const button = el("button", "choice", id === "names" ? "Number names" : `Count to ${id}`);
      button.dataset.level = id;
      button.disabled = !open;
      if (id === level) button.classList.add("on");
      button.addEventListener("click", () => { level = id; round(); });
      row.append(button);
    }
    ui.stage.append(row, el("div", "stage", ""));
    round();
  };

  const round = () => {
    const spec = ladder.find((row) => row[0] === level) || ladder[0];
    const spot = ui.stage.querySelector(".stage") || ui.stage;
    spot.replaceChildren();
    if (spec[0] === "names") return namePlay(spot, spec);
    const item = countRound(spec[1], spec[2], rng);
    let tapped = 0;
    let lock = false;
    ui.say("Tap each one. I will count with you.");
    const snacks = el("div", "row");
    for (let i = 0; i < item.count; i += 1) {
      const button = el("button", "snack", item.emoji);
      button.addEventListener("click", async () => {
        if (lock || button.disabled) return;
        lock = true;
        button.disabled = true;
        button.classList.add("popped");
        tapped += 1;
        await ui.say(word(tapped));
        if (tapped === item.count) ask(spot, item, spec);
        else lock = false;
      });
      snacks.append(button);
    }
    spot.append(snacks);
  };

  const ask = (spot, item, spec) => {
    const row = el("div", "row");
    let first = true;
    let settled = false;
    for (const choice of item.choices) {
      const button = el("button", "choice", String(choice));
      button.addEventListener("click", () => {
        if (settled) return;
        const correct = choice === item.count;
        if (!correct) {
          first = false;
          finish(spec, false, `${item.count} ${item.emoji}`);
          ui.say(`Count again. There are ${word(item.count)}.`);
          return;
        }
        settled = true;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        finish(spec, first, `${item.count} ${item.emoji}`);
        ui.say(`Yes. ${word(item.count)}.`);
        setTimeout(round, 800);
      });
      row.append(button);
    }
    spot.append(el("p", "note", "How many?"), row);
  };

  const namePlay = (spot, spec) => {
    const item = nameRound(rng);
    ui.say(`Tap ${word(item.number)}.`);
    const row = el("div", "row");
    let first = true;
    let settled = false;
    for (const choice of item.choices) {
      const button = el("button", "choice big", String(choice));
      button.addEventListener("click", () => {
        if (settled) return;
        const correct = choice === item.number;
        if (!correct) {
          first = false;
          finish(spec, false, `number ${item.number}`);
          ui.say(`That is ${word(choice)}. Listen for ${word(item.number)}.`);
          return;
        }
        settled = true;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        finish(spec, first, `number ${item.number}`);
        ui.say(`Yes. ${word(item.number)}.`);
        setTimeout(round, 800);
      });
      row.append(button);
    }
    spot.append(row);
  };

  const finish = (spec, correct, item) => {
    const unlocked = streak(state, spec[0], correct);
    if (unlocked) {
      markReady(spec[3]);
      const next = ladder[ladder.findIndex((row) => row[0] === spec[0]) + 1];
      if (next && !state.open.includes(next[0])) {
        state.open.push(next[0]);
        const node = ui.stage.querySelector(`[data-level="${next[0]}"]`);
        if (node) node.disabled = false;
      }
    }
    remember("snack-count", state);
    practice({ game: "snack-count", skill: "Counting", step: stepParam(), item, correct });
    if (unlocked) ui.say("The next one is ready.");
  };

  choose();
}

function moreOrFewer(root) {
  const ui = shell(root, "More or Fewer");
  const state = load("more-or-fewer") || { stars: {} };
  const rng = fresh();
  const max = kid().id === "ethan" ? 3 : 6;
  const play = () => {
    const item = compareRound(max, rng);
    ui.stage.replaceChildren();
    ui.say(item.fewer ? "Which side has fewer?" : "Which side has more?");
    const row = el("div", "row");
    let first = true;
    for (const side of ["left", "right"]) {
      const button = el("button", "pile", item.emoji.repeat(item[side]));
      button.addEventListener("click", () => {
        const correct = side === item.answer;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (!correct) first = false;
        if (streak(state, "compare", correct && first)) markReady("compare");
        remember("more-or-fewer", state);
        practice({ game: "more-or-fewer", skill: "More and fewer", step: stepParam(), item: `${item.left} and ${item.right}`, correct });
        ui.say(correct ? "Yes." : "Count one side, then the other side.");
        setTimeout(play, 700);
      });
      row.append(button);
    }
    ui.stage.append(row);
  };
  play();
}

function patternPark(root) {
  const ui = shell(root, "Pattern Park");
  const state = load("pattern-park") || { stars: {} };
  const rng = fresh();
  const play = () => {
    const item = patternRound(rng);
    ui.stage.replaceChildren();
    ui.say("What comes next?");
    ui.stage.append(el("p", "pattern", item.sequence.join("  ")));
    const row = el("div", "row");
    let first = true;
    for (const choice of item.choices) {
      const button = el("button", "choice big", choice);
      button.addEventListener("click", () => {
        const correct = choice === item.answer;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (!correct) first = false;
        if (streak(state, "pattern", correct && first)) markReady("patterns");
        remember("pattern-park", state);
        practice({ game: "pattern-park", skill: "Patterns", step: stepParam(), item: item.sequence.join(" "), correct });
        ui.say(correct ? `Yes. ${choice}.` : "Say the pattern out loud, then look at what repeats.");
        setTimeout(play, 700);
      });
      row.append(button);
    }
    ui.stage.append(row);
  };
  play();
}

function blockTrade(root) {
  const ui = shell(root, "Block Trade");
  const ladder = [["show", "Watch a trade"], ["add", "Add with a trade"], ["sub", "Subtract with a trade"]];
  const forced = STEP_LEVEL[stepParam()];
  const state = load("block-trade") || { stars: {}, open: ["show"] };
  if (forced === "add" || forced === "sub") state.open = [...new Set([...state.open, ...openThrough(ladder.map((row) => row[0]), forced)])];
  let level = state.open.at(-1);
  const rng = fresh();
  const flags = { show: "trade-show", add: "trade-add", sub: "trade-sub" };

  const draw = (parent, tens, ones) => {
    const group = el("div", "blocks");
    const tenRow = el("div", "ten-row");
    for (let i = 0; i < tens; i += 1) tenRow.append(el("span", "rod"));
    const oneRow = el("div", "one-row");
    for (let i = 0; i < ones; i += 1) {
      const cube = el("button", "cube", "");
      cube.setAttribute("aria-label", "one");
      oneRow.append(cube);
    }
    group.append(tenRow, oneRow);
    parent.append(group);
  };

  const finish = (correct, item) => {
    const unlocked = streak(state, level, correct);
    if (unlocked) {
      markReady(flags[level]);
      const next = ladder[ladder.findIndex((row) => row[0] === level) + 1];
      if (next && !state.open.includes(next[0])) {
        state.open.push(next[0]);
        ui.say("The next trade is ready when you want it.");
      }
    }
    remember("block-trade", state);
    practice({ game: "block-trade", skill: "Regrouping", step: stepParam(), item, correct });
  };

  const menu = () => {
    ui.stage.replaceChildren();
    const row = el("div", "row");
    for (const [id, label] of ladder) {
      const button = el("button", "choice", label);
      button.disabled = !state.open.includes(id);
      if (id === level) button.classList.add("on");
      button.addEventListener("click", () => { level = id; round(); });
      row.append(button);
    }
    ui.stage.append(row);
    round();
  };

  const round = () => {
    const problem = level === "show" ? addWithTrade(rng, true) : level === "sub" ? subWithTrade(rng) : addWithTrade(rng, false);
    const board = el("div", "board");
    ui.stage.querySelector(".board")?.remove();
    ui.stage.append(board);
    if (problem.op === "+") addPlay(board, problem);
    else subPlay(board, problem);
  };

  const addPlay = async (board, problem) => {
    const ones = (problem.a % 10) + (problem.b % 10);
    const tens = Math.floor(problem.a / 10) + Math.floor(problem.b / 10);
    let traded = false;
    board.replaceChildren();
    board.append(el("p", "sum", `${problem.a} + ${problem.b}`));
    draw(board, Math.floor(problem.a / 10) + Math.floor(problem.b / 10), ones);
    ui.say(`Count the ones in ${problem.a} plus ${problem.b}.`);
    let tapped = 0;
    let trading = false;
    const cubes = [...board.querySelectorAll(".cube")];
    for (const cube of cubes) {
      cube.addEventListener("click", async () => {
        if (cube.classList.contains("popped")) return;
        cube.classList.add("popped");
        tapped += 1;
        const count = tapped;
        await ui.say(word(count));
        if (count === ones && !trading) {
          trading = true;
          tradeOrTens();
        }
      });
    }
    const tradeOrTens = async () => {
      if (ones >= 10 && !traded) {
        const trade = el("button", "go", "Trade 10 ones for a ten");
        trade.addEventListener("click", async () => {
          traded = true;
          trade.remove();
          await ui.say("Ten ones leave. One ten comes back.");
          board.querySelector(".blocks")?.remove();
          draw(board, tens + 1, ones - 10);
          askTotal(board, problem.a + problem.b, `${problem.a} + ${problem.b}`);
        });
        board.append(trade);
        ui.say("That is more than 9 ones. Trade 10 of them for a ten.");
        return;
      }
      askTotal(board, problem.a + problem.b, `${problem.a} + ${problem.b}`);
    };
  };

  const subPlay = async (board, problem) => {
    board.replaceChildren();
    board.append(el("p", "sum", `${problem.a} − ${problem.b}`));
    draw(board, Math.floor(problem.a / 10), problem.a % 10);
    await ui.say(`${problem.a} minus ${problem.b}. There are not enough ones. Break a ten.`);
    const button = el("button", "go", "Break a ten");
    button.addEventListener("click", async () => {
      button.remove();
      board.querySelector(".blocks")?.remove();
      draw(board, Math.floor(problem.a / 10) - 1, (problem.a % 10) + 10);
      await ui.say("Now take away the ones, then the tens.");
      askTotal(board, problem.a - problem.b, `${problem.a} - ${problem.b}`);
    });
    board.append(button);
  };

  const askTotal = (board, total, item) => {
    const row = el("div", "row");
    const choices = [total, total + 1, total - 10].filter((n) => n >= 0);
    let first = true;
    let settled = false;
    for (const choice of [...new Set(choices)]) {
      const button = el("button", "choice", String(choice));
      button.addEventListener("click", () => {
        if (settled) return;
        const correct = choice === total;
        if (!correct) {
          first = false;
          finish(false, item);
          ui.say("Ones, then the trade, then the tens.");
          return;
        }
        settled = true;
        row.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        finish(first, item);
        ui.say(`Yes. ${total}.`);
        setTimeout(menu, 800);
      });
      row.append(button);
    }
    board.append(el("p", "note", "What number is that?"), row);
  };

  menu();
}

function soundBugs(root) {
  const ui = shell(root, "Sound Bugs");
  const ladder = SOUND_GROUPS.map((letters, index) => [String(index + 1), letters]);
  const forced = STEP_LEVEL[stepParam()];
  const state = load("sound-bugs") || { stars: {}, open: ["1"] };
  if (forced) state.open = [...new Set([...state.open, ...openThrough(ladder.map((row) => row[0]), forced)])];
  let level = state.open.at(-1);
  const rng = fresh();
  const menu = () => {
    ui.stage.replaceChildren();
    const row = el("div", "row");
    for (const [id, letters] of ladder) {
      const button = el("button", "choice", `${letters[0]}–${letters.at(-1)}`);
      button.disabled = !state.open.includes(id);
      if (id === level) button.classList.add("on");
      button.addEventListener("click", () => { level = id; round(); });
      row.append(button);
    }
    ui.stage.append(row);
    round();
  };
  const round = () => {
    const letters = ladder.find((row) => row[0] === level)?.[1] || SOUND_GROUPS[0];
    const item = soundRound(letters, rng);
    const old = ui.stage.querySelector(".bugs");
    old?.remove();
    const bugs = el("div", "row bugs");
    ui.say(`Tap the letter that says ${item.sound}.`);
    let first = true;
    for (const letter of item.choices) {
      const button = el("button", "choice big", letter);
      button.addEventListener("click", () => {
        const correct = letter === item.answer;
        bugs.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (!correct) first = false;
        const unlocked = streak(state, level, correct && first);
        if (unlocked) {
          markReady(level === "1" ? "letter-sounds" : "letter-sounds-2");
          const next = ladder[ladder.findIndex((row) => row[0] === level) + 1];
          if (next && !state.open.includes(next[0])) state.open.push(next[0]);
        }
        remember("sound-bugs", state);
        practice({ game: "sound-bugs", skill: "Letter sounds", step: stepParam(), item: item.answer, correct });
        ui.say(correct ? `Yes. ${item.sound}.` : `That letter says ${SOUND[letter]}. Listen for ${item.sound}.`);
        setTimeout(menu, 700);
      });
      bugs.append(button);
    }
    ui.stage.append(bugs);
  };
  menu();
}

function soundTeams(root) {
  const ui = shell(root, "Sound Teams");
  const ladder = ["sh", "ch", "th"];
  const forced = STEP_LEVEL[stepParam()];
  const state = load("sound-teams") || { stars: {}, open: ["sh"] };
  if (forced) state.open = [...new Set([...state.open, ...openThrough(ladder, forced)])];
  let level = state.open.at(-1);
  const rng = fresh();
  const menu = () => {
    ui.stage.replaceChildren();
    const row = el("div", "row");
    for (const team of ladder) {
      const button = el("button", "choice", team);
      button.disabled = !state.open.includes(team);
      if (team === level) button.classList.add("on");
      button.addEventListener("click", () => { level = team; round(); });
      row.append(button);
    }
    ui.stage.append(row);
    round();
  };
  const round = () => {
    const item = teamRound(level, rng);
    ui.stage.querySelector(".words")?.remove();
    const words = el("div", "row words");
    ui.say(`Tap the word with ${item.team}.`);
    let first = true;
    for (const choice of item.choices) {
      const button = el("button", "choice big", choice);
      button.addEventListener("click", () => {
        const correct = choice === item.answer;
        words.querySelectorAll("button").forEach((node) => { node.disabled = true; });
        if (!correct) first = false;
        const unlocked = streak(state, level, correct && first);
        if (unlocked) {
          markReady(`digraph-${level}`);
          const next = ladder[ladder.indexOf(level) + 1];
          if (next && !state.open.includes(next)) state.open.push(next);
        }
        remember("sound-teams", state);
        practice({ game: "sound-teams", skill: "Digraphs", step: stepParam(), item: item.answer, correct });
        ui.say(correct ? `Yes. ${item.team}, like in ${item.answer}.` : `${choice} does not have ${item.team}.`);
        setTimeout(menu, 700);
      });
      words.append(button);
    }
    ui.stage.append(words);
  };
  menu();
}
