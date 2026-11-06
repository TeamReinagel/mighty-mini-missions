// Paints The Gem Gym's art (puzzle-barn) with the Codex CLI's built-in image tool, one picture per call,
// using the prompts in make-art.mjs. Each new image Codex saves under ~/.codex/generated_images
// is copied to tools/source/<name>.png. Then run process-art.py.
//
//   node puzzle-barn/tools/codex-art.mjs                 # only missing pictures
//   node puzzle-barn/tools/codex-art.mjs --only gem --overwrite
//   node puzzle-barn/tools/codex-art.mjs --wait-until 10:20
//
// If Codex reports a usage limit, it waits 10 minutes and tries again (up to 3 hours).
// CODEX_BIN overrides the CLI path.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ART, shapeOf } from "./make-art.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const out = path.join(here, "source");
const images = path.join(os.homedir(), ".codex", "generated_images");
const BIN = process.env.CODEX_BIN || "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex";
const RETRY_MS = 10 * 60 * 1000;
const GIVE_UP_MS = 3 * 60 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toTimeString().slice(0, 5);

function allImages() {
  if (!fs.existsSync(images)) return [];
  return fs.readdirSync(images, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => fs.readdirSync(path.join(images, d.name))
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .map((f) => path.join(images, d.name, f)));
}

function ask(item) {
  const prompt = [
    "Use your built-in image generation tool to make exactly one image from the art prompt below.",
    "Do not write code, run commands, or edit any files. Generate the image once, then reply with the word done.",
    `Image shape: ${shapeOf(item.size)}.`,
    "",
    `Art prompt: ${item.prompt}`
  ].join("\n");
  const run = spawnSync(BIN, [
    "exec", "-C", repo, "-s", "read-only",
    "-c", 'model_reasoning_effort="low"',
    "-"
  ], { input: prompt, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000 });
  return `${run.stdout || ""}\n${run.stderr || ""}`;
}

async function waitUntil(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date();
  target.setHours(h, m, 30, 0);
  console.log(`${stamp()} waiting until ${hhmm}`);
  // Polls the clock so a sleeping Mac doesn't stretch the wait.
  while (Date.now() < target.getTime()) await sleep(30 * 1000);
}

async function main() {
  const args = process.argv.slice(2);
  const overwrite = args.includes("--overwrite");
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
  if (args.includes("--wait-until")) await waitUntil(args[args.indexOf("--wait-until") + 1]);
  fs.mkdirSync(out, { recursive: true });
  const started = Date.now();
  const failed = [];

  for (const item of ART) {
    if (only && item.name !== only) continue;
    const file = path.join(out, `${item.name}.png`);
    if (fs.existsSync(file) && !overwrite) { console.log(`skip ${item.name} (exists)`); continue; }

    let done = false;
    for (let tries = 0; !done && tries < 2;) {
      const before = new Set(allImages());
      console.log(`${stamp()} painting ${item.name} …`);
      const log = ask(item);
      if (/usage limit/i.test(log)) {
        if (Date.now() - started > GIVE_UP_MS) { console.log("still at the usage limit after 3 hours; stopping"); process.exitCode = 2; return; }
        console.log(`${stamp()} usage limit; trying again in 10 minutes`);
        await sleep(RETRY_MS);
        continue;
      }
      tries++;
      const fresh = allImages().filter((f) => !before.has(f))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      if (fresh.length) {
        fs.copyFileSync(fresh[0], file);
        console.log(`  saved ${path.relative(repo, file)}`);
        done = true;
      } else {
        console.log(`  no image came back. Codex said:\n${log.split("\n").slice(-12).join("\n")}`);
      }
    }
    if (!done) failed.push(item.name);
  }
  if (failed.length) { console.log(`failed: ${failed.join(", ")}`); process.exitCode = 1; }
  else console.log("Done. Next: python3 puzzle-barn/tools/process-art.py");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) main();
