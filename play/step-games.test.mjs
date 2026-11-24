// Rules for the four step games built for the November 24 milestone gaps:
// Word Tree (Gabi), Word Workshop and Penguin Pond (Max), Letter Lights (Connor).
import assert from "node:assert/strict";
import test from "node:test";
import { rngFrom } from "./rounds.mjs";
import { ROUND_LENGTH } from "./round-length.mjs";
import { SIGHT as JOYCE_SIGHT } from "../netlify/lib/classroom-content.mjs";
import { evidenceFor, stepById, stepGame } from "../netlify/lib/classroom.mjs";
import * as tree from "../word-tree/words.mjs";
import * as shop from "../word-workshop/words.mjs";
import * as pond from "../penguin-pond/math.mjs";
import * as lights from "../letter-lights/letters.mjs";

const GAMES = [
  { id: "word-tree", title: "Word Tree", kid: "gabi", levels: tree.LEVELS },
  { id: "word-workshop", title: "Word Workshop", kid: "max", levels: shop.LEVELS },
  { id: "penguin-pond", title: "Penguin Pond", kid: "max", levels: pond.LEVELS },
  { id: "letter-lights", title: "Letter Lights", kid: "connor", levels: lights.LEVELS }
];

const seeds = (n) => Array.from({ length: n }, (_, i) => rngFrom(1000 + i * 7919));

test("every level's Joyce step exists, opens this game, and counts toward the card", () => {
  for (const game of GAMES) {
    assert.equal(ROUND_LENGTH[game.id], 6, game.id);
    assert.equal(evidenceFor(game.kid, game.id).game, game.id);
    for (const level of game.levels) {
      for (const id of level.steps) {
        const def = stepById(game.kid, id);
        assert.ok(def, `${game.id}: ${id} is on ${game.kid}'s path`);
        assert.equal(stepGame(def)?.id, game.id, id);
        assert.equal(level.skill, def.skill, `${id} logs under Joyce's skill name`);
      }
    }
  }
});

test("Word Tree's words are Joyce's sight words, in the same sets", () => {
  assert.deepEqual(tree.SIGHT, JOYCE_SIGHT);
  const one = stepById("gabi", "gabi-sight-1");
  const two = stepById("gabi", "gabi-sight-2");
  assert.deepEqual(tree.LEVELS[0].words, JOYCE_SIGHT.slice(one.from, one.from + one.span));
  assert.deepEqual(tree.LEVELS[1].words, JOYCE_SIGHT.slice(two.from, two.from + two.span));
});

test("Word Tree deals three different words with the target among them, and missed words come back", () => {
  for (const rng of seeds(200)) {
    for (const level of tree.LEVELS) {
      const deal = tree.wordRound(level.words, rng);
      assert.equal(deal.choices.length, 3);
      assert.equal(new Set(deal.choices.map((w) => w.toLowerCase())).size, 3);
      assert.ok(deal.choices.includes(deal.target));
      assert.ok(deal.choices.every((w) => level.words.includes(w)));
    }
  }
  assert.equal(tree.wordRound(tree.LEVELS[0].words, rngFrom(1), { again: "said" }).target, "said");
  // The clue tells the target apart from what is still on screen.
  assert.match(tree.clue("was", ["was", "who"]), /ends with ess/);
  assert.match(tree.clue("the", ["the", "do"]), /starts with tee/);
  assert.match(tree.clue("a", ["a", "and"]), /one letter/);
  assert.match(tree.missLine("to", "the", ["the", "two"]), /^That one says to\. Find the\./);
});

test("Word Workshop: each compound has one real answer, and the wrong pairs are different words", () => {
  for (const item of shop.COMPOUNDS) {
    assert.equal(item.word, item.first + item.second);
    assert.equal(new Set([item.second, ...item.wrong]).size, 3, item.word);
    assert.ok(item.picture, item.word);
  }
  for (const rng of seeds(50)) {
    const deal = shop.compoundRound(rng);
    assert.ok(deal.choices.includes(deal.item.second));
    assert.equal(deal.choices.length, 3);
  }
});

