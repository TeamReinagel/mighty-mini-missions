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
let speakToken = 0;
let speakChain = Promise.resolve();
let talking = false;
let teachGen = 0;
let idleTimer = null;
let idleNudged = false;
let roomTimer = null;
let roomSaid = false;
let doneSaid = false;

const IDLE_MS = 2 * 60 * 1000;
const ROOM_POLL_MS = 20 * 1000;
const EVERYONE_DONE = "Everyone's done. Tablets down. Go play!";

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
  app.replaceChildren(header("Today with Joyce", "Getting today's missions..."));
  try {
    day = await api("today");
    document.documentElement.style.setProperty("--kid", day.color || "#7c6cf0");
    renderBoard();
    if (!day.dose?.complete) say(day.greeting);
  } catch (err) {
    app.replaceChildren(header("Today with Joyce", err.message));
    const retry = btn("go", "🔄", "Try again");
    retry.addEventListener("click", load);
    app.append(retry);
  }
}

const KIND_LABEL = { lesson: "Joyce teaches", check: "Show me", game: "Game", app: "App", move: "Move", celebrate: "Celebrate", write: "Write" };
const KIND_ICON = { lesson: "📚", check: "👀", game: "🎮", app: "📱", move: "🏃", celebrate: "🎉", write: "✏️" };

function calmMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function iconMark(icon) {
  const mark = el("span", "btn-icon", icon);
  mark.setAttribute("aria-hidden", "true");
  return mark;
}

// Words stay for grown-ups; the icon is what Gabi can spot without reading.
function btn(className, icon, label) {
  const button = el("button", `with-icon ${className}`);
  button.type = "button";
  button.append(iconMark(icon), el("span", "btn-label", label));
  return button;
}

function labeledLink(className, icon, label) {
  const link = el("a", `with-icon ${className}`);
  link.append(iconMark(icon), el("span", "btn-label", label));
  return link;
}

function setTalkButton(button, live) {
  button.replaceChildren(iconMark(live ? "☎️" : "🎤"), el("span", "btn-label", live ? "Hang up" : "Ask Joyce"));
  button.classList.toggle("live", live);
}

function talkControls(line) {
  const actions = el("div", "talk-quiet");
  const talk = btn("quiet", "🎤", "Ask Joyce");
  talk.dataset.talk = "ask";
  talk.addEventListener("click", () => startTalk());
  const again = btn("quiet", "🔊", "Hear that again");
  again.addEventListener("click", () => replay(line));
  actions.append(talk, again);
  return actions;
}

function boardHeader(title, line) {
  const root = header(title, line);
  root.classList.add("board-top");
  root.lastElementChild.append(talkControls(line));
  return root;
}

function missionTrack() {
  const required = [];
  for (const part of day.dose?.parts || []) {
    if (part.id === "bonus") continue;
    for (const item of day.cards) {
      if (item.part === part.id) required.push(item);
    }
  }
  const bonus = day.cards.filter((item) => item.part === "bonus");
  return {
    required,
    bonus,
    picked: bonus.find((item) => item.done) || null,
    total: required.length + (bonus.length ? 1 : 0)
  };
}

function missionRow(item, tone) {
  const button = el("button", `card mission-row ${tone}`);
  button.type = "button";
  button.append(iconMark(item.done ? "✅" : KIND_ICON[item.kind] || "⭐"));
  const copy = el("span", "mission-copy");
  copy.append(el("strong", "", item.done ? `${item.title} ✓` : item.title));
  copy.append(el("span", "", item.done ? "Done" : KIND_LABEL[item.kind] || "Mission"));
  button.append(copy);
  button.addEventListener("click", () => openCard(item));
  return button;
}

function missionGroup(title, rows) {
  if (!rows.length) return null;
  const section = el("section", "mission-group");
  section.append(el("h2", "group-title", title));
  const board = el("div", "board");
  for (const row of rows) board.append(row);
  section.append(board);
  return section;
}

function stampButton({ state, mark, label, missionId, onClick }) {
  const button = el("button", `stamp ${state}`);
  button.type = "button";
  if (missionId) button.dataset.mission = missionId;
  if (state === "now") button.setAttribute("aria-current", "step");
  button.append(el("b", "stamp-mark", mark), el("span", "stamp-label", label));
  button.addEventListener("click", onClick);
  return button;
}

