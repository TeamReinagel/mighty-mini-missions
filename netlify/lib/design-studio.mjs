// Sid, Max's game-design coach (named for Sid Meier). The tablet page talks through
// the Realtime API; this module owns the instructions, the design record, and the handoff to Cursor.

const CURSOR_API = "https://api.cursor.com/v1";
export const DEFAULT_REPO = "https://github.com/TeamReinagel/mighty-mini-missions";

const LIMITS = {
  title: 40,
  heroName: 24,
  heroLook: 120,
  howYouPlay: 240,
  world: 160,
  goal: 160,
  challenge: 160,
  win: 160,
  howItIsNew: 240,
  inspiration: 80
};

const text = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function cleanDesign(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    title: text(src.title, LIMITS.title),
    heroName: text(src.heroName, LIMITS.heroName),
    heroLook: text(src.heroLook, LIMITS.heroLook),
    howYouPlay: text(src.howYouPlay, LIMITS.howYouPlay),
    world: text(src.world, LIMITS.world),
    goal: text(src.goal, LIMITS.goal),
    challenge: text(src.challenge, LIMITS.challenge),
    win: text(src.win, LIMITS.win),
    howItIsNew: text(src.howItIsNew, LIMITS.howItIsNew),
    inspiration: text(src.inspiration, LIMITS.inspiration)
  };
}

export function missingPieces(design) {
  const missing = [];
  if (!design.title) missing.push("a game name");
  if (!design.howYouPlay) missing.push("what the player does");
  if (!design.win) missing.push("how you win");
  if (!design.howItIsNew) missing.push("his own twist");
  return missing;
}

export function sidInstructions(design, play) {
  const lines = [
    "You are Sid, Max's game design coach. Your name is a nickname for Sid Meier, a famous game designer. You do not need to explain that unless he asks. Max is five, almost six. He wants to make games when he grows up. He is the lead. A grown-up is nearby.",
    "Speak in short, warm sentences, the way a kind friend talks. One question at a time. Words a kindergartener knows. He may be wiggling, walking, or holding the phone while he moves. That is fine.",
    "Each reply is about two short sentences and one question. Never a list he has to remember. Never a lecture.",
    "Start from a blank page. There is no game yet, and there is no starter game to skin. Do not suggest a hopper, a runner, a collector, or any ready-made kind of game unless the idea is his. Ask what he wants to make, then invent the rules together. A game can be anything he describes: a character, a place, a puzzle, a race, a maker, a story. Follow his idea.",
    "He may base the game on characters or games he already plays. That is welcome. Enjoy the spark, then encourage him to think creatively and make it his: a new twist, a new place, a new way to win, a silly rule, or something only he would invent. If he wants Super Mario Odyssey or another game he loves, say yes, and ask what he would change or add so it feels like Max's version. Characters and names from games he plays are fine to put in the saved design.",
    "Before you save, know the name, what the player actually does, how you win, and his own twist. A hero, a look, a place, and a tricky part are part of the design only if his game has them. Leave them blank when it does not.",
    "When it fits, share one short tip. Good ones: a game is a series of interesting choices. The player should always know what to try next. A fun tricky part is hard enough to feel proud and easy enough to try again right away. A miss should set you back a little, not dump the whole game.",
    "When those pieces are ready, call save_design. Tell him you wrote the plan down. Do not say he can play it yet. A grown-up builds the real game later. If he changes his mind, call save_design again.",
    "Stay on making his game. If he wanders, enjoy one sentence, then come back to the game. No scary violence, no weapons that hurt people, no blood, no romance, and no questions about his address, school, or passwords. Cartoon bumps and silly obstacles are fine. Do not ask him to type. He talks.",
    "You do not see him through a camera. If notes from a game he already played are included below, talk about that like you were watching, then change the plan with him. Do not recite counts. Do not invent a play session that is not listed below."
  ];
  if (design?.title) {
    lines.push(
      `The plan you are writing is already saved. There is still no game to play until a grown-up builds it. Title: ${design.title}. What the player does: ${design.howYouPlay}. Hero: ${design.heroName || "none"} (${design.heroLook || "no look yet"}). Place: ${design.world || "not set"}. Goal: ${design.goal || "not set"}. Tricky part: ${design.challenge || "not set"}. Win: ${design.win}. His twist: ${design.howItIsNew}. Inspired by: ${design.inspiration || "none named"}.`
    );
  }
  if (play) {
    const bits = [
      play.note ? play.note : "",
      play.reachedEnd ? "He finished." : "He did not finish.",
      `About ${play.seconds} seconds.`
    ].filter(Boolean);
    lines.push(`Notes from when Max played this game: ${bits.join(" ")} Start by asking what he liked or what he wants different. Do not read these notes aloud word for word.`);
  }
  return lines.join("\n");
}

