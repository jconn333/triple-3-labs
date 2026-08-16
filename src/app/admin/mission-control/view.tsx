"use client";

// Presentational layer for Mission Control. page.tsx feeds it live data;
// /dev/mc-preview feeds it fixtures so the design can be seen and iterated
// without an admin session.

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Radar,
  CircleCheck,
  CircleAlert,
  ChevronRight,
  PauseCircle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";

export type ProcessState = "ok" | "degraded" | "down" | "paused";

export interface ProcessRow {
  key: string;
  label: string;
  kind: string;
  state: ProcessState;
  detail: string | null;
  counted: boolean;
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
  state: ProcessState;
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

export interface MissionData {
  companies: CompanyNode[];
  repos?: RepoRow[];
  rollup: {
    agents_ok: number;
    agents_degraded: number;
    agents_down: number;
    overdue: number;
    due_soon: number;
  };
  fetchedAt: string;
}

/* ---------- small pieces ---------- */

const STATE_BG: Record<ProcessState, string> = {
  ok: "bg-emerald-400",
  degraded: "bg-amber-400",
  down: "bg-red-400",
  paused: "bg-white/20",
};

const STATE_TEXT: Record<ProcessState, string> = {
  ok: "text-emerald-300",
  degraded: "text-amber-300",
  down: "text-red-300",
  paused: "text-white/40",
};

function StateIcon({ state, size = 14 }: { state: ProcessState; size?: number }) {
  if (state === "paused") return <PauseCircle size={size} className="shrink-0 text-white/30" />;
  if (state === "ok") return <CircleCheck size={size} className="shrink-0 text-emerald-400" />;
  return (
    <CircleAlert
      size={size}
      className={`shrink-0 ${state === "down" ? "text-red-400" : "text-amber-400"}`}
    />
  );
}

// One 16×6 segment per counted process — the row's health at a glance.
// Paused processes render dimmer and narrower so they read as "present, off".
function ProcessStrip({ processes }: { processes: ProcessRow[] }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {processes.map((p) => (
        <span
          key={p.key}
          title={`${p.label} — ${p.state}${p.detail ? ` · ${p.detail}` : ""}`}
          className={`h-1.5 rounded-full ${p.counted ? "w-4" : "w-2"} ${STATE_BG[p.state]}`}
        />
      ))}
    </div>
  );
}

// Bucketed activity, oldest → newest, baseline-anchored bars in the accent
// hue (activity is volume, not status); latest bucket emphasized.
function ActivityTrace({
  buckets,
  unit = "hour",
  noun = "run",
}: {
  buckets: number[];
  unit?: "hour" | "day";
  noun?: string;
}) {
  const max = Math.max(...buckets, 1);
  const u = unit === "hour" ? "h" : "d";
  return (
    <div className="flex h-5 items-end gap-[2px]" aria-hidden>
      {buckets.map((n, i) => {
        const h = n === 0 ? 2 : Math.max(4, Math.round((n / max) * 20));
        const ago = buckets.length - 1 - i;
        return (
          <span
            key={i}
            title={`${n} ${noun}${n === 1 ? "" : "s"} · ${ago === 0 ? `this ${unit}` : `${ago}${u} ago`}`}
            style={{ height: `${h}px` }}
            className={`w-[5px] rounded-[1px] ${
              n === 0 ? "bg-white/10" : i === buckets.length - 1 ? "bg-violet" : "bg-violet/45"
            }`}
          />
        );
      })}
    </div>
  );
}

