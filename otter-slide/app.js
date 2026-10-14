(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- content ----------
// Short a, o, i, u, then e (e and i sound alike, so they're kept apart). Within a vowel,
// words that start with a sound you can stretch (fff, mmm) come before ones that start with a stop (c, b).
const ORDER = [
  'fan', 'map', 'van', 'rat', 'cat', 'hat', 'bat', 'cap', 'can', 'bag', 'jam',
  'mop', 'log', 'fox', 'dog', 'pot', 'top', 'box',
  'fin', 'lip', 'six', 'zip', 'pig', 'wig', 'bib',
  'sun', 'nut', 'rug', 'bug', 'cup', 'bus', 'jug',
  'net', 'hen', 'web', 'bed', 'pen', 'ten', 'jet'
];
const LETTERS = 'abcdefghijlmnoprstuvwxz'.split('');
const START_WORDS = 4;
const KNOWN = 2;        // first-try streak that counts as "knows it": adds a new word, quiets the pads
const STAR = 3;         // first-try streak for a gold star (same bar as Joyce's "mastered")
const PER_RAFT = 5;
const MAX_LEVEL = 4;
const FRIEND_CHANCE = 1 / 7;
const FRIENDS = [
  { id: 'frog', name: 'A little frog' },
  { id: 'duck', name: 'A baby duck' },
  { id: 'turtle', name: 'A tiny turtle' },
  { id: 'dragonfly', name: 'A dragonfly' }
];
const PRAISE = ['You read it!', 'Splash!', 'Hooray!', 'Great reading!', 'Wheee!', 'You did it!'];
const OFF_SCREEN = [
  'Can you find something in your house that you read today?',
  'Can you slide on your tummy like an otter? Wheee!',
  'Can you say your name really slowly, like Pip slides?',
  'Can you tell someone a word you read today?',
  'Can you find a cup, or a hat, or a bed in your house?'
];

// ---------- saved progress (per child) ----------
const kid = window.MightyProgress?.currentKid() || { id: 'unknown', name: '' };
const STORE = `otterSlide.v1:${kid.id}`;
function defaults() {
  return {
    words: {},
    intro: ORDER.slice(0, START_WORDS),
    read: 0,
    friends: {},
    settings: { voice: true, sound: true, help: 'auto', pics: 'auto', words: 'auto' }
  };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.words) { const d = defaults(); return { ...d, ...s, settings: { ...d.settings, ...s.settings } }; }
  } catch (_) { /* fall through */ }
  return defaults();
}
let state = load();
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) { /* storage full or blocked */ } }
const rec = (w) => state.words[w] || (state.words[w] = { t: 0, r: 0, s: 0, n: 0, star: false });

// ---------- audio: letter sounds and words are recorded clips; effects are synthesized ----------
let actx = null, noiseBuf = null;
function ctx() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
const clips = {};
function loadClip(name) {
  const a = ctx();
  if (!a) return Promise.resolve();
  return fetch(`audio/${name}.wav`)
    .then((r) => r.arrayBuffer())
    .then((b) => new Promise((res, rej) => a.decodeAudioData(b, res, rej)))
    .then((buf) => { clips[name] = buf; })
    .catch(() => {});
}
// Letter sounds can't start closer together than this, so a fast swipe still says each one.
const SOUND_GAP = 0.13;
let lastStart = 0, lastGain = null;
function playClip(name, { at = 0, gap = 0, crossfade = false } = {}) {
  const a = ctx(), buf = clips[name];
  if (!a || !buf) return { start: 0, end: 0 };
  const t = Math.max(a.currentTime + 0.01 + at, gap ? lastStart + gap : 0);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = 1;
  src.connect(g).connect(a.destination);
  src.start(t);
  if (crossfade && lastGain) {
    lastGain.gain.setValueAtTime(lastGain.gain.value, t);
    lastGain.gain.linearRampToValueAtTime(0, t + 0.07);
  }
  if (gap || crossfade) { lastStart = t; lastGain = g; }
  return { start: t - a.currentTime, end: t - a.currentTime + buf.duration };
}
const playLetter = (L) => playClip(`s_${L}`, { gap: SOUND_GAP, crossfade: true });
const playWord = (w, at = 0) => playClip(`w_${w}`, { at });
// "c... a... t... cat!" for the treasure chest and the sound check.
function soundOut(w) {
  let at = 0;
  for (const L of w) { playClip(`s_${L}`, { at }); at += 0.55; }
  return playWord(w, at + 0.15).end;
}

