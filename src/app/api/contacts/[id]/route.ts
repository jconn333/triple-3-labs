import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Get associated deals
  const { data: deals } = await supabase
    .from("deals")
    .select("*, stage:pipeline_stages(*)")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  // Get activity timeline
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Check for linked account
  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, status, stripe_customer_id")
    .eq("contact_id", id)
    .maybeSingle();

  return NextResponse.json({ contact, deals: deals || [], activities: activities || [], account });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("contacts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
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

  // Look up any linked account so we can clean up its dependents too
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("contact_id", id);
  const accountIds = (accounts || []).map((a) => a.id);

  // Remove dependents first (no FK cascade assumed).
  // Order matters: contracts -> accounts -> activities -> deals -> contact.
  if (accountIds.length > 0) {
    const { error: contractsErr } = await supabase
      .from("contracts")
      .delete()
      .in("account_id", accountIds);
    if (contractsErr && contractsErr.code !== "42P01") {
      console.error("Contact delete — contracts cleanup failed:", contractsErr);
      return NextResponse.json({ error: contractsErr.message }, { status: 500 });
    }

    const { error: accountsErr } = await supabase
      .from("accounts")
      .delete()
      .in("id", accountIds);
    if (accountsErr) {
      console.error("Contact delete — accounts cleanup failed:", accountsErr);
      return NextResponse.json({ error: accountsErr.message }, { status: 500 });
    }
  }

  const { error: aiLogsErr } = await supabase
    .from("ai_agent_logs")
    .delete()
    .eq("contact_id", id);
  if (aiLogsErr && aiLogsErr.code !== "42P01") {
    console.error("Contact delete — ai_agent_logs cleanup failed:", aiLogsErr);
    return NextResponse.json({ error: aiLogsErr.message }, { status: 500 });
  }

  const { error: activitiesErr } = await supabase
    .from("activities")
    .delete()
    .eq("contact_id", id);
  if (activitiesErr) {
    console.error("Contact delete — activities cleanup failed:", activitiesErr);
    return NextResponse.json({ error: activitiesErr.message }, { status: 500 });
  }

  const { error: dealsErr } = await supabase
    .from("deals")
    .delete()
    .eq("contact_id", id);
  if (dealsErr) {
    console.error("Contact delete — deals cleanup failed:", dealsErr);
    return NextResponse.json({ error: dealsErr.message }, { status: 500 });
  }

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) {
    console.error("Contact delete — contact delete failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
