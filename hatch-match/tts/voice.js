// Kokoro voice for the Hatch Match game (window.HatchVoice).
//
// tts/worker.js generates speech one sentence at a time. Generated sentences
// are kept in the kokoro-hatch-v1 cache, so a sentence the game has said
// before plays at once. The game falls back to the tablet voice whenever this
// is not ready.
(() => {
'use strict';

const CACHE = 'kokoro-hatch-v1';
const CLIP_VERSION = 'v1-1939ad2a8e41';
const SPEED = 0.9;
const MEMORY = 60;
const NOW = 0, SOON = 1, IDLE = 2;
const SAVED = {};
const base = document.currentScript.src;

let worker = null;
let phase = 'off';
let detail = '';
let enabled = false;
let modelCached = false;
const voice = localStorage.getItem('kokoro-hatch-voice') || 'af_heart';
let fallback = null;
const listeners = [];

let ctx = null;
const mem = new Map();
const pending = new Map();
let nextId = 0;

let token = 0;
let queue = [];
let current = null;
let busy = false;

function setPhase(next, text = '') {
  phase = next;
  detail = text;
  const status = { phase, detail, voice };
  listeners.forEach((cb) => { try { cb(status); } catch (_) { /* a listener must not stop speech */ } });
}

// ---------- audio output ----------
function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}
function unlock() {
  const c = ensureCtx();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}
['pointerdown', 'touchend', 'keydown'].forEach((ev) => document.addEventListener(ev, unlock, { capture: true, passive: true }));
// iOS mutes Web Audio with the ring/silent switch unless the page asks for playback.
if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (_) { /* older Safari */ } }

function toBuffer(samples, rate) {
  const buf = new AudioBuffer({ length: Math.max(1, samples.length), numberOfChannels: 1, sampleRate: rate });
  buf.copyToChannel(samples, 0);
  return buf;
}

// ---------- saved sentences ----------
let cachePromise = null;
const store = () => cachePromise || (cachePromise = caches.open(CACHE));
const clipUrl = (text) => new URL(`clip/${CLIP_VERSION}/${voice}/${SPEED}/${encodeURIComponent(text)}`, base).href;

async function savedExists(text) {
  try { return !!(await (await store()).match(clipUrl(text))); }
  catch (_) { return false; }
}
async function loadSaved(text) {
  try {
    const res = await (await store()).match(clipUrl(text));
    if (!res) return null;
    const rate = Number(res.headers.get('X-Sample-Rate')) || 24000;
    const pcm = new Int16Array(await res.arrayBuffer());
    const samples = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) samples[i] = pcm[i] / 32768;
    return toBuffer(samples, rate);
  } catch (_) { return null; }
}
function save(text, samples, rate) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
  store()
    .then((c) => c.put(clipUrl(text), new Response(pcm.buffer, {
      headers: { 'Content-Type': 'application/octet-stream', 'X-Sample-Rate': String(rate) }
    })))
    .catch(() => { /* storage full: the sentence still plays this time */ });
}

// ---------- sentence clips ----------
const keyOf = (text) => `${voice}|${SPEED}|${text}`;

function request(text, entry) {
  if (!worker || phase !== 'ready') return null;
  return new Promise((resolve) => {
    const id = ++nextId;
    entry.id = id;
    pending.set(id, { resolve, entry });
    worker.postMessage({ type: 'synth', id, text, voice, speed: SPEED, priority: entry.priority });
  });
}

function trim() {
  for (const [k, entry] of mem) {
    if (mem.size <= MEMORY) break;
    if (!pending.has(entry.id)) mem.delete(k);
  }
}

function clip(text, priority) {
  if (phase !== 'ready') return Promise.resolve(null);
  const k = keyOf(text);
  const hit = mem.get(k);
  if (hit) {
    mem.delete(k);
    mem.set(k, hit);
    if (priority < hit.priority) {
      hit.priority = priority;
      hit.keep = true;
      if (pending.has(hit.id)) worker.postMessage({ type: 'bump', id: hit.id, priority });
    }
    return hit.promise;
  }
  const entry = { priority, keep: priority < IDLE, id: null };
  const first = priority === IDLE
    ? savedExists(text).then((ok) => (ok ? SAVED : null))
    : loadSaved(text);
  entry.promise = first
    .then((got) => {
      if (got === SAVED) return entry.keep ? loadSaved(text) : null;
      return got || request(text, entry);
    })
    .then((buf) => {
      if (!buf || !entry.keep) mem.delete(k);
      return buf || null;
    });
  mem.set(k, entry);
  trim();
  return entry.promise;
}

const sentences = (text) => (String(text).match(/[^.!?]+[.!?]*/g) || []).map((s) => s.trim()).filter(Boolean);

// ---------- playback ----------
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}

async function running() {
  const c = ensureCtx();
  if (!c) return false;
  if (c.state !== 'running') await withTimeout(c.resume().catch(() => {}), 300);
  return c.state === 'running';
}

