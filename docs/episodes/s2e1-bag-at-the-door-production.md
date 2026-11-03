# The Bag at the Door

Season 2 of Lark & Nib’s Treasure Quest · Through the Woods · Episode 1

## Build status

The prose, five child turns, word sliders, retained letter-sound recordings, generated library and bag assets, cast layers, local bookmarks, collection tag, and rereadable chapter are implemented. The supplied ElevenLabs recording is integrated as 56 paragraph clips with 114 timed caption/speaker cues. Story playback uses that recording; short unrecorded help, feedback, and optional word models use device speech. The retained isolated phoneme recordings remain in use. From November 2, 2026, the episode is Gabi’s reading card on the story days in [the two-week plan](two-week-plan-2026-11-02.md), in place of that day’s Otter Slide card. Other school days keep Otter Slide. Math stays beside it. Its checkmark requires the exact completed-episode event after opening, for Gabi.

## Story and teaching

The library is open and the Season 1 map remains complete. Three fresh invitations are packed for Reed Hut, the Mill, and Fern Lodge. Nib’s strap catches under the library latch. The child reviews map and mat, learns d, blends pad, finds the labeled cupboard, protects the strap, and cooperates with Lark and Nib to free it. The invitations are briefly set on the dry shelf during the repair, then matched back into their three pockets. None is delivered in this episode. The crew leaves with the padded strap, map, route book, three invitations, and a fin waymarker as its next clue.

The small wooden d doorway tag is an ordinary keepsake from the packing shelf. It and the first courier journal page are collected; the season’s post horn remains a finale reward.

New mapping: d. Inherited mappings: m a s t p i n r. Review: map and mat, including their final consonants. Independent child reading is limited to these mappings. The optional shared chapter also models sad, dim, and did. Names, destinations, fin, door, bag, library, and all other untaught printed text are read aloud or supplied.

## Runtime budget

The supplied recording decodes to **488.325964 seconds (8:08.326)**, including the spoken title, series, season, and episode introduction. All source audio is retained in order. Allowing 1½ minutes for ordinary child responses and ½ minute for transitions gives a planning total of about **10:08**, within the conditional Season 2 allowance of 9–11 minutes. The audio duration is measured; response and transition allowances are estimates, not a measured family session or deadlines. Optional rereading is extra. The original 1,060-word authoring manuscript is retained separately from the recording transcript.

## Annotation convention

Reference images were inspected from the saved Reading.com screenshots dated October 27 at 4:22:20 PM and 4:16:09 PM. The convention uses coral arches above graphemes working as one sound, green bars above long vowels and soft c/g, yellow whole-word sight underlines, and a finger-controlled track beneath each word. The fill follows the finger and sound positions follow graphemes; it never advances itself. Keyboard access uses the arrow keys, Home, and End.

All seven printed words used in this episode are three-letter short-vowel words, so their letters stay plain. No arches, bars, or sight-word yellow are invented. The normal pale track remains visible by default. Sliding plays the existing isolated phoneme recordings; a completed slide can model the whole word. This is support, not an answer submission. Joyce-style help remains a separate explicit action.

## Cuts and responses

### review-map

Cut after: “Let’s take the map,” Lark suggested warmly. “Which label says map?”

Visible prompt: Which label says map?

Response kind: review. A first label choice before sound modeling may be word recognition evidence. A tap is not oral decoding.

Outcome: The map folio is packed. The mat stays on the shelf.

### model-pad

Cut after: “Here are two sounds we know and our new one,” Lark explained patiently. “We can join them: pad. A soft pad can protect the strap. Slide with me, then say the whole word if you like.”

Visible prompt: Slide with Lark. Then say pad if you like.

Response kind: model. This turn is modeled practice or an ungraded story action.

Outcome: We joined p, a, and d. Pad.

### find-pad

Cut after: “The last sound matters too,” Lark reminded him gently. “Find pad on the shelf.”

Visible prompt: Find pad on the shelf.

Response kind: modeled-transfer. The word pad was just modeled. Record this as supported transfer even before a hint; do not call it independent decoding.

Outcome: The pad cupboard opens. Take the soft pad to the latch.

### free-strap

Cut after: “Bring the strap through the gap,” Lark urged encouragingly. “We’ll hold it for you.”

Visible prompt: Bring the strap through the gap.

Response kind: story. This turn is modeled practice or an ungraded story action.

Outcome: The strap is through. Lark can lower the latch.

### pack-invitations

Cut after: “Three invitations,” Lark counted calmly. “Three pockets. Put each picture with its matching pocket, and we’ll check them together.”

Visible prompt: Match the three pictures to the three pockets.

Response kind: story. This turn is modeled practice or an ungraded story action.

Outcome: All three invitations are packed. Nothing has been delivered yet.

## Casting and recording handoff

The clean TXT contains spoken prose only. The CSV separates narrator, Lark, and Nib turns while retaining the expressive speech attributions in narrator turns. Assign the established cast in ElevenLabs. The quote marks and actor names in the manuscript are prose, not voice-switch commands. The CSV is the casting reference.

Audition excited, cautious, gently urgent, and relieved lines. The new d model uses the retained isolated phoneme recording, without an added vowel. The teaching turn also plays p a d one sound at a time. The short i and a clips are the selected short vowels. Listen to the actual sounds as part of production acceptance.

