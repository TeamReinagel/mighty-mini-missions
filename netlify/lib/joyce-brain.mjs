import { chatJSON, chatText } from "./ai.mjs";
import { KIDS, findKidsIn } from "./kids.mjs";
import {
  BUILTIN_SKILLS, DATA_SOURCES, SCHEDULES, cleanSkill, lessonsText, loadLog, loadMemory, logTurn, newId, saveMemory
} from "./joyce-memory.mjs";
import { buildKidContext, runWeeklyReport } from "./report.mjs";
import { post, respond, slackGet } from "./slack.mjs";

// Joyce's behavior. Everything here runs in the background worker (netlify/functions/joyce-work.mjs),
// so it can take as long as the AI needs. Nothing new is adopted without an Approve click.

const BULLET = "\u2022";
const CURSOR_API = "https://api.cursor.com/v1";
const DEFAULT_REPO = "https://github.com/stephaniereinagel/mighty-mini-missions";
const CODE_GIVE_UP_DAYS = 3;
const REFLECT_LOG_DAYS = 28;

const VOICE = `You are Joyce, the Reinagel family's learning assistant in their Slack. Stephanie (mom) homeschools their young kids and uses Mighty Mini Missions, a set of short learning games plus off-screen "missions". Other family members talk to you too.
Voice: warm, plain, specific, brief. Strengths first. No guilt, streak talk, or "falling behind" language. Prefer playful, short, off-screen ideas.`;

// What Joyce knows about herself, so she can answer "how do you work?" honestly and specifically.
const ABOUT_JOYCE = `How you work (answer questions about yourself from this; don't invent beyond it):
- What you do: every Friday at 3pm Central you post a learning report per child (progress, what's tricky, what to try next). Family members tell you things they notice in everyday life ("Max counted coins on his own") and you save them for the report. You suggest activities for today on request. You learn lessons, new abilities, and code changes, but only after Stephanie clicks Approve.
- How you know what the kids did: each child plays Mighty Mini Missions on their own tablet, picked on the home screen. The games (Ghost Word Run for sight words and rhyming, Monster Hunt for letters and sounds, Coin Record Run for money, Monster Maker for early math and reading, Train Set for colors and shapes, plus off-screen Missions) log every answer: which child, which skill, which item, and whether it was right on the first try. The tablets sync that to you when online. You also use the observations people tell you, and a Kindergarten to 2nd-grade monthly milestones spreadsheet for what comes next. You can't see anything that happens off the app unless someone tells you.
- Mastery: an item is mastered when it's right on the first try the last 3 times and 75%+ overall.
- Tech stack: a static HTML/CSS/JavaScript site (no framework) hosted on Netlify, with Netlify Functions (Node.js) for your logic and Netlify Blobs for storage. You're a Slack app (Events API plus interactive buttons; slow work runs in Netlify background functions). Your writing comes from OpenAI (gpt-4o-mini by default). Code changes go to a Cursor cloud agent that opens a pull request on GitHub (stephaniereinagel/mighty-mini-missions) for Stephanie to review; that needs a Cursor API key in Netlify. The code was written with Cursor.
- Privacy: game answers, observations, and your conversations with the family live in the site's Netlify Blobs storage. You don't keep general family chat.`;

const SLACK_FORMAT = `Write Slack mrkdwn: *bold*, "${BULLET}" bullets, no # headers, no tables. Keep it short enough to read on a phone.`;

