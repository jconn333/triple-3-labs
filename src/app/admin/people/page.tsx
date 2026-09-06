"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import LeadScoreBadge from "@/components/admin/LeadScoreBadge";
import { DataTable, MutedCell, NameCell, SearchInput, SectionHeader, type Column } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import type { Contact } from "@/lib/crm/types";

const projectLabels: Record<string, string> = {
  "ai-agent": "AI Agent",
  automation: "Automation",
  consulting: "Consulting",
  other: "Other",
};

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");

  // Filter as you type; the API does the matching.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (query) params.set("q", query);
        const res = await fetch(`/api/contacts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) setContacts(data.contacts || []);
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  // Only show the columns that are populated for this data set.
  const anyProject = contacts.some((c) => c.project_type);

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => <NameCell name={`${c.first_name} ${c.last_name}`.trim() || "—"} sub={c.company || undefined} />,
    },
    { key: "email", header: "Email", hideBelow: "md", render: (c) => <MutedCell>{c.email}</MutedCell> },
    ...(anyProject
      ? [
          {
            key: "project",
            header: "Interest",
            hideBelow: "lg" as const,
            render: (c: Contact) => (
              <MutedCell>{c.project_type ? projectLabels[c.project_type] || c.project_type : "—"}</MutedCell>
            ),
          },
        ]
      : []),
    { key: "score", header: "Lead", width: "90px", render: (c) => <LeadScoreBadge score={c.lead_score} /> },
    { key: "date", header: "Added", width: "124px", hideBelow: "sm", render: (c) => <MutedCell>{formatDate(c.created_at)}</MutedCell> },
  ];

  return (
    <>
      <PageHeader title="People" />
      <SectionHeader title="People" count={loading ? undefined : contacts.length}>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company…" width="260px" />
      </SectionHeader>
      <DataTable
        columns={columns}
        rows={contacts}
        rowKey={(c) => c.id}
        rowHref={(c) => `/admin/people/${c.id}`}
        loading={loading}
        emptyTitle={query ? "No one matches" : "No people yet"}
        emptyBody={query ? "Try a different search." : "Leads land here when the contact form is submitted."}
      />
    </>
  );
}
