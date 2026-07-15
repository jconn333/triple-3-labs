import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applySignatureToDocument, computeContractStatus } from "@/lib/esign/sign";
import { emailConfigured, sendSignedCopiesEmail } from "@/lib/esign/email";
import { createSetupFeeLinks } from "@/lib/billing/setup-fee";
import { PROVIDER_ORG } from "@/lib/esign/types";

const counterSignSchema = z.object({
  consent: z.literal(true),
  typed_name: z.string().min(2).max(120),
  signer_title: z.string().max(120).optional().nullable(),
  signature_data_url: z
    .string()
    .startsWith("data:image/png;base64,")
    .max(400_000)
    .optional()
    .nullable(),
});

function clientMeta(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const { id: accountId, contractId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = counterSignSchema.parse(await request.json());
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
    if (contract.mime_type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF contracts can be signed. Please upload a PDF version." },
        { status: 400 }
      );
    }

    const { signedRoles } = await computeContractStatus(contractId);
    if (signedRoles.includes("provider")) {
      return NextResponse.json(
        { error: "This contract has already been counter-signed by JMC." },
        { status: 409 }
      );
    }

    const { ip, userAgent } = clientMeta(request);

    // Record the signature request first so its id becomes the certificate id.
    const { data: sigRequest, error: insertErr } = await admin
      .from("signature_requests")
      .insert({
        contract_id: contractId,
        account_id: accountId,
        token_hash: null, // in-app signature — no signing link exists
        signer_role: "provider",
        signer_name: body.typed_name,
        signer_email: user.email ?? "",
        signer_title: body.signer_title ?? null,
        status: "pending",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      })
      .select()
      .single();
    if (insertErr || !sigRequest) {
      console.error("provider signature_requests insert error:", insertErr);
      return NextResponse.json({ error: "Failed to record signature" }, { status: 500 });
    }

    const result = await applySignatureToDocument({
      contractId,
      accountId,
      filePath: contract.file_path,
      fileName: contract.file_name,
      contractTitle: contract.title,
      certificateId: sigRequest.id,
      signerName: body.typed_name,
      signerEmail: user.email ?? "",
      signerTitle: body.signer_title ?? null,
      signerOrg: PROVIDER_ORG,
      signatureDataUrl: body.signature_data_url,
      ip,
      userAgent,
    });

    await admin
      .from("signature_requests")
      .update({
        status: "signed",
        signed_at: result.signedAtIso,
        consent_given: true,
        signer_ip: ip,
        signer_user_agent: userAgent,
        original_file_hash: result.originalHash,
        signed_file_hash: result.signedHash,
        signed_file_path: result.signedPath,
        updated_at: result.signedAtIso,
      })
      .eq("id", sigRequest.id);

    const { status: newStatus, signedRoles: rolesAfter } = await computeContractStatus(contractId);
    const fullyExecuted = newStatus === "signed";

    await admin
      .from("contracts")
      .update({
        status: newStatus,
        esign_provider: "triple3",
        esign_status: fullyExecuted ? "signed" : "partially_signed",
        esign_signed_at: fullyExecuted ? result.signedAtIso : null,
        file_path: result.signedPath,
        file_name: result.signedFileName,
        updated_at: result.signedAtIso,
      })
      .eq("id", contractId);

    await admin.from("contract_audit_events").insert([
      {
        signature_request_id: sigRequest.id,
        contract_id: contractId,
        event_type: "consent_given",
        ip,
        user_agent: userAgent,
        metadata: { signer_role: "provider", typed_name: body.typed_name, admin_user: user.email },
      },
      {
        signature_request_id: sigRequest.id,
        contract_id: contractId,
        event_type: "signed",
        ip,
        user_agent: userAgent,
        metadata: {
          signer_role: "provider",
          typed_name: body.typed_name,
          signer_title: body.signer_title ?? null,
          drew_signature: Boolean(body.signature_data_url),
          original_file_hash: result.originalHash,
          signed_file_hash: result.signedHash,
          signed_file_path: result.signedPath,
          fully_executed: fullyExecuted,
        },
      },
    ]);

    const { data: account } = await supabase
      .from("accounts")
      .select("contact_id, name, setup_fee_paid_at")
      .eq("id", accountId)
      .single();
    if (account) {
      await admin.from("activities").insert({
        account_id: accountId,
        contact_id: account.contact_id,
        type: fullyExecuted ? "contract_signed" : "contract_counter_signed",
        title: fullyExecuted
          ? `Contract fully executed: ${contract.title}`
          : `Counter-signed by JMC: ${contract.title}`,
        description: `${body.typed_name}${body.signer_title ? ", " + body.signer_title : ""} signed on behalf of ${PROVIDER_ORG}.`,
        metadata: { signature_request_id: sigRequest.id, signed_file_hash: result.signedHash },
      });
    }

    // If the client signed first, JMC's counter-signature executes the contract —
    // send the client the fully executed copy.
    if (fullyExecuted && emailConfigured()) {
      const { data: clientSig } = await admin
        .from("signature_requests")
        .select("signer_name, signer_email")
        .eq("contract_id", contractId)
        .eq("signer_role", "client")
        .eq("status", "signed")
        .single();
      if (clientSig) {
        const signedBytes = result.signedBytes;
        const contractTitle = contract.title;
        const wantsPayment = Boolean(account && !account.setup_fee_paid_at);
        const accountName = account?.name ?? "";
        after(async () => {
          try {
            let payment;
            if (wantsPayment) {
              try {
                payment = await createSetupFeeLinks({
                  accountId,
                  contractId,
                  accountName,
                });
              } catch (err) {
                console.error("Setup-fee link creation failed (email sent without):", err);
              }
            }
            await sendSignedCopiesEmail({
              signerName: clientSig.signer_name,
              signerEmail: clientSig.signer_email,
              contractTitle,
              signedAtIso: result.signedAtIso,
              signedFileHash: result.signedHash,
              pdfBase64: Buffer.from(signedBytes).toString("base64"),
              fileName: result.signedFileName,
              payment,
            });
            const bg = createAdminClient();
            await bg.from("contract_audit_events").insert({
              signature_request_id: sigRequest.id,
              contract_id: contractId,
              event_type: "copies_emailed",
              metadata: { to: clientSig.signer_email, reason: "fully_executed_after_counter_sign" },
            });
            if (account) {
              await bg.from("activities").insert({
                account_id: accountId,
                contact_id: account.contact_id,
                type: "email_sent",
                title: `Executed contract emailed to ${clientSig.signer_email}`,
                description: wantsPayment
                  ? "Signed copy attached, with implementation-fee payment links."
                  : "Signed copy attached.",
                metadata: { contract_id: contractId, payment_links_included: wantsPayment },
              });
            }
          } catch (err) {
            console.error("Executed-copy email failed:", err);
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      fully_executed: fullyExecuted,
      signed_roles: rolesAfter,
      signed_at: result.signedAtIso,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission", details: error.issues }, { status: 400 });
    }
    console.error("Counter-sign error:", error);
    const message = error instanceof Error ? error.message : "Counter-signing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
