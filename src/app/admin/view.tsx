"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Flag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { isWebUrl } from "@/lib/crm/links";
import {
  Badge,
  Button,
  ButtonLink,
  OutlineBadge,
  Panel,
  PanelFooter,
  PanelRows,
  SearchInput,
  SectionHeader,
  Segmented,
  StatusBadge,
} from "@/components/ui";
import type {
  CommandAgent,
  CommandClient,
  CommandDeal,
  CommandProspect,
  CommandResponse,
  CommandStage,
  QueueItem,
} from "@/app/api/command/route";

// ---------- helpers ----------

const money = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const relTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return shortDate(iso);
};

const relSecs = (s: number | null) => {
  if (s === null) return "never";
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  if (s < 129_600) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86_400)}d`;
};

const LINK_KIND_LABEL: Record<string, string> = {
  audit: "Audit",
  proposal: "Proposal",
  report: "Report",
  website: "Website",
  ads_plan: "Ads plan",
  contract: "Contract",
  onboarding: "Onboard",
  dossier: "Dossier",
  code: "Code",
  other: "Doc",
};

/** Who did the latest thing — only agent work gets a badge; payments read fine as plain text. */
const actor = (by: string | null | undefined): { label: string; tone: "accent" } | null => {
  if (!by) return null;
  const b = by.toLowerCase();
  if (b.includes("agent") || b.includes("delivery")) return { label: "Agent", tone: "accent" };
  return null;
};

const label = "text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3";

// ---------- summary line ----------

function SummaryLine({ data }: { data: CommandResponse }) {
  const { kpis, agents, agentsAvailable, revenue } = data;
  const stale = agents.filter((a) => a.stale).length;
  const stats: { val: string; lbl: string; tone?: "good" | "bad" }[] = [
    { val: money(kpis.mrr), lbl: "/ mo locked" },
    { val: String(kpis.customers), lbl: kpis.customers === 1 ? "customer" : "customers" },
    { val: money(revenue.rollup.pendingMrr), lbl: `in pipeline · ${kpis.openDeals} ${kpis.openDeals === 1 ? "deal" : "deals"}` },
    { val: String(kpis.engagingProspects7d), lbl: "reading reports this week" },
  ];
  if (agentsAvailable && agents.length > 0) {
    stats.push({
      val: `${agents.length - stale} / ${agents.length}`,
      lbl: "agents healthy",
      tone: stale > 0 ? "bad" : "good",
    });
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
      {stats.map((s, i) => (
        <span key={i} className="flex items-baseline gap-1.5">
          <b
            className={cn(
              "text-[22px] font-semibold tracking-[-0.02em] tabular-nums",
              s.tone === "good" ? "text-good" : s.tone === "bad" ? "text-bad" : "text-ink",
            )}
          >
            {s.val}
          </b>
          <span className="text-sub text-ink-2">{s.lbl}</span>
        </span>
      ))}
    </div>
  );
}

// ---------- needs you ----------

function NeedsYou({ queue }: { queue: QueueItem[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(() => queue.filter((q) => !dismissed.has(q.key)), [queue, dismissed]);
  if (queue.length === 0) return null;

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key));
    void fetch("/api/command/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => {});
  };

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink-2">
        <Flag size={15} className="text-good" />
        Nothing needs you right now.
      </div>
    );
  }

  const crit = visible.filter((q) => q.severity === "crit").length;
  const shown = showAll ? visible : visible.slice(0, 3);

  return (
    <Panel className={cn("border-l-[3px]", crit > 0 ? "border-l-bad" : "border-l-warn")}>
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Flag size={15} className={crit > 0 ? "text-bad" : "text-warn"} />
        <h2 className="text-sm font-semibold text-ink">Needs you</h2>
        <span className="text-sub tabular-nums text-ink-3">
          {visible.length} {visible.length === 1 ? "item" : "items"}
          {crit > 0 && <span className="ml-1.5 font-medium text-bad">{crit} urgent</span>}
        </span>
        {visible.length > 3 && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all ${visible.length}`}
          </Button>
        )}
      </div>
      <PanelRows className="border-t border-line">
        {shown.map((q) => (
          <div key={q.key} className="flex items-center gap-3 px-4 py-2.5">
            <span
              aria-hidden
              className={cn("h-2 w-2 shrink-0 rounded-full", q.severity === "crit" ? "bg-bad" : "bg-warn")}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">{q.action}</div>
              <div className="truncate text-sub text-ink-2">{q.why}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {q.accountId && (
                <ButtonLink href={`/admin/clients/${q.accountId}`} size="sm">
                  Open client
                </ButtonLink>
              )}
              {q.dealId && !q.accountId && (
                <ButtonLink href={`/admin/pipeline?deal=${q.dealId}`} size="sm">
                  Open deal
                </ButtonLink>
              )}
              <Button variant="ghost" size="sm" onClick={() => dismiss(q.key)} title="Hide this for 14 days">
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </PanelRows>
    </Panel>
  );
}

// ---------- clients ----------

type ClientFilter = "all" | "attention" | "active" | "onboarding";

// Literal strings so Tailwind can see them (no runtime concatenation).
const CLIENT_COLS = "md:grid-cols-[minmax(0,1.5fr)_110px_120px_minmax(0,1.6fr)_20px]";

function ClientRows({ clients, queue }: { clients: CommandClient[]; queue: QueueItem[] }) {
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [q, setQ] = useState("");

  const attentionIds = useMemo(
    () => new Set(queue.map((x) => x.accountId).filter(Boolean) as string[]),
    [queue],
  );
  const attentionCount = clients.filter((c) => attentionIds.has(c.accountId) || c.status !== "active").length;

  const shown = useMemo(() => {
    let list = clients;
    if (filter === "attention") list = list.filter((c) => attentionIds.has(c.accountId) || c.status !== "active");
    if (filter === "active") list = list.filter((c) => c.status === "active");
    if (filter === "onboarding") list = list.filter((c) => c.status === "onboarding");
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          (c.contactName ?? "").toLowerCase().includes(needle) ||
          c.services.some((s) => s.toLowerCase().includes(needle)),
      );
    }
    return list;
  }, [clients, filter, q, attentionIds]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const totalMrr = clients.reduce((s, c) => s + (c.mrr ?? 0), 0);

  return (
    <section>
      <SectionHeader title="Clients" count={`${clients.length} · ${money(totalMrr)} / mo`}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter clients…" width="200px" />
        <Segmented<ClientFilter>
          value={filter}
          onChange={setFilter}
          ariaLabel="Client filter"
          options={[
            { value: "all", label: "All" },
            { value: "attention", label: "Attention", count: attentionCount || null },
            { value: "active", label: "Active" },
            { value: "onboarding", label: "Onboarding" },
          ]}
        />
      </SectionHeader>

      <Panel>
        <div className={cn("hidden h-9 items-center gap-3 border-b border-line px-4 md:grid", CLIENT_COLS)}>
          <span className={label}>Client</span>
          <span className={label}>Status</span>
          <span className={cn(label, "text-right")}>MRR</span>
          <span className={label}>Latest activity</span>
          <span />
        </div>
        <PanelRows>
          {shown.length === 0 && <div className="px-4 py-8 text-center text-sub text-ink-3">No clients match.</div>}
          {shown.map((c) => {
            const isOpen = open.has(c.accountId);
            const who = actor(c.latest?.by);
            return (
              <div key={c.accountId}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggle(c.accountId)}
                  onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && toggle(c.accountId)}
                  className={cn(
                    "grid min-h-10 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-3 px-4 py-2 text-left hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                    CLIENT_COLS,
                    isOpen && "bg-surface-2",
                  )}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <Link
                      href={`/admin/clients/${c.accountId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-full shrink-0 truncate text-sm font-medium text-ink hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="hidden min-w-0 truncate text-sub text-ink-3 md:inline">
                      {[c.contactName, c.services.join(", ")].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="hidden md:block">
                    <StatusBadge kind="account" value={c.status} />
                  </span>
                  <span className="flex items-baseline justify-end whitespace-nowrap text-sm font-medium tabular-nums text-ink">
                    {money(c.mrr)}
                    <span className="font-normal text-ink-3">/mo</span>
                    {/* fixed-width slot so the numbers stay aligned whether or not the dot shows */}
                    <span
                      className={cn("ml-1.5 inline-block w-2.5 text-center leading-none", c.billingSetUp ? "invisible" : "text-warn")}
                      title={c.billingSetUp ? undefined : "Billing not set up"}
                      aria-hidden={c.billingSetUp}
                    >
                      ●
                    </span>
                  </span>
                  <span className="hidden min-w-0 items-center gap-2 text-sub text-ink-2 md:flex">
                    {who && (
                      <Badge tone={who.tone} size="sm">
                        {who.label}
                      </Badge>
                    )}
                    <span className="truncate">{c.latest?.text ?? (c.status === "onboarding" ? "Kickoff pending" : "—")}</span>
                    {c.latest?.at && <span className="shrink-0 text-ink-3">{relTime(c.latest.at)}</span>}
                  </span>
                  <ChevronRight size={14} className={cn("text-ink-3 transition-transform", isOpen && "rotate-90")} />
                </div>

                {isOpen && (
                  <div className="grid grid-cols-1 border-t border-dashed border-line bg-ground md:grid-cols-3 md:divide-x md:divide-line">
                    <div className="px-4 py-3">
                      <div className={cn(label, "mb-1.5 flex justify-between")}>
                        <span>Docs &amp; links</span>
                        <span>{c.links.length}</span>
                      </div>
                      {c.links.length === 0 && <div className="text-sub text-ink-3">Nothing attached yet.</div>}
                      {c.links.map((l) => (
                        <a
                          key={l.id}
                          // Local paths can't open from the browser; show them as inert rows.
                          href={isWebUrl(l.url) ? l.url : undefined}
                          title={isWebUrl(l.url) ? undefined : l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group -mx-1.5 flex items-center gap-2 rounded px-1.5 py-1 hover:bg-surface"
                        >
                          <span className="w-16 shrink-0 rounded bg-surface-2 px-1 py-px text-center text-[11px] text-ink-2">
                            {LINK_KIND_LABEL[l.kind] ?? l.kind}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sub text-ink group-hover:underline">{l.title}</span>
                          <span className="shrink-0 text-xs tabular-nums text-ink-3">{l.views !== null ? `${l.views} views` : ""}</span>
                          <ExternalLink size={12} className="shrink-0 text-ink-3" />
                        </a>
                      ))}
                    </div>
                    <div className="px-4 py-3">
                      <div className={cn(label, "mb-1.5 flex justify-between")}>
                        <span>Commitments</span>
                        <span>{c.commitments.length} active</span>
                      </div>
                      {c.commitments.length === 0 && <div className="text-sub text-ink-3">None recorded.</div>}
                      {c.commitments.map((cm) => {
                        const overdue = cm.nextDue && new Date(cm.nextDue).getTime() < now;
                        const unanchored = cm.kind === "recurring" && !cm.nextDue;
                        return (
                          <div key={cm.id} className="flex items-center gap-2 py-1 text-sub">
                            <span
                              aria-hidden
                              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", overdue ? "bg-bad" : unanchored ? "bg-warn" : "bg-good")}
                            />
                            <span className="min-w-0 flex-1 truncate text-ink">{cm.name}</span>
                            <span className={cn("shrink-0 text-xs tabular-nums", overdue ? "text-bad" : "text-ink-3")}>
                              {cm.nextDue ? shortDate(cm.nextDue) : unanchored ? "not anchored" : cm.kind}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4 py-3">
                      <div className={cn(label, "mb-1.5")}>Account</div>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sub">
                        <dt className="text-ink-3">Billing</dt>
                        <dd className={cn("truncate", c.billingSetUp ? "text-ink" : "font-medium text-warn")}>
                          {c.billingSetUp ? "Stripe active" : "Not set up"}
                        </dd>
                        <dt className="text-ink-3">Setup fee</dt>
                        <dd className="truncate text-ink">{c.setupFeePaidAt ? `Paid ${shortDate(c.setupFeePaidAt)}` : "—"}</dd>
                        <dt className="text-ink-3">Next due</dt>
                        <dd className="truncate text-ink">{c.nextDue ? shortDate(c.nextDue) : c.status === "onboarding" ? "Kickoff" : "—"}</dd>
                        <dt className="text-ink-3">Since</dt>
                        <dd className="truncate text-ink">{shortDate(c.customerSince)}</dd>
                        <dt className="text-ink-3">Contact</dt>
                        <dd className="truncate text-ink">{c.contactEmail ?? "—"}</dd>
                      </dl>
                      <ButtonLink href={`/admin/clients/${c.accountId}`} size="sm" className="mt-2.5">
                        Open client →
                      </ButtonLink>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </PanelRows>
      </Panel>
    </section>
  );
}

// ---------- pipeline ----------

function Pipeline({ stages, deals }: { stages: CommandStage[]; deals: CommandDeal[] }) {
  const [view, setView] = useState<"open" | "all">("open");
  const [now] = useState(() => Date.now());
  const list = deals.filter((d) => (view === "all" ? true : !d.isClosed || d.stage === "Won"));
  const openCount = deals.filter((d) => !d.isClosed).length;
  const wonCount = deals.filter((d) => d.stage === "Won").length;
  const openValue = deals.filter((d) => !d.isClosed).reduce((s, d) => s + (d.amount ?? 0), 0);
  const total = stages.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <section>
      <SectionHeader title="Pipeline" count={`${openCount} open · ${money(openValue)}${wonCount ? ` · ${wonCount} won` : ""}`}>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "open", label: "Open + won" },
            { value: "all", label: "Include lost" },
          ]}
        />
        <ButtonLink href="/admin/pipeline" size="sm" variant="ghost">
          Open board →
        </ButtonLink>
      </SectionHeader>
      <Panel>
        <div className="flex h-1 overflow-hidden bg-surface-2" title="Share of deals by stage">
          {stages
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.name}
                className={s.name === "Won" ? "bg-good" : s.isClosed ? "bg-line-strong" : "bg-accent/60"}
                style={{ width: `${(s.count / total) * 100}%` }}
                title={`${s.name}: ${s.count}`}
              />
            ))}
        </div>
        <PanelRows>
          {list.length === 0 && <div className="px-4 py-8 text-center text-sub text-ink-3">Nothing in the pipeline.</div>}
          {list.map((d) => {
            const hot = d.lastViewed && now - new Date(d.lastViewed).getTime() < 3 * 86_400_000;
            const href = d.accountId ? `/admin/clients/${d.accountId}` : `/admin/pipeline?deal=${d.id}`;
            return (
              <Link
                key={d.id}
                href={href}
                className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto_84px] items-center gap-3 px-4 py-2 hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-sm font-medium text-ink">{d.name}</span>
                  {d.views !== null && (
                    <span className={cn("hidden shrink-0 text-xs tabular-nums lg:inline", hot ? "font-medium text-good" : "text-ink-3")}>
                      {d.views} views · {relTime(d.lastViewed)}
                    </span>
                  )}
                </span>
                <Badge tone={d.stage === "Won" ? "good" : d.isClosed ? "neutral" : "neutral"} size="sm">
                  {d.stage}
                </Badge>
                <span className="text-right text-sm font-medium tabular-nums text-ink">{d.amount ? money(d.amount) : <span className="font-normal text-ink-3">TBD</span>}</span>
              </Link>
            );
          })}
        </PanelRows>
      </Panel>
    </section>
  );
}

// ---------- warm now ----------

function WarmNow({ prospects }: { prospects: CommandProspect[] }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? prospects : prospects.slice(0, 8);
  return (
    <section>
      <SectionHeader title="Warm right now" sub="reading reports">
        {prospects.length > 8 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Top 8" : `All ${prospects.length}`}
          </Button>
        )}
      </SectionHeader>
      <Panel>
        <PanelRows>
          {list.length === 0 && <div className="px-4 py-8 text-center text-sub text-ink-3">No report views yet.</div>}
          {list.map((p) => {
            const inner = (
              <>
                <span
                  className={cn(
                    "w-9 shrink-0 rounded py-0.5 text-center text-xs font-semibold tabular-nums",
                    p.viewedLast7d ? "bg-good-soft text-good" : "bg-surface-2 text-ink-2",
                  )}
                >
                  {p.views}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {p.docs} doc{p.docs > 1 ? "s" : ""} out · opened {relTime(p.lastViewed)}
                  </span>
                </span>
                {p.hasDeal ? <Badge size="sm">In pipe</Badge> : <OutlineBadge className="h-5 text-[11px]">No deal</OutlineBadge>}
              </>
            );
            const cls = "flex items-center gap-3 px-4 py-2 hover:bg-surface-2";
            return p.contactId ? (
              <Link key={p.key} href={`/admin/people/${p.contactId}`} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={p.key} className={cls}>
                {inner}
              </div>
            );
          })}
        </PanelRows>
      </Panel>
    </section>
  );
}

// ---------- agents (one line per customer; the full fleet lives on /admin/agents) ----------

function AgentsLine({ agents, available }: { agents: CommandAgent[]; available: boolean }) {
  const stale = agents.filter((a) => a.stale);
  return (
    <section>
      <SectionHeader title="Agents" sub={!available ? "telemetry unavailable" : stale.length ? `${stale.length} silent` : "all reporting"}>
        <ButtonLink href="/admin/agents" size="sm" variant="ghost">
          Open Agents →
        </ButtonLink>
      </SectionHeader>
      <Panel>
        {!available ? (
          <div className="px-4 py-3 text-sub text-ink-3">Couldn&apos;t reach triple3-ops telemetry — fleet status unknown.</div>
        ) : agents.length === 0 ? (
          <div className="px-4 py-3 text-sub text-ink-3">No agents reporting yet.</div>
        ) : stale.length === 0 ? (
          <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-good" />
            All {agents.length} agents reporting.
          </div>
        ) : (
          <PanelRows>
            {stale.map((a) => (
              <div key={a.agentId} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-bad" />
                <span className="min-w-0 flex-1 truncate font-ui-mono text-[13px] text-ink">{a.agentId}</span>
                <span className="text-xs text-ink-3">{a.customerId}</span>
                <span className="text-xs tabular-nums text-bad">silent {relSecs(a.ageSeconds)}</span>
              </div>
            ))}
          </PanelRows>
        )}
      </Panel>
    </section>
  );
}

// ---------- on the books ----------

function RevenueGroup({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between bg-surface-2 px-4 py-1.5">
      <span className={label}>{left}</span>
      <span className={cn(label, "tabular-nums")}>{right}</span>
    </div>
  );
}

function RevenueRow({ l }: { l: CommandResponse["revenue"]["lines"][number] }) {
  const stepsDown = l.mrrMature !== null && l.mrrMature !== l.mrrNow;
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-2">
      <span className="flex min-w-0 items-baseline gap-2">
        <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 self-center rounded-full", l.bucket === "locked" ? "bg-good" : "bg-line-strong")} />
        <span className="truncate text-sm text-ink">{l.name}</span>
        <span className="shrink-0 text-xs text-ink-3">
          {l.bucket === "locked" ? (l.termMonths ? `${l.termMonths}-mo retainer` : "Active") : l.stage}
        </span>
      </span>
      <span className="text-right text-sm tabular-nums">
        <span className="font-medium text-ink">{money(l.mrrNow)}</span>
        <span className="text-ink-3">/mo</span>
        {stepsDown && <span className="ml-1.5 text-xs text-ink-3">→ {money(l.mrrMature)}</span>}
      </span>
    </div>
  );
}

function RevenueTable({ revenue }: { revenue: CommandResponse["revenue"] }) {
  const { lines, rollup } = revenue;
  const locked = lines.filter((l) => l.bucket === "locked").sort((a, b) => b.mrrNow - a.mrrNow);
  const pending = lines.filter((l) => l.bucket === "pending").sort((a, b) => b.mrrNow - a.mrrNow);

  return (
    <section>
      <SectionHeader
        title="On the books"
        sub={
          <>
            <b className="font-medium text-good">{money(rollup.lockedMrr)}</b> locked · <b className="font-medium text-ink">{money(rollup.pendingMrr)}</b> pending ·{" "}
            <b className="font-medium text-ink">{money(rollup.potentialArr)}</b> potential ARR
          </>
        }
      />
      <Panel>
        <PanelRows>
          <RevenueGroup left={`Active · ${rollup.activeClients}`} right={money(rollup.lockedMrr)} />
          {locked.length === 0 && <div className="px-4 py-3 text-center text-sub text-ink-3">No active clients yet.</div>}
          {locked.map((l) => (
            <RevenueRow key={`l-${l.name}`} l={l} />
          ))}
          <RevenueGroup left={`Pipeline · ${rollup.openDeals} pending`} right={money(rollup.pendingMrr)} />
          {pending.length === 0 && <div className="px-4 py-3 text-center text-sub text-ink-3">Nothing in the pipeline.</div>}
          {pending.map((l) => (
            <RevenueRow key={`p-${l.name}`} l={l} />
          ))}
        </PanelRows>
        <PanelFooter>
          <span className="font-medium text-ink">Total potential</span>
          <span className="text-sm tabular-nums">
            <b className="font-semibold text-ink">{money(rollup.totalPotentialMrr)}</b>
            <span className="text-ink-3">/mo</span>
          </span>
        </PanelFooter>
      </Panel>
    </section>
  );
}

// ---------- root ----------

export default function HomeView({ data }: { data: CommandResponse }) {
  return (
    <div className="flex flex-col gap-6">
      <SummaryLine data={data} />
      <NeedsYou queue={data.queue} />
      <ClientRows clients={data.clients} queue={data.queue} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Pipeline stages={data.stages} deals={data.deals} />
        <div className="flex flex-col gap-6">
          <WarmNow prospects={data.prospects} />
          <AgentsLine agents={data.agents} available={data.agentsAvailable} />
        </div>
      </div>
      <RevenueTable revenue={data.revenue} />
      <p className="text-center text-xs text-ink-3">
        Tell Zeke in Pingo to update any of this — move deals, log deliveries, attach links.
      </p>
    </div>
  );
}
