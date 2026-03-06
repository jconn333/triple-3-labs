import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftFollowUpEmail } from "@/lib/ai/follow-up-drafter";
import type { Contact } from "@/lib/crm/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { contactId } = await request.json();

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const leadScore = contact.lead_score
      ? {
          score: contact.lead_score,
          label: (contact.lead_score >= 70 ? "hot" : contact.lead_score >= 40 ? "warm" : "cold") as "hot" | "warm" | "cold",
          reasoning: contact.lead_score_reasoning || "",
        }
      : null;

    const startTime = Date.now();
    const draft = await draftFollowUpEmail(contact as Contact, leadScore);
    const latencyMs = Date.now() - startTime;

    await supabase.from("activities").insert({
      contact_id: contactId,
      type: "ai_follow_up",
      title: "AI drafted follow-up email",
      description: draft.subject,
      metadata: draft,
    });

    await supabase.from("ai_agent_logs").insert({
      agent_type: "follow_up_drafter",
      contact_email: contact.email,
      contact_id: contactId,
      input: { contactId },
      output: draft,
      model: "claude-haiku-4-5-20251001",
      latency_ms: latencyMs,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Follow-up draft error:", error);
    return NextResponse.json({ error: "Failed to draft follow-up" }, { status: 500 });
  }
}
