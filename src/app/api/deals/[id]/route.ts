import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // If moving to a closed stage, set closed_at
  if (body.stage_id) {
    const { data: stage } = await supabase
      .from("pipeline_stages")
      .select("is_closed, name")
      .eq("id", body.stage_id)
      .single();

    if (stage?.is_closed) {
      body.closed_at = new Date().toISOString();
    } else {
      body.closed_at = null;
    }

    // Log stage change as activity
    const { data: deal } = await supabase
      .from("deals")
      .select("contact_id, stage:pipeline_stages(name)")
      .eq("id", id)
      .single();

    if (deal?.contact_id) {
      const oldStage = (deal.stage as any)?.name || "Unknown";
      await supabase.from("activities").insert({
        contact_id: deal.contact_id,
        deal_id: id,
        type: "stage_change",
        title: `Deal moved to ${stage?.name || "new stage"}`,
        description: `From "${oldStage}" to "${stage?.name}"`,
      });
    }
  }

  const { data, error } = await supabase
    .from("deals")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, contact:contacts(id, first_name, last_name, email), stage:pipeline_stages(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Look up the associated contact so we can clean it up as well
  const { data: deal } = await supabase
    .from("deals")
    .select("contact_id")
    .eq("id", id)
    .single();

  const contactId = deal?.contact_id as string | null | undefined;

  // Remove activities tied to the deal and/or contact first (no FK cascade assumed)
  if (contactId) {
    await supabase.from("activities").delete().eq("contact_id", contactId);
  } else {
    await supabase.from("activities").delete().eq("deal_id", id);
  }

  const { error: dealError } = await supabase.from("deals").delete().eq("id", id);
  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 500 });
  }

  if (contactId) {
    const { error: contactError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId);
    if (contactError) {
      return NextResponse.json({ error: contactError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
