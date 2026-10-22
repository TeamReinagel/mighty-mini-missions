(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lower = (L) => L.toLowerCase();

// ---------- content ----------
// Letters that look the same big and little come first; look-alike lowercase (b d p q) come last.
const ORDER = 'COSXZWVUKPTMAEFHIJYLNRGBDQ'.split('');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const START_LETTERS = 4;
const KNOWN = 2;        // first-try streak that counts as "knows it" before adding a new letter
const STAR = 3;         // first-try streak for a gold star (same bar as Joyce's "mastered")
const PER_NEST = 5;
const FLIP_AFTER = 8;   // hatches before "Find Mama" rounds start appearing
const RARE_CHANCE = 1 / 7;
const LOOKALIKES = {
  a: 'oed', b: 'dpq', c: 'oe', d: 'bpq', e: 'ac', f: 't', g: 'qy', h: 'nb', i: 'lj', j: 'ig', k: 'hx',
  l: 'it', m: 'nw', n: 'muh', o: 'ca', p: 'qbd', q: 'pdg', r: 'n', s: 'z', t: 'fl', u: 'nv', v: 'uwy',
  w: 'vm', x: 'k', y: 'vg', z: 's'
};
const MAMAS = [
  { id: 'blue', name: 'Mama Bluebell', color: '#5aa9e6' },
  { id: 'pink', name: 'Mama Rosie', color: '#f48fb1' },
  { id: 'yellow', name: 'Mama Sunny', color: '#f6c445' },
  { id: 'green', name: 'Mama Minty', color: '#6cc59a' }
];
const EGGS = ['blue', 'pink', 'yellow', 'mint'];
const RARES = [
  { id: 'owl', name: 'A baby owl' },
  { id: 'penguin', name: 'A baby penguin' },
  { id: 'rainbow', name: 'A rainbow baby' }
];
const PRAISE = ['Yay!', 'Hooray!', 'You did it!', 'Peep peep!', 'Great matching!', 'Hatched!'];
const OFF_SCREEN = [
  'Can you find a big letter and a little letter in a book?',
  'Can you find the first letter of your name somewhere in your house?',
  'Can you draw a big letter and a little letter in the air with your finger?',
  'Can you flap your wings like a baby bird? Flap, flap, flap!',
  'Can you find a letter on a box in the kitchen?'
];
// Letters are spoken from their capital form. The tablet voice needs help: "a" reads as "uh" and
// "ay" as "eye" ("A." reads as an initial), and a lone "V" reads as "versus". Kokoro says all 26
// capitals as letter names, and the respellings would add a pause.
const SPOKEN = { A: 'A.', V: 'vee' };
const speak = (L) => (useNatural() ? L.toUpperCase() : SPOKEN[L.toUpperCase()] || L.toUpperCase());

// ---------- saved progress (per child) ----------
const kid = window.MightyProgress?.currentKid() || { id: 'unknown', name: '' };
const STORE = `hatchMatch.v1:${kid.id}`;
function markSkillReady(flag) {
  if (!kid.id || kid.id === "unknown") return;
  let all = {};
  try { all = JSON.parse(localStorage.getItem("mighty-ready.v1") || "{}"); } catch { all = {}; }
  all[kid.id] = { ...(all[kid.id] || {}), [flag]: true };
  localStorage.setItem("mighty-ready.v1", JSON.stringify(all));
}
function defaults() {
  return {
    letters: {},
    intro: ORDER.slice(0, START_LETTERS),
    hatched: 0,
    rares: {},
    settings: { voice: true, natural: true, sound: true, eggs: 'auto', letters: 'auto', flip: true }
  };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.letters) { const d = defaults(); return { ...d, ...s, settings: { ...d.settings, ...s.settings } }; }
  } catch (_) { /* fall through */ }
  return defaults();
}
let state = load();
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (_) { /* storage full or blocked */ } }
const rec = (L) => state.letters[L] || (state.letters[L] = { t: 0, r: 0, s: 0, n: 0, baby: null, star: false });

