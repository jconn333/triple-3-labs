"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Send, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordShell, Fact, Details } from "@/components/admin/RecordShell";
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  PanelHeader,
  PanelRows,
  PanelSkeleton,
  Select,
  StatusBadge,
  Textarea,
  TierBadge,
  ticketChannelTone,
  toneFor,
  type Tone,
} from "@/components/ui";
import type { Ticket, TicketMessage, TicketDiagnosis, TicketAction, TicketStatus, TicketMessageAuthorType } from "@/lib/crm/types";

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

const AUTHOR_TONE: Record<TicketMessageAuthorType, Tone> = {
  customer: "neutral",
  ai: "accent",
  staff: "neutral",
  system: "neutral",
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmRollbackId, setConfirmRollbackId] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

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

  function customerViewUrl(): string {
    if (!ticket) return "";
    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(
        /\/$/,
        ""
      );
    return `${base}/ticket/${ticket.id}?token=${ticket.view_token}`;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(customerViewUrl());
      setLinkCopied(true);
      toast.success("Customer link copied");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleDecide(actionId: string, decision: "approve" | "reject") {
    const action = actions.find((a) => a.id === actionId);
    if (!action?.approval_token) {
      toast.error("This action has no approval link to decide against.");
      return;
    }
    setDecidingId(actionId);
    try {
      const res = await fetch(`/api/ticket-actions/${actionId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: action.approval_token, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decide");
      toast.success(decision === "approve" ? "Fix approved" : "Fix rejected");
      fetchTicket();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to decide");
    } finally {
      setDecidingId(null);
    }
  }

  async function handleRollback(actionId: string) {
    setRollingBackId(actionId);
    try {
      const res = await fetch(`/api/ticket-actions/${actionId}/rollback`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to roll back");
      toast.success("Fix marked as rolled back — ticket escalated");
      setConfirmRollbackId(null);
      fetchTicket();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to roll back");
    } finally {
      setRollingBackId(null);
    }
  }

  if (loading) {
    return <PanelSkeleton rows={6} />;
  }

  if (!ticket) {
    return <EmptyState title="Ticket not found" />;
  }

  const facts = (
    <>
      <Fact label="Ticket">#{ticket.ticket_number}</Fact>
      {ticket.account?.name && (
        <Fact label="Account">
          <Link href={`/admin/clients/${ticket.account.id}`} className="hover:underline">
            {ticket.account.name}
          </Link>
        </Fact>
      )}
      <Fact label="From">{ticket.contact?.email || ticket.submitter_email || "—"}</Fact>
      <Fact label="Channel">{toneFor(ticketChannelTone, ticket.channel).label}</Fact>
      <Fact label="Severity">
        <StatusBadge kind="severity" value={ticket.severity} />
      </Fact>
      <Fact label="Tier">
        <TierBadge tier={ticket.tier} />
      </Fact>
      <Fact label="Opened">
        <span title={formatDate(ticket.created_at)}>{formatRelativeTime(ticket.created_at)}</span>
      </Fact>
    </>
  );

  return (
    <>
      <PageHeader title={`#${ticket.ticket_number} ${ticket.subject}`} crumb={{ label: "Tickets", href: "/admin/tickets" }} />
      <RecordShell
        title={ticket.subject}
        status={<StatusBadge kind="ticket" value={ticket.status} />}
        facts={facts}
        actions={
          <Select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-[180px]"
            aria-label="Ticket status"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        }
        rail={
          <>
            <Panel>
              <PanelHeader title="Triage" count={diagnoses.length || undefined} />
              {diagnoses.length === 0 ? (
                <EmptyState compact title="No diagnosis yet" />
              ) : (
                <div className="divide-y divide-line">
                  {diagnoses.map((d) => (
                    <div key={d.id}>
                      {d.summary && <p className="break-words px-4 pt-3 text-sm text-ink-2 [overflow-wrap:anywhere]">{d.summary}</p>}
                      <Details
                        items={[
                          { label: "Category", value: d.category },
                          {
                            label: "Confidence",
                            value: d.confidence ? <span className="capitalize">{d.confidence}</span> : null,
                          },
                          {
                            label: "Runbook",
                            value: d.matched_runbook_key ? (
                              <span className="font-ui-mono text-xs">{d.matched_runbook_key}</span>
                            ) : null,
                          },
                          { label: "Tier", value: <TierBadge tier={d.proposed_tier} /> },
                          ...(d.could_reproduce !== null && d.could_reproduce !== undefined
                            ? [{ label: "Reproduced", value: d.could_reproduce ? "Yes" : "No" }]
                            : []),
                        ]}
                      />
                      {Boolean(d.evidence) && <JsonDetails label="Evidence" value={d.evidence} />}
                      <p className="-mt-1 px-4 pb-3 text-xs text-ink-3">
                        {d.model ? `${d.model} · ` : ""}
                        {formatRelativeTime(d.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Actions" count={actions.length || undefined} />
              {actions.length === 0 ? (
                <EmptyState compact title="No actions yet" />
              ) : (
                <div className="divide-y divide-line">
                  {actions.map((a) => (
                    <div key={a.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{a.runbook?.title || a.runbook_key}</span>
                        <StatusBadge kind="action" value={a.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                        <TierBadge tier={a.tier} size="sm" />
                        <span>Proposed {formatRelativeTime(a.created_at)}</span>
                        {a.decided_at && <span>Decided {formatRelativeTime(a.decided_at)}</span>}
                        {a.executed_at && <span>Executed {formatRelativeTime(a.executed_at)}</span>}
                        {a.verified_at && <span>Verified {formatRelativeTime(a.verified_at)}</span>}
                      </div>
                      {a.approved_by && <p className="mt-1 text-xs text-ink-3">Approved by {a.approved_by}</p>}
                      {a.error && (
                        <p className="mt-2 rounded border border-line bg-bad-soft px-2.5 py-1.5 text-xs text-bad">{a.error}</p>
                      )}
                      {Boolean(a.result) && <JsonDetails label="Result" value={a.result} className="mt-2 -mx-4" />}

                      {a.status === "proposed" && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDecide(a.id, "approve")}
                            loading={decidingId === a.id}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDecide(a.id, "reject")}
                            loading={decidingId === a.id}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {(a.status === "executed" || a.status === "verified") && (
                        <div className="mt-2.5 border-t border-line pt-2.5">
                          {confirmRollbackId === a.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-warn">Roll back this fix and escalate the ticket?</span>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRollback(a.id)}
                                loading={rollingBackId === a.id}
                              >
                                Confirm rollback
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmRollbackId(null)}
                                disabled={rollingBackId === a.id}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => setConfirmRollbackId(a.id)}>
                              <Undo2 size={12} /> Mark rolled back
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Details" />
              <Details
                items={[
                  { label: "Escalation", value: ticket.escalation_reason },
                  { label: "Reopened", value: ticket.reopened_count > 0 ? `×${ticket.reopened_count}` : "Never" },
                  {
                    label: "Customer link",
                    value: (
                      <div className="flex items-center gap-1.5">
                        <code className="min-w-0 flex-1 truncate rounded bg-surface-2 px-1.5 py-0.5 font-ui-mono text-xs text-ink-2">
                          {customerViewUrl()}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleCopyLink}
                          title="Copy customer link"
                          aria-label="Copy customer link"
                        >
                          {linkCopied ? <Check size={12} className="text-good" /> : <Copy size={12} />}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </Panel>
          </>
        }
      >
        {ticket.status === "escalated" && ticket.escalation_reason && (
          <Panel className="border-l-[3px] border-l-bad">
            <div className="flex items-start gap-2.5 px-4 py-3 text-sm">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-bad" />
              <div>
                <p className="font-medium text-ink">Escalated</p>
                <p className="text-ink-2">{ticket.escalation_reason}</p>
              </div>
            </div>
          </Panel>
        )}

        <Panel>
          <PanelHeader title="Conversation" count={messages.length} />
          {messages.length === 0 ? (
            <EmptyState compact title="No messages yet" />
          ) : (
            <PanelRows>
              {messages.map((m) => (
                <div key={m.id} className={cn("px-4 py-3", m.is_internal && "bg-surface-2")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{m.author_name || m.author_type}</span>
                    <Badge tone={AUTHOR_TONE[m.author_type] ?? "neutral"} size="sm">
                      {m.author_type}
                    </Badge>
                    <span className="text-xs text-ink-3">{formatRelativeTime(m.created_at)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-2">{m.body}</p>
                </div>
              ))}
            </PanelRows>
          )}

          <form onSubmit={handleReplySubmit} className="border-t border-line p-4">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={replyInternal ? "Add an internal note (staff only)…" : "Reply to the customer…"}
              rows={3}
            />
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sub text-ink-2">
                <input
                  type="checkbox"
                  checked={replyInternal}
                  onChange={(e) => setReplyInternal(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line-strong accent-accent"
                />
                Internal note (not visible to customer)
              </label>
              <Button type="submit" variant="primary" size="sm" disabled={!replyBody.trim()} loading={sending}>
                <Send size={13} />
                {replyInternal ? "Add note" : "Send reply"}
              </Button>
            </div>
          </form>
        </Panel>
      </RecordShell>
    </>
  );
}

/** Raw JSON (evidence, results) tucked behind a disclosure so the rail stays readable. */
function JsonDetails({ label, value, className }: { label: string; value: unknown; className?: string }) {
  return (
    <details className={className ?? "px-4 pb-2"}>
      <summary className="cursor-pointer select-none text-xs font-medium text-ink-2 hover:text-ink">{label}</summary>
      <pre className="mt-1.5 max-h-64 overflow-auto rounded-md bg-surface-2 p-2.5 font-ui-mono text-[12px] leading-relaxed text-ink-2">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
