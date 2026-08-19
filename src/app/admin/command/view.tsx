"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Flag, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
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

// pipeline_stages.color values → static tailwind classes (must be literal for JIT)
const STAGE_TEXT: Record<string, string> = {
  violet: "text-violet-300 bg-violet-500/10",
  cyan: "text-cyan-300 bg-cyan-500/10",
  purple: "text-purple-300 bg-purple-500/10",
  pink: "text-pink-300 bg-pink-500/10",
  emerald: "text-emerald-300 bg-emerald-500/10",
  zinc: "text-zinc-400 bg-zinc-500/10",
};
const STAGE_DOT: Record<string, string> = {
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  purple: "bg-purple-400",
  pink: "bg-pink-400",
  emerald: "bg-emerald-400",
  zinc: "bg-zinc-400",
};

const STATUS_PILL: Record<CommandClient["status"], { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400" },
  onboarding: { label: "Onboard", cls: "text-amber-300 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
  at_risk: { label: "At risk", cls: "text-red-300 bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
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

// ---------- sections ----------

function KpiStrip({ kpis }: { kpis: CommandResponse["kpis"] }) {
  const items = [
    { lbl: "Recurring / mo", val: money(kpis.mrr), meta: `${kpis.customersBilling} billing` },
    { lbl: "Customers", val: String(kpis.customers), meta: `${kpis.customersOnboarding} onboarding` },
    { lbl: "Open pipeline", val: String(kpis.openDeals), meta: "deals in flight" },
    { lbl: "Engaging / 7d", val: String(kpis.engagingProspects7d), meta: "prospects reading" },
    { lbl: "Needs you", val: String(kpis.needsYou), meta: "queue below", warn: kpis.needsYou > 0 },
  ];
  return (
    <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
      {items.map((it) => (
        <div key={it.lbl} className="min-w-[140px] flex-1 border-r border-white/10 px-5 py-4 last:border-r-0">
          <div className={label}>{it.lbl}</div>
          <div
            className={cn("mt-1 text-xl font-bold tabular-nums", it.warn ? "text-amber-300" : "text-white")}
            style={heading}
          >
            {it.val}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-white/40">{it.meta}</div>
        </div>
      ))}
    </div>
  );
}

function NeedsYou({ queue }: { queue: QueueItem[] }) {
  const [open, setOpen] = useState(false);
  if (queue.length === 0) return null;
  const crit = queue.filter((q) => q.severity === "crit").length;
  return (
    <div className="overflow-hidden rounded-xl border border-amber-400/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 bg-amber-400/[0.07] px-4 py-2.5 text-left hover:bg-amber-400/[0.12]",
          open && "border-b border-white/10",
        )}
      >
        <Flag size={14} className="text-amber-300" />
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Needs you
        </h2>
        <span className="ml-auto text-xs tabular-nums text-amber-300/80">
          {queue.length} item{queue.length > 1 ? "s" : ""}
          {crit > 0 && <span className="ml-2 text-red-300">{crit} urgent</span>}
        </span>
        <ChevronRight size={13} className={cn("text-amber-300/60 transition-transform", open && "rotate-90")} />
      </button>
      <div className={cn("divide-y divide-white/5", !open && "hidden")}>
        {queue.map((q, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={cn(
                "h-2 w-2 flex-none rounded-full",
                q.severity === "crit" ? "bg-red-400" : "bg-amber-400",
              )}
            />
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-white">{q.action}</span>
              <span className="ml-2 text-[13px] text-white/50">— {q.why}</span>
            </div>
            {q.accountId && (
              <Link
                href={`/admin/accounts/${q.accountId}`}
                className="flex-none rounded-md bg-violet/10 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/20"
              >
                Open ↗
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="mb-2.5 flex flex-wrap items-center gap-3">
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
        {/* header */}
        <div className="hidden grid-cols-[1.5fr_92px_1.25fr_110px_1.6fr_88px_20px] gap-2.5 border-b border-white/10 bg-white/[0.04] px-4 py-1.5 md:grid">
          {["Client", "Status", "Services", "MRR", "Latest for them", "Next due", ""].map((h, i) => (
            <span key={i} className={cn(label, (h === "MRR" || h === "Next due") && "text-right")}>
              {h}
            </span>
          ))}
        </div>

        <div className="divide-y divide-white/5">
          {shown.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-white/30">No clients match.</div>
          )}
          {shown.map((c) => {
            const pill = STATUS_PILL[c.status];
            const isOpen = open.has(c.accountId);
            return (
              <div key={c.accountId}>
                {/* row line */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(c.accountId)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(c.accountId)}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto_20px] items-center gap-2.5 px-4 py-2 text-left hover:bg-white/[0.04] md:grid-cols-[1.5fr_92px_1.25fr_110px_1.6fr_88px_20px]",
                    isOpen && "bg-white/[0.04]",
                  )}
                >
                  <span className="flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
                    <Link
                      href={`/admin/accounts/${c.accountId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-none text-[13px] font-semibold text-white hover:text-violet-300 hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="hidden truncate text-[11px] text-white/35 md:inline">{c.contactName}</span>
                  </span>
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      pill.cls,
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
                    {pill.label}
                  </span>
                  <span className="hidden min-w-0 gap-1 overflow-hidden md:flex">
                    {c.services.map((s) => (
                      <span
                        key={s}
                        className="whitespace-nowrap rounded-md border border-violet/25 bg-violet/10 px-1.5 py-px text-[10px] text-violet-300"
                      >
                        {s}
                      </span>
                    ))}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-right text-xs tabular-nums",
                      c.billingSetUp ? "text-white/85" : "text-amber-300",
                    )}
                  >
                    {money(c.mrr)}
                    {!c.billingSetUp && " ⚠"}
                  </span>
                  <span className="hidden min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap text-[12px] text-white/50 md:flex">
                    <span className="truncate">{c.latest?.text ?? "—"}</span>
                    <span className="flex-none text-[10px] text-violet-300/70">
                      {c.latest ? relTime(c.latest.at) : ""}
                    </span>
                  </span>
                  <span className="hidden whitespace-nowrap text-right text-[11px] tabular-nums text-white/50 md:inline">
                    {c.nextDue ? shortDate(c.nextDue) : c.status === "onboarding" ? "kickoff" : "—"}
                  </span>
                  <ChevronRight
                    size={13}
                    className={cn("text-white/30 transition-transform", isOpen && "rotate-90")}
                  />
                </div>

                {/* expanded */}
                {isOpen && (
                  <div className="grid grid-cols-1 gap-0 border-t border-dashed border-white/10 bg-white/[0.02] md:grid-cols-3 md:divide-x md:divide-white/5">
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
                        { k: "Contact", v: c.contactEmail ?? "—" },
                      ].map((row) => (
                        <div key={row.k} className="flex justify-between gap-3 py-0.5 text-xs">
                          <span className="text-white/40">{row.k}</span>
                          <span className={cn("text-right", row.warn ? "font-medium text-amber-300" : "text-white/75")}>
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
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Pipeline
        </h2>
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
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] pt-3">
        <div className="mx-4 flex h-2 overflow-hidden rounded-full border border-white/10">
          {stages
            .filter((s) => s.count > 0)
            .map((s) => (
              <div
                key={s.name}
                className={STAGE_DOT[s.color] ?? "bg-zinc-400"}
                style={{ width: `${(s.count / total) * 100}%` }}
                title={`${s.name}: ${s.count}`}
              />
            ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5">
          {stages.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] tabular-nums text-white/50">
              <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOT[s.color] ?? "bg-zinc-400")} />
              {s.name} {s.count}
            </span>
          ))}
        </div>
        <div className="divide-y divide-white/5 border-t border-white/5">
          {open.map((d) => {
            const isOpen = openIds.has(d.id);
            return (
              <div key={d.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(d.id)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(d.id)}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto_18px] items-center gap-2.5 px-4 py-2 text-left text-[13px] hover:bg-white/[0.04] md:grid-cols-[1.4fr_110px_1fr_110px_96px_18px]",
                    isOpen && "bg-white/[0.04]",
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
                      "w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-center text-[10px] font-medium uppercase tracking-wide",
                      STAGE_TEXT[d.stageColor] ?? STAGE_TEXT.zinc,
                    )}
                  >
                    {d.stage}
                  </span>
                  <span className="hidden truncate text-xs text-white/40 md:inline">{d.description ?? ""}</span>
                  <span className="whitespace-nowrap text-right text-xs tabular-nums text-white/70">
                    {d.amount ? `${money(d.amount)}` : "TBD"}
                  </span>
                  <span
                    className={cn(
                      "hidden whitespace-nowrap text-right text-[11px] tabular-nums md:inline",
                      d.lastViewed && Date.now() - new Date(d.lastViewed).getTime() < 3 * 86_400_000
                        ? "font-semibold text-red-300"
                        : "text-white/40",
                    )}
                  >
                    {d.views !== null ? `${d.views} views · ${relTime(d.lastViewed)}` : "—"}
                  </span>
                  <ChevronRight size={13} className={cn("text-white/30 transition-transform", isOpen && "rotate-90")} />
                </div>
                {isOpen && (
                  <div className="grid grid-cols-1 gap-0 border-t border-dashed border-white/10 bg-white/[0.02] md:grid-cols-[1.2fr_1fr] md:divide-x md:divide-white/5">
                    <div className="px-5 py-4">
                      <div className={cn(label, "mb-2")}>Deal notes</div>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/60">
                        {d.description ?? "No notes."}
                      </p>
                    </div>
                    <div className="px-5 py-4">
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

function Prospects({ prospects }: { prospects: CommandProspect[] }) {
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
      <div className="mb-2.5 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-white" style={heading}>
          Prospects
        </h2>
        <span className="text-[11px] text-white/30">by report engagement</span>
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
        <div className="divide-y divide-white/5">
          {list.map((p) => {
            const isOpen = openKeys.has(p.key);
            return (
              <div key={p.key}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(p.key)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(p.key)}
                  className={cn("flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-white/[0.04]", isOpen && "bg-white/[0.04]")}
                >
                  <span
                    className={cn(
                      "w-9 flex-none rounded-md py-0.5 text-center text-xs font-semibold tabular-nums",
                      p.viewedLast7d ? "bg-red-400/10 text-red-300" : "bg-white/5 text-white/50",
                    )}
                  >
                    {p.views}
                  </span>
                  <div className="min-w-0 flex-1">
                    {p.contactId ? (
                      <Link
                        href={`/admin/contacts/${p.contactId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate text-[13px] font-medium text-white hover:text-violet-300 hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <div className="truncate text-[13px] font-medium text-white">{p.name}</div>
                    )}
                    <div className="truncate text-[11px] text-white/35">
                      {p.docs} doc{p.docs > 1 ? "s" : ""} out · last opened {relTime(p.lastViewed)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex-none rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      p.hasDeal ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300",
                    )}
                  >
                    {p.hasDeal ? "In pipe" : "No deal"}
                  </span>
                  <ChevronRight size={12} className={cn("flex-none text-white/30 transition-transform", isOpen && "rotate-90")} />
                </div>
                {isOpen && (
                  <div className="border-t border-dashed border-white/10 bg-white/[0.02] px-5 py-3">
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

// ---------- root ----------

export default function CommandView({ data }: { data: CommandResponse }) {
  return (
    <div className="flex flex-col gap-6">
      <KpiStrip kpis={data.kpis} />
      <NeedsYou queue={data.queue} />
      <ClientRows clients={data.clients} queue={data.queue} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Pipeline stages={data.stages} deals={data.deals} />
        <Prospects prospects={data.prospects} />
      </div>
      <p className="text-center text-[11px] text-white/25">
        Tell Zeke in Pingo to update any of this — move deals, log deliveries, attach links.
      </p>
    </div>
  );
}
