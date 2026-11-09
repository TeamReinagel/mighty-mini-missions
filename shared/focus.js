// The sounds and words a child's recent Lark and Nib episodes introduced.
// Practice games show these more often for two weeks after the episode. They are not
// mastered: the child's own first tries in the game still decide that.
// Joyce's /api/classroom `focus` answer is kept in localStorage so an offline game
// still has the last list. Load after progress.js.
(() => {
  const KEY = "mighty-focus.v1";
  const EMPTY = { sounds: [], words: [] };
  const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; }
  }

  function kidId() {
    try { return window.MightyProgress?.currentKid()?.id || ""; } catch { return ""; }
  }

  function clean(list) {
    return Array.isArray(list) ? list.map((x) => String(x).toLowerCase()).filter(Boolean).slice(0, 20) : [];
  }

  // The last saved list for this child, or nothing once its boost has ended.
  function get(id = kidId()) {
    const saved = readAll()[id];
    if (!saved || (saved.until && saved.until <= today())) return EMPTY;
    return { sounds: clean(saved.sounds), words: clean(saved.words) };
  }

  async function refresh(id = kidId()) {
    if (!id) return EMPTY;
    try {
      const res = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "focus", kid: id })
      });
      if (!res.ok) return get(id);
      const data = await res.json();
      const all = readAll();
      all[id] = { sounds: clean(data.sounds), words: clean(data.words), until: data.until || null };
      try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage full or blocked */ }
    } catch { /* offline: keep the saved list */ }
    return get(id);
  }

  // A weighted pick that gives focus items `boost` times their usual chance.
  function boosted(weight, isFocus, boost = 3) {
    return isFocus ? weight * boost : weight;
  }

  window.MightyFocus = { get, refresh, boosted };
  refresh();
})();
