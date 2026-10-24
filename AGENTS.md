# Mighty Mini Missions and Joyce

This Git repository contains a static family learning site, Netlify Functions, and Joyce's Kotlin Android overlay. Read `README.md` for the deployed features and `joyce-tablet/README.md` for Android development.

## Working conventions

- In the full homeschool workspace, also read `../AGENTS.md` for expert voices and memory, and `../../AGENTS.md` for workspace conventions. These parent files may be absent in a standalone clone.
- For software work, default to the Evan systems-engineering perspective and open with `**Speaking as Evan:**`, unless the user requests a different expert.
- When the user says **do it** to ship the current work, commit and push the relevant session changes. Preserve unrelated edits; ask only if commit scope is unclear. Do not change Git configuration, skip hooks, force push, or make empty commits. Use a quoted heredoc for multiline commit messages. Push the current branch, using `git push -u origin HEAD` if there is no upstream, and report the result.
- Ordinary implementation requests do not automatically request publishing. A push can trigger the site's Netlify deployment.

## Joyce entry points

- `joyce-tablet/app/src/main/java/family/reinagel/joyce/`: overlay, screen capture, speech UI, HTTP client, and updater.
- `netlify/functions/joyce-tablet.mjs`: authenticated `/api/joyce-tablet` endpoint.
- `netlify/lib/joyce-tablet.mjs`: tutoring behavior, transcription, speech, and observation storage.
- `netlify/lib/joyce-tablet.test.mjs`: mocked backend regression tests.
- `joyce-latest.json` and `downloads/joyce.apk`: tablet update metadata and published APK.
- `netlify/lib/joyce-brain.mjs` and `netlify/lib/design-studio.mjs`: separate Cursor cloud-agent integrations for approved code changes and Sid builds. Developing here does not require replacing these integrations.

## Build and verify

From this repository:

```sh
npm run test:joyce
npm run test:joyce:android
npm run build:joyce
```

- Use Node 20 or newer. Joyce's backend unit tests mock API calls and require no live keys.
- The Android build uses JDK 17, Android SDK 35, and the checked-in Gradle wrapper. `joyce-tablet/build.sh` locates a registered macOS JDK when `JAVA_HOME` is unset.
- Run backend tests for tutoring/backend changes and run Android tests/lint plus the APK build for Kotlin, Android resources, or build changes. A successful build does not verify tablet permissions, microphone behavior, or the live server.
- Do not commit local SDK paths, credentials, signing keys, Gradle caches, or generated build directories. Preserve the existing debug signing key so updates can install over the family's current app.
- Only refresh the downloadable APK and version metadata when preparing an Android release. See the Android README for the release steps.

## Learning games

New Mighty Mini Missions learning games practice one essential skill as well as the academic skill. The source is Universal Framework 2.0, stored at `netlify/skills/UF2.0-Toolkit-Educators.pdf` (Skills Builder Partnership, CC BY-NC-ND). It is not served on the site.

- The academic skill is what the game requires. It stays a game.
- Also practice one Getting started step, steps 1–4, the ages 5–9 band. A step 5 or 6 is allowed only when the play already asks for it. Steps 7–16 are in the toolkit and are not the target for these children.
- The child never sees the essential-skill name, step, or score. Nothing is locked behind it.
- A miss sets the player back a little and lets them continue. A hint is available without ending the round.
- At the top of the game script, one comment names the step id from `netlify/lib/skills.mjs` and the moment that practices it.
- Games already on the site stay as they are until that game is the one being changed. Sid's build prompt in `netlify/lib/design-studio.mjs` carries the same rule.

## Product behavior to preserve

- Joyce helps with the child's marked word or problem, gives one teaching step at a time, and waits for a response.
- Screenshots are used for the request and are not stored with observations. Keep API secrets on the server and use the separate tablet key for authentication.
- Joyce's learned lessons, abilities, and proposed code changes retain the existing parent approval flow.
