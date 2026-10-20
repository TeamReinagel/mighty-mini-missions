# Joyce overnight review — October 19–20, 2026

**Complete:** Joyce **2.3 (version code 14)** passed the available local checks, was committed and pushed to `main`, and its published download was verified. The user authorized iterative review, fixes, testing, and committing/pushing the finished Joyce work. Starting commit: `461df60`.

## Morning outline

- **Easier for young children:** a visible Ask Joyce button works without speech; replay repeats the help; the check button returns immediately to the learning app. Marking a different word or problem starts a fresh question.
- **More reliable pointing:** a complete circle selects the entire traced area instead of collapsing to its endpoint. Small finger wobbles still count as taps; interrupted gestures preserve the previous selection.
- **Better reading and math handling:** numerical zero is preserved, spoken numbers are recognized, short marked answers stay fixed, and a child saying “not eight” or asking “eight?” is not automatically congratulated. Math follow-ups use math steps. Added guards against giving the answer in the first hint and against imposing incorrect phonics rules on irregular words.
- **Less fragile listening and speech:** more time for pauses, a bounded recording window, local speech when cloud speech fails, and spoken opening directions after the local voice is ready. Closing Joyce releases recording, speech, and audio focus.
- **More room for the lesson:** portrait and landscape layouts keep the screenshot visible and the large action buttons available while the conversation scrolls.
- **Repeatable development in Codex:** shared `AGENTS.md` guidance, a durable JDK setup, a build helper, and documented backend/Android test commands. Cursor rules and the separate Cursor cloud integrations remain available.

## Successive test and repair passes

1. **Tutoring and recovery scenarios.** The first 23 added backend cases exposed 21 failures. Fixed answer leakage, spoken-number matching, uncertain answers, irregular silent-e handling, target stability, and retryable failures. The original and first added tests then passed together.
2. **Touch, screenshots, and child controls.** Added simulated gestures, cropping, panel layouts, new-question behavior, immediate closing, and silence recovery. Fixed the full-circle selection bug and full-screen crop ownership, which could otherwise recycle the source screenshot.
3. **More reading and math edge cases.** Expanded phonics exceptions and tested numeric and spoken answers through hundreds, including zero. Checked that subsequent model responses cannot replace the stored marked answer and that a reveal cannot substitute 18 for 8.
4. **Lifecycle and platform compatibility.** Checked Android 8, 9, 13, and 15 with Robolectric. Reused the screen-sharing virtual display, discarded late screenshots after shutdown, and kept the bubble within screen bounds. Inspected rendered portrait and landscape layouts using synthetic reading and subtraction screens.
5. **Final speech checks.** New tests reproduced skipped opening directions and failure to use local speech when final-answer audio was malformed: eight failures across four Android versions. Fixed both; also checked that late voice initialization does not interrupt a child who has already marked a question.

## Final verification

| Check | Actual result |
| --- | --- |
| `npm run test:joyce` | **89 passed**, zero failed/skipped; mocked tutoring, transcription, speech, storage, authentication, and request validation |
| `npm run build:joyce -- testDebugUnitTest lintDebug assembleDebug` | **Build successful** |
| Android tests | **73 passed**, zero failed/skipped: 18 scenarios on each of SDK 26, 28, 33, and 35, plus one native-rendering test |
| Android lint | **0 errors, 58 warnings**; error failures are now enforced |
| Layout checks | 800×1280, 1280×800, 640×360, and 360×640 dp; action targets at least 48 dp; portrait/landscape images visually inspected |
| APK identity | `family.reinagel.joyce`, version **2.3 / 14**, minimum SDK 26, target SDK 35 |
| APK signature | Verified; certificate matches the previously distributed 2.2 APK |
| `git diff --check` | Passed |
| Unrelated Mario camera edit | Compared with the saved pre-review diff; unchanged and excluded from the Joyce release |

Lint warnings include English strings outside resources, available dependency upgrades, launcher-icon suggestions, older compatibility checks, and static service references that are cleared on destruction. No broad dependency upgrade or unrelated rewrite was made.

