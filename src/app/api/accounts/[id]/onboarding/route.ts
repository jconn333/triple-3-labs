import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSigningToken } from "@/lib/esign/tokens";
import { emailConfigured, sendOnboardingLinkEmail } from "@/lib/onboarding/email";
import { computeExpiresAt } from "@/lib/onboarding/requests";
import { getFormSpec } from "@/lib/onboarding/forms";
import type { AccessGrant } from "@/lib/onboarding/forms";

const accessGrantSchema = z.object({
  tool: z.string(),
  address: z.string(),
  role: z.string(),
  url: z.string().optional(),
});

const createSchema = z.object({
  form_key: z.string(),
  recipient_name: z.string().min(2).max(120),
  recipient_email: z.string().email(),
  access_grants: z.array(accessGrantSchema).optional(),
  send_email: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: requests, error } = await admin
    .from("onboarding_requests")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("onboarding_requests list error:", error);
    return NextResponse.json({ error: "Failed to load onboarding requests" }, { status: 500 });
  }

  return NextResponse.json({ requests: requests ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createSchema.parse(await request.json());
    const admin = createAdminClient();

    const spec = getFormSpec(body.form_key);
    if (!spec) {
      return NextResponse.json({ error: `Unknown form_key: ${body.form_key}` }, { status: 400 });
    }

    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, name, contact_id")
      .eq("id", accountId)
      .single();
    if (accErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // One active link per (account, form_key): cancel any pending/viewed ones.
    await admin
      .from("onboarding_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("account_id", accountId)
      .eq("form_key", body.form_key)
      .in("status", ["pending", "viewed"]);

    const { token, tokenHash } = generateSigningToken();
    const expiresAt = computeExpiresAt();

    const { data: onboardingRequest, error: insertErr } = await admin
      .from("onboarding_requests")
      .insert({
        account_id: accountId,
        form_key: body.form_key,
        token_hash: tokenHash,
        recipient_name: body.recipient_name,
        recipient_email: body.recipient_email,
        access_grants: (body.access_grants as AccessGrant[] | undefined) ?? null,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (insertErr || !onboardingRequest) {
      console.error("onboarding_requests insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create onboarding request" }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
    const onboardingUrl = `${baseUrl}/onboarding/${token}`;

    let emailSent = false;
    let emailError: string | undefined;
    if (body.send_email !== false && emailConfigured()) {
      try {
        await sendOnboardingLinkEmail({
          recipientName: body.recipient_name,
          recipientEmail: body.recipient_email,
          accountName: account.name,
          formTitle: spec.title,
          onboardingUrl,
          expiresAt,
        });
        emailSent = true;
      } catch (err) {
        console.error("Onboarding link email failed:", err);
        emailError = err instanceof Error ? err.message : "Failed to send email";
      }
    }

    await admin.from("activities").insert({
      account_id: accountId,
      contact_id: account.contact_id,
      type: "onboarding_sent",
      title: `Onboarding form sent: ${spec.title}`,
      description: `Link ${emailSent ? "emailed to" : "created for"} ${body.recipient_name} <${
        body.recipient_email
      }>${emailSent ? "" : " (email not sent — share the link manually)"}`,
      metadata: { onboarding_request_id: onboardingRequest.id, email_sent: emailSent },
    });

    return NextResponse.json({
      onboarding_url: onboardingUrl,
      email_sent: emailSent,
      ...(emailError ? { email_error: emailError } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("onboarding send error:", error);
    return NextResponse.json({ error: "Failed to create onboarding request" }, { status: 500 });
  }
}

const resendSchema = z.object({
  requestId: z.string().uuid(),
  send_email: z.boolean().optional(),
});

/**
 * Re-issue an existing onboarding link.
 *
 * The raw token is never stored — only its SHA-256 — so a link cannot be
 * recovered after it is created. Resending therefore *rotates* the token:
 * the old URL dies, a fresh one is returned. This is the only honest way to
 * get a working link back (e.g. when the first email lands in the client's
 * spam filter and it has to be re-sent by hand).
 *
 * Recipient and access grants carry over; the expiry clock restarts. A
 * submitted form is never re-opened.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = resendSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("onboarding_requests")
      .select("*, account:accounts(id, name, contact_id)")
      .eq("id", body.requestId)
      .eq("account_id", accountId)
      .single();

    if (!existing || !existing.account) {
      return NextResponse.json({ error: "Onboarding request not found" }, { status: 404 });
    }
    if (existing.status === "submitted") {
      return NextResponse.json(
        { error: "This form has already been submitted — send a new one instead." },
        { status: 409 }
      );
    }

    const spec = getFormSpec(existing.form_key);
    if (!spec) {
      return NextResponse.json({ error: `Unknown form_key: ${existing.form_key}` }, { status: 400 });
    }

    const { token, tokenHash } = generateSigningToken();
    const expiresAt = computeExpiresAt();

    const { error: updateErr } = await admin
      .from("onboarding_requests")
      .update({
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
        sent_at: new Date().toISOString(),
        viewed_at: null,
        // Clear forensics from the dead link so they can't be misread as
        // belonging to the new one.
        submitter_ip: null,
        submitter_user_agent: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateErr) {
      console.error("onboarding resend error:", updateErr);
      return NextResponse.json({ error: "Failed to re-issue the link" }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
    const onboardingUrl = `${baseUrl}/onboarding/${token}`;

    let emailSent = false;
    let emailError: string | undefined;
    if (body.send_email && emailConfigured() && existing.recipient_email) {
      try {
        await sendOnboardingLinkEmail({
          recipientName: existing.recipient_name ?? "there",
          recipientEmail: existing.recipient_email,
          accountName: existing.account.name,
          formTitle: spec.title,
          onboardingUrl,
          expiresAt,
        });
        emailSent = true;
      } catch (err) {
        console.error("Onboarding link email failed:", err);
        emailError = err instanceof Error ? err.message : "Failed to send email";
      }
    }

    await admin.from("activities").insert({
      account_id: accountId,
      contact_id: existing.account.contact_id,
      type: "onboarding_sent",
      title: `Onboarding link re-issued: ${spec.title}`,
      description: `A fresh link was generated${
        emailSent ? ` and emailed to ${existing.recipient_email}` : " (not emailed — shared manually)"
      }. The previous link no longer works.`,
      metadata: { onboarding_request_id: existing.id, email_sent: emailSent, reissued: true },
    });

    return NextResponse.json({
      onboarding_url: onboardingUrl,
      email_sent: emailSent,
      ...(emailError ? { email_error: emailError } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("onboarding resend error:", error);
    return NextResponse.json({ error: "Failed to re-issue the link" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestId = request.nextUrl.searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  // Never cancel a submitted request — the answers are the record.
  const { data: cancelled, error } = await admin
    .from("onboarding_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("account_id", accountId)
    .neq("status", "submitted")
    .select("id");

  if (error) {
    console.error("onboarding cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel onboarding request" }, { status: 500 });
  }

  return NextResponse.json({ cancelled: cancelled?.length ?? 0 });
}
