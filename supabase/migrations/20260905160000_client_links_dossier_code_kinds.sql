-- client_links.kind: add 'dossier' (where the client's business documents live) and
-- 'code' (where its website/application source lives). These make the CRM the
-- index of per-client locations across the triple3-business / triple_3_platform /
-- standalone-site repos. Applied to cksdehpjxvkrvubmjjcl on 2026-09-05.
alter table public.client_links drop constraint if exists client_links_kind_check;
alter table public.client_links add constraint client_links_kind_check
  check (kind = any (array['audit','proposal','report','website','ads_plan','contract','onboarding','dossier','code','other']::text[]));
