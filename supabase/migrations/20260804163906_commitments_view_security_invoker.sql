-- The view was created with default (owner) privileges, making commitment data
-- readable with the public anon key. Run it as the caller instead, and grant
-- logged-in admin users read via RLS policies. Service-role paths unaffected.
alter view public.vw_commitment_status set (security_invoker = on);

create policy commitments_read_authenticated on public.commitments
  for select to authenticated using (true);
create policy deliveries_read_authenticated on public.deliveries
  for select to authenticated using (true);;
