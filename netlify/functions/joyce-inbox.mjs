import { getStore } from "@netlify/blobs";
import { acceptInbox, forgetSeen, inboxKeyOk, saveInbox } from "../lib/joyce-inbox.mjs";
import { enqueue } from "../lib/slack.mjs";

// Joyce's inbox for reports from other apps (see netlify/lib/joyce-inbox.mjs). Callers are the
// Send to Joyce page on this site and the Gmail script, both holding JOYCE_INBOX_KEY.
// It saves the report and hands the reading to the background worker.

const reply = (status, body) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export default async (req, context) => {
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  if (!process.env.JOYCE_INBOX_KEY) return reply(503, { error: "Joyce's inbox isn't set up yet. Add JOYCE_INBOX_KEY in Netlify." });
  if (!inboxKeyOk(req)) return reply(401, { error: "That inbox key didn't work." });

  let body;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Joyce couldn't read that." });
  }
  const { item, error } = acceptInbox(body);
  if (error) return reply(422, { error });

  const store = getStore({ name: "progress", consistency: "strong" });
  const saved = await saveInbox(store, item);
  if (saved.duplicate) return reply(200, { ok: true, duplicate: true, say: "Joyce already has this one." });

  try {
    await enqueue(context?.site?.url || process.env.URL || new URL(req.url).origin, { kind: "inbox", key: saved.key });
  } catch (err) {
    console.error(err);
    await forgetSeen(store, saved.seen);
    return reply(502, { error: "Joyce saved it but couldn't read it yet. Send it again in a minute." });
  }
  return reply(202, { ok: true, say: "Joyce got it. It goes into Friday's report." });
};

export const config = { path: "/api/joyce-inbox" };
