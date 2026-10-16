const CODE_KEY = "design-studio-code";
const DESIGN_KEY = "design-studio-latest";
const TALK_LIMIT_MS = 15 * 60 * 1000;

const $ = (id) => document.getElementById(id);
const unlockPanel = $("unlock");
const studio = $("studio");
const unlockForm = $("unlock-form");
const unlockError = $("unlock-error");
const talkButton = $("talk");
const quietButton = $("quiet");
const status = $("status");
const transcript = $("transcript");
const sidFace = $("sid-face");
const sidText = $("sid-text");
const maxLine = $("max-line");
const maxText = $("max-text");
const designCard = $("design-card");
const designTitle = $("design-title");
const designBlurb = $("design-blurb");
const buildForm = $("build-form");
const buildNote = $("build-note");

let code = localStorage.getItem(CODE_KEY) || "";
let design = null;
try { design = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null"); } catch { design = null; }

let peer = null;
let events = null;
let mic = null;
let audio = null;
let talkStarted = 0;
let talkTimer = 0;
let sidBuffer = "";
let muted = false;

function showUnlock(message) {
  studio.hidden = true;
  unlockPanel.hidden = false;
  unlockError.hidden = !message;
  unlockError.textContent = message || "";
}

function showStudio() {
  unlockPanel.hidden = true;
  studio.hidden = false;
  renderDesign();
}

async function api(body, extraHeaders) {
  const headers = { "Content-Type": "application/json", ...(extraHeaders || {}) };
  if (code) headers["x-studio-code"] = code;
  const res = await fetch("/api/design-studio", { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 400) {
    const error = new Error(data.error || "Something went wrong.");
    error.status = res.status;
    throw error;
  }
  return { status: res.status, data };
}

function renderDesign() {
  if (!design?.title) {
    designCard.hidden = true;
    return;
  }
  designCard.hidden = false;
  designTitle.textContent = design.title;
  designBlurb.textContent = [design.howYouPlay, design.win].filter(Boolean).join(". ");
}

function setStatus(text) {
  status.textContent = text;
  const talking = text === "Sid is talking";
  sidFace.src = talking ? "./sid-talk.jpg" : "./sid-listen.jpg";
  sidFace.alt = talking ? "Sid, talking" : "Sid, listening";
}

function rememberDesign(next) {
  design = next;
  localStorage.setItem(DESIGN_KEY, JSON.stringify(next));
  renderDesign();
}

function stopTalk() {
  clearTimeout(talkTimer);
  mic?.getTracks().forEach((track) => track.stop());
  events?.close();
  peer?.close();
  if (audio) audio.srcObject = null;
  peer = null;
  events = null;
  mic = null;
  talkButton.disabled = false;
  talkButton.textContent = "Talk with Sid";
  talkButton.classList.remove("live");
  quietButton.classList.add("hidden");
  setStatus("");
}

function sendEvent(event) {
  if (events?.readyState === "open") events.send(JSON.stringify(event));
}

function askSid(instructions) {
  sendEvent({ type: "response.create", response: { instructions } });
}

async function saveFromTool(args, previousId) {
  const { data } = await api({ action: "save", design: args, designId: previousId || design?.id || "" });
  if (data.design) rememberDesign(data.design);
  return data.tellSid || data.error || "Saved.";
}

function onEvent(raw) {
  let event;
  try { event = JSON.parse(raw.data); } catch { return; }

  if (event.type === "response.output_audio_transcript.delta") {
    sidBuffer += event.delta || "";
    transcript.hidden = false;
    sidText.textContent = sidBuffer;
    setStatus("Sid is talking");
  }
  if (event.type === "response.output_audio_transcript.done") {
    sidBuffer = "";
    setStatus("Sid is listening");
  }
  if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript) {
    maxLine.classList.remove("hidden");
    maxText.textContent = event.transcript;
  }
  if (event.type === "response.function_call_arguments.done" && event.name === "save_design") {
    let args = {};
    try { args = JSON.parse(event.arguments || "{}"); } catch { args = {}; }
    const callId = event.call_id;
    saveFromTool(args, design?.id).then((tellSid) => {
      sendEvent({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: JSON.stringify({ tellSid }) }
      });
      askSid(tellSid);
    }).catch((err) => {
      setStatus(err.message);
    });
  }
}

