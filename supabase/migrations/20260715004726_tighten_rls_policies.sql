-- Tighten lax RLS (2026-07-13 audit):
-- 1. accounts/contracts were ALL TO public USING(true) — anon key had full read/write.
drop policy "Authenticated users can manage accounts" on public.accounts;
create policy "authenticated_manage_accounts"
  on public.accounts for all to authenticated using (true) with check (true);

drop policy "Authenticated users can manage contracts" on public.contracts;
create policy "authenticated_manage_contracts"
  on public.contracts for all to authenticated using (true) with check (true);

-- 2. Unrestricted anon INSERT policies (spam vectors). The public contact form
--    writes through the service role (API route), so these are unnecessary.
--    The scoped "Allow public contact form inserts" (source='contact_form') on
--    contacts is kept deliberately as a belt-and-suspenders for legacy flows.
drop policy "Anyone can insert contacts" on public.contacts;
drop policy "Allow public deal inserts" on public.deals;
drop policy "Anyone can insert deals" on public.deals;
drop policy "Allow public activity inserts" on public.activities;
drop policy "Anyone can insert activities" on public.activities;

-- 3. Anon read of pipeline stages — no public page needs the sales pipeline.
drop policy "Allow public pipeline stage reads" on public.pipeline_stages;;
