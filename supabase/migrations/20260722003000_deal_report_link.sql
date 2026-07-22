-- Link deals to the prospect SEO report sent in the pitch email, so the
-- pipeline can surface report-open engagement per deal.

alter table public.deals
  add column if not exists prospect_report_id uuid
    references public.prospect_reports (id) on delete set null;
