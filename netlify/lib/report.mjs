import { chatJSON } from "./ai.mjs";
import { GAME_NAMES, curriculumText, nextSteps } from "./curriculum.mjs";
import { KIDS, allMilestones, guideFor, kidById } from "./kids.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
const STATE_KEY = "state/report.json";

// An item is mastered once the last 3 tries were right on the first try and at least
// 75% of all its tries were, so a lucky run on a shaky item doesn't count.
const MASTERY_STREAK = 3;
const MASTERY_ACCURACY = 0.75;
// A skill is "solid" (ready for the next step) at 90%+ first-try accuracy over 10+ tries.
const SOLID_ACCURACY = 0.9;
const SOLID_MIN_TRIES = 10;
// A skill is "working on" below 70% with at least 5 tries this week.
const STRUGGLE_ACCURACY = 0.7;
const STRUGGLE_MIN_TRIES = 5;

const unitOf = (e) => (e.game === "coin-record-run" ? e.item : e.skill);
const pct = (n) => `${Math.round(n * 100)}%`;

function dayKeys(from, to) {
  const days = [];
  for (let d = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()); d <= to.getTime(); d += DAY_MS) {
    days.push(new Date(d).toISOString().slice(0, 10));
  }
  return days;
}

async function loadEvents(store, since, until) {
  const seen = new Set();
  const events = [];
  for (const day of dayKeys(since, until)) {
    const { blobs } = await store.list({ prefix: `events/${day}/` });
    for (const { key } of blobs) {
      const receivedAt = Number(key.split("/").pop().split("-")[0]);
      if (!(receivedAt > since.getTime() && receivedAt <= until.getTime())) continue;
      const batch = (await store.get(key, { type: "json" })) || [];
      for (const e of batch) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        events.push(e);
      }
    }
  }
  return events.sort((a, b) => String(a.t).localeCompare(String(b.t)));
}

// Parent notes saved by Joyce from Slack (netlify/functions/joyce.mjs).
async function loadObservations(store, since, until) {
  const out = [];
  for (const day of dayKeys(since, until)) {
    const { blobs } = await store.list({ prefix: `observations/${day}/` });
    for (const { key } of blobs) {
      const receivedAt = Number(key.split("/").pop().split("-")[0]);
      if (!(receivedAt > since.getTime() && receivedAt <= until.getTime())) continue;
      const obs = await store.get(key, { type: "json" });
      if (obs) out.push(obs);
    }
  }
  return out.sort((a, b) => String(a.t).localeCompare(String(b.t)));
}

function updateItem(rec, e) {
  rec.lastSeen = e.t;
  rec.attempts += 1;
  if (e.correct === null) return;
  rec.graded += 1;
  if (e.correct) rec.firstTry += 1;
  rec.recent = [...rec.recent, e.correct].slice(-6);
  const streak = rec.recent.slice(-MASTERY_STREAK);
  if (!rec.mastered && streak.length === MASTERY_STREAK && streak.every(Boolean) && rec.firstTry / rec.graded >= MASTERY_ACCURACY) {
    rec.mastered = true;
    rec.masteredAt = e.t;
  } else if (rec.mastered && rec.recent.slice(-2).length === 2 && rec.recent.slice(-2).every((x) => !x)) {
    rec.mastered = false;
    rec.slippedAt = e.t;
  }
}

function groupBySkill(recs) {
  const groups = new Map();
  for (const r of recs) {
    const unit = unitOf(r);
    if (!groups.has(unit)) groups.set(unit, []);
    groups.get(unit).push(r.item);
  }
  return [...groups].map(([skill, items]) => ({ skill, items: items.slice(0, 25), count: items.length }));
}

