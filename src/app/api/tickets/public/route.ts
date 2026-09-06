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

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        account_id: null,
        contact_id: null,
        verified: false,
        submitter_email: data.email,
        subject: data.subject,
        description: data.description,
        channel: "portal",
        status: "awaiting_customer",
        severity: data.severity,
      })
      .select("id, ticket_number, email_verification_token")
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
    const viewUrl = `${baseUrl}/api/tickets/public?id=${ticket.id}&token=${ticket.email_verification_token}`;

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
      { success: true, ticket_number: ticket.ticket_number },
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

// Only the emailed verification token can establish control of the claimed email.
// It is separate from view_token because older POST responses exposed view_token.
export async function GET(request: NextRequest) {
  const parsed = z.object({ id: z.uuid(), token: z.uuid() }).safeParse({
    id: request.nextUrl.searchParams.get("id"),
    token: request.nextUrl.searchParams.get("token"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verification link" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: ticket, error } = await supabase.from("tickets")
    .select("id, submitter_email, verified, view_token")
    .eq("id", parsed.data.id)
    .eq("email_verification_token", parsed.data.token)
    .single();
  if (error || !ticket) {
    return NextResponse.json({ error: "Verification link not found" }, { status: 404 });
  }

  if (!ticket.verified) {
    const emailPattern = ticket.submitter_email?.replace(/[\\%_]/g, "\\$&");
    if (!emailPattern) {
      return NextResponse.json({ error: "No email to verify" }, { status: 400 });
    }
    const { data: contacts, error: contactError } = await supabase.from("contacts")
      .select("id").ilike("email", emailPattern).limit(2);
    if (contactError) {
      return NextResponse.json({ error: "Could not verify ticket" }, { status: 500 });
    }
    // Ambiguous email matches remain unlinked for the admin to resolve.
    const contact = contacts?.length === 1 ? contacts[0] : null;
    let accountId: string | null = null;
    if (contact) {
      const { data: accounts, error: accountError } = await supabase.from("accounts")
        .select("id").eq("contact_id", contact.id).limit(2);
      if (accountError) {
        return NextResponse.json({ error: "Could not verify ticket" }, { status: 500 });
      }
      if (accounts?.length === 1) accountId = accounts[0].id;
    }
    const { error: updateError } = await supabase.from("tickets").update({
      verified: true,
      contact_id: contact?.id ?? null,
      account_id: accountId,
      status: "new",
    }).eq("id", ticket.id).eq("email_verification_token", parsed.data.token).eq("verified", false);
    if (updateError) {
      return NextResponse.json({ error: "Could not verify ticket" }, { status: 500 });
    }
  }

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://triple3labs.io").replace(/\/$/, "");
  return NextResponse.redirect(`${baseUrl}/ticket/${ticket.id}?token=${ticket.view_token}`, {
    status: 303,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