function renderPath(track) {
  const path = el("div", "path");
  path.setAttribute("aria-label", "Today's missions");
  const next = nextCard();
  track.required.forEach((item, index) => {
    const state = item.done ? "done" : next?.id === item.id ? "now" : "later";
    path.append(stampButton({
      state,
      mark: item.done ? "✅" : KIND_ICON[item.kind] || String(index + 1),
      label: item.title,
      missionId: item.id,
      onClick: () => openCard(item)
    }));
  });
  if (!track.bonus.length) return path;
  const current = !next && bonusWaiting();
  const state = track.picked ? "done" : current ? "now" : "later";
  path.append(stampButton({
    state,
    mark: track.picked ? "✅" : "🎁",
    label: track.picked ? track.picked.title : "Bonus",
    missionId: track.picked?.id || "",
    onClick: () => {
      if (track.picked) openCard(track.picked);
      else document.querySelector(".hero")?.scrollIntoView({ behavior: calmMotion() ? "auto" : "smooth", block: "nearest" });
    }
  }));
  return path;
}

function heroMission(item, index, total) {
  const hero = el("section", "hero");
  hero.append(el("p", "mission-kicker", `Mission ${index} of ${total}`));
  const title = el("h2", "hero-title");
  title.append(iconMark(KIND_ICON[item.kind] || "⭐"), el("span", "", item.title));
  hero.append(title);
  hero.append(el("p", "hero-kind", KIND_LABEL[item.kind] || "Mission"));
  const start = btn("go hero-start", "▶️", "Start");
  start.addEventListener("click", () => openCard(item));
  hero.append(start);
  return hero;
}

function heroBonus(track, index) {
  const hero = el("section", "hero");
  hero.append(el("p", "mission-kicker", `Mission ${index} of ${track.total}`));
  hero.append(el("h2", "hero-title", "Pick one bonus mission"));
  const choices = el("div", "hero-choices");
  for (const item of track.bonus) {
    const button = el("button", "with-icon hero-choice");
    button.type = "button";
    button.append(iconMark(KIND_ICON[item.kind] || "⭐"));
    const copy = el("span", "mission-copy");
    copy.append(el("strong", "", item.title), el("span", "", KIND_LABEL[item.kind] || "Mission"));
    button.append(copy);
    button.addEventListener("click", () => openCard(item));
    choices.append(button);
  }
  hero.append(choices);
  return hero;
}

// The next card Joyce leads to. The bonus is the child's pick, so it is never chosen for them.
function nextCard() {
  for (const part of day.dose?.parts || []) {
    if (part.done || part.id === "bonus") continue;
    const open = day.cards.find((item) => item.part === part.id && !item.done);
    if (open) return open;
  }
  return null;
}

function bonusWaiting() {
  return Boolean(day.dose?.parts.some((part) => part.id === "bonus" && !part.done));
}

function nextLine() {
  const next = nextCard();
  if (next) return `Next mission is ${next.title}. Tap Start.`;
  if (bonusWaiting()) return "Pick one bonus mission.";
  return "";
}

function missionCheer(said) {
  if (said && said !== "Saved.") return said;
  const next = nextLine();
  return next ? `Mission complete. ${next}` : "Mission complete.";
}

function renderBoard(options = {}) {
  teachGen += 1;
  clearIdle();
  card = null;
  if (day.dose?.complete) {
    renderDone(options);
    return;
  }
  stopRoom();
  const root = boardHeader(day.name, day.greeting);
  if (!day.dose) {
    const note = el("h2", "group-title", "Missions if you want them");
    const board = el("div", "board");
    for (const item of day.cards) board.append(missionRow(item, item.done ? "done" : "open"));
    app.replaceChildren(root, note, board);
    if (options.celebrateId) celebrateMission(options.celebrateId);
    return;
  }
  const track = missionTrack();
  const next = nextCard();
  const currentIndex = next
    ? track.required.findIndex((item) => item.id === next.id) + 1
    : track.required.length + 1;
  const hero = next ? heroMission(next, currentIndex, track.total) : heroBonus(track, currentIndex);
  const doneRows = [];
  const laterRows = [];
  for (const item of track.required) {
    if (item.done) doneRows.push(missionRow(item, "done"));
    else if (item.id !== next?.id) laterRows.push(missionRow(item, "later"));
  }
  if (track.picked) doneRows.push(missionRow(track.picked, "done"));
  else if (next) {
    for (const item of track.bonus) laterRows.push(missionRow(item, "later"));
  }
  app.replaceChildren(
    root,
    renderPath(track),
    hero,
    ...[missionGroup("Done", doneRows), missionGroup("Later", laterRows)].filter(Boolean)
  );
  if (options.celebrateId) celebrateMission(options.celebrateId);
}

