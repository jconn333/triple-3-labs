# CRM migration drift — reconciliation input only

Snapshot: 2026-09-09 evening America/New_York (2026-09-10 UTC), Supabase project `cksdehpjxvkrvubmjjcl`. Rechecked migration history, `information_schema.columns`, `information_schema.role_table_grants`, `pg_constraint`, `pg_policies`, `pg_indexes`, RLS flags and `pg_get_viewdef` using SELECT/GET only.

**Nothing here was applied. This is documentation, not an executable migration plan.** DDL below reconstructs today's catalog, not the original migration SQL. Attribution to a historical migration is inferred from its name. Backfill/disarm DML cannot be reconstructed from column definitions. No client values or credentials are included.

## Production-only migrations from audit E3

| Version | Name | Likely contents / certainty |
|---|---|---|
| 20260819202955 | client_links_and_account_mrr | Creates client_links, indexes and RLS; adds nullable accounts.mrr numeric. Current structures verified; original policy/kind list may differ. |
| 20260819203032 | backfill_mrr_and_client_links | Likely UPDATE accounts.mrr and INSERT client_links from existing business records. No distinct DDL can be attributed from current schema. Exact historical rows/amounts unknown. |
| 20260819203657 | authenticated_read_reports_and_views | Authenticated SELECT policies/grants on prospect_reports and report_views, and possibly client_links. Corresponding current policies verified below. |
| 20260819233546 | disarm_mastlepley_setup_fee_autocharge | Likely account-specific setup-fee configuration/data update; could have introduced accounts.setup_fee_cents/check. Current column/check verified; original DDL, row values and any external Stripe action cannot be inferred. |
| 20260828221926 | add_deal_setup_fee_and_term_fields | Nullable deal.setup_fee_cents integer, deal.mrr_month7 numeric, deal.term_months integer. Account maturity/term columns also exist; exact migration that added those needs original SQL. |
| 20260828222016 | create_revenue_rollup_views | Creates vw_revenue_lines and vw_revenue_rollup. Current full definitions and security_invoker=on verified below. |
| 20260828222626 | grant_revenue_views_to_authenticated | Grants authenticated SELECT on both revenue views; current grants verified. |
| 20260909112013 | create_leads_table | Creates leads with attribution/notification fields, account FK, status check, indexes and authenticated read/update policies. Current structure verified below. |

### 20260819202955 — client_links_and_account_mrr

```sql
alter table public.accounts add column mrr numeric;
```

Current client_links definition follows. Its dossier/code kinds are a later change, not necessarily part of this original migration. Both current authenticated policies are included; do not duplicate them blindly.

```sql
create table public.client_links (
  id uuid not null default gen_random_uuid(),
  account_id uuid,
  contact_id uuid,
  deal_id uuid,
  kind text not null default 'other'::text,
  title text not null,
  url text not null,
  prospect_report_id uuid,
  created_at timestamptz not null default now(),
  constraint client_links_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  constraint client_links_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  constraint client_links_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
  constraint client_links_kind_check CHECK ((kind = ANY (ARRAY['audit'::text, 'proposal'::text, 'report'::text, 'website'::text, 'ads_plan'::text, 'contract'::text, 'onboarding'::text, 'dossier'::text, 'code'::text, 'other'::text]))),
  constraint client_links_pkey PRIMARY KEY (id),
  constraint client_links_prospect_report_id_fkey FOREIGN KEY (prospect_report_id) REFERENCES prospect_reports(id) ON DELETE SET NULL
);
alter table public.client_links enable row level security;
CREATE INDEX client_links_account_idx ON public.client_links USING btree (account_id);
CREATE INDEX client_links_deal_idx ON public.client_links USING btree (deal_id);
create policy "Authenticated users can manage client_links" on public.client_links for all to authenticated using (true) with check (true);
create policy "Authenticated users can view client_links" on public.client_links for select to authenticated using (true);
```

### 20260819203032 — backfill_mrr_and_client_links

Likely DML only: populate account MRR and attach existing documents. No reliable DDL reconstruction is possible from this migration name and current catalog. Retrieve original statements and review intended row changes before any replay; copying current values would not recreate the historical backfill.

