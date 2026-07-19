export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  project_type: string | null;
  budget_range: string | null;
  message: string | null;
  lead_score: number | null;
  lead_score_label: string | null;
  lead_score_reasoning: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  stage_id: string;
  contact_id: string | null;
  amount: number | null;
  description: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: Contact;
  stage?: PipelineStage;
}

export interface PipelineStage {
  id: string;
  name: string;
  display_order: number;
  is_closed: boolean;
  color: string;
  created_at: string;
}

export interface Activity {
  id: string;
  contact_id: string;
  deal_id: string | null;
  type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type AccountStatus = "active" | "paused" | "churned";
export type ContractStatus =
  | "draft"
  | "sent"
  | "partially_signed"
  | "signed"
  | "expired"
  | "cancelled";

export interface Account {
  id: string;
  contact_id: string;
  name: string;
  status: AccountStatus;
  stripe_customer_id: string | null;
  notes: string | null;
  setup_fee_paid_at?: string | null;
  setup_fee_payment_intent?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  contracts?: Contract[];
}

/** Slim signature view joined onto a contract for the admin UI. */
export interface ContractSignature {
  signer_role: "provider" | "client";
  status: string;
  signer_name: string;
  signed_at: string | null;
}

export interface Contract {
  id: string;
  account_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: ContractStatus;
  esign_provider: string | null;
  esign_document_id: string | null;
  esign_status: string | null;
  esign_sent_at: string | null;
  esign_signed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from signature_requests — who has signed so far. */
  signatures?: ContractSignature[];
}

export interface SubscriptionSummary {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  items: {
    product_name: string;
    price_amount: number;
    price_currency: string;
    price_interval: string;
    quantity: number;
  }[];
  default_payment_method: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
}

export interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  amount_due: number;
  currency: string;
  created: string;
  hosted_invoice_url: string | null;
}

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}

export interface LeadScore {
  score: number;
  label: "hot" | "warm" | "cold";
  reasoning: string;
}

// ---- Ticketing system ----

export type TicketChannel = "portal" | "email" | "internal" | "canary";
export type TicketStatus =
  | "new"
  | "triaging"
  | "awaiting_customer"
  | "pending_approval"
  | "fixing"
  | "verifying"
  | "resolved"
  | "escalated"
  | "closed";
export type TicketSeverity = "low" | "normal" | "high" | "urgent";
export type TicketMessageAuthorType = "customer" | "ai" | "staff" | "system";
export type DiagnosisConfidence = "low" | "medium" | "high";
export type RunbookActionType = "none" | "ssh_allowlisted" | "telemetry_check" | string;
export type TicketActionStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "executing"
  | "executed"
  | "verified"
  | "failed"
  | "rolled_back";

export interface Ticket {
  id: string;
  ticket_number: number;
  account_id: string | null;
  contact_id: string | null;
  submitter_email: string | null;
  subject: string;
  description: string;
  channel: TicketChannel;
  agent_id: string | null;
  status: TicketStatus;
  severity: TicketSeverity;
  tier: number | null;
  reopened_count: number;
  escalation_reason: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  account?: Pick<Account, "id" | "name"> | null;
  contact?: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null;
  message_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_type: TicketMessageAuthorType;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketDiagnosis {
  id: string;
  ticket_id: string;
  category: string;
  summary: string;
  evidence: unknown;
  telemetry: unknown;
  matched_runbook_key: string | null;
  proposed_tier: number;
  confidence: DiagnosisConfidence | null;
  could_reproduce: boolean | null;
  model: string | null;
  raw: unknown;
  created_at: string;
}

export interface Runbook {
  key: string;
  title: string;
  description: string | null;
  tier: number;
  action_type: RunbookActionType;
  action_params_schema: unknown;
  verify_spec: unknown;
  rollback_spec: unknown;
  enabled: boolean;
  times_executed: number;
  times_approved: number;
  times_rolled_back: number;
  auto_approve_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface TicketAction {
  id: string;
  ticket_id: string;
  runbook_key: string;
  tier: number;
  action_params: unknown;
  status: TicketActionStatus;
  approval_token: string | null;
  approved_by: string | null;
  decided_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  result: unknown;
  error: string | null;
  created_at: string;
  // Joined fields
  runbook?: Pick<Runbook, "key" | "title" | "description" | "tier"> | null;
}

export interface TicketFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  description: string;
  severity: TicketSeverity;
  agent_id?: string;
}
