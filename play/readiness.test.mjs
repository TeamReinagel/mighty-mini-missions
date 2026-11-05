import assert from "node:assert/strict";
import test from "node:test";
import { THINGS, colorRound, jobRound, kindRound, missNumber, missSize, missSort, nameRound, numberRound, shapeRound, sizeRound, SHAPES } from "./readiness.mjs";

function rngFrom(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test("a number round keeps the spoken number among the choices", () => {
  const deal = numberRound(rngFrom(0.1, 0.9, 0.4), { min: 1, max: 5, n: 3 });
  assert.ok(deal.choices.includes(deal.target));
  assert.equal(deal.choices.length, 3);
  assert.ok(deal.target >= 1 && deal.target <= 5);
});

test("the higher number level stays in the top half", () => {
  for (let i = 0; i < 12; i += 1) {
    const deal = numberRound(rngFrom(i / 12), { min: 1, max: 10, n: 3, preferHigh: true });
    assert.ok(deal.target >= 6 && deal.target <= 10);
    assert.ok(deal.choices.includes(deal.target));
  }
});

test("bigger means the large one, and three sizes include a middle", () => {
  const two = sizeRound(() => 0, [{ id: "apple", name: "apple" }], 2);
  assert.equal(two.ask, "bigger");
  assert.equal(two.answer, "big");
  assert.deepEqual(two.sizes.sort(), ["big", "little"]);
  const three = sizeRound(() => 0.9, [{ id: "apple", name: "apple" }], 3);
  assert.equal(three.ask, "smaller");
  assert.equal(three.answer, "little");
  assert.equal(three.sizes.length, 3);
});

test("a color sort uses one color per basket and a different object", () => {
  const deal = colorRound(rngFrom(0.2, 0.8, 0.1, 0.4, 0.6));
  assert.equal(deal.by, "color");
  assert.equal(new Set(deal.models.map((item) => item.color)).size, 2);
  assert.ok(deal.models.some((item) => item.color === deal.item.color));
  assert.ok(deal.models.every((item) => item.id !== deal.item.id));
});

test("a kind sort puts food in one basket and a toy in the other", () => {
  const deal = kindRound(rngFrom(0.2, 0.7, 0.4));
  assert.deepEqual(deal.models.map((item) => item.kind).sort(), ["food", "toy"]);
  assert.ok(deal.models.every((item) => item.id !== deal.item.id));
});

test("food and toy sorts only use clear foods and clear toys", () => {
  const foods = THINGS.filter((item) => item.kind === "food").map((item) => item.id).sort();
  const toys = THINGS.filter((item) => item.kind === "toy").map((item) => item.id).sort();
  assert.deepEqual(foods, ["apple", "berries", "lemon", "pear"]);
  assert.deepEqual(toys, ["ball", "duck", "frog", "train"]);
});

test("his name stays on the card, and the closer set shares his first letter", () => {
  const easy = nameRound(rngFrom(0.1, 0.3), "Connor", { count: 2 });
  assert.equal(easy.cards.length, 2);
  assert.ok(easy.cards.includes("Connor"));
  const closer = nameRound(rngFrom(0.1, 0.9, 0.2), "Connor", { count: 3, sameStart: true });
  assert.equal(closer.cards.length, 3);
  assert.ok(closer.cards.includes("Connor"));
  assert.ok(closer.cards.some((card) => card !== "Connor" && card.startsWith("C")));
});

test("two jobs keep their order, and an extra object is only in the crowd", () => {
  const deal = jobRound(rngFrom(0.2, 0.9, 0.4, 0.1), undefined, { steps: 2, extra: 1 });
  assert.equal(deal.order.length, 2);
  assert.equal(deal.crowd.length, 3);
  assert.ok(deal.order.every((item) => deal.crowd.some((other) => other.id === item.id)));
});

test("a shape round asks for one of the blocks it shows", () => {
  const deal = shapeRound(rngFrom(0.2, 0.8, 0.5), SHAPES, 3);
  assert.equal(deal.choices.length, 3);
  assert.ok(deal.choices.some((shape) => shape.id === deal.target.id));
});

test("a miss names the choice he made and the one to find", () => {
  assert.match(missNumber(6, 8, (n) => `«${n}»`), /«6»/);
  assert.match(missNumber(6, 8, (n) => `«${n}»`), /«8»/);
  assert.match(missSize("bigger", "little"), /more room/);
  assert.match(missSize("smaller", "mid"), /middle/);
  const line = missSort(
    { name: "ball", color: "red", kind: "toy" },
    { name: "apple", color: "red", kind: "food" },
    "kind"
  );
  assert.match(line, /toy/);
  assert.match(line, /food/);
  const color = missSort(
    { name: "ball", color: "red", kind: "toy" },
    { name: "duck", color: "yellow", kind: "toy" },
    "color"
  );
  assert.match(color, /red/);
  assert.match(color, /yellow/);
});
