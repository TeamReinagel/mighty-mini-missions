// Kokoro TTS worker. Inference stays off the UI thread.
//
// Runtime choice (kokoro-js 1.2.1 README + model card, checked Oct 2026):
//   dtype "q8"  -> onnx/model_quantized.onnx (about 92 MB). One file.
//   device "wasm" -> the documented browser path. WebGPU is documented with
//   fp32, a different 326 MB file, and current Safari/WebKit builds have
//   been unreliable with ONNX Runtime's WebGPU path. We do not load a second
//   quantization.
//
// Assets are pinned and stored only in the Cache named below. kokoro-js would
// otherwise open "transformers-cache" and "kokoro-voices"; both are redirected
// here so Reset can delete one cache.

const FEATURE_CACHE = 'kokoro-hatch-v1';
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const MODEL_REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';
const DTYPE = 'q8';
const DEVICE = 'wasm';
const MODEL_FILE = 'onnx/model_quantized.onnx';
const MODEL_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/${MODEL_FILE}`;

const RUNTIME = [
  {
    path: 'vendor/kokoro-1.2.1.web.js',
    sha256: '6067712fe4c43cdb36c762f860a5ab8d96ea1d9c8882466438eb9f3d0d20be8f',
    type: 'text/javascript'
  },
  {
    path: 'vendor/ort-3.5.1/ort-wasm-simd-threaded.jsep.mjs',
    sha256: '08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9',
    type: 'text/javascript'
  },
  {
    path: 'vendor/ort-3.5.1/ort-wasm-simd-threaded.jsep.wasm',
    sha256: 'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
    type: 'application/wasm'
  }
];

const nativeOpen = caches.open.bind(caches);
let storageWarning = '';

function wrapCache(cache) {
  return new Proxy(cache, {
    get(target, prop) {
      if (prop === 'put') {
        return async (request, response) => {
          try {
            await target.put(request, response);
          } catch (err) {
            const full = err && err.name === 'QuotaExceededError';
            storageWarning = full
              ? 'Browser storage is full, so this download cannot be kept for next time.'
              : `Could not save a speech file (${err && err.message ? err.message : err}).`;
            post({ type: 'storage', message: storageWarning });
            throw err;
          }
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

caches.open = (name) => {
  const resolved = name === 'transformers-cache' || name === 'kokoro-voices' ? FEATURE_CACHE : name;
  return nativeOpen(resolved).then(wrapCache);
};

const networkFiles = [];
const nativeFetch = fetch.bind(globalThis);
function pinUrl(url) {
  const needle = `/${MODEL_ID}/resolve/main/`;
  const pinned = `/${MODEL_ID}/resolve/${MODEL_REVISION}/`;
  return url.includes(needle) ? url.replace(needle, pinned) : url;
}
globalThis.fetch = (input, init) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = String(input);
  else if (input && typeof input.url === 'string') url = input.url;
  const pinned = pinUrl(url);
  if (pinned !== url) {
    if (typeof input === 'string' || input instanceof URL) input = pinned;
    else input = new Request(pinned, input);
    url = pinned;
  }
  const pending = nativeFetch(input, init);
  pending.then((res) => {
    try {
      const requested = new URL(url, self.location.href);
      if (!/huggingface\.co|hf\.co/.test(requested.host)) return;
      const bytes = Number(res.headers.get('content-length') || 0);
      networkFiles.push({
        file: requested.pathname.split('/').pop() || requested.pathname,
        bytes,
        status: res.status
      });
    } catch (_) { /* logging must not break the download */ }
  }).catch(() => {});
  return pending;
};

const warnings = [];
const nativeWarn = console.warn.bind(console);
console.warn = (...args) => {
  warnings.push(args.map((part) => String(part)).join(' ').slice(0, 300));
  nativeWarn(...args);
};

let KokoroTTS = null;
let TextSplitterStream = null;
let tts = null;
let runtimeReady = false;
let blobUrls = [];
let loadToken = 0;
let speakToken = 0;
let activeVoice = 'af_heart';
let startPromise = null;

// One ONNX session: run generations one after another.
let modelChain = Promise.resolve();
function withModel(fn) {
  const run = modelChain.then(fn, fn);
  modelChain = run.catch(() => {});
  return run;
}

// Sentence jobs from the game. Lower priority number runs first; queued
// prefetches can be raised (bump) or withdrawn (drop) by id.
const jobs = [];
let pumping = false;

function enqueueJob(job) {
  let at = jobs.findIndex((queued) => queued.priority > job.priority);
  if (at < 0) at = jobs.length;
  jobs.splice(at, 0, job);
}

async function pumpJobs() {
  if (pumping) return;
  pumping = true;
  try {
    while (jobs.length) {
      if (!tts && startPromise) await startPromise;
      if (!tts) {
        for (const job of jobs.splice(0)) post({ type: 'clip', id: job.id, text: job.text, error: 'Speech model is not ready.' });
        break;
      }
      const job = jobs.shift();
      const started = performance.now();
      try {
        const audio = await withModel(() => tts.generate(job.text, { voice: job.voice, speed: job.speed }));
        const samples = new Float32Array(audio.audio);
        post({
          type: 'clip',
          id: job.id,
          text: job.text,
          voice: job.voice,
          speed: job.speed,
          ms: performance.now() - started,
          sampleRate: audio.sampling_rate,
          samples
        }, [samples.buffer]);
      } catch (err) {
        post({ type: 'clip', id: job.id, text: job.text, error: err && err.message ? err.message : String(err) });
      }
      // generate() holds the thread; let bump/drop messages land before the next job.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    pumping = false;
  }
}

function post(message, transfer) {
  if (transfer) self.postMessage(message, transfer);
  else self.postMessage(message);
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function openFeatureCache(create) {
  const names = await caches.keys();
  if (!names.includes(FEATURE_CACHE) && !create) return null;
  return caches.open(FEATURE_CACHE);
}

async function cacheEntries() {
  const cache = await openFeatureCache(false);
  if (!cache) return [];
  const keys = (await cache.keys()).filter((key) => !key.url.includes('/tts/clip/'));
  return keys.map((key) => {
    const url = new URL(key.url);
    return url.pathname.replace(/^.*\/resolve\/(?:main|[^/]+)\//, '');
  });
}

async function hasModel() {
  const cache = await openFeatureCache(false);
  if (!cache) return false;
  return !!(await cache.match(MODEL_URL));
}

async function hasRuntime() {
  const cache = await openFeatureCache(false);
  if (!cache) return false;
  for (const file of RUNTIME) {
    const url = new URL(file.path, self.location.href).href;
    if (!(await cache.match(url))) return false;
  }
  return true;
}

async function readBytes(response, label) {
  const total = Number(response.headers.get('content-length') || 0);
  const reader = response.body.getReader();
  const parts = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.byteLength;
    post({ type: 'progress', label, loaded, total: total || loaded });
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

async function loadRuntimeFile(file) {
  const url = new URL(file.path, self.location.href).href;
  const cache = await caches.open(FEATURE_CACHE);
  const cached = await cache.match(url);
  if (cached) return new Uint8Array(await cached.arrayBuffer());

  post({ type: 'status', state: 'downloading', detail: `Downloading ${file.path.split('/').pop()}` });
  const response = await nativeFetch(url);
  if (!response.ok) throw new Error(`Could not download ${file.path} (${response.status}).`);
  const bytes = await readBytes(response, `Runtime · ${file.path.split('/').pop()}`);
  const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
  if (digest !== file.sha256) {
    throw new Error(`Downloaded ${file.path.split('/').pop()} did not match the pinned file. Nothing was saved.`);
  }
  try {
    await cache.put(url, new Response(bytes, {
      headers: { 'Content-Type': file.type, 'Content-Length': String(bytes.byteLength) }
    }));
  } catch (err) {
    storageWarning = storageWarning || `Saved runtime file failed (${err && err.message ? err.message : err}). Speech can still run until this page closes.`;
    post({ type: 'storage', message: storageWarning });
  }
  return bytes;
}

async function ensureRuntime() {
  if (runtimeReady) return;
  const buffers = [];
  for (const file of RUNTIME) buffers.push(await loadRuntimeFile(file));
  const [jsBytes, mjsBytes, wasmBytes] = buffers;
  const jsUrl = URL.createObjectURL(new Blob([jsBytes], { type: 'text/javascript' }));
  const mjsUrl = URL.createObjectURL(new Blob([mjsBytes], { type: 'text/javascript' }));
  const wasmUrl = URL.createObjectURL(new Blob([wasmBytes], { type: 'application/wasm' }));
  blobUrls = [jsUrl, mjsUrl, wasmUrl];
  const mod = await import(jsUrl);
  KokoroTTS = mod.KokoroTTS;
  TextSplitterStream = mod.TextSplitterStream;
  mod.env.wasmPaths = { mjs: mjsUrl, wasm: wasmUrl };
  runtimeReady = true;
}

function labelFor(file) {
  if (!file) return 'Speech files';
  if (file.endsWith('.onnx')) return 'Speech model';
  if (file.includes('tokenizer')) return 'Tokenizer';
  if (file.endsWith('.bin')) return 'Voice';
  return file;
}

async function ensureModel() {
  if (tts) return;
  const cached = await hasModel();
  post({
    type: 'status',
    state: cached ? 'warming' : 'downloading',
    detail: cached ? 'Loading saved speech model' : 'Downloading speech model'
  });
  const started = performance.now();
  tts = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: DTYPE,
    device: DEVICE,
    progress_callback(info) {
      if (!info) return;
      if (info.status === 'progress') {
        post({
          type: 'progress',
          label: labelFor(info.file),
          loaded: info.loaded || 0,
          total: info.total || 0,
          quiet: cached
        });
      } else if (info.status === 'initiate' || info.status === 'download') {
        post({
          type: 'status',
          state: cached ? 'warming' : 'downloading',
          detail: labelFor(info.file)
        });
      }
    }
  });
  return performance.now() - started;
}

function peakOf(samples) {
  let peak = 0;
  const step = Math.max(1, Math.floor(samples.length / 4000));
  for (let i = 0; i < samples.length; i += step) {
    const value = Math.abs(samples[i]);
    if (value > peak) peak = value;
  }
  return peak;
}

async function prewarm(token, voice) {
  post({ type: 'status', state: 'warming', detail: 'Warming up, silently' });
  const started = performance.now();
  const audio = await withModel(() => tts.generate('Hello.', { voice, speed: 1 }));
  if (token !== loadToken) return null;
  const samples = audio.audio;
  return {
    ms: performance.now() - started,
    samples: samples.length,
    seconds: samples.length / audio.sampling_rate,
    peak: peakOf(samples)
  };
}

async function start(voice) {
  activeVoice = voice || activeVoice;
  if (startPromise) return startPromise;
  const token = ++loadToken;
  speakToken++;
  storageWarning = '';
  const started = performance.now();
  startPromise = runStart(token, started).finally(() => { startPromise = null; });
  return startPromise;
}

async function runStart(token, started) {
  const netMark = networkFiles.length;
  try {
    const modelCached = await hasModel();
    const runtimeCached = await hasRuntime();
    await ensureRuntime();
    if (token !== loadToken) return;
    const modelLoadMs = tts ? 0 : await ensureModel();
    if (token !== loadToken) return;
    const warm = await prewarm(token, activeVoice);
    if (!warm || token !== loadToken) return;
    const entries = await cacheEntries();
    const sessionFiles = networkFiles.slice(netMark);
    const modelBytes = sessionFiles.reduce((sum, file) => sum + (file.bytes || 0), 0);
    post({
      type: 'ready',
      voice: activeVoice,
      storageWarning,
      metrics: {
        cacheHit: !sessionFiles.some((file) => file.file === 'model_quantized.onnx'),
        modelWasCached: modelCached,
        runtimeWasCached: runtimeCached,
        modelLoadMs,
        prewarmMs: warm.ms,
        startupMs: performance.now() - started,
        prewarmPeak: warm.peak,
        prewarmSamples: warm.samples,
        prewarmSeconds: warm.seconds,
        networkFiles: sessionFiles,
        modelNetworkBytes: modelBytes,
        cacheEntries: entries,
        dtype: DTYPE,
        device: DEVICE,
        modelFile: MODEL_FILE,
        revision: MODEL_REVISION,
        crossOriginIsolated: self.crossOriginIsolated === true,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
        webgpuPresent: typeof navigator.gpu !== 'undefined',
        warnings: warnings.slice(-8)
      }
    });
  } catch (err) {
    if (token !== loadToken) return;
    post({
      type: 'error',
      message: err && err.message ? err.message : String(err)
    });
  }
}

function chunksFor(text) {
  const splitter = new TextSplitterStream();
  splitter.push(text.trim());
  splitter.close();
  const sentences = [...splitter].map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    // "Find little C. That's…" is one chunk for the library splitter, because a
    // single capital looks like an initial. Break those so playback can start.
    const pieces = sentence.split(/(?<=\b[A-Za-z]\.)\s+(?=[A-Z])/);
    for (const piece of pieces) {
      if (piece.length <= 180) {
        chunks.push(piece);
        continue;
      }
      const parts = piece.split(/(?<=[,;:])\s+/);
      let buffer = '';
      for (const part of parts) {
        if (!buffer) buffer = part;
        else if (`${buffer} ${part}`.length > 180) {
          chunks.push(buffer);
          buffer = part;
        } else buffer = `${buffer} ${part}`;
      }
      if (buffer) chunks.push(buffer);
    }
  }
  return chunks;
}

async function speak(id, text, voice) {
  const token = ++speakToken;
  if (!tts) {
    post({ type: 'error', message: 'Speech model is not ready.' });
    return;
  }
  activeVoice = voice || activeVoice;
  const chunks = chunksFor(text);
  if (!chunks.length) {
    post({ type: 'error', message: 'Type something to speak.' });
    return;
  }
  let generateMs = 0;
  let audioSec = 0;
  try {
    for (let index = 0; index < chunks.length; index++) {
      // generate() blocks the worker, so a cancel message cannot land until we
      // return to the event loop. Yield before starting the next sentence.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (token !== speakToken) {
        post({ type: 'cancelled', id });
        return;
      }
      const chunk = chunks[index];
      const started = performance.now();
      const audio = await withModel(() => tts.generate(chunk, { voice: activeVoice, speed: 1 }));
      const elapsed = performance.now() - started;
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (token !== speakToken) {
        post({ type: 'cancelled', id });
        return;
      }
      const samples = new Float32Array(audio.audio);
      const seconds = samples.length / audio.sampling_rate;
      generateMs += elapsed;
      audioSec += seconds;
      post({
        type: 'chunk',
        id,
        index,
        count: chunks.length,
        text: chunk,
        generateMs: elapsed,
        audioSec: seconds,
        sampleRate: audio.sampling_rate,
        samples
      }, [samples.buffer]);
    }
    if (token !== speakToken) return;
    post({ type: 'done', id, generateMs, audioSec, chunks: chunks.length });
  } catch (err) {
    if (token !== speakToken) return;
    post({ type: 'error', message: err && err.message ? err.message : String(err), id });
  }
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'start' || data.type === 'warm') start(data.voice || 'af_heart');
  else if (data.type === 'speak') speak(data.id, data.text || '', data.voice || activeVoice);
  else if (data.type === 'cancel') speakToken++;
  else if (data.type === 'synth') {
    enqueueJob({ id: data.id, text: data.text || '', voice: data.voice || activeVoice, speed: data.speed || 1, priority: data.priority || 0 });
    pumpJobs();
  } else if (data.type === 'bump') {
    const at = jobs.findIndex((job) => job.id === data.id);
    if (at >= 0) {
      const [job] = jobs.splice(at, 1);
      job.priority = data.priority || 0;
      enqueueJob(job);
    }
  } else if (data.type === 'drop') {
    const ids = new Set(data.ids || []);
    for (let i = jobs.length - 1; i >= 0; i--) if (ids.has(jobs[i].id)) jobs.splice(i, 1);
  }
});

async function dropOldFeatureCaches() {
  const keys = await caches.keys();
  await Promise.all(keys
    .filter((name) => name.startsWith('kokoro-hatch-') && name !== FEATURE_CACHE)
    .map((name) => caches.delete(name)));
}

dropOldFeatureCaches()
  .then(() => Promise.all([hasModel(), hasRuntime(), cacheEntries()]))
  .then(([modelCached, runtimeCached, entries]) => {
    post({ type: 'hello', modelCached, runtimeCached, cacheEntries: entries, cacheName: FEATURE_CACHE });
  })
  .catch((err) => {
    post({ type: 'error', message: err && err.message ? err.message : String(err) });
  });
