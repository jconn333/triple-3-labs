-- Required before deploying the webhook replay guard. Do not apply as part of this task.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
grant select, insert, delete on public.stripe_events to service_role;
