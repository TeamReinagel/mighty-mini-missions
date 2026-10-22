const KIDS = [
  { id: "max", name: "Max", picture: "../avatars/max.jpg" },
  { id: "gabi", name: "Gabi", picture: "../avatars/gabi.jpg" },
  { id: "connor", name: "Connor", picture: "../avatars/connor.jpg" },
  { id: "ethan", name: "Ethan", picture: "../avatars/ethan.jpg" }
];

const app = document.querySelector("#app");
const params = new URLSearchParams(location.search);
let kid = params.get("kid") || storedKid();
let day = null;
let card = null;
let index = 0;
let promptIndex = 0;
let built = [];
let helps = 0;
let busy = false;
let voice = null;
let peer = null;
let mic = null;
let talkStarted = 0;
let ticker = null;
let speakToken = 0;
let speakChain = Promise.resolve();
let talking = false;
let teachGen = 0;
let sectionStarted = 0;
let wiggleShown = false;
let visTick = null;

function storedKid() {
  try {
    const data = JSON.parse(localStorage.getItem("mighty-mini-missions:profiles") || "{}");
    return data.activeProfileId || "";
  } catch {
    return "";
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const SOUND = {
  a: "ah", e: "eh", i: "ih", o: "o", u: "uh",
  b: "buh", c: "kuh", d: "duh", f: "fff", g: "guh",
  h: "huh", j: "juh", k: "kuh", l: "lll", m: "mmm",
  n: "nnn", p: "puh", q: "kwuh", r: "rrr", s: "sss",
  t: "tuh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz"
};

const COUNT_WORD = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"
];

function hold(buttons, ready) {
  for (const button of buttons) button.disabled = true;
  Promise.resolve(ready).then(() => {
    for (const button of buttons) {
      if (button.isConnected && !button.classList.contains("popped")) button.disabled = false;
    }
  });
}

function popStar() {
  const star = el("div", "star-pop", "★");
  document.body.append(star);
  setTimeout(() => star.remove(), 700);
}

async function api(action, extra = {}) {
  const res = await fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, kid, ...extra })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Joyce couldn't do that.");
  return data;
}

function setTalking(on) {
  talking = on;
  document.querySelectorAll(".joyce-photo").forEach((img) => img.classList.toggle("talking", on));
}

function hush() {
  speakToken += 1;
  if (voice) {
    voice.onended = null;
    voice.pause();
    voice = null;
  }
  window.speechSynthesis?.cancel();
  setTalking(false);
  speakChain = Promise.resolve();
}

function deviceSay(text, token) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    const done = () => {
      if (token === speakToken) setTalking(false);
      resolve();
    };
    utter.onend = done;
    utter.onerror = done;
    setTalking(true);
    window.speechSynthesis.speak(utter);
  });
}

function playLine(text, token) {
  return api("speak", { text }).then((data) => new Promise((resolve) => {
    if (token !== speakToken) return resolve();
    const finish = () => {
      if (token === speakToken) setTalking(false);
      resolve();
    };
    if (!data.audioBase64) {
      deviceSay(text, token).then(finish);
      return;
    }
    const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
    voice = audio;
    audio.onended = finish;
    audio.onerror = () => { deviceSay(text, token).then(finish); };
    setTalking(true);
    audio.play().catch(() => { deviceSay(text, token).then(finish); });
  })).catch(() => {
    if (token !== speakToken) return;
    return deviceSay(text, token);
  });
}

function say(text) {
  if (!text) return Promise.resolve();
  const token = speakToken;
  const job = speakChain.then(() => {
    if (token !== speakToken) return;
    return playLine(text, token);
  });
  speakChain = job.catch(() => {});
  return job;
}

function replay(text) {
  if (!text) return Promise.resolve();
  hush();
  const token = speakToken;
  const job = playLine(text, token);
  speakChain = job.catch(() => {});
  return job;
}

function header(title, line) {
  const top = el("div", "top");
  const photo = el("img", talking ? "joyce-photo talking" : "joyce-photo");
  photo.src = "./joyce.png";
  photo.alt = "Joyce";
  const copy = el("div");
  const back = el("a", "back", "Home");
  back.href = "../";
  const h = el("h1", "", title);
  const p = el("p", "", line || "");
  copy.append(back, h, p);
  top.append(photo, copy);
  return top;
}

