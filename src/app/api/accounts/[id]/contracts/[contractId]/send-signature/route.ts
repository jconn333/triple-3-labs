import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSigningToken } from "@/lib/esign/tokens";
import { clientHasSigned } from "@/lib/esign/sign";
import { emailConfigured, sendSigningLinkEmail } from "@/lib/esign/email";

const sendSchema = z.object({
  signer_name: z.string().min(2).max(120),
  signer_email: z.string().email(),
  expires_in_days: z.number().int().min(1).max(90).default(14),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id: accountId, contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = sendSchema.parse(await request.json());
    const admin = createAdminClient();

    const { data: contract, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .eq("account_id", accountId)
      .single();
    if (contractErr || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    // A JMC counter-signature does NOT block sending — that's the sign-first flow.
    // Only a client signature already on file does.
    if (await clientHasSigned(contractId)) {
      return NextResponse.json(
        { error: "The client has already signed this contract" },
        { status: 409 }
      );
    }
    if (contract.mime_type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF contracts can be sent for signature. Please upload a PDF version." },
        { status: 400 }
      );
    }

    // One active request per contract: cancel any pending/viewed ones
    const { data: stale } = await admin
      .from("signature_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("contract_id", contractId)
      .in("status", ["pending", "viewed"])
      .select("id");
    if (stale?.length) {
      await admin.from("contract_audit_events").insert(
        stale.map((s) => ({
          signature_request_id: s.id,
          contract_id: contractId,
          event_type: "cancelled",
          metadata: { reason: "superseded_by_new_request" },
        }))
      );
    }

    const { token, tokenHash } = generateSigningToken();
    const expiresAt = new Date(
      Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: sigRequest, error: insertErr } = await admin
      .from("signature_requests")
      .insert({
        contract_id: contractId,
        account_id: accountId,
        token_hash: tokenHash,
        signer_name: body.signer_name,
        signer_email: body.signer_email,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (insertErr || !sigRequest) {
      console.error("signature_requests insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create signature request" }, { status: 500 });
    }

    // Prefer an explicit site URL so the emailed link is always the public origin,
    // regardless of proxy headers or which host the admin was opened on.
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
    const signingUrl = `${baseUrl}/sign/${token}`;

    await admin.from("contract_audit_events").insert({
      signature_request_id: sigRequest.id,
      contract_id: contractId,
      event_type: "request_created",
      metadata: {
        signer_name: body.signer_name,
        signer_email: body.signer_email,
        expires_at: expiresAt,
        sent_by: user.email,
      },
    });

    await admin
      .from("contracts")
      .update({
        status: "sent",
        esign_provider: "triple3",
        esign_document_id: sigRequest.id,
        esign_status: "pending",
        esign_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    let emailSent = false;
    if (emailConfigured()) {
      try {
        await sendSigningLinkEmail({
          signerName: body.signer_name,
          signerEmail: body.signer_email,
          contractTitle: contract.title,
          signingUrl,
          expiresAt,
        });
        emailSent = true;
        await admin.from("contract_audit_events").insert({
          signature_request_id: sigRequest.id,
          contract_id: contractId,
          event_type: "email_sent",
          metadata: { to: body.signer_email },
        });
      } catch (err) {
        console.error("Signing link email failed:", err);
      }
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("contact_id")
      .eq("id", accountId)
      .single();
    if (account) {
      await admin.from("activities").insert({
        account_id: accountId,
        contact_id: account.contact_id,
        type: "contract_sent",
        title: `Contract sent for signature: ${contract.title}`,
        description: `Signing link ${emailSent ? "emailed to" : "created for"} ${body.signer_name} <${body.signer_email}>${emailSent ? "" : " (email not sent — share the signing link manually)"}`,
        metadata: { signature_request_id: sigRequest.id, email_sent: emailSent },
      });
    }

    return NextResponse.json({
      signing_url: signingUrl,
      email_sent: emailSent,
      request: { ...sigRequest, token_hash: undefined },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.issues }, { status: 400 });
    }
    console.error("send-signature error:", error);
    return NextResponse.json({ error: "Failed to send for signature" }, { status: 500 });
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

  const admin = createAdminClient();
  const { data: cancelled } = await admin
    .from("signature_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("contract_id", contractId)
    .eq("account_id", accountId)
    .in("status", ["pending", "viewed"])
    .select("id");

  if (cancelled?.length) {
    await admin.from("contract_audit_events").insert(
      cancelled.map((c) => ({
        signature_request_id: c.id,
        contract_id: contractId,
        event_type: "cancelled",
        metadata: { cancelled_by: user.email },
      }))
    );
    await admin
      .from("contracts")
      .update({ status: "draft", esign_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", contractId);
  }

  return NextResponse.json({ cancelled: cancelled?.length ?? 0 });
}
