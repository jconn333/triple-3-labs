"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  DataTable,
  MoneyCell,
  MutedCell,
  NameCell,
  SearchInput,
  SectionHeader,
  Segmented,
  StatusBadge,
  type Column,
} from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import type { Account } from "@/lib/crm/types";

type Filter = "all" | "active" | "paused" | "churned";

export default function ClientsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounts?limit=200`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) setAccounts(data.accounts || []);
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!needle) return true;
      const contact = a.contact ? `${a.contact.first_name} ${a.contact.last_name} ${a.contact.email}`.toLowerCase() : "";
      return a.name.toLowerCase().includes(needle) || contact.includes(needle);
    });
  }, [accounts, q, filter]);

  const mrr = rows.reduce((s, a) => s + (a.mrr ?? 0), 0);
  const counts = {
    active: accounts.filter((a) => a.status === "active").length,
    paused: accounts.filter((a) => a.status === "paused").length,
    churned: accounts.filter((a) => a.status === "churned").length,
  };

  const columns: Column<Account>[] = [
    {
      key: "name",
      header: "Client",
      render: (a) => (
        <NameCell name={a.name} sub={a.contact ? `${a.contact.first_name} ${a.contact.last_name}`.trim() : undefined} />
      ),
    },
    { key: "email", header: "Email", hideBelow: "lg", render: (a) => <MutedCell>{a.contact?.email || "—"}</MutedCell> },
    { key: "status", header: "Status", width: "120px", render: (a) => <StatusBadge kind="account" value={a.status} /> },
    { key: "mrr", header: "MRR", width: "110px", align: "right", render: (a) => <MoneyCell amount={a.mrr ?? null} per="mo" /> },
    {
      key: "stripe",
      header: "Billing",
      width: "100px",
      hideBelow: "md",
      render: (a) => (
        <span className={a.stripe_customer_id ? "text-sub text-ink-2" : "text-sub text-ink-3"}>
          {a.stripe_customer_id ? "Stripe linked" : "—"}
        </span>
      ),
    },
    { key: "since", header: "Since", width: "124px", hideBelow: "sm", render: (a) => <MutedCell>{formatDate(a.created_at)}</MutedCell> },
  ];

  return (
    <>
      <PageHeader title="Clients" />
      <SectionHeader title="Clients" count={loading ? undefined : `${rows.length} · $${mrr.toLocaleString("en-US")} / mo`}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or contact…" width="240px" />
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          ariaLabel="Status filter"
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active", count: counts.active || null },
            { value: "paused", label: "Paused", count: counts.paused || null },
            { value: "churned", label: "Churned", count: counts.churned || null },
          ]}
        />
      </SectionHeader>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(a) => a.id}
        rowHref={(a) => `/admin/clients/${a.id}`}
        loading={loading}
        emptyTitle={q || filter !== "all" ? "No clients match" : "No clients yet"}
        emptyBody={q || filter !== "all" ? "Try a different filter." : "Create one from a person's page when a deal closes."}
      />
    </>
  );
}
