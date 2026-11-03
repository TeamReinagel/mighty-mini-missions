# The Bag at the Door

Season 2 Episode 1 of Lark & Nib’s Treasure Quest. Introduces d after Season 1’s m a s t p i n r, with map and mat review. A local playable production preview with five child turns, retained phoneme recordings, and a rereadable shared chapter.

Open `/bag-at-the-door/?kid=connor&review=1` from a local HTTP server at the package root. The `review=1` link never sends child learning evidence. The direct page lives alongside the canonical Moon Path renderer in Mighty Mini Missions. From November 2, 2026, it is Gabi’s reading card on the story days in `docs/episodes/two-week-plan-2026-11-02.md`, in place of that day’s Otter Slide card. The mission requires a real completed-episode event after opening.

The supplied ElevenLabs narration is integrated: 8:08.326 of recorded audio in 56 contiguous clips with 114 timed caption/speaker cues. The five child turns pause after their prompts and before their consequences. Pause resumes at the same recording position. Optional unrecorded help and word models use device speech; isolated sound practice uses retained phoneme audio.

The original MP3 stays outside the web package. Its hash, timing plan, documented wording differences, and decoded clip audit are in `tools/`. Run `python3 bag-at-the-door/tools/rebuild-recording.py --check` from the package root to validate the portable plan. Rebuild with `--audio ORIGINAL_MP3 --ffmpeg FFMPEG_EXECUTABLE`. The recording transcript follows the supplied file; the manuscript and PDF retain the authored wording.

The activity props use original textured storybook raster artwork matching the main scenes: brass latch, woven strap, felt pad, illustrated invitations, carved tag, and wooden word labels. Exact prompts and provenance are in `docs/episodes/s2e1-art-prompts.md`.

The early word marks and finger-controlled sliders follow the supplied Reading.com screenshots. The episode’s short CVC words do not need special arches, bars, or yellow sight underlines. Slider audio is supported practice and does not choose a word automatically.

Run `node --test bag-at-the-door/tools/*.test.mjs` from the package root. The production manuscript, 96 casting turns, exact art prompts, scene constraints, runtime budget, and child-response definitions are in `docs/episodes/s2e1-*`.

No API keys or paid audio generation are required for the preview. Keep the source package root as the web root so the relative Moon Path imports resolve.
