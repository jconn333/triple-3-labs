import { createClient } from "@supabase/supabase-js";

// Read-only client for the triple3-ops telemetry project (separate Supabase
// project from the CRM). Uses the ops anon key, which RLS scopes to
// agent_health, canary config/status, and canary/task_end events.
export function createOpsClient() {
  const url = process.env.OPS_SUPABASE_URL;
  const key = process.env.OPS_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing OPS_SUPABASE_URL or OPS_SUPABASE_ANON_KEY");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