The supplied recording has its own source hash, decoded duration, exact-text DTW alignment, paragraph clips, caption/speaker cues, and five interaction cuts. No Moon Path timestamps or narration are reused. Every prompt ends before its consequence; all 55 paragraph cuts sit in measured quiet. Short stop-consonant closures are avoided by selecting the longer following pause. The template retains the 56 original authoring paragraphs. The manuscript SHA-256 is 36cec6324164e2fbcb498a6694cecc224d3c3de83d3173c84ec411baa321f4ac.

Source: `ElevenLabs_The_Bag_at_the_Door.mp3`

Source SHA-256: `eecde67d0c38ae67b69d5d8fb0910fdbc26f4564a1f10e74a58cb51d0fd65fed`

The original MP3 is retained outside the web publish tree. `bag-at-the-door/tools/narration-alignment.json` contains this recording’s timing, measured quiet intervals, and explicit wording differences. `tools/recording-audit.json` records each encoded file hash and independently decoded length. `tools/rebuild-recording.py --check` validates the portable plan. To rebuild, pass the original source with `--audio` and an FFmpeg executable with `--ffmpeg`. A different MP3 hash is rejected and requires new alignment.

The recording adds its spoken opening title and differs from the authoring copy in three places: “The loop” becomes “A loop”; “Nib exclaimed delightedly” becomes “Nib exclaimed”; and the aside “You did not need to read those names yourself” is absent. A whole-recording ASR pass and separate fresh-context excerpt passes agree on these differences. Captions follow the supplied audio; the authoring manuscript and PDF remain the authored copy. The separate recording transcript includes the spoken opening and wording changes.

`recording.mjs` validates the complete source coverage, manuscript identity, unique clip files, and valid cues before enabling the recording. At normal playback the story advances automatically into each child turn and waits. Pause and app hiding retain the current recording position. After a playback failure, continuing without that narration marks the session as reviewed. Short optional help still uses device speech where no matching recording exists.

Review links, scene jumps, device previews, and skipped narration send no child learning or Joyce completion events. An ordinary completed session with the supplied recording may report `bag-at-the-door:episode-complete`; the November 2 mission uses that marker and leaves ordinary word practice, helped attempts, and other children’s completions separate.

## Scene and support planes

The new library plate is shown uncropped at its original aspect ratio, including in portrait. Nib’s feet and the courier bag bottom meet the dry plank floor. Invitations removed during the repair sit on the visible shelf top. The latch is on the actual left jamb in the accepted image. The original woven-strap artwork connects the bag to it. The felt pad covers its lower edge. Lark’s airborne pose has an explicit flight cue during the holding turn; no one stands on water.

The enlarged strap view uses original textured oak-and-brass artwork with a separate woven loop. Its touch target sits in the actual clearance beneath the raised arm, remains at least 44 pixels across, and the loop leaves the close-up once it is free. A wrong drop leaves the strap in hand; tap-then-tap and keyboard access are alternatives to dragging. The packing view uses the same bag asset, three pockets, and three parchment invitations, each illustrated with its destination rather than a vector symbol. A mismatched pocket keeps the invitation available and explains the picture to compare.

The cast and fixed mouth masks are reused from moon-path. Talking changes only the mouth over a stable body. Walking frames are retained but this episode’s scene changes do not require an invented walking loop. Reduced motion keeps the same visible state.

## Rereadable shared chapter

Adult: Nib’s bag caught beneath the latch. We found a soft

Child: **pad**

Adult: At first Nib drooped. Lark described how he felt:

Child: **sad**

Adult: The cupboard was dark inside. Lark called it

Child: **dim**

Adult: Could the bag go through? It

Child: **did**

## Generated art and prompts

Built-in image_gen was used for all ten new bitmap assets. The library plate and courier bag are joined by latch-closeup, strap-loop, felt-pad, invitation-hut, invitation-mill, invitation-fern, doorway-tag, and reading-label in bag-at-the-door/assets/. Live letters and Reading.com-style marks and sliders are retained over the wooden label artwork. All ten accepted assets and their exact prompts in s2e1-art-prompts.md are included in the source package. The original generated images are retained at their tool-provided paths.

## Verification and remaining production

Run `node --test bag-at-the-door/tools/*.test.mjs` for curriculum, response classification, gate completion, and casting checks. Browser QA covers all five turns, the first miss and retry, slider isolation, supported pad transfer, the strap touch target, wrong pocket recovery, all three invitation placements, collection and rereading, refresh, child isolation, and tablet/phone layouts. The October 31 original-art refresh also checks the actual latch clearance target, wrong drops, pointer cancellation, drag and keyboard completion, and every new activity on tablet and phone. QA uses mocked playback and no live child events. All 16 episode/audio tests pass. Actual-media browser QA played all 56 clips in order at an accelerated QA rate, checked all five prompt pauses before any consequence, pause/resume without restarting, timed captions, the finish, and zero live preview logs. Every clip was also decoded separately and matched to its source interval within two PCM samples. Word timestamps are model estimates, with physical cuts checked against measured silence. The 8:08 source duration is measured; child-paced total time and engagement require an actual family session.


## Recorded prompt boundaries

| Child turn | Source pause |
| --- | ---: |
| review-map | 83.511542 s |
| model-pad | 219.789501 s |
| find-pad | 245.526440 s |
| free-strap | 314.808571 s |
| pack-invitations | 388.963946 s |
