"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Radar, CircleCheck, CircleAlert, CircleDashed } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";

interface Canary {
  canary_id: string;
  status: string | null;
  last_check_at: string | null;
  error: string | null;
}

interface AgentRow {
  agent_id: string;
  customer_id: string;
  host: string | null;
  last_heartbeat: string | null;
  stale_threshold_seconds: number | null;
  last_task_name: string | null;
  last_task_status: string | null;
  last_task_at: string | null;
  canaries: Canary[];
}

interface OrphanCanary extends Canary {
  agent_id: string;
}

interface CommitmentRow {
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

interface MissionData {
  agents: AgentRow[];
  orphanCanaries: OrphanCanary[];
  commitments: CommitmentRow[];
  fetchedAt: string;
}

const AGENT_LABELS: Record<string, string> = {
  "ecoseal.seo": "Dwight — Eco Seal SEO",
  "fivestar.zeke": "Zeke — Five Star",
  "zeke.daily_brief": "Zeke daily brief",
  "sync.hostaway": "HostAway sync",
  "sync.cloudbeds": "Cloudbeds sync",
  "triple3.ticket-triage": "Ticket triage",
};

// Wrapper heartbeats fire every 60s for persistent agents; scheduled agents
// carry their own threshold in agent_health. Default mirrors the dead-man
// switch's 300s customer default.
function heartbeatState(agent: AgentRow): "ok" | "stale" | "unknown" {
  if (!agent.last_heartbeat) return "unknown";
  const ageS = (Date.now() - new Date(agent.last_heartbeat).getTime()) / 1000;
  return ageS > (agent.stale_threshold_seconds ?? 300) ? "stale" : "ok";
}

function agentAttention(agent: AgentRow): boolean {
  return (
    heartbeatState(agent) === "stale" ||
    agent.canaries.some((c) => c.status === "error") ||
    agent.last_task_status === "error"
  );
}

function commitmentAttention(c: CommitmentRow): boolean {
  return c.status === "OVERDUE" || c.status === "DUE_SOON";
}

function StatusDot({ state }: { state: "ok" | "stale" | "unknown" }) {
  const cls =
    state === "ok"
      ? "bg-emerald-400"
      : state === "stale"
        ? "bg-red-400 animate-pulse"
        : "bg-white/30";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} />;
}

function CommitmentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OVERDUE: "border-red-400/40 bg-red-400/15 text-red-300",
    DUE_SOON: "border-amber-400/40 bg-amber-400/15 text-amber-300",
    on_track: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    delivered: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    see_canaries: "border-white/15 bg-white/5 text-white/50",
    unscheduled: "border-white/15 bg-white/5 text-white/50",
    inactive: "border-white/15 bg-white/5 text-white/40",
  };
  const labels: Record<string, string> = {
    OVERDUE: "Overdue",
    DUE_SOON: "Due soon",
    on_track: "On track",
    delivered: "Delivered",
    see_canaries: "Continuous",
    unscheduled: "Unscheduled",
    inactive: "Inactive",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.unscheduled}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default function MissionControlPage() {
  const [data, setData] = useState<MissionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/mission-control");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading) {
    return <div className="py-20 text-center text-white/40">Loading fleet…</div>;
  }
  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-red-400/30 bg-red-400/10 p-6 text-center">
        <p className="mb-1 font-medium text-red-300">Mission Control couldn&apos;t load</p>
        <p className="text-sm text-white/60">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          className="mt-4 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70 hover:bg-white/10"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const attentionAgents = data.agents.filter(agentAttention);
  const attentionCommitments = data.commitments.filter(commitmentAttention);
  const failingOrphans = data.orphanCanaries.filter((c) => c.status === "error");
  const allClear =
    attentionAgents.length === 0 &&
    attentionCommitments.length === 0 &&
    failingOrphans.length === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radar size={22} className="text-violet" />
          <div>
            <h1 className="text-xl font-semibold text-white">Mission Control</h1>
            <p className="text-sm text-white/40">
              Every agent, its health, and what it owes customers
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/60 hover:bg-white/10"
        >
          <RefreshCw size={13} />
          Updated {formatRelativeTime(data.fetchedAt)}
        </button>
      </div>

      {/* Attention banner */}
      <div
        className={`mb-8 flex items-center gap-3 rounded-lg border p-4 ${
          allClear
            ? "border-emerald-400/30 bg-emerald-400/10"
            : "border-amber-400/40 bg-amber-400/10"
        }`}
      >
        {allClear ? (
          <CircleCheck size={18} className="shrink-0 text-emerald-300" />
        ) : (
          <CircleAlert size={18} className="shrink-0 text-amber-300" />
        )}
        <p className="text-sm text-white/80">
          {allClear
            ? "All agents healthy, all commitments on schedule."
            : [
                attentionAgents.length > 0 &&
                  `${attentionAgents.length} agent${attentionAgents.length > 1 ? "s" : ""} need attention`,
                attentionCommitments.length > 0 &&
                  `${attentionCommitments.length} deliverable${attentionCommitments.length > 1 ? "s" : ""} due/overdue`,
                failingOrphans.length > 0 &&
                  `${failingOrphans.length} infra probe${failingOrphans.length > 1 ? "s" : ""} failing`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
      </div>

      {/* Fleet */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Fleet
      </h2>
      <div className="mb-8 overflow-hidden rounded-lg border border-white/10">
        {data.agents.map((agent, i) => {
          const hb = heartbeatState(agent);
          const failing = agent.canaries.filter((c) => c.status === "error");
          return (
            <div
              key={agent.agent_id}
              className={`flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 ${
                i > 0 ? "border-t border-white/10" : ""
              } ${agentAttention(agent) ? "bg-red-400/5" : "bg-white/[0.02]"}`}
            >
              <div className="flex min-w-52 items-center gap-3">
                <StatusDot state={hb} />
                <div>
                  <p className="text-sm font-medium text-white">
                    {AGENT_LABELS[agent.agent_id] ?? agent.agent_id}
                  </p>
                  <p className="text-xs text-white/40">
                    {agent.customer_id} · {agent.host ?? "unknown host"}
                  </p>
                </div>
              </div>

              <div className="min-w-40">
                <p className="text-xs text-white/40">Heartbeat</p>
                <p className={`text-sm ${hb === "stale" ? "text-red-300" : "text-white/80"}`}>
                  {agent.last_heartbeat ? formatRelativeTime(agent.last_heartbeat) : "never"}
                </p>
              </div>

              <div className="min-w-44">
                <p className="text-xs text-white/40">Last task</p>
                <p className="text-sm text-white/80">
                  {agent.last_task_name ? (
                    <>
                      {agent.last_task_name}
                      <span
                        className={
                          agent.last_task_status === "ok"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {" "}
                        {agent.last_task_status}
                      </span>{" "}
                      <span className="text-white/40">
                        {agent.last_task_at ? formatRelativeTime(agent.last_task_at) : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-white/40">— session agent</span>
                  )}
                </p>
              </div>

              <div className="flex-1">
                <p className="text-xs text-white/40">Canaries</p>
                {agent.canaries.length === 0 ? (
                  <p className="text-sm text-white/40">none</p>
                ) : failing.length === 0 ? (
                  <p className="text-sm text-emerald-300">
                    {agent.canaries.length}/{agent.canaries.length} passing
                  </p>
                ) : (
                  <p className="text-sm text-red-300" title={failing.map((c) => c.canary_id).join(", ")}>
                    {failing.length} failing: {failing.map((c) => c.canary_id).join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infra probes not tied to a fleet agent */}
      {data.orphanCanaries.length > 0 && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Infra probes
          </h2>
          <div className="mb-8 flex flex-wrap gap-2">
            {data.orphanCanaries.map((c) => (
              <span
                key={c.canary_id}
                title={c.error ?? undefined}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                  c.status === "ok"
                    ? "border-white/10 bg-white/5 text-white/60"
                    : c.status === "error"
                      ? "border-red-400/40 bg-red-400/10 text-red-300"
                      : "border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {c.status === "ok" ? (
                  <CircleCheck size={12} className="text-emerald-300" />
                ) : c.status === "error" ? (
                  <CircleAlert size={12} />
                ) : (
                  <CircleDashed size={12} />
                )}
                {c.canary_id}
                <span className="text-white/30">
                  {c.last_check_at ? formatRelativeTime(c.last_check_at) : "no data"}
                </span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Commitments */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Customer commitments
      </h2>
      <div className="overflow-hidden rounded-lg border border-white/10">
        {data.commitments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-white/40">No active commitments.</p>
        ) : (
          data.commitments.map((c, i) => (
            <div
              key={c.id}
              className={`flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 ${
                i > 0 ? "border-t border-white/10" : ""
              } ${commitmentAttention(c) ? "bg-amber-400/5" : "bg-white/[0.02]"}`}
            >
              <div className="min-w-64 flex-1">
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-white/40">
                  {c.customer_id} · {AGENT_LABELS[c.agent_id] ?? c.agent_id}
                </p>
              </div>
              <div className="min-w-32">
                <p className="text-xs text-white/40">Next due</p>
                <p className="text-sm text-white/80">{c.next_due ?? "—"}</p>
              </div>
              <div className="min-w-36">
                <p className="text-xs text-white/40">Last delivered</p>
                <p className="text-sm text-white/80">
                  {c.last_delivered ? formatRelativeTime(c.last_delivered) : "—"}
                </p>
              </div>
              <CommitmentBadge status={c.status} />
            </div>
          ))
        )}
      </div>

      {data.commitments.some((c) => c.notes?.startsWith("BLOCKED")) && (
        <p className="mt-3 text-xs text-white/40">
          Note: GSC + GA4 monitoring is waiting on the customer granting service-account
          access.
        </p>
      )}
    </div>
  );
}
