/** Shared Slack webhook sender. Guards on SLACK_WEBHOOK_URL — no-ops silently if unset. */
export async function sendSlackMessage(payload: {
  text?: string;
  blocks?: Record<string, unknown>[];
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed with status ${response.status}`);
  }
}
