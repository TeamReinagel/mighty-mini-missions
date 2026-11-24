// Essential skill: planning-3 (Working carefully). He checks each part of the word before he
// picks: does the pair make a real word, is the apostrophe where the letters left, what job
// does this word do in this sentence. A miss points at the part to look at again.
// Academic skill: compound words, contractions, nouns/verbs/adjectives (Joyce steps
// max-compound, max-contractions, max-parts-of-speech).
import { el } from "../play/stage.mjs";
import { mountSteps, choice, makeMemory } from "../play/steps.mjs";
import { SKIN } from "./skin.mjs";
import { LEVELS, JOBS, compoundRound, contractionRound, partsRound, leftOut, lines } from "./words.mjs";

const memory = { compound: makeMemory(), contraction: makeMemory(), parts: makeMemory() };
let nextJob = 0;

function picks(board, values, label = (value) => value) {
  const row = el("div", "row picks");
  const buttons = values.map((value, index) => {
    const button = choice(label(value), { value });
    SKIN.dress(button, index);
    row.append(button);
    return button;
  });
  board.append(row);
  return buttons;
}

async function compound({ rng, board, ask }) {
  const mem = memory.compound;
  const again = mem.due();
  const deal = compoundRound(rng, { recent: mem.recent.map((key) => key), again });
  const { item } = deal;
  const card = el("p", "ask-card");
  const first = el("span", "", item.first);
  const gap = el("span", "gap", "?");
  const picture = el("span", "clue-pic", item.picture);
  picture.hidden = true;
  card.append(first, el("span", "plus", " + "), gap, picture);
  board.append(card);
  const buttons = picks(board, deal.choices);
  const show = () => { picture.hidden = false; };
  const clean = await ask({
    prompt: lines.compoundPrompt(item),
    buttons,
    right: (button) => button.dataset.value === item.second,
    miss: (button) => lines.compoundMiss(item, button.dataset.value),
    onMiss: show,
    hint: () => { show(); return lines.compoundHint(item); }
  });
  card.replaceChildren(el("span", "", `${item.first} + ${item.second} = `), el("span", "mark", item.word), el("span", "clue-pic", ` ${item.picture}`));
  mem.done(item, clean, item === again);
  return { clean, item: item.word, piece: item.picture, said: lines.compoundRight(item) };
}

async function contraction({ rng, board, ask }) {
  const mem = memory.contraction;
  const again = mem.due();
  const deal = contractionRound(rng, { recent: mem.recent, again });
  const { item } = deal;
  const { letters, at } = leftOut(item.full, item.short);
  const card = el("p", "ask-card");
  [...item.full].forEach((char, index) => {
    const span = el("span", index >= at && index < at + letters.length ? "leaving" : "", char);
    card.append(span);
  });
  board.append(card);
  const fade = () => card.classList.add("show-gone");
  const buttons = picks(board, deal.choices);
  buttons.forEach((button) => button.classList.add("contraction"));
  const clean = await ask({
    prompt: lines.contractionPrompt(item),
    buttons,
    right: (button) => button.dataset.value === item.short,
    miss: (button) => lines.contractionMiss(item, button.dataset.value),
    onMiss: fade,
    hint: () => { fade(); return lines.contractionHint(item); }
  });
  card.replaceChildren(el("span", "", `${item.full} → `), el("span", "mark", item.short));
  mem.done(item, clean, item === again);
  return { clean, item: item.short, piece: item.short };
}

async function parts({ rng, board, ask }) {
  const mem = memory.parts;
  const again = mem.due();
  // Noun, verb, adjective in turn, so every round asks about all three jobs.
  const job = ["n", "v", "a"][nextJob % 3];
  const deal = partsRound(rng, { recent: mem.recent.map((entry) => entry.key), again, job });
  if (!again) nextJob += 1;
  const card = el("p", "ask-card sentence");
  deal.tokens.forEach((token, index) => card.append(el("span", index === deal.index ? "mark" : "", token.text)));
  board.append(card);
  const row = el("div", "row picks jobs");
  const buttons = ["n", "v", "a"].map((id, index) => {
    const button = el("button", "pick job");
    button.type = "button";
    button.dataset.value = id;
    button.setAttribute("aria-label", JOBS[id].name);
    button.append(el("span", "job-icon", SKIN.jobIcons[id]), el("span", "pick-text", JOBS[id].name), el("span", "job-does", JOBS[id].does));
    SKIN.dress(button, index);
    row.append(button);
    return button;
  });
  board.append(row);
  const clean = await ask({
    prompt: lines.partsPrompt(deal),
    buttons,
    right: (button) => button.dataset.value === deal.job,
    miss: (button) => lines.partsMiss(deal, button.dataset.value),
    hint: () => lines.partsHint(deal)
  });
  mem.done(deal, clean, deal === again);
  return { clean, item: `${deal.word} (${JOBS[deal.job].name})`, piece: deal.word };
}

const PLAY = { compound, contraction, parts };

mountSteps({
  root: document.querySelector("#app"),
  game: "word-workshop",
  skin: SKIN,
  levels: LEVELS,
  play: (args) => PLAY[args.level.id](args)
});
