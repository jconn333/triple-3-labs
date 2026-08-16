create table if not exists public.api_delivery_tokens (
  token_hash  text primary key,          -- sha256 hex of the bearer token
  customer_id text not null,
  label       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.api_delivery_tokens enable row level security;

create or replace function public.advance_commitment_on_delivery()
returns trigger language plpgsql security definer as $$
begin
  update public.commitments c
     set next_due = (greatest(c.next_due, new.delivered_at::date) + interval '1 month')::date
   where c.id = new.commitment_id
     and c.kind = 'recurring'
     and c.cadence = 'monthly';
  return new;
end $$;

drop trigger if exists trg_advance_commitment on public.deliveries;
create trigger trg_advance_commitment
  after insert on public.deliveries
  for each row execute function public.advance_commitment_on_delivery();;
