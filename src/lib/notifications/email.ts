const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Triple 3 Labs <onboarding@resend.dev>";
  return { apiKey, from };
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Acknowledgment email sent to a ticket submitter with their ticket number. */
export async function sendTicketAcknowledgmentEmail(params: {
  toEmail: string;
  toName: string;
  ticketNumber: number;
  subject: string;
}): Promise<void> {
  const { apiKey, from } = resendConfig();
  if (!apiKey) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [params.toEmail],
      subject: `We received your request — Ticket #${params.ticketNumber}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">Got it — we're on it</h2>
          <p style="color:#555; margin-top:0;">Triple 3 Labs Support</p>
          <p>Hi ${esc(params.toName)},</p>
          <p>Thanks for reaching out. Your support request has been logged as <strong>Ticket #${params.ticketNumber}</strong>:</p>
          <div style="background:#f6f6f6; padding:12px; border-radius:6px; margin: 16px 0;">
            <strong>${esc(params.subject)}</strong>
          </div>
          <p>Our AI triage system is reviewing it now, and a team member will follow up if needed. Please keep this ticket number handy for reference.</p>
          <p style="color:#888; font-size:12px; margin-top:24px;">If you weren't expecting this, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend failed ${response.status}: ${body}`);
  }
}