const joinNames = (names) => (names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`);
const kidList = () => KIDS.map((k) => `${k.id} (${k.name}, age ${k.age})`).join(", ");
const validKids = (ids) => [...new Set((Array.isArray(ids) ? ids : []).map(String).filter((id) => KIDS.some((k) => k.id === id)))];
const clip = (s, n) => String(s || "").trim().slice(0, n);
const localDate = (env, d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: env.REPORT_TIMEZONE || "America/Chicago" });

// ---------------------------------------------------------------- understanding a message

const UNDERSTAND_PROMPT = `${VOICE}

${ABOUT_JOYCE}

You read one new Slack message from the family (with the conversation before it, when there is one) and decide what to do. Children (id, name, age): {{KIDS}}.

What you can do:
1. observations: save things a family member noticed a child do or say in everyday life that show learning, growth, or a struggle (for example "Max counted coins on his own"). One entry per child-moment, using child ids. Plans, logistics, and chit-chat are not observations.
2. useSkill: when the message asks for something one of your abilities does, pick its id and restate the request.
3. lesson: when someone corrects you, tells you how they want you to work or write, or shares a lasting fact about a child that should change your future suggestions ("Gabi hates worksheets", "skip screen ideas before noon", "that milestone wasn't really met"). A lesson is one short, specific instruction to yourself. A one-time moment is an observation, not a lesson. Skip lessons you already have.
4. newSkill: when someone wants something useful that none of your abilities covers but that you could do by reading your data sources and writing a reply. Also use it to change an ability: set "replaces" to its id and give the full new version (for example, "send me the activity every morning" = the "today" ability with schedule "weekday-morning").
5. codeChange: when the request needs more than reading data and writing: changes to the games or app, tracking something new, new connections to other services. Describe it clearly for a developer.
6. memory: "list" when asked what you've learned or can do; "forget" with a lesson or ability id when asked to forget or stop one.
7. reply: answer what was actually asked, directly and specifically (for "how do you know what the kids did?", explain the tablets and game logging; for "what tech stack?", name the stack). Use the person's name when you know it. Don't reintroduce yourself if you already did earlier in the conversation, and don't repeat a generic list of what you can do. If you're proposing something, a one-line lead-in is enough.
8. unmet: if you're asked for something you can't do and it isn't worth proposing, say what in a few words.

When to act:
- Direct messages are always to you.
- In a channel, act only when the message is said to you: it mentions @Joyce and asks or tells you something, or it follows up on what you just said in the conversation. Also save observations about a child wherever they appear.
- When people talk to each other about you ("@Silas, she will send us a report..."), that isn't said to you: stay quiet (return everything empty) unless it also asks you something.
- Otherwise return everything empty.
- Propose at most one new thing per message (lesson, newSkill, or codeChange), and never something on the declined list unless they ask again plainly.
- Abilities can only read these data sources: {{DATA}}. Schedules: {{SCHEDULES}}.

Reply with JSON only, using null or empty values for anything that doesn't apply:
{"observations": [{"kids": ["<id>"], "text": "<what happened, in their words>"}],
 "useSkill": {"id": "<ability id>", "request": "<what they want>"},
 "lesson": {"text": "<instruction to yourself>", "kids": ["<id>"]},
 "newSkill": {"name": "", "when": "<when to use it>", "instructions": "<how to do it, written to yourself>", "data": ["<source>"], "schedule": "on-request|weekday-morning|friday", "replaces": "<ability id or empty>", "why": "<one line>"},
 "codeChange": {"title": "", "details": "<what to build and how it should behave>", "why": "<one line>"},
 "memory": {"action": "list|forget", "id": "<lesson or ability id>"},
 "reply": "",
 "unmet": ""}`;

function describeMemory(mem) {
  const skills = mem.skills.map((s) => `${s.id}: ${s.name} (${SCHEDULES[s.schedule] || s.schedule}) - ${s.when}`).join("\n");
  const lessons = mem.lessons.map((l) => `${l.id}: ${l.text}`).join("\n") || "(none yet)";
  const pending = Object.values(mem.proposals).filter((p) => p.status === "pending").map((p) => `${p.type}: ${proposalTitle(p)}`).join("\n") || "(none)";
  const declined = Object.values(mem.proposals).filter((p) => p.status === "declined").map((p) => `${p.type}: ${proposalTitle(p)}`).join("\n") || "(none)";
  return `Your abilities:\n${skills}\n\nYour lessons:\n${lessons}\n\nWaiting for approval:\n${pending}\n\nDeclined recently:\n${declined}`;
}

async function understand({ text, context, mem, env, fetchImpl }) {
  const system = UNDERSTAND_PROMPT
    .replace("{{KIDS}}", kidList())
    .replace("{{DATA}}", Object.entries(DATA_SOURCES).map(([k, v]) => `${k} (${v})`).join("; "))
    .replace("{{SCHEDULES}}", Object.entries(SCHEDULES).map(([k, v]) => `${k} (${v})`).join("; "));
  return chatJSON({
    env,
    fetchImpl,
    temperature: 0.2,
    system,
    user: `${describeMemory(mem)}\n\n${context}\n\nNew message:\n${text}`
  });
}

// ---------------------------------------------------------------- abilities (prompt-defined skills)

function pickData(ctx, sources) {
  const want = new Set(sources);
  return {
    today: ctx.today,
    dataSince: ctx.since,
    kids: ctx.kids.map((k) => ({
      name: k.name,
      ...(want.has("profiles") ? { profile: k.profile } : {}),
      ...(want.has("progress") ? { progress: k.progress } : {}),
      ...(want.has("observations") ? { observations: k.observations } : {}),
      ...(want.has("milestones") ? { milestones: k.milestones } : {})
    })),
    ...(want.has("lastReport") ? { lastReport: ctx.lastReport } : {})
  };
}

export async function runSkill({ skill, request, mem, store, env, fetchImpl, ctx }) {
  const context = ctx || (await buildKidContext({ store, env }));
  const lessons = lessonsText(mem);
  return chatText({
    env,
    fetchImpl,
    system: `${VOICE}\n${lessons ? `\n${lessons}\n` : ""}\nYou're using your ability "${skill.name}".\nInstructions: ${skill.instructions}\n\nOnly use the data you're given; never invent numbers, words, skills, or milestones. ${SLACK_FORMAT}`,
    user: `Request: ${request || "(scheduled run; nobody asked, so write it for Stephanie)"}\n\nData (JSON):\n${JSON.stringify(pickData(context, skill.data))}`
  });
}

// ---------------------------------------------------------------- proposals and approval

const proposalTitle = (p) => (p.type === "lesson" ? p.data.text : p.type === "skill" ? p.data.name : p.data.title);

function proposalText(p, mem) {
  const why = p.why ? `\n_Why:_ ${p.why}` : "";
  if (p.type === "lesson") {
    const who = p.data.kids.map((id) => KIDS.find((k) => k.id === id)?.name).filter(Boolean);
    return `:bulb: *Should I remember this?*${who.length ? ` (about ${joinNames(who)})` : ""}\n>${p.data.text}${why}`;
  }
  if (p.type === "skill") {
    const s = p.data;
    const old = s.replaces && mem.skills.find((x) => x.id === s.replaces);
    return `:sparkles: *${old ? `Change my "${old.name}" ability` : `New ability: ${s.name}`}*\n` +
      `*What I'd do:* ${s.instructions}\n*When:* ${s.when || "when asked"} (${SCHEDULES[s.schedule]})\n` +
      `*What I'd read:* ${s.data.join(", ")}${why}\n_No code changes; this is a set of instructions I follow._`;
  }
  return `:hammer_and_wrench: *Code change: ${p.data.title}*\n${p.data.details}${why}\n` +
    "_If you approve, a Cursor coding agent makes the change and opens a pull request for you to review. Nothing changes on the site until you merge it._";
}

