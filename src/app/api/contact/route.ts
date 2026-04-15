import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreLeadWithAI } from "@/lib/ai/lead-scoring";
import type { ContactFormData } from "@/lib/crm/types";
import { createAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body) as ContactFormData;
    const supabase = createAdminClient();

    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        message: data.message,
        source: "contact_form",
      })
      .select()
      .single();

    if (contactError) {
      console.error("Contact insert error:", contactError);
      return NextResponse.json({ error: "Failed to save your information" }, { status: 500 });
    }

    // Get first pipeline stage
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("is_closed", false)
      .order("display_order", { ascending: true })
      .limit(1)
      .single();

    // Create deal
    const { data: deal } = await supabase
      .from("deals")
      .insert({
        name: `${data.name} — New Lead`,
        stage_id: firstStage?.id,
        contact_id: contact.id,
        description: data.message,
      })
      .select()
      .single();

    // Log activity
    await supabase.from("activities").insert({
      contact_id: contact.id,
      deal_id: deal?.id,
      type: "form_submission",
      title: "Contact form submitted",
      description: `${data.name} submitted the contact form.`,
    });

    after(async () => {
      try {
        const score = await scoreLeadWithAI(data);
        const backgroundSupabase = createAdminClient();
        const results = await Promise.allSettled([
          backgroundSupabase
            .from("contacts")
            .update({
              lead_score: score.score,
              lead_score_label: score.label,
              lead_score_reasoning: score.reasoning,
            })
            .eq("id", contact.id)
            .then(({ error }) => {
              if (error) throw error;
            }),
          backgroundSupabase
            .from("activities")
            .insert({
              contact_id: contact.id,
              type: "ai_scoring",
              title: `AI scored lead: ${score.score}/100 (${score.label})`,
              description: score.reasoning,
              metadata: score,
            })
            .then(({ error }) => {
              if (error) throw error;
            }),
          sendSlackNotification(data, score),
          sendEmailNotification(data, score),
        ]);

        results.forEach((result, index) => {
          if (result.status === "rejected") {
            const label = ["contact score update", "AI scoring activity", "Slack notification", "Email notification"][index];
            console.error(`${label} error:`, result.reason);
          }
        });
      } catch (error) {
        console.error("Post-submit contact processing error:", error);
      }
    });

    return NextResponse.json({ success: true, message: "Thank you! We'll be in touch soon." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data", details: error.issues }, { status: 400 });
    }
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

async function sendSlackNotification(
  data: ContactFormData,
  score: { score: number; label: string; reasoning: string }
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = score.label === "hot" ? "🔥" : score.label === "warm" ? "🟡" : "🔵";
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        { type: "header", text: { type: "plain_text", text: `${emoji} New Lead: ${data.name}` } },
        { type: "section", fields: [
          { type: "mrkdwn", text: `*Email:*\n${data.email}` },
          { type: "mrkdwn", text: `*Company:*\n${data.company || "N/A"}` },
          { type: "mrkdwn", text: `*Phone:*\n${data.phone || "N/A"}` },
          { type: "mrkdwn", text: `*Score:*\n${score.score}/100 (${score.label})` },
        ]},
        { type: "section", text: { type: "mrkdwn", text: `*Message:*\n>${data.message.slice(0, 500)}` } },
        { type: "context", elements: [{ type: "mrkdwn", text: `*AI:* ${score.reasoning}` }] },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed with status ${response.status}`);
  }
}

async function sendEmailNotification(
  data: ContactFormData,
  score: { score: number; label: string; reasoning: string }
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to = "jeff@amishcountrytheater.com";
  const from = process.env.RESEND_FROM || "Triple 3 Labs <onboarding@resend.dev>";
  const emoji = score.label === "hot" ? "🔥" : score.label === "warm" ? "🟡" : "🔵";
  const subject = `${emoji} New Lead: ${data.name} (${score.score}/100 ${score.label})`;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px;">
      <h2 style="margin-bottom: 8px;">${emoji} New Lead: ${esc(data.name)}</h2>
      <p style="color:#666; margin-top:0;">Score: <strong>${score.score}/100</strong> (${score.label})</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
        <tr><td style="padding:6px 0; color:#666;">Company</td><td style="padding:6px 0;">${esc(data.company || "N/A")}</td></tr>
        <tr><td style="padding:6px 0; color:#666;">Phone</td><td style="padding:6px 0;">${esc(data.phone || "N/A")}</td></tr>
      </table>
      <div style="background:#f6f6f6; padding:12px; border-radius:6px; white-space:pre-wrap;">${esc(data.message)}</div>
      <p style="color:#888; font-size:12px; margin-top:16px;"><em>AI reasoning: ${esc(score.reasoning)}</em></p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend failed ${response.status}: ${body}`);
  }
}
