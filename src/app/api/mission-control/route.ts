import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOpsClient } from "@/lib/supabase/ops";

export const dynamic = "force-dynamic";

// Hierarchy the dashboard renders: Company -> Agent -> Process.
// Raw telemetry ids map to agents via the agent_registry table in the
// ops project; anything unmapped surfaces in an "Unmapped" company so
// new telemetry never silently disappears.

export type ProcessState = "ok" | "degraded" | "down" | "paused";

export interface ProcessRow {
  key: string;
  label: string;
  kind: "heartbeat" | "canary" | "task";
  state: ProcessState;
  detail: string | null; // human-readable: age, error message
  counted: boolean; // paused processes render but don't count in N/M
}

export interface CommitmentRow {
  id: string;
  name: string;
  kind: string;
  status: string;
  next_due: string | null;
  last_delivered: string | null;
  notes: string | null;
}

export interface AgentNode {
  agent_key: string;
  display_name: string;
  processes: ProcessRow[];
  healthy: number;
  total: number;
  state: ProcessState; // worst counted process
  commitments: CommitmentRow[];
  attention: boolean;
  activity: number[]; // 24 hourly task-run counts, oldest → newest
}

export interface CompanyNode {
  company_id: string;
  company_name: string;
  agents: AgentNode[];
  state: ProcessState;
  attention: boolean;
  next_due: string | null;
}

export interface RepoRow {
  repo: string;
  branch: string | null;
  remote_url: string | null;
  last_commit_at: string | null;
  last_commit_subject: string | null;
  daily_commits: number[];
  dirty_files: number;
}

function ageSeconds(ts: string): number {
  return (Date.now() - new Date(ts).getTime()) / 1000;
}