const blocksFor = (text, buttons) => [
  { type: "section", text: { type: "mrkdwn", text: text.slice(0, 2900) } },
  ...(buttons ? [{ type: "actions", elements: buttons }] : [])
];

async function propose({ store, mem, env, fetchImpl, type, data, why, where, from, sourceText }) {
  const p = {
    id: newId("p"), type, data, why: clip(why, 300), status: "pending", createdAt: new Date().toISOString(),
    from, sourceText: clip(sourceText, 1000)
  };
  mem.proposals[p.id] = p;
  await saveMemory(store, mem);
  const text = proposalText(p, mem);
  await post({
    ...where,
    text,
    blocks: blocksFor(text, [
      { type: "button", text: { type: "plain_text", text: type === "code" ? "Approve and start" : "Approve" }, style: "primary", action_id: "joyce_approve", value: p.id },
      { type: "button", text: { type: "plain_text", text: "Not now" }, action_id: "joyce_decline", value: p.id }
    ])
  }, { env, fetchImpl });
  return p;
}

/** A click on Approve or Not now. */
export async function handleAction({ store, env = process.env, fetchImpl = fetch, payload }) {
  const action = payload.actions?.[0];
  const user = payload.user?.id;
  const reply = (body) => respond(payload.response_url, body, fetchImpl);
  if (!action || !["joyce_approve", "joyce_decline"].includes(action.action_id)) return;

  const approvers = String(env.JOYCE_APPROVERS || "").split(/[\s,]+/).filter(Boolean);
  if (approvers.length && !approvers.includes(user)) {
    return reply({ response_type: "ephemeral", replace_original: false, text: "Only Stephanie can approve what I learn. :slightly_smiling_face:" });
  }

  const mem = await loadMemory(store);
  const p = mem.proposals[action.value];
  if (!p) return reply({ replace_original: true, text: "This suggestion has expired." });
  if (p.status !== "pending") return reply({ response_type: "ephemeral", replace_original: false, text: `Already ${p.status}.` });

  const original = proposalText(p, mem);
  const finish = async (status, line) => {
    p.status = status;
    p.decidedAt = new Date().toISOString();
    p.decidedBy = user;
    await saveMemory(store, mem);
    await reply({ replace_original: true, text: `${original}\n\n${line}`, blocks: blocksFor(`${original}\n\n${line}`) });
  };

  if (action.action_id === "joyce_decline") {
    return finish("declined", `:no_entry_sign: Not now (<@${user}>). I won't suggest this again unless you ask.`);
  }

  if (p.type === "lesson") {
    mem.lessons.push({ id: newId("l"), text: p.data.text, kids: p.data.kids, createdAt: new Date().toISOString(), approvedBy: user });
    return finish("approved", ":white_check_mark: Learned. I'll follow this from now on.");
  }

  if (p.type === "skill") {
    const { replaces, ...skill } = p.data;
    const i = mem.skills.findIndex((s) => s.id === (replaces || skill.id));
    if (i >= 0) mem.skills[i] = skill;
    else mem.skills.push(skill);
    return finish("approved", `:white_check_mark: ${i >= 0 ? "Updated" : "New ability ready"}: *${skill.name}* (${SCHEDULES[skill.schedule]}).`);
  }

  // Code change: hand it to a Cursor cloud agent, which opens a PR.
  if (!env.CURSOR_API_KEY) {
    return reply({ response_type: "ephemeral", replace_original: false, text: "I need a CURSOR_API_KEY in Netlify before I can start code changes. Add it, then click Approve again." });
  }
  p.status = "approved";
  await saveMemory(store, mem);
  try {
    const agent = await startCodeAgent({ proposal: p, env, fetchImpl });
    mem.codeRequests.push({
      id: p.id, title: p.data.title, agentId: agent.agentId, runId: agent.runId, agentUrl: agent.url, status: "running",
      startedAt: new Date().toISOString(), channel: payload.channel?.id, threadTs: payload.message?.thread_ts || payload.message?.ts
    });
    await finish("approved", `:rocket: Approved (<@${user}>). A Cursor coding agent is on it: <${agent.url}|follow along>. I'll post the pull request here when it's ready for you to review.`);
  } catch (err) {
    console.error("Starting the code agent failed:", err);
    p.status = "pending";
    await saveMemory(store, mem);
    await reply({ response_type: "ephemeral", replace_original: false, text: `I couldn't start the coding agent: ${clip(err.message, 300)}. You can click Approve to try again.` });
  }
}

