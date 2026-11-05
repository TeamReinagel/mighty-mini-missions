// Essential skill: listening-1 (Focusing). On the moon path, the child listens for mmm and taps that path.
// Each episode carries its own step id. The child never sees the name.
// A first try is logged before a hint. On trails 5–8, revealing the marks is the hint, and that try stays out.

import { el, kid, load, log, save, say } from "../play/kit.mjs";
import { joyceHint, marksOpen, pictureUnlocked, readWord } from "../netlify/lib/reading-marks.mjs";
import {
  STOPS,   activeScript, applyFinish, choicesFor, emptyProgress, episodeById, gradeChoice,
  hintFor, resume, shelf, syncScript, trailNumber
} from "../netlify/lib/reading-trail.mjs";

const params = new URLSearchParams(location.search);
const preview = params.get("ep");
const gameKey = preview ? `reading-trail.${preview}` : "reading-trail";
const who = kid();

let progress = { ...emptyProgress(), ...(load(gameKey) || {}) };
if (preview && progress.episodeId !== preview) progress = { ...emptyProgress(), episodeId: preview };
let episode = episodeById(preview || progress.episodeId) || episodeById("t1e1");
{
  const synced = syncScript(progress, episode);
  if (synced !== progress) {
    progress = synced;
    persist();
  }
}
let view = "play";
let rereadId = null;
let rereadLine = 0;
let helpTaps = 0;
let traceAt = 0;
let built = [];
let said = "";
let note = "";
let moving = false;
let pickedWord = null;
let introFor = "";
let introAt = 0;
let leadFor = "";
let leadAt = 0;
let ear = null;
let earGen = 0;
let pendingListen = null;

const M_PARTS = [
  "M 50 36 L 50 164",
  "M 50 164 C 52 78 148 68 150 164",
  "M 150 164 C 152 78 248 68 250 164"
];
const M_DOTS = [
  { x: 50, y: 36 },
  { x: 150, y: 164 },
  { x: 250, y: 164 }
];

function isArt(src) {
  return typeof src === "string" && /\.(png|jpe?g|webp)$/i.test(src);
}

function caption(text) {
  const line = el("button", "caption", text);
  line.type = "button";
  line.addEventListener("click", () => {
    voice(text);
    if (pendingListen) openEar(pendingListen.block, pendingListen.item);
  });
  return line;
}

function paintPlate(root, src) {
  if (!isArt(src)) return;
  const img = document.createElement("img");
  img.className = "plate";
  img.alt = "";
  img.src = src;
  root.append(img);
}

function hush() {
  earGen += 1;
  pendingListen = null;
  if (!ear) return;
  try { ear.onresult = null; ear.abort(); } catch { /* already stopped */ }
  ear = null;
}

function heardChoice(transcript, choices) {
  const tokens = String(transcript || "").toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const blob = tokens.join(" ");
  let found = null;
  for (const choice of choices) {
    const keys = (choice.hears || [choice.label, choice.id]).map((key) => String(key).toLowerCase());
    const hit = keys.some((key) => (key.length <= 2 ? tokens.includes(key) : blob.includes(key)));
    if (!hit) continue;
    if (found) return null;
    found = choice;
  }
  return found;
}

function takeChoice(choice, item, miss, graded, button) {
  if (moving || progress.stop !== item) return;
  if (item === "map" && episode.topics) progress.topic = choice.id;
  const result = gradeChoice(choice.id, script()[item].choices);
  if (graded) firstTry(item, result.correct);
  else {
    log({
      game: "reading-trail",
      skill: episode.skill,
      item: `${episode.id}:topic`,
      correct: null,
      extra: { essential: episode.essential, topic: choice.id }
    });
  }
  if (!result.correct) {
    if (button) bump(button);
    showNote(miss);
    return;
  }
  hush();
  advance();
}

