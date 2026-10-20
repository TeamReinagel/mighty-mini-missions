// Words a child is having trouble with, for Ghost Word Run's Tricky Words trail.
// A word joins when the child asks Joyce about it on the tablet, and leaves once
// they pick it right on the first try 3 times in a row in Ghost Word Run after
// their last ask. Missed game words fill in behind those. The game tops the trail
// up to 30 with Reading.com words from lesson 97 back (see ghost-word-run/content.js).

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 21;
const CLEAR_STREAK = 3;
const MASTERY_ACCURACY = 0.75;
const MAX_TROUBLE = 40;
const MAX_PRACTICE = 40;
const LOAD_CONCURRENCY = 20;

const norm = (word) => String(word || "").trim().toLowerCase();

function dayKeys(now, days) {
  const out = [];
  for (let i = days; i >= 0; i--) out.push(new Date(now - i * DAY_MS).toISOString().slice(0, 10));
  return out;
}

async function loadPrefix(store, prefix, since) {
  const { blobs } = await store.list({ prefix });
  const keys = blobs.map((b) => b.key).filter((key) => Number(key.split("/").pop().split("-")[0]) >= since);
  const out = [];
  for (let i = 0; i < keys.length; i += LOAD_CONCURRENCY) {
    out.push(...(await Promise.all(keys.slice(i, i + LOAD_CONCURRENCY).map((key) => store.get(key, { type: "json" })))));
  }
  return out.filter(Boolean);
}

/** The word a tablet help moment was about, or "" for math and unclear marks. */
export function askedWord(obs) {
  if (!obs || obs.from !== "tablet") return "";
  if (typeof obs.word === "string") return norm(obs.word);
  const match = String(obs.saw || "").match(/^the (?:marked )?word\s+["'“‘]?([a-z]+(?:'[a-z]+)?)/i);
  const word = norm(match?.[1]);
  return /^(unknown|unreadable|unclear|blurry|marked|this|that)$/.test(word) ? "" : word;
}

function cleared(results) {
  const last = results.slice(-CLEAR_STREAK);
  return last.length === CLEAR_STREAK && last.every(Boolean);
}

export function buildTroubleWords({ kidId, observations = [], events = [], masteredBefore = [] }) {
  const asked = new Map();
  for (const obs of observations) {
    if (!Array.isArray(obs.kids) || !obs.kids.includes(kidId)) continue;
    const word = askedWord(obs);
    if (!word) continue;
    const rec = asked.get(word) || { word, asks: 0, last: "" };
    rec.asks += 1;
    if (String(obs.t) > rec.last) rec.last = String(obs.t);
    asked.set(word, rec);
  }

  const game = new Map();
  const ordered = events
    .filter((e) => e && e.kid === kidId && e.game === "ghost-word-run" && String(e.skill).startsWith("Sight words") && typeof e.correct === "boolean")
    .sort((a, b) => String(a.t).localeCompare(String(b.t)));
  for (const e of ordered) {
    const word = norm(e.item);
    if (!word) continue;
    const rec = game.get(word) || { word, results: [], times: [], misses: 0, lastMiss: "" };
    rec.results.push(e.correct);
    rec.times.push(String(e.t));
    if (!e.correct) {
      rec.misses += 1;
      rec.lastMiss = String(e.t);
    }
    game.set(word, rec);
  }

  const trouble = [...asked.values()]
    .filter((rec) => {
      const played = game.get(rec.word);
      if (!played) return true;
      const since = played.results.filter((_, i) => played.times[i] > rec.last);
      return !cleared(since);
    })
    .sort((a, b) => b.last.localeCompare(a.last))
    .slice(0, MAX_TROUBLE)
    .map(({ word, asks }) => ({ word, asks }));

  const inTrouble = new Set(trouble.map((t) => t.word));
  const practice = [...game.values()]
    .filter((rec) => rec.misses && !inTrouble.has(rec.word) && !cleared(rec.results))
    .sort((a, b) => b.misses - a.misses || b.lastMiss.localeCompare(a.lastMiss))
    .slice(0, MAX_PRACTICE)
    .map((rec) => rec.word);

  const mastered = new Set(masteredBefore.map(norm));
  for (const rec of game.values()) {
    const right = rec.results.filter(Boolean).length;
    if (cleared(rec.results) && right / rec.results.length >= MASTERY_ACCURACY) mastered.add(rec.word);
    else if (rec.results.slice(-2).length === 2 && rec.results.slice(-2).every((x) => !x)) mastered.delete(rec.word);
  }
  for (const word of [...inTrouble, ...practice]) mastered.delete(word);

  return { trouble, practice, mastered: [...mastered] };
}

export async function loadTroubleWords({ store, kidId, now = Date.now() }) {
  const since = now - LOOKBACK_DAYS * DAY_MS;
  const days = dayKeys(now, LOOKBACK_DAYS);
  const [observations, eventBatches, state] = await Promise.all([
    Promise.all(days.map((day) => loadPrefix(store, `observations/${day}/`, since))).then((all) => all.flat()),
    Promise.all(days.map((day) => loadPrefix(store, `events/${day}/`, since))).then((all) => all.flat()),
    store.get("state/report.json", { type: "json" }).catch(() => null)
  ]);
  const events = eventBatches.flatMap((batch) => (Array.isArray(batch) ? batch : []));
  const items = state?.kids?.[kidId]?.items || {};
  const masteredBefore = Object.values(items)
    .filter((rec) => rec.game === "ghost-word-run" && rec.mastered && String(rec.skill).startsWith("Sight words"))
    .map((rec) => rec.item);
  return buildTroubleWords({ kidId, observations, events, masteredBefore });
}
