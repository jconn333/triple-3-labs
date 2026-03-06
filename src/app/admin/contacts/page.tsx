"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import LeadScoreBadge from "@/components/admin/LeadScoreBadge";
import type { Contact } from "@/lib/crm/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (query) params.set("q", query);

        const res = await fetch(`/api/contacts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setContacts(data.contacts || []);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
  }

  const projectLabels: Record<string, string> = {
    "ai-agent": "AI Agent",
    automation: "Automation",
    consulting: "Consulting",
    other: "Other",
  };

  const budgetLabels: Record<string, string> = {
    "under-5k": "< $5K",
    "5k-15k": "$5-15K",
    "15k-50k": "$15-50K",
    "50k-plus": "$50K+",
  };

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
          />
        </div>
        <button type="submit"
          className="rounded-lg bg-violet/20 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/30 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden md:table-cell">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden lg:table-cell">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden lg:table-cell">Budget</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/30">
                  {query ? "No contacts match your search." : "No contacts yet."}
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/contacts/${c.id}`} className="text-sm font-medium text-white hover:text-violet">
                      {c.first_name} {c.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-white/50 hidden md:table-cell">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-sm text-white/50 hidden lg:table-cell">
                    {c.project_type ? projectLabels[c.project_type] || c.project_type : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 hidden lg:table-cell">
                    {c.budget_range ? budgetLabels[c.budget_range] || c.budget_range : "—"}
                  </td>
                  <td className="px-4 py-3"><LeadScoreBadge score={c.lead_score} /></td>
                  <td className="px-4 py-3 text-xs text-white/40 hidden sm:table-cell">{formatDate(c.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
