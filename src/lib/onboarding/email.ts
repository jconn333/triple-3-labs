import { emailConfigured } from "@/lib/esign/email";

export { emailConfigured };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Triple 3 Labs <onboarding@resend.dev>";
  return { apiKey, from };
}

async function sendViaResend(payload: Record<string, unknown>): Promise<void> {
  const { apiKey } = resendConfig();
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend failed ${response.status}: ${body}`);
  }
}

export async function sendOnboardingLinkEmail(params: {
  recipientName: string;
  recipientEmail: string;
  accountName: string;
  formTitle: string;
  onboardingUrl: string;
  expiresAt: string;
}): Promise<void> {
  const { from } = resendConfig();
  const expires = new Date(params.expiresAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  await sendViaResend({
    from,
    to: [params.recipientEmail],
    subject: `Getting started: ${params.formTitle}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Let's get you set up</h2>
        <p style="color:#555; margin-top:0;">Triple 3 Labs</p>
        <p>Hi ${esc(params.recipientName)},</p>
        <p>A quick form to get ${esc(params.accountName)} set up on <strong>${esc(
          params.formTitle
        )}</strong>. It should only take a few minutes.</p>
        <p style="margin: 28px 0;">
          <a href="${params.onboardingUrl}"
             style="background:#6b46c1; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Get started
          </a>
        </p>
        <p style="color:#666; font-size:13px;">This link is unique to you and expires on ${expires}. Please don't forward it.</p>
        <p style="color:#999; font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
        <p style="margin-top:32px;">Thanks,<br />Jeff Conn<br />Triple 3 Labs</p>
      </div>
    `,
  });
}

export async function sendOnboardingSubmittedEmail(params: {
  accountName: string;
  recipientName: string;
  formTitle: string;
  adminUrl: string;
}): Promise<void> {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) return;
  const { from } = resendConfig();
  await sendViaResend({
    from,
    to: [to],
    subject: `Onboarding submitted: ${params.accountName} — ${params.formTitle}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Onboarding form submitted</h2>
        <p><strong>${esc(params.accountName)}</strong> (${esc(
          params.recipientName
        )}) just submitted <strong>${esc(params.formTitle)}</strong>.</p>
        <p style="margin: 28px 0;">
          <a href="${params.adminUrl}"
             style="background:#6b46c1; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            View responses
          </a>
        </p>
      </div>
    `,
  });
}
