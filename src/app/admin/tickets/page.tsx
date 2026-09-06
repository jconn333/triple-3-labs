"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  DataTable,
  MutedCell,
  SearchInput,
  SectionHeader,
  Segmented,
  Select,
  StatusBadge,
  TierBadge,
  type Column,
} from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Ticket } from "@/lib/crm/types";

type View = "open" | "escalated" | "pending_approval" | "resolved" | "all";

const STATUSES = [
  "new",
  "triaging",
  "awaiting_customer",
  "pending_approval",
  "fixing",
  "verifying",
  "resolved",
  "escalated",
  "closed",
] as const;

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("open");
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const effectiveStatus = status || view;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: effectiveStatus });
        if (query) params.set("q", query);
        const res = await fetch(`/api/tickets?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) setTickets(data.tickets || []);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveStatus, query]);

  const anyTier = useMemo(() => tickets.some((t) => t.tier !== null && t.tier !== undefined), [tickets]);

  const columns: Column<Ticket>[] = [
    {
      key: "num",
      header: "#",
      width: "64px",
      render: (t) => <span className="tabular-nums text-sub text-ink-3">{t.ticket_number}</span>,
    },
    {
      key: "subject",
      header: "Subject",
      render: (t) => (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-medium text-ink">{t.subject}</span>
          {t.account?.name && <span className="hidden shrink-0 text-sub text-ink-3 xl:inline">{t.account.name}</span>}
        </span>
      ),
    },
    { key: "status", header: "Status", width: "150px", render: (t) => <StatusBadge kind="ticket" value={t.status} /> },
    { key: "severity", header: "Severity", width: "100px", hideBelow: "lg", render: (t) => <StatusBadge kind="severity" value={t.severity} /> },
    ...(anyTier
      ? [{ key: "tier", header: "Tier", width: "80px", hideBelow: "lg" as const, render: (t: Ticket) => <TierBadge tier={t.tier} /> }]
      : []),
    { key: "channel", header: "Channel", width: "100px", hideBelow: "xl", render: (t) => <StatusBadge kind="channel" value={t.channel} /> },
    { key: "age", header: "Opened", width: "110px", hideBelow: "sm", render: (t) => <MutedCell>{formatRelativeTime(t.created_at)}</MutedCell> },
    {
      key: "msgs",
      header: "",
      width: "60px",
      align: "right",
      render: (t) => (
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-ink-3">
          <MessageSquare size={12} />
          {t.message_count ?? 0}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Tickets" />
      <SectionHeader title="Tickets" count={loading ? undefined : tickets.length}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, email, #…" width="240px" />
        <Segmented<View>
          value={status ? "all" : view}
          onChange={(v) => {
            setStatus("");
            setView(v);
          }}
          ariaLabel="Ticket view"
          options={[
            { value: "open", label: "Open" },
            { value: "escalated", label: "Escalated" },
            { value: "pending_approval", label: "Needs approval" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
          ]}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" aria-label="Exact status">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </SectionHeader>
      <DataTable
        columns={columns}
        rows={tickets}
        rowKey={(t) => t.id}
        rowHref={(t) => `/admin/tickets/${t.id}`}
        loading={loading}
        skeletonRows={6}
        emptyTitle={query ? "No tickets match" : "No tickets in this view"}
      />
    </>
  );
}