function renderDone(options = {}) {
  const line = `All missions done, ${day.name}!`;
  const root = boardHeader(day.name, line);
  const note = el("p", "joyce-line", "Play a game while the others finish, or go play.");
  const play = el("h2", "group-title", "Play a game");
  const games = el("div", "board");
  for (const game of day.free || []) {
    const link = el("a", "card with-icon");
    link.href = game.href;
    link.target = "_blank";
    link.rel = "noopener";
    link.append(iconMark("🎮"), el("span", "btn-label", game.title));
    games.append(link);
  }
  const room = el("div", "room");
  room.id = "room";
  const pieces = [root];
  if (day.dose) pieces.push(renderPath(missionTrack()));
  pieces.push(note, play, games, room);
  app.replaceChildren(...pieces);
  if (options.skipSpeech) doneSaid = true;
  else if (!doneSaid) {
    doneSaid = true;
    say(`${line} Play a game while the others finish, or go play.`);
  }
  if (options.celebrateDay) {
    celebrateDay();
    if (!calmMotion()) missionNode(options.celebrateId)?.classList.add("just");
  }
  pollRoom();
}

function stopRoom() {
  clearTimeout(roomTimer);
  roomTimer = null;
}

async function pollRoom() {
  stopRoom();
  const box = document.getElementById("room");
  if (!box) return;
  try {
    const data = await api("room");
    if (!box.isConnected) return;
    if (data.allDone) {
      box.replaceChildren(el("p", "prompt", EVERYONE_DONE));
      if (!roomSaid) {
        roomSaid = true;
        say(EVERYONE_DONE);
        celebrateRoom(box);
      }
      return;
    }
    const waiting = (data.kids || []).filter((entry) => entry.started && !entry.complete).map((entry) => entry.name);
    box.replaceChildren(el("p", "joyce-line", waiting.length ? `Still finishing: ${waiting.join(", ")}.` : ""));
  } catch {
    // Keep the done screen; the next check will try again.
  }
  if (box.isConnected) roomTimer = setTimeout(pollRoom, ROOM_POLL_MS);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && document.getElementById("room")) pollRoom();
});

