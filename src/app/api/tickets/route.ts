import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CLOSED_STATUSES = ["resolved", "closed"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const q = searchParams.get("q");

  let query = supabase
    .from("tickets")
    .select("*, account:accounts(id, name), ticket_messages(count)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    if (status === "open") {
      query = query.not("status", "in", `(${CLOSED_STATUSES.join(",")})`);
    } else {
      query = query.eq("status", status);
    }
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (q) {
    const orFilters = [
      `subject.ilike.%${q}%`,
      `description.ilike.%${q}%`,
      `submitter_email.ilike.%${q}%`,
    ];
    const asNumber = Number(q);
    if (Number.isFinite(asNumber) && q.trim() !== "") {
      orFilters.push(`ticket_number.eq.${asNumber}`);
    }
    query = query.or(orFilters.join(","));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tickets = (data || []).map((t) => {
    const { ticket_messages, ...rest } = t as typeof t & {
      ticket_messages?: { count: number }[];
    };
    return {
      ...rest,
      message_count: ticket_messages?.[0]?.count ?? 0,
    };
  });

  return NextResponse.json({ tickets });
}

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  severity: z.enum(["low", "normal", "high", "urgent"]).optional(),
  account_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  agent_id: z.string().max(100).optional().nullable(),
  submitter_email: z.string().email().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createTicketSchema.parse(body);

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        ...data,
        channel: "internal",
        status: "new",
      })
      .select("*, account:accounts(id, name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid ticket data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
