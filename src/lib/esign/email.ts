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

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendSigningLinkEmail(params: {
  signerName: string;
  signerEmail: string;
  contractTitle: string;
  signingUrl: string;
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
    to: [params.signerEmail],
    subject: `Signature requested: ${params.contractTitle}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Signature requested</h2>
        <p style="color:#555; margin-top:0;">Triple 3 Labs</p>
        <p>Hi ${esc(params.signerName)},</p>
        <p>You've been asked to review and sign <strong>${esc(params.contractTitle)}</strong>.</p>
        <p style="margin: 28px 0;">
          <a href="${params.signingUrl}"
             style="background:#6b46c1; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Review &amp; Sign
          </a>
        </p>
        <p style="color:#666; font-size:13px;">This link is unique to you and expires on ${expires}. Please don't forward it.</p>
        <p style="color:#999; font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSignedCopiesEmail(params: {
  signerName: string;
  signerEmail: string;
  contractTitle: string;
  signedAtIso: string;
  signedFileHash: string;
  pdfBase64: string;
  fileName: string;
}): Promise<void> {
  const { from } = resendConfig();
  const internalCopy = process.env.NOTIFICATION_EMAIL;
  const to = [params.signerEmail, ...(internalCopy ? [internalCopy] : [])];
  await sendViaResend({
    from,
    to,
    subject: `Signed: ${params.contractTitle}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Document signed ✓</h2>
        <p style="color:#555; margin-top:0;">Triple 3 Labs</p>
        <p><strong>${esc(params.contractTitle)}</strong> was signed by ${esc(params.signerName)} on ${esc(
          params.signedAtIso
        )} (UTC).</p>
        <p>A copy of the fully signed document is attached for your records, including the signature certificate.</p>
        <p style="color:#888; font-size:11px; word-break:break-all;">Document SHA-256: ${esc(
          params.signedFileHash
        )}</p>
      </div>
    `,
    attachments: [{ filename: params.fileName, content: params.pdfBase64 }],
  });
}
