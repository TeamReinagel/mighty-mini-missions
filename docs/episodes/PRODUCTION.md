# Mighty Mini Missions narrated episode recipe

Approved reference: **The Moon Path**, October 30, 2026. The canonical integrated player is `moon-path/`. Start with its working engine and retained assets rather than rebuilding a new player. The original independent preview's last animation release was `2e8d5ab61c6f1ca1a1712b58fc05d1d06470f792`; MMM is now the integration source.

## The repeatable experience

A narrated short story with conversations, painted settings, quiet character layers, and meaningful child turns. Write prose the listener can follow without watching animation. Between quotations, explain where the characters are, what they notice, what they do, and why the next choice matters. Keep Lark and Nib's established personalities. Joyce gives optional support.

One academic focus recurs in different story situations, alongside one appropriate Getting started essential-skill step. The Moon Path practices **m /m/** and `listening-1`: listen to a clue and use it to guide the crew. A story goal supplies the reason to use the skill; a worksheet question is never pasted over an unrelated scene. The child touches the actual object. Wrong choices get useful feedback, and the next attempt stays available.

The reference episode has nine scenes and thirteen turns, not a mandatory count for every episode:

| Story movement | Child's job |
| --- | --- |
| Camp: a delivery, an explorer case, a missing map | Open the latch; follow lagoon → woods → river |
| Lagoon: a little letter unlocks the way | Optional /m/ practice; choose m rather than s |
| Woods: a shortcut complicates the delivery | Pick moss and mushroom from spoken initial-sound clues |
| River: a book and a broken mark | Optional shared reading; choose the repair before the bell; trace m or fit a guided piece |
| Rescue: use the clue again | Choose the /m/ bell to bring Nib home |
| Treasure and return | Reveal the next trail with the moonstone; store it; optional rereading; unlock the short chapter |

Reuse the narrative rhythm: **small problem → character conversation → concrete clue → player turn → narrated consequence → new story information**. Let the sound/letter change what happens. Retain humor and descriptive connective prose. End with a resolved adventure, a collected object, an unlocked chapter, and a small invitation to the next story.

## Narration first

1. Draft the complete prose manuscript with dialogue attributions. Produce a clean recording document and a separate direction/casting sheet. Square-bracket performance notes and actor labels are production directions; check the recording to ensure they were not spoken aloud.
2. Reuse the saved narrator/Lark/Nib casting in ElevenLabs. Listen to a short sample before the full recording, especially the isolated phoneme and letter names. The final supplied recording is the story's authority: changing game text will not change recorded speech.
3. Keep the original recording outside the web publish tree. Record its SHA-256 and decoded duration. Align the approved manuscript to the recording, then inspect every interaction cut by ear and against quiet intervals.
4. Cut **after the spoken prompt and before the narrated outcome**. Playback waits there until the interaction is settled. Optional speaking/shared reading has a visible continue path. Touch remains available if microphone access fails.
5. Preserve the supplied story audio in order, with contiguous source ranges and no missing or repeated passages. Split large sections at natural boundaries; the reference uses 22 MP3 files for a 21:27 recording. Use the host's current file limits when packaging.
6. Derive captions, speaker tags, and stage/action cues from the audio clock. Do not add old screenplay action delays to the new narration.

Retained inputs: `moon-path-manuscript.txt`, `moon-path-recording-notes.md`, `moon-path/tools/narration-alignment.json`, and `moon-path/tools/narration-edit-plan.json`. The alignment includes manuscript text and word timestamps. The plan includes source boundaries, interaction mapping, and visual cues.

The existing rebuild tool validates its inputs without rewriting assets:

```sh
python3 moon-path/tools/rebuild-narration.py --check
```

To recreate this episode's audio from its original MP3, supply `--audio` and an FFmpeg executable with `--ffmpeg`. The tool defaults to writing into `moon-path/`. **A new recording needs a new alignment and edit plan. Do not reuse Moon Path timestamps, source hash, caption boundaries, or mouth coordinates for new character art.** Speaker attribution in this tool currently recognizes Lark and Nib; extend it deliberately for new actors.

## Reuse the visual engine

- Keep the backgrounds static. Reuse camp, lagoon, woods, and river plates whenever the story allows; add a new location only when needed. Match the existing textured, warmly lit CG style. Retain identities and casting.
- Generated props are separate transparent objects. Put the next action on the object itself. Both selectable answers receive the same soft gold halo before hover; hover and keyboard focus strengthen it. Decoration does not glow like an answer.
- Render at up to 16 frames per second. **Talking changes only the mouth**, over a fixed neutral pose. The head, hands, silhouette, scale and position do not shift. Do not switch whole generated poses for speech or idle blinking.
- **Walking changes the body beneath a fixed head**, using a softly blended neck boundary. Mouths remain still during walking. Walking runs only during an actual travel cue and stops at its end. Reduced motion keeps state changes while skipping travel/cycles.
- `character-motion.mjs` stores the existing 512-pixel mouth rectangles and body boundaries. They are fitted to these particular atlases. Reuse them with the same assets; inspect and retune masks if art changes.

The source prompts and rendering details are in `moon-path-art-direction.md`.

## Engine and content seams

| File | Reuse / replace |
| --- | --- |
| `moon-path/stage.mjs`, `character-motion.mjs` | Reuse compositing and motion behavior; extend stage layouts only as needed |
| `moon-path/voice-player.mjs` | Reuse real-media pause, resume, cue timing, seeking, cancellation, retry |
| `moon-path/episode.mjs` | Interaction definitions, contextual help and unlocked chapter; legacy main dialogue is not the narrated playback |
| `moon-path/narration-data.mjs` | Replace recording metadata, cuts, captions and visual cues for each recording |
| `moon-path/narrated-episode.mjs` | Map that recording onto the interaction definitions |
| `moon-path/logic.mjs` | Reuse progress and first-response rules; namespace each episode's storage |
| `moon-path/integration.mjs` | Reuse child isolation and reporting; give the next episode its own game/completion IDs |
| `moon-path/assets/audio/manifest.json` | Saved support recordings; regenerate only support lines whose text changes |

The main story uses the supplied ElevenLabs audio. Existing OpenAI support recordings remain for hints, retries, sound models and short library summaries. Runtime playback needs no API key. Never put a key in browser code.

## MMM and Today with Joyce

Serve the episode from MMM's own origin so it can use `progress.js`. Use relative asset paths so the player works inside its subdirectory. Pass `?kid=connor` from the reading card; namespace bookmarks and saved collections by child. An explicit child link takes precedence over the home screen's active profile.

Call the episode reporter's `practice()` for a newly recorded first response only. Keep supported responses separate, with `correct: null`; record help as participation. Do not report a hinted retry as a new independent first try. Do not award letter mastery for finishing the story or for guided tracing.

Completion is a separate participation event, emitted once after the narration ends and all interactive turns are settled. Joyce checks for that exact marker after the daily card was opened. Ordinary answers, old completion events, another child's play, review mode, and parent skipping do not satisfy it. Preserve the other daily stops. Provide a direct return to Joyce from the player.

## Release checks and known pitfalls

Run `npm run test:joyce`. It includes audio range coverage, interaction cuts, caption bounds, actual media pause/resume/retry, first responses, child isolation, reporting, completion eligibility, masks and existing Joyce regressions. Run the rebuild tool's `--check` when timing inputs change.

In a local preview with **HTTP byte-range support (206 responses)**, review a talking close/open/round sequence, a walking sequence, touch choices at rest and on focus, a cut into/out of an interaction, pause/refresh/resume mid-recording, and the ending/return link. Use `?review=1&kid=connor` for UI QA so it sends no learning evidence. Test reporting with mocked stores, not invented live child results.

Verify the complete final audio still plays, the chapter unlocks, all answers stay usable, and scene jumps cannot earn credit. Bump browser module/style query versions when changing cached files. Check the commit includes matching assets and content. Preserve unrelated work; commit/push and deployment follow the user's shipping authorization and repository conventions.

The earlier failures to avoid are whole-pose speech jitter, reusing old story audio after a manuscript change, MP3 seeking without range support, action animations running on wall time while audio buffers, and marking reading complete after a few clicks.
