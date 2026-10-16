import { timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  cleanDesign, copyProblem, greetingFor, missingPieces, sidInstructions, startDesignAgent
} from "../lib/design-studio.mjs";

const STORE = "design-studio";
const BUILDS_PER_DAY = 4;

const json = (body, status = 200) => Response.json(body, { status });

function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

function codeOk(env, given) {
  const expected = String(env.DESIGN_PARENT_CODE || "");
  const got = String(given || "");
  if (!expected || !got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function clipPlay(raw) {
  const n = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.min(999, Math.round(num));
  };
  return {
    reachedEnd: Boolean(raw?.reachedEnd),
    bumps: n(raw?.bumps),
    collected: n(raw?.collected),
    seconds: n(raw?.seconds),
    note: String(raw?.note ?? "").replace(/\s+/g, " ").trim().slice(0, 200),
    t: new Date().toISOString()
  };
}

async function latestPlay(store, id) {
  const plays = (await store.get(`plays/${id}`, { type: "json" })) || [];
  return plays.length ? plays[plays.length - 1] : null;
}

export default async (req) => {
  const env = process.env;
  const fetchImpl = fetch;
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body?.action || "");
  const store = getStore({ name: STORE, consistency: "strong" });
  const authed = codeOk(env, req.headers.get("x-studio-code"));

  if (action === "unlock") {
    if (!env.DESIGN_PARENT_CODE) {
      return json({ error: "A grown-up still needs to set DESIGN_PARENT_CODE on the site." }, 503);
    }
    if (!authed) return json({ error: "That code did not match." }, 401);
    return json({ ok: true });
  }

  if (action === "play") {
    const id = String(body.designId || "").slice(0, 40);
    if (!/^ds_[a-z0-9-]+$/i.test(id)) return json({ error: "Unknown game" }, 400);
    const design = await store.get(`designs/${id}`, { type: "json" });
    if (!design) return json({ error: "Unknown game" }, 404);
    const play = clipPlay(body);
    const plays = ((await store.get(`plays/${id}`, { type: "json" })) || []).slice(-29);
    plays.push(play);
    await store.setJSON(`plays/${id}`, plays);
    return json({ ok: true });
  }

  if (!env.DESIGN_PARENT_CODE) {
    return json({ error: "A grown-up still needs to set DESIGN_PARENT_CODE on the site." }, 503);
  }
  if (!authed) return json({ error: "This phone is not unlocked yet." }, 401);

  if (action === "load") {
    const id = String(body.designId || "").slice(0, 40);
    const design = id
      ? await store.get(`designs/${id}`, { type: "json" })
      : await store.get("designs/latest", { type: "json" });
    if (!design) return json({ design: null, play: null });
    const play = await latestPlay(store, design.id);
    return json({ design, play });
  }

  if (action === "save") {
    const design = cleanDesign(body.design);
    const missing = missingPieces(design);
    if (missing.length) {
      return json({
        ok: false,
        tellSid: `Still need ${missing.join(", ")}. Ask Max for the next piece. Do not say he can play it. Do not read this note aloud.`
      });
    }
    const problem = copyProblem(design);
    if (problem) return json({ ok: false, tellSid: problem + " Do not read this note aloud." });

    const previousId = String(body.designId || "");
    const id = /^ds_[a-z0-9-]+$/i.test(previousId) ? previousId : `ds_${crypto.randomUUID()}`;
    const existing = await store.get(`designs/${id}`, { type: "json" });
    const saved = {
      ...design,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      build: existing?.build || null
    };
    await store.setJSON(`designs/${id}`, saved);
    await store.setJSON("designs/latest", saved);
    return json({
      ok: true,
      design: saved,
      tellSid: "Saved. Read the plan back in one sentence and ask if he wants to change anything. Do not say he can play it yet. Do not read this note aloud."
    });
  }

  if (action === "session") {
    const sdp = String(body.sdp || "");
    if (!sdp.trim() || sdp.length > 100_000) return json({ error: "Missing session offer" }, 400);
    if (!env.OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY is not set on the site." }, 503);

    let design = null;
    const requested = String(body.designId || "");
    if (/^ds_[a-z0-9-]+$/i.test(requested)) design = await store.get(`designs/${requested}`, { type: "json" });
    if (!design) design = await store.get("designs/latest", { type: "json" });
    const play = design ? await latestPlay(store, design.id) : null;

    const session = {
      type: "realtime",
      model: env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
      instructions: sidInstructions(design, play),
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "server_vad",
            threshold: 0.55,
            prefix_padding_ms: 300,
            silence_duration_ms: 900,
            create_response: true,
            interrupt_response: false
          }
        },
        output: { voice: env.DESIGN_VOICE || "ash" }
      },
      tools: [
        {
          type: "function",
          name: "save_design",
          description: "Save the original game Max invented once you know its name, what the player does, how you win, and how it is not a copy. Leave hero, place, and tricky part empty if his game does not have them. Call again when he changes it.",
          parameters: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string", description: "Original game name. Not the name of an existing game." },
              howYouPlay: { type: "string", description: "What the player actually does, in his words." },
              heroName: { type: "string", description: "Empty if this game has no hero." },
              heroLook: { type: "string", description: "What the hero looks like, or empty." },
              world: { type: "string", description: "Where it happens, or empty." },
              goal: { type: "string", description: "What the player is trying to do, or empty if howYouPlay already says it." },
              challenge: { type: "string", description: "What makes it tricky, or empty." },
              win: { type: "string" },
              howItIsNew: { type: "string", description: "How this game is different from any game Max named." },
              inspiration: { type: "string", description: "A game or feeling that sparked this, if he named one. Empty if not." }
            },
            required: ["title", "howYouPlay", "heroName", "heroLook", "world", "goal", "challenge", "win", "howItIsNew", "inspiration"]
          }
        }
      ],
      tool_choice: "auto"
    };

    const fd = new FormData();
    fd.set("sdp", sdp);
    fd.set("session", JSON.stringify(session));
    const upstream = await fetchImpl("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "OpenAI-Safety-Identifier": "max-design-studio"
      },
      body: fd
    });
    const answer = await upstream.text();
    if (!upstream.ok || !answer.startsWith("v=")) {
      console.error("Realtime session failed", upstream.status, answer.slice(0, 300));
      return json({ error: "Sid could not start. A grown-up can check the voice model and the OpenAI key." }, 502);
    }
    return json({
      sdp: answer,
      greeting: greetingFor(design, play),
      design,
      play
    });
  }

  if (action === "build") {
    const id = String(body.designId || "");
    if (!/^ds_[a-z0-9-]+$/i.test(id)) return json({ error: "Save the plan with Sid first." }, 400);
    if (!codeOk(env, body.parentCode)) return json({ error: "That grown-up code did not match." }, 401);
    if (!env.CURSOR_API_KEY) return json({ error: "CURSOR_API_KEY is not set on the site, so the build cannot start." }, 503);

    const design = await store.get(`designs/${id}`, { type: "json" });
    if (!design) return json({ error: "That design is not on the site yet." }, 404);
    const problem = copyProblem(design);
    if (problem) return json({ error: "This plan is still too close to a game someone else made. Keep talking with Sid." }, 400);
    if (design.build?.url && design.build.status === "running") {
      return json({ ok: true, url: design.build.url, already: true });
    }

    const day = new Date().toISOString().slice(0, 10);
    const count = Number(await store.get(`builds/${day}`, { type: "text" })) || 0;
    if (count >= BUILDS_PER_DAY) {
      return json({ error: `Already started ${BUILDS_PER_DAY} builds today. Try again tomorrow.` }, 429);
    }

    let agent;
    try {
      agent = await startDesignAgent({ design, env, fetchImpl });
    } catch (err) {
      console.error(err);
      return json({ error: "The coding agent did not start. A grown-up can try again in a minute." }, 502);
    }

    design.build = { ...agent, status: "running", startedAt: new Date().toISOString() };
    await store.setJSON(`designs/${id}`, design);
    await store.set(`builds/${day}`, String(count + 1));
    const latest = await store.get("designs/latest", { type: "json" });
    if (latest?.id === id) await store.setJSON("designs/latest", design);

    if (env.SLACK_WEBHOOK_URL) {
      await fetchImpl(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Max asked Sid to build *${design.title}*. Review it when the pull request is ready: ${agent.url}`
        })
      }).catch((err) => console.error("Slack notify failed", err));
    }
    return json({ ok: true, url: agent.url });
  }

  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/design-studio" };
