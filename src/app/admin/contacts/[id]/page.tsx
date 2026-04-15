"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Mail, Phone, Building2, DollarSign, Sparkles, FileText,
  Clock, ArrowRight, Copy, UserPlus, ExternalLink,
} from "lucide-react";
import { formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils/format";
import LeadScoreBadge from "@/components/admin/LeadScoreBadge";
import type { Contact, Deal, Activity, Account } from "@/lib/crm/types";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setContact(data.contact);
        setDeals(data.deals || []);
        setActivities(data.activities || []);
        setAccount(data.account || null);
      } catch {
        toast.error("Failed to load contact");
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [id]);

  async function handleDraftFollowUp() {
    setDraftingEmail(true);
    setEmailDraft(null);
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      const draft = await res.json();
      setEmailDraft(draft);
      toast.success("Follow-up email drafted");
    } catch {
      toast.error("Failed to draft email");
    } finally {
      setDraftingEmail(false);
    }
  }

  async function handleRescore() {
    if (!contact) return;
    setScoring(true);
    try {
      const res = await fetch("/api/ai/lead-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: id,
          contactData: {
            name: `${contact.first_name} ${contact.last_name}`,
            email: contact.email,
            company: contact.company ?? undefined,
            phone: contact.phone ?? undefined,
            message: contact.message || "",
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const score = await res.json();
      setContact((prev) =>
        prev ? { ...prev, lead_score: score.score, lead_score_label: score.label, lead_score_reasoning: score.reasoning } : prev
      );
      toast.success(`Re-scored: ${score.score}/100 (${score.label})`);
    } catch {
      toast.error("Failed to re-score");
    } finally {
      setScoring(false);
    }
  }

  async function handleCreateAccount() {
    setCreatingAccount(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409 && data.account_id) {
          router.push(`/admin/accounts/${data.account_id}`);
          return;
        }
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      toast.success("Account created");
      router.push(`/admin/accounts/${data.account.id}`);
    } catch {
      toast.error("Failed to create account");
    } finally {
      setCreatingAccount(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card animate-pulse rounded-xl p-6 h-80" />
        <div className="lg:col-span-2 glass-card animate-pulse rounded-xl p-6 h-80" />
      </div>
    );
  }

  if (!contact) {
    return <div className="glass-card rounded-xl p-8 text-center text-white/50">Contact not found.</div>;
  }

  const projectLabels: Record<string, string> = {
    "ai-agent": "AI Agent", automation: "Automation", consulting: "Consulting", other: "Other",
  };
  const budgetLabels: Record<string, string> = {
    "under-5k": "Under $5K", "5k-15k": "$5K - $15K", "15k-50k": "$15K - $50K", "50k-plus": "$50K+",
  };

  const activityIcons: Record<string, typeof Clock> = {
    form_submission: FileText,
    ai_scoring: Sparkles,
    ai_follow_up: Mail,
    stage_change: ArrowRight,
    note: FileText,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {contact.first_name} {contact.last_name}
              </h2>
              <LeadScoreBadge score={contact.lead_score} size="md" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-white/30" />
                <a href={`mailto:${contact.email}`} className="text-white/70 hover:text-violet">{contact.email}</a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-white/30" />
                  <span className="text-white/70">{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={14} className="text-white/30" />
                  <span className="text-white/70">{contact.company}</span>
                </div>
              )}
              {contact.project_type && (
                <div className="flex items-center gap-3 text-sm">
                  <Sparkles size={14} className="text-white/30" />
                  <span className="text-white/70">{projectLabels[contact.project_type] || contact.project_type}</span>
                </div>
              )}
              {contact.budget_range && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign size={14} className="text-white/30" />
                  <span className="text-white/70">{budgetLabels[contact.budget_range] || contact.budget_range}</span>
                </div>
              )}
            </div>

            {contact.lead_score_reasoning && (
              <div className="mt-4 rounded-lg bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">AI Analysis</p>
                <p className="text-xs text-white/50">{contact.lead_score_reasoning}</p>
              </div>
            )}

            <p className="mt-4 text-[10px] text-white/30">Added {formatDate(contact.created_at)}</p>
          </div>

          {/* Actions */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <button onClick={handleDraftFollowUp} disabled={draftingEmail}
              className="w-full flex items-center gap-2 rounded-lg bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/20 transition-colors disabled:opacity-50">
              <Mail size={16} />
              {draftingEmail ? "Drafting..." : "Draft Follow-up Email"}
            </button>
            <button onClick={handleRescore} disabled={scoring}
              className="w-full flex items-center gap-2 rounded-lg bg-cyan/10 px-4 py-2.5 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors disabled:opacity-50">
              <Sparkles size={16} />
              {scoring ? "Scoring..." : "Re-score Lead"}
            </button>
            {account ? (
              <Link href={`/admin/accounts/${account.id}`}
                className="w-full flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                <ExternalLink size={16} /> View Account
              </Link>
            ) : (
              <button onClick={handleCreateAccount} disabled={creatingAccount}
                className="w-full flex items-center gap-2 rounded-lg bg-purple/10 px-4 py-2.5 text-sm font-medium text-purple hover:bg-purple/20 transition-colors disabled:opacity-50">
                <UserPlus size={16} />
                {creatingAccount ? "Creating..." : "Create Account"}
              </button>
            )}
          </div>

          {/* Deals */}
          {deals.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Deals</h3>
              <div className="space-y-2">
                {deals.map((deal) => (
                  <div key={deal.id} className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-sm font-medium text-white">{deal.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {deal.amount && <span className="text-xs text-emerald-400">{formatCurrency(deal.amount)}</span>}
                      {deal.stage && (
                        <span className="text-xs text-white/40">{(deal.stage as any).name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Message + Email Draft + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Original message */}
          {contact.message && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Original Message</h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{contact.message}</p>
            </div>
          )}

          {/* Email draft */}
          {emailDraft && (
            <div className="glass-card rounded-xl p-6 border border-violet/20">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet">AI-Drafted Follow-up</h3>
                <button onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`);
                  toast.success("Copied to clipboard");
                }} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p className="mb-2 text-sm font-medium text-white">Subject: {emailDraft.subject}</p>
              <p className="text-sm text-white/60 whitespace-pre-wrap">{emailDraft.body}</p>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || Clock;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                        <Icon size={14} className="text-white/40" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/80">{activity.title}</p>
                        {activity.description && (
                          <p className="mt-0.5 text-xs text-white/40">{activity.description}</p>
                        )}
                        <p className="mt-1 text-[10px] text-white/25">{formatRelativeTime(activity.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