/** Fold one child's week of events into their running record and summarize the week. */
function analyzeKid(kidState, events) {
  const items = kidState.items;
  const newlyMastered = [];
  const slipped = [];
  const skills = new Map();
  const missions = [];
  const days = new Set();

  for (const e of events) {
    days.add(String(e.t).slice(0, 10));
    const key = `${e.game}|${e.skill}|${e.item}`;
    const rec = items[key] || (items[key] = {
      game: e.game, skill: e.skill, item: e.item, attempts: 0, graded: 0, firstTry: 0, recent: [], mastered: false, firstSeen: e.t
    });
    const wasMastered = rec.mastered;
    updateItem(rec, e);
    if (!wasMastered && rec.mastered) newlyMastered.push(rec);
    if (wasMastered && !rec.mastered) slipped.push(rec);

    const unit = unitOf(e);
    const sk = skills.get(`${e.game}|${unit}`) || {
      game: GAME_NAMES[e.game] || e.game, unit, tries: 0, graded: 0, right: 0, items: new Map()
    };
    sk.tries += 1;
    if (e.correct !== null) {
      sk.graded += 1;
      if (e.correct) sk.right += 1;
      const it = sk.items.get(e.item) || { item: e.item, graded: 0, right: 0 };
      it.graded += 1;
      if (e.correct) it.right += 1;
      sk.items.set(e.item, it);
    }
    skills.set(`${e.game}|${unit}`, sk);

    if (e.game === "missions") {
      missions.push({ title: e.item, category: e.skill.replace(/^Missions: /, ""), rating: e.extra?.rating, note: e.extra?.note });
    }
  }

  const skillRows = [...skills.values()].map((sk) => {
    const accuracy = sk.graded ? sk.right / sk.graded : null;
    const hardest = [...sk.items.values()]
      .filter((it) => it.graded >= 2 && it.right / it.graded < 0.5)
      .sort((a, b) => a.right / a.graded - b.right / b.graded)
      .slice(0, 6)
      .map((it) => `${it.item} (${it.right}/${it.graded})`);
    return { game: sk.game, skill: sk.unit, tries: sk.tries, graded: sk.graded, accuracy, hardest };
  }).sort((a, b) => b.tries - a.tries);

  const allUnits = new Map();
  for (const rec of Object.values(items)) {
    const unit = unitOf(rec);
    const u = allUnits.get(unit) || { graded: 0, right: 0, mastered: 0, seen: 0 };
    u.graded += rec.graded;
    u.right += rec.firstTry;
    u.seen += 1;
    if (rec.mastered) u.mastered += 1;
    allUnits.set(unit, u);
  }
  const solid = new Set(
    [...allUnits].filter(([, u]) => u.graded >= SOLID_MIN_TRIES && u.right / u.graded >= SOLID_ACCURACY).map(([unit]) => unit)
  );
  // Practice-only skills (Train Set, Missions) have no grading, so they never count as solid.
  const tried = new Set(allUnits.keys());

  return {
    activeDays: days.size,
    totalTries: events.length,
    skills: skillRows.map((s) => ({ ...s, accuracy: s.accuracy === null ? "practice only" : pct(s.accuracy) })),
    workingOn: skillRows
      .filter((s) => s.graded >= STRUGGLE_MIN_TRIES && s.accuracy < STRUGGLE_ACCURACY)
      .map((s) => ({ game: s.game, skill: s.skill, accuracy: pct(s.accuracy), tries: s.graded, hardestItems: s.hardest })),
    trickyItems: skillRows.filter((s) => s.hardest.length).map((s) => ({ skill: s.skill, items: s.hardest })),
    newlyMastered: groupBySkill(newlyMastered),
    newlyMasteredCount: newlyMastered.length,
    slipped: groupBySkill(slipped),
    masteredAllTime: [...allUnits].filter(([, u]) => u.mastered > 0).map(([unit, u]) => `${unit}: ${u.mastered} of ${u.seen} items seen`),
    readyForNext: nextSteps(solid, tried),
    missions
  };
}

function weekLabel(since, until, tz) {
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz });
  return `${fmt(since)} \u2013 ${fmt(until)}`;
}

// ---------------------------------------------------------------- writing the report

const BULLET = "\u2022";

