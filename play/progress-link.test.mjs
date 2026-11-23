// The shared progress logger runs in the browser. These checks load it in a small stand-in page.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";

const SOURCE = fs.readFileSync(new URL("../progress.js", import.meta.url), "utf8");

function page(search, activeProfileId) {
  const store = {
    "mighty-mini-missions:profiles": JSON.stringify({ activeProfileId, profiles: [{ id: "max", name: "Max" }, { id: "connor", name: "Connor" }] })
  };
  const sent = [];
  const made = [];
  const ctx = {
    location: { search, protocol: "https:", href: "" },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    navigator: { onLine: true },
    document: {
      addEventListener() {},
      visibilityState: "visible",
      createElement: (tag) => {
        const node = { tag, children: [], attrs: {}, listeners: {}, append(...c) { this.children.push(...c); }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { this.listeners[t] = f; } };
        made.push(node);
        return node;
      }
    },
    addEventListener() {},
    close() { ctx.closed = true; },
    fetch: async (_url, init) => { sent.push(JSON.parse(init.body).events); return { ok: true }; },
    URLSearchParams, setTimeout, clearTimeout, crypto, Promise
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  return { ctx, store, sent, made };
}

test("A game opened for Connor logs as Connor even when the home screen last picked Max", () => {
  const { ctx, store } = page("?kid=connor&step=connor-count-5", "max");
  ctx.MightyProgress.log({ game: "snack-count", skill: "Counting", item: "3 scoops", correct: true });
  const [event] = JSON.parse(store["mightyMini.progressQueue.v1"]);
  assert.equal(event.kid, "connor");
});

test("Without a child in the link, the home screen's pick still decides", () => {
  const { ctx, store } = page("", "max");
  ctx.MightyProgress.log({ game: "snack-count", skill: "Counting", item: "3 scoops", correct: true });
  assert.equal(JSON.parse(store["mightyMini.progressQueue.v1"])[0].kid, "max");
});

test("Only a game Joyce sent offers the way back to her", () => {
  assert.equal(page("?kid=connor", "connor").ctx.MightyProgress.joyceButton(), null);
  const button = page("?kid=connor&from=joyce", "connor").ctx.MightyProgress.joyceButton();
  assert.equal(button.attrs["aria-label"], "Back to Joyce");
});

test("Going back to Joyce sends every waiting answer before it leaves", async () => {
  const { ctx, sent } = page("?kid=connor&from=joyce", "max");
  for (let i = 0; i < 4; i += 1) ctx.MightyProgress.log({ game: "nest-numbers", skill: "Numbers", item: String(i), correct: true });
  await ctx.MightyProgress.backToJoyce();
  assert.equal(sent.flat().length, 4);
  assert.ok(sent.flat().every((event) => event.kid === "connor"));
  assert.equal(ctx.closed, true);
});
