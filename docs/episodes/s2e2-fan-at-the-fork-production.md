# The Fan at the Fork

Season 2 · Episode 2 · November 3, 2026

The supplied **6:31.315 ElevenLabs story recording** is integrated as 36 contiguous MP3 clips with 81 timed caption/speaker cues. Its added spoken title, series and episode introduction are retained and captioned in the first clip. All 35 physical cuts fall in measured quiet, including the seven reading-task pauses. The original MP3 remains outside the web publish tree; its SHA-256 is `b52383ce8c74f9feffd4370604143c7f049dfbe2bbaf2021f36c7ce2de323529`.

Release: November 3, 2026. Publishing this episode leaves daily assignments unchanged. Existing isolated phoneme clips remain. Short help, feedback and optional word models still use the temporary installed Mac voices. The normal story now uses the supplied recording, at its recorded speed. The episode content version was advanced so temporary preview completion cannot become reading credit.

The measured story duration is **391.315351 seconds**, before child turns, retained phoneme models, support and transitions. The 9-11 minute whole-experience allowance remains provisional; actual child-paced timing is unmeasured. Do not add narration merely to meet a minimum, and do not hurry the child to fit an estimate.

## Literacy and response inventory

New mapping: f. Previously introduced: m, a, s, t, p, i, n, r, d. Child word targets: fan, fin, fit. Rich narrator vocabulary does not add spellings to the child's code. All child-read words and sentences pass the cumulative single-letter mapping audit. The uppercase names Sam and Pip are paired with S/s and P/p before use in Season 2.

| Gate | Category | Child's current job | Automatic consequence |
| --- | --- | --- | --- |
| review-am | word reading | Read am. Slide the sounds, or read with Lark. | Our little word is still with us. |
| new-f | new sound | Which letter makes the soft air sound at the start of fan? | The soft air sound goes with f. |
| choose-fin | word reading | Read both labels. Find fin for our route. | Fin. The fish waymarker shows our route. |
| write-f | writing | Write f: curve over, down, then across. | Your f is on the courier page. |
| find-fit | word reading | Read the whole word. Find fit. | Fit. The strap lies flat without a twist. |
| read-note | sentence reading | Read Nib’s small story. S and s, and P and p, make the same little sounds. | You reached the end of the little story. |
| check-note | comprehension | Who used the fan in the little story? | Pip used the fan. Sam had been running. |

Extra non-literacy activities: **0**. Writing and comprehension belong to the required literacy core. Reading sliders, sound models, guided tracing and sentence finger tracking are participation/support, not proof of independent reading or handwriting quality. One first choice is retained separately from supported retries. A correct response resumes its consequence without a Continue tap. A response is never inferred from elapsed time.

## Main child reading

Sam ran.
Sam sat.
Pip did fan Sam.
Pip sat.

The child controls the sentence track. A word-help tap is recorded as support. The question in the fork chapter asks who used the fan, with Sam and Pip as decodable choices; the correct answer is Pip. Rereading returns to the same comprehension question and stays supported. In Season 1, the pictured comprehension asks which sail kept the wagon steady.

## Recording integration and rebuild

The clean `s2e2-fan-at-the-fork-manuscript.txt` and casting CSV remain the authoring reference. The supplied recording adds a spoken introduction and otherwise follows the manuscript. The isolated f demonstration remains after the explicit new-sound teaching beat. The recording template stays unapproved for any future replacement; the active `recording.json` is separately validated against the manuscript and source coverage.

`fan-at-the-fork/tools/narration-alignment.json` records all word windows, speaker regions, physical cuts and quiet intervals. `tools/recording-audit.json` contains every encoded clip's hash and independently decoded duration. All 17,257,007 decoded source samples are covered by contiguous ranges. Four cut centers were nudged by at most 1.3 ms within their measured silence to avoid the MP3 decoder's short final-packet padding. No spoken material was removed or repeated.

Run `python3 fan-at-the-fork/tools/rebuild-recording.py --check` to validate the saved edit plan. Rebuilding requires the exact original MP3 through `--audio` plus a working FFmpeg executable through `--ffmpeg`; the source hash must match. Never reuse these timestamps with a different recording.

The offline recognizer wrote “them” for the short am prompt in two passes. That is retained as an unconfirmed pronunciation-review item, not treated as an authored text change. The source audio is unchanged; the printed am, isolated a/m sounds and word support remain available. Other transcription differences were phonetic spellings or recognition errors; a fresh context confirmed “Nib declared proudly.”

## Staging and continuity

Static plates retain a broad dry foreground. Character foot anchors are x=.17/.85, y=.89. New raster props sit on that plane; speech uses the retained mouth masks and fixed poses. Never stand either character on the creek. The sail wagon remains chocked until the narrated safe test is complete; the small sail and ballast appear together. The fork has all three undelivered invitations and no new map section. The sail ends at the ridge waystation with the original plus the first recovered map section, three spaces still empty, and the tapping-table handoff.

## Preview, evidence and release

`recording.json` now has `approved:true` and `status:approved`, after alignment, full source coverage and quiet-cut checks. Main story playback selects it and retains the existing support recordings. `preview-recording.json` remains an unapproved fallback if a production manifest is invalid. Review URLs and parent previews send no learning evidence; previously played temporary previews cannot be promoted into credit. A fresh ordinary play may report first responses and the exact ending event only after all required tasks and the complete narrated ending. This release publishes the episode without changing a daily card.

Run `npm run test:lark-nib` and `npm run test:joyce`. Production audio checks cover the 36 clip hashes, exact decoded lengths, 35 quiet boundaries, intro captions, source gaps, repeated media, caption bounds, valid production selection and safe fallback. Browser review checks the prompt pauses, automatic task transitions and pause/resume using the supplied media. Real-child runtime remains unmeasured.