function dueLabel(nextDue: string | null): { text: string; tone: "bad" | "warn" | "quiet" } | null {
  if (!nextDue) return null;
  const days = Math.round((new Date(nextDue + "T12:00:00Z").getTime() - Date.now()) / 86400_000);
  if (days < 0) return { text: `${-days}d overdue`, tone: "bad" };
  if (days === 0) return { text: "due today", tone: "warn" };
  if (days === 1) return { text: "due tomorrow", tone: "warn" };
  if (days <= 3) return { text: `due in ${days}d`, tone: "warn" };
  return { text: `due in ${days}d`, tone: "quiet" };
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "bad" | "warn";
}) {
  const hot = value > 0 && tone;
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        hot
          ? tone === "bad"
            ? "border-red-400/30 bg-red-400/[0.07]"
            : "border-amber-400/30 bg-amber-400/[0.07]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p
        className={`text-2xl font-semibold tabular-nums leading-tight ${
          hot ? (tone === "bad" ? "text-red-300" : "text-amber-300") : tone ? "text-white/35" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

/* ---------- rows ---------- */

function AgentRow({ agent }: { agent: AgentNode }) {
  // Broken rows open themselves; nobody should click to discover a problem.
  const [open, setOpen] = useState(agent.attention);
  useEffect(() => {
    if (agent.attention) setOpen(true);
  }, [agent.attention]);

  const dueChip = agent.commitments.find(
    (c) => c.status === "OVERDUE" || c.status === "DUE_SOON"
  );
  const nextRecurring = agent.commitments.find((c) => c.kind === "recurring" && c.next_due);
  const due = nextRecurring ? dueLabel(nextRecurring.next_due) : null;
  const hasActivity = agent.activity.some((n) => n > 0);

  return (
    <div className={agent.attention ? "bg-red-400/[0.04]" : ""}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-left hover:bg-white/[0.04]"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-white/30 motion-safe:transition-transform ${open ? "rotate-90" : ""}`}
        />
        <StateIcon state={agent.state} />
        <span className="min-w-44 text-sm font-medium text-white">{agent.display_name}</span>
        <ProcessStrip processes={agent.processes} />
        <span
          className={`text-xs tabular-nums ${
            agent.healthy === agent.total ? "text-white/40" : STATE_TEXT[agent.state]
          }`}
        >
          {agent.healthy}/{agent.total} healthy
        </span>
        <span className="flex-1" />
        {dueChip ? (
          <CommitmentChip c={dueChip} />
        ) : due ? (
          <span
            className={`text-xs ${
              due.tone === "warn" ? "text-amber-300" : "text-white/40"
            }`}
          >
            report {due.text}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="ml-7 border-l border-white/10 px-6 pb-4 pt-1 md:ml-9">
          <div className="flex flex-col gap-2">
            {agent.processes.map((p) => (
              <div key={p.key} className="flex items-center gap-2.5 text-sm">
                <StateIcon state={p.state} size={13} />
                <span className={p.state === "paused" ? "text-white/40" : "text-white/85"}>
                  {p.label}
                </span>
                <span
                  className={`text-xs ${
                    p.state === "ok" || p.state === "paused" ? "text-white/35" : STATE_TEXT[p.state]
                  }`}
                >
                  {p.detail}
                </span>
              </div>
            ))}
          </div>

          {hasActivity && (
            <div className="mt-3.5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Runs · last 24h
              </p>
              <ActivityTrace buckets={agent.activity} unit="hour" noun="run" />
            </div>
          )}

          {agent.commitments.length > 0 && (
            <div className="mt-3.5 border-t border-white/5 pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Commitments
              </p>
              <div className="flex flex-col gap-1.5">
                {agent.commitments.map((c) => {
                  const d = dueLabel(c.next_due);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm"
                    >
                      <span className="text-white/85">{c.name}</span>
                      <CommitmentChip c={c} />
                      {d && (
                        <span
                          className={`text-xs ${
                            d.tone === "bad"
                              ? "text-red-300"
                              : d.tone === "warn"
                                ? "text-amber-300"
                                : "text-white/40"
                          }`}
                        >
                          {d.text}
                        </span>
                      )}
                      {c.last_delivered && (
                        <span className="text-xs text-white/35">
                          delivered {formatRelativeTime(c.last_delivered)}
                        </span>
                      )}
                      {c.notes?.startsWith("BLOCKED") && (
                        <span className="text-xs text-amber-300/80">blocked on customer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- top level ---------- */

export default function MissionControlView({
  data,
  onRefresh,
}: {
  data: MissionData;
  onRefresh?: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "attention">("all");

  const attentionCount = useMemo(
    () => data.companies.flatMap((c) => c.agents).filter((a) => a.attention).length,
    [data]
  );

  const companies = useMemo(() => {
    if (filter === "all") return data.companies;
    return data.companies
      .filter((c) => c.attention)
      .map((c) => ({ ...c, agents: c.agents.filter((a) => a.attention) }));
  }, [data, filter]);

  const allClear = attentionCount === 0 && data.rollup.overdue === 0 && data.rollup.due_soon === 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Radar size={22} className="text-violet" />
        <div>
          <h1 className="text-xl font-semibold text-white">Mission Control</h1>
          <p className="text-sm text-white/40">
            Every agent, its health, and what it owes customers
          </p>
        </div>
        <span className="flex-1" />
        <div
          role="group"
          aria-label="Filter agents"
          className="flex rounded-full border border-white/15 p-0.5 text-xs"
        >
          {(["all", "attention"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-3 py-1 ${
                filter === f
                  ? "bg-violet/20 text-violet"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {f === "all" ? "All" : `Attention${attentionCount ? ` (${attentionCount})` : ""}`}
            </button>
          ))}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/60 hover:bg-white/10"
          >
            <RefreshCw size={13} />
            Updated {formatRelativeTime(data.fetchedAt)}
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-2.5">
        <Stat label="Agents healthy" value={data.rollup.agents_ok} />
        <Stat label="Degraded" value={data.rollup.agents_degraded} tone="warn" />
        <Stat label="Down" value={data.rollup.agents_down} tone="bad" />
        <Stat label="Overdue" value={data.rollup.overdue} tone="bad" />
        <Stat label="Due this week" value={data.rollup.due_soon} tone="warn" />
      </div>

      {allClear && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3">
          <CircleCheck size={15} className="shrink-0 text-emerald-300" />
          <p className="text-sm text-white/75">
            All agents healthy, all commitments on schedule.
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-5">
        {companies.length === 0 ? (
          <p className="rounded-lg border border-white/10 px-5 py-8 text-center text-sm text-white/40">
            Nothing needs attention.
          </p>
        ) : (
          companies.map((co) => (
            <section
              key={co.company_id}
              className="overflow-hidden rounded-lg border border-white/10"
            >
              <div
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 px-5 py-3 ${
                  co.attention ? "bg-red-400/[0.08]" : "bg-white/[0.04]"
                }`}
              >
                <StateIcon state={co.state} size={15} />
                <h2 className="text-sm font-semibold text-white">{co.company_name}</h2>
                <span className="text-xs text-white/35">
                  {co.agents.length} agent{co.agents.length > 1 ? "s" : ""}
                </span>
                <span className="flex-1" />
                <span
                  className={`text-xs ${co.attention ? "text-red-300" : "text-white/40"}`}
                >
                  {co.attention
                    ? "needs attention"
                    : co.next_due
                      ? `next deliverable ${dueLabel(co.next_due)?.text ?? co.next_due}`
                      : "all healthy"}
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {co.agents.map((a) => (
                  <AgentRow key={a.agent_key} agent={a} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Recent work — where did we leave off, repo by repo. Only rendered on
          the unfiltered view: it's orientation, not triage. */}
      {filter === "all" && (data.repos?.length ?? 0) > 0 && (
        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Recent work
            </h2>
            <span className="text-[11px] text-white/25">
              local repos · commits last 14 days
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="divide-y divide-white/5">
              {data.repos!.map((r) => (
                <div
                  key={r.repo}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 hover:bg-white/[0.03]"
                >
                  <span className="min-w-40 font-mono text-[13px] text-white">
                    {r.repo}
                  </span>
                  <ActivityTrace
                    buckets={r.daily_commits.length ? r.daily_commits : new Array(14).fill(0)}
                    unit="day"
                    noun="commit"
                  />
                  <span
                    className="hidden max-w-72 truncate text-xs text-white/45 lg:inline"
                    title={r.last_commit_subject ?? undefined}
                  >
                    {r.last_commit_subject}
                  </span>
                  <span className="flex-1" />
                  {r.dirty_files > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-2 py-0.5 text-[11px] text-amber-300/90"
                      title={`${r.dirty_files} uncommitted file${r.dirty_files === 1 ? "" : "s"}`}
                    >
                      {r.dirty_files} uncommitted
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-white/40">
                    {r.last_commit_at ? formatRelativeTime(r.last_commit_at) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
