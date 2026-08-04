"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Radar,
  CircleCheck,
  CircleAlert,
  ChevronRight,
  PauseCircle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";

type ProcessState = "ok" | "degraded" | "down" | "paused";

interface ProcessRow {
  key: string;
  label: string;
  kind: string;
  state: ProcessState;
  detail: string | null;
  counted: boolean;
}

interface CommitmentRow {
  id: string;
  name: string;
  kind: string;
  status: string;
  next_due: string | null;
  last_delivered: string | null;
  notes: string | null;
}

interface AgentNode {
  agent_key: string;
  display_name: string;
  processes: ProcessRow[];
  healthy: number;
  total: number;
  state: ProcessState;
  commitments: CommitmentRow[];
  attention: boolean;
}

interface CompanyNode {
  company_id: string;
  company_name: string;
  agents: AgentNode[];
  state: ProcessState;
  attention: boolean;
  next_due: string | null;
}

interface MissionData {
  companies: CompanyNode[];
  rollup: {
    agents_ok: number;
    agents_degraded: number;
    agents_down: number;
    overdue: number;
    due_soon: number;
  };
  fetchedAt: string;
}

function StateDot({ state }: { state: ProcessState }) {
  const cls =
    state === "ok"
      ? "bg-emerald-400"
      : state === "down"
        ? "bg-red-400 animate-pulse"
        : state === "degraded"
          ? "bg-amber-400"
          : "bg-white/25";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} />;
}

function CommitmentChip({ c }: { c: CommitmentRow }) {
  const map: Record<string, { cls: string; label: string }> = {
    OVERDUE: { cls: "border-red-400/40 bg-red-400/15 text-red-300", label: "Overdue" },
    DUE_SOON: { cls: "border-amber-400/40 bg-amber-400/15 text-amber-300", label: "Due soon" },
    on_track: { cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", label: "On track" },
    delivered: { cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", label: "Delivered" },
    see_canaries: { cls: "border-white/15 bg-white/5 text-white/50", label: "Continuous" },
    unscheduled: { cls: "border-white/15 bg-white/5 text-white/50", label: "Unscheduled" },
  };
  const s = map[c.status] ?? map.unscheduled;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  return (
    <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <p
        className={`text-2xl font-semibold tabular-nums ${
          value > 0 && tone === "bad"
            ? "text-red-300"
            : value > 0 && tone === "warn"
              ? "text-amber-300"
              : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentNode }) {
  // Broken rows open themselves; the user should never click to discover a problem.
  const [open, setOpen] = useState(agent.attention);
  useEffect(() => {
    if (agent.attention) setOpen(true);
  }, [agent.attention]);

  const dueChip = agent.commitments.find(
    (c) => c.status === "OVERDUE" || c.status === "DUE_SOON"
  );
  const nextRecurring = agent.commitments.find((c) => c.kind === "recurring");

  return (
    <div className={agent.attention ? "bg-red-400/5" : ""}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left hover:bg-white/[0.04]"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-white/30 transition-transform ${open ? "rotate-90" : ""}`}
        />
        <StateDot state={agent.state} />
        <span className="min-w-44 text-sm font-medium text-white">{agent.display_name}</span>
        <span
          className={`text-sm tabular-nums ${
            agent.healthy === agent.total ? "text-emerald-300" : "text-amber-300"
          }`}
        >
          {agent.healthy}/{agent.total} processes healthy
        </span>
        <span className="flex-1" />
        {dueChip ? (
          <CommitmentChip c={dueChip} />
        ) : nextRecurring?.next_due ? (
          <span className="text-xs text-white/40">
            Next: {nextRecurring.name.toLowerCase().includes("report") ? "report" : nextRecurring.name}{" "}
            {nextRecurring.next_due}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="border-t border-white/5 px-12 pb-4 pt-2">
          <div className="flex flex-col gap-1.5">
            {agent.processes.map((p) => (
              <div key={p.key} className="flex items-baseline gap-3 text-sm">
                {p.state === "paused" ? (
                  <PauseCircle size={12} className="relative top-0.5 shrink-0 text-white/25" />
                ) : (
                  <StateDot state={p.state} />
                )}
                <span className={p.state === "paused" ? "text-white/40" : "text-white/80"}>
                  {p.label}
                </span>
                <span
                  className={`text-xs ${
                    p.state === "down"
                      ? "text-red-300"
                      : p.state === "degraded"
                        ? "text-amber-300"
                        : "text-white/40"
                  }`}
                >
                  {p.detail}
                </span>
              </div>
            ))}
          </div>

          {agent.commitments.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                Commitments
              </p>
              <div className="flex flex-col gap-1.5">
                {agent.commitments.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                    <span className="text-white/80">{c.name}</span>
                    <CommitmentChip c={c} />
                    {c.next_due && (
                      <span className="text-xs text-white/40">due {c.next_due}</span>
                    )}
                    {c.last_delivered && (
                      <span className="text-xs text-white/40">
                        delivered {formatRelativeTime(c.last_delivered)}
                      </span>
                    )}
                    {c.notes?.startsWith("BLOCKED") && (
                      <span className="text-xs text-amber-300/80">blocked on customer</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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

  if (loading) return <div className="py-20 text-center text-white/40">Loading fleet…</div>;
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

  const allClear =
    data.rollup.agents_degraded === 0 &&
    data.rollup.agents_down === 0 &&
    data.rollup.overdue === 0 &&
    data.rollup.due_soon === 0;

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

      {/* Rollup strip — the two-second read */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Stat label="Agents healthy" value={data.rollup.agents_ok} />
        <Stat label="Degraded" value={data.rollup.agents_degraded} tone="warn" />
        <Stat label="Down" value={data.rollup.agents_down} tone="bad" />
        <Stat label="Deliverables overdue" value={data.rollup.overdue} tone="bad" />
        <Stat label="Due this week" value={data.rollup.due_soon} tone="warn" />
      </div>

      <div
        className={`mb-8 flex items-center gap-3 rounded-lg border p-3.5 ${
          allClear
            ? "border-emerald-400/30 bg-emerald-400/10"
            : "border-amber-400/40 bg-amber-400/10"
        }`}
      >
        {allClear ? (
          <CircleCheck size={16} className="shrink-0 text-emerald-300" />
        ) : (
          <CircleAlert size={16} className="shrink-0 text-amber-300" />
        )}
        <p className="text-sm text-white/80">
          {allClear
            ? "All agents healthy, all commitments on schedule."
            : "Items needing attention are expanded below."}
        </p>
      </div>

      {/* Companies */}
      <div className="flex flex-col gap-5">
        {data.companies.map((co) => (
          <div key={co.company_id} className="overflow-hidden rounded-lg border border-white/10">
            <div
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10 px-5 py-3 ${
                co.attention ? "bg-red-400/10" : "bg-white/[0.04]"
              }`}
            >
              <StateDot state={co.state} />
              <h2 className="text-sm font-semibold text-white">{co.company_name}</h2>
              <span className="text-xs text-white/40">
                {co.agents.length} agent{co.agents.length > 1 ? "s" : ""}
              </span>
              <span className="flex-1" />
              <span className="text-xs text-white/40">
                {co.attention
                  ? "needs attention"
                  : co.next_due
                    ? `next deliverable ${co.next_due}`
                    : "all healthy"}
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {co.agents.map((a) => (
                <AgentRow key={a.agent_key} agent={a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
