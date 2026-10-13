import { getStore } from "@netlify/blobs";
import { loadMemory } from "../lib/joyce-memory.mjs";
import { enqueue } from "../lib/slack.mjs";

// Runs hourly and starts Joyce's timed work in the family's time zone (so daylight saving
// never shifts it): the Friday report, weekday-morning abilities, and checks on code changes.
const REPORT_HOUR = Number(process.env.REPORT_HOUR || 15);
const MORNING_HOUR = Number(process.env.JOYCE_MORNING_HOUR || 7);

export default async (req, context) => {
  const tz = process.env.REPORT_TIMEZONE || "America/Chicago";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23" })
      .formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  const hour = Number(parts.hour);
  const weekday = parts.weekday;
  const origin = context?.site?.url || process.env.URL;
  const store = getStore({ name: "progress", consistency: "strong" });
  const mem = await loadMemory(store);

  const jobs = [];
  if (weekday === "Fri" && hour === REPORT_HOUR) jobs.push({ kind: "weekly" });
  if (!["Sat", "Sun"].includes(weekday) && hour === MORNING_HOUR && mem.skills.some((s) => s.schedule === "weekday-morning")) {
    jobs.push({ kind: "morning" });
  }
  if (mem.codeRequests.some((r) => r.status === "running")) jobs.push({ kind: "code-check" });

  for (const job of jobs) await enqueue(origin, job);
  if (jobs.length) console.log(`Joyce clock (${weekday} ${hour}:00 ${tz}): ${jobs.map((j) => j.kind).join(", ")}`);
};

export const config = { schedule: "@hourly" };
