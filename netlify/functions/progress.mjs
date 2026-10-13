import { getStore } from "@netlify/blobs";

const MAX_EVENTS = 500;
const clip = (v, n) => (v == null ? "" : String(v).slice(0, n));

function clean(e, now) {
  if (!e || typeof e !== "object" || !e.game || !e.skill) return null;
  const t = Date.parse(e.t);
  const extraJson = e.extra && typeof e.extra === "object" ? JSON.stringify(e.extra) : "";
  const extra = extraJson && extraJson.length <= 1000 ? JSON.parse(extraJson) : undefined;
  return {
    id: clip(e.id, 64) || crypto.randomUUID(),
    // Tablet clocks can drift; fall back to the server time for anything implausible.
    t: Number.isFinite(t) && t <= now + 60_000 && t > now - 90 * 864e5 ? new Date(t).toISOString() : new Date(now).toISOString(),
    kid: clip(e.kid, 64) || "unknown",
    kidName: clip(e.kidName, 64),
    game: clip(e.game, 40),
    skill: clip(e.skill, 120),
    item: clip(e.item, 160),
    correct: typeof e.correct === "boolean" ? e.correct : null,
    extra
  };
}

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Only accept syncs from the app's own pages.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return new Response("Forbidden", { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = Date.now();
  const events = (Array.isArray(body?.events) ? body.events : [])
    .slice(0, MAX_EVENTS)
    .map((e) => {
      try { return clean(e, now); } catch { return null; }
    })
    .filter(Boolean);
  if (!events.length) return Response.json({ ok: true, saved: 0 });

  const day = new Date(now).toISOString().slice(0, 10);
  await getStore("progress").setJSON(`events/${day}/${now}-${crypto.randomUUID()}`, events);
  return Response.json({ ok: true, saved: events.length });
};

export const config = { path: "/api/progress" };
