import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOpsClient } from "@/lib/supabase/ops";

export const dynamic = "force-dynamic";

export interface AgentRow {
  agent_id: string;
  customer_id: string;
  host: string | null;
  last_heartbeat: string | null;
  stale_threshold_seconds: number | null;
  last_task_name: string | null;
  last_task_status: string | null;
  last_task_at: string | null;
  canaries: { canary_id: string; status: string | null; last_check_at: string | null; error: string | null }[];
}

export interface CommitmentRow {
  id: string;
  customer_id: string;
  agent_id: string;
  name: string;
  kind: string;
  next_due: string | null;
  status: string;
  last_delivered: string | null;
  last_output: string | null;
  notes: string | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ops = createOpsClient();

  const [healthRes, canaryRes, commitmentsRes] = await Promise.all([
    ops.from("agent_health").select("*").order("agent_id"),
    ops
      .from("agent_canary_status")
      .select("canary_id, agent_id, enabled, current_status, last_check_at, error_message"),
    supabase
      .from("vw_commitment_status")
      .select(
        "id, customer_id, agent_id, name, kind, next_due, status, last_delivered, last_output, notes"
      )
      .eq("active", true),
  ]);

  if (healthRes.error) {
    return NextResponse.json({ error: `ops health: ${healthRes.error.message}` }, { status: 500 });
  }
  if (commitmentsRes.error) {
    return NextResponse.json(
      { error: `commitments: ${commitmentsRes.error.message}` },
      { status: 500 }
    );
  }

  const canaries = (canaryRes.data ?? []).filter((c) => c.enabled);

  const agents: AgentRow[] = (healthRes.data ?? []).map((h) => ({
    agent_id: h.agent_id,
    customer_id: h.customer_id,
    host: h.host,
    last_heartbeat: h.last_heartbeat,
    stale_threshold_seconds: h.stale_threshold_seconds,
    last_task_name: h.last_task_name,
    last_task_status: h.last_task_status,
    last_task_at: h.last_task_at,
    canaries: canaries
      .filter((c) => c.agent_id === h.agent_id)
      .map((c) => ({
        canary_id: c.canary_id,
        status: c.current_status,
        last_check_at: c.last_check_at,
        error: c.error_message,
      })),
  }));

  // Canaries whose subject agent has no agent_health row (infra probes).
  const orphanCanaries = canaries
    .filter((c) => !agents.some((a) => a.agent_id === c.agent_id))
    .map((c) => ({
      canary_id: c.canary_id,
      agent_id: c.agent_id,
      status: c.current_status,
      last_check_at: c.last_check_at,
      error: c.error_message,
    }));

  return NextResponse.json({
    agents,
    orphanCanaries,
    commitments: (commitmentsRes.data ?? []) as CommitmentRow[],
    fetchedAt: new Date().toISOString(),
  });
}
