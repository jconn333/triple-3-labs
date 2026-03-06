"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import AccountStatusBadge from "@/components/admin/AccountStatusBadge";
import type { Account } from "@/lib/crm/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    async function fetchAccounts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (query) params.set("q", query);
        const res = await fetch(`/api/accounts?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAccounts(data.accounts || []);
      } catch {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(searchInput);
  }

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search accounts by name..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
          />
        </div>
        <button type="submit" className="rounded-lg bg-violet/20 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/30 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="glass-card overflow-hidden rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden sm:table-cell">Stripe</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40 hidden sm:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-white/30">
                  {query ? "No accounts match your search." : "No accounts yet. Create one from a contact's detail page."}
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/accounts/${a.id}`} className="text-sm font-medium text-white hover:text-violet">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50">
                    {a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 hidden md:table-cell">
                    {a.contact?.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AccountStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">
                    {a.stripe_customer_id ? (
                      <span className="text-emerald-400/60 text-xs">Linked</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 hidden sm:table-cell">{formatDate(a.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
