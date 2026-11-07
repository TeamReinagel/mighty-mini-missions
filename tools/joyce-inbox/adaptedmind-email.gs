/**
 * AdaptedMind daily emails → Joyce.
 *
 * Runs in Stephanie's own Google account (script.google.com), once an hour. It finds AdaptedMind's
 * Daily Progress Update emails that arrived since the last run and sends each one's text to
 * Joyce's inbox on the Mighty Mini Missions site. Joyce turns it into a note for Max's Friday
 * report. Nothing is deleted or changed in Gmail.
 *
 * Setup (once):
 * 1. script.google.com → New project. Name it "AdaptedMind to Joyce". Paste this file in place of
 *    the starter code and save.
 * 2. Project Settings (gear) → Script Properties → Add property:
 *      JOYCE_INBOX_KEY = the same key you put in Netlify.
 * 3. Back in the editor, pick the function `sendNewEmails` and press Run. Google asks you to
 *    allow access to Gmail and to connect to an outside service. That is this script reading
 *    the AdaptedMind emails and sending them to your own site.
 * 4. Triggers (clock icon) → Add Trigger → `sendNewEmails`, time-driven, hour timer, every hour.
 *
 * If AdaptedMind's emails come from a different address or subject, change SEARCH below.
 */

const JOYCE_INBOX_URL = "https://mighty-mini-missions.netlify.app/api/joyce-inbox";
const SEARCH = 'from:adaptedmind.com subject:progress newer_than:3d';

function sendNewEmails() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("JOYCE_INBOX_KEY");
  if (!key) throw new Error("Add JOYCE_INBOX_KEY under Project Settings → Script Properties.");
  // First run: start from the last day, so old emails aren't all sent at once.
  const since = Number(props.getProperty("LAST_SENT_MS") || Date.now() - 24 * 60 * 60 * 1000);
  let newest = since;

  // Oldest first, so a failure part-way leaves the rest for next hour. Joyce ignores repeats.
  const messages = [];
  for (const thread of GmailApp.search(SEARCH, 0, 20)) {
    for (const message of thread.getMessages()) {
      if (message.getDate().getTime() > since) messages.push(message);
    }
  }
  messages.sort((a, b) => a.getDate().getTime() - b.getDate().getTime());

  for (const message of messages) {
    const res = UrlFetchApp.fetch(JOYCE_INBOX_URL, {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + key },
      payload: JSON.stringify({
        source: "adaptedmind-email",
        kid: "max",
        id: message.getId(),
        subject: message.getSubject(),
        sentAt: message.getDate().toISOString(),
        text: message.getPlainBody().slice(0, 30000)
      }),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    if (code === 422) {
      // Joyce couldn't use this one (for example, an empty email). Skip it rather than retry forever.
      console.warn("Joyce skipped " + message.getSubject() + ": " + res.getContentText().slice(0, 300));
      newest = message.getDate().getTime();
      continue;
    }
    if (code >= 300) {
      console.error("Joyce's inbox answered " + code + ": " + res.getContentText().slice(0, 300));
      break;
    }
    newest = message.getDate().getTime();
  }
  props.setProperty("LAST_SENT_MS", String(newest));
}