function play(buf) {
  return new Promise((resolve) => {
    const c = ensureCtx();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (current && current.src === src) current = null;
      resolve();
    };
    current = { src, finish };
    src.onended = finish;
    setTimeout(finish, buf.duration * 1000 + 1000);
    src.start();
  });
}

async function pump() {
  if (busy) return;
  busy = true;
  const mine = token;
  try {
    while (queue.length && mine === token) {
      const part = queue[0];
      const buf = await withTimeout(part.clip, 8000);
      if (mine !== token) break;
      queue.shift();
      if (buf && await running()) {
        if (mine !== token) break;
        await play(buf);
      } else if (fallback) {
        await fallback(part.text);
      }
    }
  } finally {
    busy = false;
    if (mine !== token && queue.length) pump();
  }
}

function hush() {
  token++;
  queue = [];
  if (current) {
    try { current.src.stop(); } catch (_) { /* already stopped */ }
    current.finish();
  }
}

function say(text, { queue: append = false } = {}) {
  if (!append) hush();
  for (const s of sentences(text)) queue.push({ text: s, clip: clip(s, NOW) });
  pump();
}

function done(maxMs = 5000) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if ((!busy && !queue.length) || Date.now() - t0 > maxMs) resolve();
      else setTimeout(tick, 120);
    };
    tick();
  });
}

// Generate ahead. "soon" replaces the previous soon list; "idle" accumulates.
function prepare(texts, when = 'soon') {
  if (phase !== 'ready') return;
  const priority = when === 'idle' ? IDLE : SOON;
  if (priority === SOON) {
    const ids = [];
    for (const [k, entry] of mem) {
      if (entry.priority === SOON && pending.has(entry.id)) {
        ids.push(entry.id);
        pending.get(entry.id).resolve(null);
        pending.delete(entry.id);
        mem.delete(k);
      }
    }
    if (ids.length) worker.postMessage({ type: 'drop', ids });
  }
  const seen = new Set();
  for (const text of texts) {
    for (const s of sentences(text)) {
      if (seen.has(s)) continue;
      seen.add(s);
      clip(s, priority);
    }
  }
}

// ---------- worker ----------
function failPending() {
  for (const [, p] of pending) p.resolve(null);
  pending.clear();
  mem.clear();
}

function onMessage(event) {
  const data = event.data || {};
  if (data.type === 'hello') {
    modelCached = !!data.modelCached;
    if (!enabled) setPhase('off');
    else if (modelCached) start();
    else setPhase('missing');
  } else if (data.type === 'status') {
    if (phase !== 'ready') setPhase(data.state === 'downloading' ? 'downloading' : 'warming', data.detail || '');
  } else if (data.type === 'progress') {
    if (phase === 'downloading' && !data.quiet && data.total) {
      setPhase('downloading', `${data.label || 'Downloading'} ${Math.min(100, Math.round((data.loaded / data.total) * 100))}%`);
    }
  } else if (data.type === 'ready') {
    modelCached = true;
    setPhase(enabled ? 'ready' : 'off', data.storageWarning || '');
  } else if (data.type === 'error' && data.id == null) {
    failPending();
    setPhase('error', data.message || 'The natural voice could not start.');
  } else if (data.type === 'clip') {
    const p = pending.get(data.id);
    pending.delete(data.id);
    if (data.error || !data.samples) {
      if (p) p.resolve(null);
      return;
    }
    if (data.voice === voice && data.speed === SPEED) save(data.text, data.samples, data.sampleRate);
    if (p) p.resolve(p.entry.keep ? toBuffer(data.samples, data.sampleRate) : null);
  }
}

function boot() {
  if (worker) return;
  try {
    worker = new Worker(new URL('worker.js', base), { type: 'module' });
  } catch (err) {
    worker = null;
    setPhase('error', err.message || 'This browser cannot run the natural voice.');
    return;
  }
  worker.onmessage = onMessage;
  worker.onerror = (event) => {
    event.preventDefault?.();
    worker.terminate();
    worker = null;
    failPending();
    setPhase('error', event.message || 'The natural voice stopped.');
  };
}

function start() {
  boot();
  if (!worker) return;
  setPhase(modelCached ? 'warming' : 'downloading', modelCached ? 'Getting the voice ready' : 'Starting download');
  worker.postMessage({ type: 'start', voice });
}

window.HatchVoice = {
  init({ enabled: on = true, fallback: fb = null } = {}) {
    fallback = fb;
    enabled = !!on;
    setPhase(enabled ? 'checking' : 'off');
    boot();
  },
  setEnabled(on) {
    enabled = !!on;
    if (!enabled) {
      hush();
      if (phase === 'ready' || phase === 'missing' || phase === 'checking') setPhase('off');
      return;
    }
    if (phase === 'off' || phase === 'error') {
      if (modelCached) start();
      else if (worker) setPhase('missing');
      else boot();
    }
  },
  download() {
    unlock();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    start();
  },
  ready: () => enabled && phase === 'ready',
  status: () => ({ phase, detail, voice }),
  onStatus(cb) { listeners.push(cb); cb({ phase, detail, voice }); },
  say,
  hush,
  done,
  prepare,
  speaking: () => busy || queue.length > 0
};
})();
