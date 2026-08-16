
-- Accounts table (one per contact)
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL UNIQUE REFERENCES public.contacts(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);

-- Contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  status text NOT NULL DEFAULT 'draft',
  esign_provider text,
  esign_document_id text,
  esign_status text,
  esign_sent_at timestamptz,
  esign_signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);

-- Extend activities for account events
ALTER TABLE public.activities ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Private storage bucket for contract files
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
CREATE POLICY "Auth upload contracts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');
CREATE POLICY "Auth read contracts" ON storage.objects FOR SELECT USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete contracts" ON storage.objects FOR DELETE USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
;
