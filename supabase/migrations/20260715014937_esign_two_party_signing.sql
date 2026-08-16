-- Two-party signing: provider (JMC) counter-signature + client signature.
alter table public.signature_requests
  add column if not exists signer_role text not null default 'client'
    check (signer_role in ('provider','client')),
  add column if not exists signer_title text;

-- Provider signatures are made in-app by an authenticated admin — there is no
-- emailed signing link, so no token exists to hash.
alter table public.signature_requests alter column token_hash drop not null;

-- One signature per role per contract (allows re-request only after cancel/expire
-- is handled in app logic; this guards against duplicate signed rows).
create unique index if not exists uniq_signed_role_per_contract
  on public.signature_requests (contract_id, signer_role)
  where status = 'signed';

create index if not exists idx_signature_requests_role on public.signature_requests(signer_role);

-- contracts.status is free text (no check constraint); 'partially_signed' is now
-- a valid value meaning one party has signed and the other has not.;
