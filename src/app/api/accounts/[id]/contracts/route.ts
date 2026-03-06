import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and Word documents are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    // Verify account exists
    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, contact_id")
      .eq("id", accountId)
      .single();

    if (accErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const storagePath = `${accountId}/${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("contracts")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Create contract record
    const { data: contract, error: insertErr } = await supabase
      .from("contracts")
      .insert({
        account_id: accountId,
        title,
        description: description || null,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (insertErr) {
      // Clean up uploaded file
      await supabase.storage.from("contracts").remove([storagePath]);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activities").insert({
      contact_id: account.contact_id,
      account_id: accountId,
      type: "contract_uploaded",
      title: `Contract uploaded: ${title}`,
      description: file.name,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Contract upload error:", error);
    return NextResponse.json({ error: "Failed to upload contract" }, { status: 500 });
  }
}