// ---------------------------------------------------------------- code changes via Cursor cloud agents

const cursorAuth = (env) => `Basic ${Buffer.from(`${env.CURSOR_API_KEY}:`).toString("base64")}`;

async function startCodeAgent({ proposal, env, fetchImpl }) {
  const prompt = [
    "You're improving Mighty Mini Missions, a static homeschool learning site (plain HTML/CSS/JS games for young kids) with Netlify Functions in netlify/.",
    "Joyce, the family's Slack learning assistant, lives in netlify/lib (joyce-*.mjs, report.mjs) and netlify/functions.",
    "",
    "Stephanie (the mom) approved this change request in Slack:",
    `Title: ${proposal.data.title}`,
    `Details: ${proposal.data.details}`,
    proposal.why ? `Why: ${proposal.why}` : null,
    proposal.sourceText ? `Her original message: "${proposal.sourceText}"` : null,
    "",
    "Guidelines:",
    "- Read README.md first, follow existing patterns, and match the style of nearby code.",
    "- Keep the change small and focused on this request. Kid-facing pages must stay simple and gentle and keep working offline on tablets; bump the service worker VERSION when you change cached files.",
    "- Never commit secrets. New settings go in Netlify environment variables, documented in README.md.",
    "- Update README.md when behavior or setup changes.",
    "- If something is unclear or risky, build the safest small version and list open questions in the PR description.",
    "- Open a pull request for review. Do not merge."
  ].filter((line) => line !== null).join("\n");

  const res = await fetchImpl(`${CURSOR_API}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: cursorAuth(env) },
    body: JSON.stringify({
      name: `Joyce: ${proposal.data.title}`.slice(0, 100),
      prompt: { text: prompt },
      ...(env.CURSOR_MODEL ? { model: { id: env.CURSOR_MODEL } } : {}),
      repos: [{ url: env.JOYCE_REPO_URL || DEFAULT_REPO, startingRef: env.JOYCE_REPO_BRANCH || "main" }],
      autoCreatePR: true
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.agent?.id) throw new Error(`Cursor API ${res.status}: ${clip(JSON.stringify(data), 200)}`);
  return { agentId: data.agent.id, runId: data.run?.id || data.agent.latestRunId, url: data.agent.url || `https://cursor.com/agents?id=${data.agent.id}` };
}

/** Post the PR link (or the problem) for code changes whose agent has finished. */
export async function checkCodeRequests({ store, env = process.env, fetchImpl = fetch }) {
  const mem = await loadMemory(store);
  const running = mem.codeRequests.filter((r) => r.status === "running");
  if (!running.length || !env.CURSOR_API_KEY) return 0;
  for (const r of running) {
    const res = await fetchImpl(`${CURSOR_API}/agents/${r.agentId}/runs/${r.runId}`, { headers: { Authorization: cursorAuth(env) } });
    if (!res.ok) {
      console.error(`Cursor run check failed for ${r.agentId}: ${res.status}`);
      continue;
    }
    const run = await res.json();
    const prUrl = run.git?.branches?.find((b) => b.prUrl)?.prUrl;
    const where = { channel: r.channel, threadTs: r.threadTs };
    const age = Date.now() - Date.parse(r.startedAt);
    let text = null;
    if (prUrl) {
      r.status = "pr-ready";
      r.prUrl = prUrl;
      text = `:tada: *${r.title}* is ready for your review: ${prUrl}\n${run.result ? `>${clip(run.result, 600).replace(/\n/g, "\n>")}\n` : ""}_Merge it on GitHub when you're happy; Netlify deploys it automatically._`;
    } else if (["ERROR", "CANCELLED", "EXPIRED"].includes(run.status)) {
      r.status = "failed";
      text = `:warning: The coding agent for *${r.title}* stopped (${run.status.toLowerCase()}). Details: <${r.agentUrl}|agent>.`;
    } else if (run.status === "FINISHED" && Date.now() - Date.parse(run.updatedAt || 0) > 2 * 60 * 60 * 1000) {
      r.status = "no-pr";
      text = `:information_source: The coding agent finished *${r.title}* without opening a pull request. Its notes: <${r.agentUrl}|agent>.`;
    } else if (age > CODE_GIVE_UP_DAYS * 24 * 60 * 60 * 1000) {
      r.status = "stale";
      text = `:hourglass: *${r.title}* has been running for ${CODE_GIVE_UP_DAYS} days, so I stopped checking. <${r.agentUrl}|Agent>.`;
    }
    if (text) await post({ ...where, text }, { env, fetchImpl });
  }
  await saveMemory(store, mem);
  return running.length;
}

// ---------------------------------------------------------------- messages

const approverIds = (env) => String(env.JOYCE_APPROVERS || "").split(/[\s,]+/).filter(Boolean);

/** Turns Slack user ids into names. Needs the users:read scope; without it, only Stephanie is known (via JOYCE_APPROVERS). */
function makeNamer({ env, fetchImpl, joyceUserId }) {
  const cache = new Map();
  return async (id) => {
    if (!id) return "someone";
    if (id === joyceUserId) return "Joyce";
    if (!cache.has(id)) {
      const data = await slackGet("users.info", { user: id }, { env, fetchImpl });
      const p = data.user?.profile || {};
      const name = data.ok ? p.display_name || p.real_name || data.user.real_name || data.user.name : null;
      cache.set(id, name || (approverIds(env).includes(id) ? "Stephanie" : null));
    }
    return cache.get(id) || "a family member";
  };
}

/** Slack's <@U123> mentions become @Name; mentions of a bot (Joyce) become @Joyce. */
async function readable(text, namer) {
  let out = String(text || "").replace(/<@B[A-Z0-9]+(\|[^>]*)?>/g, "@Joyce").replace(/(^|\s)@B[A-Z0-9]{8,}\b/g, "$1@Joyce");
  for (const [whole, id] of [...out.matchAll(/<@([UW][A-Z0-9_]+)(?:\|[^>]*)?>/g)]) {
    out = out.replace(whole, `@${await namer(id)}`);
  }
  return out;
}

/**
 * The conversation before this message: the thread it's in, or recent messages in a direct
 * message with Joyce. Plain channel messages get no history, so family chatter isn't read.
 */
async function conversation({ event, appId, joyceUserId, isDirect, env, fetchImpl, namer }) {
  const inThread = event.thread_ts && event.thread_ts !== event.ts;
  let messages = [];
  if (inThread) {
    const data = await slackGet("conversations.replies", { channel: event.channel, ts: event.thread_ts, limit: "40" }, { env, fetchImpl });
    messages = data.messages || [];
  } else if (isDirect) {
    const data = await slackGet("conversations.history", { channel: event.channel, latest: event.ts, limit: "12" }, { env, fetchImpl });
    messages = (data.messages || []).reverse();
  }
  const isJoyce = (m) => Boolean(m.bot_id) && (!appId || m.app_id === appId || m.bot_profile?.app_id === appId) || m.user === joyceUserId;
  const earlier = messages.filter((m) => m.ts !== event.ts).slice(-15);
  const lines = [];
  for (const m of earlier) {
    const who = isJoyce(m) ? "Joyce (you)" : m.bot_id ? "another app" : await namer(m.user);
    lines.push(`${who}: ${clip(await readable(m.text, namer), 700)}`);
  }
  return {
    inThread,
    startedByJoyce: inThread && earlier[0] ? isJoyce(earlier[0]) : false,
    joyceTalked: earlier.some(isJoyce),
    transcript: lines.join("\n")
  };
}

async function saveObservation(store, { kids, text, from, eventId, ts }) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  await store.setJSON(`observations/${day}/${now}-${eventId}`, {
    id: eventId, t: new Date(Number(ts) * 1000 || now).toISOString(), kids, text: clip(text, 2000), from
  });
}

