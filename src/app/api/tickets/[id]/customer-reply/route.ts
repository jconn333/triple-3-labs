import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackMessage } from "@/lib/notifications/slack";

const replySchema = z.object({
  token: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

function localPart(email: string): string {
  return email.split("@")[0] || email;
}

interface JoinedContact {
  first_name: string;
  last_name: string;
  email: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = replySchema.parse(body);

    const admin = createAdminClient();

    // Conditional query — the ticket id alone must never be sufficient. The
    // token has to match this exact ticket's view_token or we treat the whole
    // thing as "not found" (never leak whether the id exists).
    const { data: ticket, error: ticketError } = await admin
      .from("tickets")
      .select(
        "id, ticket_number, status, reopened_count, submitter_email, contact:contacts(first_name, last_name, email)"
      )
      .eq("id", id)
      .eq("view_token", parsed.token)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "This ticket link is invalid." }, { status: 404 });
    }

    // Crude rate limit — a runaway thread (bot, abuse) shouldn't grow forever.
    const { count } = await admin
      .from("ticket_messages")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticket.id);

    if ((count ?? 0) > 100) {
      return NextResponse.json(
        { error: "This ticket has reached its message limit. Please contact us directly." },
        { status: 429 }
      );
    }

    const contact = (Array.isArray(ticket.contact) ? ticket.contact[0] : ticket.contact) as
      | JoinedContact
      | null
      | undefined;
    const authorName = contact
      ? `${contact.first_name} ${contact.last_name}`.trim() || contact.email
      : ticket.submitter_email
        ? localPart(ticket.submitter_email)
        : "Customer";

    const { data: message, error: messageError } = await admin
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        author_type: "customer",
        author_name: authorName,
        body: parsed.body,
        is_internal: false,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error("Customer reply insert error:", messageError);
      return NextResponse.json({ error: "Failed to send your reply" }, { status: 500 });
    }

    // State machine: resolved/closed tickets reopen — and count toward
    // reopened_count, which the worker uses to force escalation instead of
    // auto-fixing the same thing twice. awaiting_customer just clears back to
    // new (the customer answered what we asked — not a reopen). Anything else
    // is left alone.
    if (ticket.status === "resolved" || ticket.status === "closed") {
      await admin
        .from("tickets")
        .update({
          status: "new",
          reopened_count: (ticket.reopened_count ?? 0) + 1,
          resolved_at: null,
          closed_at: null,
        })
        .eq("id", ticket.id);
    } else if (ticket.status === "awaiting_customer") {
      await admin.from("tickets").update({ status: "new" }).eq("id", ticket.id);
    }

    await sendSlackMessage({
      text: `💬 Customer replied on ticket #${ticket.ticket_number}`,
    }).catch((err) => console.error("Slack notification error:", err));

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Customer reply error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
