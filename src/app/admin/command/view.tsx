"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Flag, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  CommandAgent,
  CommandClient,
  CommandDeal,
  CommandProspect,
  CommandResponse,
  CommandStage,
  QueueItem,
} from "@/app/api/command/route";

// ---------- small helpers ----------

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

// Short age for machine heartbeats, where "today" is uselessly coarse.
const relSecs = (s: number | null) => {
  if (s === null) return "never";
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  if (s < 129_600) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86_400)}d`;
};

// Status is genuine state → keep color. Everything else on the page is neutral,
// so these three colors actually mean something at a glance.
const STATUS_PILL: Record<CommandClient["status"], { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "text-emerald-300 bg-emerald-400/10", dot: "bg-emerald-400" },
  onboarding: { label: "Onboard", cls: "text-amber-300 bg-amber-400/10", dot: "bg-amber-400" },
  at_risk: { label: "At risk", cls: "text-red-300 bg-red-400/10", dot: "bg-red-400" },
};

const LINK_KIND_LABEL: Record<string, string> = {
  audit: "Audit",
  proposal: "Proposal",
  report: "Report",
  website: "Website",
  ads_plan: "Ads plan",
  contract: "Contract",
  onboarding: "Onboard",
  other: "Doc",
};

const label = "text-[10px] font-semibold uppercase tracking-wider text-white/30";
const heading = { fontFamily: "var(--font-space-grotesk)" };

// ---------- summary line (replaces the 5-tile KPI strip) ----------

function SummaryLine({ kpis }: { kpis: CommandResponse["kpis"] }) {
  const stats: { val: string; lbl: string }[] = [
    { val: money(kpis.mrr), lbl: "/mo" },
    { val: String(kpis.customers), lbl: kpis.customers === 1 ? "customer" : "customers" },
    { val: String(kpis.openDeals), lbl: "in pipeline" },
    { val: String(kpis.engagingProspects7d), lbl: "reading reports" },
  ];
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-white/45">
      {stats.map((s, i) => (
        <span key={i} className="flex items-baseline gap-1.5">
          {i > 0 && <span className="mr-3.5 h-3 w-px bg-white/10" />}
          <b className="text-[15px] font-semibold tabular-nums text-white" style={heading}>
            {s.val}
          </b>
          {s.lbl}
        </span>
      ))}
    </div>
  );
}

// ---------- on the books (MRR by client: active on top, pending beneath) ----------

function RevenueTable({ revenue }: { revenue: CommandResponse["revenue"] }) {
  const { lines, rollup } = revenue;
  const locked = lines.filter((l) => l.bucket === "locked").sort((a, b) => b.mrrNow - a.mrrNow);
  const pending = lines.filter((l) => l.bucket === "pending").sort((a, b) => b.mrrNow - a.mrrNow);

  const GroupHeader = ({ left, right }: { left: string; right: string }) => (
    <div className="flex items-center justify-between bg-white/[0.03] px-5 py-1.5">
      <span className={label}>{left}</span>
      <span className={label}>{right}</span>
    </div>
  );

  const Row = ({ l }: { l: CommandResponse["revenue"]["lines"][number] }) => {
    const stepsDown = l.mrrMature !== null && l.mrrMature !== l.mrrNow;
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-2.5 hover:bg-white/[0.03]">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              l.bucket === "locked" ? "bg-emerald-400" : "bg-white/25",
            )}
          />
          <span className="truncate text-[13px] text-white/90">{l.name}</span>
          <span className="shrink-0 text-[11px] text-white/35">
            {l.bucket === "locked"
              ? l.termMonths
                ? `${l.termMonths}-mo retainer`
                : "Active"
              : l.stage}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[13px] font-semibold tabular-nums text-white" style={heading}>
            {money(l.mrrNow)}
          </span>
          <span className="text-[11px] text-white/40">/mo</span>
          {stepsDown && (
            <span className="ml-1.5 text-[11px] text-white/30">→ {money(l.mrrMature)}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          On the books
        </h2>
        <div className="h-px min-w-6 flex-1 bg-white/10" />
        <span className="text-[12px] text-white/45">
          <b className="font-semibold text-emerald-300">{money(rollup.lockedMrr)}</b> locked
          <span className="mx-2 text-white/20">·</span>
          <b className="font-semibold text-white/70">{money(rollup.pendingMrr)}</b> pending
          <span className="mx-2 text-white/20">·</span>
          <b className="font-semibold text-white/70">{money(rollup.potentialArr)}</b> potential ARR
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="divide-y divide-white/[0.06]">
          <GroupHeader left={`Active · ${rollup.activeClients}`} right={money(rollup.lockedMrr)} />
          {locked.length === 0 && (
            <div className="px-5 py-4 text-center text-[13px] text-white/30">No active clients yet.</div>
          )}
          {locked.map((l) => (
            <Row key={`l-${l.name}`} l={l} />
          ))}

          <GroupHeader left={`Pipeline · ${rollup.openDeals} pending`} right={money(rollup.pendingMrr)} />
          {pending.length === 0 && (
            <div className="px-5 py-4 text-center text-[13px] text-white/30">Nothing in the pipeline.</div>
          )}
          {pending.map((l) => (
            <Row key={`p-${l.name}`} l={l} />
          ))}

          <div className="flex items-center justify-between bg-white/[0.03] px-5 py-2.5">
            <span className="text-[13px] font-semibold text-white/80">Total potential</span>
            <span className="text-[14px] font-bold tabular-nums text-white" style={heading}>
              {money(rollup.totalPotentialMrr)}
              <span className="text-[11px] font-normal text-white/40">/mo</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- needs you (the focal point — collapsed by default, dismissible) ----------

function NeedsYou({ queue }: { queue: QueueItem[] }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(() => queue.filter((q) => !dismissed.has(q.key)), [queue, dismissed]);
  if (queue.length === 0) return null;

  const crit = visible.filter((q) => q.severity === "crit").length;

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key)); // optimistic
    void fetch("/api/command/snooze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => {
      // If the snooze didn't persist, it simply reappears on the next refresh.
    });
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        visible.length > 0 ? "border-amber-400/25" : "border-emerald-400/25",
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 px-5 py-3.5 text-left transition-colors",
          visible.length > 0
            ? "bg-amber-400/[0.05] hover:bg-amber-400/[0.09]"
            : "bg-emerald-400/[0.05] hover:bg-emerald-400/[0.09]",
        )}
      >
        <Flag size={15} className={visible.length > 0 ? "text-amber-300" : "text-emerald-300"} />
        <h2 className="text-[15px] font-semibold text-white" style={heading}>
          Needs you
        </h2>
        <span className="ml-auto text-xs tabular-nums">
          {visible.length === 0 ? (
            <span className="text-emerald-300">all clear</span>
          ) : (
            <span className="text-amber-300/85">
              {visible.length} item{visible.length > 1 ? "s" : ""}
              {crit > 0 && <span className="ml-2 font-semibold text-red-300">{crit} urgent</span>}
            </span>
          )}
        </span>
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform",
            visible.length > 0 ? "text-amber-300/60" : "text-emerald-300/60",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div>
          {visible.length === 0 && (
            <div className="border-t border-white/5 px-5 py-4 text-sm text-emerald-300/90">
              ✓ Nothing needs you right now.
            </div>
          )}
          {visible.map((q) => (
            <div
              key={q.key}
              className="flex items-center gap-3.5 border-t border-white/5 px-5 py-3 hover:bg-white/[0.015]"
            >
              <span
                className={cn(
                  "h-2 w-2 flex-none rounded-full",
                  q.severity === "crit"
                    ? "bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.12)]"
                    : "bg-amber-400",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white">{q.action}</div>
                <div className="mt-0.5 text-[12.5px] text-white/50">{q.why}</div>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                {q.accountId && (
                  <Link
                    href={`/admin/accounts/${q.accountId}`}
                    className="rounded-lg bg-violet/10 px-3 py-1.5 text-[12px] font-medium text-violet hover:bg-violet/20"
                  >
                    Open ↗
                  </Link>
                )}
                <button
                  onClick={() => dismiss(q.key)}
                  title="Hide this for 14 days"
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white/40 hover:border-red-400/30 hover:bg-red-400/[0.06] hover:text-red-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- clients ----------

type ClientFilter = "all" | "attention" | "active" | "onboarding";

function ClientRows({ clients, queue }: { clients: CommandClient[]; queue: QueueItem[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [q, setQ] = useState("");

  const attentionIds = useMemo(
    () => new Set(queue.map((x) => x.accountId).filter(Boolean) as string[]),
    [queue],
  );

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

  const chips: { key: ClientFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "attention", label: "Needs attention" },
    { key: "active", label: "Active" },
    { key: "onboarding", label: "Onboarding" },
  ];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Clients
        </h2>
        <div className="h-px min-w-6 flex-1 bg-white/10" />
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients…"
            className="w-44 rounded-full border border-white/10 bg-white/5 py-1 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-violet/50"
          />
        </div>
        <div className="flex gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px]",
                filter === c.key
                  ? "border-violet/40 bg-violet/10 font-semibold text-violet"
                  : "border-white/10 text-white/50 hover:bg-white/5",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="divide-y divide-white/[0.06]">
          {shown.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-white/30">No clients match.</div>
          )}
          {shown.map((c) => {
            const pill = STATUS_PILL[c.status];
            const isOpen = open.has(c.accountId);
            return (
              <div key={c.accountId}>
                {/* row — name+services / status / mrr / next action */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(c.accountId)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(c.accountId)}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_18px] items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_96px_96px_1.2fr_18px]",
                    isOpen && "bg-white/[0.03]",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <Link
                      href={`/admin/accounts/${c.accountId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-fit text-[15px] font-semibold text-white hover:text-violet-300 hover:underline"
                      style={heading}
                    >
                      {c.name}
                    </Link>
                    <span className="mt-0.5 truncate text-[12px] text-white/35">
                      {[c.contactName, c.services.join(", ")].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "hidden w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold md:inline-flex",
                      pill.cls,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
                    {pill.label}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-right text-[15px] font-semibold tabular-nums md:text-right",
                      c.billingSetUp ? "text-white/90" : "text-amber-300",
                    )}
                    style={heading}
                  >
                    {money(c.mrr)}
                    {!c.billingSetUp && " ⚠"}
                  </span>
                  <span className="hidden text-[12.5px] text-white/50 md:block">
                    {c.nextDue ? (
                      <>
                        <span className="text-white/30">Next</span> {shortDate(c.nextDue)}
                      </>
                    ) : c.status === "onboarding" ? (
                      <>
                        <span className="text-white/30">Next</span> Kickoff
                      </>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </span>
                  <ChevronRight
                    size={14}
                    className={cn("text-white/25 transition-transform", isOpen && "rotate-90")}
                  />
                </div>

                {/* expanded detail */}
                {isOpen && (
                  <div className="grid grid-cols-1 gap-0 border-t border-dashed border-white/10 bg-white/[0.015] md:grid-cols-3 md:divide-x md:divide-white/5">
                    <div className="px-5 py-4">
                      <div className={cn(label, "mb-2 flex justify-between")}>
                        <span>Attached docs &amp; links</span>
                        <span>{c.links.length}</span>
                      </div>
                      {c.links.length === 0 && <div className="text-xs text-white/30">Nothing attached yet.</div>}
                      {c.links.map((l) => (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/5"
                        >
                          <span className="w-16 flex-none rounded border border-white/10 bg-white/5 px-1 py-px text-center text-[9px] uppercase tracking-wide text-white/50">
                            {LINK_KIND_LABEL[l.kind] ?? l.kind}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-white/80 group-hover:text-white">
                            {l.title}
                          </span>
                          <span className="flex-none text-[10px] tabular-nums text-white/35">
                            {l.views !== null ? `${l.views} views` : ""}
                          </span>
                          <ExternalLink size={11} className="flex-none text-white/25" />
                        </a>
                      ))}
                    </div>
                    <div className="px-5 py-4">
                      <div className={cn(label, "mb-2 flex justify-between")}>
                        <span>Commitments</span>
                        <span>{c.commitments.length} active</span>
                      </div>
                      {c.commitments.map((cm) => (
                        <div key={cm.id} className="flex items-center gap-2 py-0.5 text-xs">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 flex-none rounded-full",
                              cm.kind === "recurring" && !cm.nextDue
                                ? "bg-amber-400"
                                : cm.nextDue && new Date(cm.nextDue).getTime() < Date.now()
                                  ? "bg-red-400"
                                  : "bg-emerald-400",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate text-white/70">{cm.name}</span>
                          <span className="flex-none text-[10px] tabular-nums text-white/35">
                            {cm.nextDue ? shortDate(cm.nextDue) : cm.kind === "recurring" ? "not anchored" : cm.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-4">
                      <div className={cn(label, "mb-2")}>Account</div>
                      {[
                        { k: "MRR", v: c.mrr ? `${money(c.mrr)}/mo` : "—" },
                        {
                          k: "Billing",
                          v: c.billingSetUp ? "Stripe active" : "not set up",
                          warn: !c.billingSetUp,
                        },
                        { k: "Setup fee", v: c.setupFeePaidAt ? `paid ${shortDate(c.setupFeePaidAt)}` : "—" },
                        { k: "Customer since", v: shortDate(c.customerSince) },
                        { k: "Latest", v: c.latest?.text ?? "—" },
                        { k: "Contact", v: c.contactEmail ?? "—" },
                      ].map((row) => (
                        <div key={row.k} className="flex justify-between gap-3 py-0.5 text-xs">
                          <span className="flex-none text-white/40">{row.k}</span>
                          <span
                            className={cn(
                              "min-w-0 truncate text-right",
                              row.warn ? "font-medium text-amber-300" : "text-white/75",
                            )}
                          >
                            {row.v}
                          </span>
                        </div>
                      ))}
                      <Link
                        href={`/admin/accounts/${c.accountId}`}
                        className="mt-2 inline-block rounded-md bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/20"
                      >
                        Full account →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- pipeline ----------

function Pipeline({ stages, deals }: { stages: CommandStage[]; deals: CommandDeal[] }) {
  const [showClosed, setShowClosed] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const open = deals.filter((d) => (showClosed ? true : !d.isClosed || d.stage === "Won"));
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const total = deals.length || 1;
  const openCount = deals.filter((d) => !d.isClosed).length;
  const wonCount = deals.filter((d) => d.stage === "Won").length;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Pipeline
        </h2>
        <span className="text-[11px] tabular-nums text-white/30">
          {openCount} open{wonCount > 0 ? ` · ${wonCount} won` : ""}
        </span>
        <div className="h-px min-w-6 flex-1 bg-white/10" />
        <button
          onClick={() => setShowClosed((v) => !v)}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px]",
            showClosed
              ? "border-violet/40 bg-violet/10 font-semibold text-violet"
              : "border-white/10 text-white/50 hover:bg-white/5",
          )}
        >
          {showClosed ? "Showing all" : "Show lost too"}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-4 pt-3.5">
        {/* thin proportion bar — open (violet) vs won (emerald) */}
        <div className="flex h-1.5 overflow-hidden rounded-full">
          {stages
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.name}
                className={s.name === "Won" ? "bg-emerald-400" : s.isClosed ? "bg-white/15" : "bg-violet/55"}
                style={{ width: `${(s.count / total) * 100}%` }}
                title={`${s.name}: ${s.count}`}
              />
            ))}
        </div>
        <div className="divide-y divide-white/[0.06] pt-1">
          {open.map((d) => {
            const isOpen = openIds.has(d.id);
            const hot =
              d.lastViewed && Date.now() - new Date(d.lastViewed).getTime() < 3 * 86_400_000;
            return (
              <div key={d.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(d.id)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(d.id)}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto_16px] items-center gap-3 py-2.5 text-left text-[13px] hover:bg-white/[0.02]",
                  )}
                >
                  {d.accountId || d.contactId ? (
                    <Link
                      href={d.accountId ? `/admin/accounts/${d.accountId}` : `/admin/contacts/${d.contactId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate font-medium text-white hover:text-violet-300 hover:underline"
                    >
                      {d.name}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-white">{d.name}</span>
                  )}
                  <span
                    className={cn(
                      "whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider",
                      d.stage === "Won" ? "text-emerald-300" : d.isClosed ? "text-white/30" : "text-white/45",
                    )}
                  >
                    {d.stage}
                  </span>
                  <span className="whitespace-nowrap text-right text-xs tabular-nums text-white/60" style={heading}>
                    {d.amount ? money(d.amount) : "TBD"}
                  </span>
                  <ChevronRight size={13} className={cn("text-white/25 transition-transform", isOpen && "rotate-90")} />
                </div>
                {/* engagement subline — only when there are report views */}
                {d.views !== null && !isOpen && (
                  <div className="-mt-1 pb-2 text-[11px] tabular-nums text-white/30">
                    <span className={cn(hot && "font-semibold text-red-300/90")}>
                      {d.views} views · {relTime(d.lastViewed)}
                    </span>
                  </div>
                )}
                {isOpen && (
                  <div className="mb-2 grid grid-cols-1 gap-0 rounded-lg border border-dashed border-white/10 bg-white/[0.015] md:grid-cols-[1.2fr_1fr] md:divide-x md:divide-white/5">
                    <div className="px-4 py-3.5">
                      <div className={cn(label, "mb-2")}>Deal notes</div>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/60">
                        {d.description ?? "No notes."}
                      </p>
                    </div>
                    <div className="px-4 py-3.5">
                      <div className={cn(label, "mb-2 flex justify-between")}>
                        <span>Contact &amp; docs</span>
                        <span>{d.links.length} link{d.links.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="mb-2 text-xs text-white/70">
                        {d.contactName ?? "—"}
                        {d.contactEmail && !d.contactEmail.endsWith(".invalid") && (
                          <span className="ml-2 text-white/40">{d.contactEmail}</span>
                        )}
                      </div>
                      {d.links.map((l) => (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/5"
                        >
                          <span className="w-16 flex-none rounded border border-white/10 bg-white/5 px-1 py-px text-center text-[9px] uppercase tracking-wide text-white/50">
                            {LINK_KIND_LABEL[l.kind] ?? l.kind}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-white/80 group-hover:text-white">
                            {l.title}
                          </span>
                          <span className="flex-none text-[10px] tabular-nums text-white/35">
                            {l.views !== null ? `${l.views} views` : ""}
                          </span>
                          <ExternalLink size={11} className="flex-none text-white/25" />
                        </a>
                      ))}
                      <div className="mt-2.5 flex gap-2">
                        {d.accountId && (
                          <Link
                            href={`/admin/accounts/${d.accountId}`}
                            className="rounded-md bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/20"
                          >
                            Open account →
                          </Link>
                        )}
                        {d.contactId && (
                          <Link
                            href={`/admin/contacts/${d.contactId}`}
                            className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/5"
                          >
                            Open contact →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- warm now (prospects reading reports) ----------

function WarmNow({ prospects }: { prospects: CommandProspect[] }) {
  const [showAll, setShowAll] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const list = showAll ? prospects : prospects.slice(0, 8);
  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Warm now
        </h2>
        <span className="text-[11px] text-white/30">reading reports</span>
        <div className="h-px min-w-6 flex-1 bg-white/10" />
        {prospects.length > 8 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/50 hover:bg-white/5"
          >
            {showAll ? "Show top 8" : `Show all ${prospects.length}`}
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="divide-y divide-white/[0.06]">
          {list.map((p) => {
            const isOpen = openKeys.has(p.key);
            return (
              <div key={p.key}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(p.key)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(p.key)}
                  className={cn("flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-white/[0.03]", isOpen && "bg-white/[0.03]")}
                >
                  <span
                    className={cn(
                      "w-9 flex-none rounded-md py-1 text-center text-xs font-semibold tabular-nums",
                      p.viewedLast7d ? "bg-red-400/10 text-red-300" : "bg-white/5 text-white/45",
                    )}
                    style={heading}
                  >
                    {p.views}
                  </span>
                  <div className="min-w-0 flex-1">
                    {p.contactId ? (
                      <Link
                        href={`/admin/contacts/${p.contactId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate text-[13.5px] font-medium text-white hover:text-violet-300 hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <div className="truncate text-[13.5px] font-medium text-white">{p.name}</div>
                    )}
                    <div className="truncate text-[11px] text-white/35">
                      {p.docs} doc{p.docs > 1 ? "s" : ""} out · opened {relTime(p.lastViewed)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex-none rounded-md px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
                      p.hasDeal ? "bg-white/5 text-white/50" : "border border-dashed border-white/15 text-white/35",
                    )}
                  >
                    {p.hasDeal ? "In pipe" : "No deal"}
                  </span>
                  <ChevronRight size={12} className={cn("flex-none text-white/25 transition-transform", isOpen && "rotate-90")} />
                </div>
                {isOpen && (
                  <div className="border-t border-dashed border-white/10 bg-white/[0.015] px-5 py-3">
                    <div className={cn(label, "mb-1.5")}>Docs sent</div>
                    {p.reports.map((r) => (
                      <a
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/5"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs text-white/80 group-hover:text-white">{r.title}</span>
                        <span className="flex-none text-[10px] tabular-nums text-white/35">
                          {r.views} views{r.lastViewed ? ` · ${relTime(r.lastViewed)}` : ""}
                        </span>
                        <ExternalLink size={11} className="flex-none text-white/25" />
                      </a>
                    ))}
                    {p.contactId && (
                      <Link
                        href={`/admin/contacts/${p.contactId}`}
                        className="mt-2 inline-block rounded-md bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/20"
                      >
                        Open contact →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- agent fleet ----------

function AgentFleet({ agents, available }: { agents: CommandAgent[]; available: boolean }) {
  const byCustomer = useMemo(() => {
    const m = new Map<string, CommandAgent[]>();
    for (const a of agents) {
      const arr = m.get(a.customerId) ?? [];
      arr.push(a);
      m.set(a.customerId, arr);
    }
    return [...m.entries()];
  }, [agents]);

  const staleCount = agents.filter((a) => a.stale).length;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Agent fleet
        </h2>
        <span className="text-[11px] text-white/30">
          {available
            ? staleCount > 0
              ? `${staleCount} silent`
              : "all reporting"
            : "telemetry unavailable"}
        </span>
        <div className="h-px min-w-6 flex-1 bg-white/10" />
      </div>
      {!available ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/35">
          Couldn&apos;t reach triple3-ops telemetry — fleet status unknown.
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/35">
          No agents reporting yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="divide-y divide-white/[0.06]">
            {byCustomer.map(([customerId, rows]) => (
              <div key={customerId} className="px-4 py-2.5">
                <div className={cn(label, "mb-1")}>{customerId}</div>
                {rows.map((a) => (
                  <div key={a.agentId} className="flex items-center gap-2 py-[3px] text-xs">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 flex-none rounded-full",
                        a.stale ? "bg-red-400" : "bg-emerald-400",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-white/80">
                      {a.agentId}
                    </span>
                    {a.lastTaskName && (
                      <span
                        className={cn(
                          "flex-none truncate text-[10.5px]",
                          a.lastTaskStatus === "error" ? "text-red-300" : "text-white/40",
                        )}
                        title={a.lastTaskAt ?? undefined}
                      >
                        {a.lastTaskName} {a.lastTaskStatus === "error" ? "failed" : "ok"}
                        {a.lastTaskAt ? ` · ${relTime(a.lastTaskAt)}` : ""}
                      </span>
                    )}
                    <span
                      className={cn(
                        "w-14 flex-none text-right tabular-nums text-[10.5px]",
                        a.stale ? "text-red-300" : "text-white/40",
                      )}
                      title={a.lastHeartbeat ? `heartbeat ${a.lastHeartbeat} · threshold ${a.staleSeconds}s` : "no heartbeat recorded"}
                    >
                      ♥ {relSecs(a.ageSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- root ----------

export default function CommandView({ data }: { data: CommandResponse }) {
  return (
    <div className="flex flex-col gap-7">
      <SummaryLine kpis={data.kpis} />
      <NeedsYou queue={data.queue} />
      <RevenueTable revenue={data.revenue} />
      <ClientRows clients={data.clients} queue={data.queue} />
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.5fr_1fr]">
        <Pipeline stages={data.stages} deals={data.deals} />
        <div className="flex flex-col gap-7">
          <WarmNow prospects={data.prospects} />
          <AgentFleet agents={data.agents} available={data.agentsAvailable} />
        </div>
      </div>
      <p className="text-center text-[11px] text-white/25">
        Tell Zeke in Pingo to update any of this — move deals, log deliveries, attach links.
      </p>
    </div>
  );
}
