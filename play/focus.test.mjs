import assert from "node:assert/strict";
import test from "node:test";
import { soundRound, SOUND_GROUPS } from "./rounds.mjs";
import { makeFind } from "../lost-helpers/shops.mjs";

// A seeded generator, so each count is the same on every run.
function seeded(seed = 7) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

function count(make, n = 3000) {
  const seen = {};
  for (let i = 0; i < n; i += 1) {
    const key = make();
    seen[key] = (seen[key] || 0) + 1;
  }
  return seen;
}

test("Jungle Jump asks for an episode's new sound about three times as often", () => {
  const rng = seeded();
  const plain = count(() => soundRound(SOUND_GROUPS[0], rng).answer);
  const boosted = count(() => soundRound(SOUND_GROUPS[0], rng, ["f"]).answer);
  assert.ok(plain.f > 400 && plain.f < 600, `plain f ${plain.f}`);
  assert.ok(boosted.f > 1000 && boosted.f < 1400, `boosted f ${boosted.f}`);
  assert.deepEqual(Object.keys(boosted).sort(), SOUND_GROUPS[0].slice().sort(), "every letter still comes up");
  const round = soundRound(SOUND_GROUPS[0], rng, ["f"]);
  assert.ok(round.choices.includes(round.answer));
});

test("The Lost Helpers post and bell shops ask for an episode's letter more often", () => {
  const rng = seeded(11);
  const state = { shops: {} };
  for (const shop of ["post", "bell"]) {
    const plain = count(() => makeFind(shop, "connor", state, rng).item);
    const boosted = count(() => makeFind(shop, "connor", state, rng, { sounds: ["a", "d"], words: [] }).item);
    const key = shop === "post" ? "a" : "/a/";
    // Two focus letters of seven at triple weight: each comes up about 3/11 instead of 1/7 of the time.
    assert.ok(boosted[key] > plain[key] * 1.6, `${shop}: ${plain[key]} -> ${boosted[key]}`);
    assert.equal(Object.keys(boosted).length, Object.keys(plain).length, "no letter drops out");
  }
  // A focus sound with no picture in the shop changes nothing.
  assert.equal(makeFind("post", "connor", state, seeded(3), { sounds: ["m"] }).item, makeFind("post", "connor", state, seeded(3)).item);
});
