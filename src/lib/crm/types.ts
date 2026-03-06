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
export type ContractStatus = "draft" | "sent" | "signed" | "expired" | "cancelled";

export interface Account {
  id: string;
  contact_id: string;
  name: string;
  status: AccountStatus;
  stripe_customer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  contracts?: Contract[];
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
  projectType: "ai-agent" | "automation" | "consulting" | "other";
  message: string;
  budget?: "under-5k" | "5k-15k" | "15k-50k" | "50k-plus";
}

export interface LeadScore {
  score: number;
  label: "hot" | "warm" | "cold";
  reasoning: string;
}
