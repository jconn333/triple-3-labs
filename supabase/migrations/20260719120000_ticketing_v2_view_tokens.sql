-- Triple 3 Labs ticketing system v2 — customer self-serve ticket view
-- NOTE: already applied to live project cksdehpjxvkrvubmjjcl via Supabase MCP on 2026-07-19.
-- This file continues the in-repo versioning convention started by
-- 20260719000000_ticketing_system_v1.sql.

alter table public.tickets add column view_token uuid not null default gen_random_uuid();
create index tickets_view_token_idx on public.tickets (view_token);
comment on column public.tickets.view_token is 'Token for the public /ticket/[id]?token= customer view. Emailed in the acknowledgment; grants read of non-internal thread + reply.';