function openEar(block, item) {
  pendingListen = { block, item };
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) return;
  const gen = earGen;
  if (ear) {
    try { ear.onresult = null; ear.abort(); } catch { /* already stopped */ }
    ear = null;
  }
  const rec = new Rec();
  rec.lang = "en-US";
  rec.onresult = (event) => {
    if (gen !== earGen) return;
    const choices = choicesFor(block.choices, point().narrow && block.graded !== false);
    const choice = heardChoice(event.results?.[0]?.[0]?.transcript || "", choices);
    if (!choice) return;
    takeChoice(choice, item, block.miss, block.graded !== false, document.querySelector(`[data-choice="${choice.id}"]`));
  };
  rec.onerror = () => {};
  try {
    rec.start();
    ear = rec;
  } catch { /* the tap still answers */ }
}

function showingIntro() {
  if (view !== "play" || !episode?.intro?.length) return false;
  if (progress.introSeen === episode.id) return false;
  return point().stop !== "waiting";
}

function showingLead() {
  if (view !== "play" || showingIntro()) return false;
  const stop = point().stop;
  if (!stop || stop === "waiting") return false;
  const lead = script()[stop]?.lead;
  if (!lead?.length) return false;
  return progress.seenLead !== `${episode.id}:${stop}`;
}

const STOP_LABEL = {
  map: "Map",
  lagoon: "Lagoon",
  woods: "Woods",
  shore: "Shore",
  cove: "Cove",
  river: "River",
  treasure: "Chest"
};

function persist() {
  save(gameKey, progress);
}

function script() {
  return activeScript(episode, progress);
}

function point() {
  return resume(progress, episode);
}

function voice(text) {
  if (!text) return;
  if (window.HatchVoice) {
    window.HatchVoice.say(text);
    return;
  }
  say(text);
}

function speak(key, text) {
  if (!text || said === key) return;
  said = key;
  voice(text);
}

function showNote(text) {
  note = text || "";
  if (text) voice(text);
  const stage = document.querySelector(".stage");
  if (!stage) return;
  let node = stage.querySelector(".note");
  if (!note) {
    node?.remove();
    return;
  }
  if (!node) {
    node = el("p", "note", note);
    stage.prepend(node);
  } else node.textContent = note;
}

function markHelped(item) {
  if (!item || progress.logged?.[item]) return;
  progress.helped = { ...(progress.helped || {}), [item]: true };
  persist();
}

function firstTry(item, correct) {
  if (progress.logged?.[item]) return;
  progress.logged = { ...(progress.logged || {}), [item]: true };
  const helped = Boolean(progress.helped?.[item]);
  if (!helped) {
    progress.tries = [...(progress.tries || []), { item, correct, helped: false }];
    log({
      game: "reading-trail",
      skill: episode.skill,
      item: `${episode.id}:${item}`,
      correct,
      extra: item === "map" ? { essential: episode.essential } : undefined
    });
  }
  persist();
}

function bump(node) {
  if (!node) return;
  node.classList.remove("bump");
  void node.offsetWidth;
  node.classList.add("bump");
}

function advance() {
  if (moving) return;
  moving = true;
  const here = resume(progress, episode);
  const next = here.stops[here.stops.indexOf(progress.stop) + 1];
  helpTaps = 0;
  traceAt = 0;
  built = [];
  pickedWord = null;
  said = "";
  note = "";
  if (!next) {
    progress = applyFinish(progress, episode, progress.tries);
    if (!preview) episode = episodeById(progress.episodeId) || episode;
    persist();
    moving = false;
    render();
    return;
  }
  progress.stop = next;
  progress.line = 0;
  persist();
  moving = false;
  render();
}

function finishTreasure() {
  if (moving) return;
  moving = true;
  progress = applyFinish(progress, episode, progress.tries);
  if (!preview) episode = episodeById(progress.episodeId) || episode;
  said = "";
  note = "";
  persist();
  moving = false;
  render();
}

