-- Prospect SEO audit reports served at triple3labs.io/r/[slug],
-- with per-view logging for follow-up timing signals.

create table if not exists public.prospect_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  prospect_name text not null,
  prospect_domain text,
  title text,
  html text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_views (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.prospect_reports (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text,
  referer text
);

create index if not exists report_views_report_id_idx
  on public.report_views (report_id, viewed_at desc);

-- RLS on with no policies: only the service-role key (used by the /r/[slug]
-- route handler and the publish script) can read or write these tables.
alter table public.prospect_reports enable row level security;
alter table public.report_views enable row level security;