test("Word Workshop: contractions have the answer, a misplaced apostrophe, and a real other contraction", () => {
  for (const item of shop.CONTRACTIONS) {
    assert.equal(new Set([item.short, item.misplaced, item.other]).size, 3, item.full);
    assert.ok(shop.MEANS[item.other], `${item.other} has a meaning to say`);
    assert.notEqual(shop.MEANS[item.other], item.full);
    assert.ok(!shop.MEANS[item.misplaced], `${item.misplaced} is not a real contraction`);
    const { letters, at } = shop.leftOut(item.full, item.short);
    assert.ok(letters.length >= 1, item.full);
    // Taking the left-out letters away from the two words, and the space, gives the contraction.
    const rebuilt = (item.full.slice(0, at) + item.full.slice(at + letters.length)).replace(" ", "");
    assert.equal(rebuilt, item.short.replace("'", ""), item.full);
  }
  assert.deepEqual(shop.leftOut("do not", "don't"), { letters: "o", at: 4 });
  assert.deepEqual(shop.leftOut("cannot", "can't"), { letters: "no", at: 3 });
  assert.deepEqual(shop.leftOut("I will", "I'll"), { letters: "wi", at: 2 });
  assert.match(shop.lines.contractionMiss(shop.CONTRACTIONS[0], "didn't"), /didn't means did not\. We need do not\./);
  assert.match(shop.lines.contractionMiss(shop.CONTRACTIONS[0], "do'nt"), /where oh was left out/);
});

test("Word Workshop: every sentence has a noun, a verb, and an adjective, and each round asks a real word", () => {
  for (const marked of shop.SENTENCES) {
    const tokens = shop.parseSentence(marked);
    const jobs = new Set(tokens.map((t) => t.job).filter(Boolean));
    assert.deepEqual([...jobs].sort(), ["a", "n", "v"], marked);
    for (const token of tokens.filter((t) => t.job === "v" || t.job === "a")) assert.ok(token.link, `${token.text} in ${marked}`);
    assert.doesNotMatch(shop.plain(tokens), /[[\]|]/);
  }
  for (const job of ["n", "v", "a"]) {
    const deal = shop.partsRound(rngFrom(7), { job });
    assert.equal(deal.job, job);
    assert.equal(deal.tokens[deal.index].text, deal.word);
  }
  const verb = shop.partsRound(rngFrom(3), { job: "v" });
  assert.match(shop.lines.partsMiss(verb, "n"), /^Not a noun\. .* is the action\. It's what .* do(es)?\.$/);
});

test("Penguin Pond: skip counting jumps evenly and the missing number is a choice", () => {
  for (const rng of seeds(300)) {
    const deal = pond.skipRound(rng);
    assert.ok([2, 5, 10].includes(deal.by));
    deal.numbers.slice(1).forEach((n, i) => assert.equal(n - deal.numbers[i], deal.by));
    assert.equal(deal.answer, deal.numbers[deal.gap]);
    assert.ok(deal.gap >= 1);
    assert.equal(deal.choices.length, 3);
    assert.equal(new Set(deal.choices).size, 3);
    assert.ok(deal.choices.includes(deal.answer));
    assert.ok(deal.choices.every((n) => n > 0));
  }
  const ones = pond.skipRound(rngFrom(5), { by: 5 });
  assert.match(pond.lines({ thing: "fish", who: (n) => n }).skipMiss(ones, ones.before + 1), /counting by ones/);
});

test("Penguin Pond: odd and even, and bar graphs with one right answer", () => {
  for (const rng of seeds(100)) {
    const small = pond.oddEvenRound(rng, { pictures: true });
    assert.ok(small.n >= 3 && small.n <= 14);
    assert.equal(small.answer, small.n % 2 ? "odd" : "even");
    const big = pond.oddEvenRound(rng, { pictures: false });
    assert.ok(big.n >= 11 && big.n <= 99);
    for (const kind of ["read", "most", "fewest", "more"]) {
      const deal = pond.graphRound(rng, { kind });
      const values = deal.bars.map((bar) => bar.value);
      assert.equal(new Set(values).size, values.length, "no ties");
      assert.ok(values.every((v) => v >= 1 && v <= 10));
      if (kind === "most") assert.equal(deal.value, Math.max(...values));
      if (kind === "fewest") assert.equal(deal.value, Math.min(...values));
      if (kind === "read" || kind === "more") {
        assert.equal(new Set(deal.choices).size, 3);
        assert.ok(deal.choices.includes(deal.answer));
        assert.ok(deal.choices.every((n) => n >= 0));
      }
      if (kind === "more") assert.equal(deal.answer, deal.bigValue - deal.smallValue);
    }
  }
});

test("Letter Lights uses Joyce's four letter groups, then all 26", () => {
  lights.GROUPS.forEach((letters, i) => assert.deepEqual(letters, stepById("connor", `connor-names-${i + 1}`).letters));
  assert.equal(lights.LEVELS.at(-1).letters.length, 26);
  for (const rng of seeds(100)) {
    for (const level of lights.LEVELS) {
      const deal = lights.letterRound(level.letters, rng);
      assert.equal(new Set(deal.choices).size, 3);
      assert.ok(deal.choices.includes(deal.target));
      assert.ok(deal.choices.every((l) => level.letters.includes(l)));
    }
  }
  assert.equal(lights.lines.prompt("w"), "Find the letter double you.");
});
