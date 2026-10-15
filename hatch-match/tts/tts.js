const CACHE = 'kokoro-hatch-v1';
const REPORT_KEY = 'kokoro-hatch-report';
const VOICE_KEY = 'kokoro-hatch-voice';

const $ = (id) => document.getElementById(id);
const stateEl = $('state');
const detailEl = $('detail');
const storageEl = $('storage');
const barEl = $('bar');
const voiceEl = $('voice');
const textEl = $('text');
const downloadBtn = $('download');
const resetBtn = $('reset');
const speakBtn = $('speak');
const stopBtn = $('stop');
const logEl = $('log');

const report = loadReport();
renderReport();

let worker = null;
let phase = 'checking';
let readyVoice = '';
let speakId = 0;
let activeSpeak = 0;
let speakStarted = 0;
let audibleMarked = false;
let watchToken = 0;
let hearing = false;
let passageDone = false;
let chunkStats = [];
let playing = 0;
let nextAt = 0;
let nodes = [];
let actx = null;
let analyser = null;
let gain = null;
let downloadStarted = 0;
let sawReady = false;

voiceEl.value = localStorage.getItem(VOICE_KEY) || 'af_heart';
voiceEl.addEventListener('change', () => {
  localStorage.setItem(VOICE_KEY, voiceEl.value);
  if (phase === 'ready' && voiceEl.value !== readyVoice) warm(voiceEl.value);
});

