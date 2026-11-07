import assert from "node:assert/strict";
import test from "node:test";
import { acceptInbox, inboxKeyOk, panelThisWeek, runFridayNudge, saveInbox, summarizeInbox } from "./joyce-inbox.mjs";
import { memoryStore } from "./classroom.mjs";

const PANEL = "Recent Lessons\nNov 5  Elapsed time in hours  8 of 10  Mastered\nNov 4  Customary distance best unit  3 of 6  Practicing";
const json = (body) => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
const req = (headers) => new Request("https://site/api/joyce-inbox", { method: "POST", headers });

test("the inbox key must match", () => {
  const env = { JOYCE_INBOX_KEY: "k-123" };
  assert.equal(inboxKeyOk(req({ authorization: "Bearer k-123" }), env), true);
  assert.equal(inboxKeyOk(req({ "x-joyce-inbox-key": "k-123" }), env), true);
  assert.equal(inboxKeyOk(req({ authorization: "Bearer nope" }), env), false);
  assert.equal(inboxKeyOk(req({}), env), false);
  assert.equal(inboxKeyOk(req({ authorization: "Bearer k-123" }), {}), false);
});

test("only known reports with real content are taken", () => {
  assert.match(acceptInbox({ source: "somewhere", text: PANEL }).error, /doesn't know/);
  assert.match(acceptInbox({ source: "adaptedmind-panel", text: "hi" }).error, /looked empty/);
  assert.match(acceptInbox({ source: "adaptedmind-panel", text: "Log in to AdaptedMind. Email address. Password. Forgot your password? Sign up free today." }).error, /sign-in page/);
  const { item } = acceptInbox({ source: "adaptedmind-panel", kid: "nobody", text: PANEL });
  assert.equal(item.kid, "max");
});

test("the same email or page is saved once", async () => {
  const store = memoryStore();
  const now = new Date("2026-11-13T18:00:00Z");
  const { item } = acceptInbox({ source: "adaptedmind-email", id: "msg-1", text: "Max practiced 22 minutes today and mastered elapsed time." });
  const first = await saveInbox(store, item, now);
  assert.match(first.key, /^inbox\/items\/2026-11-13\/\d+-adaptedmind-email$/);
  assert.deepEqual(await saveInbox(store, item, now), { duplicate: true });
});

test("a saved report becomes a note in Friday's observations", async () => {
  const store = memoryStore();
  const now = new Date("2026-11-13T18:00:00Z");
  const { item } = acceptInbox({ source: "adaptedmind-panel", text: PANEL });
  const { key } = await saveInbox(store, item, now);
  let sent = null;
  const fetchImpl = async (url, opts) => {
    sent = JSON.parse(opts.body);
    return json({ choices: [{ message: { content: JSON.stringify({ notes: [{ kids: [], text: "AdaptedMind recent lessons (Nov 4 to 5): Max mastered elapsed time in hours (8 of 10)." }] }) } }] });
  };
  const count = await summarizeInbox({ store, env: { OPENAI_API_KEY: "sk" }, fetchImpl, key, now });
  assert.equal(count, 1);
  assert.match(sent.messages[1].content, /Elapsed time in hours {2}8 of 10/);
  const { blobs } = await store.list({ prefix: "observations/2026-11-13/" });
  assert.equal(blobs.length, 1);
  assert.match(blobs[0].key, /^observations\/2026-11-13\/\d+-inbox-adaptedmind-panel$/);
  const note = await store.get(blobs[0].key, { type: "json" });
  assert.deepEqual(note.kids, ["max"]);
  assert.equal(note.from, "AdaptedMind");
  assert.equal(await summarizeInbox({ store, env: { OPENAI_API_KEY: "sk" }, fetchImpl, key, now }), 0);
});

test("Friday's reminder goes out once, and only when the page hasn't come in", async () => {
  const env = { SLACK_BOT_TOKEN: "xoxb", JOYCE_APPROVERS: "U_STEPH" };
  const friday = new Date("2026-11-13T19:00:00Z");
  const posts = [];
  const fetchImpl = async (url, opts) => {
    posts.push(JSON.parse(opts.body));
    return json({ ok: true });
  };

  const empty = memoryStore();
  assert.equal(await runFridayNudge({ store: empty, env, fetchImpl, now: friday }), true);
  assert.equal(posts[0].channel, "U_STEPH");
  assert.match(posts[0].text, /performance-panel\/lessons\/recent/);
  assert.equal(await runFridayNudge({ store: empty, env, fetchImpl, now: friday }), false);
  assert.equal(posts.length, 1);

  const sent = memoryStore();
  const { item } = acceptInbox({ source: "adaptedmind-panel", text: PANEL });
  await saveInbox(sent, item, new Date("2026-11-11T15:00:00Z"));
  assert.equal(await panelThisWeek(sent, friday), true);
  assert.equal(await runFridayNudge({ store: sent, env, fetchImpl, now: friday }), false);
  assert.equal(posts.length, 1);

  const lastWeek = memoryStore();
  await saveInbox(lastWeek, item, new Date("2026-11-06T19:00:00Z"));
  assert.equal(await panelThisWeek(lastWeek, friday), false);
});
