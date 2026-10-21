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
let elapsed = 0;
let ticker = null;

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

function say(text) {
  if (!text) return;
  window.speechSynthesis?.cancel();
  if (voice) {
    voice.pause();
    voice = null;
  }
  api("speak", { text }).then((data) => {
    if (data.audioBase64) {
      voice = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
      voice.play().catch(() => deviceSay(text));
      return;
    }
    deviceSay(text);
  }).catch(() => deviceSay(text));
}

function deviceSay(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  window.speechSynthesis.speak(utter);
}

function header(title, line) {
  const top = el("div", "top");
  const photo = el("img");
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
  stopTicker();
  card = null;
  const root = header(day.name, day.greeting);
  const actions = el("div", "actions");
  const talk = el("button", "go", "Ask Joyce");
  talk.type = "button";
  talk.addEventListener("click", () => startTalk());
  const again = el("button", "quiet", "Hear that again");
  again.type = "button";
  again.addEventListener("click", () => say(day.greeting));
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
    say("You already did that one.");
    return;
  }
  card = next;
  index = 0;
  promptIndex = 0;
  built = [];
  helps = 0;
  say(card.say);
  if (card.kind === "lesson") renderItem();
  else renderSimple();
}

function shell(title) {
  const root = header(day.name, title);
  const panel = el("div", "panel");
  app.replaceChildren(root, panel);
  return panel;
}

function renderSimple() {
  const panel = shell(card.title);
  panel.append(el("p", "prompt", card.say));
  if (card.kind === "app" || card.kind === "game") {
    const link = el("a", "go", card.kind === "app" ? "Open it" : "Play");
    link.href = card.href;
    link.target = "_blank";
    link.rel = "noopener";
    panel.append(link);
    elapsed = 0;
    const timer = el("p", "timer", "0:00");
    panel.append(timer);
    stopTicker();
    ticker = setInterval(() => {
      elapsed += 1;
      const min = Math.floor(elapsed / 60);
      const sec = String(elapsed % 60).padStart(2, "0");
      timer.textContent = `${min}:${sec}`;
    }, 1000);
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

function renderItem() {
  const item = currentItem();
  if (!item) {
    finish("done");
    return;
  }
  const panel = shell(`${card.title}  ${index + 1} / ${card.items.length}`);
  const prompt = item.type === "regroup" ? item.prompts[promptIndex] : item;
  if (item.type !== "story") {
    panel.append(el("p", "prompt", prompt.say || item.say));
    if (index === 0 && promptIndex === 0) say(prompt.say || item.say);
  }
  drawItem(panel, item, prompt);
  const note = el("p", "feedback");
  note.id = "feedback";
  const row = el("div", "actions");
  const help = el("button", "quiet", "I need help");
  help.type = "button";
  help.addEventListener("click", () => needHelp(item));
  const skip = el("button", "quiet", "Something else");
  skip.type = "button";
  skip.addEventListener("click", () => finish("skipped"));
  const back = el("button", "quiet", "Back");
  back.type = "button";
  back.addEventListener("click", renderBoard);
  row.append(help, skip, back);
  panel.append(note, row);
}

function drawItem(panel, item, prompt) {
  if (item.type === "build") return drawBuild(panel, item);
  if (item.type === "read") return drawRead(panel, item);
  if (item.type === "story") return drawStory(panel, item);
  if (item.type === "count") return drawCount(panel, item);
  if (item.type === "compare") return drawCompare(panel, item);
  if (item.type === "add") return drawAdd(panel, item);
  if (item.type === "pattern") return drawPattern(panel, item);
  if (item.type === "regroup") return drawRegroup(panel, item, prompt);
  if (item.show) panel.append(el("div", "big-number", String(item.show)));
  drawChoices(panel, prompt.choices || item.choices, (id) => submit(id));
}

function drawChoices(panel, choices, onPick) {
  const row = el("div", "choices");
  for (const choice of choices || []) {
    const button = el("button", "choice", choice.label);
    button.type = "button";
    button.addEventListener("click", () => onPick(choice.id));
    row.append(button);
  }
  panel.append(row);
}

function drawBuild(panel, item) {
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
      if (before < used) button.disabled = true;
      button.addEventListener("click", () => {
        if (built.length >= item.word.length) return;
        built.push(letter);
        paint();
        if (built.length === item.word.length) submit(built.join(""));
      });
      row.append(button);
    });
  };
  const undo = el("button", "quiet", "Undo");
  undo.type = "button";
  undo.addEventListener("click", () => { built.pop(); paint(); });
  panel.append(word, row, undo);
  paint();
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
      say(item.pages[promptIndex].text);
      renderItem();
    } else submit("done");
  });
  panel.append(next);
  say(page.text);
}

function drawCount(panel, item) {
  panel.append(el("div", "dots", item.emoji.repeat(item.count)));
  drawChoices(panel, item.choices, (id) => submit(id));
}

function drawCompare(panel, item) {
  const row = el("div", "groups");
  for (const side of ["left", "right"]) {
    const button = el("button", "choice side", item.emoji.repeat(item[side]));
    button.type = "button";
    button.addEventListener("click", () => submit(side));
    row.append(button);
  }
  panel.append(row);
}

function drawAdd(panel, item) {
  const row = el("div", "groups");
  row.append(el("div", "dots", item.emoji.repeat(item.left)));
  row.append(el("div", "dots", "+"));
  row.append(el("div", "dots", item.emoji.repeat(item.right) || "0"));
  panel.append(row);
  drawChoices(panel, item.choices, (id) => submit(id));
}

function drawPattern(panel, item) {
  panel.append(el("div", "dots", item.sequence.join("  ")));
  drawChoices(panel, item.choices, (id) => submit(id));
}

function drawRegroup(panel, item, prompt) {
  const blocks = el("div", "blocks");
  blocks.append(placeValue(item.a), el("div", "dots", "+"), placeValue(item.b));
  panel.append(blocks);
  drawChoices(panel, prompt.choices, (id) => submit(id));
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
    if (note) {
      note.textContent = data.say;
      note.className = `feedback ${data.correct === false ? "no" : "yes"}`;
    }
    say(data.say);
    if (data.correct === false) return;
    if (item.type === "regroup" && promptIndex + 1 < item.prompts.length) {
      promptIndex += 1;
      setTimeout(renderItem, 700);
      return;
    }
    promptIndex = 0;
    built = [];
    index += 1;
    setTimeout(() => {
      const next = currentItem();
      renderItem();
      if (!next || next.type === "story") return;
      const line = next.type === "regroup" ? next.prompts[promptIndex]?.say : next.say;
      say(line);
    }, 700);
  } catch (err) {
    feedback(app, err.message, "no");
  } finally {
    busy = false;
  }
}

async function needHelp(item) {
  helps += 1;
  try {
    const data = await api("help", { stepId: card.stepId, item: item.item, tries: helps });
    say(data.say);
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
