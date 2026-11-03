# The Sail That Wouldn’t Stay

Season 1 · Episode 3 · November 3, 2026

The supplied **6:19.153 ElevenLabs story recording** is integrated as 38 contiguous MP3 clips with 76 timed caption/speaker cues. Its added spoken title, series and episode introduction are retained and captioned in the first clip. All 37 physical cuts fall in measured quiet, including the six task pauses. The original MP3 remains outside the web publish tree; its SHA-256 is `42df828e562acba46dce5771f1aa3bce4173f7841f1a1d7b87acd3a97b91156f`.

Release: November 3, 2026. Publishing this episode leaves daily assignments unchanged. The existing isolated s demonstration remains in place. Short help, feedback and optional word models still use the temporary support voices. Main story playback now uses the supplied recording at its recorded speed. The content version was advanced so temporary preview completion cannot turn into reading credit.

The measured story duration is **379.153424 seconds**, before child turns, retained phoneme models, support and transitions. The 8-10 minute whole-experience allowance remains provisional; actual child-paced timing is unmeasured. Do not add narration merely to meet a minimum, and do not hurry the child to fit an estimate.

## Literacy and response inventory

New mapping: s. Previously introduced: m, a. Child word targets: am. Rich narrator vocabulary does not add spellings to the child's code. All child-read words and sentences pass the cumulative single-letter mapping audit. The uppercase names Sam and Pip are paired with S/s and P/p before use in Season 2.

| Gate | Category | Child's current job | Automatic consequence |
| --- | --- | --- | --- |
| review-am | word reading | Read am. Slide its sounds, or read with Lark. | Am. Our little word can travel with us. |
| new-s | new sound | Which letter makes the soft hiss we heard in the grass? | Our soft hiss goes with s. |
| write-s | writing | Write s: curve round, then curve back. | Your s curls across our journal page. |
| find-sack | sound application | Listen: mat. Sack. Which starts with our soft hiss? | Sack starts with our soft hiss. Lark brings it to the wagon. |
| fill-sack | story action | Slide the sand up to the line on the sack. | The sack is filled. Lark ties it low to the wagon. |
| check-story | comprehension | Which sail helped our wagon stay steady? | The small sail and low sand sack helped the wagon stay steady. |

Extra non-literacy activities: **1**. Writing and comprehension belong to the required literacy core. Reading sliders, sound models, guided tracing and sentence finger tracking are participation/support, not proof of independent reading or handwriting quality. One first choice is retained separately from supported retries. A correct response resumes its consequence without a Continue tap. A response is never inferred from elapsed time.

## Main child reading

No separate sentence-reading section. The child reads am in shared reading; the adult supplies all other words.

The child controls the sentence track. A word-help tap is recorded as support. The question in the fork chapter asks who used the fan, with Sam and Pip as decodable choices; the correct answer is Pip. Rereading returns to the same comprehension question and stays supported. In Season 1, the pictured comprehension asks which sail kept the wagon steady.

## Recording integration and rebuild

The clean `s1e3-sail-that-wouldnt-stay-manuscript.txt` and voice-turn CSV remain the authoring reference. The recording adds a spoken introduction and otherwise follows the story manuscript. Keep the retained isolated s sound after the explicit new-sound teaching beat. The recording template remains unapproved for a future replacement; the active `recording.json` is separately validated against the manuscript and source coverage.

`tools/narration-alignment.json` records the exact-text word windows, speaker regions, physical cuts and measured quiet intervals. `tools/recording-audit.json` contains every encoded clip's hash and independently decoded duration. All **16,720,666 decoded source samples** are covered by contiguous ranges. Five cut centers were moved by at most 1.3 ms within measured silence to avoid the MP3 decoder's short final-packet padding. No spoken material was removed or repeated.

Run `python3 sail-that-wouldnt-stay/tools/rebuild-recording.py --check` to validate the saved edit plan. Rebuilding requires the exact original MP3 through `--audio` and an FFmpeg executable through `--ffmpeg`; the source hash must match. A different recording requires new alignment and cut inspection.

Fresh-context offline transcription confirmed that the apparent duplicated “the” and shortened “suspiciously” were recognition artifacts. The recognizer wrote “them” for the short am prompt in two passes; retain that as an unconfirmed pronunciation-review item rather than changing the authored wording. The source is unchanged, and printed am plus the isolated a/m sound and word supports remain available.

## Staging and continuity

Static plates retain a broad dry foreground. Character foot anchors are x=.17/.85, y=.89. New raster props sit on that plane; speech uses the retained mouth masks and fixed poses. Never stand either character on the creek. The sail wagon remains chocked until the narrated safe test is complete; the small sail and ballast appear together. The fork has all three undelivered invitations and no new map section. The sail ends at the ridge waystation with the original plus the first recovered map section, three spaces still empty, and the tapping-table handoff.

## Preview, evidence and release

The active `recording.json` now has `approved:true` and `status:approved`, after exact alignment, source coverage and quiet-cut checks. The normal player selects this supplied recording and keeps the existing short support recordings. The unapproved `preview-recording.json` remains a fallback if a production manifest is invalid. Review URLs and parent previews send no learning evidence; older temporary-preview completion cannot become credit. A fresh ordinary play may report first responses and the exact ending marker only after every required task and the complete narrated ending. This release publishes the episode without changing a daily assignment.

Run `npm run test:lark-nib` and `npm run test:joyce`. Both supplied recordings have checks for clip hashes, exact decoded lengths, quiet cuts, intro captions, damaged source ranges, repeated media, invalid caption bounds, valid production selection and safe fallback. Browser review checks the six prompt pauses, automatic task transitions, pause/resume and the ending using the supplied recording. Actual child-paced duration remains unmeasured.
