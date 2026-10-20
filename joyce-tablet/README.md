# Developing the Joyce overlay

Joyce is a native Kotlin Android app. Its floating picture opens screen capture and a tutoring conversation over other apps. It calls the Netlify backend in this repository at `/api/joyce-tablet`. Cursor and Codex can edit and build the same source files.

## Build and test

Run these from the `mighty-mini-missions` repository:

```sh
npm run test:joyce
npm run test:joyce:android
npm run build:joyce
```

The backend tests cover tutoring, retry behavior, authentication, and request validation with mocked API responses. The Android tests use Robolectric to simulate touch gestures, layout, screenshot ownership, and lifecycle behavior, and run Android lint. No API keys, tablet, or running server are needed. Android test dependencies download on the first run. Generated layout previews are under `app/build/reports/joyce-layouts/`. The build produces:

```text
joyce-tablet/app/build/outputs/apk/debug/app-debug.apk
```

The helper also accepts Gradle options and tasks, for example:

```sh
npm run build:joyce -- --offline assembleDebug
```

Offline builds require all dependencies to have been downloaded previously. The first build normally needs network access. A build does not install the APK, update `downloads/joyce.apk`, or deploy the site.

## Local prerequisites

- Node.js 20 or newer for the backend tests.
- JDK 17 for the Android build.
- Android SDK platform 35, Android Build Tools, and Platform Tools. The checked-in Gradle wrapper downloads the required Gradle version; a separate Gradle installation is unnecessary.

On this Mac, the existing Temurin JDK is installed in the durable user location:

```text
~/Library/Java/JavaVirtualMachines/joyce-jdk-17.jdk/Contents/Home
```

`build.sh` automatically finds Java 17 using `/usr/libexec/java_home` when `JAVA_HOME` is unset. To run the Gradle wrapper directly:

```sh
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
cd joyce-tablet
./gradlew assembleDebug
```

On another machine, install a JDK 17 appropriate to that machine and set `JAVA_HOME` if needed. Do not rely on a JDK under `/tmp` or copy this Mac's JDK to a different operating system or CPU architecture.

The existing SDK is at `~/Library/Android/sdk`. The ignored `local.properties` already points there. For another machine, set `ANDROID_HOME` to its SDK directory, or create `joyce-tablet/local.properties` with:

```properties
sdk.dir=/absolute/path/to/Android/sdk
```

When neither is configured, the build helper checks the usual macOS and Linux SDK locations. Keep machine-specific paths out of tracked Gradle files.

## Where to make changes

- `app/src/main/java/family/reinagel/joyce/BubbleService.kt`: floating Joyce control.
- `HelpPanel.kt` in that same package: conversation UI and listening behavior.
- `CaptureService.kt`, `JoyceAccessibilityService.kt`, and `MarkView.kt`: screen capture and marking.
- `JoyceClient.kt`: requests to the backend.
- `Updater.kt`: checks and downloads app updates.
- `../netlify/lib/joyce-tablet.mjs`: teaching prompts, word handling, speech, and saved help notes.
- `../netlify/lib/joyce-tablet.test.mjs`: backend regression coverage.

The backend uses `OPENAI_API_KEY` and `JOYCE_TABLET_KEY` from Netlify. Configure the installed tablet with the deployed site URL and tablet key as described in the main README. Local static servers do not run this Netlify endpoint.

## Verify on a tablet

After a relevant app or backend change:

1. Install the debug APK on an Android tablet and confirm the existing child/site settings remain available.
2. Use **Test the key**, enable the overlay, and enable the accessibility screen-picture setting (or use the screen-sharing consent fallback).
3. Open a learning app, tap Joyce, and mark one word or problem.
4. Check that Joyce listens, stays with the marked content, gives a hint, and handles a spoken follow-up. Try the **Ask Joyce** button without speaking, the play button to hear the hint again, and the check button to return immediately.
5. Mark a different word on the same screen and confirm a new question starts. Rotate the tablet and drag Joyce to each screen edge.
6. Temporarily turn off Wi-Fi, ask for help, then reconnect and retry. Confirm no microphone or audio remains active after closing Joyce.

The build and simulated tests do not verify physical tablet permissions, microphone quality, real Reading.com/AdaptedMind screens, or live server credentials.

## Prepare an app update

For an intentional Android release:

1. Increase `versionCode` and update `versionName` in `app/build.gradle.kts`.
2. Run the backend tests, build the APK, and perform the tablet checks above.
3. Copy `app/build/outputs/apk/debug/app-debug.apk` to `../downloads/joyce.apk`.
4. Update `../joyce-latest.json` to the same version code and name, keeping its download URL valid.
5. Commit and push when shipping is requested; the repository's Netlify deployment publishes the download and metadata. Verify the deployment before using **Get the newest Joyce** on a tablet.

Keep the original debug signing key (`~/.android/debug.keystore` on this Mac). Android requires an update to be signed with the same key as the installed app. Do not regenerate or commit this key; a fresh machine needs the original key to produce compatible updates.

## Development handoff

`AGENTS.md` in the repository describes the workflow for Codex. Existing Cursor rules remain in the surrounding homeschool workspace. Saved profiles, memory, source files, and Git history can be used by either editor; plans that existed only in a Cursor conversation need to be recorded separately.

Joyce's Slack code-change proposals and Sid's game builds still call the Cursor cloud API. They are separate from the Android tutoring endpoint. Moving local development to Codex does not replace or disable them.