The final APK SHA-256 is:

```text
efad4b1b7cd3426166396a3980699030352b756cbf0f27cf6fcfdc226cec5332
```

Test sources are in `netlify/lib/joyce-tablet*.test.mjs` and `app/src/test/java/family/reinagel/joyce/OverlayInteractionTest.kt`. Gradle generates the test/lint reports and synthetic layout PNGs under `app/build/reports/`; those generated files are not committed. The endpoint test lives outside the functions directory so Netlify cannot treat it as a production function; see [Netlify's directory configuration](https://docs.netlify.com/build/functions/configuration/#directory).

## Reliability details

- Vision, transcription, and storage failures return useful retry messages without inventing a completed teaching turn. A missing session can start over. A fresh question cannot overwrite an existing session by supplying its ID.
- Cloud request timeouts now allow up to 5 seconds for transcription, 10 seconds for vision, and two 4-second speech attempts, leaving nominal room within the configured 26-second function limit. This is a bounded request budget, not a measured live latency guarantee.
- The server supplies pronounceable text for the local voice fallback. Temporary audio files are removed as playback/recording is replaced or dismissed.
- Screen-sharing capture reuses its virtual display and detaches the image-reader surface between requests. This follows Android's [media-projection requirements](https://developer.android.com/media/grow/media-projection).
- The overlay declares and requests the microphone foreground-service type when microphone permission is available, following Android's [foreground-service guidance](https://developer.android.com/develop/background-work/services/fgs/service-types#microphone). Tap-to-ask remains available if recording cannot start.
- Existing family observations, configuration, credentials, and the Android signing key were preserved. Tests used isolated fake data and did not submit family observations to production.

## Coverage limits and first tablet check

**No physical Android tablet was connected, and no local OpenAI API credential was available.** These results do not establish live Reading.com/AdaptedMind compatibility, actual child speech recognition, pronunciation quality, or vision accuracy. Synthetic screens represent reading and math workflows; they are not captures from those services.

Robolectric simulates Android behavior. The media-projection test includes a custom shadow enforcing the documented one-display-creation rule; it does not exercise actual system screen-sharing consent. Real microphone permissions, audio focus in the learning apps, screen rotation, and update installation still need a tablet check.

Open Joyce's parent setup and use **Get the newest Joyce**. Then try:

1. Open Reading.com, tap Joyce, tap one word, and try both speech and Ask Joyce.
2. Replay a hint, mark a second word, and use the check button to return.
3. Open a math lesson, circle the entire problem, and answer with a spoken number.
4. Rotate the tablet, briefly disconnect Wi-Fi and retry, and confirm Joyce stops listening when closed.

## Commit and deployment

- Release commit: [`1c720f2`](https://github.com/TeamReinagel/mighty-mini-missions/commit/1c720f2), **Improve Joyce overlay usability and tutoring reliability**.
- Packaging correction: [`1c71b6c`](https://github.com/TeamReinagel/mighty-mini-missions/commit/1c71b6c), **Keep Joyce endpoint tests outside deployable functions**. The backend suite was rerun after moving the test: all 89 passed.
- Both pushes to `origin/main` succeeded. This completed report is saved in a subsequent documentation commit.
- The public [update metadata](https://mighty-mini-missions.netlify.app/joyce-latest.json) changed from 2.2 / 13 to **2.3 / 14**.
- Downloaded the [public APK](https://mighty-mini-missions.netlify.app/downloads/joyce.apk); its SHA-256 matches the value above, and a byte-for-byte comparison with the local tested APK passed.
- The public `package.json` matches the local version, confirming publication of the packaging correction as well as the APK.
- An unauthenticated request to `/api/joyce-tablet` returned **401** with the expected key message. This verifies endpoint reachability and authentication rejection, not authenticated tutoring or live inference.
- GitHub's public status/check APIs returned no build records. Deployment confirmation here comes from the public metadata, package file, APK comparison, and API response, not Netlify dashboard access.
- The one-night `joyce-overnight-review` heartbeat was **paused** after completion.
