# The Gem Gym (puzzle-barn): design brief

**Name: The Gem Gym.** Max named it on 2026-11-06 (it started as Puzzle Barn, then Monster Puzzles). The name lives in one place (`NAME` in `puzzle-barn/app.js`), and the folder and cache names stay `puzzle-barn` / `pb-`.

**Look (changed 2026-11-06):** Max wasn't excited about a farm theme. He loves Pokémon, Mario, and video games, so the game uses Word Monsters' original monsters and worlds: crystal block towers, monster scales weighed in gems, and a team of monsters that evolves as he solves puzzles. No characters, art, or names from Pokémon, Mario, or any other game.

Written 2026-11-05. Status: brief only, nothing built.

## Why this exists

Our direction is **wide on knowledge, deep on skills**. Knowledge comes wide, through read-alouds at Wind Down Time. The skills that carry across many subjects get the depth, and problem solving comes first.

Max is fast and accurate on practice he has already been shown. AdaptedMind covers that. What he doesn't get yet is a problem where he hasn't been shown the method: one where he gets stuck, tries something, and finds a way. Beast Academy offers that kind of problem.

In early January 2027, Stephanie will choose between adding Beast Academy and keeping our own version (decision recorded in `../Memory/05_Decisions.md`, 2026-11-05). This brief is for our version. It needs to be good enough by then that the choice is fair.

## What it has to do better than Beast Academy

1. **Read aloud.** Joyce reads every puzzle, so Max is never held back by text. Later, Gabi and Connor can do real logic puzzles without reading.
2. **Hints that don't give the answer away.** Each hint points at the next thing to look at. None of them gives the answer.
3. **Ask "How did you know?"** After a solve, Max explains his thinking out loud. The report quotes what he said.
4. **Use what he loves.** Monsters to collect and evolve, worlds to play in, and the same monsters he already knows from Word Monsters.
5. **Report the struggle, not just the score.** Friday's report shows where he got stuck, what he tried, and whether he kept going.

## What it must not do

- **Show a broken puzzle.** No child ever sees a puzzle with zero answers, two answers, or a wrong answer key. Every puzzle is checked by code before it ships.
- **Generate puzzles in front of the child.** All puzzles come from a bank that is built, checked, and committed ahead of time.
- **Copy Beast Academy.** No characters, comics, layouts, or problem text. Number pyramids, balance scales, and sum grids are old public puzzle forms, so we can use those.
- **Add time or take ELA.** It shares Max's math with AdaptedMind. It does not add a section, and it never takes the ELA spot, which goes to Lark & Nib.
- **Add pressure.** No timer, no score, no streak shown during a puzzle. Getting stuck is the point.

## Phase 1: the December pilot

### The two puzzle types

Both types are easy for code to generate and to solve, and the solver proves each puzzle has exactly one answer.

**1. Block Towers (number pyramids)**

Crystal blocks are stacked in rows, and each block's number is the sum of the two blocks under it. Some blocks are empty.

| Level | What it asks |
|---|---|
| 1 | 3 rows, sums within 20, blanks only on top. Just add. |
| 2 | 3 rows, one blank on the bottom. Work backward, which means subtracting. |
| 3 | 4 rows, sums within 100. Ties to his current edge, adding to 100. |
| 4 | 4 rows, where no blank can be filled first by simple adding or subtracting. He has to reason about two blanks at once. |

**2. Monster Scales (balance puzzles)**

Little monsters, big monsters, and gems sit on balance scales. The monsters are his partner's own species: stage 1 is the little one, stage 3 the big one. "A little monster balances 2 gems. How many gems balance 3 little monsters?"

| Level | What it asks |
|---|---|
| 1 | One fact, one question. Replace one item with its match. |
| 2 | Two facts that chain together: big monster to little monsters, then little monsters to gems. |
| 3 | A known amount on one side: "A little monster and 2 gems balance 6 gems." |
| 4 | Two unknowns, solved by comparing two scales. |

Balance puzzles are early algebra without symbols. They are the clearest example of "you weren't shown how."

