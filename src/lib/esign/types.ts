export type SignatureRequestStatus =
  | "pending"
  | "viewed"
  | "signed"
  | "cancelled"
  | "expired";

/** "provider" = JMC counter-signature (in-app, no link); "client" = emailed signing link. */
export type SignerRole = "provider" | "client";

export interface SignatureRequest {
  id: string;
  contract_id: string;
  account_id: string;
  /** Null for provider signatures — they are made in-app, with no signing link. */
  token_hash: string | null;
  signer_role: SignerRole;
  signer_name: string;
  signer_email: string;
  signer_title: string | null;
  status: SignatureRequestStatus;
  expires_at: string;
  sent_at: string;
  viewed_at: string | null;
  signed_at: string | null;
  original_file_hash: string | null;
  signed_file_hash: string | null;
  signed_file_path: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  consent_given: boolean;
  created_at: string;
  updated_at: string;
}

export type AuditEventType =
  | "request_created"
  | "email_sent"
  | "link_viewed"
  | "consent_given"
  | "signed"
  | "copies_emailed"
  | "cancelled"
  | "expired";

/** What the public signing page sees — no ids, hashes, or internals. */
export interface PublicSigningView {
  status: SignatureRequestStatus | "not_found";
  contract_title?: string;
  signer_name?: string;
  signer_email?: string;
  expires_at?: string;
  signed_at?: string | null;
  /** Short-lived URL to view the PDF being signed. */
  document_url?: string;
}

/** Provider identity stamped on JMC's counter-signature certificate. */
export const PROVIDER_ORG = "JMC Companies LLC";

export const CONSENT_TEXT =
  "I agree to conduct this transaction electronically and to be legally bound by my " +
  "electronic signature, which I intend to serve as my signature on this document, " +
  "pursuant to the U.S. ESIGN Act and applicable state law (UETA).";
