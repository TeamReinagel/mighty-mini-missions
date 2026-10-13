import { getStore } from "@netlify/blobs";
import { checkCodeRequests, handleAction, handleMessage, runMorning, runWeekly } from "../lib/joyce-brain.mjs";
import { verifyJob } from "../lib/slack.mjs";

// Joyce's background worker (up to 15 minutes per job). Jobs come only from joyce.mjs,
// joyce-clock.mjs, and report-now.mjs, signed with the Slack signing secret.
export default async (req) => {
  const raw = await req.text();
  if (!verifyJob(req, raw)) {
    console.error("Rejected an unsigned job");
    return;
  }
  const job = JSON.parse(raw);
  const store = getStore({ name: "progress", consistency: "strong" });
  // Errors are logged, not thrown: Netlify retries failed background jobs, which would double-post.
  try {
    if (job.kind === "message") await handleMessage({ store, ...job });
    else if (job.kind === "action") await handleAction({ store, payload: job.payload });
    else if (job.kind === "weekly") await runWeekly({ store, force: job.force });
    else if (job.kind === "morning") await runMorning({ store });
    else if (job.kind === "code-check") await checkCodeRequests({ store });
  } catch (err) {
    console.error(`Joyce job "${job.kind}" failed:`, err);
  }
};

export const config = { path: "/api/joyce-work", background: true };