### 20260819203657 — authenticated_read_reports_and_views

Verified current read policies and needed SELECT privileges:

```sql
create policy "Authenticated users can view prospect_reports"
  on public.prospect_reports for select to authenticated using (true);
create policy "Authenticated users can view report_views"
  on public.report_views for select to authenticated using (true);
grant select on public.prospect_reports, public.report_views to authenticated;
```

The current client_links SELECT policy is in the earlier catalog reconstruction. Both report tables have RLS enabled. Current default table grants are broader than these SELECT statements; the listing captures the needed read access, not an exact historical ACL replay.

### 20260819233546 — disarm_mastlepley_setup_fee_autocharge

Verified current configuration shape; historical assignment to this migration is uncertain:

```sql
alter table public.accounts add column setup_fee_cents integer;
alter table public.accounts add constraint accounts_setup_fee_cents_nonneg
  check (setup_fee_cents is null or setup_fee_cents >= 0);
```

The likely account-specific UPDATE is deliberately not invented. The local file [20260819235959_account_setup_fee_config.sql](/Users/jeffconn/Dev/triple_3_labs-worktrees/crm-friction-fixes-0909/supabase/migrations/20260819235959_account_setup_fee_config.sql:1) describes the fee gate and contains this column/check, but its version is absent from production history. Presence of the shape does not prove SQL-body equivalence or which historical operation created it.

### 20260828221926 — add_deal_setup_fee_and_term_fields

Verified present columns, all nullable with no default:

```sql
alter table public.deals add column setup_fee_cents integer;
alter table public.deals add column mrr_month7 numeric;
alter table public.deals add column term_months integer;
-- Also needed to reconstruct today's account schema; exact historical placement unknown:
alter table public.accounts add column mrr_month7 numeric;
alter table public.accounts add column term_months integer;
```

Live deals.amount remains numeric(10,2); maturity/account MRR columns use unconstrained numeric. No nonnegative check exists on account MRR/deal amount, and no term-month check was returned. This document does not propose changing those constraints.

### 20260828222016 — create_revenue_rollup_views

Current catalog definitions (schema-qualify dependencies during a later reviewed reconstruction):

```sql
create view public.vw_revenue_lines with (security_invoker = true) as
 SELECT 'locked'::text AS bucket,
    a.name,
    a.mrr AS mrr_now,
    COALESCE(a.mrr_month7, a.mrr) AS mrr_mature,
    round(a.setup_fee_cents::numeric / 100.0, 2) AS setup_fee,
    a.term_months,
    'active'::text AS stage
   FROM accounts a
  WHERE a.status = 'active'::text
UNION ALL
 SELECT 'pending'::text AS bucket,
    d.name,
    d.amount AS mrr_now,
    COALESCE(d.mrr_month7, d.amount) AS mrr_mature,
    round(d.setup_fee_cents::numeric / 100.0, 2) AS setup_fee,
    d.term_months,
    ps.name AS stage
   FROM deals d
     JOIN pipeline_stages ps ON ps.id = d.stage_id
  WHERE ps.is_closed = false;
```

```sql
create view public.vw_revenue_rollup with (security_invoker = true) as
 WITH locked AS (
         SELECT COALESCE(sum(accounts.mrr), 0::numeric) AS mrr,
            COALESCE(sum(COALESCE(accounts.mrr_month7, accounts.mrr)), 0::numeric) AS mrr_mature,
            COALESCE(sum(accounts.setup_fee_cents), 0::bigint)::numeric / 100.0 AS setup,
            count(*) AS n
           FROM accounts
          WHERE accounts.status = 'active'::text
        ), pending AS (
         SELECT COALESCE(sum(d.amount), 0::numeric) AS mrr,
            COALESCE(sum(COALESCE(d.mrr_month7, d.amount)), 0::numeric) AS mrr_mature,
            COALESCE(sum(d.setup_fee_cents), 0::bigint)::numeric / 100.0 AS setup,
            count(*) AS n
           FROM deals d
             JOIN pipeline_stages ps ON ps.id = d.stage_id
          WHERE ps.is_closed = false
        )
 SELECT l.mrr AS locked_mrr,
    p.mrr AS pending_mrr,
    l.mrr + p.mrr AS total_potential_mrr,
    round(l.mrr * 12::numeric, 2) AS locked_arr,
    round((l.mrr + p.mrr) * 12::numeric, 2) AS potential_arr,
    l.mrr_mature AS locked_mrr_mature,
    round((l.mrr_mature + p.mrr_mature) * 12::numeric, 2) AS potential_arr_mature,
    l.setup AS locked_setup,
    p.setup AS pending_setup,
    l.n AS active_clients,
    p.n AS open_deals
   FROM locked l
     CROSS JOIN pending p;
```

