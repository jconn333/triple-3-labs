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

  // Remove dependents first (no FK cascade assumed)
  await supabase.from("activities").delete().eq("contact_id", id);
  await supabase.from("deals").delete().eq("contact_id", id);

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
