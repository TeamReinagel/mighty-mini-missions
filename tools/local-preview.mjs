#!/usr/bin/env node
// Local static preview with a same-origin speak proxy. Plain `python -m http.server`
// has no /api/classroom, so Lost Helpers (and other natural-voice games) stay silent.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8770);
const live = process.env.SPEAK_PROXY || "https://mighty-mini-missions.netlify.app/api/classroom";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

async function proxyClassroom(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  try {
    const upstream = await fetch(live, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const text = await upstream.text();
    send(res, upstream.status, text, "application/json; charset=utf-8");
  } catch (err) {
    send(res, 502, JSON.stringify({ error: String(err?.message || err) }), "application/json; charset=utf-8");
  }
}

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/classroom" && req.method === "POST") {
    await proxyClassroom(req, res);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed");
    return;
  }
  let file = safePath(url.pathname);
  if (!file) {
    send(res, 403, "Forbidden");
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, "Not found");
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const data = fs.readFileSync(file);
  res.writeHead(200, { "Content-Type": type });
  res.end(req.method === "HEAD" ? undefined : data);
});

server.listen(port, () => {
  console.log(`Mighty Mini Missions preview on http://127.0.0.1:${port}/`);
  console.log(`Speak proxy → ${live}`);
});