function sfxOn() { return state.settings.sound ? ctx() : null; }
function tone(freq, dur, { type = 'sine', vol = 0.2, slideTo = null, delay = 0 } = {}) {
  const a = sfxOn(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, { freq = 1000, q = 1, vol = 0.2, type = 'bandpass', delay = 0, sweepTo = null } = {}) {
  const a = sfxOn(); if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 1, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + delay;
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination);
  s.start(t); s.stop(t + dur + 0.02);
}
const sfx = {
  bloop() { tone(420, 0.16, { vol: 0.14, slideTo: 760 }); },
  splash() { noise(0.55, { freq: 2400, q: 0.5, vol: 0.22, type: 'lowpass', sweepTo: 300 }); noise(0.2, { freq: 900, q: 1, vol: 0.18, delay: 0.05 }); },
  pop() { tone(380, 0.14, { vol: 0.22, slideTo: 1100 }); noise(0.05, { freq: 3000, q: 1, vol: 0.15 }); },
  boop() { tone(330, 0.2, { type: 'triangle', vol: 0.16, slideTo: 220 }); },
  whoosh() { noise(0.35, { freq: 700, q: 0.6, vol: 0.1 }); },
  sparkle() { [1568, 1976, 2349, 2637, 3136].forEach((f, i) => tone(f, 0.25, { vol: 0.06, delay: i * 0.06 })); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.7 : 0.22, { type: 'triangle', vol: 0.12, delay: i * 0.14 })); }
};

// ---------- speech ----------
const hasSpeech = 'speechSynthesis' in window;
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  for (const p of ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English']) {
    const v = vs.find((x) => x.name.startsWith(p));
    if (v) { voice = v; return; }
  }
  voice = vs.find((x) => /^en/i.test(x.lang)) || null;
}
if (hasSpeech) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
// Resolves when the sentence is done (or about when it should be, since some browsers skip onend).
function say(text, { queue = false } = {}) {
  if (!state.settings.voice || !hasSpeech) return Promise.resolve();
  if (!queue) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 0.85; u.pitch = 1.15;
  return new Promise((res) => {
    const done = () => { clearTimeout(timer); res(); };
    const timer = setTimeout(done, 1200 + text.length * 90);
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
  });
}
const hush = () => { if (hasSpeech) speechSynthesis.cancel(); };