function memorySummary(mem) {
  const lessons = mem.lessons.length
    ? mem.lessons.map((l) => `${BULLET} ${l.text}`).join("\n")
    : `${BULLET} Nothing yet. Correct me anytime and I'll ask before remembering.`;
  const skills = mem.skills.map((s) => `${BULLET} *${s.name}*: ${SCHEDULES[s.schedule]}${s.builtin ? "" : " (learned)"}`).join("\n");
  const running = mem.codeRequests.filter((r) => r.status === "running").map((r) => `${BULLET} ${r.title}: <${r.agentUrl}|in progress>`);
  return `*What I've learned*\n${lessons}\n\n*What I can do*\n${BULLET} Save what you notice for Friday's report\n${skills}` +
    (running.length ? `\n\n*Code changes in progress*\n${running.join("\n")}` : "");
}

function forget(mem, id) {
  const lesson = mem.lessons.find((l) => l.id === id);
  if (lesson) {
    mem.lessons = mem.lessons.filter((l) => l !== lesson);
    return `Forgotten: "${lesson.text}"`;
  }
  const skill = mem.skills.find((s) => s.id === id);
  if (!skill) return null;
  const builtin = BUILTIN_SKILLS.find((s) => s.id === id);
  if (builtin) {
    mem.skills = mem.skills.map((s) => (s.id === id ? { ...builtin } : s));
    return `Reset *${skill.name}* to how it started.`;
  }
  mem.skills = mem.skills.filter((s) => s !== skill);
  return `I've stopped using *${skill.name}*.`;
}

