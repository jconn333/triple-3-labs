import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const decideSchema = z.object({
  token: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;

  try {
    const body = await request.json();
    const { token, decision } = decideSchema.parse(body);

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // Single conditional update — atomically claims the row only if it is
    // still 'proposed' and the token matches, so a double-click (or a stale
    // second link) can never approve/reject twice.
    const updateFields =
      decision === "approve"
        ? { status: "approved", approved_by: "jeff (discord link)", decided_at: nowIso }
        : { status: "rejected", decided_at: nowIso };

    const { data: updated, error } = await admin
      .from("ticket_actions")
      .update(updateFields)
      .eq("id", actionId)
      .eq("approval_token", token)
      .eq("status", "proposed")
      .select("id, ticket_id, runbook_key")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "This action has already been decided, or the link is invalid." },
        { status: 409 }
      );
    }

    if (decision === "approve") {
      const { data: runbook } = await admin
        .from("runbooks")
        .select("times_approved")
        .eq("key", updated.runbook_key)
        .maybeSingle();

      if (runbook) {
        await admin
          .from("runbooks")
          .update({ times_approved: (runbook.times_approved ?? 0) + 1 })
          .eq("key", updated.runbook_key);
      }

      await admin.from("ticket_messages").insert({
        ticket_id: updated.ticket_id,
        author_type: "system",
        author_name: "Approval flow",
        body: "Fix approved by Jeff via Discord link.",
        is_internal: true,
      });
    } else {
      await admin
        .from("tickets")
        .update({ status: "escalated", escalation_reason: "fix rejected" })
        .eq("id", updated.ticket_id);

      await admin.from("ticket_messages").insert({
        ticket_id: updated.ticket_id,
        author_type: "system",
        author_name: "Approval flow",
        body: "Fix rejected by Jeff via Discord link. Ticket escalated.",
        is_internal: true,
      });
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