function humanAge(ts: string): string {
  const s = Math.max(0, Math.floor(ageSeconds(ts)));
  if (s < 90) return `${s}s ago`;
  if (s < 5400) return `${Math.round(s / 60)}m ago`;
  if (s < 90000) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

const WORSE: Record<ProcessState, number> = { down: 3, degraded: 2, ok: 1, paused: 0 };
function worst(states: ProcessState[]): ProcessState {
  return states.reduce<ProcessState>(
    (acc, s) => (WORSE[s] > WORSE[acc] ? s : acc),
    "ok"
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ops = createOpsClient();

  // 25h covers the activity trace and every task_stale_seconds threshold in
  // the registry, and keeps the query under PostgREST's row cap.
  const since = new Date(Date.now() - 25 * 3600_000).toISOString();
  const [registryRes, healthRes, canaryRes, tasksRes, commitmentsRes, reposRes] = await Promise.all([
    ops.from("agent_registry").select("*").order("sort_order"),
    ops.from("agent_health").select("*"),
    ops
      .from("agent_canary_status")
      .select("canary_id, agent_id, enabled, description, current_status, last_check_at, error_message"),
    // Latest task_end per agent for registry rows that health-check on task
    // freshness (no heartbeat). RLS permits reading task_end events.
    ops
      .from("agent_events")
      .select("agent_id, task_name, status, ts")
      .eq("event_type", "task_end")
      .gte("ts", since)
      .order("ts", { ascending: false })
      .limit(1000),
    supabase
      .from("vw_commitment_status")
      .select("id, customer_id, agent_id, name, kind, next_due, status, last_delivered, notes")
      .eq("active", true),
    supabase
      .from("repo_activity")
      .select("repo, branch, remote_url, last_commit_at, last_commit_subject, daily_commits, dirty_files")
      .order("last_commit_at", { ascending: false })
      .limit(12),
  ]);

  const firstError =
    registryRes.error || healthRes.error || canaryRes.error || commitmentsRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const registry = registryRes.data ?? [];
  const health = healthRes.data ?? [];
  const canaries = canaryRes.data ?? [];
  const taskEvents = tasksRes.data ?? [];
  const commitments = commitmentsRes.data ?? [];

  const mapped = new Set<string>(registry.flatMap((r) => r.telemetry_ids as string[]));

  // Synthesize a registry row per unmapped telemetry id so nothing vanishes.
  const unmappedIds = [
    ...new Set([
      ...health.map((h) => h.agent_id),
      ...canaries.filter((c) => c.enabled).map((c) => c.agent_id),
    ]),
  ].filter((id) => !mapped.has(id));

  const allRegistry = [
    ...registry,
    ...unmappedIds.map((id) => ({
      agent_key: `unmapped:${id}`,
      company_id: "unmapped",
      company_name: "Unmapped telemetry",
      display_name: id,
      telemetry_ids: [id],
      task_stale_seconds: null,
      sort_order: 999,
    })),
  ];

  const agents: (AgentNode & { company_id: string; company_name: string; sort: number })[] =
    allRegistry.map((reg) => {
      const ids: string[] = reg.telemetry_ids as string[];
      const processes: ProcessRow[] = [];

      // Heartbeat processes — one per telemetry id with an agent_health row.
      for (const h of health.filter((h) => ids.includes(h.agent_id))) {
        const threshold = h.stale_threshold_seconds ?? 300;
        const stale = h.last_heartbeat ? ageSeconds(h.last_heartbeat) > threshold : true;
        processes.push({
          key: `hb:${h.agent_id}`,
          label:
            h.agent_id === reg.telemetry_ids[0]
              ? "Heartbeat"
              : `Heartbeat · ${h.agent_id}`,
          kind: "heartbeat",
          state: stale ? "down" : "ok",
          detail: h.last_heartbeat ? humanAge(h.last_heartbeat) : "never reported",
          counted: true,
        });
      }

      // Canary processes.
      for (const c of canaries.filter((c) => ids.includes(c.agent_id))) {
        const paused = !c.enabled;
        processes.push({
          key: `canary:${c.canary_id}`,
          label: c.canary_id.replace(/_/g, " "),
          kind: "canary",
          state: paused
            ? "paused"
            : c.current_status === "ok"
              ? "ok"
              : c.current_status === "error"
                ? "down"
                : "degraded",
          detail: paused
            ? "paused"
            : c.current_status === "error"
              ? (c.error_message ?? "failing")
              : c.last_check_at
                ? `checked ${humanAge(c.last_check_at)}`
                : "no data yet",
          counted: !paused,
        });
      }

      // Task-freshness process for heartbeat-less agents (e.g. timer workers).
      if (reg.task_stale_seconds) {
        const latest = taskEvents.find((e) => ids.includes(e.agent_id));
        const stale = latest ? ageSeconds(latest.ts) > reg.task_stale_seconds : true;
        processes.push({
          key: `task:${reg.agent_key}`,
          label: latest ? `Last run · ${latest.task_name}` : "Last run",
          kind: "task",
          state: stale ? "down" : latest?.status === "ok" ? "ok" : "degraded",
          detail: latest
            ? `${latest.status} ${humanAge(latest.ts)}`
            : "no runs in the last 25 hours",
          counted: true,
        });
      }

      // Hourly run counts for the activity trace, oldest bucket first.
      const activity = new Array<number>(24).fill(0);
      for (const e of taskEvents) {
        if (!ids.includes(e.agent_id)) continue;
        const hoursAgo = Math.floor(ageSeconds(e.ts) / 3600);
        if (hoursAgo >= 0 && hoursAgo < 24) activity[23 - hoursAgo] += 1;
      }

      const counted = processes.filter((p) => p.counted);
      const agentCommitments = commitments
        .filter((c) => ids.includes(c.agent_id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          status: c.status,
          next_due: c.next_due,
          last_delivered: c.last_delivered,
          notes: c.notes,
        }));

      const state = worst(counted.map((p) => p.state));
      const attention =
        state !== "ok" ||
        agentCommitments.some((c) => c.status === "OVERDUE" || c.status === "DUE_SOON");

      return {
        agent_key: reg.agent_key,
        display_name: reg.display_name,
        company_id: reg.company_id,
        company_name: reg.company_name,
        sort: reg.sort_order,
        processes,
        healthy: counted.filter((p) => p.state === "ok").length,
        total: counted.length,
        state,
        commitments: agentCommitments,
        attention,
        activity,
      };
    });

  // Group into companies, worst-first within stable sort order.
  const companies: CompanyNode[] = [];
  for (const a of agents.sort((x, y) => x.sort - y.sort)) {
    let co = companies.find((c) => c.company_id === a.company_id);
    if (!co) {
      co = {
        company_id: a.company_id,
        company_name: a.company_name,
        agents: [],
        state: "ok",
        attention: false,
        next_due: null,
      };
      companies.push(co);
    }
    const { company_id: _c, company_name: _n, sort: _s, ...node } = a;
    co.agents.push(node);
    co.state = worst([co.state, a.state]);
    co.attention = co.attention || a.attention;
    for (const c of a.commitments) {
      if (c.next_due && (!co.next_due || c.next_due < co.next_due)) co.next_due = c.next_due;
    }
  }

  const allAgents = companies.flatMap((c) => c.agents);
  // Repo feed is additive — an error here shouldn't blank the fleet view.
  const repos: RepoRow[] = (reposRes.error ? [] : (reposRes.data ?? [])).map((r) => ({
    ...r,
    daily_commits: Array.isArray(r.daily_commits) ? r.daily_commits : [],
  }));
  return NextResponse.json({
    companies,
    repos,
    rollup: {
      agents_ok: allAgents.filter((a) => a.state === "ok").length,
      agents_degraded: allAgents.filter((a) => a.state === "degraded").length,
      agents_down: allAgents.filter((a) => a.state === "down").length,
      overdue: commitments.filter((c) => c.status === "OVERDUE").length,
      due_soon: commitments.filter((c) => c.status === "DUE_SOON").length,
    },
    fetchedAt: new Date().toISOString(),
  });
}