// ---------- effects layer ----------
const fx = $('fx');
const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
const tf = (r, el) => `translate(${r.left}px, ${r.top}px) scale(${r.width / el._w})`;
function sprite(html, r, cls = '') {
  const el = document.createElement('div');
  el.className = `sprite ${cls}`;
  el.innerHTML = html;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
  el.style.transformOrigin = '0 0';
  el._w = r.width;
  el._rect = r;
  el.style.transform = tf(r, el);
  fx.appendChild(el);
  return el;
}
function flyTo(el, to, { duration = 600, arc = 0, easing = 'ease-in-out' } = {}) {
  const from = el._rect;
  const frames = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    frames.push({ transform: tf({
      left: from.left + (to.left - from.left) * t,
      top: from.top + (to.top - from.top) * t - arc * 4 * t * (1 - t),
      width: from.width + (to.width - from.width) * t
    }, el) });
  }
  el._rect = to;
  return el.animate(frames, { duration, easing, fill: 'forwards' }).finished;
}
function burst(x, y, { kinds = ['icon_heart'], count = 10, spread = 170, size = 44 } = {}) {
  for (let i = 0; i < count; i++) {
    const img = new Image();
    img.src = `art/${pick(kinds)}.png`;
    img.className = 'particle';
    img.style.width = img.style.height = `${size}px`;
    fx.appendChild(img);
    const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.7);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - spread * 0.5;
    const x0 = x - size / 2, y0 = y - size / 2;
    img.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.3)`, opacity: 1 },
      { transform: `translate(${x0 + dx * 0.7}px, ${y0 + dy * 0.7}px) scale(1.1) rotate(${rand(60) - 30}deg)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${x0 + dx}px, ${y0 + dy + 40}px) scale(.8)`, opacity: 0 }
    ], { duration: 1100 + rand(500), easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => img.remove());
  }
}
// Water droplets that jump up and fall back, plus a ripple ring.
function splashAt(x, y, { count = 14, height = 120, width = 160 } = {}) {
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'drop';
    fx.appendChild(d);
    const dx = (Math.random() - 0.5) * width, up = height * (0.5 + Math.random() * 0.6);
    const s = 0.6 + Math.random() * 0.8, rot = rand(360);
    d.animate([
      { transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${rot}deg)`, opacity: 1 },
      { transform: `translate(${x + dx * 0.6}px, ${y - up}px) scale(${s}) rotate(${rot}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x + dx}px, ${y + 20}px) scale(${s * 0.6}) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: 750 + rand(300), easing: 'cubic-bezier(.25,.8,.4,1)' }).finished.then(() => d.remove());
  }
  const ring = document.createElement('div');
  ring.className = 'ring';
  ring.style.width = `${width}px`; ring.style.height = `${width * 0.3}px`;
  fx.appendChild(ring);
  ring.animate([
    { transform: `translate(${x - width / 2}px, ${y - width * 0.15}px) scale(.3)`, opacity: 1 },
    { transform: `translate(${x - width / 2}px, ${y - width * 0.15}px) scale(1.4)`, opacity: 0 }
  ], { duration: 800, easing: 'ease-out' }).finished.then(() => ring.remove());
}
function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

// ---------- which words, how many pictures ----------
const pool = () => (state.settings.words === 'all' ? ORDER : state.intro);
const shared = (a, b) => [0, 1, 2].filter((i) => a[i] === b[i]).length;

// Add the next word once she knows all but one of the current ones.
function maybeIntroduce() {
  if (state.settings.words === 'all' || state.intro.length >= ORDER.length) return null;
  const known = state.intro.filter((w) => (state.words[w]?.s || 0) >= KNOWN).length;
  if (known < state.intro.length - 1) return null;
  const next = ORDER.find((w) => !state.intro.includes(w));
  state.intro.push(next);
  save();
  return next;
}
function weight(w) {
  const R = state.words[w];
  if (!R || !R.t) return 3;
  if (R.s === 0) return 4;
  if (R.s < KNOWN) return 3;
  if (R.s < STAR) return 2;
  return 1;
}
function pickTarget() {
  const all = pool();
  const avoid = session.recent.slice(0, all.length >= 6 ? 2 : 1);
  const list = all.filter((w) => !avoid.includes(w));
  const total = list.reduce((a, w) => a + weight(w), 0);
  let x = Math.random() * total;
  for (const w of list) { x -= weight(w); if (x < 0) return w; }
  return list[list.length - 1];
}
// Level 1: two very different pictures. Level 4: a near-twin (cat / cap) that only full blending tells apart.
function choiceCount(level) {
  const s = state.settings.pics;
  if (s !== 'auto') return Number(s);
  return level <= 1 ? 2 : 3;
}
function distractors(w, n, level) {
  const others = ORDER.filter((x) => x !== w);
  const known = new Set(pool());
  const out = [];
  const take = (want) => {
    const c = shuffle(others.filter((x) => !out.includes(x) && want(shared(w, x))));
    c.sort((a, b) => (known.has(b) ? 1 : 0) - (known.has(a) ? 1 : 0));
    if (c.length) out.push(c[0]);
    return c.length > 0;
  };
  if (level >= 4) take((s) => s === 2);
  if (level >= 3) take((s) => s === 1);
  while (out.length < n - 1) {
    if (!take((s) => s === 0) && !take((s) => s < 3)) break;
  }
  return out.slice(0, n - 1);
}
function helpOn(w) {
  const h = state.settings.help;
  if (h === 'always') return true;
  if (h === 'never') return false;
  return (state.words[w]?.s || 0) < KNOWN;
}

// ---------- the lane: Pip slides left to right over the lily pads ----------
const stage = $('stage');
const padsEl = $('pads');
const pipEl = $('pip');
const pipImg = pipEl.querySelector('img');
const choicesEl = $('choices');
const slotsEl = $('slots');
let lane = null;      // pixel positions inside the stage
let pipX = 0;

// Layout offsets, not on-screen boxes: the pads may still be mid float-in animation.
function offsetIn(el) {
  let left = 0, top = 0;
  for (let e = el; e && e !== stage; e = e.offsetParent) { left += e.offsetLeft; top += e.offsetTop; }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}
function measure() {
  const s = stage.getBoundingClientRect();
  const pads = [...padsEl.children].map(offsetIn);
  if (!pads.length) return;
  const pw = pipEl.offsetWidth, ph = pipEl.offsetHeight;
  const first = pads[0], last = pads[pads.length - 1];
  lane = {
    pads,
    centers: pads.map((p) => p.left + p.width / 2),
    y: first.top + first.height * 0.9,
    start: Math.max(6, first.left - pw * 0.95),
    end: Math.min(s.width - pw - 6, last.left + last.width - pw * 0.15),
    pw, ph
  };
}
function placePip(x) {
  pipX = x;
  pipEl.style.transform = `translate(${x}px, ${lane.y}px)`;
}
function setPose(pose) { pipImg.src = `art/pip_${pose}.png`; }
window.addEventListener('resize', () => {
  if (!round) return;
  const frac = lane ? (pipX - lane.start) / Math.max(1, lane.end - lane.start) : 0;
  measure();
  if (lane) placePip(lane.start + frac * (lane.end - lane.start));
});

// Called whenever Pip moves: light up and sound each pad as her middle passes it.
function movePip(x) {
  const r = round;
  if (!r || !lane) return;
  placePip(clamp(x, lane.start, lane.end));
  const mid = pipX + lane.pw * 0.62;
  lane.centers.forEach((c, i) => {
    const pad = padsEl.children[i];
    if (!r.passed[i] && mid >= c) {
      r.passed[i] = true;
      pad.classList.add('lit');
      replay(pad, 'boing');
      if (r.help || r.forceHelp) playLetter(r.w[i]);
      else sfx.bloop();
    } else if (r.passed[i] && mid < c - lane.pads[i].width * 0.35) {
      r.passed[i] = false;
      pad.classList.remove('lit');
    }
  });
  if (pipX >= lane.end - 1 && r.passed.every(Boolean)) finishSlide();
}

let drag = null, sliding = false;
pipEl.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  ctx();
  if (!round || round.locked || round.finishing || sliding || drag) return;
  drag = { id: e.pointerId, x0: e.clientX, pip0: pipX, moved: false };
  try { pipEl.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
});
pipEl.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0;
  if (!drag.moved) {
    if (Math.abs(dx) < 10) return;
    drag.moved = true;
    startSliding();
  }
  movePip(drag.pip0 + dx);
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  if (!round || round.locked) return;
  if (!d.moved) { autoSlide(); return; }
  // Let go near the end: Pip finishes the slide on her own.
  if (lane && (pipX - lane.start) / (lane.end - lane.start) > 0.8) autoSlide();
  else { setPose('sit'); armIdle(); }
};
pipEl.addEventListener('pointerup', endDrag);
pipEl.addEventListener('pointercancel', endDrag);

function startSliding() {
  disarmIdle();
  hush();
  pipEl.classList.remove('hint');
  pipEl.classList.add('sliding');
  setPose('slide');
  if (lane && pipX <= lane.start + 2) sfx.whoosh();
}

// Pip slides by herself: when tapped, after a wrong pick, or from the speaker button.
function autoSlide({ forceHelp = false, pxPerSec = null } = {}) {
  const r = round;
  if (!r || !lane || sliding || r.finishing) return Promise.resolve();
  if (forceHelp) r.forceHelp = true;
  sliding = true;
  startSliding();
  const gapPx = lane.centers[1] - lane.centers[0];
  const speed = pxPerSec || gapPx / 0.6;
  const from = pipX;
  if (from >= lane.end - 1) { r.passed = r.w.split('').map(() => false); placePip(lane.start); }
  const start = performance.now(), x0 = pipX;
  return new Promise((res) => {
    const step = (now) => {
      if (round !== r) { sliding = false; res(); return; }
      const x = x0 + ((now - start) / 1000) * speed;
      movePip(x);
      if (pipX >= lane.end - 1) { sliding = false; res(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

async function finishSlide() {
  const r = round;
  if (r.finishing) return;
  r.finishing = true;
  drag = null;
  const s = stage.getBoundingClientRect();
  sfx.splash();
  splashAt(s.left + pipX + lane.pw * 0.85, s.top + lane.y + lane.ph * 0.9, { width: lane.pw });
  pipEl.classList.remove('sliding');
  setPose('sit');
  replay(pipEl, 'hop');
  r.slides++;
  const first = r.phase === 'slide';
  if (first) {
    r.phase = 'pick';
    showChoices();
    promptRound();
  }
  await sleep(first ? 700 : 500);
  if (round !== r) return;
  // Pip swims back to the start so she can slide again.
  const back = pipEl.animate([
    { transform: `translate(${pipX}px, ${lane.y}px)` },
    { transform: `translate(${lane.start}px, ${lane.y}px) scale(.96)`, offset: 0.6 },
    { transform: `translate(${lane.start}px, ${lane.y}px)` }
  ], { duration: 650, easing: 'ease-in-out' });
  placePip(lane.start);
  await back.finished.catch(() => {});
  if (round !== r) return;
  [...padsEl.children].forEach((p) => p.classList.remove('lit'));
  r.passed = r.passed.map(() => false);
  r.forceHelp = false;
  r.finishing = false;
  armIdle();
}

// ---------- rounds ----------
let session = null;
let round = null;

function drawSlots() {
  slotsEl.innerHTML = '';
  for (let i = 0; i < PER_RAFT; i++) {
    const w = session?.words[i];
    const d = document.createElement('div');
    d.className = `slot${w ? ' full' : ''}`;
    d.innerHTML = w ? `<img src="art/${w}.png" alt="">` : '';
    slotsEl.appendChild(d);
  }
}

function startSession(intro = false) {
  session = { words: [], friends: [], level: pool().length >= 10 ? 2 : 1, run: 0, recent: [], told: false, intro };
  drawSlots();
  nextRound();
}

function nextRound() {
  const fresh = maybeIntroduce();
  const w = fresh || pickTarget();
  const seenVowels = new Set(state.intro.filter((x) => x !== fresh).map((x) => x[1]));
  const newVowel = fresh && !seenVowels.has(fresh[1]) ? fresh[1] : null;
  const level = fresh ? 1 : session.level;
  const n = choiceCount(level);
  const options = shuffle([w, ...distractors(w, n, level)]);
  round = {
    w, fresh: !!fresh, newVowel, level, options, help: helpOn(w), forceHelp: false,
    passed: [false, false, false], phase: 'slide', slides: 0, taps: 0, wrong: [],
    locked: true, idle: 0, finishing: false
  };
  session.recent = [w, ...session.recent];
  renderRound();
  promptRound();
  const r = round;
  setTimeout(() => { if (round === r) r.locked = false; }, 500);
  armIdle();
}

function renderRound() {
  const r = round;
  padsEl.innerHTML = '';
  choicesEl.innerHTML = '';
  r.w.split('').forEach((L, i) => {
    const pad = document.createElement('button');
    pad.className = `pad in${'aeiou'.includes(L) ? ' vowel' : ''}`;
    pad.style.animationDelay = `${0.1 + i * 0.15}s`;
    pad.setAttribute('aria-label', `Letter ${L}`);
    pad.innerHTML = `<img src="art/lilypad.png" alt=""><span class="letter">${L}</span>`;
    pad.addEventListener('animationend', () => { pad.classList.remove('in'); pad.style.animationDelay = ''; }, { once: true });
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      ctx();
      if (!round || sliding || drag) return;
      if (!round.help) round.taps++;
      playClip(`s_${L}`);
      replay(pad, 'boing');
      armIdle();
    });
    padsEl.appendChild(pad);
  });
  pipEl.classList.remove('sliding');
  setPose('sit');
  requestAnimationFrame(() => {
    measure();
    if (!lane) return;
    placePip(lane.start);
    pipEl.animate([{ opacity: 0, transform: `translate(${lane.start - 60}px, ${lane.y}px)` }, { opacity: 1, transform: `translate(${lane.start}px, ${lane.y}px)` }], { duration: 450, easing: 'ease-out' });
  });
  pipEl.classList.add('hint');
}

function showChoices() {
  const r = round;
  r.options.forEach((w, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice in';
    btn.dataset.word = w;
    btn.setAttribute('aria-label', 'Picture');
    btn.style.animationDelay = `${0.1 + i * 0.14}s`;
    btn.style.setProperty('--d', `${-Math.random() * 3}s`);
    btn.innerHTML = `<img src="art/${w}.png" alt="">`;
    btn.addEventListener('animationend', () => {
      btn.classList.remove('in');
      btn.style.animationDelay = '';
      btn.classList.add('idle');
    }, { once: true });
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); ctx(); choose(btn); });
    choicesEl.appendChild(btn);
  });
}

function promptRound(repeat = false) {
  const r = round;
  if (!r) return;
  let text;
  if (r.phase === 'slide') {
    if (r.newVowel && !repeat) text = 'Ooh, a new sound!';
    else if (r.fresh && !repeat) text = 'Ooh, a new word! Slide Pip to read it!';
    else if (!r.help) text = 'Your turn! Say the sounds as Pip slides.';
    else if (!session.told || repeat) text = 'Slide Pip across the lily pads, and listen to the sounds!';
    else text = pick(['Slide Pip!', 'Read with Pip!', 'Wheee! Slide Pip!']);
    session.told = true;
  } else {
    text = r.help || r.slides > 1 ? pick(['Say it fast! Which picture is it?', 'Say it fast! Which one?']) : 'What did you read?';
  }
  const said = say(text, { queue: session.intro });
  session.intro = false;
  if (r.newVowel && !repeat && r.phase === 'slide') {
    const L = r.newVowel;
    said.then(() => {
      if (round !== r) return;
      const pad = padsEl.children[1];
      replay(pad, 'boing');
      playClip(`s_${L}`);
      setTimeout(() => { if (round === r && r.phase === 'slide' && !sliding) say('Slide Pip to read the word!'); }, 700);
    });
  }
}

let idleTimer = null;
function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(onIdle, 9000); }
function disarmIdle() { clearTimeout(idleTimer); }
function onIdle() {
  if (!round || round.locked || sliding || drag || document.querySelector('.overlay.show')) return;
  if (++round.idle > 3) return;
  promptRound(true);
  if (round.phase === 'slide') pipEl.classList.add('hint');
  else replay(pipEl, 'wiggle');
  armIdle();
}

// ---------- picking a picture ----------
function choose(btn) {
  const r = round;
  if (!r || r.locked || r.phase !== 'pick' || sliding || btn.classList.contains('faded')) return;
  disarmIdle();
  if (btn.dataset.word === r.w) onRight(btn);
  else onWrong(btn);
}

async function onWrong(btn) {
  const r = round;
  const w = btn.dataset.word;
  if (!r.wrong.includes(w)) r.wrong.push(w);
  r.locked = true;
  sfx.boop();
  btn.classList.add('nope');
  btn.addEventListener('animationend', () => { btn.classList.remove('nope'); btn.classList.add('faded'); }, { once: true });
  hush();
  const said = playWord(w, 0.15);
  replay(pipEl, 'wiggle');
  const othersLeft = [...choicesEl.children].filter((b) => b !== btn && !b.classList.contains('faded') && b.dataset.word !== r.w);
  if (r.wrong.length >= 2 || !othersLeft.length) {
    [...choicesEl.children].find((b) => b.dataset.word === r.w)?.classList.add('glow');
  }
  await sleep((said.end + 0.3) * 1000);
  if (round !== r) return;
  await say('Listen again!');
  while (round === r && r.finishing) await sleep(100);
  if (round !== r) return;
  await autoSlide({ forceHelp: true });
  while (round === r && r.finishing) await sleep(100);
  if (round !== r) return;
  r.locked = false;
  armIdle();
}

async function onRight(btn) {
  const r = round;
  r.locked = true;
  hush();
  const first = r.wrong.length === 0;
  const R = rec(r.w);
  R.t++;
  if (first) { R.r++; R.s++; } else R.s = 0;
  const starNow = first && R.s >= STAR && !R.star;
  if (starNow) R.star = true;
  R.n++;
  state.read++;
  const friend = Math.random() < FRIEND_CHANCE ? pick(FRIENDS) : null;
  if (friend) state.friends[friend.id] = (state.friends[friend.id] || 0) + 1;
  save();

  window.MightyProgress?.log({
    game: 'otter-slide',
    skill: 'Blending CVC words',
    item: r.w,
    correct: first,
    extra: {
      vowel: r.w[1],
      choices: r.options.length,
      soundsPlayed: r.help,
      padTaps: r.taps || undefined,
      wrongPicks: r.wrong.length ? r.wrong.join(' ') : undefined,
      newWord: r.fresh || undefined
    }
  });

  if (first) {
    if (++session.run >= 2) { session.level = Math.min(MAX_LEVEL, session.level + 1); session.run = 0; }
  } else {
    session.level = Math.max(1, session.level - 1);
    session.run = 0;
  }

  const picEl = await reveal(btn);
  if (round !== r) { picEl.remove(); return; }
  if (friend) await friendVisit(friend);
  if (starNow) await goldStar(picEl);
  if (round !== r) { picEl.remove(); return; }
  session.words.push(r.w);
  await flyToSlot(picEl, session.words.length - 1);
  if (round !== r) return;
  if (session.words.length >= PER_RAFT) celebrate();
  else nextRound();
}

// The bubble pops, the picture floats up over the lily pads with its word, and Pip cheers.
async function reveal(btn) {
  const r = round;
  [...choicesEl.children].forEach((b) => { if (b !== btn) b.classList.add('gone'); });
  btn.classList.remove('glow', 'idle');
  const b = box(btn);
  const img = btn.querySelector('img');
  const pic = sprite(`<img src="art/${r.w}.png" alt="">`, box(img), 'pic-flyer');
  btn.classList.add('held');
  sfx.pop();
  burst(b.left + b.width / 2, b.top + b.height / 2, { kinds: ['icon_heart', 'icon_star'], count: 10, size: 36 });
  const s = stage.getBoundingClientRect();
  const c = choicesEl.getBoundingClientRect();
  const size = Math.min(c.height * 0.9, s.width * 0.26);
  const h = size * (box(img).height / box(img).width);
  const to = { left: s.left + s.width / 2 - size / 2, top: c.top + (c.height - h) / 2, width: size, height: h };
  pipEl.style.visibility = 'hidden';
  const pipCheer = sprite('<img src="art/pip_cheer.png" alt="">', (() => { const p = box(pipEl); const h = p.height * 1.15; return { left: p.left + p.width * 0.1, top: p.top + p.height - h, width: h * 423 / 520, height: h }; })());
  flyTo(pic, to, { duration: 600, arc: 40 });
  await sleep(350);
  [...padsEl.children].forEach((p, i) => setTimeout(() => { p.classList.add('lit'); replay(p, 'boing'); }, i * 90));
  const word = playWord(r.w, 0.05);
  pipCheer.querySelector('img').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14%)' }, { transform: 'translateY(0)' }], { duration: 500, iterations: 2 });
  await sleep(Math.max(350, word.end * 1000));
  if (round !== r) { pipCheer.remove(); return pic; }
  burst(to.left + size / 2, to.top + size / 2, { count: 10 });
  await say(`${pick(PRAISE)}`);
  await sleep(250);
  pipCheer.remove();
  pipEl.style.visibility = '';
  return pic;
}

async function friendVisit(friend) {
  const s = stage.getBoundingClientRect();
  const size = Math.min(s.height * 0.26, s.width * 0.18);
  const x = s.left + s.width * (0.12 + Math.random() * 0.1), y = s.top + s.height * 0.62;
  sfx.splash();
  sfx.sparkle();
  splashAt(x + size / 2, y + size * 0.9, { width: size * 1.2 });
  const el = sprite(`<img src="art/friend_${friend.id}.png" alt="">`, { left: x, top: y, width: size, height: size });
  el.querySelector('img').animate([{ transform: 'translateY(60%) scale(.3)', opacity: 0 }, { transform: 'translateY(-10%) scale(1.1)', opacity: 1 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
  session.friends.push(friend.id);
  await say(`${friend.name} came to play!`);
  await sleep(400);
  await el.animate([{ opacity: 1 }, { opacity: 0, transform: `${el.style.transform} translateY(40px)` }], { duration: 400, fill: 'forwards' }).finished;
  el.remove();
}

async function goldStar(picEl) {
  const r = picEl._rect;
  const size = r.width * 0.6;
  const star = sprite('<img src="art/icon_star.png" alt="">', { left: r.left + r.width - size * 0.6, top: r.top - size * 0.3, width: size, height: size });
  star.querySelector('img').animate(
    [{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1) rotate(0)' }],
    { duration: 700, easing: 'ease-out', fill: 'forwards' }
  );
  sfx.fanfare();
  burst(r.left + r.width / 2, r.top, { kinds: ['icon_star'], count: 14, size: 36 });
  await say('Gold star! You can really read that word!');
  star.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => star.remove());
}

async function flyToSlot(picEl, i) {
  const slot = slotsEl.children[i];
  const s = box(slot);
  const w = s.width * 0.76, h = w * picEl._rect.height / picEl._rect.width;
  await flyTo(picEl, { left: s.left + (s.width - w) / 2, top: s.top + (s.height - h) / 2, width: w, height: h }, { duration: 650, arc: 50 });
  picEl.remove();
  sfx.pop();
  slot.classList.add('full');
  slot.innerHTML = `<img src="art/${session.words[i]}.png" alt="">`;
}

// ---------- end of a raft of five ----------
function celebrate() {
  round = null;
  disarmIdle();
  const words = session.words.map((w) => `<figure><img src="art/${w}.png" alt=""><figcaption>${w}</figcaption></figure>`);
  const friends = session.friends.map((f) => `<figure class="friend"><img src="art/friend_${f}.png" alt=""><figcaption>new friend!</figcaption></figure>`);
  $('yayWords').innerHTML = words.concat(friends).join('');
  $('yay').classList.add('show');
  sfx.fanfare();
  const W = window.innerWidth, H = window.innerHeight;
  burst(W * 0.3, H * 0.5, { kinds: ['icon_star', 'icon_heart'], count: 14, spread: 260 });
  setTimeout(() => burst(W * 0.7, H * 0.5, { kinds: ['icon_star', 'icon_heart'], count: 14, spread: 260 }), 300);
  say('Splash party! You read five words!');
  say(pick(OFF_SCREEN), { queue: true });
}
$('againBtn').addEventListener('click', () => {
  ctx();
  $('yay').classList.remove('show');
  startSession();
});
$('yayChestBtn').addEventListener('click', () => { ctx(); openChest(); });

// ---------- Pip's treasure chest ----------
const chestEl = $('chest');
function openChest() {
  disarmIdle();
  hush();
  const grid = $('chestGrid');
  grid.innerHTML = '';
  const open = pool();
  let count = 0;
  for (const w of ORDER) {
    const R = state.words[w];
    const found = R && R.n > 0;
    if (found) count++;
    const card = document.createElement('button');
    card.className = `word-card${found ? '' : open.includes(w) ? ' empty' : ' locked'}`;
    card.setAttribute('aria-label', found || open.includes(w) ? w : 'Not found yet');
    card.innerHTML = `<img class="pic" src="art/${w}.png" alt=""><div class="word">${w}</div>`
      + (R?.star ? '<img class="star" src="art/icon_star.png" alt="">' : '');
    card.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      ctx();
      replay(card, 'bounce');
      if (found || open.includes(w)) { hush(); soundOut(w); }
      else say('Keep reading to find this one!');
    });
    grid.appendChild(card);
  }
  $('chestCount').innerHTML = `<img src="art/icon_chest.png" alt=""> ${count} / ${ORDER.length}`;
  $('friendRow').innerHTML = FRIENDS.map((f) => {
    const n = state.friends[f.id] || 0;
    return `<button class="friend-chip${n ? '' : ' missing'}" data-id="${f.id}" aria-label="${n ? f.name : 'A friend you haven\'t met yet'}"><img src="art/friend_${f.id}.png" alt="">${n ? `<b>${n}</b>` : ''}</button>`;
  }).join('');
  chestEl.classList.add('show');
  say(count ? 'Look at all the words you read!' : 'Read words to fill Pip\'s treasure chest!');
}
$('friendRow').addEventListener('pointerdown', (e) => {
  const chip = e.target.closest('.friend-chip');
  if (!chip) return;
  e.preventDefault();
  const f = FRIENDS.find((x) => x.id === chip.dataset.id);
  say(state.friends[f.id] ? `${f.name}!` : 'Who could this be? Keep reading to find out!');
});
$('chestBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); ctx(); if (round && !round.locked && !sliding) openChest(); });
$('chestBack').addEventListener('click', () => {
  chestEl.classList.remove('show');
  hush();
  if (round && !$('yay').classList.contains('show')) { promptRound(true); armIdle(); }
});
$('sayBtn').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  ctx();
  if (!round || round.locked || sliding || round.finishing) return;
  if (round.phase === 'pick') {
    hush();
    const r = round;
    r.locked = true;
    autoSlide({ forceHelp: true }).then(async () => {
      while (round === r && r.finishing) await sleep(100);
      if (round === r) r.locked = false;
    });
  } else promptRound(true);
  armIdle();
});

// ---------- grown-up panel ----------
const gear = $('gear');
const parentEl = $('parent');
let gearTimer = null;
gear.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  gear.classList.add('holding');
  gearTimer = setTimeout(() => { gear.classList.remove('holding'); openParent(); }, 800);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => gear.addEventListener(ev, () => { clearTimeout(gearTimer); gear.classList.remove('holding'); }));
function openParent() {
  disarmIdle();
  hush();
  syncSettingsUI();
  const st = $('status');
  st.innerHTML = '';
  let tries = 0, right = 0;
  for (const w of ORDER) {
    const R = state.words[w];
    const sp = document.createElement('span');
    sp.textContent = w;
    if (R?.t) {
      tries += R.t;
      right += R.r;
      sp.className = R.s >= STAR ? 'star' : R.s >= KNOWN ? 'known' : 'trying';
      sp.title = `${R.r} of ${R.t} right on the first try`;
    }
    st.appendChild(sp);
  }
  const pct = tries ? Math.round((right / tries) * 100) : 0;
  $('statusNote').textContent = `${state.read} words read${tries ? `, ${pct}% right on the first try` : ''}. ${pool().length} of ${ORDER.length} words in play. `
    + 'Gold: right the last 3 times. Green: last 2 (pads go quiet). Orange: still practicing. Gray: not tried yet.';
  parentEl.classList.add('show');
}
$('soundCheck').innerHTML = LETTERS.map((L) => `<button data-l="${L}">${L}</button>`).join('');
$('soundCheck').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) playClip(`s_${b.dataset.l}`);
});
function syncSettingsUI() {
  document.querySelectorAll('.seg[data-setting]').forEach((seg) => {
    const k = seg.dataset.setting;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(state.settings[k]) === b.dataset.v));
  });
}
document.querySelectorAll('.seg[data-setting]').forEach((seg) => {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const v = b.dataset.v;
    state.settings[seg.dataset.setting] = v === 'true' ? true : v === 'false' ? false : v;
    if (!state.settings.voice) hush();
    if (round && seg.dataset.setting === 'help') round.help = helpOn(round.w);
    syncSettingsUI();
    save();
  });
});
$('closeParent').addEventListener('click', () => {
  parentEl.classList.remove('show');
  if (round && !round.locked) armIdle();
});
$('fullBtn').addEventListener('click', () => {
  const el = document.documentElement;
  (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  parentEl.classList.remove('show');
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Erase words read and friends found on this tablet? (Joyce keeps her records.)')) return;
  const settings = state.settings;
  state = defaults();
  state.settings = settings;
  save();
  parentEl.classList.remove('show');
  fx.innerHTML = '';
  $('yay').classList.remove('show');
  if (session) startSession();
});

// ---------- start ----------
if (kid.id !== 'unknown' && kid.name) $('title').textContent = `${kid.name}'s Otter Slide`;
$('startBtn').addEventListener('click', () => {
  ctx();
  $('splash').classList.remove('show');
  sfx.splash();
  say('Pip loves to slide! Help her read the words on the lily pads!');
  startSession(true);
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); });

const PRELOAD = [
  'pip_sit', 'pip_slide', 'pip_cheer', 'lilypad', 'icon_heart', 'icon_star',
  ...FRIENDS.map((f) => `friend_${f.id}`), ...ORDER
];
Promise.all([
  ...PRELOAD.map((n) => new Promise((res) => { const img = new Image(); img.onload = img.onerror = res; img.src = `art/${n}.png`; })),
  ...LETTERS.map((L) => loadClip(`s_${L}`)),
  ...ORDER.map((w) => loadClip(`w_${w}`)),
  document.fonts?.load('700 40px Andika').catch(() => {})
]).then(() => { $('startBtn').disabled = false; });
drawSlots();

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
