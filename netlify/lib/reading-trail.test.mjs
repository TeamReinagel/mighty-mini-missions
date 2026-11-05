import assert from "node:assert/strict";
import test from "node:test";
import { annotate, joyceHint, marksOpen, pictureUnlocked, sliderSegments } from "./reading-marks.mjs";
import {
  STOPS, TRAILS, applyFinish, choicesFor, emptyProgress, episodeById, gradeChoice, isSolid,
  nextPlayable, pictureUnlocked as trailPicture, placeChild, placementProbe, resume, shelf, syncScript, trailNumber
} from "./reading-trail.mjs";

test("early pages show marks through trail 4, and a tap opens them after that", () => {
  assert.equal(marksOpen(1, false), true);
  assert.equal(marksOpen(4, false), true);
  assert.equal(marksOpen(5, false), false);
  assert.equal(marksOpen(5, true), true);
  assert.equal(marksOpen(8, false), false);
});

test("the picture stays hidden until every line on the page is read", () => {
  assert.equal(pictureUnlocked(0, 3), false);
  assert.equal(pictureUnlocked(2, 3), false);
  assert.equal(pictureUnlocked(3, 3), true);
  assert.equal(trailPicture(1, 2), false);
});

test("arches, bars, and sight words mark the way Reading.com does", () => {
  const things = annotate("things", { taught: ["th", "ng"] });
  assert.deepEqual(things.chunks.map((chunk) => [chunk.text, chunk.mark]), [
    ["th", "arch"],
    ["i", "plain"],
    ["ng", "arch"],
    ["s", "plain"]
  ]);

  const change = annotate("change", { taught: ["ch", "silent-e", "soft-g"] });
  assert.deepEqual(change.chunks.map((chunk) => [chunk.text, chunk.mark, Boolean(chunk.silent)]), [
    ["ch", "arch", false],
    ["a", "bar", false],
    ["n", "plain", false],
    ["g", "bar", false],
    ["e", "plain", true]
  ]);
  assert.equal(change.chunks.find((chunk) => chunk.soft === "g").say, "juh");
  assert.equal(sliderSegments(change).map((segment) => segment.text).join(""), "chang");

  const see = annotate("see", { taught: ["ee"] });
  assert.equal(see.chunks.length, 2);
  assert.equal(see.chunks[1].text, "ee");
  assert.equal(see.chunks[1].mark, "arch");

  const that = annotate("that", { sight: ["that", "the", "a"] });
  assert.equal(that.sight, true);
  assert.equal(sliderSegments(that).length, 1);
  assert.equal(sliderSegments(that)[0].sight, true);

  const seat = annotate("seat", { taught: ["ea"] });
  assert.equal(seat.chunks.find((chunk) => chunk.mark === "arch").text, "ea");
  assert.deepEqual(sliderSegments(seat).map((segment) => segment.text), ["s", "ea", "t"]);
});

test("Joyce hints the mark and does not say the word", () => {
  const change = annotate("change", { taught: ["ch", "silent-e", "soft-g"] });
  const hint = joyceHint(change);
  assert.match(hint, /stay together/);
  assert.equal(hint.toLowerCase().includes("change"), false);
  assert.equal(joyceHint(annotate("that", { sight: ["that"] })), "Say this one as a whole word.");
  assert.equal(joyceHint(annotate("race", { taught: ["silent-e", "soft-c"] })).includes("race"), false);
});

test("a long word can be cut into the chunks the slider speaks", () => {
  const sunset = annotate("sunset", { taught: [], splits: { sunset: ["sun", "set"] } });
  assert.deepEqual(sliderSegments(sunset).map((segment) => segment.say), ["sun", "set"]);
  assert.equal(sunset.chunks.some((chunk) => chunk.gap), true);
});

test("each season has one playable opening episode and later chapters waiting", () => {
  assert.equal(TRAILS.length, 8);
  for (const trail of TRAILS) {
    const ready = trail.episodes.filter((episode) => episode.ready);
    assert.equal(ready.length, 1, trail.id);
    assert.equal(ready[0].n, 1);
    for (const stop of STOPS) assert.ok(ready[0][stop] || ready[0].topics, `${ready[0].id} ${stop}`);
    assert.ok(ready[0].essential);
    assert.ok(ready[0].intro?.length >= 3, `${ready[0].id} intro`);
    assert.ok(trail.episodes.length >= 8);
    assert.equal(trail.episodes.filter((episode) => !episode.ready).every((episode) => episode.title && episode.skill), true);
  }
  assert.equal(trailNumber(episodeById("t4e1")), 4);
  assert.equal(trailNumber(episodeById("t5e1")), 5);
  assert.equal(nextPlayable(episodeById("t1e1")), null);
});

