import { slackApi } from "./slack.mjs";

/** Post to the cheer channel only. Never falls back to the family report channel. */
export async function postCheer({ env = process.env, fetchImpl = fetch, text }) {
  const channel = env.JOYCE_CHEER_CHANNEL;
  if (!channel) return { posted: false, reason: "no-channel" };
  if (!env.SLACK_BOT_TOKEN) return { posted: false, reason: "no-token" };
  const sent = await slackApi("chat.postMessage", {
    channel,
    text: String(text || "").slice(0, 500),
    unfurl_links: false
  }, { env, fetchImpl });
  return { posted: Boolean(sent.ok), reason: sent.ok ? "" : sent.error || "slack" };
}
