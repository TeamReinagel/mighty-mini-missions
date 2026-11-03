import assert from "node:assert/strict";
import test from "node:test";
import { activityChoose, activityView, correctChoice, startActivity, startLine } from "./logic.mjs";

function lines(play, scene) {
  let state = startActivity(play, { scene });
  const heard = [startLine(play)];
  let misses = 0;
  let guard = 0;
  while (!state.done && guard++ < 40) {
    const view = activityView(state);
    heard.push(view.prompt);
    const wrong = view.choices.find((choice) => choice.id !== correctChoice(state));
    if (wrong && misses < 1) {
      const miss = activityChoose(state, wrong.id);
      assert.equal(miss.correct, false);
      assert.equal(miss.first, true);
      assert.equal(miss.state.done, false);
      heard.push(miss.feedback);
      const again = activityChoose(miss.state, wrong.id);
      assert.equal(again.first, false);
      state = miss.state;
      misses += 1;
    }
    const next = activityChoose(state, correctChoice(state));
    if (next.partial) {
      assert.equal(next.state.built.length > state.built.length, true);
      state = next.state;
      continue;
    }
    assert.equal(next.correct, true);
    state = next.state;
  }
  assert.equal(state.done, true);
  heard.push(activityView(state).prompt);
  return heard.join(" ");
}

test("each activity can be finished, and a miss stays on that step", () => {
  for (const play of ["pockets", "ant", "i-am", "folio", "strap"]) {
    const heard = lines(play, "mouse");
    assert.match(heard, /I'm done/);
    assert.doesNotMatch(heard, /\b(puh|duh|buh|tuh)\b/i);
  }
});

test("am starts with a, and a wrong tap does not stick", () => {
  let state = startActivity("pockets");
  while (activityView(state).kind !== "blend") state = activityChoose(state, correctChoice(state)).state;
  const miss = activityChoose(state, "m");
  assert.equal(miss.correct, false);
  assert.deepEqual(miss.state.built, []);
  assert.match(miss.feedback, /apple/);
  const part = activityChoose(miss.state, "a");
  assert.equal(part.partial, true);
  assert.deepEqual(part.state.built, ["a"]);
  const done = activityChoose(part.state, "m");
  assert.equal(done.complete, true);
  assert.equal(done.first, false);
});

test("d is distinguished from b without leaving the letter", () => {
  let state = startActivity("strap");
  state = activityChoose(state, correctChoice(state)).state;
  const view = activityView(state);
  assert.equal(view.prompt.includes("b and p"), true);
  const miss = activityChoose(state, "b");
  assert.equal(miss.state.index, state.index);
  assert.match(miss.feedback, /other side/);
  assert.match(miss.feedback, /pad/);
});

test("the journal scene changes the sentence and still asks for am", () => {
  const mouse = startActivity("i-am", { scene: "mouse" });
  let state = mouse;
  while (!activityView(state).prompt.includes("journal")) state = activityChoose(state, correctChoice(state)).state;
  assert.match(activityView(state).prompt, /mouse/);
  const bird = startActivity("i-am", { scene: "bird" });
  let other = bird;
  while (!activityView(other).prompt.includes("journal")) other = activityChoose(other, correctChoice(other)).state;
  assert.match(activityView(other).prompt, /bird/);
});
