// Generates the art this game adds with gpt-image-1, then process-art.py sizes it for the web.
// Needs OPENAI_API_KEY in server/.env (git-ignored) or the environment.
//
//   node puzzle-barn/tools/make-art.mjs            # only missing pictures
//   node puzzle-barn/tools/make-art.mjs --overwrite
//   node puzzle-barn/tools/make-art.mjs --only gem
//   python3 puzzle-barn/tools/process-art.py
//
// Raw images go to puzzle-barn/tools/source/ (not published). codex-art.mjs runs the same prompts
// through the Codex CLI. Sprites (cut: true) are painted on flat magenta, and process-art.py
// cuts them out with play/cutout.py.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const require = createRequire(path.join(repo, "server/package.json"));

const STYLE = "Bright cheerful cartoon art for a children's monster-collecting game, clean dark brown outlines, soft cel shading with gentle highlights, rounded friendly shapes, the same look as cute chibi monster sticker art. No text, no letters, no numbers, no logos, no watermark, no characters from any existing game.";
const SPRITE = "A single object, centered, whole object visible with a wide margin on every side, front view, on a perfectly flat solid pure magenta (#FF00FF) background that fills the whole frame, no shadow, no ground, no other objects, no magenta, pink, or purple anywhere on the object.";

export const shapeOf = (size) => size === "1024x1536" ? "tall portrait, 2:3" : size === "1536x1024" ? "wide landscape, 3:2" : "square, 1:1";

// The monsters and backgrounds come from Word Monsters; these are the pieces this game adds.
export const ART = [
  { name: "block", size: "1536x1024", cut: true, prompt: `One glowing crystal stone block, a chunky rectangular building block wider than tall, made of smooth pale aqua-blue crystal with a lighter flat front face in the middle, soft facets on the edges, a gentle inner glow. The front face is plain and empty so a number can be written on it later. ${SPRITE} ${STYLE}` },
  { name: "gem", size: "1024x1024", cut: true, prompt: `One sparkly cut gemstone, a bright emerald-green jewel with a classic faceted shape, wider at the top and pointed at the bottom, seen from the front, with crisp facets and a small white shine highlight. ${SPRITE} ${STYLE}` },
  { name: "plank", size: "1536x1024", cut: true, prompt: `One long straight horizontal beam for a balance scale, polished warm golden-brown wood with a thin gold metal band at each end and one in the middle, seen from the front, very long and thin, filling the width. ${SPRITE} ${STYLE}` },
  { name: "pan", size: "1536x1024", cut: true, prompt: `One wide shallow round golden tray for a balance scale, empty, seen from the front and slightly above so the inside rim shows, wider than tall. ${SPRITE} ${STYLE}` },
  { name: "stand", size: "1024x1024", cut: true, prompt: `One short sturdy stand for a balance scale: a gold-trimmed stone pedestal shaped like a small triangle with a round knob on top where a beam would rest, seen from the front. ${SPRITE} ${STYLE}` }
];

function loadKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const file of ["server/.env", "server/env"]) {
    const full = path.join(repo, file);
    if (!fs.existsSync(full)) continue;
    const line = fs.readFileSync(full, "utf8").split("\n").find((l) => l.startsWith("OPENAI_API_KEY="));
    if (line) return line.slice("OPENAI_API_KEY=".length).trim();
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const overwrite = args.includes("--overwrite");
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
  const key = loadKey();
  if (!key || key === "replace_me") {
    console.error("Missing OPENAI_API_KEY. Put OPENAI_API_KEY=... in mighty-mini-missions/server/.env and rerun.");
    process.exitCode = 1;
    return;
  }
  const OpenAI = require("openai");
  const client = new (OpenAI.default || OpenAI)({ apiKey: key });
  const out = path.join(here, "source");
  fs.mkdirSync(out, { recursive: true });
  for (const item of ART) {
    if (only && item.name !== only) continue;
    const file = path.join(out, `${item.name}.png`);
    if (fs.existsSync(file) && !overwrite) { console.log(`skip ${item.name} (exists)`); continue; }
    console.log(`painting ${item.name} …`);
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: item.prompt,
      size: item.size,
      quality: "high",
      background: "opaque",
      output_format: "png"
    });
    fs.writeFileSync(file, Buffer.from(result.data[0].b64_json, "base64"));
  }
  console.log("Done. Next: python3 puzzle-barn/tools/process-art.py");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) main();
