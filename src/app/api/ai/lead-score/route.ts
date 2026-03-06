import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreLeadWithAI } from "@/lib/ai/lead-scoring";
import type { ContactFormData } from "@/lib/crm/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { contactData, contactId } = await request.json() as {
      contactData: ContactFormData;
      contactId?: string;
    };

    const startTime = Date.now();
    const score = await scoreLeadWithAI(contactData);
    const latencyMs = Date.now() - startTime;

    if (contactId) {
      await supabase.from("contacts").update({
        lead_score: score.score,
        lead_score_label: score.label,
        lead_score_reasoning: score.reasoning,
      }).eq("id", contactId);

      await supabase.from("activities").insert({
        contact_id: contactId,
        type: "ai_scoring",
        title: `AI re-scored lead: ${score.score}/100 (${score.label})`,
        description: score.reasoning,
        metadata: score,
      });
    }

    await supabase.from("ai_agent_logs").insert({
      agent_type: "lead_scoring",
      contact_email: contactData.email,
      contact_id: contactId,
      input: contactData,
      output: score,
      model: "claude-haiku-4-5-20251001",
      latency_ms: latencyMs,
    });

    return NextResponse.json(score);
  } catch (error) {
    console.error("Lead scoring error:", error);
    return NextResponse.json({ error: "Failed to score lead" }, { status: 500 });
  }
}
