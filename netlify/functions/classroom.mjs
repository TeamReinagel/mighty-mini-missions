import { getStore } from "@netlify/blobs";
import { handleClassroom } from "../lib/classroom.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(req.url).host) return new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const store = getStore({ name: "progress", consistency: "strong" });
  try {
    const result = await handleClassroom({ store, env: process.env, fetchImpl: fetch, body });
    return Response.json(result.body, { status: result.status });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Joyce couldn't do that just yet. Try again." }, { status: 500 });
  }
};

export const config = { path: "/api/classroom" };