function wordNode(token, item) {
  const page = script();
  const word = readWord(token, page);
  if (word.skip) return el("span", "", token);
  const key = word.text.toLowerCase();
  const open = marksOpen(trailNumber(episode), progress.revealed?.[key]);
  const wrap = el("span", word.sight ? "word sight" : "word");
  const glyphs = el("span", open ? "glyphs" : "glyphs plain-word");
  if (open && !word.sight) {
    for (const chunk of word.chunks) {
      const marked = chunk.silent || chunk.mark === "plain" ? "" : chunk.mark;
      glyphs.append(el("span", `chunk ${marked} ${chunk.gap ? "gap" : ""}`.trim(), chunk.text));
    }
  } else {
    glyphs.textContent = `${word.before || ""}${word.text}${word.after || ""}`;
  }
  wrap.append(glyphs);
  if (open) wrap.append(track(word));
  wrap.addEventListener("click", (event) => {
    pickedWord = word;
    if (open) return;
    event.stopPropagation();
    event.preventDefault();
    progress.revealed = { ...(progress.revealed || {}), [key]: true };
    if (item) markHelped(item);
    persist();
    render();
  });
  return wrap;
}

function track(word) {
  const segments = word.sight
    ? [{ text: word.text, say: word.chunks[0].say, sight: true }]
    : word.groups?.length
      ? word.groups.map((group) => ({ text: group.text, say: group.say }))
      : word.chunks.filter((chunk) => !chunk.silent).map((chunk) => ({ text: chunk.text, say: chunk.say }));
  const bar = el("span", "track");
  bar.setAttribute("role", "slider");
  bar.setAttribute("aria-label", `Slide ${word.text}`);
  const ticks = segments.map((segment) => {
    const tick = el("span", segment.sight ? "tick sight" : "tick");
    bar.append(tick);
    return { tick, segment };
  });
  let last = -1;
  let ratio = 0;
  const move = (event) => {
    const rect = bar.getBoundingClientRect();
    ratio = rect.width ? Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) : 0;
    const index = Math.min(ticks.length - 1, Math.floor(ratio * ticks.length));
    ticks.forEach((entry, tickIndex) => entry.tick.classList.toggle("on", tickIndex <= index && !entry.segment.sight));
    if (index !== last && index >= 0) {
      last = index;
      voice(ticks[index].segment.say);
    }
  };
  bar.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    bar.setPointerCapture?.(event.pointerId);
    move(event);
  });
  bar.addEventListener("pointermove", (event) => {
    if (!bar.hasPointerCapture?.(event.pointerId)) return;
    move(event);
  });
  bar.addEventListener("click", (event) => event.stopPropagation());
  bar.addEventListener("pointerup", (event) => {
    event.stopPropagation();
    if (!word.sight && ratio > 0.85) voice(word.text);
  });
  return bar;
}

function choiceButton(choice, item, miss, graded) {
  const button = el("button", "choice");
  button.type = "button";
  button.dataset.choice = choice.id;
  if (isArt(choice.picture)) {
    const img = document.createElement("img");
    img.className = "art";
    img.alt = "";
    img.src = choice.picture;
    button.append(img);
  }
  if (choice.word) button.append(wordNode(choice.word, item));
  else button.append(el("span", "", choice.label));
  button.addEventListener("click", () => takeChoice(choice, item, miss, graded, button));
  return button;
}

function splitChoices(block, item) {
  const graded = block.graded !== false;
  const choices = choicesFor(block.choices, point().narrow && graded);
  const row = el("div", "split");
  for (const choice of choices) {
    const button = el("button", "path-hit");
    button.type = "button";
    button.dataset.choice = choice.id;
    button.setAttribute("aria-label", choice.label);
    button.addEventListener("click", () => takeChoice(choice, item, block.miss, graded, button));
    row.append(button);
  }
  return row;
}

function choiceGrid(block, item) {
  const here = point();
  const graded = block.graded !== false;
  const choices = choicesFor(block.choices, here.narrow && graded);
  const grid = el("div", "choices");
  for (const choice of choices) grid.append(choiceButton(choice, item, block.miss, graded));
  return grid;
}