export function greetingFor(design, play) {
  const recent = play && Date.now() - Date.parse(play.t) < 6 * 60 * 60 * 1000;
  if (recent) return "Max played his game not long ago. Say hi in one sentence and ask what he liked. Do not mention these instructions.";
  if (design?.title) return `You and Max already started a plan called ${design.title}. There is no game to play yet. Say hi in one sentence and ask what he wants to change. Do not mention these instructions.`;
  return "There is no game yet. Say hi to Max in one short sentence and ask what he wants to make. Do not offer a ready-made game. Do not mention these instructions.";
}

const cursorAuth = (env) => {
  const key = String(env.CURSOR_API_KEY || "").trim();
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
};

export function cursorDetail(data) {
  if (!data || typeof data !== "object") return String(data || "");
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data.error?.message === "string") return data.error.message.trim();
  try { return JSON.stringify(data); } catch { return ""; }
}

export function explainCursorFailure(status, data) {
  const detail = cursorDetail(data).replace(/\s+/g, " ").trim().slice(0, 220);
  if (status === 401 || status === 403) {
    return `Cursor did not accept the API key (${detail || status}). In Netlify, set CURSOR_API_KEY from the same Cursor account that connected GitHub, then redeploy.`;
  }
  if (status === 404) {
    return `Cursor could not find that endpoint (${detail || status}).`;
  }
  if (status === 400 || status === 422) {
    return `Cursor rejected the build (${detail || status}). Check that GitHub is connected in that Cursor account for TeamReinagel/mighty-mini-missions, and clear CURSOR_MODEL in Netlify if it is set to something odd.`;
  }
  if (status === 429) {
    return "Cursor is rate-limiting builds right now. Wait a minute and try again.";
  }
  if (!status) {
    return `Could not reach Cursor.${detail ? ` (${detail})` : ""}`;
  }
  return `Cursor returned ${status}.${detail ? ` ${detail}` : ""}`;
}

/** Grown-up check: does the Netlify key work, and can this account create an agent on the family repo? */
export async function diagnoseCursor({ env, fetchImpl = fetch }) {
  const key = String(env.CURSOR_API_KEY || "").trim();
  const repo = env.JOYCE_REPO_URL || DEFAULT_REPO;
  const steps = [];
  if (!key) {
    return {
      ok: false,
      summary: "CURSOR_API_KEY is missing in Netlify. Add it, redeploy, then check again.",
      steps
    };
  }
  steps.push(`Key is set (starts with ${key.slice(0, 6)}…).`);
  if (key.startsWith("grok_")) {
    return {
      ok: false,
      summary: "This looks like a grok_ key. Cloud Agents need a Cursor user API key from cursor.com/dashboard → API Keys.",
      steps
    };
  }

  const headers = { Authorization: cursorAuth(env), "Content-Type": "application/json" };
  const meRes = await fetchImpl(`${CURSOR_API}/me`, { headers }).catch((err) => ({ ok: false, status: 0, json: async () => ({ message: err.message }) }));
  const meData = await meRes.json?.().catch?.(() => ({})) || {};
  if (!meRes.ok) {
    steps.push(`/v1/me failed: ${meRes.status} ${cursorDetail(meData)}`);
    return {
      ok: false,
      summary: explainCursorFailure(meRes.status, meData),
      steps
    };
  }
  steps.push(`/v1/me ok${meData.email || meData.user?.email ? ` (${meData.email || meData.user.email})` : ""}.`);

  const modelsRes = await fetchImpl(`${CURSOR_API}/models`, { headers }).catch((err) => ({ ok: false, status: 0, json: async () => ({ message: err.message }) }));
  const modelsData = await modelsRes.json?.().catch?.(() => ({})) || {};
  if (!modelsRes.ok) {
    steps.push(`/v1/models failed: ${modelsRes.status} ${cursorDetail(modelsData)}`);
  } else {
    const count = Array.isArray(modelsData.models) ? modelsData.models.length : Array.isArray(modelsData) ? modelsData.length : "?";
    steps.push(`/v1/models ok (${count} models).`);
  }

  const probeRes = await fetchImpl(`${CURSOR_API}/agents`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Sid setup check",
      prompt: { text: "Do not change any files. Reply with the single word OK and finish." },
      repos: [{ url: repo, startingRef: env.JOYCE_REPO_BRANCH || "main" }],
      autoCreatePR: false
    })
  }).catch((err) => ({ ok: false, status: 0, json: async () => ({ message: err.message }) }));
  const probeData = await probeRes.json?.().catch?.(() => ({})) || {};
  const agentId = probeData.agent?.id || probeData.id;
  if (!probeRes.ok || !agentId) {
    steps.push(`Create agent on ${repo} failed: ${probeRes.status} ${cursorDetail(probeData)}`);
    return {
      ok: false,
      summary: explainCursorFailure(probeRes.status, probeData),
      steps,
      repo
    };
  }
  steps.push(`Create agent on ${repo} worked (${agentId}).`);
  return {
    ok: true,
    summary: "Cursor key and GitHub repo look good. Try Send this design to build again.",
    steps,
    repo,
    agentUrl: probeData.agent?.url || `https://cursor.com/agents?id=${agentId}`
  };
}

