# Mighty Mini Missions

**Purpose**: a *screen-to-world launcher* for Max — tap once, pick a mission, then go play.

## Publish to GitHub + Netlify

### 1) Create a GitHub repo and push this folder
From `mighty-mini-missions/`:

```bash
git init
git add .
git commit -m "Initial Mighty Mini Missions app"
git branch -M main
git remote add origin https://github.com/<your-username>/mighty-mini-missions.git
git push -u origin main
```

### 2) Connect in Netlify
1. Go to [Netlify](https://app.netlify.com/) and click **Add new site** -> **Import an existing project**.
2. Choose **GitHub** and select `mighty-mini-missions`.
3. Build settings:
   - **Base directory**: *(leave blank)*
   - **Build command**: *(leave blank)*
   - **Publish directory**: `.`
4. Click **Deploy site**.

### 3) Open from any device
- Netlify gives you a URL like: `https://mighty-mini-missions-xyz.netlify.app`
- Open that URL on phone/tablet/computer.
- Optional: in Netlify, set a custom subdomain (Site settings -> Domain management) so it is easier to remember.

### Important note about image generation
- The app deploys as a static site on Netlify.
- The "Generate Illustration" button uses `/api/image`, which currently exists only in `server/server.js` for local use.
- On Netlify, core mission features work normally; illustration generation will show the fallback message unless you later add a Netlify Function.

## Joyce: weekly report, daily ideas, and learning (Slack)

Joyce is the family's Slack helper. Every Friday afternoon she posts a report with, for each child: what they mastered, what was tricky, and what to introduce next. During the week, tell her what you notice in everyday life and she'll fold it into the report. Ask her for ideas, correct her, and she learns, but only with your OK.

### Telling Joyce what you notice
Post in the report channel (or message Joyce directly) and include the child's name:
- "Max counted coins on his own at the farmers market"
- "Gabi recognized the word STOP on a stop sign"
- "Max and Gabi sorted all the laundry together"

Joyce replies in a thread to confirm. Family chatter in the channel that isn't about a child's learning, and isn't to her, gets no reply. Names come from `netlify/lib/kids.mjs`.

### Asking Joyce
Mention her in the channel (`@Joyce`) or message her directly:
- "What should we do today?" or "Any ideas for Gabi this morning?" gives one short activity per child, based on their next milestones, what's been tricky in the games, and what you've noticed.
- "How is Max doing with his learning?", "What is Gabi struggling with?", "Does he need my help with anything?" or "What games does she like?" answers like a teacher talking with a parent: what they've recently mastered, what they're still working on, where to focus, and (from which games they keep coming back to over the last 4 weeks) what they seem to enjoy. No counts or scores unless you ask for specifics.
- "What did the kids work on today?", "Did Max play this week?" or a follow-up like "Which words did he miss?" looks back at the games in detail: who played, which skills, how many tries, what was right on the first try, and when each child last played. It answers from synced game data only, so play on an offline tablet shows up once it's back online.
- "What have you learned?" lists her lessons and abilities. "Forget the worksheet lesson" or "stop the morning posts" undoes one.

### How Joyce learns (always with your OK)
Joyce never adopts anything new on her own. She posts a suggestion with **Approve** / **Not now** buttons, and nothing changes until you click Approve. If you click Not now, she won't bring it up again unless you ask.
- **Lessons**: when you correct her or tell her a preference ("Gabi hates worksheets", "keep Connor's ideas under 5 minutes", reply "that's not right" to the report), she offers to remember it as a lesson. Approved lessons shape every report and suggestion.
- **New abilities**: when you ask for something new she could do from the data she already has ("send me the activity every morning", "a reading summary on Fridays"), she proposes an ability: written instructions she follows, which can run on request, every weekday morning, or after Friday's report. Abilities can only read the kids' profiles, game progress, your observations, milestones, and the last report. They can't change anything or reach anything else, and need no code.
- **Code changes**: when something needs the app itself to change ("track handwriting practice"), she proposes it. On approval she starts a [Cursor cloud agent](https://cursor.com/agents) that makes the change and opens a pull request on GitHub, then posts the link in the same thread. Nothing reaches the site until you merge it.
- **Weekly look-back**: after the Friday report she reviews the last four weeks of conversations with her (not general family chat) and, if she sees a clear pattern such as repeated requests or things she couldn't do, proposes at most one new ability or change. Most weeks she proposes nothing.

What she has learned lives in Netlify Blobs (`joyce/memory.json` in the `progress` store). The built-in abilities ("How they're doing", "Activity for today", and "What they practiced") are in `netlify/lib/joyce-memory.mjs`.

### How it works
- Every game logs each answer (`progress.js`): which child, which skill, which item, and whether it was right on the first try. Train Set finds, Monster Maker feelings, and completed Missions count as practice only (no right/wrong).
- The child is whoever is picked on the Mighty Mini Missions home screen on that device. Coin Record Run opens on that child too, and credits whichever player is selected in the game.
- Answers queue on the tablet and sync to `/api/progress` (a Netlify Function that saves to Netlify Blobs). Offline play syncs the next time the app is opened online.
- Fridays at 3pm Central, `netlify/functions/joyce-clock.mjs` (runs hourly, in your time zone) starts the report: it combines game data with your observations and Joyce's lessons, asks OpenAI to write it up, and posts it to Slack. If OpenAI fails, a plain version is sent instead.
- Slack messages and button clicks go to `/api/joyce`, which checks Slack's signature and hands the work to a background function (`joyce-work.mjs`), since thinking can take longer than Slack waits. The logic is in `netlify/lib/joyce-brain.mjs`.

What the report counts as:
- **Mastered**: an item (a word, a letter, a math fact) right on the first try the last 3 times, and at least 75% of the time overall.
- **Working on**: a skill under 70% first-try this week (5+ tries), or an item missed more than half the time.
- **Try next**: the next unmet goals from the K-2 monthly milestones spreadsheet, plus the next game step from `netlify/lib/curriculum.mjs`.
- **Milestones met**: Joyce credits a spreadsheet milestone when game data or one of your observations clearly shows it, and stops suggesting it after that.

### Milestones and kids
- `netlify/lib/kids.mjs` says which spreadsheet sheets guide each child (for example, Max uses 2nd-grade Math and 1st-grade ELA). Update it as the kids grow.
- After editing the spreadsheet, regenerate `netlify/lib/milestones.mjs`:

      python3 netlify/tools/import_milestones.py "/path/to/Kindergarten-Second Grade Monthly Milestones.xlsx"

### One-time setup
1. Push to GitHub so Netlify deploys the functions. Note your site address (like `https://mighty-mini-missions-xyz.netlify.app`).
2. **Create Joyce in Slack**: go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest** → pick your family workspace. Paste `netlify/slack/joyce-manifest.json`, replacing `YOUR-SITE` with your site address, and create the app.
3. Click **Install to Workspace**. When asked where to post, choose the report channel.
4. In the report channel, type `/invite @Joyce` so she can read what you post there.
5. **Netlify environment variables** (Site configuration → Environment variables):
   - `SLACK_WEBHOOK_URL`: Slack app → **Incoming Webhooks** → the webhook URL for your channel
   - `SLACK_BOT_TOKEN`: Slack app → **OAuth & Permissions** → Bot User OAuth Token (starts with `xoxb-`)
   - `SLACK_SIGNING_SECRET`: Slack app → **Basic Information** → Signing Secret
   - `OPENAI_API_KEY`: your OpenAI key
   - `REPORT_SECRET`: any long password you make up (protects the preview link)
   - `JOYCE_APPROVERS`: your Slack member ID (Slack → your profile → ⋮ → Copy member ID), so only you can approve what Joyce learns. Separate several with commas.
   - `JOYCE_TABLET_KEY`: a long password you make up. The Android app sends it with each help request. It is separate from `REPORT_SECRET`.
   - `CURSOR_API_KEY`: for code changes only. Create one at [cursor.com/dashboard](https://cursor.com/dashboard) → API Keys, and connect GitHub in Cursor so its agents can open pull requests on this repo.
   - Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `REPORT_TIMEZONE` (default `America/Chicago`), `REPORT_HOUR` (default `15`), `JOYCE_MORNING_HOUR` (default `7`), `JOYCE_REPO_URL` / `JOYCE_REPO_BRANCH` (default this repo's `main`), `CURSOR_MODEL`
6. Redeploy in Netlify (Deploys → Trigger deploy) so the functions pick up the variables.
7. On each tablet, open Mighty Mini Missions once and tap that child's name.
8. Test Joyce: post "Max tested Joyce" in the channel (she should reply in a thread), then message her "what should we do today?".

If you created the Slack app from an older manifest, update it from the manifest again (with the same `YOUR-SITE` replacement), then click **Reinstall to Workspace**. Newer versions add **Interactivity** (for the Approve buttons) and the `users:read` permission (so Joyce knows who's talking).

### Joyce on the Android tablets

A round picture of Joyce floats over other apps (Reading.com, Adapted Mind, and the rest). The child taps her, the screen freezes, and they tap a word or draw around a problem. They can talk at the same time. She talks it through in a natural voice. A letter with more than one sound, or a silent e, becomes the hint. The child answers, and she continues until they reach the word together. Each moment is saved as an observation Friday's report already reads: what they pointed at, the hints, whether she said the answer, and whether they tapped **I got it**. The screenshot itself is not stored.

The app is `joyce-tablet/`. Install `joyce-tablet/app/build/outputs/apk/debug/app-debug.apk` on each Onn tablet (Files or Chrome → allow install from that app). Android 8 or newer.

On the tablet, a grown-up:

1. Opens **Joyce**, taps the child's name, and enters the site address and `JOYCE_TABLET_KEY`. **Test the key** should say the key works. Redeploy the site after adding the key.
2. Taps **Turn Joyce on** and allows Joyce to show over other apps. Allow notifications too, so the tablet can show that the screen is shared.
3. The first time a child taps her picture, Android asks to share the whole screen. Leave that on for the learning block. Turn Joyce off, or tap **Stop sharing**, when the block is done. The prompt comes back after a restart.

Then the child taps her picture, points, and talks. Joyce answers when they pause. They keep talking until they reach the word. **I got it** closes the talk. Connor's iPad can't run this. The same app works on his Android tablet later: pick his name on that device.

**Get the newest Joyce**, on the grown-up screen, reads `joyce-latest.json` on the site. That file names the version and a download link. The link can be a Google Drive share link (set sharing to anyone with the link) or `/downloads/joyce.apk` on this site. If the version is newer, the tablet downloads it and Android asks to install. Allow Joyce to install unknown apps when the tablet asks. Family Link may still ask a parent for that one setting.

### Preview or send a report any time
- Preview (posts nothing): `https://<your-site>.netlify.app/api/report-now?key=<REPORT_SECRET>`
- Send now: add `&send=1`. It appears in Slack within a minute or two, followed by Joyce's weekly look-back. This also starts a new report week, so Friday's report covers only what happens after.

## Design with Sid (Max's game-design coach)

Sid is a voice coach on the phone or tablet, nicknamed for the game designer Sid Meier. Max and Sid start from a blank page and invent the game together. Games and characters Max already plays are fine; Sid still nudges him to add his own twist. There is no starter game to play. When the plan is ready, a grown-up sends it to Cursor, which builds that game and opens a pull request. Nothing joins the games until the pull request is merged.

The first build should make his rules playable. Cute art (round shapes, soft colors, gentle outlines) can come at the end of that build, or as a later pass. Sid does not use the camera. After the built game is on the site, it can leave a short note about how play went, and Sid can talk about that the next time Max calls.

His voice is sent to OpenAI for the conversation. The API key stays on the server. A talk stops itself after 15 minutes. The build asks for the grown-up code again, so talking does not start one.

On Max's game list, the tile is **Design with Sid**. Other profiles do not see it.

### Setup
Add these with the other Netlify environment variables, then redeploy:

- `DESIGN_PARENT_CODE`: a code a grown-up types once on the spare phone. Voice stays unlocked on that phone. Builds ask for it every time.
- `OPENAI_API_KEY` and `CURSOR_API_KEY`: already used by Joyce. The Cursor account that owns the API key must have GitHub connected for `TeamReinagel/mighty-mini-missions`.
- Optional: `JOYCE_REPO_URL` (default `https://github.com/TeamReinagel/mighty-mini-missions`), `OPENAI_REALTIME_MODEL` (default `gpt-realtime-2.1`), `DESIGN_VOICE` (default `ash`, a male voice).

The first time on the phone, a grown-up enters the code. After that Max can tap **Talk with Sid**.

## Run it

### Option A (recommended): run the local app server (also enables image generation)
This serves the app **and** (optionally) exposes `/api/image` for safe AI image generation (API key stays on the server).

From the `mighty-mini-missions/server/` folder:

```bash
npm install

# Create mighty-mini-missions/server/.env with your OpenAI key:
#   OPENAI_API_KEY=...
#   PORT=8787

npm run dev
```

Then open:
- `http://localhost:8787/`

### Option B: run a tiny static server (no image generation)
This makes sure `missions.json` loads correctly on all browsers.

From the `mighty-mini-missions/` folder:

```bash
python3 -m http.server 8787
```

Then open:
- `http://localhost:8787/`

### Option C: open `index.html` directly
You can double-click `index.html`. If your browser blocks loading `missions.json` under `file://`, the app will automatically fall back to the built-in `missions-data.js`.

## How to use
- **Mission now**: picks one mission immediately.
- **Give me 2 choices**: shows two options so Max can choose (bounded choice).
- **Quick picks**: jump straight to a category.
- **Try #2 (easier)**: automatically offers an easier mission in the same category (or an “easier remix” if needed).
- **🔊**: reads the mission aloud (turn on in Settings).
- **☆ / ★**: favorites (stored locally on this device only).
- **Print**: printable “Mission Deck” (no-device backup).

## Edit / add missions
Edit `missions.json` (preferred). Refresh the page.

Each mission looks like:

```json
{
  "id": "unique-id-here",
  "category": "build",
  "difficulty": "easy",
  "minutes": "10–20",
  "title": "Mission title",
  "prompt": "What to do…",
  "materials": ["..."],
  "steps": ["..."],
  "siblingStation": "Optional parallel station for littles."
}
```

### Categories
Use one of:
- `build`
- `phonics`
- `math`
- `nature`
- `social`
- `responsibility`

### Difficulty
Use one of:
- `easy`
- `medium`
- `hard`

### Optional templates (for variety)
You can use:
- `{{SOUND}}`, `{{LETTER}}`, `{{N1}}`, `{{N2}}`

These pull from `templateVariables` at the bottom of `missions.json`.

## Design constraints (on purpose)
- No streaks, no leaderboards, no “you missed a day” vibes.
- The goal metric is **time spent off-screen** and **willing re-tries**.