// ---------- audio ----------
let actx = null, noiseBuf = null;
function audio() {
  if (!state.settings.sound) return null;
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, dur, { type = 'sine', vol = 0.2, slideTo = null, delay = 0 } = {}) {
  const a = audio(); if (!a) return;
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
function noise(dur, { freq = 1000, q = 1, vol = 0.2, type = 'bandpass', delay = 0 } = {}) {
  const a = audio(); if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + delay;
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(a.destination);
  s.start(t); s.stop(t + dur + 0.02);
}
const sfx = {
  chirp() {
    tone(2300, 0.09, { slideTo: 3400, vol: 0.1 });
    tone(2600, 0.1, { slideTo: 3800, vol: 0.1, delay: 0.13 });
    tone(2400, 0.14, { slideTo: 3100, vol: 0.08, delay: 0.27 });
  },
  crack() { noise(0.06, { freq: 3200, q: 1.2, vol: 0.4, type: 'highpass' }); noise(0.04, { freq: 2000, q: 2, vol: 0.25, delay: 0.07 }); },
  pop() { tone(380, 0.14, { vol: 0.22, slideTo: 1000 }); },
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
function utter(text) {
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 0.85; u.pitch = 1.15;
  speechSynthesis.speak(u);
  return u;
}
// Kokoro (tts/voice.js) speaks once its model is downloaded and warm; until then, and for any
// sentence it can't produce, the tablet voice does.
const natural = window.HatchVoice || null;
function useNatural() { return !!natural && state.settings.natural && natural.ready(); }
natural?.init({
  enabled: state.settings.natural,
  fallback: (text) => new Promise((res) => {
    if (!hasSpeech) { res(); return; }
    const u = utter(text);
    u.onend = u.onerror = res;
    setTimeout(res, 6000);
  })
});
function say(text, { queue = false } = {}) {
  if (!state.settings.voice) return;
  if (useNatural()) {
    if (!queue && hasSpeech) speechSynthesis.cancel();
    natural.say(text, { queue });
    return;
  }
  if (!hasSpeech) return;
  if (!queue) { natural?.hush(); speechSynthesis.cancel(); }
  utter(text);
}
const hush = () => { natural?.hush(); if (hasSpeech) speechSynthesis.cancel(); };
// Resolves once the voice has finished, so the next prompt doesn't cut it off.
function speechDone(maxMs = 5000) {
  if (!state.settings.voice) return Promise.resolve();
  if (natural?.speaking()) return natural.done(maxMs + 2000);
  if (!hasSpeech) return Promise.resolve();
  const t0 = Date.now();
  return new Promise((res) => {
    const tick = () => {
      if ((!speechSynthesis.speaking && !speechSynthesis.pending) || Date.now() - t0 > maxMs) res();
      else setTimeout(tick, 120);
    };
    tick();
  });
}

// ---------- effects layer ----------
const fx = $('fx');
const box = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
const tf = (r, el) => `translate(${r.left}px, ${r.top}px) scale(${r.width / el._w})`;

// A positioned element in the effects layer that can fly between screen rectangles.
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
function eggSprite(btn) {
  const fs = getComputedStyle(btn.querySelector('.letter')).fontSize;
  return sprite(
    `<div class="inner"><img src="${btn.querySelector('img').getAttribute('src')}" alt=""><div class="letter" style="font-size:${fs}">${btn.dataset.letter}</div></div>`,
    box(btn), 'egg-flyer'
  );
}
function babySprite(baby, r) {
  return sprite(`<div class="inner"><img src="art/baby_${baby}.png" alt=""></div>`, r, 'baby-flyer');
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
function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

// ---------- which letters, how many eggs ----------
const pool = () => (state.settings.letters === 'all' ? ORDER : state.intro);

// Add the next letter once she knows all but one of the current ones.
function maybeIntroduce() {
  if (state.settings.letters === 'all' || state.intro.length >= ORDER.length) return null;
  const known = state.intro.filter((L) => (state.letters[L]?.s || 0) >= KNOWN).length;
  if (known < state.intro.length - 1) return null;
  const next = ORDER.find((L) => !state.intro.includes(L));
  state.intro.push(next);
  save();
  return next;
}
function weight(L) {
  const R = state.letters[L];
  if (!R || !R.t) return 3;
  if (R.s === 0) return 4;
  if (R.s < KNOWN) return 3;
  if (R.s < STAR) return 2;
  return 1;
}
function pickTarget() {
  const all = pool();
  const avoid = session.recent.slice(0, all.length >= 6 ? 2 : 1);
  const list = all.filter((L) => !avoid.includes(L));
  const total = list.reduce((a, L) => a + weight(L), 0);
  let x = Math.random() * total;
  for (const L of list) { x -= weight(L); if (x < 0) return L; }
  return list[list.length - 1];
}
const maxChoices = () => (pool().length >= 8 ? 4 : 3);
function choiceCount(fresh) {
  const s = state.settings.eggs;
  if (s !== 'auto') return Number(s);
  if (fresh) return 2;
  return Math.min(session.level, maxChoices());
}
// Wrong answers come from letters she's practicing; one look-alike joins once she's matched the target before.
function distractors(T, n) {
  const t = lower(T);
  const out = [];
  if (n >= 3 && (state.letters[T]?.s || 0) >= 1) {
    const look = (LOOKALIKES[t] || '').split('');
    if (look.length) out.push(pick(look));
  }
  const fill = (letters) => shuffle(letters.map(lower)).forEach((c) => { if (c !== t && !out.includes(c)) out.push(c); });
  fill(pool());
  if (out.length < n - 1) fill(ORDER);
  return out.slice(0, n - 1);
}

// ---------- rounds ----------
const topEl = $('top');
const choicesEl = $('choices');
const slotsEl = $('slots');
let session = null;
let round = null;

function drawSlots() {
  slotsEl.innerHTML = '';
  for (let i = 0; i < PER_NEST; i++) {
    const b = session?.babies[i];
    const d = document.createElement('div');
    d.className = `slot${b ? ' full' : ''}`;
    d.innerHTML = `<img src="art/${b ? `baby_${b}` : 'nest_empty'}.png" alt="">`;
    slotsEl.appendChild(d);
  }
}

function startSession(intro = false) {
  session = { babies: [], level: pool().length >= 8 ? 3 : 2, run: 0, recent: [], told: false, intro };
  drawSlots();
  nextRound();
}

function nextRound() {
  const fresh = maybeIntroduce();
  const T = fresh || pickTarget();
  const flip = !fresh && state.settings.flip && state.hatched >= FLIP_AFTER && (state.letters[T]?.t || 0) > 0 && Math.random() < 0.25;
  const n = choiceCount(!!fresh);
  const answer = flip ? T : lower(T);
  const options = shuffle([answer, ...distractors(T, n).map((c) => (flip ? c.toUpperCase() : c))]);
  const mama = pick(MAMAS.filter((m) => m.id !== round?.mama?.id));
  round = { T, flip, fresh: !!fresh, answer, options, mama, lostBaby: pick(MAMAS).id, wrong: [], locked: true, idle: 0, praise: pick(PRAISE) };
  session.recent = [T, ...session.recent];
  renderRound();
  promptRound();
  if (useNatural()) {
    natural.prepare(roundPhrases(round));
    if (fresh) natural.prepare(letterPhrases([fresh]), 'idle');
  }
  const r = round;
  setTimeout(() => { if (round === r) r.locked = false; }, 450);
  armIdle();
}

// What this round may say after the prompt, so Kokoro can generate it before she taps.
function roundPhrases(r) {
  const s = speak(r.T);
  const out = [];
  if (r.flip) {
    out.push(`Little ${s}!`, `Find Mama big ${s}!`, `${r.praise} Big ${s}, little ${s}! Together again!`);
    r.options.filter((o) => o !== r.answer).forEach((o) => out.push(`That's Mama big ${speak(o)}.`));
  } else {
    out.push(`Big ${s}!`, `Find little ${s}!`, `${r.praise} Big ${s}, little ${s}!`);
    r.options.filter((o) => o !== r.answer).forEach((o) => out.push(`That's little ${speak(o)}.`));
  }
  const R = state.letters[r.T];
  if (R && R.s === STAR - 1 && !R.star) out.push(`Gold star! You know big ${s} and little ${s}!`);
  return out;
}
// Sentences worth keeping for the letters in play; generated once in the background and saved.
// Ordered by kind across all letters, most-used kinds first, so every letter's prompts come early.
const LETTER_LINES = [
  (s) => [`Find little ${s}!`, `Where is little ${s}?`],
  (s) => [`Which egg is little ${s}?`, `That's little ${s}.`, `Big ${s}, little ${s}!`],
  (s) => MAMAS.flatMap((m) => [`${m.name} has big ${s}.`, `${m.name} wants little ${s}!`]),
  (s) => [`Big ${s}!`, `Little ${s}!`, `This is big ${s}.`, `Find Mama big ${s}!`, `That's Mama big ${s}.`]
];
const letterPhrases = (letters) => LETTER_LINES.flatMap((kind) => letters.flatMap((L) => kind(speak(L))));
const FIXED_PHRASES = [
  'Help the mama birds find their babies!', 'Hooray! All five babies hatched!', 'Ooh, a new egg!',
  'Look at all your babies!', 'Hatch eggs to fill the tree!', ...PRAISE, ...OFF_SCREEN,
  ...RARES.map((x) => `Wow! ${x.name}!`)
];

function renderRound() {
  const r = round;
  topEl.innerHTML = '';
  choicesEl.innerHTML = '';
  if (!r.flip) {
    const m = document.createElement('button');
    m.className = 'mama enter';
    m.id = 'mamaEl';
    m.setAttribute('aria-label', `${r.mama.name}, big ${r.T}`);
    m.innerHTML = `<img src="art/mama_${r.mama.id}.png" alt=""><div class="badge" style="--ring:${r.mama.color}"><span>${r.T}</span></div>`;
    m.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); say(`Big ${speak(r.T)}!`); replay(m, 'wiggle'); });
    topEl.appendChild(m);
  } else {
    const b = document.createElement('button');
    b.className = 'lost enter';
    b.id = 'lostEl';
    b.setAttribute('aria-label', `Baby, little ${lower(r.T)}`);
    b.innerHTML = `<img src="art/baby_${r.lostBaby}.png" alt=""><div class="badge"><span>${lower(r.T)}</span></div>`;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); sfx.chirp(); say(`Little ${speak(r.T)}!`); });
    topEl.appendChild(b);
  }
  const eggColors = shuffle(EGGS);
  const moms = shuffle(MAMAS);
  r.options.forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = `choice ${r.flip ? 'mom' : 'egg'} in`;
    btn.dataset.letter = letter;
    btn.style.animationDelay = `${0.1 + i * 0.12}s`;
    btn.style.setProperty('--d', `${-Math.random() * 3}s`);
    if (!r.flip) {
      btn.setAttribute('aria-label', `Egg, little ${letter}`);
      btn.innerHTML = `<img src="art/egg_${eggColors[i % EGGS.length]}.png" alt=""><div class="letter">${letter}</div>`;
    } else {
      const m = moms[i % moms.length];
      btn.setAttribute('aria-label', `${m.name}, big ${letter}`);
      btn.innerHTML = `<img src="art/mama_${m.id}.png" alt=""><div class="badge" style="--ring:${m.color}"><span>${letter}</span></div>`;
    }
    btn.addEventListener('animationend', () => {
      btn.classList.remove('in');
      btn.style.animationDelay = '';
      btn.classList.add('idle');
    }, { once: true });
    attachInput(btn);
    choicesEl.appendChild(btn);
  });
}