const SYSTEM_PROMPT = `You are Joyce, the family's learning assistant. You write a short weekly homeschool progress note for Stephanie, a mom of young kids, posted to the family Slack.
Data sources: Mighty Mini Missions (short learning games plus off-screen "missions"), and things Stephanie noticed in everyday life and told you ("observations").

Voice and values:
- Warm, plain, specific. Strengths first. No guilt, no streak talk, no "falling behind" language.
- Struggles are normal information, not problems. Describe what was tricky, not what the child "failed".
- A week without app use is fine; just say so briefly.
- Prefer playful, short, off-screen ideas (movement, real objects, games around the house) when suggesting practice.
- Observations are real-life evidence and matter as much as game data. Celebrate them.

Rules:
- Only state things supported by the data. Never invent numbers, words, or skills.
- "Mastered" means right on the first try the last 3 times. "Practice only" skills have no right/wrong.
- "Try next": choose 1-2 from the child's milestone guide (next unmet goals from the family's monthly milestones spreadsheet, earliest first), fitting what the data shows they're ready for and the current month. Mention a game step from the curriculum order when a game supports it. If the child's guide is empty, suggest gently from the data.
- Milestones met: list a milestone id only when this week's game data or an observation clearly shows it (for example, mastered most letters, or "Max counted coins on his own" for a coin-counting goal). Use ids only from that child's guide. When unsure, leave it out.
- Report text uses Slack mrkdwn: *bold* for headings, "${BULLET}" bullets, no markdown headers (#), no tables.

Report format for each child, in this order, about 120-180 words per child:
*<Name>*  (one line: days active and total practice; mention observations if any)
*Progress:* 2-4 bullets (milestones met, newly mastered, strong skills, observations)
*Working on:* 1-3 bullets (tricky skills or items, with one quick off-screen idea for the trickiest)
*Try next:* 1-2 bullets
Separate children with a blank line. No greeting or sign-off.

Reply with JSON only:
{"report": "<the Slack text for all children>", "milestonesMet": [{"child": "<name>", "id": "<milestone id>", "evidence": "<short reason>"}]}`;

const formatGuide = ({ next, later }) => {
  if (!next.length) return "Milestone guide: (none)";
  return `Milestone guide, next up (pick "Try next" from these):\n${next.map((m) => `${m.id} (${m.grade}, ${m.area}, ${m.month}): ${m.text}`).join("\n")}` +
    (later.length ? `\nLater milestones (only for crediting skills shown early):\n${later.map((m) => `${m.id}: ${m.text}`).join("\n")}` : "");
};

async function writeWithAI({ summaries, env, fetchImpl, month, lessons, timeoutMs }) {
  const children = summaries.map(({ guide, ...data }) =>
    `### ${data.name}\nData (JSON):\n${JSON.stringify(data)}\n${formatGuide(guide)}`
  ).join("\n\n");
  const out = await chatJSON({
    env,
    fetchImpl,
    timeoutMs: timeoutMs || Number(env.REPORT_AI_TIMEOUT_MS || 60000),
    system: SYSTEM_PROMPT,
    user: `Current month: ${month}. The family homeschools year-round; the spreadsheet runs September to August.\n\n` +
      (lessons ? `${lessons}\n\n` : "") +
      `Game curriculum order (earlier steps come first):\n${curriculumText()}\n\n${children}`
  });
  if (typeof out.report !== "string" || !out.report.trim()) throw new Error("OpenAI returned an empty report");
  return { report: out.report.trim(), milestonesMet: Array.isArray(out.milestonesMet) ? out.milestonesMet : [] };
}

