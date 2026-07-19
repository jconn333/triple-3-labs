import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Conditional update — only actions currently 'executed' or 'verified' can
  // be rolled back, and this claims the row atomically so a double-click (or
  // two staff members racing) can't double-count the rollback against the
  // runbook's times_rolled_back.
  const { data: action, error } = await supabase
    .from("ticket_actions")
    .update({ status: "rolled_back" })
    .eq("id", actionId)
    .in("status", ["executed", "verified"])
    .select("id, ticket_id, runbook_key")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!action) {
    return NextResponse.json(
      { error: "This action can't be rolled back (already rolled back, or not yet executed)." },
      { status: 409 }
    );
  }

  // Increment times_rolled_back on the runbook. This permanently blocks that
  // runbook's Tier 2 -> Tier 1 auto-approve graduation — that's the point: a
  // runbook that has ever needed a rollback never gets to run unsupervised.
  const { data: runbook } = await supabase
    .from("runbooks")
    .select("times_rolled_back")
    .eq("key", action.runbook_key)
    .maybeSingle();

  if (runbook) {
    await supabase
      .from("runbooks")
      .update({ times_rolled_back: (runbook.times_rolled_back ?? 0) + 1 })
      .eq("key", action.runbook_key);
  }

  await supabase.from("ticket_messages").insert({
    ticket_id: action.ticket_id,
    author_type: "system",
    author_name: "Rollback",
    body: `Fix rolled back by ${user.email ?? "staff"}.`,
    is_internal: true,
  });

  await supabase
    .from("tickets")
    .update({ status: "escalated", escalation_reason: "fix rolled back by staff" })
    .eq("id", action.ticket_id);

  return NextResponse.json({ success: true });
}
