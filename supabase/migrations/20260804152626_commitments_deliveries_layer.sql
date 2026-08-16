create table if not exists public.commitments (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id),
  contract_id     uuid references public.contracts(id),
  customer_id     text not null,
  agent_id        text not null,
  name            text not null,
  kind            text not null check (kind in ('recurring','continuous','one_time')),
  cadence         text,
  next_due        date,
  grace_days      int  not null default 2,
  fulfilled_by    text,
  source          text,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.deliveries (
  id             uuid primary key default gen_random_uuid(),
  commitment_id  uuid not null references public.commitments(id),
  delivered_at   timestamptz not null default now(),
  period_start   date,
  period_end     date,
  output_url     text,
  summary        text,
  agent_event_ref text
);

create index if not exists deliveries_commitment_idx
  on public.deliveries (commitment_id, delivered_at desc);

alter table public.commitments enable row level security;
alter table public.deliveries enable row level security;

create or replace view public.vw_commitment_status
with (security_invoker = off) as
select c.*,
  d.delivered_at as last_delivered,
  d.output_url   as last_output,
  case
    when not c.active then 'inactive'
    when c.kind = 'continuous' then 'see_canaries'
    when c.next_due is null then 'unscheduled'
    when current_date >  c.next_due + c.grace_days then 'OVERDUE'
    when current_date >= c.next_due - 3 then 'DUE_SOON'
    else 'on_track'
  end as status
from public.commitments c
left join lateral (
  select * from public.deliveries
  where commitment_id = c.id
  order by delivered_at desc limit 1
) d on true;;
