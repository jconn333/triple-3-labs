"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  Building2,
  Clock,
  Send,
  Lock,
  User,
  Bot,
  UserCog,
  Settings,
  AlertTriangle,
  Wrench,
  Gauge,
  ListChecks,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import TicketStatusBadge from "@/components/admin/TicketStatusBadge";
import TicketSeverityBadge from "@/components/admin/TicketSeverityBadge";
import TicketTierBadge from "@/components/admin/TicketTierBadge";
import TicketChannelBadge from "@/components/admin/TicketChannelBadge";
import TicketActionStatusBadge from "@/components/admin/TicketActionStatusBadge";
import type { Ticket, TicketMessage, TicketDiagnosis, TicketAction, TicketStatus } from "@/lib/crm/types";

const STATUS_OPTIONS: TicketStatus[] = [
  "new",
  "triaging",
  "awaiting_customer",
  "pending_approval",
  "fixing",
  "verifying",
  "resolved",
  "escalated",
  "closed",
];

const authorStyles: Record<
  string,
  { icon: typeof User; bubble: string; iconWrap: string; align: string }
> = {
  customer: {
    icon: User,
    bubble: "bg-white/[0.04] border-white/10",
    iconWrap: "bg-white/10 text-white/60",
    align: "",
  },
  ai: {
    icon: Bot,
    bubble: "bg-violet-500/[0.06] border-violet-500/20",
    iconWrap: "bg-violet-500/15 text-violet-300",
    align: "",
  },
  staff: {
    icon: UserCog,
    bubble: "bg-cyan-500/[0.06] border-cyan-500/20",
    iconWrap: "bg-cyan-500/15 text-cyan-300",
    align: "",
  },
  system: {
    icon: Settings,
    bubble: "bg-zinc-500/[0.06] border-zinc-500/20 border-dashed",
    iconWrap: "bg-zinc-500/15 text-zinc-400",
    align: "",
  },
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [diagnoses, setDiagnoses] = useState<TicketDiagnosis[]>([]);
  const [actions, setActions] = useState<TicketAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyInternal, setReplyInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setDiagnoses(data.diagnoses || []);
      setActions(data.actions || []);
    } catch {
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  async function handleStatusChange(newStatus: string) {
    if (!ticket) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTicket(data.ticket);
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody, is_internal: replyInternal }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setReplyBody("");
      toast.success(replyInternal ? "Internal note added" : "Reply sent");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
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

  if (!ticket) {
    return <div className="glass-card rounded-xl p-8 text-center text-white/50">Ticket not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-white/40">Ticket #{ticket.ticket_number}</p>
            <h1 className="mt-1 text-xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {ticket.subject}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TicketSeverityBadge severity={ticket.severity} />
              <TicketTierBadge tier={ticket.tier} />
              <TicketChannelBadge channel={ticket.channel} />
              {ticket.reopened_count > 0 && (
                <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  Reopened ×{ticket.reopened_count}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet/50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <TicketStatusBadge status={ticket.status} size="md" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/40">
          {ticket.account?.name && (
            <span className="flex items-center gap-1.5">
              <Building2 size={12} /> {ticket.account.name}
            </span>
          )}
          {(ticket.contact?.email || ticket.submitter_email) && (
            <span className="flex items-center gap-1.5">
              <Mail size={12} /> {ticket.contact?.email || ticket.submitter_email}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> Opened {formatDate(ticket.created_at)}
          </span>
        </div>

        {ticket.status === "escalated" && ticket.escalation_reason && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Escalated</p>
              <p className="text-rose-300/80">{ticket.escalation_reason}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Conversation</h3>
            {messages.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const style = authorStyles[m.author_type] || authorStyles.system;
                  const Icon = style.icon;
                  return (
                    <div key={m.id} className={`flex gap-3 rounded-lg border p-4 ${style.bubble}`}>
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white/80">
                            {m.author_name || m.author_type}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-white/30">{m.author_type}</span>
                          {m.is_internal && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                              <Lock size={9} /> Internal note
                            </span>
                          )}
                          <span className="text-[10px] text-white/25">{formatRelativeTime(m.created_at)}</span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm text-white/70">{m.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reply box */}
            <form onSubmit={handleReplySubmit} className="mt-5 border-t border-white/5 pt-5">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={replyInternal ? "Add an internal note (staff only)..." : "Reply to the customer..."}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={replyInternal}
                    onChange={(e) => setReplyInternal(e.target.checked)}
                    className="rounded border-white/20 bg-white/5"
                  />
                  Internal note (not visible to customer)
                </label>
                <button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="flex items-center gap-2 rounded-lg bg-violet/20 px-4 py-2 text-sm font-medium text-violet hover:bg-violet/30 transition-colors disabled:opacity-40"
                >
                  <Send size={14} />
                  {replyInternal ? "Add Note" : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Diagnosis + Actions */}
        <div className="space-y-4">
          {/* AI Diagnosis */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              <Gauge size={13} /> AI Diagnosis
            </h3>
            {diagnoses.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No diagnosis yet.</p>
            ) : (
              <div className="space-y-4">
                {diagnoses.map((d) => (
                  <div key={d.id} className="rounded-lg bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{d.category}</span>
                      {d.confidence && (
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium capitalize text-white/50">
                          {d.confidence} confidence
                        </span>
                      )}
                      <TicketTierBadge tier={d.proposed_tier} />
                    </div>
                    <p className="mt-2 text-sm text-white/60">{d.summary}</p>
                    {d.matched_runbook_key && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                        <Wrench size={12} /> Matched runbook: <code className="text-white/60">{d.matched_runbook_key}</code>
                      </p>
                    )}
                    {d.could_reproduce !== null && d.could_reproduce !== undefined && (
                      <p className="mt-1 text-xs text-white/40">
                        Could reproduce: {d.could_reproduce ? "Yes" : "No"}
                      </p>
                    )}
                    {Boolean(d.evidence) && (
                      <div className="mt-2">
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                          <ListChecks size={11} /> Evidence
                        </p>
                        <pre className="overflow-x-auto rounded bg-black/30 p-2 text-[11px] text-white/50">
                          {JSON.stringify(d.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-white/25">
                      {d.model ? `${d.model} · ` : ""}
                      {formatRelativeTime(d.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions timeline */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              <Wrench size={13} /> Actions
            </h3>
            {actions.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No actions yet.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((a) => (
                  <div key={a.id} className="rounded-lg bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">
                        {a.runbook?.title || a.runbook_key}
                      </span>
                      <TicketActionStatusBadge status={a.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-white/30">
                      <TicketTierBadge tier={a.tier} size="sm" />
                      <span>Proposed {formatRelativeTime(a.created_at)}</span>
                      {a.decided_at && <span>Decided {formatRelativeTime(a.decided_at)}</span>}
                      {a.executed_at && <span>Executed {formatRelativeTime(a.executed_at)}</span>}
                      {a.verified_at && <span>Verified {formatRelativeTime(a.verified_at)}</span>}
                    </div>
                    {a.approved_by && (
                      <p className="mt-1.5 text-xs text-white/40">Approved by {a.approved_by}</p>
                    )}
                    {a.error && (
                      <p className="mt-2 rounded border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300">
                        {a.error}
                      </p>
                    )}
                    {Boolean(a.result) && (
                      <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2 text-[11px] text-white/50">
                        {JSON.stringify(a.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
