alter table public.deals
  add column if not exists prospect_report_id uuid
    references public.prospect_reports (id) on delete set null;;