/** Without an OpenAI key, Joyce still saves observations that name a child. */
async function handleWithoutAI({ store, env, fetchImpl, event, eventId, where, isDirect }) {
  const kids = findKidsIn(event.text);
  if (!kids.length) {
    if (isDirect) await post({ ...where, text: "Who was this about? Include their name (like \"Max counted coins on his own\") and I'll save it for Friday's report." }, { env, fetchImpl });
    return;
  }
  await saveObservation(store, { kids: kids.map((k) => k.id), text: event.text, from: event.user, eventId, ts: event.ts });
  await post({ ...where, text: `Noted for ${joinNames(kids.map((k) => k.name))}'s Friday report. :white_check_mark:` }, { env, fetchImpl });
}

export async function handleMessage({ store, env = process.env, fetchImpl = fetch, event, eventId, joyceUserId, appId }) {
  const isDirect = event.channel_type === "im";
  const namer = makeNamer({ env, fetchImpl, joyceUserId });
  const text = await readable(event.text, namer);
  const where = { channel: event.channel, threadTs: isDirect && !event.thread_ts ? undefined : event.thread_ts || event.ts };

  if (!env.OPENAI_API_KEY) return handleWithoutAI({ store, env, fetchImpl, event: { ...event, text }, eventId, where, isDirect });

  const mem = await loadMemory(store);
  const convo = await conversation({ event, appId, joyceUserId, isDirect, env, fetchImpl, namer });
  const speaker = await namer(event.user);
  const role = approverIds(env).includes(event.user) ? " (approves what you learn)" : "";
  const context = [
    `Where: ${isDirect ? "direct message to you" : "family channel"}${convo.inThread ? `, in a thread${convo.startedByJoyce ? " you started" : ""}${convo.joyceTalked ? " where you've already replied" : ""}` : ""}.`,
    `From: ${speaker}${role}.`,
    convo.transcript ? `Conversation so far (oldest first):\n${convo.transcript}` : ""
  ].filter(Boolean).join("\n");

  let plan;
  try {
    plan = await understand({ text, context, mem, env, fetchImpl });
  } catch (err) {
    console.error("Understanding failed, falling back:", err);
    return handleWithoutAI({ store, env, fetchImpl, event: { ...event, text }, eventId, where, isDirect });
  }

  const did = [];
  const parts = [];

  const observations = (Array.isArray(plan.observations) ? plan.observations : [])
    .map((o) => ({ kids: validKids(o?.kids), text: clip(o?.text, 2000) }))
    .filter((o) => o.kids.length && o.text);
  for (const [i, o] of observations.entries()) await saveObservation(store, { ...o, from: event.user, eventId: `${eventId}-${i}`, ts: event.ts });
  if (observations.length) {
    const names = [...new Set(observations.flatMap((o) => o.kids))].map((id) => KIDS.find((k) => k.id === id).name);
    parts.push(`Noted for ${joinNames(names)}'s Friday report. :white_check_mark:`);
    did.push("observation");
  }

  if (plan.memory?.action === "list") {
    parts.push(memorySummary(mem));
    did.push("list-memory");
  } else if (plan.memory?.action === "forget" && plan.memory.id) {
    const result = forget(mem, String(plan.memory.id));
    if (result) {
      await saveMemory(store, mem);
      parts.push(result);
      did.push("forget");
    }
  }

  const skill = plan.useSkill?.id && mem.skills.find((s) => s.id === plan.useSkill.id);
  if (skill) {
    try {
      parts.push(await runSkill({ skill, request: clip(plan.useSkill.request || text, 1000), mem, store, env, fetchImpl }));
      did.push(`skill:${skill.id}`);
    } catch (err) {
      console.error(`Skill ${skill.id} failed:`, err);
      parts.push("I tried, but couldn't put that together just now. Try me again in a minute?");
    }
  } else if (plan.reply) {
    parts.push(clip(plan.reply, 2000));
  }

  if (parts.length) await post({ ...where, text: parts.join("\n\n") }, { env, fetchImpl });

  const base = { store, mem, env, fetchImpl, where, from: event.user, sourceText: text };
  if (plan.lesson?.text) {
    await propose({ ...base, type: "lesson", data: { text: clip(plan.lesson.text, 400), kids: validKids(plan.lesson.kids) }, why: "" });
    did.push("propose-lesson");
  } else if (plan.newSkill?.name) {
    const data = cleanSkill(plan.newSkill, mem.skills);
    if (data) {
      await propose({ ...base, type: "skill", data, why: plan.newSkill.why });
      did.push("propose-skill");
    }
  } else if (plan.codeChange?.title) {
    await propose({
      ...base, type: "code", data: { title: clip(plan.codeChange.title, 80), details: clip(plan.codeChange.details, 2000) }, why: plan.codeChange.why
    });
    did.push("propose-code");
  }

  // Only conversations with Joyce are logged (not family chatter), for her weekly look-back.
  if (did.length || plan.reply || plan.unmet) {
    await logTurn(store, { where: isDirect ? "dm" : "channel", text: clip(text, 500), did, unmet: clip(plan.unmet, 300) });
  }
}