async function startTalk() {
  if (peer) return;
  talkButton.disabled = true;
  setStatus("Calling Sid...");
  if (navigator.audioSession) navigator.audioSession.type = "playback";

  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    talkButton.disabled = false;
    setStatus("The phone needs the microphone for Sid to hear Max.");
    return;
  }

  peer = new RTCPeerConnection();
  audio = new Audio();
  audio.autoplay = true;
  peer.ontrack = (e) => { audio.srcObject = e.streams[0]; };
  peer.addTrack(mic.getTracks()[0]);
  events = peer.createDataChannel("oai-events");
  events.addEventListener("message", onEvent);
  let greeting = "There is no game yet. Say hi to Max in one short sentence and ask what he wants to make. Do not offer a ready-made game.";
  events.addEventListener("open", () => {
    talkButton.textContent = "Bye, Sid";
    talkButton.classList.add("live");
    talkButton.disabled = false;
    quietButton.classList.remove("hidden");
    setStatus("Sid is listening");
    askSid(greeting);
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
    const { data } = await api({
      action: "session",
      sdp: peer.localDescription.sdp,
      designId: design?.id || ""
    });
    if (!data.sdp) throw new Error(data.error || "Sid could not start.");
    if (data.design) rememberDesign(data.design);
    if (data.greeting) greeting = data.greeting;
    await peer.setRemoteDescription({ type: "answer", sdp: data.sdp });
  } catch (err) {
    stopTalk();
    if (err.status === 401) showUnlock("This phone needs the grown-up code again.");
    else setStatus(err.message);
    return;
  }

  talkStarted = Date.now();
  talkTimer = setTimeout(() => {
    stopTalk();
    setStatus("Break time. Tap Talk with Sid when you want more.");
  }, TALK_LIMIT_MS);
}

talkButton.addEventListener("click", () => {
  if (peer) stopTalk();
  else startTalk();
});

quietButton.addEventListener("click", () => {
  muted = !muted;
  mic?.getTracks().forEach((track) => { track.enabled = !muted; });
  quietButton.textContent = muted ? "Sid can listen" : "Quiet the mic";
  setStatus(muted ? "Mic is quiet" : "Sid is listening");
  if (muted) sendEvent({ type: "input_audio_buffer.clear" });
});

buildForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  buildNote.textContent = "Sending…";
  if (!design?.id) {
    buildNote.textContent = "Talk with Sid until the plan appears, then try again.";
    return;
  }
  try {
    const { data } = await api({
      action: "build",
      designId: design.id,
      parentCode: $("build-code").value
    });
    $("build-code").value = "";
    buildNote.replaceChildren();
    if (data.url) {
      const link = document.createElement("a");
      link.href = data.url;
      link.textContent = "Follow along";
      buildNote.append(
        data.already ? "Already building. " : "Cursor is building it. ",
        link,
        ". A grown-up reviews the pull request before it joins the games."
      );
    } else {
      buildNote.textContent = data.error || "Could not start.";
    }
  } catch (err) {
    buildNote.textContent = err.message;
  }
});

$("forget").addEventListener("click", () => {
  localStorage.removeItem(CODE_KEY);
  code = "";
  stopTalk();
  showUnlock("");
});

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  code = $("unlock-code").value;
  unlockError.hidden = true;
  try {
    await api({ action: "unlock" });
    localStorage.setItem(CODE_KEY, code);
    $("unlock-code").value = "";
    showStudio();
  } catch (err) {
    code = "";
    showUnlock(err.message);
  }
});

if (code) {
  showStudio();
  api({ action: "load", designId: design?.id || "" }).then(({ data }) => {
    if (data.design) rememberDesign(data.design);
  }).catch((err) => {
    if (err.status === 401) showUnlock("This phone needs the grown-up code again.");
  });
} else {
  showUnlock("");
}
