import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { scoreLeadWithAI } from "@/lib/ai/lead-scoring";
import type { ContactFormData } from "@/lib/crm/types";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  projectType: z.enum(["ai-agent", "automation", "consulting", "other"]),
  message: z.string().min(10).max(2000),
  budget: z.enum(["under-5k", "5k-15k", "15k-50k", "50k-plus"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body) as ContactFormData;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
          },
        },
      }
    );

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
        project_type: data.projectType,
        budget_range: data.budget || null,
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

    const budgetAmounts: Record<string, number> = {
      "under-5k": 5000, "5k-15k": 10000, "15k-50k": 30000, "50k-plus": 75000,
    };
    const projectLabels: Record<string, string> = {
      "ai-agent": "AI Agent", automation: "Automation", consulting: "Consulting", other: "Other",
    };

    // Create deal
    const { data: deal } = await supabase
      .from("deals")
      .insert({
        name: `${data.name} — ${projectLabels[data.projectType] || data.projectType}`,
        stage_id: firstStage?.id,
        contact_id: contact.id,
        amount: data.budget ? budgetAmounts[data.budget] : null,
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
      description: `${data.name} submitted the contact form. Project: ${data.projectType}. Budget: ${data.budget || "not specified"}.`,
    });

    // AI lead scoring (non-blocking)
    scoreLeadWithAI(data)
      .then(async (score) => {
        await supabase
          .from("contacts")
          .update({ lead_score: score.score, lead_score_label: score.label, lead_score_reasoning: score.reasoning })
          .eq("id", contact.id);

        await supabase.from("activities").insert({
          contact_id: contact.id,
          type: "ai_scoring",
          title: `AI scored lead: ${score.score}/100 (${score.label})`,
          description: score.reasoning,
          metadata: score,
        });

        await sendSlackNotification(data, score).catch(console.error);
      })
      .catch(console.error);

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

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        { type: "header", text: { type: "plain_text", text: `${emoji} New Lead: ${data.name}` } },
        { type: "section", fields: [
          { type: "mrkdwn", text: `*Email:*\n${data.email}` },
          { type: "mrkdwn", text: `*Company:*\n${data.company || "N/A"}` },
          { type: "mrkdwn", text: `*Project:*\n${data.projectType}` },
          { type: "mrkdwn", text: `*Budget:*\n${data.budget || "N/A"}` },
          { type: "mrkdwn", text: `*Score:*\n${score.score}/100 (${score.label})` },
        ]},
        { type: "section", text: { type: "mrkdwn", text: `*Message:*\n>${data.message.slice(0, 500)}` } },
        { type: "context", elements: [{ type: "mrkdwn", text: `*AI:* ${score.reasoning}` }] },
      ],
    }),
  });
}
