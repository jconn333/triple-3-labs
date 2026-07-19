import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackMessage } from "@/lib/notifications/slack";
import { emailConfigured, sendTicketAcknowledgmentEmail } from "@/lib/notifications/email";

const publicTicketSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().max(100).optional(),
  subject: z.string().min(1).max(200),
  description: z.string().min(10),
  severity: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  agent_id: z.string().max(100).optional(),
  // Honeypot — real users never fill this in; bots usually do. Deliberately
  // unrestricted length so a filled-in value still parses (and can be caught
  // below) instead of failing validation and tipping the bot off with a 400.
  website: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = publicTicketSchema.parse(body);

    // Honeypot tripped — pretend success, do nothing.
    if (data.website) {
      return NextResponse.json({ success: true, ticket_number: 0 }, { status: 201 });
    }

    const supabase = createAdminClient();

    // Look up an existing contact by email (case-insensitive) to link the ticket.
    // ILIKE treats % and _ as wildcards — escape them so an email can only ever
    // match itself, never pattern-match onto a different contact's account.
    const emailPattern = data.email.replace(/[\\%_]/g, "\\$&");
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .ilike("email", emailPattern)
      .limit(1)
      .maybeSingle();

    let accountId: string | null = null;
    if (contact) {
      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("contact_id", contact.id)
        .limit(1)
        .maybeSingle();
      accountId = account?.id ?? null;
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        account_id: accountId,
        contact_id: contact?.id ?? null,
        submitter_email: data.email,
        subject: data.subject,
        description: data.description,
        channel: "portal",
        agent_id: data.agent_id || null,
        status: "new",
        severity: data.severity,
      })
      .select("id, ticket_number, view_token")
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket insert error:", ticketError);
      return NextResponse.json({ error: "Failed to submit your ticket" }, { status: 500 });
    }

    const { error: messageError } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      author_type: "customer",
      author_name: data.name,
      body: data.description,
      is_internal: false,
    });

    if (messageError) {
      console.error("Ticket message insert error:", messageError);
    }

    // Never derive the emailed link from the request's Host header — a spoofed
    // Host must not be able to point "Track your ticket" at another domain.
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://triple3labs.io").replace(/\/$/, "");
    const viewUrl = `${baseUrl}/ticket/${ticket.id}?token=${ticket.view_token}`;

    after(async () => {
      const results = await Promise.allSettled([
        sendSlackMessage({
          text: `🎫 New ticket #${ticket.ticket_number} from ${data.name}: ${data.subject}`,
        }),
        (async () => {
          if (!emailConfigured()) return;
          await sendTicketAcknowledgmentEmail({
            toEmail: data.email,
            toName: data.name,
            ticketNumber: ticket.ticket_number,
            subject: data.subject,
            viewUrl,
          });
        })(),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const label = ["Slack notification", "Acknowledgment email"][index];
          console.error(`${label} error:`, result.reason);
        }
      });
    });

    return NextResponse.json(
      { success: true, ticket_number: ticket.ticket_number, view_url: viewUrl },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data", details: error.issues }, { status: 400 });
    }
    console.error("Public ticket submission error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