### How a puzzle plays

- **Joyce reads the puzzle.** The goal stays visible in the picture. Uses `say()` and `afterLine()` from `play/kit.mjs`.
- **Answering.** Max taps an empty block and types a number. For scales, he taps "Add a gem" to put gems on the empty pan, taps a gem to take it off, and taps "Let go" to see whether it balances.
- **A miss.** The answer comes off softly, and Joyce answers the choice he actually made: "Those two make 9, and the block says 12." Then he keeps going. No buzzer and nothing taken away, per `AGENTS.md`.
- **The Hint button** is always there, and the hints climb a ladder:
  1. **Where to look.** One empty block lights up, the one the solver can fill next. "Start with this block. Look at the two blocks under it."
  2. **How to think.** "If you know the top and one bottom block, you can work backward."
  3. **A worked twin.** Joyce works a different, easier puzzle of the same kind, one step at a time. His own puzzle stays his. The hints never give the answer to his puzzle.
- **Being stuck.** After about 45 seconds with no taps, the Hint button glows. Joyce never offers a hint on her own, and she never says "hurry."
- **"How did you know?"** After a solve, on about one puzzle in three, Joyce asks: "How did you figure that out?" He holds a big mic button and talks. The browser transcribes his answer, the same way the classroom's "I'll read it" button does (`hearWord` in `classroom/classroom.js`), and Joyce gives one short fixed reply ("Thanks for telling me how you thought about it"). There is no live AI conversation, and no judging what he said. Only the transcript is saved, no audio. "Skip" is always there.
- **Round length.** One round is 3 puzzles. A card is 15 minutes at most, the usual section limit.
- **The team.** The first time, Max picks a partner from three baby monsters. Every solved puzzle gives the partner a spark, hints or not, because sticking with it is what counts. Two sparks evolve it (stage 1 to 2 to 3). A fully grown partner hatches a new monster, which joins the team. The team sits on the shelf at the bottom edge, and tapping one makes it the partner. All of this happens between puzzles, never during one.

### Essential skill

The game script names **adapting-3, Persisting**: "I keep going when faced with challenges." The moment is a miss or a hint followed by a solve.

The skill map already spots persistence on its own (`PERSIST_STEP` in `netlify/lib/skills.mjs`). So this needs a correct `practice()` log, not new skill code.

### What gets logged

Logging follows the testing rules in `AGENTS.md`.

- **First tries.** Each blank's first answer goes through `practice()`, with game, item (puzzle id plus blank), and right or wrong. A second try after a hint is not a new first try.
- **Per puzzle.**
  - Solved or left
  - Number of misses
  - Highest hint step used
  - Time spent
  - Whether he answered "How did you know?", and the transcript
- **Friday's report** keeps three claims apart:
  - **What he can do now:** the levels he solved without a step-3 hint.
  - **How he stuck with it:** misses, hints, puzzles left unfinished, time.
  - **What changed:** compared with the last report, plus one or two quotes from "How did you know?"

### Where it goes in the code

- **The game.** `puzzle-barn/` follows the layout of `block-trade/`: `index.html`, `app.js`, `styles.css`, and the `play/stage.mjs` kit. Like Moon Crates, it has no service worker yet. If the tablet check shows it needs to work offline, add `sw.js` with its own cache prefix, `pb-`.
- **The puzzle logic.** Pure modules with no DOM, in `puzzle-barn/puzzles/`:
  - `pyramid.mjs` and `scales.mjs`: generate, solve, count solutions, and choose the next step to fill.
  - `hints.mjs`: the hint wording for a given state and a given wrong answer.
