-- Repo activity for Mission Control's "Recent work" section.
-- One row per local git repo on Jeff's Mac, upserted by
-- infra/monitoring/repo-activity-sync.sh (triple_3_platform repo) on a
-- launchd schedule using the service role; admins read it via RLS.

create table if not exists public.repo_activity (
  repo                text primary key,          -- directory basename
  path                text not null,
  remote_url          text,
  branch              text,
  last_commit_at      timestamptz,
  last_commit_subject text,
  recent_subjects     jsonb,                     -- last 5 commit subjects
  daily_commits       jsonb,                     -- 14 daily counts, oldest first
  dirty_files         int not null default 0,    -- uncommitted paths
  synced_at           timestamptz not null default now()
);

alter table public.repo_activity enable row level security;

drop policy if exists repo_activity_read_authenticated on public.repo_activity;
create policy repo_activity_read_authenticated on public.repo_activity
  for select to authenticated using (true);
