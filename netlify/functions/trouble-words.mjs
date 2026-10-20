import { getStore } from "@netlify/blobs";
import { loadTroubleWords } from "../lib/trouble-words.mjs";

// Ghost Word Run asks for a child's Tricky Words trail when its home screen opens.

export default async (req) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const kidId = decodeURIComponent(new URL(req.url).pathname.split("/").pop() || "");
  if (!/^[A-Za-z0-9-]{1,64}$/.test(kidId)) return Response.json({ error: "Unknown child" }, { status: 400 });
  try {
    const store = getStore({ name: "progress", consistency: "strong" });
    const words = await loadTroubleWords({ store, kidId });
    return Response.json({ kid: kidId, ...words }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Couldn't load words yet" }, { status: 503 });
  }
};

export const config = { path: "/api/trouble-words/:kid" };