function openCard(next) {
  if (next.done) {
    replay("You already finished that mission.");
    return;
  }
  hush();
  teachGen += 1;
  card = next;
  index = 0;
  promptIndex = 0;
  built = [];
  helps = 0;
  idleNudged = false;
  if (card.kind === "check") renderCheckIntro();
  else if (card.kind === "lesson" && card.beats?.length) renderTeach();
  else if (card.kind === "lesson") renderItem();
  else if (card.kind === "write") renderWrite();
  else renderSimple();
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgNode(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

// The same three lines as the writing paper: top, dashed middle, bottom.
function letterBox() {
  const svg = svgNode("svg", { viewBox: "0 0 100 120", class: "write-box", "aria-label": `How to write ${card.letter}` });
  for (const y of [10, 50, 90]) svg.append(svgNode("line", { x1: 4, x2: 96, y1: y, y2: y, class: y === 50 ? "guide mid" : "guide" }));
  return svg;
}

// Draws each stroke while Joyce says it, with a green dot where the pencil starts.
async function showStrokes(svg, line, gen) {
  svg.querySelectorAll(".stroke, .start").forEach((node) => node.remove());
  for (const stroke of card?.strokes || []) {
    if (gen !== teachGen) return;
    line.textContent = stroke.text;
    svg.querySelectorAll(".start").forEach((node) => node.classList.add("old"));
    const path = svgNode("path", { d: stroke.d, class: "stroke" });
    svg.append(path);
    const length = path.getTotalLength();
    const begin = path.getPointAtLength(0);
    svg.append(svgNode("circle", { cx: begin.x, cy: begin.y, r: 5, class: "start" }));
    const ms = Math.max(900, length * 14);
    if (length > 2) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${ms}ms ease-in-out`;
      path.style.strokeDashoffset = "0";
    }
    await Promise.all([say(stroke.cue), pause(ms + 200)]);
  }
}

function renderWrite() {
  const panel = shell(card.title);
  const line = el("p", "prompt", card.sayText);
  const svg = letterBox();
  const wrote = btn("go", "✏️", "I wrote them");
  wrote.disabled = true;
  wrote.addEventListener("click", () => {
    if (card.word) renderWriteWord();
    else renderWriteCheck();
  });
  const again = btn("quiet", "👀", "Watch again");
  const back = btn("quiet", "↩️", "Back");
  back.addEventListener("click", () => {
    teachGen += 1;
    hush();
    renderBoard();
  });
  const row = el("div", "actions");
  row.append(wrote, again, back);
  const paper = el("a", "paper-link", "Grown-up: print writing paper");
  paper.href = card.paperHref;
  paper.target = "_blank";
  paper.rel = "noopener";
  panel.append(line, svg, row, paper);
  const demo = async () => {
    teachGen += 1;
    hush();
    const gen = teachGen;
    line.textContent = card.sayText;
    await say(card.say);
    await showStrokes(svg, line, gen);
    if (gen !== teachGen) return;
    line.textContent = card.writeText;
    await say(card.write);
    if (gen === teachGen && wrote.isConnected) wrote.disabled = false;
  };
  again.addEventListener("click", demo);
  demo();
}

function renderWriteWord() {
  teachGen += 1;
  hush();
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.wordSay), el("div", "write-word", card.word));
  const wrote = btn("go", "✏️", "I wrote it");
  wrote.disabled = true;
  wrote.addEventListener("click", renderWriteCheck);
  const again = btn("quiet", "🔊", "Hear it again");
  again.addEventListener("click", () => replay(card.wordSay));
  const row = el("div", "actions");
  row.append(wrote, again);
  panel.append(row);
  say(card.wordSay).then(() => { if (wrote.isConnected) wrote.disabled = false; });
}

function renderWriteCheck() {
  teachGen += 1;
  hush();
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.check));
  const answer = async (fits) => {
    if (busy) return;
    busy = true;
    try {
      const data = await api("write", { fits });
      busy = false;
      say(data.say);
      await finish("done");
    } catch (err) {
      busy = false;
      feedback(panel, err.message, "no");
    }
  };
  const yes = btn("go", "👍", "Yes, they fit");
  yes.addEventListener("click", () => answer(true));
  const notYet = btn("quiet", "🔄", "Not yet");
  notYet.addEventListener("click", () => answer(false));
  const row = el("div", "actions");
  row.append(yes, notYet);
  panel.append(row);
  hold([yes, notYet], say(card.check));
}

function renderCheckIntro() {
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.say));
  const go = btn("go", "👍", "I'm ready");
  go.addEventListener("click", () => {
    hush();
    renderItem();
  });
  const back = btn("quiet", "↩️", "Back");
  back.addEventListener("click", () => {
    hush();
    renderBoard();
  });
  const row = el("div", "actions");
  row.append(go, back);
  panel.append(row);
  say(card.say);
}

function clearIdle() {
  clearTimeout(idleTimer);
  idleTimer = null;
}

function armIdle() {
  clearIdle();
  if (!card || idleNudged) return;
  idleTimer = setTimeout(() => {
    if (!card || card.kind !== "lesson") return;
    idleNudged = true;
    say("Your stars are waiting. Want to keep going?");
  }, IDLE_MS);
}

document.addEventListener("pointerdown", () => {
  if (idleTimer) armIdle();
});

function shell(title) {
  const root = header(day.name, title);
  const panel = el("div", "panel");
  app.replaceChildren(root, panel);
  return panel;
}

function renderSimple() {
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.say));
  const spoken = say(card.say);
  if (card.kind === "app" || card.kind === "game") {
    const link = labeledLink("go", card.kind === "app" ? "📲" : "▶️", card.kind === "app" ? "Open it" : "Play");
    link.href = card.href;
    link.target = "_blank";
    link.rel = "noopener";
    const opening = card;
    link.addEventListener("click", () => { api("open", { cardId: opening.id }).catch(() => {}); });
    panel.append(link);
    if (card.askLesson) {
      const done = btn("go", "✅", "I'm done");
      done.disabled = true;
      link.addEventListener("click", () => { done.disabled = false; });
      done.addEventListener("click", () => askLesson(panel));
      panel.append(done);
      return;
    }
    const done = btn("go", "✅", "I'm done");
    done.disabled = true;
    link.addEventListener("click", () => { done.disabled = false; });
    done.addEventListener("click", () => finish("done"));
    const back = btn("quiet", "↩️", "Back");
    back.addEventListener("click", renderBoard);
    panel.append(done, back);
    return;
  }
  if (card.askLesson) {
    const done = btn("go", "✅", "I'm done");
    done.addEventListener("click", () => askLesson(panel));
    panel.append(done);
    return;
  }
  const done = card.kind === "move"
    ? btn("go", "✅", "I did it")
    : card.kind === "celebrate"
      ? btn("go", "🗣️", "I told someone")
      : btn("go", "✅", "I'm done");
  done.addEventListener("click", () => finish("done"));
  if (card.kind === "move") {
    done.disabled = true;
    spoken.then(() => { if (done.isConnected) done.disabled = false; });
  }
  const back = btn("quiet", "↩️", "Back");
  back.addEventListener("click", renderBoard);
  panel.append(done, back);
}

function askLesson(panel) {
  panel.replaceChildren();
  panel.append(el("p", "prompt", "Which lesson did you finish?"));
  let lesson = Math.min(120, (Number(card.lesson) || 93) + 1);
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
  const save = btn("go", "✅", "This lesson");
  save.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    try {
      const data = await api("reading", { lesson });
      say(data.say);
      busy = false;
      if (data.ok === false) {
        feedback(panel, data.say, "no");
        return;
      }
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
  const go = btn("go", "👉", "Your turn");
  go.addEventListener("click", () => {
    teachGen += 1;
    hush();
    renderItem();
  });
  const again = btn("quiet", "🔊", "Hear it again");
  again.addEventListener("click", () => {
    teachGen += 1;
    replay((card.beats || []).join(" "));
  });
  const back = btn("quiet", "↩️", "Back");
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
  const help = btn("quiet", "🙋", "I need help");
  help.addEventListener("click", () => needHelp(item));
  const again = btn("quiet", "🔊", "Hear it again");
  again.addEventListener("click", () => replay(line));
  const back = btn("quiet", "↩️", "Back");
  back.addEventListener("click", renderBoard);
  row.append(help, again, back);
  panel.append(note, row);
  armIdle();
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
  const undo = btn("quiet", "↩️", "Undo");
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
  const button = btn("go", "🎤", "I'll read it");
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
  const last = promptIndex + 1 >= item.pages.length;
  const next = btn("go", last ? "✅" : "➡️", last ? "I read it" : "Next page");
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
      unsure: Boolean(extra.unsure),
      check: card.kind === "check"
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
    if (data.moveOn) {
      if (note) {
        note.textContent = data.say;
        note.className = `feedback ${data.correct === false ? "no" : "yes"}`;
      }
      if (data.correct !== false) popStar();
      await say(data.say);
      promptIndex = 0;
      built = [];
      index += 1;
      renderItem();
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
  if (card?.kind === "check") {
    if (busy) return;
    busy = true;
    try {
      const data = await api("help", { stepId: card.stepId, item: item.item, tries: 1, check: true });
      await say(data.say);
      promptIndex = 0;
      built = [];
      index += 1;
      busy = false;
      renderItem();
    } catch (err) {
      busy = false;
      feedback(app, err.message, "no");
    }
    return;
  }
  helps += 1;
  if (helps === 1) {
    api("help", { stepId: card.stepId, item: item.item, tries: 1 }).catch(() => {});
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
    if (data.canEase && !document.querySelector("#ease")) {
      const ease = btn("quiet", "🛑", "Stop this one for today");
      ease.id = "ease";
      ease.addEventListener("click", () => finish("eased"));
      (note?.parentNode || app).append(ease);
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

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function finish(status, retried = false) {
  if (!card || busy) return;
  busy = true;
  clearIdle();
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
    if (data.notYet) {
      busy = false;
      // A game sends its answers a few seconds after the child leaves it, so check once more first.
      if (card.kind === "game" && !retried) {
        feedback(app, "Checking...", "");
        await pause(4000);
        return finish(status, true);
      }
      feedback(app, data.say, "no");
      say(data.say);
      return;
    }
    const finishedId = card.id;
    const finishing = status === "done" || status === "eased";
    day = await api("today");
    hush();
    if (!finishing) {
      renderBoard();
      if (data.say && !day.dose?.complete) say(data.say);
      if (!day.dose?.complete) say(nextLine());
    } else if (day.dose?.complete) {
      renderBoard({ skipSpeech: true, celebrateDay: true, celebrateId: finishedId });
      say(`All missions done, ${day.name}!`);
    } else {
      renderBoard({ celebrateId: finishedId });
      say(missionCheer(data.say));
    }
  } catch (err) {
    busy = false;
    feedback(app, err.message, "no");
    return;
  }
  busy = false;
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
    const button = document.querySelector("[data-talk]");
    if (button) setTalkButton(button, true);
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
  const button = document.querySelector("[data-talk]");
  if (button) setTalkButton(button, false);
}

function fxLayer() {
  let layer = document.querySelector(".fx-layer");
  if (!layer) {
    layer = el("div", "fx-layer");
    document.body.append(layer);
  }
  return layer;
}

function sparkle(origin, count) {
  if (calmMotion()) return;
  const layer = fxLayer();
  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.3;
  for (let i = 0; i < count; i += 1) {
    const piece = el("span", i % 3 === 0 ? "spark" : "spark spark-bit");
    if (i % 3 === 0) piece.textContent = "★";
    const angle = (Math.PI * 2 * i) / count;
    const dist = 64 + Math.random() * 86;
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    layer.append(piece);
    setTimeout(() => piece.remove(), 900);
  }
}

function confettiRain(count) {
  if (calmMotion()) return;
  const layer = fxLayer();
  const colors = ["#78a6ff", "#9affc8", "#ff6b6b", "#ffd93d", "#6bcb77", "#ec4899", "#8b5cf6"];
  const shapes = ["", "confetti-circle", "confetti-star"];
  for (let i = 0; i < count; i += 1) {
    const piece = el("i", `confetti-piece ${shapes[i % shapes.length]}`);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.animationDuration = `${1.3 + Math.random() * 0.8}s`;
    layer.append(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function chime(kind) {
  if (calmMotion()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const notes = kind === "day" ? [523, 659, 784, 1047] : [523, 659, 784];
    notes.forEach((freq, index) => osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08));
    const length = kind === "day" ? 0.55 : 0.35;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + length);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + length);
    setTimeout(() => ctx.close(), 800);
  } catch {
    // A missing sound still leaves the stamps and words.
  }
}

function missionNode(id) {
  if (!id) return null;
  const safe = window.CSS?.escape ? CSS.escape(id) : String(id).replace(/"/g, '\\"');
  return document.querySelector(`[data-mission="${safe}"]`);
}

function celebrateMission(id) {
  if (calmMotion()) return;
  const stamp = missionNode(id);
  if (stamp) stamp.classList.add("just");
  sparkle(stamp, 16);
  confettiRain(18);
  chime("mission");
}

function celebrateDay() {
  const banner = el("div", "day-banner", `All missions done, ${day.name}!`);
  document.body.append(banner);
  setTimeout(() => banner.remove(), calmMotion() ? 1600 : 2200);
  if (calmMotion()) return;
  confettiRain(56);
  sparkle(null, 24);
  chime("day");
}

function celebrateRoom(origin) {
  if (calmMotion()) return;
  sparkle(origin, 10);
  confettiRain(16);
}

load();
