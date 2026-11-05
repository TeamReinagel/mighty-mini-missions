// One sound channel for the whole page. Opening a new one for every tap is slow to start on
// the tablets, and browsers stop allowing new ones after a few dozen, which made games go quiet.
let shared = null;
export function soundContext() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!shared || shared.state === "closed") shared = new Ctx();
    if (shared.state === "suspended") shared.resume().catch(() => {});
    return shared;
  } catch {
    return null;
  }
}

// A right tap is a short wooden click. A miss is a softer, shorter bump.
export function bump(good) {
  try {
    const ctx = soundContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = good ? "triangle" : "sine";
    osc.frequency.value = good ? 740 : 150;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(good ? 0.05 : 0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (good ? 0.09 : 0.06));
    osc.start(now);
    osc.stop(now + (good ? 0.1 : 0.07));
  } catch { /* a quiet tablet is fine */ }
}
