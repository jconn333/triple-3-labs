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

  const { count, error: commitmentError } = await supabase.from("commitments")
    .select("id", { count: "exact", head: true }).eq("contract_id", contractId);
  if (commitmentError) return NextResponse.json({ error: "Could not check contract references" }, { status: 500 });
  if (count) {
    return NextResponse.json({
      error: `${count} commitment${count === 1 ? " references" : "s reference"} this contract; unlink them first`,
    }, { status: 409 });
  }

  // Get account for activity logging before deleting anything.
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("contact_id")
    .eq("id", accountId)
    .single();
  if (accountError || !account) return NextResponse.json({ error: "Could not load contract account" }, { status: 500 });

  // The FK also protects against a commitment being added after the preflight.
  const { error: deleteErr } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId)
    .eq("account_id", accountId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.code === "23503" ? "Linked records reference this contract; unlink them first" : deleteErr.message }, { status: deleteErr.code === "23503" ? 409 : 500 });
  }

  // The row is gone. Cleanup failure leaves only an orphan, not a broken contract.
  try {
    const { error: storageError } = await supabase.storage.from("contracts").remove([contract.file_path]);
    if (storageError) console.error(`Contract ${contractId} deleted; storage cleanup failed:`, storageError);
  } catch (error) {
    console.error(`Contract ${contractId} deleted; storage cleanup failed:`, error);
  }

  // Log activity
  if (account) {
    const { error: activityError } = await supabase.from("activities").insert({
      contact_id: account.contact_id,
      account_id: accountId,
      type: "contract_deleted",
      title: `Contract deleted: ${contract.title}`,
    });
    if (activityError) return NextResponse.json({ error: "Contract deleted, but its activity could not be saved" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
