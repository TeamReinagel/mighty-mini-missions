import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompt } from "./design-studio.mjs";

test("a Sid build practices one Getting started essential skill inside his rules", () => {
  const prompt = buildPrompt({
    id: "sundae",
    title: "Sundae Stand",
    howYouPlay: "Fill the order.",
    win: "The bunny pays.",
    howItIsNew: "The bunny can refuse too many scoops."
  });
  assert.match(prompt, /Getting started/);
  assert.match(prompt, /UF2\.0-Toolkit-Educators\.pdf/);
  assert.match(prompt, /Do not put that skill's name/);
  assert.match(prompt, /skills\.mjs/);
  assert.match(prompt, /Dylan Wiliam and Thomas Guskey/);
  assert.match(prompt, /before any hint/);
  assert.match(prompt, /Don Norman and Edward Tufte/);
  assert.match(prompt, /Dan Saffer, Issara Willenskomer, and William Gaver/);
  assert.match(prompt, /within 400ms/);
  assert.match(prompt, /No background music/);
});
