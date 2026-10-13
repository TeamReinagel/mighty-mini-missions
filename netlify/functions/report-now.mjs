import { getStore } from "@netlify/blobs";
import { lessonsText, loadMemory } from "../lib/joyce-memory.mjs";
import { runWeeklyReport } from "../lib/report.mjs";
import { enqueue } from "../lib/slack.mjs";

// Manual trigger for the weekly report.
//   /api/report-now?key=REPORT_SECRET          preview only (nothing posted, nothing saved)
//   /api/report-now?key=REPORT_SECRET&send=1   post to Slack now and start a new report week
export default async (req) => {
  const url = new URL(req.url);
  const secret = process.env.REPORT_SECRET;
  if (!secret || url.searchParams.get("key") !== secret) {
    return new Response("Not found", { status: 404 });
  }
  const text = (body, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  try {
    if (url.searchParams.get("send") === "1") {
      await enqueue(url.origin, { kind: "weekly", force: true });
      return text("Started. The report will appear in Slack in a minute or two.\n");
    }
    const store = getStore({ name: "progress", consistency: "strong" });
    const mem = await loadMemory(store);
    // Regular functions have a short time limit, so the preview gives the AI less time than Friday's run.
    const result = await runWeeklyReport({ store, send: false, lessons: lessonsText(mem), aiTimeoutMs: 8000 });
    return text(`Preview only. Add &send=1 to post it.\nEvents this week: ${result.events}. Written by AI: ${result.usedAI ? "yes" : "no (plain version)"}.\n\n${result.text}\n`);
  } catch (err) {
    return text(`Report failed: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
};

export const config = { path: "/api/report-now" };