function showKids() {
  app.replaceChildren(header("Today with Joyce", "Who is learning?"));
  const grid = el("div", "kids");
  for (const child of KIDS) {
    const button = el("button", "kid");
    button.type = "button";
    const name = el("strong", "", child.name);
    button.append(name);
    button.addEventListener("click", () => {
      kid = child.id;
      history.replaceState(null, "", `?kid=${encodeURIComponent(kid)}`);
      load();
    });
    grid.append(button);
  }
  app.append(grid);
}

async function load() {
  if (!KIDS.some((child) => child.id === kid)) {
    showKids();
    return;
  }
  app.replaceChildren(header("Today with Joyce", "Getting today's board..."));
  try {
    day = await api("today");
    document.documentElement.style.setProperty("--kid", day.color || "#7c6cf0");
    renderBoard();
    say(day.greeting);
  } catch (err) {
    app.replaceChildren(header("Today with Joyce", err.message));
    const retry = el("button", "go", "Try again");
    retry.type = "button";
    retry.addEventListener("click", load);
    app.append(retry);
  }
}

function renderBoard() {
  teachGen += 1;
  stopTicker();
  document.querySelector(".wiggle")?.remove();
  card = null;
  const root = header(day.name, day.greeting);
  const actions = el("div", "actions");
  const talk = el("button", "go", "Ask Joyce");
  talk.type = "button";
  talk.addEventListener("click", () => startTalk());
  const again = el("button", "quiet", "Hear that again");
  again.type = "button";
  again.addEventListener("click", () => replay(day.greeting));
  actions.append(talk, again);
  const board = el("div", "board");
  if (day.rhythm === "weekend") {
    board.append(el("p", "joyce-line", "No school block today. These are here if you want them."));
  }
  for (const item of day.cards) {
    const button = el("button", item.done ? "card done" : "card");
    button.type = "button";
    button.append(el("strong", "", item.done ? `${item.title} ✓` : item.title));
    button.append(el("span", "", item.done ? "Done" : `${item.minutes} min`));
    button.addEventListener("click", () => openCard(item));
    board.append(button);
  }
  app.replaceChildren(root, actions, board);
}

function openCard(next) {
  if (next.done) {
    replay("You already did that one.");
    return;
  }
  hush();
  teachGen += 1;
  card = next;
  index = 0;
  promptIndex = 0;
  built = [];
  helps = 0;
  sectionStarted = Date.now();
  wiggleShown = false;
  startTicker();
  if (card.kind === "lesson" && card.beats?.length) renderTeach();
  else if (card.kind === "lesson") renderItem();
  else renderSimple();
}

function formatClock(seconds) {
  const whole = Math.max(0, seconds);
  const min = Math.floor(whole / 60);
  const sec = String(whole % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function sectionSeconds() {
  if (!sectionStarted) return 0;
  return Math.floor((Date.now() - sectionStarted) / 1000);
}

function startTicker() {
  stopTicker();
  const tick = () => {
    const seconds = sectionSeconds();
    const node = document.getElementById("section-clock");
    if (node) node.textContent = formatClock(seconds);
    if (seconds >= 30 * 60) showWiggle();
  };
  visTick = tick;
  document.addEventListener("visibilitychange", tick);
  ticker = setInterval(tick, 1000);
  tick();
}

function showWiggle() {
  if (wiggleShown) return;
  wiggleShown = true;
  const box = el("div", "wiggle");
  box.append(el("p", "prompt", "Wiggle break. Hop, stretch, or shake."));
  const left = el("p", "timer", "0:30");
  box.append(left);
  document.body.append(box);
  replay("Wiggle break. Hop, stretch, or shake for a little bit. Then we keep going.");
  const until = Date.now() + 30000;
  const id = setInterval(() => {
    const s = Math.max(0, Math.ceil((until - Date.now()) / 1000));
    left.textContent = `0:${String(s).padStart(2, "0")}`;
    if (s <= 0) {
      clearInterval(id);
      box.remove();
    }
  }, 250);
}

function shell(title) {
  const root = header(day.name, title);
  const clock = el("p", "timer", formatClock(sectionSeconds()));
  clock.id = "section-clock";
  const panel = el("div", "panel");
  app.replaceChildren(root, clock, panel);
  return panel;
}

function renderSimple() {
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.say));
  const spoken = say(card.say);
  if (card.kind === "app" || card.kind === "game") {
    const link = el("a", "go", card.kind === "app" ? "Open it" : "Play");
    link.href = card.href;
    link.target = "_blank";
    link.rel = "noopener";
    panel.append(link);
    if (card.askLesson) {
      const done = el("button", "go", "I'm done");
      done.type = "button";
      done.disabled = true;
      link.addEventListener("click", () => { done.disabled = false; });
      done.addEventListener("click", () => askLesson(panel));
      panel.append(done);
      return;
    }
    const done = el("button", "go", "I'm done");
    done.type = "button";
    done.disabled = true;
    link.addEventListener("click", () => { done.disabled = false; });
    done.addEventListener("click", () => finish("done"));
    const back = el("button", "quiet", "Back");
    back.type = "button";
    back.addEventListener("click", renderBoard);
    panel.append(done, back);
    return;
  }
  if (card.askLesson) {
    const done = el("button", "go", "I'm done");
    done.type = "button";
    done.addEventListener("click", () => askLesson(panel));
    panel.append(done);
    return;
  }
  const label = card.kind === "move" ? "I did it" : card.kind === "celebrate" ? "I told someone" : "I'm done";
  const done = el("button", "go", label);
  done.type = "button";
  done.addEventListener("click", () => finish("done"));
  if (card.kind === "move") {
    done.disabled = true;
    spoken.then(() => { if (done.isConnected) done.disabled = false; });
  }
  const back = el("button", "quiet", "Back");
  back.type = "button";
  back.addEventListener("click", renderBoard);
  panel.append(done, back);
}

