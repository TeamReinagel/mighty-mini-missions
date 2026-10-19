import { getStore } from "@netlify/blobs";
import { KIDS } from "../lib/kids.mjs";
import { checkKey, handleTabletRequest } from "../lib/joyce-tablet.mjs";

// The Android overlay calls this when a child points at the screen, and again
// when they tap whether they got it. Screen pictures are not stored.

export default async (req) => {
  const auth = checkKey(req.headers.get("authorization"), process.env);
  if (!auth.ok) return Response.json({ error: auth.error, detail: auth.detail }, { status: auth.status });

  if (req.method === "GET") {
    return Response.json({
      ok: true,
      kids: KIDS.map((k) => ({ id: k.id, name: k.name }))
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (raw.length > 8_000_000) {
    return Response.json({ error: "That picture was too big. Try again." }, { status: 413 });
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Joyce couldn't read that. Try again." }, { status: 400 });
  }

  const store = getStore({ name: "progress", consistency: "strong" });
  const result = await handleTabletRequest({ store, body });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: "/api/joyce-tablet" };
