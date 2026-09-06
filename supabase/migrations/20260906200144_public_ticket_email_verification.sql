-- Public submissions remain unlinked and out of triage until email verification.
alter table public.tickets
  add column verified boolean not null default false,
  add column email_verification_token uuid not null default gen_random_uuid();

comment on column public.tickets.verified is 'Email ownership verified through the acknowledgment link; never inferred from a submitted email address.';
comment on column public.tickets.email_verification_token is 'Email-only verification credential, separate from legacy view tokens exposed by POST.';
