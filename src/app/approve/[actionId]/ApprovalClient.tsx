"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Building2, Gauge } from "lucide-react";

export interface ApprovalActionView {
  id: string;
  tier: number;
  action_params: unknown;
  ticket: {
    id: string;
    ticket_number: number;
    subject: string;
    description: string;
    status: string;
    severity: string;
    account_name: string | null;
  };
  runbook: {
    key: string;
    title: string;
    description: string | null;
    tier: number;
  } | null;
  diagnosis: {
    category: string;
    summary: string;
    confidence: string | null;
    proposed_tier: number;
  } | null;
}

type Decision = "approve" | "reject";

export default function ApprovalClient({ action, token }: { action: ApprovalActionView; token: string }) {
  const [submitting, setSubmitting] = useState<Decision | null>(null);
  const [decided, setDecided] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: Decision) {
    setSubmitting(decision);
    setError(null);
    try {
      const res = await fetch(`/api/ticket-actions/${action.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDecided(decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(null);
    }
  }

  if (decided) {
    const isApprove = decided === "approve";
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        {isApprove ? (
          <CheckCircle2 size={32} className="mx-auto mb-4 text-emerald-400" />
        ) : (
          <XCircle size={32} className="mx-auto mb-4 text-rose-400" />
        )}
        <h1 className="mb-2 text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {isApprove ? "Fix approved" : "Fix rejected"}
        </h1>
        <p className="text-sm text-white/50">
          {isApprove
            ? `The worker will proceed with "${action.runbook?.title ?? "the fix"}" on ticket #${action.ticket.ticket_number}.`
            : `Ticket #${action.ticket.ticket_number} has been escalated for you to handle directly.`}
        </p>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
    low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    normal: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    high: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    urgent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/40">Ticket #{action.ticket.ticket_number}</p>
          <h1 className="mt-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {action.ticket.subject}
          </h1>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
            severityColors[action.ticket.severity] || severityColors.normal
          }`}
        >
          {action.ticket.severity}
        </span>
      </div>

      {action.ticket.account_name && (
        <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
          <Building2 size={14} className="text-white/30" />
          {action.ticket.account_name}
        </div>
      )}

      <div className="mb-4 rounded-lg bg-white/[0.03] p-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">Proposed fix</p>
        <p className="text-sm font-medium text-white">{action.runbook?.title ?? action.runbook?.key ?? "Unknown runbook"}</p>
        {action.runbook?.description && (
          <p className="mt-1 text-xs text-white/50">{action.runbook.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
          <Gauge size={12} />
          Tier {action.tier}
        </div>
        {Boolean(action.action_params) && (
          <pre className="mt-3 overflow-x-auto rounded bg-black/30 p-3 text-[11px] text-white/50">
            {JSON.stringify(action.action_params, null, 2)}
          </pre>
        )}
      </div>

      {action.diagnosis && (
        <div className="mb-6 rounded-lg bg-white/[0.03] p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            AI diagnosis &middot; {action.diagnosis.category}
            {action.diagnosis.confidence && ` · ${action.diagnosis.confidence} confidence`}
          </p>
          <p className="text-sm text-white/60">{action.diagnosis.summary}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => decide("approve")}
          disabled={submitting !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {submitting === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Approve
        </button>
        <button
          onClick={() => decide("reject")}
          disabled={submitting !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500/25 disabled:opacity-50"
        >
          {submitting === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
      </div>
    </div>
  );
}
