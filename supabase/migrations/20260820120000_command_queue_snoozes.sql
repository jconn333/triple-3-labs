-- "Needs you" queue dismissals for the Command Center.
--
-- The queue is derived fresh from live data on every request (billing gaps,
-- unanchored kickoffs, overdue commitments, warm prospects with no deal), so a
-- dismissal can't just delete a row — there's no row to delete. Instead each
-- derived item carries a deterministic queue_key, and dismissing it records a
-- snooze here. The API filters out any key whose snooze is still in the future,
-- then the item resurfaces on its own once the snooze lapses (or immediately,
-- if the underlying situation changes and we choose to re-key it).
--
-- Snooze-only by design: dismissing does NOT touch the deal/commitment. Closing
-- a fizzled deal (e.g. moving it to Lost) is a separate, explicit action.

create table if not exists public.command_snoozes (
  queue_key     text primary key,
  snoozed_until timestamptz not null,
  snoozed_at    timestamptz not null default now(),
  snoozed_by    uuid references auth.users (id)
);

comment on table public.command_snoozes is
  'Dismissed Command Center "Needs you" items, keyed by the queue item''s deterministic key. Filtered by snoozed_until > now(); lapses automatically.';

create index if not exists command_snoozes_until_idx
  on public.command_snoozes (snoozed_until);

-- Same posture as the rest of the CRM: only signed-in admins reach this.
alter table public.command_snoozes enable row level security;
create policy "authenticated_manage_command_snoozes"
  on public.command_snoozes for all to authenticated using (true) with check (true);