// Used when the AI call fails, so a report still goes out.
function writePlain(summaries) {
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return summaries.map((s) => {
    const w = s.week;
    const noticed = s.observations.map((o) => `${BULLET} ${o.text}`);
    if (!w.totalTries) {
      return noticed.length ? [`*${s.name}*  No app activity this week.`, "*Noticed at home:*", ...noticed].join("\n") : `*${s.name}*\nNo app activity this week.`;
    }
    const lines = [`*${s.name}*  ${plural(w.activeDays, "day")} active, ${plural(w.totalTries, "practice moment")}`];
    const strong = w.skills.filter((k) => k.accuracy !== "practice only" && parseInt(k.accuracy, 10) >= 90).slice(0, 3);
    lines.push("*Progress:*");
    w.newlyMastered.slice(0, 3).forEach((g) => lines.push(`${BULLET} Mastered in ${g.skill}: ${g.items.slice(0, 12).join(", ")}${g.count > 12 ? ` (+${g.count - 12} more)` : ""}`));
    strong.forEach((k) => lines.push(`${BULLET} ${k.skill} (${k.game}): ${k.accuracy} right on the first try`));
    if (lines.length === 2) lines.push(`${BULLET} Practiced ${w.skills.slice(0, 3).map((k) => k.skill).join(", ")}`);
    if (noticed.length) lines.push("*Noticed at home:*", ...noticed);
    lines.push("*Working on:*");
    const shown = new Set();
    w.workingOn.slice(0, 3).forEach((k) => {
      shown.add(k.skill);
      lines.push(`${BULLET} ${k.skill} (${k.accuracy})${k.hardestItems.length ? `: ${k.hardestItems.join(", ")}` : ""}`);
    });
    w.trickyItems.filter((t) => !shown.has(t.skill)).slice(0, 3).forEach((t) => lines.push(`${BULLET} Tricky in ${t.skill}: ${t.items.join(", ")}`));
    if (lines[lines.length - 1] === "*Working on:*") lines.push(`${BULLET} Nothing stood out as tricky this week.`);
    lines.push("*Try next:*");
    if (w.readyForNext.length) w.readyForNext.slice(0, 2).forEach((n) => lines.push(`${BULLET} ${n.next} (solid on ${n.after})`));
    else if (s.guide.next.length) {
      const m = s.guide.next[0];
      lines.push(`${BULLET} ${m.text} (${m.grade} ${m.area}, ${m.month})`);
    }
    else lines.push(`${BULLET} Keep going with the current skills.`);
    return lines.join("\n");
  }).join("\n\n");
}

async function postToSlack(webhookUrl, text, fetchImpl) {
  const res = await fetchImpl(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mrkdwn: true })
  });
  if (!res.ok) throw new Error(`Slack ${res.status}: ${await res.text()}`);
}

// ---------------------------------------------------------------- main entry

/**
 * Fold game events and observations since the last report into per-child summaries.
 * Works on a copy of the saved records, so nothing is changed until the caller saves `kids`.
 */
async function collectWeek({ store, state, since, now, tz }) {
  const [events, observations] = await Promise.all([loadEvents(store, since, now), loadObservations(store, since, now)]);

  const byKid = new Map();
  for (const e of events) {
    if (!byKid.has(e.kid)) byKid.set(e.kid, []);
    byKid.get(e.kid).push(e);
  }
  const obsByKid = new Map();
  for (const o of observations) {
    for (const id of o.kids) {
      if (!obsByKid.has(id)) obsByKid.set(id, []);
      obsByKid.get(id).push({ date: new Date(o.t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz }), text: o.text });
    }
  }

  const kids = structuredClone(state.kids);
  const summaries = [];
  const kidIds = new Set([...KIDS.filter((k) => !k.quiet).map((k) => k.id), ...Object.keys(kids), ...byKid.keys(), ...obsByKid.keys()]);
  for (const kidId of kidIds) {
    const kidEvents = byKid.get(kidId) || [];
    const kidObs = obsByKid.get(kidId) || [];
    if (kidId === "unknown" && !kidEvents.length) continue;
    const profile = kidById(kidId);
    if (profile?.quiet && !kidEvents.length && !kidObs.length) continue;
    const kidState = kids[kidId] || (kids[kidId] = { name: profile?.name || kidEvents[0]?.kidName || kidId, items: {} });
    kidState.milestones = kidState.milestones || {};
    if (kidEvents.length) kidState.name = profile?.name || kidEvents[kidEvents.length - 1].kidName || kidState.name;
    summaries.push({
      kidId,
      name: kidId === "unknown" ? "Unassigned (a device where no child was picked on the home screen)" : kidState.name,
      age: profile?.age,
      whereTheyAre: profile?.where,
      note: profile?.note,
      week: analyzeKid(kidState, kidEvents),
      observations: kidObs,
      milestonesMetSoFar: Object.keys(kidState.milestones).length,
      guide: guideFor(profile, new Set(Object.keys(kidState.milestones)))
    });
  }
  return { events, observations, kids, summaries };
}

