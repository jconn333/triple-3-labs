-- v2: tokenized customer ticket view (no auth account needed, mirrors e-sign pattern)
alter table public.tickets add column view_token uuid not null default gen_random_uuid();
create index tickets_view_token_idx on public.tickets (view_token);
comment on column public.tickets.view_token is 'Token for the public /ticket/[id]?token= customer view. Emailed in the acknowledgment; grants read of non-internal thread + reply.';;
