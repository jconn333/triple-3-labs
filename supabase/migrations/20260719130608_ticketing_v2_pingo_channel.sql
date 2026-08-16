-- v2: Pingo as a ticket source + worker cursor state
alter table public.tickets drop constraint tickets_channel_check;
alter table public.tickets add constraint tickets_channel_check check (channel in ('portal','email','internal','canary','pingo'));
alter table public.tickets add column source_meta jsonb;
comment on column public.tickets.source_meta is 'Origin metadata, e.g. {"pingo_channel_id":..., "pingo_message_id":...} for tickets filed from Pingo.';

create table public.worker_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
comment on table public.worker_state is 'Cursor/state storage for the triage worker (e.g. pingo message cursors). Service-role access only.';
alter table public.worker_state enable row level security;
create policy "authenticated_read_worker_state" on public.worker_state for select to authenticated using (true);;