function askLesson(panel) {
  panel.replaceChildren();
  panel.append(el("p", "prompt", "Which lesson did you finish?"));
  let lesson = Number(card.lesson) || 94;
  const row = el("div", "stepper");
  const down = el("button", "choice", "−");
  down.type = "button";
  const num = el("b", "", String(lesson));
  const up = el("button", "choice", "+");
  up.type = "button";
  const show = () => { num.textContent = String(lesson); };
  down.addEventListener("click", () => { lesson = Math.max(1, lesson - 1); show(); });
  up.addEventListener("click", () => { lesson = Math.min(120, lesson + 1); show(); });
  row.append(down, num, up);
  const save = el("button", "go", "This lesson");
  save.type = "button";
  save.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    try {
      const data = await api("reading", { lesson });
      say(data.say);
      busy = false;
      await finish("done");
    } catch (err) {
      feedback(panel, err.message, "no");
      busy = false;
    }
  });
  panel.append(row, save);
}

function currentItem() {
  return card.items[index];
}

function questionLine(item, prompt) {
  if (item.type === "story") return (item.pages[promptIndex] || item.pages[0]).text;
  if (item.type === "regroup") return prompt.say || item.say;
  return item.say;
}

function renderTeach() {
  const panel = shell(card.title);
  const beat = el("p", "prompt", card.beats[0]);
  panel.append(beat);
  panel.append(el("p", "joyce-line", "Listen first. Then it's your turn."));
  if (card.skill === "Regrouping") {
    const blocks = el("div", "blocks");
    blocks.append(placeValue(27), el("div", "dots", "+"), placeValue(15));
    panel.append(blocks);
  }
  const go = el("button", "go", "Your turn");
  go.type = "button";
  go.addEventListener("click", () => {
    teachGen += 1;
    hush();
    renderItem();
  });
  const again = el("button", "quiet", "Hear it again");
  again.type = "button";
  again.addEventListener("click", () => {
    teachGen += 1;
    replay((card.beats || []).join(" "));
  });
  const back = el("button", "quiet", "Back");
  back.type = "button";
  back.addEventListener("click", () => {
    teachGen += 1;
    hush();
    renderBoard();
  });
  const row = el("div", "actions");
  row.append(go, again, back);
  panel.append(row);
  const gen = teachGen;
  speakBeats(beat, gen);
}

async function speakBeats(beat, gen) {
  for (const line of card?.beats || []) {
    if (gen !== teachGen || !card) return;
    beat.textContent = line;
    await say(line);
  }
}

