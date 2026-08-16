
-- Pipeline stages (configurable)
CREATE TABLE pipeline_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL,
  is_closed boolean DEFAULT false,
  color text DEFAULT 'violet',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage pipeline_stages"
  ON pipeline_stages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Seed default pipeline stages
INSERT INTO pipeline_stages (name, display_order, is_closed, color) VALUES
  ('New Lead', 0, false, 'violet'),
  ('Qualified', 1, false, 'cyan'),
  ('Proposal Sent', 2, false, 'purple'),
  ('Negotiation', 3, false, 'pink'),
  ('Won', 4, true, 'emerald'),
  ('Lost', 5, true, 'zinc');

-- Contacts
CREATE TABLE contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text DEFAULT '',
  email text NOT NULL,
  phone text,
  company text,
  project_type text,
  budget_range text,
  message text,
  lead_score integer,
  lead_score_label text,
  lead_score_reasoning text,
  source text DEFAULT 'contact_form',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage contacts"
  ON contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
-- Allow anonymous inserts from the contact form
CREATE POLICY "Anyone can insert contacts"
  ON contacts FOR INSERT TO anon
  WITH CHECK (true);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);

-- Deals
CREATE TABLE deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  stage_id uuid REFERENCES pipeline_stages(id),
  contact_id uuid REFERENCES contacts(id),
  amount numeric(10,2),
  description text,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage deals"
  ON deals FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
-- Allow anonymous inserts from the contact form
CREATE POLICY "Anyone can insert deals"
  ON deals FOR INSERT TO anon
  WITH CHECK (true);

CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);

-- Activity log for contact timeline
CREATE TABLE activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'form_submission', 'stage_change', 'note', 'ai_scoring', 'ai_follow_up'
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage activities"
  ON activities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert activities"
  ON activities FOR INSERT TO anon
  WITH CHECK (true);

CREATE INDEX idx_activities_contact ON activities(contact_id, created_at DESC);

-- Update the ai_agent_logs to reference contacts table
ALTER TABLE ai_agent_logs ADD COLUMN contact_id uuid REFERENCES contacts(id);
;