- **The bank.** A build script, `puzzle-barn/tools/build-bank.mjs`, writes `puzzle-barn/bank.json` with about 60 puzzles per level per type. The bank is committed so a person can read it.
- **The game's card.** One entry each in `ROUND_LENGTH` (`play/round-length.mjs`) and `EVIDENCE` (`netlify/lib/classroom.mjs`). Max gets a card on full days.
- **Where it sits in his dose.** It is Max's **math** on some days, taking turns with AdaptedMind: The Gem Gym 2 school days a week, AdaptedMind the other 3 (Stephanie's choice, 2026-11-05). The exact weekdays get set when his board is built. ELA is not touched: when Reading.com ends, its place goes to the Lark & Nib series. On days when math is AdaptedMind, Puzzle Barn can also be offered as a bonus once his dose is done. That tests it in the same place Beast Academy would go.

### Tests that must pass before release

- **The bank.**
  - Every puzzle in `bank.json` has exactly one solution.
  - Every hint-1 target can actually be filled next.
  - Every puzzle's numbers stay inside its level's limits.
- **Levels get harder.** Level 4 puzzles need more steps than level 1, measured by the solver's step count.
- **Every miss gets a reply.** For each type of wrong answer, the miss line names what he chose.
- **Logging.** `practice()` is called once per blank's first try, and never for a retry.
- **The existing suites still pass:** `npm run -s test:joyce` and `npm run -s test:lark-nib`.
- **A check on Max's own Android tablet** before the card goes on the board:
  - Voice
  - Tapping gems on and off
  - The mic button and transcription
  - Reloading on a weak connection

## Phase 2: January and later, only if The Gem Gym wins

These are listed so Phase 1 doesn't make them harder. They are not part of the pilot.

- **Sum grids.** 3×3 grids where cages add up to targets (Latin square rules). Same engine.
- **Find another way.** Puzzles with more than one answer, where any valid answer counts and the bonus is a second way. The code checks his answer against the rules instead of an answer key. This round practices problem-solving-5, Creating options.
- **Story problems from their own life.** Each week, AI drafts problems about the homestead, his LEGO builds, and his siblings. A second check solves each one on its own, and Stephanie approves the batch in Slack with the existing Approve / Not now flow.
- **Max makes puzzles.** He builds a stack or a scale puzzle for Gabi, and the solver tells him whether it has no answer, one answer, or two. Fixing a puzzle with two answers is debugging, and it practices creativity as well as problem solving. This could connect to Design with Sid later.
- **Gabi's and Connor's versions.** Two-row stacks with dot pictures within 5, and scales with matching pictures, all read aloud.

## The January comparison

During the first week of January, Max takes Beast Academy's free placement test and tries its sample problems. Then compare:

| Question | How to tell |
|---|---|
| Does he choose it? | On days when it's optional, which one does he open? |
| Does he keep going? | Persistence spots on the skill map in December, and solves that came after a miss. |
| Can he explain it? | The "How did you know?" quotes. |
| Did he move up? | The highest level solved without a step-3 hint. |
| Is it reliable? | The number of "it didn't work" moments in December. |
| What did it cost? | Stephanie's time: setup, fixes, approvals. |

**If The Gem Gym wins,** start Phase 2. **If Beast Academy wins,** add it for Max, and keep The Gem Gym as the read-aloud version for Gabi and Connor.

## Timeline

| When | What |
|---|---|
| November (reliability month) | Build the puzzle engine, bank, tests, and game. Nothing goes on the kids' boards. |
| Late November | Check it on Max's tablet. When Reading.com ends, Lark & Nib becomes his ELA, and The Gem Gym starts taking turns with AdaptedMind as his math. |
| December | Max plays. Friday reports include the puzzle section. |
| First week of January | Beast Academy placement and samples. Make the comparison. Stephanie decides. |

## Questions for Stephanie before building

1. ~~**The name.**~~ Decided: Max named it The Gem Gym (2026-11-06), after the look moved to Word Monsters.
2. ~~**How often.**~~ Decided: The Gem Gym 2 days a week and AdaptedMind 3, both in Max's math spot.
3. ~~**"How did you know?"**~~ Decided: saving the text of his answer (no audio) for Friday's report is fine.
4. ~~**The repository is public.**~~ Decided: `netlify.toml` returns 404 for `/docs/*`, the same way it does for `/netlify/*`. Nothing the site loads lives in `docs/`.
