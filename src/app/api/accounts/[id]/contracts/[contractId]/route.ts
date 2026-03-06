import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id: accountId, contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .eq("account_id", accountId)
    .single();

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Generate signed download URL (60 second expiry)
  const { data: signedUrl, error: signErr } = await supabase.storage
    .from("contracts")
    .createSignedUrl(contract.file_path, 60);

  if (signErr || !signedUrl) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.json({ contract, download_url: signedUrl.signedUrl });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id: accountId, contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;

    const { data: contract, error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contractId)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contract });
  } catch (error) {
    console.error("Contract update error:", error);
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id: accountId, contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch contract to get file path
  const { data: contract, error: fetchErr } = await supabase
    .from("contracts")
    .select("file_path, title, account_id")
    .eq("id", contractId)
    .eq("account_id", accountId)
    .single();

  if (fetchErr || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Get account for activity logging
  const { data: account } = await supabase
    .from("accounts")
    .select("contact_id")
    .eq("id", accountId)
    .single();

  // Delete from storage
  await supabase.storage.from("contracts").remove([contract.file_path]);

  // Delete from database
  const { error: deleteErr } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // Log activity
  if (account) {
    await supabase.from("activities").insert({
      contact_id: account.contact_id,
      account_id: accountId,
      type: "contract_deleted",
      title: `Contract deleted: ${contract.title}`,
    });
  }

  return NextResponse.json({ success: true });
}
