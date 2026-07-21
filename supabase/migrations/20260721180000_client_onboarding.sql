-- Triple 3 Labs client onboarding — tokenized intake forms
-- Applied to cksdehpjxvkrvubmjjcl 2026-07-21. Continues the in-repo versioning
-- convention started by 20260719000000_ticketing_system_v1.sql.
-- Mirrors the signature_requests token pattern: the raw token exists only in
-- the emailed link, we store a SHA-256 of it (see src/lib/esign/tokens.ts),
-- and the public route reads via the service-role client.

create table public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  form_key text not null,
  token_hash text unique,
  recipient_name text,
  recipient_email text,
  status text not null default 'pending' check (status in ('pending','viewed','submitted','cancelled','expired')),
  access_grants jsonb,
  responses jsonb,
  expires_at timestamptz,
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  submitted_at timestamptz,
  submitter_ip text,
  submitter_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.onboarding_requests is 'Tokenized client-onboarding intake forms. One row per link sent; form rendered from src/lib/onboarding/forms.ts by form_key, never from stored copy.';
comment on column public.onboarding_requests.form_key is 'Key into ONBOARDING_FORMS, e.g. ''seo_agent''.';
comment on column public.onboarding_requests.token_hash is 'SHA-256 of the raw token emailed to the client. The raw token is never stored.';
comment on column public.onboarding_requests.access_grants is 'Array of {tool,address,role,url} rendered as the access-grant table on the form.';
comment on column public.onboarding_requests.responses is 'Flat { [fieldKey]: string|boolean }. Null until submitted.';
create index onboarding_requests_account_idx on public.onboarding_requests (account_id);
create index onboarding_requests_token_hash_idx on public.onboarding_requests (token_hash);
create trigger onboarding_requests_updated_at before update on public.onboarding_requests for each row execute function set_updated_at();

-- RLS: staff (authenticated) full access; the public /onboarding/[token] route
-- uses the service-role client, same as /sign/[token] — no anon policy needed.
alter table public.onboarding_requests enable row level security;
create policy "authenticated_manage_onboarding" on public.onboarding_requests for all to authenticated using (true) with check (true);
