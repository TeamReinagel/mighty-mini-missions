import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SECONDS = 60 * 5;

const safeEqual = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Check Slack's request signature (v0) on the raw body. */
export function verifySlack(req, raw, secret) {
  const ts = req.headers.get("x-slack-request-timestamp");
  const sig = req.headers.get("x-slack-signature") || "";
  if (!ts || Math.abs(Date.now() / 1000 - Number(ts)) > MAX_AGE_SECONDS) return false;
  return safeEqual(sig, `v0=${createHmac("sha256", secret).update(`v0:${ts}:${raw}`).digest("hex")}`);
}

/** Call a Slack Web API method with the bot token. Returns the parsed reply ({ ok: false } on failure). */
export async function slackApi(method, body, { env = process.env, fetchImpl = fetch } = {}) {
  const token = env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN is not set" };
  const res = await fetchImpl(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!data.ok) console.error(`Slack ${method} failed:`, data.error);
  return data;
}

/** Read-only Web API methods (like conversations.replies) take form-style query parameters. */
export async function slackGet(method, params, { env = process.env, fetchImpl = fetch } = {}) {
  const token = env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN is not set" };
  const res = await fetchImpl(`https://slack.com/api/${method}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!data.ok) console.error(`Slack ${method} failed:`, data.error);
  return data;
}

/**
 * Post a message. With a channel (and the bot token) it posts there, optionally in a thread;
 * otherwise, or if Joyce isn't in that channel, it uses the report webhook's channel.
 * Blocks may hold buttons either way.
 */
export async function post({ channel, threadTs, text, blocks }, { env = process.env, fetchImpl = fetch } = {}) {
  if (channel && env.SLACK_BOT_TOKEN) {
    const sent = await slackApi("chat.postMessage", { channel, thread_ts: threadTs, text, blocks, unfurl_links: false }, { env, fetchImpl });
    if (sent.ok || !env.SLACK_WEBHOOK_URL) return sent;
  }
  if (!env.SLACK_WEBHOOK_URL) throw new Error("SLACK_WEBHOOK_URL is not set");
  const res = await fetchImpl(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, blocks, mrkdwn: true, unfurl_links: false })
  });
  if (!res.ok) throw new Error(`Slack ${res.status}: ${await res.text()}`);
  return { ok: true };
}

/** Update the message a button was clicked on, through the interaction's response_url. */
export async function respond(responseUrl, body, fetchImpl = fetch) {
  const res = await fetchImpl(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) console.error("Slack response_url failed:", res.status);
}

// ---------------------------------------------------------------- hand-off to the background worker

const internalSecret = (env) => env.JOYCE_INTERNAL_SECRET || env.SLACK_SIGNING_SECRET || "";
const sign = (secret, ts, body) => createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");

/**
 * Queue work for the background worker (/api/joyce-work), which may take minutes.
 * Resolves once Netlify has accepted the job (202), well inside Slack's 3-second window.
 */
export async function enqueue(origin, job, { env = process.env, fetchImpl = fetch } = {}) {
  const secret = internalSecret(env);
  if (!secret) throw new Error("SLACK_SIGNING_SECRET is not set");
  const body = JSON.stringify(job);
  const ts = String(Date.now());
  const res = await fetchImpl(`${origin}/api/joyce-work`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-joyce-timestamp": ts, "x-joyce-signature": sign(secret, ts, body) },
    body
  });
  if (!res.ok) throw new Error(`Background worker refused the job: ${res.status}`);
}

/** Check a job handed over by enqueue(). */
export function verifyJob(req, raw, env = process.env) {
  const secret = internalSecret(env);
  const ts = req.headers.get("x-joyce-timestamp") || "";
  const sig = req.headers.get("x-joyce-signature") || "";
  if (!secret || !ts || Math.abs(Date.now() - Number(ts)) > MAX_AGE_SECONDS * 1000) return false;
  return safeEqual(sig, sign(secret, ts, raw));
}