const loadState = async (store) => (await store.get(STATE_KEY, { type: "json" })) || { lastReportAt: null, kids: {} };

/**
 * Where each child is right now, for Joyce's skills: practice and observations since the last
 * report, next milestones, and the last report's text. Read-only.
 */
/** Day-by-day game practice per child (local days, newest first), for "what did they do today?". */
function dailyActivity(events, tz) {
  const dayOf = (t) => new Date(t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  const byKid = new Map();
  for (const e of events) {
    const kid = byKid.get(e.kid) || { lastPlayed: null, days: new Map() };
    kid.lastPlayed = e.t;
    const day = kid.days.get(dayOf(e.t)) || new Map();
    const key = `${GAME_NAMES[e.game] || e.game}|${e.skill}`;
    const row = day.get(key) || { game: GAME_NAMES[e.game] || e.game, skill: e.skill, tries: 0, graded: 0, right: 0, items: new Set() };
    row.tries += 1;
    if (e.correct !== null) {
      row.graded += 1;
      if (e.correct) row.right += 1;
    }
    if (row.items.size < 12) row.items.add(e.item);
    day.set(key, row);
    kid.days.set(dayOf(e.t), day);
    byKid.set(e.kid, kid);
  }
  const out = new Map();
  for (const [kidId, kid] of byKid) {
    out.set(kidId, {
      lastPlayed: new Date(kid.lastPlayed).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz }),
      days: [...kid.days].reverse().map(([day, rows]) => ({
        day,
        practice: [...rows.values()].map((r) => ({
          game: r.game,
          skill: r.skill,
          tries: r.tries,
          firstTryRight: r.graded ? `${r.right} of ${r.graded}` : "practice only",
          examples: [...r.items]
        }))
      }))
    });
  }
  return out;
}

const CHOICE_DAYS = 28;

/** Which games each child keeps coming back to (days played and tries per game, most days first). */
function gameChoices(events, tz) {
  const dayOf = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: tz });
  const byKid = new Map();
  for (const e of events) {
    const games = byKid.get(e.kid) || new Map();
    const name = GAME_NAMES[e.game] || e.game;
    const g = games.get(name) || { game: name, days: new Set(), tries: 0 };
    g.days.add(dayOf(e.t));
    g.tries += 1;
    games.set(name, g);
    byKid.set(e.kid, games);
  }
  const out = new Map();
  for (const [kidId, games] of byKid) {
    out.set(kidId, [...games.values()]
      .map((g) => ({ game: g.game, daysPlayed: g.days.size, tries: g.tries }))
      .sort((a, b) => b.daysPlayed - a.daysPlayed || b.tries - a.tries));
  }
  return out;
}