function promptRound(repeat = false) {
  const r = round;
  if (!r) return;
  const s = speak(r.T);
  let text;
  if (r.flip) text = `Little ${s} is lost! Where is Mama big ${s}?`;
  else if (r.fresh && !repeat) text = `Ooh, a new egg! This is big ${s}. Find little ${s}!`;
  else if (!session.told || repeat) text = `${r.mama.name} has big ${s}. Which egg is little ${s}?`;
  else text = pick([`Find little ${s}!`, `Where is little ${s}?`, `${r.mama.name} wants little ${s}!`]);
  session.told = true;
  say(text, { queue: session.intro });
  session.intro = false;
}

let idleTimer = null;
function armIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(onIdle, 9000); }
function disarmIdle() { clearTimeout(idleTimer); }
function onIdle() {
  if (!round || round.locked || document.querySelector('.overlay.show')) return;
  if (++round.idle > 3) return;
  promptRound(true);
  const who = $('mamaEl') || $('lostEl');
  if (who) replay(who, 'wiggle');
  armIdle();
}

// ---------- input: tap, or drag an egg into the nest ----------
let drag = null;
function overNest(x, y) {
  const m = $('mamaEl');
  if (!m) return false;
  const r = m.getBoundingClientRect(), pad = r.width * 0.15;
  return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
}
function attachInput(btn) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio();
    if (!round || round.locked || drag || btn.classList.contains('faded')) return;
    drag = { btn, id: e.pointerId, x: e.clientX, y: e.clientY, r0: box(btn), ghost: null };
    try { btn.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
  });
  btn.addEventListener('pointermove', (e) => {
    if (!drag || drag.btn !== btn || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.ghost) {
      if (round.flip || round.locked || Math.hypot(dx, dy) < 14) return;
      drag.ghost = eggSprite(btn);
      btn.classList.add('held');
    }
    const r = { left: drag.r0.left + dx, top: drag.r0.top + dy, width: drag.r0.width, height: drag.r0.height };
    drag.ghost._rect = r;
    drag.ghost.style.transform = tf(r, drag.ghost);
  });
  const end = (e) => {
    if (!drag || drag.btn !== btn || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.ghost) { if (e.type === 'pointerup') choose(btn, null); return; }
    const over = e.type === 'pointerup' && overNest(e.clientX, e.clientY);
    if (over && round && !round.locked && btn.dataset.letter === round.answer) { choose(btn, d.ghost); return; }
    flyTo(d.ghost, d.r0, { duration: 280 }).then(() => { d.ghost.remove(); btn.classList.remove('held'); });
    if (over) choose(btn, null);
  };
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointercancel', end);
}