function renderItem() {
  const item = currentItem();
  if (!item) {
    const finishing = card;
    setTimeout(() => { if (card === finishing) finish("done"); }, 0);
    return;
  }
  const panel = shell(`${card.title}  ${index + 1} / ${card.items.length}`);
  const prompt = item.type === "regroup" ? item.prompts[promptIndex] : item;
  const line = questionLine(item, prompt);
  if (item.type !== "story") panel.append(el("p", "prompt", line));
  const spoken = say(line);
  drawItem(panel, item, prompt, spoken);
  const note = el("p", "feedback");
  note.id = "feedback";
  const row = el("div", "actions");
  const help = el("button", "quiet", "I need help");
  help.type = "button";
  help.addEventListener("click", () => needHelp(item));
  const again = el("button", "quiet", "Hear it again");
  again.type = "button";
  again.addEventListener("click", () => replay(line));
  const back = el("button", "quiet", "Back");
  back.type = "button";
  back.addEventListener("click", renderBoard);
  row.append(help, again, back);
  panel.append(note, row);
}

function drawItem(panel, item, prompt, ready) {
  if (item.type === "build") return drawBuild(panel, item, ready);
  if (item.type === "read") return drawRead(panel, item);
  if (item.type === "story") return drawStory(panel, item);
  if (item.type === "count") return drawCount(panel, item, ready);
  if (item.type === "compare") return drawCompare(panel, item, ready);
  if (item.type === "add") return drawAdd(panel, item, ready);
  if (item.type === "pattern") return drawPattern(panel, item, ready);
  if (item.type === "regroup") return drawRegroup(panel, item, prompt, ready);
  if (item.show) panel.append(el("div", "big-number", String(item.show)));
  drawChoices(panel, prompt.choices || item.choices, (id) => submit(id), ready);
}

function drawChoices(panel, choices, onPick, ready) {
  const row = el("div", "choices");
  const buttons = [];
  for (const choice of choices || []) {
    const button = el("button", "choice", choice.label);
    button.type = "button";
    button.addEventListener("click", () => onPick(choice.id));
    buttons.push(button);
    row.append(button);
  }
  hold(buttons, ready);
  panel.append(row);
}

function drawBuild(panel, item, ready) {
  const parts = item.parts?.length
    ? item.parts
    : [...item.word].map((letter) => ({ letters: letter, sound: SOUND[letter] || letter }));
  let partIndex = 0;
  let partBuilt = "";
  let heard = false;
  const word = el("div", "big-word", "");
  const row = el("div", "tiles");
  const paint = () => {
    word.textContent = built.join("");
    row.replaceChildren();
    item.tiles.forEach((letter, tileIndex) => {
      const used = built.filter((entry) => entry === letter).length;
      const before = item.tiles.slice(0, tileIndex).filter((entry) => entry === letter).length;
      const button = el("button", "tile", letter);
      button.type = "button";
      if (!heard || before < used) button.disabled = true;
      button.addEventListener("click", () => take(letter));
      row.append(button);
    });
  };
  const take = (letter) => {
    const part = parts[partIndex];
    if (!heard || !part || built.length >= item.word.length) return;
    const want = part.letters[partBuilt.length];
    if (letter !== want) {
      say(`That letter says ${SOUND[letter] || letter}. Listen for ${part.sound}.`);
      return;
    }
    partBuilt += letter;
    built.push(letter);
    paint();
    if (partBuilt.length < part.letters.length) return;
    const next = parts[partIndex + 1];
    partIndex += 1;
    partBuilt = "";
    if (!next) {
      say(`Yes. ${part.sound}. Push them together.`);
      submit(built.join(""));
      return;
    }
    say(`Yes. ${part.sound}. Next sound is ${next.sound}.`);
  };
  const undo = el("button", "quiet", "Undo");
  undo.type = "button";
  undo.addEventListener("click", () => {
    if (!built.length || busy) return;
    built.pop();
    if (partBuilt.length) partBuilt = partBuilt.slice(0, -1);
    else if (partIndex > 0) {
      partIndex -= 1;
      partBuilt = parts[partIndex].letters.slice(0, -1);
    }
    paint();
  });
  panel.append(word, row, undo);
  paint();
  Promise.resolve(ready).then(() => {
    heard = true;
    if (row.isConnected) paint();
  });
}

function drawRead(panel, item) {
  panel.append(el("div", "big-word", item.word));
  const button = el("button", "go", "I'll read it");
  button.type = "button";
  button.addEventListener("click", () => hearWord(item));
  panel.append(button);
}

