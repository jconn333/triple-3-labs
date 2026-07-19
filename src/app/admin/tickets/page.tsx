"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import TicketStatusBadge from "@/components/admin/TicketStatusBadge";
import TicketSeverityBadge from "@/components/admin/TicketSeverityBadge";
import TicketTierBadge from "@/components/admin/TicketTierBadge";
import TicketChannelBadge from "@/components/admin/TicketChannelBadge";
import type { Ticket } from "@/lib/crm/types";

const TABS: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "triaging", label: "Triaging" },
  { value: "awaiting_customer", label: "Awaiting Customer" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "fixing", label: "Fixing" },
  { value: "verifying", label: "Verifying" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ status: tab });
        if (query) params.set("q", query);
        const res = await fetch(`/api/tickets?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [tab, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.value
                ? "border-violet/40 bg-violet/15 text-violet"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by subject, description, email, or ticket #..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-violet/20 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/30 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden md:table-cell">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden lg:table-cell">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden lg:table-cell">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden xl:table-cell">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden sm:table-cell">Age</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Msgs</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-white/30">
                  {query ? "No tickets match your search." : "No tickets in this view."}
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.id}`} className="text-sm font-medium text-white/60 hover:text-violet">
                      #{t.ticket_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <Link href={`/admin/tickets/${t.id}`} className="text-sm font-medium text-white hover:text-violet truncate block">
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 hidden md:table-cell">
                    {t.account?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <TicketSeverityBadge severity={t.severity} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <TicketTierBadge tier={t.tier} />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <TicketChannelBadge channel={t.channel} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 hidden sm:table-cell">
                    {formatRelativeTime(t.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-white/40">
                      <MessageSquare size={12} />
                      {t.message_count ?? 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
