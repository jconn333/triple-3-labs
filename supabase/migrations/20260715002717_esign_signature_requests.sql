-- E-signature: signature requests + tamper-evident audit trail
create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  -- SHA-256 hex of the raw signing token; raw token exists only in the emailed link
  token_hash text not null unique,
  signer_name text not null,
  signer_email text not null,
  status text not null default 'pending'
    check (status in ('pending','viewed','signed','cancelled','expired')),
  expires_at timestamptz not null,
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  signed_at timestamptz,
  -- SHA-256 hex hashes for tamper evidence
  original_file_hash text,
  signed_file_hash text,
  signed_file_path text,
  signer_ip text,
  signer_user_agent text,
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_signature_requests_contract on public.signature_requests(contract_id);
create index if not exists idx_signature_requests_status on public.signature_requests(status);

create table if not exists public.contract_audit_events (
  id uuid primary key default gen_random_uuid(),
  signature_request_id uuid references public.signature_requests(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete cascade,
  event_type text not null
    check (event_type in ('request_created','email_sent','link_viewed','consent_given','signed','copies_emailed','cancelled','expired')),
  metadata jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contract_audit_events_contract on public.contract_audit_events(contract_id);

alter table public.signature_requests enable row level security;
alter table public.contract_audit_events enable row level security;

-- Admin (logged-in) users manage signature requests; public signing flows go
-- through server routes using the service role, which bypasses RLS.
create policy "authenticated_manage_signature_requests"
  on public.signature_requests for all
  to authenticated using (true) with check (true);

create policy "authenticated_read_audit_events"
  on public.contract_audit_events for select
  to authenticated using (true);

-- Audit events are append-only even for admins (inserts via service role only);
-- no update/delete policies on purpose.;
