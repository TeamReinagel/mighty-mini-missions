import { getStore } from "@netlify/blobs";
import { enqueue, verifySlack } from "../lib/slack.mjs";

// Slack endpoint for Joyce: Events API messages and button clicks (Approve / Not now) both arrive here.
// Slack wants an answer within 3 seconds, so this only checks the request and hands the
// real work to the background worker (joyce-work.mjs).

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const secret = process.env.SLACK_SIGNING_SECRET;
  const origin = new URL(req.url).origin;

  // Button clicks are form-encoded with a JSON `payload` field.
  if ((req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded")) {
    if (!secret || !verifySlack(req, raw, secret)) return new Response("Unauthorized", { status: 401 });
    let payload;
    try {
      payload = JSON.parse(new URLSearchParams(raw).get("payload") || "");
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    if (payload.type === "block_actions") await enqueue(origin, { kind: "action", payload });
    return new Response("");
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Slack checks the URL before the signing secret can be added to Netlify, so allow that one handshake.
  if (body.type === "url_verification" && (!secret || verifySlack(req, raw, secret))) {
    return Response.json({ challenge: body.challenge });
  }
  if (!secret || !verifySlack(req, raw, secret)) return new Response("Unauthorized", { status: 401 });

  const e = body.event;
  if (body.type !== "event_callback" || e?.type !== "message") return new Response("ok");
  // Skip edits, deletes, joins, and bot posts (including Joyce's own messages).
  if (e.subtype || e.bot_id || !e.text?.trim()) return new Response("ok");

  // Slack retries if we're slow; the event id keeps a retry from being handled twice.
  const store = getStore({ name: "progress", consistency: "strong" });
  const index = `slack-events/${body.event_id}`;
  if (await store.get(index)) return new Response("ok");
  await store.set(index, "1");

  try {
    await enqueue(origin, {
      kind: "message",
      eventId: body.event_id,
      joyceUserId: body.authorizations?.[0]?.user_id,
      appId: body.api_app_id,
      event: { text: e.text, user: e.user, channel: e.channel, channel_type: e.channel_type, ts: e.ts, thread_ts: e.thread_ts }
    });
  } catch (err) {
    // Let Slack's retry try again.
    console.error(err);
    await store.delete(index);
    return new Response("Busy", { status: 500 });
  }
  return new Response("ok");
};

export const config = { path: "/api/joyce" };
