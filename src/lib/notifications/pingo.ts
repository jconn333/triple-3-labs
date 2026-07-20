/**
 * Sends a DM from the Zeke bot in Pingo (Five Star Group's team chat app).
 * Guards on PINGO_BOT_API_KEY — no-ops silently if unset, same pattern as
 * the Slack webhook helper.
 */

const PINGO_API_BASE =
  "https://yulnbonryfxmxelxufui.supabase.co/functions/v1/api/v1";

// The existing 1:1 DM channel between Jeff and the Zeke bot in Pingo.
// Override via env if the bot or DM channel ever changes.
const DEFAULT_DM_CHANNEL_ID = "6499b0ad-f35d-407f-89d0-e2422550a639";

export async function sendPingoDM(
  body: string,
  idempotencyKey?: string
): Promise<void> {
  const apiKey = process.env.PINGO_BOT_API_KEY;
  if (!apiKey) return;

  const channelId = process.env.PINGO_DM_CHANNEL_ID || DEFAULT_DM_CHANNEL_ID;

  const response = await fetch(`${PINGO_API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      channel_id: channelId,
      body,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Pingo DM failed with status ${response.status}: ${text}`);
  }
}