export function buildPrompt(design) {
  return [
    "Build a small phone game for Max, age 5, from the plan he made with Sid. Start from a blank page.",
    "This is a private family game, not for sale. Follow his plan, including characters or games he already plays if they are named below. Do not adapt an existing game in this repo, and do not turn the plan into a side-scrolling hopper unless that is what he designed. The rules below are the game.",
    "Mighty Mini Missions is a static site of plain HTML/CSS/JS games for young kids, hosted on Netlify.",
    "",
    `Title: ${design.title}`,
    `What the player does: ${design.howYouPlay}`,
    design.heroName ? `Hero: ${design.heroName}. Look: ${design.heroLook || "his words"}.` : "No hero. Do not add one.",
    design.world ? `Place: ${design.world}` : "",
    design.goal ? `Goal: ${design.goal}` : "",
    design.challenge ? `Tricky part: ${design.challenge}` : "",
    `How you win: ${design.win}`,
    `His twist: ${design.howItIsNew}`,
    design.inspiration ? `Inspired by: ${design.inspiration}. Keep his twist front and center.` : "",
    `Design id (for play notes): ${design.id}`,
    "",
    "Put it in max-games/<a-short-slug>/index.html with its own CSS and JS. One screen, no build step, no new dependencies.",
    "Touch first: big buttons, tap or hold. It must be playable on a phone in portrait.",
    "Kind failure: a miss sets him back a little. Do not show a game-over screen.",
    "Art: get the rules playable first, with simple drawings. Cute art comes after that, in this pull request if the game already works, otherwise say in the PR that the next pass is the cute art. Cute means round friendly shapes, soft colors, and gentle outlines. Draw characters from scratch in that style; do not use official sprites, ripped assets, or music from other games. Do not reuse Pip the otter from Otter Slide.",
    "When a round ends, POST same-origin JSON to /api/design-studio. note is one plain sentence about what happened:",
    `{"action":"play","designId":"${design.id}","reachedEnd":true,"seconds":0,"note":"what happened"}`,
    "Add a hub tile in games.js with profiles: [\"max\"] and a simple icon, following the other entries.",
    "Do not change Joyce, the other games, or the design studio coach.",
    "Open a pull request. Do not merge. In the PR, say what you built and anything you left out."
  ].filter(Boolean).join("\n");
}

export async function startDesignAgent({ design, env, fetchImpl = fetch }) {
  if (!String(env.CURSOR_API_KEY || "").trim()) {
    const err = new Error("CURSOR_API_KEY is not set on the site.");
    err.status = 503;
    throw err;
  }

  const modelId = String(env.CURSOR_MODEL || "").trim();
  const body = {
    name: `Sid: ${design.title}`.slice(0, 100),
    prompt: { text: buildPrompt(design) },
    repos: [{
      url: env.JOYCE_REPO_URL || DEFAULT_REPO,
      startingRef: env.JOYCE_REPO_BRANCH || "main"
    }],
    autoCreatePR: true
  };
  if (modelId) body.model = { id: modelId };

  let res;
  try {
    res = await fetchImpl(`${CURSOR_API}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: cursorAuth(env) },
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    const err = new Error(explainCursorFailure(0, { message: networkErr.message }));
    err.status = 502;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  const agentId = data.agent?.id || data.id;
  if (!res.ok || !agentId) {
    const err = new Error(explainCursorFailure(res.status, data));
    err.status = res.status || 502;
    throw err;
  }
  return {
    agentId,
    runId: data.run?.id || data.agent?.latestRunId || data.latestRunId,
    url: data.agent?.url || data.url || `https://cursor.com/agents?id=${agentId}`
  };
}