function choose(btn, ghost) {
  const r = round;
  if (!r || r.locked || btn.classList.contains('faded')) return;
  disarmIdle();
  if (btn.dataset.letter === r.answer) onRight(btn, ghost);
  else onWrong(btn);
}

function onWrong(btn) {
  const r = round;
  const L = btn.dataset.letter;
  if (!r.wrong.includes(L)) r.wrong.push(L);
  sfx.boop();
  btn.classList.add('nope');
  btn.addEventListener('animationend', () => { btn.classList.remove('nope'); btn.classList.add('faded'); }, { once: true });
  say(r.flip ? `That's Mama big ${speak(L)}.` : `That's little ${speak(L)}.`);
  say(r.flip ? `Find Mama big ${speak(r.T)}!` : `Find little ${speak(r.T)}!`, { queue: true });
  const who = $('mamaEl') || $('lostEl');
  if (who) replay(who, 'wiggle');
  const othersLeft = [...choicesEl.children].filter((b) => b !== btn && !b.classList.contains('faded') && b.dataset.letter !== r.answer);
  if (r.wrong.length >= 2 || !othersLeft.length) {
    const right = [...choicesEl.children].find((b) => b.dataset.letter === r.answer);
    right?.classList.add('glow');
  }
  armIdle();
}

async function onRight(btn, ghost) {
  const r = round;
  r.locked = true;
  const first = r.wrong.length === 0;
  const R = rec(r.T);
  R.t++;
  if (first) { R.r++; R.s++; } else R.s = 0;
  const starNow = first && R.s >= STAR && !R.star;
  if (starNow) {
    R.star = true;
    markSkillReady("letters");
  }
  const rare = !r.flip && Math.random() < RARE_CHANCE ? pick(RARES) : null;
  const baby = rare ? rare.id : (r.flip ? r.lostBaby : r.mama.id);
  R.baby = baby;
  R.n++;
  state.hatched++;
  if (rare) state.rares[rare.id] = (state.rares[rare.id] || 0) + 1;
  save();

  window.MightyProgress?.log({
    game: 'hatch-match',
    skill: 'Big & little letters',
    item: r.T + lower(r.T),
    correct: first,
    extra: {
      direction: r.flip ? 'little-to-big' : 'big-to-little',
      choices: r.options.length,
      wrongPicks: r.wrong.length ? r.wrong.join(' ') : undefined,
      newLetter: r.fresh || undefined
    }
  });

  if (first) {
    if (++session.run >= 2) { session.level = Math.min(maxChoices(), session.level + 1); session.run = 0; }
  } else {
    session.level = Math.max(2, session.level - 1);
    session.run = 0;
  }

  [...choicesEl.children].forEach((b) => { if (b !== btn) b.classList.add('gone'); });
  btn.classList.remove('glow');
  const babyEl = r.flip ? await reunite(btn) : await hatch(btn, ghost, baby, rare);
  if (starNow) await goldStar(babyEl);
  if (round !== r) { babyEl.remove(); return; }
  session.babies.push(baby);
  await flyToSlot(babyEl, session.babies.length - 1);
  await speechDone();
  if (round !== r) return;
  if (session.babies.length >= PER_NEST) celebrate();
  else nextRound();
}

