import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "./tokens";
import { stampSignatureCertificate } from "./pdf";
import type { ContractStatus } from "@/lib/crm/types";
import type { SignerRole } from "./types";

export interface ApplySignatureParams {
  contractId: string;
  accountId: string;
  /** Current document path — each signature stamps onto the latest version. */
  filePath: string;
  fileName: string;
  contractTitle: string;
  /** Signature request id — also the certificate id printed on the page. */
  certificateId: string;
  signerName: string;
  signerEmail: string;
  signerTitle?: string | null;
  signerOrg?: string | null;
  signatureDataUrl?: string | null;
  ip: string;
  userAgent: string;
}

export interface ApplySignatureResult {
  originalHash: string;
  signedHash: string;
  signedPath: string;
  signedBytes: Uint8Array;
  signedFileName: string;
  signedAtIso: string;
}

/**
 * Downloads the contract's current PDF, appends a signature certificate page for
 * this signer, stores it, and returns the hashes. Each signature chains onto the
 * previous version, so a fully executed document carries one certificate per party.
 */
export async function applySignatureToDocument(
  params: ApplySignatureParams
): Promise<ApplySignatureResult> {
  const admin = createAdminClient();
  const signedAtIso = new Date().toISOString();

  const { data: blob, error: dlErr } = await admin.storage
    .from("contracts")
    .download(params.filePath);
  if (dlErr || !blob) {
    console.error("Contract download failed:", dlErr);
    throw new Error("Could not load the document");
  }

  const originalBytes = new Uint8Array(await blob.arrayBuffer());
  const originalHash = sha256Hex(originalBytes);

  const signedBytes = await stampSignatureCertificate(originalBytes, {
    certificateId: params.certificateId,
    contractTitle: params.contractTitle,
    signerName: params.signerName,
    signerEmail: params.signerEmail,
    signerTitle: params.signerTitle,
    signerOrg: params.signerOrg,
    signedAtIso,
    signerIp: params.ip,
    signerUserAgent: params.userAgent,
    originalFileHash: originalHash,
    signatureDataUrl: params.signatureDataUrl,
  });
  const signedHash = sha256Hex(signedBytes);

  const signedPath = `${params.accountId}/${params.contractId}-signed-${params.certificateId.slice(0, 8)}.pdf`;
  const { error: upErr } = await admin.storage
    .from("contracts")
    .upload(signedPath, signedBytes, { contentType: "application/pdf", upsert: true });
  if (upErr) {
    console.error("Signed PDF upload failed:", upErr);
    throw new Error("Could not store the signed document");
  }

  const base = params.fileName.replace(/\s*\((signed|partially signed)\)/i, "").replace(/\.pdf$/i, "");
  const signedFileName = `${base} (signed).pdf`;

  return { originalHash, signedHash, signedPath, signedBytes, signedFileName, signedAtIso };
}

/**
 * A contract is fully executed only once BOTH parties have signed. With one
 * signature it is partially signed, regardless of which party went first.
 */
export async function computeContractStatus(contractId: string): Promise<{
  status: ContractStatus;
  signedRoles: SignerRole[];
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("signature_requests")
    .select("signer_role")
    .eq("contract_id", contractId)
    .eq("status", "signed");

  const signedRoles = [...new Set((data ?? []).map((r) => r.signer_role as SignerRole))];
  const bothSigned = signedRoles.includes("provider") && signedRoles.includes("client");
  return {
    status: bothSigned ? "signed" : signedRoles.length > 0 ? "partially_signed" : "sent",
    signedRoles,
  };
}

/** True when the client has already signed — blocks re-sending a signing link. */
export async function clientHasSigned(contractId: string): Promise<boolean> {
  const { signedRoles } = await computeContractStatus(contractId);
  return signedRoles.includes("client");
}