function joyceCall(hint) {
  const later = trailNumber(episode) > 4;
  const revealed = Object.keys(progress.revealed || {}).length > 0;
  if (later && !revealed) return null;
  const joyce = el("button", "joyce", "Joyce");
  joyce.type = "button";
  joyce.addEventListener("click", () => {
    helpTaps += 1;
    const page = script();
    const word = pickedWord || readWord(page[progress.stop]?.choices?.find((choice) => choice.word)?.word || page.shore?.lines?.find((line) => line.who === "child")?.text.split(/\s+/)[0] || "", page);
    if (helpTaps === 1) {
      markHelped(progress.stop);
      const open = word && !word.skip && marksOpen(trailNumber(episode), progress.revealed?.[word.text.toLowerCase()]);
      showNote(open ? (hintFor(page, word.text) || joyceHint(word)) : hint);
      return;
    }
    if (helpTaps === 2) {
      showNote("Shake your hands. Then try the same one.");
      return;
    }
    showNote("A grown-up can help with this one.");
  });
  return joyce;
}

function renderIntro(root) {
  if (introFor !== episode.id) {
    introFor = episode.id;
    introAt = 0;
  }
  const beats = episode.intro;
  const beat = beats[Math.min(introAt, beats.length - 1)];
  paintPlate(root, beat.plate);
  if (beat.cue === "sound" && beat.sound) root.append(el("p", "cue-sound", beat.sound));
  const line = el("button", "caption", beat.text);
  line.type = "button";
  speak(`intro:${episode.id}:${introAt}`, beat.text);
  const last = introAt >= beats.length - 1;
  line.addEventListener("click", () => {
    said = "";
    if (!last) {
      introAt += 1;
      render();
      return;
    }
    progress.introSeen = episode.id;
    introAt = 0;
    note = "";
    persist();
    render();
  });
  root.append(line);
}

function renderLead(root) {
  const stop = point().stop;
  const key = `${episode.id}:${stop}`;
  if (leadFor !== key) {
    leadFor = key;
    leadAt = 0;
  }
  const beats = script()[stop].lead;
  const beat = beats[Math.min(leadAt, beats.length - 1)];
  paintPlate(root, beat.plate);
  if (beat.sound) root.append(el("p", "cue-sound", beat.sound));
  const line = el("button", "caption", beat.text);
  line.type = "button";
  speak(`lead:${key}:${leadAt}`, beat.text);
  const last = leadAt >= beats.length - 1;
  line.addEventListener("click", () => {
    said = "";
    if (!last) {
      leadAt += 1;
      render();
      return;
    }
    progress.seenLead = key;
    leadAt = 0;
    note = "";
    persist();
    render();
  });
  root.append(line);
}

function renderMap(root, page) {
  const line = point().narrow ? episode.again : page.lark;
  paintPlate(root, page.map.plate);
  root.append(caption(line));
  speak(`map:${episode.id}:${progress.topic || ""}`, line);
  root.append(page.map.touch === "split" ? splitChoices(page.map, "map") : choiceGrid(page.map, "map"));
  openEar(page.map, "map");
  const joyce = joyceCall(page.map.miss || page.lark);
  if (joyce) root.append(joyce);
}

function renderLagoon(root, page) {
  paintPlate(root, page.lagoon.plate);
  if (page.lagoon.sound) root.append(el("p", "sound", page.lagoon.sound));
  root.append(caption(page.lagoon.prompt));
  speak(`lagoon:${episode.id}`, page.lagoon.prompt);
  const choices = choicesFor(page.lagoon.choices, point().narrow);
  const grid = el("div", "choices stones");
  for (const choice of choices) {
    const button = el("button", "choice letter", choice.label);
    button.type = "button";
    button.dataset.choice = choice.id;
    button.addEventListener("click", () => takeChoice(choice, "lagoon", page.lagoon.miss, true, button));
    grid.append(button);
  }
  root.append(grid);
  openEar(page.lagoon, "lagoon");
  const joyce = joyceCall(page.lagoon.miss || page.lagoon.prompt);
  if (joyce) root.append(joyce);
}