// ---------------------------------------------------------------- scheduled work

async function once(store, key) {
  if (await store.get(key)) return false;
  await store.set(key, new Date().toISOString());
  return true;
}

export async function runScheduledSkills({ store, env = process.env, fetchImpl = fetch, schedule, mem }) {
  const memory = mem || (await loadMemory(store));
  const skills = memory.skills.filter((s) => s.schedule === schedule);
  if (!skills.length) return 0;
  const ctx = await buildKidContext({ store, env });
  for (const skill of skills) {
    try {
      const text = await runSkill({ skill, mem: memory, store, env, fetchImpl, ctx });
      await post({ text: `${schedule === "weekday-morning" ? ":sunny:" : ":sparkles:"} *${skill.name}*\n${text}` }, { env, fetchImpl });
    } catch (err) {
      console.error(`Scheduled skill ${skill.id} failed:`, err);
    }
  }
  return skills.length;
}

export async function runMorning({ store, env = process.env, fetchImpl = fetch }) {
  if (!(await once(store, `joyce/runs/morning-${localDate(env)}`))) return;
  await runScheduledSkills({ store, env, fetchImpl, schedule: "weekday-morning" });
}

/** Friday: the weekly report, Friday abilities, then Joyce's look-back at the week. */
export async function runWeekly({ store, env = process.env, fetchImpl = fetch, force = false }) {
  if (!force && !(await once(store, `joyce/runs/weekly-${localDate(env)}`))) return;
  const mem = await loadMemory(store);
  const result = await runWeeklyReport({ store, env, fetchImpl, send: true, lessons: lessonsText(mem) });
  console.log(`Weekly report sent: ${result.events} events, AI=${result.usedAI}`);
  await runScheduledSkills({ store, env, fetchImpl, schedule: "friday", mem });
  try {
    await reflect({ store, env, fetchImpl, mem });
  } catch (err) {
    console.error("Weekly reflection failed:", err);
  }
}

