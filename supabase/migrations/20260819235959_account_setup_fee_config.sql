-- Per-account setup-fee (implementation fee) configuration.
--
-- Replaces the hardcoded $1,500 constant that used to be emailed to every
-- fully-executed client. The auto-charge is now gated on a real fee being
-- configured here: NULL or 0 = this account has NO setup fee (e.g. deals sold
-- monthly-only, like Mast-Lepley). A positive value is the ACH/base amount in
-- cents; the card option adds a 3% processing surcharge derived at link time.
alter table public.accounts
  add column if not exists setup_fee_cents integer;

alter table public.accounts
  drop constraint if exists accounts_setup_fee_cents_nonneg;
alter table public.accounts
  add constraint accounts_setup_fee_cents_nonneg
  check (setup_fee_cents is null or setup_fee_cents >= 0);

comment on column public.accounts.setup_fee_cents is
  'Implementation-fee base (ACH) amount in cents. NULL or 0 = no setup fee; the e-sign handler only auto-emails a payment link when this is > 0 and setup_fee_paid_at is null. Card option = +3% surcharge, derived at link creation.';