function renderWoods(root, page) {
  paintPlate(root, page.woods.plate);
  root.append(caption(page.woods.prompt));
  speak(`woods:${episode.id}`, page.woods.prompt);
  root.append(choiceGrid({ ...page.woods, graded: true }, "woods"));
  openEar(page.woods, "woods");
  const joyce = joyceCall(page.woods.miss || page.woods.prompt);
  if (joyce) root.append(joyce);
}

function renderShore(root, page, line, setLine) {
  const lines = page.shore.lines;
  if (pictureUnlocked(line, lines.length)) {
    if (isArt(page.shore.scene)) paintPlate(root, page.shore.scene);
    else {
      const picture = el("div", "picture");
      picture.setAttribute("role", "img");
      picture.setAttribute("aria-label", page.shore.sceneAlt || "The picture");
      picture.append(el("p", "placeholder", "Picture"));
      root.append(picture);
    }
    if (page.shore.diagram) root.append(el("p", "diagram", page.shore.diagram));
    const next = el("button", "caption", page.shore.reveal || "Go on");
    next.type = "button";
    if (page.shore.reveal) speak(`shore:${episode.id}:reveal`, page.shore.reveal);
    next.addEventListener("click", () => {
      if (rereadId) {
        view = "library";
        render();
        return;
      }
      advance();
    });
    root.append(next);
    return;
  }
  paintPlate(root, page.shore.plate);
  const current = lines[line];
  const goOn = () => {
    const upcoming = line + 1;
    if (pictureUnlocked(upcoming, lines.length) && !isArt(page.shore.scene)) {
      if (rereadId) {
        view = "library";
        render();
        return;
      }
      advance();
      return;
    }
    setLine(upcoming);
  };
  if (current.who === "child") {
    speak(`shore:${episode.id}:${line}`, current.say || current.text);
    const row = el("button", "read-line");
    row.type = "button";
    for (const token of current.text.split(/\s+/)) row.append(wordNode(token, null));
    row.addEventListener("click", goOn);
    root.append(row);
    const joyce = joyceCall(current.say || current.text);
    if (joyce) root.append(joyce);
  } else {
    const lineButton = el("button", "caption", current.text);
    lineButton.type = "button";
    speak(`shore:${episode.id}:${line}`, current.text);
    lineButton.addEventListener("click", goOn);
    root.append(lineButton);
  }
}

function renderCove(root, page) {
  paintPlate(root, page.cove.plate);
  root.append(caption(page.cove.prompt));
  speak(`cove:${episode.id}`, page.cove.prompt);
  root.append(choiceGrid({ ...page.cove, graded: true }, "cove"));
  openEar(page.cove, "cove");
  const joyce = joyceCall(page.cove.miss || page.cove.prompt);
  if (joyce) root.append(joyce);
}

function renderRiver(root, page) {
  const river = page.river;
  paintPlate(root, river.plate);
  if (river.line) root.append(caption(river.line));
  speak(`river:${episode.id}`, river.line || river.prompt);
  if (river.kind === "trace") {
    renderTrace(root, river);
  } else if (river.kind === "sentence") {
    root.append(el("p", "built", built.join(" ") || " "));
    const tiles = el("div", "tiles");
    const bank = [...river.words, ...(river.extra || [])];
    for (const tile of bank) {
      const button = el("button", "tile", tile);
      button.type = "button";
      button.disabled = built.includes(tile) && river.words.filter((word) => word === tile).length <= built.filter((word) => word === tile).length;
      button.addEventListener("click", () => {
        if (river.words[built.length] !== tile) {
          firstTry("river", false);
          bump(button);
          showNote("That word is not next.");
          return;
        }
        built = [...built, tile];
        if (built.length === river.words.length) {
          firstTry("river", true);
          advance();
          return;
        }
        render();
      });
      tiles.append(button);
    }
    root.append(tiles);
  } else {
    root.append(el("p", "built", built.join("") || " "));
    const tiles = el("div", "tiles");
    for (const tile of river.tiles) {
      const button = el("button", "tile", tile);
      button.type = "button";
      button.addEventListener("click", () => {
        const soFar = built.join("");
        if (!river.word.startsWith(soFar + tile)) {
          firstTry("river", false);
          bump(button);
          showNote("Try the next letters.");
          return;
        }
        built = [...built, tile];
        if (built.join("") === river.word) {
          firstTry("river", true);
          advance();
          return;
        }
        render();
      });
      tiles.append(button);
    }
    root.append(tiles);
  }
  const joyce = joyceCall(river.prompt);
  if (joyce) root.append(joyce);
}

