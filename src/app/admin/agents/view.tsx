"use client";

// Presentational layer for the Agents page. page.tsx feeds it live data;
// /dev/mc-preview feeds it fixtures so the design can be seen and iterated
// without an admin session.

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CircleCheck, CircleAlert, ChevronRight, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Badge,
  Button,
  DataTable,
  Panel,
  PanelRows,
  SectionHeader,
  Segmented,
  type Column,
  type Tone,
} from "@/components/ui";

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

// ---------- helpers ----------

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3";

const STATE_TONE: Record<ProcessState, Tone> = {
  ok: "good",
  degraded: "warn",
  down: "bad",
  paused: "neutral",
};

const PILL_BG: Record<ProcessState, string> = {
  ok: "bg-good",
  degraded: "bg-warn",
  down: "bg-bad",
  paused: "bg-line-strong",
};

function StateIcon({ state, size = 14 }: { state: ProcessState; size?: number }) {
  if (state === "paused") return <PauseCircle size={size} className="shrink-0 text-ink-3" />;
  if (state === "ok") return <CircleCheck size={size} className="shrink-0 text-good" />;
  return <CircleAlert size={size} className={cn("shrink-0", state === "down" ? "text-bad" : "text-warn")} />;
}

// One segment per counted process — the row's health at a glance. Paused
// processes render narrower and dimmer so they read as "present, off".
function ProcessStrip({ processes }: { processes: ProcessRow[] }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {processes.map((p) => (
        <span
          key={p.key}
          title={`${p.label} — ${p.state}${p.detail ? ` · ${p.detail}` : ""}`}
          className={cn("h-1.5 rounded-full", p.counted ? "w-4" : "w-2", PILL_BG[p.state])}
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
            className={cn("w-[5px] rounded-[1px]", n === 0 ? "bg-line" : i === buckets.length - 1 ? "bg-accent" : "bg-accent/40")}
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

const COMMITMENT_TONE: Record<string, { tone: Tone; label: string }> = {
  OVERDUE: { tone: "bad", label: "Overdue" },
  DUE_SOON: { tone: "warn", label: "Due soon" },
  on_track: { tone: "good", label: "On track" },
  delivered: { tone: "good", label: "Delivered" },
  see_canaries: { tone: "neutral", label: "Continuous" },
  unscheduled: { tone: "neutral", label: "Unscheduled" },
};

function CommitmentChip({ c }: { c: CommitmentRow }) {
  const s = COMMITMENT_TONE[c.status] ?? COMMITMENT_TONE.unscheduled;
  return (
    <Badge tone={s.tone} size="sm">
      {s.label}
    </Badge>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const hot = value > 0 && tone;
  return (
    <div className="px-4 py-3">
      <p className={cn("text-[22px] font-semibold tabular-nums leading-tight", hot ? (tone === "bad" ? "text-bad" : "text-warn") : "text-ink")}>
        {value}
      </p>
      <p className={LABEL}>{label}</p>
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

  const dueChip = agent.commitments.find((c) => c.status === "OVERDUE" || c.status === "DUE_SOON");
  const nextRecurring = agent.commitments.find((c) => c.kind === "recurring" && c.next_due);
  const due = nextRecurring ? dueLabel(nextRecurring.next_due) : null;
  const hasActivity = agent.activity.some((n) => n > 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 text-left hover:bg-surface-2",
          open && "bg-surface-2",
        )}
      >
        <ChevronRight size={14} className={cn("shrink-0 text-ink-3 transition-transform", open && "rotate-90")} />
        <StateIcon state={agent.state} />
        <span className="min-w-44 truncate text-sm font-medium text-ink">{agent.display_name}</span>
        <ProcessStrip processes={agent.processes} />
        <Badge tone={agent.healthy === agent.total ? "neutral" : STATE_TONE[agent.state]} size="sm">
          {agent.healthy}/{agent.total} healthy
        </Badge>
        <span className="flex-1" />
        {dueChip ? (
          <CommitmentChip c={dueChip} />
        ) : due ? (
          <span className={cn("text-sub", due.tone === "warn" ? "text-warn" : "text-ink-3")}>report {due.text}</span>
        ) : null}
      </button>

      {open && (
        <div className="ml-7 border-l border-line px-6 pb-4 pt-1 md:ml-9">
          <div className="flex flex-col gap-2">
            {agent.processes.map((p) => (
              <div key={p.key} className="flex items-center gap-2.5 text-sm">
                <StateIcon state={p.state} size={13} />
                <span className={p.state === "paused" ? "text-ink-3" : "text-ink"}>{p.label}</span>
                <span
                  className={cn(
                    "text-sub",
                    p.state === "ok" || p.state === "paused" ? "text-ink-3" : p.state === "down" ? "text-bad" : "text-warn",
                  )}
                >
                  {p.detail}
                </span>
              </div>
            ))}
          </div>

          {hasActivity && (
            <div className="mt-3.5">
              <p className={cn(LABEL, "mb-1.5")}>Runs · last 24h</p>
              <ActivityTrace buckets={agent.activity} unit="hour" noun="run" />
            </div>
          )}

          {agent.commitments.length > 0 && (
            <div className="mt-3.5 border-t border-line pt-3">
              <p className={cn(LABEL, "mb-2")}>Commitments</p>
              <div className="flex flex-col gap-1.5">
                {agent.commitments.map((c) => {
                  const d = dueLabel(c.next_due);
                  return (
                    <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                      <span className="text-ink">{c.name}</span>
                      <CommitmentChip c={c} />
                      {d && (
                        <span className={cn("text-sub", d.tone === "bad" ? "text-bad" : d.tone === "warn" ? "text-warn" : "text-ink-3")}>
                          {d.text}
                        </span>
                      )}
                      {c.last_delivered && (
                        <span className="text-sub text-ink-3">delivered {formatRelativeTime(c.last_delivered)}</span>
                      )}
                      {c.notes?.startsWith("BLOCKED") && <span className="text-sub text-warn">blocked on customer</span>}
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

export default function AgentsView({ data, onRefresh }: { data: MissionData; onRefresh?: () => void }) {
  const [filter, setFilter] = useState<"all" | "attention">("all");

  const attentionCount = useMemo(
    () => data.companies.flatMap((c) => c.agents).filter((a) => a.attention).length,
    [data],
  );

  const companies = useMemo(() => {
    if (filter === "all") return data.companies;
    return data.companies.filter((c) => c.attention).map((c) => ({ ...c, agents: c.agents.filter((a) => a.attention) }));
  }, [data, filter]);

  const allClear = attentionCount === 0 && data.rollup.overdue === 0 && data.rollup.due_soon === 0;

  const repoColumns: Column<RepoRow>[] = [
    {
      key: "repo",
      header: "Repo",
      render: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-ui-mono text-xs text-ink-2">{r.repo}</span>
          {r.branch && <span className="truncate text-sub text-ink-3">{r.branch}</span>}
        </span>
      ),
    },
    {
      key: "activity",
      header: "Commits · 14d",
      width: "160px",
      render: (r) => <ActivityTrace buckets={r.daily_commits.length ? r.daily_commits : new Array(14).fill(0)} unit="day" noun="commit" />,
    },
    {
      key: "subject",
      header: "Latest commit",
      hideBelow: "lg",
      render: (r) => (
        <span className="block max-w-xs truncate text-sub text-ink-2" title={r.last_commit_subject ?? undefined}>
          {r.last_commit_subject ?? "—"}
        </span>
      ),
    },
    {
      key: "dirty",
      header: "",
      width: "130px",
      render: (r) =>
        r.dirty_files > 0 ? (
          <Badge tone="warn" size="sm">
            {r.dirty_files} uncommitted
          </Badge>
        ) : null,
    },
    {
      key: "when",
      header: "Updated",
      align: "right",
      width: "90px",
      render: (r) => <span className="text-sub tabular-nums text-ink-3">{r.last_commit_at ? formatRelativeTime(r.last_commit_at) : "—"}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agents"
        actions={
          <>
            <Segmented<"all" | "attention">
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter agents"
              options={[
                { value: "all", label: "All" },
                { value: "attention", label: "Attention", count: attentionCount || null },
              ]}
            />
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw size={13} />
                Updated {formatRelativeTime(data.fetchedAt)}
              </Button>
            )}
          </>
        }
      />

      <Panel className="grid grid-cols-5 divide-x divide-line">
        <Stat label="Agents healthy" value={data.rollup.agents_ok} />
        <Stat label="Degraded" value={data.rollup.agents_degraded} tone="bad" />
        <Stat label="Down" value={data.rollup.agents_down} tone="bad" />
        <Stat label="Overdue" value={data.rollup.overdue} tone="bad" />
        <Stat label="Due this week" value={data.rollup.due_soon} tone="warn" />
      </Panel>

      {allClear && (
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-2">
          <CircleCheck size={15} className="text-good" />
          All agents healthy, all commitments on schedule.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {companies.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-5 py-8 text-center text-sub text-ink-3">Nothing needs attention.</div>
        ) : (
          companies.map((co) => {
            const downCount = co.agents.filter((a) => a.attention).length;
            return (
              <section key={co.company_id}>
                <SectionHeader
                  title={co.company_name}
                  count={`${co.agents.length} agent${co.agents.length === 1 ? "" : "s"}`}
                  sub={downCount > 0 ? `${downCount} down` : "all healthy"}
                />
                <Panel>
                  <PanelRows>
                    {co.agents.map((a) => (
                      <AgentRow key={a.agent_key} agent={a} />
                    ))}
                  </PanelRows>
                </Panel>
              </section>
            );
          })
        )}
      </div>

      {/* Recent work — where did we leave off, repo by repo. Only rendered on
          the unfiltered view: it's orientation, not triage. */}
      {filter === "all" && (data.repos?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Recent work" sub="local repos · commits last 14 days" />
          <DataTable columns={repoColumns} rows={data.repos!} rowKey={(r) => r.repo} />
        </section>
      )}
    </div>
  );
}