const REFLECT_PROMPT = `${VOICE}

Once a week you look back at your recent conversations with the family to see whether a new ability, or a change to an existing one, would genuinely help, or whether something needs a code change. Be conservative:
- Propose at most one thing, and only for a clear pattern: the same kind of request two or more times, or requests you couldn't do ("unmet").
- Prefer a newSkill (instructions you follow, reading only your data sources) over a code change. Use a code change only when reading data and writing can't do it.
- Never repeat anything waiting for approval or declined recently.
- Most weeks the right answer is no proposal.

Data sources: {{DATA}}. Schedules: {{SCHEDULES}}.

Reply with JSON only:
{"proposal": null}
or {"proposal": {"type": "skill", "name": "", "when": "", "instructions": "", "data": [""], "schedule": "on-request|weekday-morning|friday", "replaces": "<ability id or empty>", "why": "<the pattern you saw, one line>"}}
or {"proposal": {"type": "code", "title": "", "details": "", "why": "<the pattern you saw, one line>"}}`;

export async function reflect({ store, env = process.env, fetchImpl = fetch, mem }) {
  const log = await loadLog(store, REFLECT_LOG_DAYS);
  if (!log.length || !env.OPENAI_API_KEY) return null;
  const memory = mem || (await loadMemory(store));
  const out = await chatJSON({
    env,
    fetchImpl,
    temperature: 0.2,
    system: REFLECT_PROMPT
      .replace("{{DATA}}", Object.entries(DATA_SOURCES).map(([k, v]) => `${k} (${v})`).join("; "))
      .replace("{{SCHEDULES}}", Object.entries(SCHEDULES).map(([k, v]) => `${k} (${v})`).join("; ")),
    user: `${describeMemory(memory)}\n\nConversations from the last ${REFLECT_LOG_DAYS} days (JSON):\n${JSON.stringify(log.map(({ t, text, did, unmet }) => ({ t: t.slice(0, 10), text, did, unmet })))}`
  });
  const p = out.proposal;
  if (!p) return null;
  const base = { store, mem: memory, env, fetchImpl, where: {}, from: "joyce", sourceText: "" };
  if (p.type === "skill") {
    const data = cleanSkill(p, memory.skills);
    if (data) return propose({ ...base, type: "skill", data, why: `I noticed: ${clip(p.why, 280)}` });
  } else if (p.type === "code" && p.title) {
    return propose({ ...base, type: "code", data: { title: clip(p.title, 80), details: clip(p.details, 2000) }, why: `I noticed: ${clip(p.why, 280)}` });
  }
  return null;
}