function renderTrace(root, river) {
  const slate = el("div", "slate");
  slate.innerHTML = `<svg viewBox="0 0 300 200" role="img" aria-label="The letter ${river.letter}">
    ${M_PARTS.map((part) => `<path d="${part}" class="ghost"/>`).join("")}
    ${M_PARTS.slice(0, traceAt).map((part) => `<path d="${part}" class="ink"/>`).join("")}
  </svg>`;
  M_DOTS.forEach((spot, index) => {
    const dot = el("button", "trace-dot", String(index + 1));
    dot.type = "button";
    dot.style.left = `${(spot.x / 300) * 100}%`;
    dot.style.top = `${(spot.y / 200) * 100}%`;
    if (index < traceAt) dot.classList.add("done");
    if (index === traceAt) {
      dot.classList.add("next");
      dot.setAttribute("aria-label", "Yellow dot");
    } else {
      dot.setAttribute("aria-label", `Dot ${index + 1}`);
    }
    dot.addEventListener("click", () => {
      if (index !== traceAt) {
        firstTry("river", false);
        bump(dot);
        showNote("Start here.");
        return;
      }
      note = "";
      traceAt += 1;
      if (traceAt === M_DOTS.length) {
        firstTry("river", true);
        advance();
        return;
      }
      render();
    });
    slate.append(dot);
  });
  root.append(slate);
}

function renderTreasure(root, page) {
  const treasure = page.treasure;
  paintPlate(root, treasure.plate);
  const line = treasure.line || `${treasure.name} is yours.`;
  speak(`treasure:${treasure.id}`, line);
  const keep = el("button", "caption", line);
  keep.type = "button";
  keep.addEventListener("click", finishTreasure);
  root.append(keep);
}

function renderPlay(root) {
  if (!episode?.ready) {
    root.append(el("p", "prompt", "Lark is still drawing this map."));
    return;
  }
  const here = point();
  if (here.stop === "waiting") {
    const treasure = progress.treasures.at(-1);
    paintPlate(root, episode.tagPlate);
    root.append(el("p", "waiting", `${treasure?.name || "The treasure"} is in your chest.`));
    if (episode.next) root.append(el("p", "caption", episode.next));
    const again = el("button", "again", "Play it again.");
    again.type = "button";
    again.addEventListener("click", () => {
      progress = {
        ...progress,
        stop: "map",
        line: 0,
        introSeen: "",
        seenLead: "",
        tries: [],
        logged: {},
        helped: {},
        revealed: {},
        shoreUp: null
      };
      introFor = "";
      introAt = 0;
      leadFor = "";
      leadAt = 0;
      said = "";
      note = "";
      persist();
      render();
    });
    root.append(again);
    return;
  }
  if (showingIntro()) {
    renderIntro(root);
    return;
  }
  if (showingLead()) {
    renderLead(root);
    return;
  }
  const page = script();
  if (here.stop === "map") renderMap(root, page);
  else if (here.stop === "lagoon") renderLagoon(root, page);
  else if (here.stop === "woods") renderWoods(root, page);
  else if (here.stop === "shore") {
    renderShore(root, page, progress.line || 0, (line) => {
      progress.line = line;
      said = "";
      persist();
      render();
    });
  } else if (here.stop === "cove") renderCove(root, page);
  else if (here.stop === "river") renderRiver(root, page);
  else renderTreasure(root, page);
}

