-- Triple 3 Labs ticketing system v1
-- NOTE: already applied to live project cksdehpjxvkrvubmjjcl via Supabase MCP on 2026-07-19
-- (migration name: ticketing_system_v1). This file starts the in-repo versioning convention.
-- Tickets + AI triage pipeline: tiered autonomy (0=answer, 1=auto-fix, 2=approve-gated, 3=human)

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  account_id uuid references public.accounts(id),
  contact_id uuid references public.contacts(id),
  submitter_email text,
  subject text not null,
  description text not null,
  channel text not null default 'portal' check (channel in ('portal','email','internal','canary')),
  agent_id text,
  status text not null default 'new' check (status in ('new','triaging','awaiting_customer','pending_approval','fixing','verifying','resolved','escalated','closed')),
  severity text not null default 'normal' check (severity in ('low','normal','high','urgent')),
  tier smallint check (tier between 0 and 3),
  reopened_count integer not null default 0,
  escalation_reason text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tickets is 'Customer support tickets. Triage worker polls status=new; reopened tickets always escalate (never auto-fixed twice).';
create index tickets_status_idx on public.tickets (status);
create index tickets_account_idx on public.tickets (account_id);
create trigger tickets_updated_at before update on public.tickets for each row execute function set_updated_at();

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_type text not null check (author_type in ('customer','ai','staff','system')),
  author_name text,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.ticket_messages is 'Conversation thread per ticket. is_internal=true rows are never shown to customers.';
create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create table public.ticket_diagnoses (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  category text not null,
  summary text not null,
  evidence jsonb,
  telemetry jsonb,
  matched_runbook_key text,
  proposed_tier smallint not null check (proposed_tier between 0 and 3),
  confidence text check (confidence in ('low','medium','high')),
  could_reproduce boolean,
  model text,
  raw jsonb,
  created_at timestamptz not null default now()
);
comment on table public.ticket_diagnoses is 'Structured output of the read-only triage agent. The fix path acts ONLY on this structure, never on raw ticket text (injection defense).';
create index ticket_diagnoses_ticket_idx on public.ticket_diagnoses (ticket_id);

create table public.runbooks (
  key text primary key,
  title text not null,
  description text,
  tier smallint not null check (tier between 0 and 3),
  action_type text not null default 'none',
  action_params_schema jsonb,
  verify_spec jsonb,
  rollback_spec jsonb,
  enabled boolean not null default true,
  times_executed integer not null default 0,
  times_approved integer not null default 0,
  times_rolled_back integer not null default 0,
  auto_approve_threshold integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.runbooks is 'Allowlisted fix playbooks. Concrete commands live in worker code keyed by runbook key — the DB row only declares tier/metadata, so DB writes cannot inject commands. Tier 2 runbooks graduate to Tier 1 after auto_approve_threshold approvals with zero rollbacks.';
create trigger runbooks_updated_at before update on public.runbooks for each row execute function set_updated_at();

create table public.ticket_actions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  runbook_key text not null references public.runbooks(key),
  tier smallint not null check (tier between 0 and 3),
  action_params jsonb,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','executing','executed','verified','failed','rolled_back')),
  approval_token uuid default gen_random_uuid(),
  approved_by text,
  decided_at timestamptz,
  executed_at timestamptz,
  verified_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);
comment on table public.ticket_actions is 'Audit log of every automated/proposed fix. Tier 2 rows wait in proposed until approve/reject via tokenized link.';
create index ticket_actions_status_idx on public.ticket_actions (status);
create index ticket_actions_ticket_idx on public.ticket_actions (ticket_id);

create table public.account_fix_budgets (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  max_auto_fixes_per_day integer not null default 3,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.account_fix_budgets is 'Per-customer daily cap on automated fixes; when exhausted, tickets escalate to human.';

create view public.vw_open_tickets as
  select t.*, a.name as account_name,
    (select count(*) from public.ticket_messages m where m.ticket_id = t.id) as message_count
  from public.tickets t
  left join public.accounts a on a.id = t.account_id
  where t.status not in ('resolved','closed');

create view public.vw_ticket_weekly_digest as
  select t.ticket_number, t.subject, t.status, t.tier, t.severity, t.channel,
    a.name as account_name, t.created_at, t.resolved_at, t.reopened_count,
    d.category as diagnosis_category, d.matched_runbook_key,
    (select count(*) from public.ticket_actions ta where ta.ticket_id = t.id and ta.status = 'rolled_back') as rollbacks
  from public.tickets t
  left join public.accounts a on a.id = t.account_id
  left join lateral (select * from public.ticket_diagnoses d where d.ticket_id = t.id order by d.created_at desc limit 1) d on true
  where t.created_at > now() - interval '7 days'
  order by t.created_at desc;

-- RLS: staff (authenticated) full access; anon may only submit portal tickets (mirrors contact-form pattern); workers use service role.
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_diagnoses enable row level security;
alter table public.runbooks enable row level security;
alter table public.ticket_actions enable row level security;
alter table public.account_fix_budgets enable row level security;

create policy "authenticated_manage_tickets" on public.tickets for all to authenticated using (true) with check (true);
create policy "anon_submit_portal_tickets" on public.tickets for insert to anon with check (channel = 'portal' and status = 'new');
create policy "authenticated_manage_ticket_messages" on public.ticket_messages for all to authenticated using (true) with check (true);
create policy "authenticated_manage_ticket_diagnoses" on public.ticket_diagnoses for all to authenticated using (true) with check (true);
create policy "authenticated_manage_runbooks" on public.runbooks for all to authenticated using (true) with check (true);
create policy "authenticated_manage_ticket_actions" on public.ticket_actions for all to authenticated using (true) with check (true);
create policy "authenticated_manage_fix_budgets" on public.account_fix_budgets for all to authenticated using (true) with check (true);

-- Seed runbook library (commands themselves live in worker code, keyed by these keys)
insert into public.runbooks (key, title, description, tier, action_type) values
  ('diagnosis_only', 'Answer only — no fix needed', 'Expectation mismatch, working-as-intended, credential/re-auth guidance, or how-to. Triage agent replies with evidence; no system change.', 0, 'none'),
  ('restart_agent_service', 'Restart customer agent service', 'Agent process hung or heartbeat stale but host reachable. Restart the systemd/tmux service for the agent. Reversible.', 2, 'ssh_allowlisted'),
  ('rerun_sync_job', 'Re-run a failed sync/task job', 'A scheduled job failed transiently (network/API blip). Re-run the exact job script from the code allowlist.', 2, 'ssh_allowlisted'),
  ('recheck_canary', 'Re-run canary check and confirm recovery', 'Telemetry says the issue self-resolved; re-verify the relevant canary and report proof to the customer.', 1, 'telemetry_check'),
  ('escalate_human', 'Escalate to Jeff', 'Could not reproduce, no matching runbook, reopened ticket, angry/legal framing, billing, or credentials involved.', 3, 'none');