function hearWord(item) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    say(item.word);
    submit("", { unsure: true });
    return;
  }
  const rec = new Rec();
  rec.lang = "en-US";
  rec.onresult = (event) => {
    const heard = event.results[0][0].transcript || "";
    const verdict = closeEnough(heard, item.answer);
    if (verdict === "unsure") {
      say(item.word);
      submit("", { unsure: true });
    } else if (verdict === "yes") submit(item.answer);
    else submit(heard);
  };
  rec.onerror = () => {
    say(item.word);
    submit("", { unsure: true });
  };
  rec.start();
  feedback(app, "Listening...", "");
}

function closeEnough(heard, word) {
  const a = String(heard || "").toLowerCase().replace(/[^a-z]/g, "");
  const b = String(word || "").toLowerCase();
  if (!a) return "unsure";
  if (a === b || a.includes(b)) return "yes";
  if (Math.abs(a.length - b.length) > 1) return "no";
  let misses = 0;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) if (a[i] !== b[i]) misses += 1;
  return misses <= 1 ? "yes" : "no";
}

function drawStory(panel, item) {
  const page = item.pages[promptIndex] || item.pages[0];
  panel.append(el("div", "big-word", page.text));
  const next = el("button", "go", promptIndex + 1 < item.pages.length ? "Next page" : "I read it");
  next.type = "button";
  next.addEventListener("click", () => {
    if (promptIndex + 1 < item.pages.length) {
      promptIndex += 1;
      renderItem();
    } else submit("done");
  });
  panel.append(next);
}

function drawCount(panel, item, ready) {
  const row = el("div", "dots count-dots");
  let tapped = 0;
  let lock = true;
  const buttons = [];
  for (let i = 0; i < item.count; i += 1) {
    const button = el("button", "pop-dot", item.emoji);
    button.type = "button";
    button.addEventListener("click", async () => {
      if (lock || button.disabled || busy) return;
      lock = true;
      button.disabled = true;
      button.classList.add("popped");
      tapped += 1;
      await say(COUNT_WORD[tapped] || String(tapped));
      if (tapped === item.count) submit(String(item.count));
      else lock = false;
    });
    buttons.push(button);
    row.append(button);
  }
  panel.append(el("p", "joyce-line", "Tap each one. I will count with you."));
  panel.append(row);
  Promise.resolve(ready).then(() => { lock = false; });
  hold(buttons, ready);
}

function drawCompare(panel, item, ready) {
  const row = el("div", "groups");
  const buttons = [];
  for (const side of ["left", "right"]) {
    const button = el("button", "choice side", item.emoji.repeat(item[side]));
    button.type = "button";
    button.addEventListener("click", () => submit(side));
    buttons.push(button);
    row.append(button);
  }
  hold(buttons, ready);
  panel.append(row);
}

function drawAdd(panel, item, ready) {
  const row = el("div", "groups");
  row.append(el("div", "dots", item.emoji.repeat(item.left)));
  row.append(el("div", "dots", "+"));
  row.append(el("div", "dots", item.emoji.repeat(item.right) || "0"));
  panel.append(row);
  drawChoices(panel, item.choices, (id) => submit(id), ready);
}

function drawPattern(panel, item, ready) {
  panel.append(el("div", "dots", item.sequence.join("  ")));
  drawChoices(panel, item.choices, (id) => submit(id), ready);
}

function drawRegroup(panel, item, prompt, ready) {
  const blocks = el("div", "blocks");
  blocks.append(placeValue(item.a), el("div", "dots", "+"), placeValue(item.b));
  panel.append(blocks);
  drawChoices(panel, prompt.choices, (id) => submit(id), ready);
}

function placeValue(number) {
  const group = el("div");
  const tens = el("div");
  for (let i = 0; i < Math.floor(number / 10); i += 1) tens.append(el("span", "ten"));
  const ones = el("div");
  for (let i = 0; i < number % 10; i += 1) ones.append(el("span", "one"));
  group.append(tens, ones, el("div", "", String(number)));
  return group;
}

async function submit(picked, extra = {}) {
  if (busy || !card) return;
  busy = true;
  const item = currentItem();
  try {
    const data = await api("answer", {
      stepId: card.stepId,
      item: item.item,
      index,
      prompt: promptIndex,
      picked,
      unsure: Boolean(extra.unsure)
    });
    const note = document.querySelector("#feedback");
    if (data.wait) {
      if (note) {
        note.textContent = data.say;
        note.className = "feedback";
      }
      await say(data.say);
      return;
    }
    if (note) {
      note.textContent = data.say;
      note.className = `feedback ${data.correct === false ? "no" : "yes"}`;
    }
    if (data.correct === false) {
      await say(data.say);
      const again = item.type === "regroup" ? item.prompts[promptIndex] : item;
      await say(questionLine(item, again));
      return;
    }
    popStar();
    await say(data.say);
    if (item.type === "regroup" && promptIndex + 1 < item.prompts.length) {
      promptIndex += 1;
      renderItem();
      return;
    }
    promptIndex = 0;
    built = [];
    index += 1;
    renderItem();
  } catch (err) {
    feedback(app, err.message, "no");
  } finally {
    busy = false;
  }
}