function renderLibrary(root) {
  root.append(el("p", "prompt", "Your library"));
  const books = el("div", "shelf");
  for (const book of shelf(progress)) {
    const card = el("section", "book");
    card.append(el("h2", "", book.book));
    for (const chapter of book.chapters) {
      if (chapter.earned) {
        const open = el("button", "", `${chapter.n}. ${chapter.title}`);
        open.type = "button";
        open.addEventListener("click", () => {
          rereadId = chapter.id;
          rereadLine = 0;
          view = "reread";
          said = "";
          render();
        });
        card.append(open);
      } else if (chapter.ready) {
        card.append(el("p", "", `${chapter.n}. ${chapter.title}`));
      } else {
        card.append(el("p", "soon", `${chapter.n}. ${chapter.title}`));
      }
    }
    books.append(card);
  }
  root.append(books);
}

function renderChest(root) {
  root.append(el("p", "prompt", "Your chest"));
  const grid = el("div", "chest-grid");
  if (!progress.treasures?.length) grid.append(el("p", "", "The chest is empty."));
  for (const treasure of progress.treasures || []) {
    const gem = el("article", "gem");
    gem.append(el("p", "", treasure.name));
    grid.append(gem);
  }
  root.append(grid);
}

function renderReread(root) {
  const book = episodeById(rereadId);
  const page = activeScript(book, { topic: progress.chapters.find((chapter) => chapter.episodeId === rereadId)?.topic });
  root.append(el("p", "prompt", book.title));
  renderShore(root, page, rereadLine, (line) => {
    rereadLine = line;
    said = "";
    render();
  });
}

function stopsBar() {
  const here = point();
  const bar = el("div", "stops");
  const names = here.stop === "waiting" ? STOPS : here.stops;
  const at = names.indexOf(here.stop);
  names.forEach((name, index) => {
    const pip = el("span", `stop ${index < at ? "lit" : ""} ${index === at ? "now" : ""}`.trim());
    pip.setAttribute("aria-label", STOP_LABEL[name] || name);
    bar.append(pip);
  });
  return bar;
}

function render() {
  hush();
  const root = document.querySelector("#app");
  root.replaceChildren();
  const bar = el("div", "bar");
  const back = el("a", "icon", "←");
  back.href = `../classroom/?kid=${encodeURIComponent(who.id)}`;
  back.setAttribute("aria-label", "Back to Today");
  const inShow = view === "play" && episode?.ready && point().stop !== "waiting";
  const title = el("h1", "", view === "library" ? "Library" : view === "chest" ? "Chest" : "");
  const chest = el("button", "text-btn", "Chest");
  chest.type = "button";
  chest.setAttribute("aria-label", "Treasure chest");
  chest.addEventListener("click", () => { view = view === "chest" ? "play" : "chest"; render(); });
  const library = el("button", "text-btn", "Library");
  library.type = "button";
  library.setAttribute("aria-label", "Library");
  library.addEventListener("click", () => { view = view === "library" ? "play" : "library"; rereadId = null; render(); });
  if (inShow) bar.append(back);
  else bar.append(back, title, chest, library);
  root.append(bar);
  const stage = el("div", "stage");
  if (view === "chest") renderChest(stage);
  else if (view === "library") renderLibrary(stage);
  else if (view === "reread") renderReread(stage);
  else renderPlay(stage);
  if (note && view === "play") stage.prepend(el("p", "note", note));
  root.append(stage);
}

if (window.HatchVoice) {
  let voiceStarted = false;
  window.HatchVoice.init({
    enabled: true,
    fallback: (text) => say(text)
  });
  window.HatchVoice.onStatus((status) => {
    if (voiceStarted || status.phase !== "missing") return;
    voiceStarted = true;
    window.HatchVoice.download();
  });
}

render();