async function hatch(btn, ghost, baby, rare) {
  const r = round;
  const mamaEl = $('mamaEl');
  btn.classList.add('held');
  const egg = ghost || eggSprite(btn);
  const m = box(mamaEl);
  // Land beside Mama on the nest rim so her face and the big letter stay in view.
  const w = m.width * 0.22, h = w * egg._rect.height / egg._rect.width;
  const to = { left: m.left + m.width * 0.79 - w / 2, top: m.top + m.height * 0.6 - h / 2, width: w, height: h };
  sfx.whoosh();
  await flyTo(egg, to, { duration: 650, arc: ghost ? 30 : 90 });
  const inner = egg.querySelector('.inner');
  const wobble = [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(12deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(0)' }];
  sfx.crack();
  await inner.animate(wobble, { duration: 560, easing: 'ease-in-out' }).finished;
  sfx.crack();
  await inner.animate(wobble, { duration: 420, easing: 'ease-in-out' }).finished;

  const cx = to.left + w / 2;
  const bw = m.width * 0.34, bh = bw * 360 / 283;
  const babyEl = babySprite(baby, { left: cx - bw / 2, top: to.top + h - bh * 0.95, width: bw, height: bh });
  const shell = sprite('<img src="art/shell_top.png" alt="">', { left: cx - w * 0.5, top: to.top - h * 0.1, width: w, height: w * 209 / 240 });
  egg.remove();
  sfx.pop();
  sfx.chirp();
  if (rare) sfx.sparkle();
  babyEl.querySelector('.inner').animate(
    [{ transform: 'scale(.3)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
    { duration: 520, easing: 'ease-out' }
  );
  shell.animate([
    { transform: tf(shell._rect, shell), opacity: 1 },
    { transform: `${tf({ ...shell._rect, left: shell._rect.left + w * 1.6, top: shell._rect.top - h * 1.4 }, shell)} rotate(70deg)`, opacity: 0 }
  ], { duration: 800, easing: 'ease-out', fill: 'forwards' }).finished.then(() => shell.remove());
  burst(cx, to.top, { kinds: rare ? ['icon_star', 'icon_heart'] : ['icon_heart'], count: rare ? 18 : 10 });
  replay(mamaEl, 'happy');

  const s = speak(r.T);
  if (rare) say(`Wow! ${rare.name}! Big ${s}, little ${s}!`);
  else say(`${r.praise} Big ${s}, little ${s}!`);
  await sleep(rare ? 2200 : 1600);
  return babyEl;
}

async function reunite(btn) {
  const r = round;
  const lostEl = $('lostEl');
  const babyEl = babySprite(r.lostBaby, box(lostEl.querySelector('img')));
  lostEl.style.visibility = 'hidden';
  const t = box(btn);
  const w = t.width * 0.5, h = w * 360 / 283;
  const to = { left: t.left + t.width * 0.5 - w / 2, top: t.top - h * 0.6, width: w, height: h };
  sfx.whoosh();
  await flyTo(babyEl, to, { duration: 750, arc: 60 });
  sfx.chirp();
  burst(t.left + t.width / 2, t.top, { count: 12 });
  btn.classList.remove('idle');
  replay(btn, 'happy-mom');
  const s = speak(r.T);
  say(`${r.praise} Big ${s}, little ${s}! Together again!`);
  await sleep(1700);
  return babyEl;
}

async function goldStar(babyEl) {
  const r = babyEl._rect;
  const size = r.width * 0.8;
  const star = sprite('<img src="art/icon_star.png" alt="">', { left: r.left + r.width / 2 - size / 2, top: r.top - size * 0.6, width: size, height: size });
  star.querySelector('img').animate(
    [{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1) rotate(0)' }],
    { duration: 700, easing: 'ease-out', fill: 'forwards' }
  );
  sfx.fanfare();
  burst(r.left + r.width / 2, r.top, { kinds: ['icon_star'], count: 14, size: 36 });
  const s = speak(round.T);
  say(`Gold star! You know big ${s} and little ${s}!`, { queue: true });
  await sleep(2200);
  star.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => star.remove());
}

async function flyToSlot(babyEl, i) {
  const slot = slotsEl.children[i];
  const s = box(slot);
  const w = s.width * 0.8 * 283 / 360, h = s.width * 0.8;
  await flyTo(babyEl, { left: s.left + (s.width - w) / 2, top: s.top + (s.height - h) / 2, width: w, height: h }, { duration: 650, arc: 50 });
  babyEl.remove();
  sfx.pop();
  slot.classList.add('full');
  slot.innerHTML = `<img src="art/baby_${session.babies[i]}.png" alt="">`;
}

// ---------- end of a nest ----------
function celebrate() {
  round = null;
  disarmIdle();
  $('yayBabies').innerHTML = session.babies.map((b) => `<img src="art/baby_${b}.png" alt="">`).join('');
  $('yay').classList.add('show');
  sfx.fanfare();
  const W = window.innerWidth, H = window.innerHeight;
  burst(W * 0.3, H * 0.5, { kinds: ['icon_star', 'icon_heart'], count: 14, spread: 260 });
  setTimeout(() => burst(W * 0.7, H * 0.5, { kinds: ['icon_star', 'icon_heart'], count: 14, spread: 260 }), 300);
  say('Hooray! All five babies hatched!');
  say(pick(OFF_SCREEN), { queue: true });
}
$('againBtn').addEventListener('click', () => {
  audio();
  $('yay').classList.remove('show');
  startSession();
});
$('yayTreeBtn').addEventListener('click', () => { audio(); openTree(); });

// ---------- baby tree ----------
const treeEl = $('tree');
function openTree() {
  disarmIdle();
  const grid = $('treeGrid');
  grid.innerHTML = '';
  const open = pool();
  let count = 0;
  for (const L of ALPHABET) {
    const R = state.letters[L];
    const hatched = R && R.n > 0;
    if (hatched) count++;
    const card = document.createElement('button');
    card.className = `nest-card${hatched ? '' : open.includes(L) ? ' empty' : ' locked'}`;
    card.setAttribute('aria-label', `Big ${L}, little ${lower(L)}`);
    card.innerHTML = `<img class="who" src="art/${hatched ? `baby_${R.baby}` : 'nest_empty'}.png" alt="">`
      + `<div class="pair">${L}${lower(L)}</div>`
      + (R?.star ? '<img class="star" src="art/icon_star.png" alt="">' : '');
    card.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio();
      if (hatched) sfx.chirp();
      say(`Big ${speak(L)}, little ${speak(L)}!`);
      replay(card, 'bounce');
    });
    grid.appendChild(card);
  }
  $('treeCount').innerHTML = `<img src="art/baby_yellow.png" alt=""> ${count} / 26`;
  treeEl.classList.add('show');
  say(count ? 'Look at all your babies!' : 'Hatch eggs to fill the tree!');
}
$('treeBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); if (round && !round.locked) openTree(); });
$('treeBack').addEventListener('click', () => {
  treeEl.classList.remove('show');
  hush();
  if (round && !$('yay').classList.contains('show')) { promptRound(true); armIdle(); }
});
$('sayBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); audio(); promptRound(true); armIdle(); });

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
  for (const L of ALPHABET) {
    const R = state.letters[L];
    const sp = document.createElement('span');
    sp.textContent = L + lower(L);
    if (R?.t) {
      tries += R.t;
      right += R.r;
      sp.className = R.s >= STAR ? 'star' : R.s >= KNOWN ? 'known' : 'trying';
      sp.title = `${R.r} of ${R.t} right on the first try`;
    }
    st.appendChild(sp);
  }
  const pct = tries ? Math.round((right / tries) * 100) : 0;
  $('statusNote').textContent = `${state.hatched} babies hatched${tries ? `, ${pct}% right on the first try` : ''}. ${pool().length} of 26 letters in play. `
    + 'Gold: right the last 3 times. Green: last 2. Orange: still practicing. Gray: not tried yet.';
  parentEl.classList.add('show');
}
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
    if (seg.dataset.setting === 'natural') { hush(); natural?.setEnabled(state.settings.natural); }
    syncSettingsUI();
    save();
  });
});
const VOICE_NAMES = { af_heart: 'Heart', af_bella: 'Bella', af_nicole: 'Nicole', am_fenrir: 'Fenrir', am_puck: 'Puck', bf_emma: 'Emma', bm_george: 'George' };
const NATURAL_TEXT = {
  off: () => 'Off. The tablet voice is speaking.',
  checking: () => 'Checking for the natural voice...',
  missing: () => 'Not downloaded yet. The tablet voice speaks until it is. Download once on Wi-Fi; it stays on this tablet unless the browser clears its storage.',
  downloading: (d) => `Downloading... ${d}`.trim(),
  warming: () => 'Getting the natural voice ready. The tablet voice speaks until then.',
  ready: (d, v) => `Ready: ${VOICE_NAMES[v] || v}. New sentences take a moment the first time, then are saved.${d ? ` ${d}` : ''}`,
  error: (d) => `Could not load (${d}). The tablet voice is speaking.`
};
natural?.onStatus(({ phase, detail, voice: v }) => {
  $('naturalStatus').textContent = (NATURAL_TEXT[phase] || (() => phase))(detail || '', v);
  const btn = $('naturalBtn');
  btn.hidden = !(phase === 'missing' || phase === 'error');
  btn.textContent = phase === 'error' ? 'Try again' : 'Download natural voice (about 90 MB)';
  if (phase === 'ready') natural.prepare([FIXED_PHRASES[0], ...letterPhrases(pool()), ...FIXED_PHRASES], 'idle');
});
if (!natural) $('naturalStatus').textContent = 'Not available in this browser.';
$('naturalBtn').addEventListener('click', () => {
  state.settings.natural = true;
  save();
  syncSettingsUI();
  natural?.setEnabled(true);
  natural?.download();
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
  if (!confirm('Erase hatched babies and letter progress on this tablet? (Joyce keeps her records.)')) return;
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
if (kid.id !== 'unknown' && kid.name) $('title').textContent = `${kid.name}'s Hatch Match`;
$('startBtn').addEventListener('click', () => {
  audio();
  $('splash').classList.remove('show');
  sfx.chirp();
  say('Help the mama birds find their babies!');
  startSession(true);
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) hush(); });

const PRELOAD = [
  ...MAMAS.map((m) => `mama_${m.id}`), ...EGGS.map((c) => `egg_${c}`),
  ...MAMAS.map((m) => `baby_${m.id}`), ...RARES.map((r) => `baby_${r.id}`),
  'shell_top', 'nest_empty', 'icon_heart', 'icon_star'
];
Promise.all([
  ...PRELOAD.map((n) => new Promise((res) => { const img = new Image(); img.onload = img.onerror = res; img.src = `art/${n}.png`; })),
  document.fonts?.load('700 40px Andika').catch(() => {})
]).then(() => { $('startBtn').disabled = false; });
drawSlots();

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