async function needHelp(item) {
  helps += 1;
  if (helps === 1) {
    const teaching = card.replay || (card.beats || []).join(" ");
    feedback(app, teaching, "");
    replay(teaching);
    return;
  }
  if (helps === 2) {
    const line = "Let's take a wiggle break. Hop five times, then we can try this one again.";
    feedback(app, line, "");
    replay(line);
    return;
  }
  try {
    const data = await api("help", { stepId: card.stepId, item: item.item, tries: helps });
    replay(data.say);
    const note = document.querySelector("#feedback");
    if (note) {
      note.textContent = data.say;
      note.className = "feedback no";
    }
  } catch (err) {
    feedback(app, err.message, "no");
  }
}

function feedback(panel, text, kind) {
  let note = panel.querySelector?.("#feedback") || document.querySelector("#feedback");
  if (!note) {
    note = el("p", "feedback");
    note.id = "feedback";
    (panel.append ? panel : app).append(note);
  }
  note.textContent = text;
  note.className = `feedback ${kind || ""}`;
}

async function finish(status) {
  if (!card || busy) return;
  busy = true;
  stopTicker();
  try {
    const data = await api("card", { cardId: card.id, status });
    if (data.redo) {
      say(data.say);
      index = 0;
      promptIndex = 0;
      built = [];
      helps = 0;
      busy = false;
      if (card.beats?.length) renderTeach();
      else renderItem();
      return;
    }
    if (data.say) say(data.say);
    day = await api("today");
    renderBoard();
  } catch (err) {
    busy = false;
    feedback(app, err.message, "no");
    return;
  }
  busy = false;
}

function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
  if (visTick) document.removeEventListener("visibilitychange", visTick);
  visTick = null;
}

async function startTalk() {
  if (peer) return stopTalk();
  if (!navigator.mediaDevices?.getUserMedia) {
    say("The microphone needs Safari or Chrome.");
    return;
  }
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    say("The microphone said no. A grown-up can allow it in Settings.");
    return;
  }
  peer = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  peer.ontrack = (event) => { audio.srcObject = event.streams[0]; };
  peer.addTrack(mic.getTracks()[0]);
  const events = peer.createDataChannel("oai-events");
  let greeting = `Say hi to ${day?.name || "friend"}.`;
  events.addEventListener("open", () => {
    events.send(JSON.stringify({ type: "response.create", response: { instructions: greeting } }));
  });
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  await new Promise((resolve) => {
    if (peer.iceGatheringState === "complete") return resolve();
    const done = () => {
      if (peer.iceGatheringState === "complete") {
        peer.removeEventListener("icegatheringstatechange", done);
        resolve();
      }
    };
    peer.addEventListener("icegatheringstatechange", done);
    setTimeout(resolve, 2500);
  });
  try {
    const data = await api("live", { sdp: peer.localDescription.sdp });
    if (data.greeting) greeting = data.greeting;
    await peer.setRemoteDescription({ type: "answer", sdp: data.sdp });
    talkStarted = Date.now();
    const button = [...app.querySelectorAll("button")].find((node) => node.textContent === "Ask Joyce");
    if (button) button.textContent = "Hang up";
    setTimeout(() => { if (peer) stopTalk(); }, 5 * 60 * 1000);
  } catch (err) {
    stopTalk();
    say(err.message);
  }
}

async function stopTalk() {
  const seconds = talkStarted ? Math.round((Date.now() - talkStarted) / 1000) : 0;
  talkStarted = 0;
  mic?.getTracks().forEach((track) => track.stop());
  peer?.close();
  peer = null;
  mic = null;
  if (seconds > 0) api("live-used", { seconds }).catch(() => {});
  const button = [...app.querySelectorAll("button")].find((node) => node.textContent === "Hang up");
  if (button) button.textContent = "Ask Joyce";
}

load();
