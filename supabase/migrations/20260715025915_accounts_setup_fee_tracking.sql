-- Setup-fee (implementation fee) payment tracking, marked by the Stripe webhook.
alter table public.accounts
  add column if not exists setup_fee_paid_at timestamptz,
  add column if not exists setup_fee_payment_intent text;;
