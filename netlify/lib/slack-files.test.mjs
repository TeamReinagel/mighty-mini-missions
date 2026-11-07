import assert from "node:assert/strict";
import test from "node:test";
import { NEEDS_SCOPE, acceptMessage, failedLine, readFiles, withFiles } from "./slack-files.mjs";
import { handleMessage } from "./joyce-brain.mjs";
import { memoryStore } from "./classroom.mjs";

const PDF = { id: "F1", name: "AdaptedMind panel.pdf", mimetype: "application/pdf", filetype: "pdf", size: 2000, url_private_download: "https://files.slack.com/F1/panel.pdf" };
const env = { SLACK_BOT_TOKEN: "xoxb-test", OPENAI_API_KEY: "sk-test" };

const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

test("a message with an attachment is kept; edits and bot posts are not", () => {
  assert.deepEqual(acceptMessage({ subtype: "file_share", text: "", files: [PDF] }).files.map((f) => f.name), ["AdaptedMind panel.pdf"]);
  assert.equal(acceptMessage({ subtype: "message_changed", text: "hi" }), null);
  assert.equal(acceptMessage({ bot_id: "B1", text: "hi" }), null);
  assert.equal(acceptMessage({ text: "  " }), null);
  assert.deepEqual(acceptMessage({ text: "Max counted coins" }), { files: [] });
});

test("a PDF is downloaded with the bot token and read as text", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url: String(url), opts });
    if (String(url).startsWith("https://files.slack.com/")) {
      return new Response(Buffer.from("%PDF-1.4 test"), { status: 200, headers: { "content-type": "application/pdf" } });
    }
    return json({ choices: [{ message: { content: "AdaptedMind, Max: mastered telling time to the hour (19 of 19)." } }] });
  };
  const { read, failed } = await readFiles(acceptMessage({ subtype: "file_share", files: [PDF] }).files, { env, fetchImpl });
  assert.deepEqual(failed, []);
  assert.match(read[0].text, /19 of 19/);
  assert.equal(calls[0].opts.headers.Authorization, "Bearer xoxb-test");
  const sent = JSON.parse(calls[1].opts.body);
  const part = sent.messages[1].content.find((c) => c.type === "file");
  assert.match(part.file.file_data, /^data:application\/pdf;base64,/);
  assert.match(withFiles("", read), /^Attached file "AdaptedMind panel.pdf"/);
});

test("without files:read, Joyce says what to fix instead of dropping the file", async () => {
  const fetchImpl = async () => new Response("<html>Sign in</html>", { status: 200, headers: { "content-type": "text/html" } });
  const { read, failed } = await readFiles(acceptMessage({ subtype: "file_share", files: [PDF] }).files, { env, fetchImpl });
  assert.equal(read.length, 0);
  assert.equal(failed[0].why, NEEDS_SCOPE);
  assert.match(failedLine(failed), /files:read/);
});

test("a forwarded email uses its own text without a download", async () => {
  const email = { id: "F2", name: "Daily Progress", filetype: "email", mimetype: "text/html", subject: "Max's Daily Progress Update", plain_text: "Max practiced 22 minutes. Mastered: elapsed time." };
  const fetchImpl = async () => { throw new Error("no download expected"); };
  const { read } = await readFiles(acceptMessage({ subtype: "file_share", files: [email] }).files, { env, fetchImpl });
  assert.match(read[0].text, /^Subject: Max's Daily Progress Update\nMax practiced 22 minutes/);
});

test("a PDF sent to Joyce in a DM becomes an observation for Friday's report", async () => {
  const store = memoryStore();
  const posted = [];
  let understood = "";
  const fetchImpl = async (url, opts) => {
    const u = String(url);
    if (u.startsWith("https://files.slack.com/")) {
      return new Response(Buffer.from("%PDF-1.4 test"), { status: 200, headers: { "content-type": "application/pdf" } });
    }
    if (u.includes("/chat/completions")) {
      const body = JSON.parse(opts.body);
      if (body.response_format) {
        understood = body.messages[1].content;
        return json({ choices: [{ message: { content: JSON.stringify({ observations: [{ kids: ["max"], text: "AdaptedMind: Max mastered telling time to the hour; elapsed time is his edge.", steps: [] }] }) } }] });
      }
      return json({ choices: [{ message: { content: "AdaptedMind panel for Max: telling time to the hour 19 of 19; elapsed time in hours 19 of 24." } }] });
    }
    if (u.includes("chat.postMessage")) {
      posted.push(JSON.parse(opts.body).text);
      return json({ ok: true });
    }
    return json({ ok: true, messages: [], user: { profile: { display_name: "Stephanie" } } });
  };
  const event = { text: "", user: "U1", channel: "D1", channel_type: "im", ts: "1700000000.0001", files: acceptMessage({ subtype: "file_share", files: [PDF] }).files };
  await handleMessage({ store, env, fetchImpl, event, eventId: "Ev1", joyceUserId: "UJ" });
  assert.match(understood, /Attached file "AdaptedMind panel.pdf"/);
  assert.match(understood, /elapsed time in hours 19 of 24/);
  const { blobs } = await store.list({ prefix: "observations/" });
  assert.equal(blobs.length, 1);
  const saved = await store.get(blobs[0].key, { type: "json" });
  assert.deepEqual(saved.kids, ["max"]);
  assert.match(posted.join("\n"), /Noted for Max's Friday report/);
});

test("a photo shared in the family channel without naming Joyce is not read", async () => {
  const store = memoryStore();
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    return json({ ok: true, messages: [], choices: [{ message: { content: "{}" } }] });
  };
  const photo = { id: "F3", name: "garden.jpg", mimetype: "image/jpeg", filetype: "jpg", size: 1000, url_private: "https://files.slack.com/F3/garden.jpg" };
  const event = { text: "", user: "U1", channel: "C1", channel_type: "channel", ts: "1700000000.0002", files: acceptMessage({ subtype: "file_share", files: [photo] }).files };
  await handleMessage({ store, env, fetchImpl, event, eventId: "Ev2", joyceUserId: "UJ" });
  assert.equal(urls.some((u) => u.startsWith("https://files.slack.com/")), false);
  assert.equal(urls.some((u) => u.includes("/chat/completions")), false);
});
