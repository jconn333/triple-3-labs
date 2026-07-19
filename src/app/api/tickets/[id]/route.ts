import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ticketRes, messagesRes, diagnosesRes, actionsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("*, account:accounts(id, name), contact:contacts(id, first_name, last_name, email)")
      .eq("id", id)
      .single(),
    supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("ticket_diagnoses")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ticket_actions")
      .select("*, runbook:runbooks(key, title, description, tier)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (ticketRes.error || !ticketRes.data) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json({
    ticket: ticketRes.data,
    messages: messagesRes.data || [],
    diagnoses: diagnosesRes.data || [],
    actions: actionsRes.data || [],
  });
}

const patchTicketSchema = z.object({
  status: z
    .enum([
      "new",
      "triaging",
      "awaiting_customer",
      "pending_approval",
      "fixing",
      "verifying",
      "resolved",
      "escalated",
      "closed",
    ])
    .optional(),
  severity: z.enum(["low", "normal", "high", "urgent"]).optional(),
  escalation_reason: z.string().nullable().optional(),
});

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
    const updates = patchTicketSchema.parse(body);

    const { data: current, error: currentError } = await supabase
      .from("tickets")
      .select("status, reopened_count")
      .eq("id", id)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = { ...updates };

    if (updates.status === "resolved") {
      patch.resolved_at = new Date().toISOString();
    }
    if (updates.status === "closed") {
      patch.closed_at = new Date().toISOString();
    }
    // Reopen semantics: a resolved ticket re-set to 'new' always escalates on
    // the worker side — track the reopen count so it never gets auto-fixed twice.
    if (updates.status === "new" && current.status === "resolved") {
      patch.reopened_count = (current.reopened_count ?? 0) + 1;
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .update(patch)
      .eq("id", id)
      .select("*, account:accounts(id, name), contact:contacts(id, first_name, last_name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