export async function buildKidContext({ store, env = process.env, now = new Date() }) {
  const tz = env.REPORT_TIMEZONE || "America/Chicago";
  const state = await loadState(store);
  const since = state.lastReportAt ? new Date(state.lastReportAt) : new Date(now.getTime() - 7 * DAY_MS);
  const { summaries } = await collectWeek({ store, state, since, now, tz });
  const recent = await loadEvents(store, new Date(now.getTime() - CHOICE_DAYS * DAY_MS), now);
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const activity = dailyActivity(recent.filter((e) => Date.parse(e.t) > weekAgo), tz);
  const choices = gameChoices(recent, tz);
  const { blobs } = await store.list({ prefix: "reports/" });
  const lastKey = blobs.map((b) => b.key).sort().pop();
  const lastReport = lastKey ? (await store.get(lastKey, { type: "json" }))?.text || "" : "";
  const noPlay = { lastPlayed: "not in the last 7 days", days: [] };
  return {
    since: since.toISOString(),
    today: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }),
    kids: summaries.filter((s) => s.kidId !== "unknown").map((s) => ({
      name: s.name,
      profile: { age: s.age, whereTheyAre: s.whereTheyAre, note: s.note },
      progress: s.week,
      activity: activity.get(s.kidId) || noPlay,
      gameChoices: choices.get(s.kidId) || [],
      observations: s.observations,
      milestones: { metSoFar: s.milestonesMetSoFar, nextUp: s.guide.next.map((m) => `${m.id} (${m.area}): ${m.text}`) }
    })),
    unassignedDevice: activity.get("unknown") || null,
    lastReport: lastReport.slice(0, 6000)
  };
}

/**
 * Build the weekly report from synced game events and Joyce's observations. With send=true
 * it posts to Slack and advances the report window; with send=false it only returns a preview.
 * `lessons` is the text of Joyce's approved lessons, which the write-up follows.
 */
export async function runWeeklyReport({ store, env = process.env, now = new Date(), send = true, fetchImpl = fetch, lessons = "", aiTimeoutMs }) {
  const state = await loadState(store);
  const since = state.lastReportAt ? new Date(state.lastReportAt) : new Date(now.getTime() - 7 * DAY_MS);
  const tz = env.REPORT_TIMEZONE || "America/Chicago";
  const { events, observations, kids, summaries } = await collectWeek({ store, state, since, now, tz });

  const header = `:books: *Joyce's weekly learning report* \u00b7 ${weekLabel(since, now, tz)}`;
  const footer = `_Tell me what you notice during the week: post here or message me with a child's name, like "Max counted coins on his own." Ask me "what should we do today?" any morning, and correct me anytime; I'll ask before I remember anything._`;
  const month = now.toLocaleDateString("en-US", { month: "long", timeZone: tz });

  let body;
  let usedAI = false;
  const metThisWeek = [];
  if (!events.length && !observations.length) {
    body = "No game, mission, or observation activity this week. If the kids did play, open Mighty Mini Missions on each tablet while it's online so their progress can sync.";
  } else {
    try {
      const ai = await writeWithAI({ summaries, env, fetchImpl, month, lessons, timeoutMs: aiTimeoutMs });
      body = ai.report;
      usedAI = true;
      const milestoneById = new Map(allMilestones().map((m) => [m.id, m]));
      for (const m of ai.milestonesMet) {
        const s = summaries.find((x) => x.name.toLowerCase() === String(m.child).toLowerCase());
        if (!s || ![...s.guide.next, ...s.guide.later].some((g) => g.id === m.id)) continue;
        kids[s.kidId].milestones[m.id] = { date: now.toISOString().slice(0, 10), evidence: String(m.evidence || "").slice(0, 300) };
        metThisWeek.push({ child: s.name, ...milestoneById.get(m.id), evidence: m.evidence });
      }
    } catch (err) {
      console.error("AI write-up failed, sending plain report:", err);
      body = writePlain(summaries);
    }
  }
  const text = `${header}\n\n${body}\n\n${footer}`;

  if (send) {
    if (!env.SLACK_WEBHOOK_URL) throw new Error("SLACK_WEBHOOK_URL is not set");
    await postToSlack(env.SLACK_WEBHOOK_URL, text, fetchImpl);
    await store.setJSON(STATE_KEY, { lastReportAt: now.toISOString(), kids });
    await store.setJSON(`reports/${now.toISOString().slice(0, 10)}.json`, {
      since: since.toISOString(), until: now.toISOString(), summaries: summaries.map(({ guide, ...s }) => s), metThisWeek, text, usedAI
    });
  }

  return { text, summaries, events: events.length, observations: observations.length, metThisWeek, usedAI, sent: send };
}