function loadReport() {
  try { return JSON.parse(localStorage.getItem(REPORT_KEY)) || {}; }
  catch (_) { return {}; }
}
function saveReport() {
  try { localStorage.setItem(REPORT_KEY, JSON.stringify(report)); }
  catch (_) { /* the report is optional */ }
}
function ms(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return value < 10000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;
}
function renderReport() {
  const first = report.firstRun;
  $('mFirst').textContent = first
    ? `${ms(first.clickToReadyMs)} from Download to ready (${ms(first.modelLoadMs)} load, ${ms(first.prewarmMs)} silent prewarm, ${formatBytes(first.modelNetworkBytes)} from the network).`
    : 'Not measured yet.';
  const cached = report.cached;
  $('mCached').textContent = cached
    ? `${ms(cached.pageToReadyMs)} from page load to ready (${ms(cached.modelLoadMs)} load, ${ms(cached.prewarmMs)} silent prewarm, model weights not downloaded again).`
    : 'Not measured yet.';
  const speak = report.warmSpeak;
  $('mSpeak').textContent = speak && speak.speakToAudibleMs != null
    ? `${ms(speak.speakToAudibleMs)} until sound at the audio output.`
    : 'Not measured yet.';
  $('mSpeed').textContent = speak && speak.rtf != null
    ? `${speak.generateMs.toFixed(0)} ms to generate ${speak.audioSec.toFixed(2)} s of audio (${speak.rtf.toFixed(2)}× realtime). ${speak.overlapped ? 'Playback started before the full passage finished generating.' : 'The passage finished generating before playback started.'} ${speak.chunks} chunk${speak.chunks === 1 ? '' : 's'}.`
    : 'Not measured yet.';
}
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function log(line) {
  logEl.textContent += `${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setPhase(next, text, detail) {
  phase = next;
  stateEl.textContent = text;
  stateEl.className = next === 'error' ? 'error' : next === 'ready' ? 'ready' : '';
  if (detail != null) detailEl.textContent = detail;
  const busy = next === 'downloading' || next === 'warming' || next === 'checking';
  downloadBtn.disabled = next !== 'needs-download' && next !== 'error';
  downloadBtn.textContent = next === 'error' ? 'Retry download' : next === 'needs-download' ? 'Download' : 'Downloaded';
  speakBtn.disabled = next !== 'ready';
  voiceEl.disabled = busy;
  stopBtn.disabled = next !== 'speaking' && playing === 0;
}

function setBar(loaded, total) {
  barEl.classList.remove('busy');
  if (!total) {
    barEl.style.width = '0';
    barEl.classList.add('busy');
    return;
  }
  barEl.style.width = `${Math.max(0, Math.min(100, (loaded / total) * 100))}%`;
}

function fillBar() {
  barEl.classList.remove('busy');
  barEl.style.width = '100%';
}

async function askPersist() {
  if (!navigator.storage || !navigator.storage.persist) {
    storageEl.textContent = 'This browser does not offer persistent storage. Saved speech stays until the browser clears site data.';
    return;
  }
  let persisted = false;
  try { persisted = await navigator.storage.persist(); }
  catch (_) { persisted = false; }
  if (!persisted && navigator.storage.persisted) {
    try { persisted = await navigator.storage.persisted(); }
    catch (_) { persisted = false; }
  }
  storageEl.textContent = persisted
    ? 'Storage: the browser agreed to keep saved speech. It can still remove it if space runs out.'
    : 'Storage: best effort. The browser can delete saved speech when space runs out. Download once means reuse while the files remain.';
}

function audio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    gain = actx.createGain();
    gain.gain.value = 0.9;
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    gain.connect(analyser);
    analyser.connect(actx.destination);
  }
  return actx;
}

async function unlockAudio() {
  const ctx = audio();
  if (!ctx) throw new Error('This browser cannot play Web Audio.');
  if (ctx.state === 'suspended') await ctx.resume();
  const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return ctx;
}

function stopPlayback() {
  watchToken++;
  hearing = false;
  audibleMarked = false;
  for (const node of nodes) {
    try { node.stop(); } catch (_) { /* already stopped */ }
  }
  nodes = [];
  playing = 0;
  nextAt = 0;
  if (phase === 'speaking') setPhase('ready', 'Ready', 'Stopped.');
  stopBtn.disabled = true;
}

function watchAudible(token, started) {
  const data = new Uint8Array(analyser.fftSize);
  const tick = () => {
    if (token !== watchToken) return;
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
    if (peak > 2) {
      audibleMarked = true;
      const elapsed = performance.now() - started;
      log(`First output audio ${Math.round(elapsed)} ms after Speak (peak ${peak}).`);
      if (!report.warmSpeak || report.warmSpeak.speakToAudibleMs == null) {
        report.warmSpeak = { ...(report.warmSpeak || {}), speakToAudibleMs: elapsed };
        saveReport();
        renderReport();
      } else if (activeSpeak === speakId) {
        report.warmSpeak.speakToAudibleMs = elapsed;
        saveReport();
        renderReport();
      }
      return;
    }
    if (performance.now() - started < 30000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function enqueue(id, samples, sampleRate) {
  if (id !== activeSpeak) return;
  const ctx = audio();
  if (!ctx || ctx.state !== 'running') return;
  const buffer = ctx.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(gain);
  const startAt = Math.max(ctx.currentTime + 0.03, nextAt);
  src.start(startAt);
  nextAt = startAt + buffer.duration;
  nodes.push(src);
  playing++;
  if (!hearing) {
    hearing = true;
    watchAudible(watchToken, speakStarted);
  }
  src.onended = () => {
    playing = Math.max(0, playing - 1);
    if (id !== activeSpeak) return;
    if (playing === 0 && passageDone) {
      setPhase('ready', 'Ready', 'Finished speaking.');
      stopBtn.disabled = true;
    }
  };
  setPhase('speaking', 'Speaking', 'Playing while later sentences generate.');
  stopBtn.disabled = false;
}

function finishPassage(id, message) {
  if (id !== activeSpeak) return;
  passageDone = true;
  const generateMs = message.generateMs || chunkStats.reduce((sum, row) => sum + row.generateMs, 0);
  const audioSec = message.audioSec || chunkStats.reduce((sum, row) => sum + row.audioSec, 0);
  const rtf = audioSec > 0 ? (generateMs / 1000) / audioSec : 0;
  const first = chunkStats[0];
  const overlapped = !!(first && playing > 0 && chunkStats.length > 1);
  report.warmSpeak = {
    ...(report.warmSpeak || {}),
    generateMs,
    audioSec,
    rtf,
    chunks: message.chunks || chunkStats.length,
    overlapped,
    firstChunkMs: first ? first.generateMs : null
  };
  saveReport();
  renderReport();
  log(`Generated ${audioSec.toFixed(2)} s in ${Math.round(generateMs)} ms (${rtf.toFixed(2)}× realtime) across ${chunkStats.length} chunks.`);
  if (playing === 0) {
    setPhase('ready', 'Ready', 'Finished speaking.');
    stopBtn.disabled = true;
  }
}

function onWorkerMessage(event) {
  const data = event.data || {};
  if (data.type === 'hello') {
    log(`Cache ${data.cacheName}: ${data.cacheEntries && data.cacheEntries.length ? data.cacheEntries.join(', ') : 'empty'}.`);
    if (data.modelCached) {
      setPhase('warming', 'Warming up', 'Saved speech found. Loading it again, without a new model download.');
      setBar(1, 1);
      worker.postMessage({ type: 'start', voice: voiceEl.value });
    } else {
      setPhase('needs-download', 'Ready to download', data.runtimeCached
        ? 'The speech runtime is saved. The model still needs a download.'
        : 'Speech runs on this device. The model downloads once, then stays in this browser until it is cleared.');
      downloadBtn.disabled = false;
    }
    return;
  }
  if (data.type === 'status') {
    const titles = {
      downloading: 'Downloading',
      warming: 'Warming up',
      ready: 'Ready'
    };
    setPhase(data.state, titles[data.state] || data.state, data.detail || '');
    if (data.state === 'warming') fillBar();
    return;
  }
  if (data.type === 'progress') {
    const total = data.total || 0;
    const loaded = data.loaded || 0;
    setBar(loaded, total);
    const pct = total ? `${Math.min(100, Math.round((loaded / total) * 100))}%` : formatBytes(loaded);
    detailEl.textContent = `${data.label || 'Downloading'} · ${pct}`;
    if (!data.quiet && phase !== 'speaking') setPhase('downloading', 'Downloading', detailEl.textContent);
    return;
  }
  if (data.type === 'storage') {
    storageEl.textContent = data.message;
    return;
  }
  if (data.type === 'ready') {
    readyVoice = data.voice;
    sawReady = true;
    fillBar();
    setPhase('ready', 'Ready', data.storageWarning || 'Silent warmup finished. Nothing was played.');
    const metrics = data.metrics || {};
    log(`Ready in ${Math.round(metrics.startupMs)} ms. Prewarm peak ${metrics.prewarmPeak.toFixed(3)} on ${metrics.prewarmSamples} samples (not played).`);
    log(`Network files: ${metrics.networkFiles.length ? metrics.networkFiles.map((file) => `${file.file} ${formatBytes(file.bytes)}`).join(', ') : 'none'}.`);
    log(`Saved entries: ${metrics.cacheEntries.join(', ') || 'none'}.`);
    log(`Runtime ${metrics.device} / ${metrics.dtype} / ${metrics.modelFile} @ ${metrics.revision.slice(0, 12)}. crossOriginIsolated=${metrics.crossOriginIsolated}. webgpu=${metrics.webgpuPresent}.`);
    if (metrics.warnings && metrics.warnings.length) log(`Warnings: ${metrics.warnings.join(' | ')}`);
    if (!metrics.cacheHit && !report.firstRun) {
      report.firstRun = {
        at: new Date().toISOString(),
        clickToReadyMs: downloadStarted ? performance.now() - downloadStarted : metrics.startupMs,
        modelLoadMs: metrics.modelLoadMs,
        prewarmMs: metrics.prewarmMs,
        startupMs: metrics.startupMs,
        modelNetworkBytes: metrics.modelNetworkBytes,
        networkFiles: metrics.networkFiles,
        cacheEntries: metrics.cacheEntries
      };
      saveReport();
    }
    if (metrics.cacheHit) {
      report.cached = {
        at: new Date().toISOString(),
        pageToReadyMs: performance.now(),
        modelLoadMs: metrics.modelLoadMs,
        prewarmMs: metrics.prewarmMs,
        startupMs: metrics.startupMs,
        networkFiles: metrics.networkFiles
      };
      saveReport();
    }
    window.__kokoro = { ...(window.__kokoro || {}), lastReady: metrics, report };
    renderReport();
    return;
  }
  if (data.type === 'chunk') {
    if (data.id !== activeSpeak) {
      log(`Discarded stale chunk ${data.id}.`);
      return;
    }
    chunkStats.push({ text: data.text, generateMs: data.generateMs, audioSec: data.audioSec });
    log(`Chunk ${data.index + 1}/${data.count}: “${data.text}” generated in ${Math.round(data.generateMs)} ms (${data.audioSec.toFixed(2)} s).`);
    enqueue(data.id, data.samples, data.sampleRate);
    return;
  }
  if (data.type === 'done') {
    finishPassage(data.id, data);
    return;
  }
  if (data.type === 'cancelled') {
    if (data.id === activeSpeak) log('Stopped. Later audio was discarded.');
    return;
  }
  if (data.type === 'error') {
    setPhase('error', 'Something went wrong', data.message || 'Unknown error');
    log(`Error: ${data.message}`);
    downloadBtn.disabled = false;
  }
}

function bootWorker() {
  if (worker) worker.terminate();
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = onWorkerMessage;
  worker.onerror = (event) => {
    setPhase('error', 'Something went wrong', event.message || 'The speech worker stopped.');
    log(`Worker error: ${event.message || event}`);
    downloadBtn.disabled = false;
  };
}

async function warm(voice) {
  stopPlayback();
  activeSpeak++;
  setPhase('warming', 'Warming up', 'Loading the selected voice, silently.');
  worker.postMessage({ type: 'warm', voice });
}

downloadBtn.addEventListener('click', async () => {
  downloadStarted = performance.now();
  downloadBtn.disabled = true;
  await unlockAudio().catch(() => {});
  await askPersist();
  setPhase('downloading', 'Downloading', 'Starting the one-time download.');
  worker.postMessage({ type: 'start', voice: voiceEl.value });
});

speakBtn.addEventListener('click', async () => {
  const text = textEl.value.trim();
  if (!text || phase !== 'ready') return;
  stopPlayback();
  speakStarted = performance.now();
  audibleMarked = false;
  hearing = false;
  passageDone = false;
  chunkStats = [];
  try { await unlockAudio(); }
  catch (err) {
    setPhase('error', 'Something went wrong', err.message);
    return;
  }
  activeSpeak = ++speakId;
  setPhase('speaking', 'Speaking', 'Generating the first sentence.');
  stopBtn.disabled = false;
  worker.postMessage({ type: 'speak', id: activeSpeak, text, voice: voiceEl.value });
});

stopBtn.addEventListener('click', () => {
  activeSpeak++;
  worker.postMessage({ type: 'cancel' });
  stopPlayback();
  log('Stop pressed. Queued audio was dropped.');
});

resetBtn.addEventListener('click', async () => {
  if (!confirm('Delete saved Kokoro speech files on this device? Hatch Match progress stays.')) return;
  stopPlayback();
  if (worker) {
    worker.terminate();
    worker = null;
  }
  await caches.delete(CACHE);
  localStorage.removeItem(REPORT_KEY);
  localStorage.removeItem(VOICE_KEY);
  report.firstRun = null;
  report.cached = null;
  report.warmSpeak = null;
  Object.keys(report).forEach((key) => delete report[key]);
  renderReport();
  logEl.textContent = '';
  log('Deleted the Kokoro cache only.');
  setBar(0, 1);
  storageEl.textContent = '';
  sawReady = false;
  readyVoice = '';
  bootWorker();
});

document.addEventListener('pointerdown', () => { unlockAudio().catch(() => {}); }, { once: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}

bootWorker();
setPhase('checking', 'Checking saved speech…', '');
