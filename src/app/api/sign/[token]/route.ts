import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/esign/tokens";
import { applySignatureToDocument, computeContractStatus } from "@/lib/esign/sign";
import { emailConfigured, sendSignedCopiesEmail } from "@/lib/esign/email";
import type { PublicSigningView } from "@/lib/esign/types";

function clientMeta(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

async function loadRequest(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("signature_requests")
    .select("*, contract:contracts(id, title, file_path, file_name, account_id)")
    .eq("token_hash", hashToken(token))
    .single();
  return { admin, sigRequest: data };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { admin, sigRequest } = await loadRequest(token);

  if (!sigRequest || !sigRequest.contract) {
    return NextResponse.json({ status: "not_found" } satisfies PublicSigningView, { status: 404 });
  }

  // Expiry check
  if (
    ["pending", "viewed"].includes(sigRequest.status) &&
    new Date(sigRequest.expires_at) < new Date()
  ) {
    await admin
      .from("signature_requests")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", sigRequest.id);
    await admin.from("contract_audit_events").insert({
      signature_request_id: sigRequest.id,
      contract_id: sigRequest.contract_id,
      event_type: "expired",
    });
    sigRequest.status = "expired";
  }

  const view: PublicSigningView = {
    status: sigRequest.status,
    contract_title: sigRequest.contract.title,
    signer_name: sigRequest.signer_name,
    signer_email: sigRequest.signer_email,
    expires_at: sigRequest.expires_at,
    signed_at: sigRequest.signed_at,
  };

  if (["pending", "viewed"].includes(sigRequest.status)) {
    const { ip, userAgent } = clientMeta(request);
    if (sigRequest.status === "pending") {
      await admin
        .from("signature_requests")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sigRequest.id);
      view.status = "viewed";
    }
    await admin.from("contract_audit_events").insert({
      signature_request_id: sigRequest.id,
      contract_id: sigRequest.contract_id,
      event_type: "link_viewed",
      ip,
      user_agent: userAgent,
    });

    const { data: signedUrl } = await admin.storage
      .from("contracts")
      .createSignedUrl(sigRequest.contract.file_path, 600);
    view.document_url = signedUrl?.signedUrl;
  }

  return NextResponse.json(view);
}

const signSchema = z.object({
  consent: z.literal(true),
  typed_name: z.string().min(2).max(120),
  signature_data_url: z
    .string()
    .startsWith("data:image/png;base64,")
    .max(400_000)
    .optional()
    .nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const body = signSchema.parse(await request.json());
    const { admin, sigRequest } = await loadRequest(token);

    if (!sigRequest || !sigRequest.contract) {
      return NextResponse.json({ error: "Signing link not found" }, { status: 404 });
    }
    if (!["pending", "viewed"].includes(sigRequest.status)) {
      return NextResponse.json(
        { error: `This document can no longer be signed (status: ${sigRequest.status})` },
        { status: 409 }
      );
    }
    if (new Date(sigRequest.expires_at) < new Date()) {
      return NextResponse.json({ error: "This signing link has expired" }, { status: 410 });
    }

    const { ip, userAgent } = clientMeta(request);

    // 1-3. Hash the current document, stamp this signer's certificate, store it.
    const result = await applySignatureToDocument({
      contractId: sigRequest.contract_id,
      accountId: sigRequest.account_id,
      filePath: sigRequest.contract.file_path,
      fileName: sigRequest.contract.file_name,
      contractTitle: sigRequest.contract.title,
      certificateId: sigRequest.id,
      signerName: body.typed_name,
      signerEmail: sigRequest.signer_email,
      signatureDataUrl: body.signature_data_url,
      ip,
      userAgent,
    });
    const { originalHash, signedHash, signedPath, signedBytes, signedFileName, signedAtIso } = result;

    // 4. Record everything
    await admin
      .from("signature_requests")
      .update({
        status: "signed",
        signed_at: signedAtIso,
        consent_given: true,
        signer_ip: ip,
        signer_user_agent: userAgent,
        original_file_hash: originalHash,
        signed_file_hash: signedHash,
        signed_file_path: signedPath,
        updated_at: signedAtIso,
      })
      .eq("id", sigRequest.id);

    // Fully executed only once BOTH parties have signed.
    const { status: newStatus } = await computeContractStatus(sigRequest.contract_id);
    const fullyExecuted = newStatus === "signed";

    await admin
      .from("contracts")
      .update({
        status: newStatus,
        esign_status: fullyExecuted ? "signed" : "partially_signed",
        esign_signed_at: fullyExecuted ? signedAtIso : null,
        file_path: signedPath,
        file_name: signedFileName,
        mime_type: "application/pdf",
        updated_at: signedAtIso,
      })
      .eq("id", sigRequest.contract_id);

    await admin.from("contract_audit_events").insert([
      {
        signature_request_id: sigRequest.id,
        contract_id: sigRequest.contract_id,
        event_type: "consent_given",
        ip,
        user_agent: userAgent,
        metadata: { typed_name: body.typed_name },
      },
      {
        signature_request_id: sigRequest.id,
        contract_id: sigRequest.contract_id,
        event_type: "signed",
        ip,
        user_agent: userAgent,
        metadata: {
          signer_role: "client",
          typed_name: body.typed_name,
          drew_signature: Boolean(body.signature_data_url),
          original_file_hash: originalHash,
          signed_file_hash: signedHash,
          signed_file_path: signedPath,
          original_file_path: sigRequest.contract.file_path,
          fully_executed: fullyExecuted,
        },
      },
    ]);

    const { data: account } = await admin
      .from("accounts")
      .select("contact_id")
      .eq("id", sigRequest.account_id)
      .single();
    if (account) {
      await admin.from("activities").insert({
        contact_id: account.contact_id,
        type: "contract_signed",
        title: fullyExecuted
          ? `Contract fully executed: ${sigRequest.contract.title}`
          : `Client signed (awaiting JMC counter-signature): ${sigRequest.contract.title}`,
        description: `Signed by ${body.typed_name} <${sigRequest.signer_email}>`,
        metadata: { signature_request_id: sigRequest.id, signed_file_hash: signedHash },
      });
    }

    // 5. Email copies to both parties (background)
    if (emailConfigured()) {
      const contractTitle = sigRequest.contract.title;
      after(async () => {
        try {
          await sendSignedCopiesEmail({
            signerName: body.typed_name,
            signerEmail: sigRequest.signer_email,
            contractTitle,
            signedAtIso,
            signedFileHash: signedHash,
            pdfBase64: Buffer.from(signedBytes).toString("base64"),
            fileName: signedFileName,
          });
          const bg = createAdminClient();
          await bg.from("contract_audit_events").insert({
            signature_request_id: sigRequest.id,
            contract_id: sigRequest.contract_id,
            event_type: "copies_emailed",
            metadata: { to: [sigRequest.signer_email, process.env.NOTIFICATION_EMAIL].filter(Boolean) },
          });
        } catch (err) {
          console.error("Signed-copies email failed:", err);
        }
      });
    }

    return NextResponse.json({ success: true, signed_at: signedAtIso });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission", details: error.issues }, { status: 400 });
    }
    console.error("Sign submission error:", error);
    return NextResponse.json({ error: "Signing failed. Please try again." }, { status: 500 });
  }
}
