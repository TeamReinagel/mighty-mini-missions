// Shared progress log for every game. Each answered question is queued on this device
// and synced to /api/progress, which feeds the weekly parent report in Slack.
// Works offline: the queue waits in localStorage until the next successful sync.
(() => {
  "use strict";

  const QUEUE_KEY = "mightyMini.progressQueue.v1";
  const PROFILES_KEY = "mighty-mini-missions:profiles";
  const ENDPOINT = "/api/progress";
  const MAX_QUEUE = 3000;
  const BATCH = 200;
  const FLUSH_DELAY_MS = 4000;

  const canSync = location.protocol === "https:" || location.protocol === "http:";

  function readQueue() {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY));
      return Array.isArray(q) ? q : [];
    } catch (_) {
      return [];
    }
  }

  function writeQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); } catch (_) { /* storage full or blocked */ }
  }

  function profiles() {
    try {
      const data = JSON.parse(localStorage.getItem(PROFILES_KEY)) || {};
      return { list: Array.isArray(data.profiles) ? data.profiles : [], activeId: data.activeProfileId };
    } catch (_) {
      return { list: [], activeId: null };
    }
  }

  // The child picked on the Mighty Mini Missions home screen. Games with their own
  // player picker (Coin Record Run) pass a name instead.
  function resolveKid(name) {
    const { list, activeId } = profiles();
    if (name) {
      const match = list.find((p) => String(p.name).toLowerCase() === String(name).toLowerCase());
      return match ? { id: match.id, name: match.name } : { id: String(name).toLowerCase(), name: String(name) };
    }
    const active = list.find((p) => p.id === activeId);
    return active ? { id: active.id, name: active.name } : { id: "unknown", name: "Unknown player" };
  }

  function newId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  let timer = null;
  let sending = false;

  async function flush({ keepalive = false } = {}) {
    clearTimeout(timer);
    timer = null;
    if (!canSync || sending || !navigator.onLine) return;
    const batch = readQueue().slice(0, BATCH);
    if (!batch.length) return;
    sending = true;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive
      });
      if (res.ok) {
        const sent = new Set(batch.map((e) => e.id));
        const rest = readQueue().filter((e) => !sent.has(e.id));
        writeQueue(rest);
        if (rest.length) schedule();
      }
    } catch (_) {
      // Offline or endpoint missing (local server): keep the queue for next time.
    } finally {
      sending = false;
    }
  }

  function schedule() {
    if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
  }

  /**
   * Record one learning moment.
   * @param {object} e
   * @param {string} e.game     e.g. "ghost-word-run"
   * @param {string} e.skill    e.g. "Sight words 1-50"
   * @param {string} e.item     the specific thing practiced, e.g. "the"
   * @param {boolean|null} e.correct  right on the first try; null when there is no right/wrong
   * @param {string} [e.player] player name when the game has its own picker
   * @param {object} [e.extra]  small extra details (rating, note, level)
   */
  function log(e) {
    if (!e || !e.game || !e.skill) return;
    const kid = resolveKid(e.player);
    const q = readQueue();
    q.push({
      id: newId(),
      t: new Date().toISOString(),
      kid: kid.id,
      kidName: kid.name,
      game: String(e.game),
      skill: String(e.skill),
      item: e.item == null ? "" : String(e.item),
      correct: typeof e.correct === "boolean" ? e.correct : null,
      extra: e.extra && typeof e.extra === "object" ? e.extra : undefined
    });
    writeQueue(q);
    schedule();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush({ keepalive: true });
  });
  window.addEventListener("online", () => flush());
  window.addEventListener("load", () => setTimeout(flush, 1500));

  window.MightyProgress = { log, flush, currentKid: () => resolveKid() };
})();
