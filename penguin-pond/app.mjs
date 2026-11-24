// Essential skill: problem-solving-4 (Finding information). He finds what he needs in the
// picture: the size of each jump, the pairs and the one left over, the top of a bar against
// the numbers. A miss points him back to where the information is.
// Academic skill: skip counting, odd and even, bar graphs (Joyce steps max-skip-count,
// max-odd-even, max-bar-graphs).
import { el } from "../play/stage.mjs";
import { mountSteps, choice } from "../play/steps.mjs";
import { SKIN } from "./skin.mjs";
import { LEVELS, skipRound, oddEvenRound, graphRound, lines as makeLines } from "./math.mjs";

const lines = makeLines({ thing: SKIN.thing, who: SKIN.who });
let oddTurn = 0;
let graphTurn = 0;

function numberPicks(board, values) {
  const row = el("div", "row picks");
  const buttons = values.map((value) => {
    const button = choice(String(value), { value: String(value) });
    SKIN.dress(button);
    row.append(button);
    return button;
  });
  board.append(row);
  return buttons;
}

async function skip({ rng, board, ask }) {
  const deal = skipRound(rng);
  const path = el("div", "floes");
  const floes = deal.numbers.map((n, i) => {
    // The size of each jump sits between the floes, shown after a miss or a hint.
    if (i > 0) path.append(el("span", "jump", `+${deal.by}`));
    const floe = el("span", i === deal.gap ? "floe gap" : "floe", i === deal.gap ? "?" : String(n));
    path.append(floe);
    return floe;
  });
  board.append(path);
  const buttons = numberPicks(board, deal.choices);
  const showJumps = () => path.classList.add("jumps");
  const clean = await ask({
    prompt: lines.skipPrompt(deal),
    buttons,
    right: (button) => Number(button.dataset.value) === deal.answer,
    miss: (button) => lines.skipMiss(deal, Number(button.dataset.value)),
    onMiss: showJumps,
    hint: () => { showJumps(); return lines.skipHint(deal); }
  });
  floes[deal.gap].textContent = String(deal.answer);
  floes[deal.gap].classList.add("found");
  return { clean, item: `${deal.numbers.join(",")} by ${deal.by}`, piece: deal.answer, said: lines.skipRight(deal) };
}

function crowd(n) {
  const pond = el("div", "crowd");
  for (let i = 0; i < n; i += 1) {
    const spot = el("span", "spot");
    spot.style.setProperty("--tilt", `${(i * 37) % 11 - 5}deg`);
    spot.append(SKIN.penguin());
    pond.append(spot);
  }
  return pond;
}

async function oddEven({ rng, board, ask }) {
  // Pictures every other problem, so he sees the pairs and also uses the last-digit rule.
  const deal = oddEvenRound(rng, { pictures: oddTurn % 2 === 0 });
  oddTurn += 1;
  const shown = deal.pictures ? crowd(deal.n) : el("p", "ask-card big-number", String(deal.n));
  board.append(shown);
  const row = el("div", "row picks");
  const buttons = ["even", "odd"].map((id) => {
    const button = el("button", "pick parity");
    button.type = "button";
    button.dataset.value = id;
    button.setAttribute("aria-label", id);
    button.append(el("span", "dots", id === "even" ? "●● ●●" : "●● ●"), el("span", "pick-text", id));
    SKIN.dress(button);
    row.append(button);
    return button;
  });
  board.append(row);
  const pair = () => {
    if (deal.pictures) shown.classList.add("paired");
    else shown.classList.add("last-digit");
  };
  if (!deal.pictures) {
    const n = String(deal.n);
    shown.replaceChildren(el("span", "", n.slice(0, -1)), el("span", "digit", n.slice(-1)));
  }
  const clean = await ask({
    prompt: lines.oddPrompt(deal),
    buttons,
    right: (button) => button.dataset.value === deal.answer,
    miss: () => lines.oddMiss(deal),
    onMiss: pair,
    hint: () => { pair(); return lines.oddHint(deal); }
  });
  pair();
  return { clean, item: `${deal.n} is ${deal.answer}`, piece: deal.n, said: lines.oddRight(deal) };
}

function graph(deal, { tappable }) {
  const wrap = el("div", "graph");
  const axis = el("div", "axis");
  for (let n = 10; n >= 0; n -= 1) {
    const tick = el("span", "tick", String(n));
    tick.style.bottom = `${n * 10}%`;
    axis.append(tick);
  }
  const plot = el("div", "plot");
  const cols = deal.bars.map((bar) => {
    const col = el(tappable ? "button" : "div", "col");
    if (tappable) {
      col.type = "button";
      col.dataset.value = bar.name;
      col.setAttribute("aria-label", `${SKIN.who(bar.name)}'s bar`);
    }
    const fill = el("span", "bar");
    fill.style.height = `${bar.value * 10}%`;
    fill.style.background = SKIN.scarf(bar.name);
    col.dataset.name = bar.name;
    col.append(fill);
    plot.append(col);
    return col;
  });
  const names = el("div", "names");
  for (const bar of deal.bars) {
    const name = el("span", "name");
    name.append(SKIN.penguin(bar.name), el("span", "", SKIN.who(bar.name)));
    names.append(name);
  }
  const title = el("p", "graph-title", `${SKIN.thing.charAt(0).toUpperCase()}${SKIN.thing.slice(1)} each penguin caught`);
  wrap.append(title, axis, plot, el("span"), names);
  return { wrap, cols };
}

async function bars({ rng, board, ask }) {
  // Reading a bar comes up most; most, fewest, and how many more take turns.
  const kinds = ["read", "most", "read", "more", "read", "fewest"];
  const deal = graphRound(rng, { kind: kinds[graphTurn % kinds.length] });
  graphTurn += 1;
  const tappable = deal.kind === "most" || deal.kind === "fewest";
  const { wrap, cols } = graph(deal, { tappable });
  board.append(wrap);
  const guide = (...names) => cols.filter((col) => names.includes(col.dataset.name)).forEach((col) => col.classList.add("guide"));
  const buttons = tappable ? cols : numberPicks(board, deal.choices);
  const isRight = (button) => (tappable ? button.dataset.value === deal.answer : Number(button.dataset.value) === deal.answer);
  const clean = await ask({
    prompt: lines.graphPrompt(deal),
    buttons,
    right: isRight,
    miss: (button) => lines.graphMiss(deal, tappable ? button.dataset.value : Number(button.dataset.value)),
    onMiss: () => (deal.kind === "read" ? guide(deal.bar) : deal.kind === "more" ? guide(deal.big, deal.small) : null),
    hint: () => {
      if (deal.kind === "read") guide(deal.bar);
      if (deal.kind === "more") guide(deal.big, deal.small);
      return lines.graphHint(deal);
    }
  });
  const item = deal.kind === "read" ? `read ${deal.answer}` : deal.kind === "more" ? `${deal.bigValue} - ${deal.smallValue}` : `${deal.kind} ${deal.value}`;
  return { clean, item, piece: tappable ? deal.value : deal.answer, said: lines.graphRight(deal) };
}

const PLAY = { skip, "odd-even": oddEven, graph: bars };

mountSteps({
  root: document.querySelector("#app"),
  game: "penguin-pond",
  skin: SKIN,
  levels: LEVELS,
  play: (args) => PLAY[args.level.id](args)
});
