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

  // A child named in the page link (?kid=connor, as Today with Joyce sends), else the child
  // picked on the Mighty Mini Missions home screen. Games with their own player picker
  // (Coin Record Run) pass a name instead.
  const KNOWN_KIDS = ["max", "gabi", "connor", "ethan"];

  function linkedKid(list) {
    let id = "";
    try { id = String(new URLSearchParams(location.search).get("kid") || "").toLowerCase(); } catch (_) { return null; }
    if (!id) return null;
    const match = list.find((p) => String(p.id).toLowerCase() === id);
    if (match) return { id: match.id, name: match.name };
    return KNOWN_KIDS.includes(id) ? { id, name: id.charAt(0).toUpperCase() + id.slice(1) } : null;
  }

  function resolveKid(name) {
    const { list, activeId } = profiles();
    if (name) {
      const match = list.find((p) => String(p.name).toLowerCase() === String(name).toLowerCase());
      return match ? { id: match.id, name: match.name } : { id: String(name).toLowerCase(), name: String(name) };
    }
    const linked = linkedKid(list);
    if (linked) return linked;
    const active = list.find((p) => p.id === activeId);
    return active ? { id: active.id, name: active.name } : { id: "unknown", name: "Unknown player" };
  }

  function newId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  let timer = null;
  // One send at a time. A finish that arrives while a send is going out waits,
  // then sends what that first batch left in the queue.
  let tail = Promise.resolve();

  function flush({ keepalive = false } = {}) {
    const run = tail.then(() => drain({ keepalive }));
    tail = run.then(() => {}, () => {});
    return run;
  }

  async function drain({ keepalive = false } = {}) {
    clearTimeout(timer);
    timer = null;
    if (!canSync || !navigator.onLine) return;
    const batch = readQueue().slice(0, BATCH);
    if (!batch.length) return;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive
      });
      if (!res.ok) {
        schedule();
        return;
      }
      const sent = new Set(batch.map((e) => e.id));
      const queuedBefore = readQueue().length;
      writeQueue(readQueue().filter((e) => !sent.has(e.id)));
      const left = readQueue().length;
      if (left && left < queuedBefore) return drain({ keepalive });
      if (left) schedule();
    } catch (_) {
      // Offline or endpoint missing (local server): keep the queue for next time.
      schedule();
    }
  }

  function schedule() {
    if (!timer) timer = setTimeout(() => { flush(); }, FLUSH_DELAY_MS);
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
    if (!e || !e.game || !e.skill) return false;
    const kid = e.kid
      ? { id: String(e.kid).toLowerCase(), name: e.player ? String(e.player) : String(e.kid) }
      : resolveKid(e.player);
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
    return true;
  }

  document.addEventListener("visibilitychange", () => {
    flush({ keepalive: document.visibilityState === "hidden" });
  });
  window.addEventListener("pagehide", () => flush({ keepalive: true }));
  window.addEventListener("online", () => flush());
  window.addEventListener("load", () => setTimeout(flush, 1500));

  // A game opened from a Today with Joyce card carries ?from=joyce. At the end of a round it
  // offers one big way back: send every answer still waiting, then close this tab (Joyce's tab
  // is still open behind it) or, where the browser won't close it, open Joyce here.
  function fromJoyce() {
    try { return new URLSearchParams(location.search).get("from") === "joyce"; } catch (_) { return false; }
  }

  let leaving = false;
  async function backToJoyce() {
    if (leaving) return;
    leaving = true;
    try {
      await Promise.race([flush({ keepalive: true }), new Promise((resolve) => setTimeout(resolve, 2500))]);
    } catch (_) { /* Joyce rechecks when he taps I'm done. */ }
    const kid = linkedKid(profiles().list)?.id || "";
    try { window.close(); } catch (_) { /* Not a tab this page may close. */ }
    setTimeout(() => {
      location.href = `/classroom/${kid ? `?kid=${encodeURIComponent(kid)}` : ""}`;
    }, 400);
  }

  // The button a game shows at the end of a round when Joyce sent the child. Null otherwise.
  function joyceButton({ className = "go play", image = "" } = {}) {
    if (!fromJoyce()) return null;
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", "Back to Joyce");
    if (image) {
      const img = document.createElement("img");
      img.src = image;
      img.alt = "";
      button.append(img);
    } else {
      button.textContent = "Back to Joyce";
    }
    button.addEventListener("click", backToJoyce);
    return button;
  }

  window.MightyProgress = { log, flush, currentKid: () => resolveKid(), fromJoyce, backToJoyce, joyceButton };
})();
