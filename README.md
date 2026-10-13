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
- "What have you learned?" lists her lessons and abilities. "Forget the worksheet lesson" or "stop the morning posts" undoes one.

### How Joyce learns (always with your OK)
Joyce never adopts anything new on her own. She posts a suggestion with **Approve** / **Not now** buttons, and nothing changes until you click Approve. If you click Not now, she won't bring it up again unless you ask.
- **Lessons**: when you correct her or tell her a preference ("Gabi hates worksheets", "keep Connor's ideas under 5 minutes", reply "that's not right" to the report), she offers to remember it as a lesson. Approved lessons shape every report and suggestion.
- **New abilities**: when you ask for something new she could do from the data she already has ("send me the activity every morning", "a reading summary on Fridays"), she proposes an ability: written instructions she follows, which can run on request, every weekday morning, or after Friday's report. Abilities can only read the kids' profiles, game progress, your observations, milestones, and the last report. They can't change anything or reach anything else, and need no code.
- **Code changes**: when something needs the app itself to change ("track handwriting practice"), she proposes it. On approval she starts a [Cursor cloud agent](https://cursor.com/agents) that makes the change and opens a pull request on GitHub, then posts the link in the same thread. Nothing reaches the site until you merge it.
- **Weekly look-back**: after the Friday report she reviews the last four weeks of conversations with her (not general family chat) and, if she sees a clear pattern such as repeated requests or things she couldn't do, proposes at most one new ability or change. Most weeks she proposes nothing.

What she has learned lives in Netlify Blobs (`joyce/memory.json` in the `progress` store). The built-in "Activity for today" ability is in `netlify/lib/joyce-memory.mjs`.

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
   - `CURSOR_API_KEY`: for code changes only. Create one at [cursor.com/dashboard](https://cursor.com/dashboard) → API Keys, and connect GitHub in Cursor so its agents can open pull requests on this repo.
   - Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `REPORT_TIMEZONE` (default `America/Chicago`), `REPORT_HOUR` (default `15`), `JOYCE_MORNING_HOUR` (default `7`), `JOYCE_REPO_URL` / `JOYCE_REPO_BRANCH` (default this repo's `main`), `CURSOR_MODEL`
6. Redeploy in Netlify (Deploys → Trigger deploy) so the functions pick up the variables.
7. On each tablet, open Mighty Mini Missions once and tap that child's name.
8. Test Joyce: post "Max tested Joyce" in the channel (she should reply in a thread), then message her "what should we do today?".

If you created the Slack app before Joyce could learn, update it from the manifest again (it adds **Interactivity**, which the Approve buttons need), with the same `YOUR-SITE` replacement.

### Preview or send a report any time
- Preview (posts nothing): `https://<your-site>.netlify.app/api/report-now?key=<REPORT_SECRET>`
- Send now: add `&send=1`. It appears in Slack within a minute or two, followed by Joyce's weekly look-back. This also starts a new report week, so Friday's report covers only what happens after.

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

