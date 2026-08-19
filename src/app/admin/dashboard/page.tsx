"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Kanban, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";
import LeadScoreBadge from "@/components/admin/LeadScoreBadge";
import type { Contact, Deal, PipelineStage } from "@/lib/crm/types";

interface DashboardData {
  contacts: Contact[];
  deals: Deal[];
  stages: PipelineStage[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({ contacts: [], deals: [], stages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [contactsRes, dealsRes, pipelineRes] = await Promise.all([
          fetch("/api/contacts?limit=5"),
          fetch("/api/deals"),
          fetch("/api/pipeline"),
        ]);

        if (!contactsRes.ok || !dealsRes.ok || !pipelineRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [contactsData, dealsData, pipelineData] = await Promise.all([
          contactsRes.json(),
          dealsRes.json(),
          pipelineRes.json(),
        ]);

        setData({
          contacts: contactsData.contacts || [],
          deals: dealsData.deals || [],
          stages: pipelineData.stages || [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse rounded-xl p-6 h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card animate-pulse rounded-xl p-6 h-64" />
          <div className="glass-card animate-pulse rounded-xl p-6 h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-white/50 mb-2">Could not load dashboard data.</p>
        <p className="text-sm text-red-400/80">{error}</p>
      </div>
    );
  }

  const { contacts, deals, stages } = data;

  const openDeals = deals.filter((d) => {
    const stage = stages.find((s) => s.id === d.stage_id);
    return !stage?.is_closed;
  });

  const totalPipelineValue = openDeals.reduce(
    (sum, d) => sum + (d.amount || 0), 0
  );

  const wonDeals = deals.filter((d) => {
    const stage = stages.find((s) => s.id === d.stage_id);
    return stage?.is_closed && stage?.name?.toLowerCase().includes("won");
  });

  const stats = [
    { label: "Total Contacts", value: contacts.length.toString(), icon: Users, color: "text-violet" },
    { label: "Open Deals", value: openDeals.length.toString(), icon: Kanban, color: "text-cyan" },
    { label: "Pipeline Value", value: formatCurrency(totalPipelineValue), icon: DollarSign, color: "text-emerald-400" },
    { label: "Deals Won", value: wonDeals.length.toString(), icon: TrendingUp, color: "text-pink" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="mt-2 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Recent Leads</h2>
            <Link href="/admin/contacts" className="text-xs text-violet hover:text-violet/80">View all</Link>
          </div>
          {contacts.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">
              No contacts yet. Leads appear here when the contact form is submitted.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <Link key={c.id} href={`/admin/contacts/${c.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-white/40">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LeadScoreBadge score={c.lead_score} />
                    <span className="text-[10px] text-white/30">{formatRelativeTime(c.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Pipeline Summary</h2>
            <Link href="/admin/pipeline" className="text-xs text-violet hover:text-violet/80">View board</Link>
          </div>
          {stages.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/30">No pipeline stages found.</p>
          ) : (
            <div className="space-y-3">
              {stages.map((stage) => {
                const stageDeals = deals.filter((d) => d.stage_id === stage.id);
                const stageValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
                const maxDeals = Math.max(...stages.map((s) => deals.filter((d) => d.stage_id === s.id).length), 1);
                const barWidth = (stageDeals.length / maxDeals) * 100;

                return (
                  <div key={stage.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-white/60">{stage.name}</span>
                      <span className="text-white/40">{stageDeals.length} deals · {formatCurrency(stageValue)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet to-cyan transition-all" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
