
-- AI agent run logs
CREATE TABLE ai_agent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type text NOT NULL,
  contact_email text,
  hubspot_contact_id text,
  input jsonb,
  output jsonb,
  model text,
  tokens_used integer,
  latency_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read/write logs
CREATE POLICY "Authenticated users can manage ai_agent_logs"
  ON ai_agent_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification preferences
CREATE TABLE notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  slack_enabled boolean DEFAULT true,
  email_enabled boolean DEFAULT true,
  min_score_for_alert integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own notification settings
CREATE POLICY "Users manage own notification_settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
;