### 20260828222626 — grant_revenue_views_to_authenticated

```sql
grant select on public.vw_revenue_lines, public.vw_revenue_rollup to authenticated;
```

Both views currently have security_invoker=on. SELECT grants are confirmed; broad default grants to anon/authenticated/service_role also appear in the catalog, so the original migration cannot be recreated by assuming SELECT was the entire ACL.

### 20260909112013 — create_leads_table

```sql
create table public.leads (
  id uuid not null default gen_random_uuid(),
  customer_id text not null,
  account_id uuid,
  source text not null default 'website_form'::text,
  form text,
  name text,
  phone text,
  email text,
  message text,
  fields jsonb not null default '{}'::jsonb,
  gclid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_url text,
  page_url text,
  referrer text,
  user_agent text,
  status text not null default 'new'::text,
  notified_at timestamptz,
  notify_error text,
  created_at timestamptz not null default now(),
  constraint leads_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  constraint leads_pkey PRIMARY KEY (id),
  constraint leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'won'::text, 'lost'::text, 'spam'::text])))
);
alter table public.leads enable row level security;
CREATE INDEX leads_customer_created_idx ON public.leads USING btree (customer_id, created_at DESC);
CREATE INDEX leads_new_idx ON public.leads USING btree (created_at DESC) WHERE (status = 'new'::text);
create policy "leads_read_authenticated" on public.leads for select to authenticated using (true);
create policy "leads_update_authenticated" on public.leads for update to authenticated using (true) with check (true);
```

Authenticated SELECT/UPDATE policies exist; no authenticated INSERT policy is present in the inspected catalog. Service-role writes bypass RLS. No schema or access changes were made.

## Two version-ID mismatches

| Migration | Production version | Repository version | Verified current shape / uncertainty |
|---|---|---|---|
| command_queue_snoozes | 20260820130759 | 20260820120000 | queue_key PK; snoozed_until/snoozed_at timestamps; snoozed_by FK to auth.users; until index; authenticated ALL policy. Shape agrees with local file; original statements/comments not compared. |
| client_links_dossier_code_kinds | 20260905211743 | 20260905160000 | Current kind check includes dossier and code plus eight earlier values. Shape agrees with local check; original statements not compared. |

Local references: [command_queue_snoozes.sql](/Users/jeffconn/Dev/triple_3_labs-worktrees/crm-friction-fixes-0909/supabase/migrations/20260820120000_command_queue_snoozes.sql:14), [client_links_dossier_code_kinds.sql](/Users/jeffconn/Dev/triple_3_labs-worktrees/crm-friction-fixes-0909/supabase/migrations/20260905160000_client_links_dossier_code_kinds.sql:5).

Do not rename migration history entries or mark local files applied solely because their names/shapes match. No clean replay, reset, migration repair, or schema synchronization was performed.

## Separate new migration from this fix batch

[20260910005458_stripe_event_idempotency.sql](/Users/jeffconn/Dev/triple_3_labs-worktrees/crm-friction-fixes-0909/supabase/migrations/20260910005458_stripe_event_idempotency.sql:1) is intentionally new and unapplied, not legacy drift. It creates stripe_events with a unique event ID, type, received_at, RLS and service-role access. The updated webhook requires this table before deployment. Production migration history still does not contain it.