test("lesson 1 teaches the sound before the path, and writing points at a yellow dot", () => {
  const episode = episodeById("t1e1");
  const said = episode.intro.map((beat) => beat.text).join(" ");
  assert.match(said, /piece of the map/i);
  assert.match(said, /moon stone/i);
  assert.match(said, /mmm/i);
  assert.equal(episode.intro.some((beat) => beat.cue === "sound"), true);
  assert.match(episode.map.prompt, /which path hums mmm/i);
  assert.equal(episode.map.touch, "split");
  assert.equal(episode.river.prompt, "Start here.");
  assert.equal(episode.river.line, "The piece needs its letter.");
  assert.equal(episode.next, "Nib can see another piece.");
  const told = episode.intro.length
    + episode.shore.lines.length
    + ["map", "lagoon", "woods", "cove", "river", "treasure"].reduce((sum, stop) => sum + (episode[stop]?.lead?.length || 0), 0);
  assert.ok(told >= 45, `episode is short: ${told} lines`);
  const saved = { ...emptyProgress(), stop: "river", introSeen: "t1e1", tries: [{ item: "map", correct: true }] };
  const rewound = syncScript(saved, episode);
  assert.equal(rewound.stop, "map");
  assert.equal(rewound.introSeen, "");
  assert.equal(rewound.script, "s1e1-v2");
  assert.equal(syncScript(rewound, episode), rewound);
  const finished = {
    ...emptyProgress(),
    stop: "waiting",
    script: "s1e1-v2",
    done: ["t1e1"],
    introSeen: "t1e1",
    treasures: [{ id: "moon-stone", name: "Moon stone" }]
  };
  const again = syncScript(finished, episode);
  assert.equal(again.stop, "map");
  assert.equal(again.treasures[0].id, "moon-stone");
  assert.equal(again.playedScript, "s1e1-v2");
});

test("a miss stays on the stop, and a shaky episode comes back narrower", () => {
  const episode = episodeById("t1e1");
  assert.equal(gradeChoice("sun", episode.map.choices).stay, true);
  assert.equal(gradeChoice("moon", episode.map.choices).correct, true);
  const narrow = choicesFor(episode.lagoon.choices, true);
  assert.equal(narrow.length, 2);
  assert.equal(narrow.some((choice) => choice.correct), true);

  const tries = [
    { item: "map", correct: false },
    { item: "lagoon", correct: false },
    { item: "woods", correct: true },
    { item: "cove", correct: false }
  ];
  assert.equal(isSolid(tries), false);
  const shaky = applyFinish(emptyProgress(), episode, tries);
  assert.equal(shaky.shoreUp, "t1e1");
  const again = resume(shaky, episode);
  assert.equal(again.narrow, true);
  assert.deepEqual(again.stops, ["map", "lagoon", "woods"]);
  assert.equal(shaky.treasures[0].id, "moon-stone");
  assert.equal(shaky.chapters[0].episodeId, "t1e1");
});

test("a solid opening episode waits for the next chapter and can be resumed", () => {
  const episode = episodeById("t1e1");
  const progress = emptyProgress();
  progress.stop = "shore";
  progress.line = 1;
  const point = resume(progress, episode);
  assert.equal(point.stop, "shore");
  assert.equal(point.line, 1);

  const done = applyFinish(progress, episode, [
    { item: "map", correct: true },
    { item: "lagoon", correct: true },
    { item: "woods", correct: true },
    { item: "cove", correct: true }
  ]);
  assert.equal(done.shoreUp, null);
  assert.equal(done.stop, "waiting");
  assert.equal(resume(done, episode).stop, "waiting");
  const books = shelf(done);
  assert.equal(books[0].bound, false);
  assert.equal(books[0].chapters[0].earned, true);
  assert.equal(books[0].chapters[1].ready, false);
});

test("placement starts at the first pattern the child misses", () => {
  const probe = placementProbe();
  assert.equal(probe.length, 8);
  assert.equal(probe[0].episodeId, "t1e1");
  assert.equal(placeChild([
    { episodeId: "t1e1", correct: true },
    { episodeId: "t2e1", correct: false },
    { episodeId: "t3e1", correct: true }
  ]), "t2e1");
  assert.equal(placeChild(probe.map((item) => ({ episodeId: item.episodeId, correct: true }))), "t8e1");
});
