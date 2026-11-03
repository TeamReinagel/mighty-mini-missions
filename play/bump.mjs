// A right tap is a short wooden click. A miss is a softer, shorter bump.
export function bump(good) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
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
    osc.onended = () => ctx.close();
  } catch { /* a quiet tablet is fine */ }
}
