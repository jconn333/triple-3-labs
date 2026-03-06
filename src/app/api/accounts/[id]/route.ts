import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accountRes, contractsRes, activitiesRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, contact:contacts(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("contracts")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (accountRes.error || !accountRes.data) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({
    account: accountRes.data,
    contracts: contractsRes.data || [],
    activities: activitiesRes.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;

    // Fetch old account for activity logging
    const { data: oldAccount } = await supabase
      .from("accounts")
      .select("status, contact_id")
      .eq("id", id)
      .single();

    const { data: account, error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .select("*, contact:contacts(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log status changes
    if (body.status && oldAccount && body.status !== oldAccount.status) {
      await supabase.from("activities").insert({
        contact_id: oldAccount.contact_id,
        account_id: id,
        type: "status_change",
        title: `Account status changed to ${body.status}`,
        description: `From ${oldAccount.status} to ${body.status}`,
      });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
