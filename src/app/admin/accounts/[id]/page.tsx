"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Mail, Building2, Upload, ExternalLink, FileText,
  Download, Trash2, Clock, CreditCard, ArrowRight,
  Sparkles, Receipt, PenLine, Stamp, ClipboardList,
  ClipboardCheck, Send, X, RefreshCw, Copy, Check,
} from "lucide-react";
import { formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils/format";
import AccountStatusBadge from "@/components/admin/AccountStatusBadge";
import ContractUploadModal from "@/components/admin/ContractUploadModal";
import SendSignatureModal from "@/components/admin/SendSignatureModal";
import CounterSignModal from "@/components/admin/CounterSignModal";
import StartSubscriptionModal from "@/components/admin/StartSubscriptionModal";
import SendOnboardingModal from "@/components/admin/SendOnboardingModal";
import { getFormSpec } from "@/lib/onboarding/forms";
import type { Account, Contract, Activity, SubscriptionSummary, InvoiceSummary, OnboardingRequest } from "@/lib/crm/types";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [sigContract, setSigContract] = useState<Contract | null>(null);
  const [counterSignContract, setCounterSignContract] = useState<Contract | null>(null);
  const [showStartSub, setShowStartSub] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingRequests, setOnboardingRequests] = useState<OnboardingRequest[]>([]);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [resendResult, setResendResult] = useState<{
    requestId: string;
    onboarding_url: string;
    email_sent: boolean;
    email_error?: string;
  } | null>(null);
  const [resendCopied, setResendCopied] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccount(data.account);
      setContracts(data.contracts || []);
      setActivities(data.activities || []);
      setNotes(data.account.notes || "");
    } catch {
      toast.error("Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  // Lazy-load Stripe data
  const fetchStripeData = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${id}/subscriptions`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setInvoices(data.invoices || []);
    } catch {
      // Silently fail — Stripe data is optional
    } finally {
      setSubsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStripeData();
  }, [fetchStripeData]);

  // Lazy-load onboarding requests
  const fetchOnboarding = useCallback(async () => {
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOnboardingRequests(data.requests || []);
    } catch {
      // Silently fail — onboarding requests are optional
    } finally {
      setOnboardingLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOnboarding();
  }, [fetchOnboarding]);

  async function handleCancelOnboarding(requestId: string) {
    if (!confirm("Cancel this onboarding request? The recipient's link will stop working.")) return;
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding?requestId=${requestId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Onboarding request cancelled");
      fetchOnboarding();
    } catch {
      toast.error("Failed to cancel onboarding request");
    }
  }

  async function handleResendOnboarding(r: OnboardingRequest) {
    if (
      !confirm("Generate a new link? The previous link will stop working immediately.")
    )
      return;
    setResending(r.id);
    try {
      const res = await fetch(`/api/accounts/${id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: r.id,
          send_email: Boolean(r.recipient_email),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend link");
      setResendResult({
        requestId: r.id,
        onboarding_url: data.onboarding_url,
        email_sent: data.email_sent,
        email_error: data.email_error,
      });
      toast.success(data.email_sent ? "New link emailed" : "New link generated");
      fetchOnboarding();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend onboarding link");
    } finally {
      setResending(null);
    }
  }

  async function copyResendLink() {
    if (!resendResult) return;
    await navigator.clipboard.writeText(resendResult.onboarding_url);
    setResendCopied(true);
    setTimeout(() => setResendCopied(false), 2000);
  }

  // Auto-save notes with debounce
  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/accounts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
      } catch {
        toast.error("Failed to save notes");
      }
    }, 1000);
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAccount(data.account);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDownload(contractId: string) {
    try {
      const res = await fetch(`/api/accounts/${id}/contracts/${contractId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      window.open(data.download_url, "_blank");
    } catch {
      toast.error("Failed to get download link");
    }
  }

  async function handleDeleteContract(contractId: string, title: string) {
    if (!confirm(`Delete contract "${title}"?`)) return;
    try {
      const res = await fetch(`/api/accounts/${id}/contracts/${contractId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast.success("Contract deleted");
    } catch {
      toast.error("Failed to delete contract");
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

  if (!account) {
    return <div className="glass-card rounded-xl p-8 text-center text-white/50">Account not found.</div>;
  }

  const contact = account.contact;

  const contractStatusColors: Record<string, string> = {
    draft: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    sent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    partially_signed: "text-violet-300 bg-violet-500/10 border-violet-500/25",
    signed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    expired: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    cancelled: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const signedRoles = (c: Contract) =>
    new Set((c.signatures || []).filter((s) => s.status === "signed").map((s) => s.signer_role));

  const onboardingStatusColors: Record<string, string> = {
    pending: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    viewed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    submitted: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    expired: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    cancelled: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  const onboardingTimestamp = (r: OnboardingRequest) => {
    if (r.status === "submitted" && r.submitted_at) return `Submitted ${formatDate(r.submitted_at)}`;
    if (r.status === "viewed" && r.viewed_at) return `Viewed ${formatDate(r.viewed_at)}`;
    if (r.status === "cancelled") return `Sent ${r.sent_at ? formatDate(r.sent_at) : "—"} · cancelled`;
    if (r.status === "expired") return `Expired ${r.expires_at ? formatDate(r.expires_at) : ""}`;
    return r.sent_at ? `Sent ${formatDate(r.sent_at)}` : `Created ${formatDate(r.created_at)}`;
  };

  const activityIcons: Record<string, typeof Clock> = {
    account_created: Building2,
    contract_uploaded: FileText,
    contract_deleted: Trash2,
    status_change: ArrowRight,
    ai_scoring: Sparkles,
    ai_follow_up: Mail,
    form_submission: FileText,
    stage_change: ArrowRight,
    note: FileText,
    onboarding_sent: Send,
    onboarding_submitted: ClipboardCheck,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Account Info + Actions */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {account.name}
              </h2>
              <AccountStatusBadge status={account.status} size="md" />
            </div>

            {contact && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-white/30" />
                  <a href={`mailto:${contact.email}`} className="text-white/70 hover:text-violet">{contact.email}</a>
                </div>
                {contact.company && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={14} className="text-white/30" />
                    <span className="text-white/70">{contact.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-white/30" />
                  <Link href={`/admin/contacts/${contact.id}`} className="text-white/50 hover:text-violet text-xs">
                    View contact &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Status dropdown */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-white/30">Status</label>
              <select
                value={account.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet/50"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <p className="mt-4 text-[10px] text-white/30">Created {formatDate(account.created_at)}</p>
          </div>

          {/* Actions */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <button
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center gap-2 rounded-lg bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/20 transition-colors"
            >
              <Upload size={16} /> Upload Contract
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full flex items-center gap-2 rounded-lg bg-violet/10 px-4 py-2.5 text-sm font-medium text-violet hover:bg-violet/20 transition-colors"
            >
              <ClipboardList size={16} /> Onboarding
            </button>
            {account.stripe_customer_id && (
              <a
                href={`https://dashboard.stripe.com/customers/${account.stripe_customer_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 rounded-lg bg-cyan/10 px-4 py-2.5 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors"
              >
                <ExternalLink size={16} /> View in Stripe
              </a>
            )}
          </div>
        </div>

        {/* Right: Notes, Contracts, Subscriptions, Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Notes */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about this account..."
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50 resize-none"
            />
            <p className="mt-1 text-[10px] text-white/20">Auto-saves as you type</p>
          </div>

          {/* Contracts */}
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Contracts</h3>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-violet hover:text-violet/80"
              >
                + Upload
              </button>
            </div>
            {contracts.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No contracts yet.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText size={16} className="shrink-0 text-white/30" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.title}</p>
                        <p className="text-xs text-white/40">{c.file_name} &middot; {formatDate(c.created_at)}</p>
                        {(c.signatures?.some((s) => s.status === "signed")) && (
                          <p className="mt-0.5 text-[10px] text-white/40">
                            Signed by{" "}
                            {signedRoles(c).has("provider") ? "JMC" : ""}
                            {signedRoles(c).size === 2 ? " + " : ""}
                            {signedRoles(c).has("client") ? "client" : ""}
                            {signedRoles(c).size < 2 && (
                              <span className="text-amber-400/70">
                                {" "}· awaiting {signedRoles(c).has("provider") ? "client" : "JMC"}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${contractStatusColors[c.status] || contractStatusColors.draft}`}>
                        {c.status.replace("_", " ")}
                      </span>
                      {!signedRoles(c).has("provider") && (
                        <button onClick={() => setCounterSignContract(c)} className="text-white/30 hover:text-emerald-400" title="Counter-sign as JMC">
                          <Stamp size={14} />
                        </button>
                      )}
                      {!signedRoles(c).has("client") && (
                        <button onClick={() => setSigContract(c)} className="text-white/30 hover:text-violet" title="Send to client for signature">
                          <PenLine size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDownload(c.id)} className="text-white/30 hover:text-white/60" title="Download">
                        <Download size={14} />
                      </button>
                      <button onClick={() => handleDeleteContract(c.id, c.title)} className="text-white/30 hover:text-rose-400" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Onboarding */}
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Onboarding</h3>
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-xs text-violet hover:text-violet/80"
              >
                + Send
              </button>
            </div>
            {onboardingLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
              </div>
            ) : onboardingRequests.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">No onboarding requests yet.</p>
            ) : (
              <div className="space-y-3">
                {onboardingRequests.map((r) => {
                  const spec = getFormSpec(r.form_key);
                  const isOpen = r.status === "pending" || r.status === "viewed";
                  return (
                    <div key={r.id} className="rounded-lg bg-white/[0.03] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {spec?.title || r.form_key}
                          </p>
                          <p className="mt-0.5 text-xs text-white/40">
                            {r.recipient_name ? `${r.recipient_name} · ` : ""}
                            {r.recipient_email}
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/30">{onboardingTimestamp(r)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              onboardingStatusColors[r.status] || onboardingStatusColors.pending
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.status !== "submitted" && (
                            <button
                              onClick={() => handleResendOnboarding(r)}
                              disabled={resending === r.id}
                              className="text-white/30 hover:text-violet disabled:opacity-40"
                              title="Resend link (generates a fresh link; the old one stops working)"
                            >
                              <RefreshCw size={14} className={resending === r.id ? "animate-spin" : ""} />
                            </button>
                          )}
                          {isOpen && (
                            <button
                              onClick={() => handleCancelOnboarding(r.id)}
                              className="text-white/30 hover:text-rose-400"
                              title="Cancel request"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {resendResult && resendResult.requestId === r.id && (
                        <div className="mt-3 space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                              <Check size={14} />
                              {resendResult.email_sent
                                ? "New link emailed — also copyable below:"
                                : "New link generated — share it manually:"}
                            </p>
                            <button
                              onClick={() => setResendResult(null)}
                              className="shrink-0 text-white/40 hover:text-white/60"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {resendResult.email_error && (
                            <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-2.5 text-[11px] text-amber-300">
                              Email could not be sent: {resendResult.email_error} — the link itself is
                              still valid.
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={resendResult.onboarding_url}
                              className="flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none"
                            />
                            <button
                              onClick={copyResendLink}
                              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
                            >
                              {resendCopied ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                              {resendCopied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                      )}

                      {r.status === "submitted" && spec && (
                        <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
                          {spec.sections.map((section, sIdx) => (
                            <div key={sIdx}>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                                {section.title}
                              </p>
                              <div className="space-y-2">
                                {section.fields.map((field) => {
                                  const answer = r.responses?.[field.key];
                                  const detail = r.responses?.[`${field.key}_detail`];
                                  return (
                                    <div key={field.key} className="text-xs">
                                      <p className="text-white/40">{field.label}</p>
                                      {field.type === "checkbox" ? (
                                        <p className="mt-0.5 text-white/80">
                                          {answer === true ? "✓" : answer === false ? "✗" : (
                                            <span className="text-white/30">—</span>
                                          )}
                                        </p>
                                      ) : (
                                        <p className="mt-0.5 whitespace-pre-wrap break-words text-white/80">
                                          {typeof answer === "string" && answer.trim().length > 0 ? (
                                            answer
                                          ) : (
                                            <span className="text-white/30">—</span>
                                          )}
                                          {typeof detail === "string" && detail.trim().length > 0 && (
                                            <span className="text-white/50"> ({detail})</span>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div className="glass-card rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">Subscriptions</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    account.setup_fee_paid_at
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  }`}
                  title={account.setup_fee_paid_at ? `Paid ${formatDate(account.setup_fee_paid_at)}` : "Awaiting implementation-fee payment"}
                >
                  {account.setup_fee_paid_at ? "Setup fee paid" : "Setup fee unpaid"}
                </span>
                {account.setup_fee_paid_at &&
                  account.stripe_customer_id &&
                  !subsLoading &&
                  !subscriptions.some((s) => !["canceled", "incomplete_expired"].includes(s.status)) && (
                    <button
                      onClick={() => setShowStartSub(true)}
                      className="text-xs text-violet hover:text-violet/80"
                    >
                      + Start subscription
                    </button>
                  )}
              </div>
            </div>
            {subsLoading ? (
              <div className="space-y-3">
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
                <div className="h-16 animate-pulse rounded-lg bg-white/5" />
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/30">
                {account.stripe_customer_id ? "No active subscriptions." : "No Stripe customer linked."}
              </p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="rounded-lg bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-white/30" />
                        <span className="text-sm font-medium text-white">
                          {sub.items.map((i) => i.product_name).join(", ")}
                        </span>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        sub.status === "active"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : sub.status === "past_due"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-white/40">
                      {sub.items.map((item, i) => (
                        <span key={i}>
                          {formatCurrency(item.price_amount)}/{item.price_interval}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                        </span>
                      ))}
                      <span>Renews {formatDate(sub.current_period_end)}</span>
                      {sub.default_payment_method && (
                        <span>{sub.default_payment_method.brand} •••• {sub.default_payment_method.last4}</span>
                      )}
                    </div>
                    {sub.cancel_at_period_end && (
                      <p className="mt-2 text-xs text-amber-400">Cancels at end of period</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recent Invoices */}
            {invoices.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <h4 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  <Receipt size={12} /> Recent Invoices
                </h4>
                <div className="space-y-1">
                  {invoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-white/50">{inv.number || inv.id.slice(0, 12)}</span>
                      <span className="text-white/40">{formatDate(inv.created)}</span>
                      <span className="text-white/60">{formatCurrency(inv.amount_due)}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${
                        inv.status === "paid" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                      }`}>
                        {inv.status}
                      </span>
                      {inv.hosted_invoice_url && (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      {/* Upload Modal */}
      {showUpload && (
        <ContractUploadModal
          accountId={id}
          onClose={() => setShowUpload(false)}
          onUploaded={fetchAccount}
        />
      )}

      {/* Counter-sign Modal */}
      {counterSignContract && (
        <CounterSignModal
          accountId={id}
          contract={counterSignContract}
          onClose={() => setCounterSignContract(null)}
          onSigned={fetchAccount}
        />
      )}

      {/* Start Subscription Modal */}
      {showStartSub && (
        <StartSubscriptionModal
          accountId={id}
          accountName={account.name}
          onClose={() => setShowStartSub(false)}
          onStarted={() => {
            setSubsLoading(true);
            fetchStripeData();
            fetchAccount();
          }}
        />
      )}

      {/* Send for Signature Modal */}
      {sigContract && (
        <SendSignatureModal
          accountId={id}
          contract={sigContract}
          defaultSignerName={contact ? `${contact.first_name} ${contact.last_name}`.trim() : ""}
          defaultSignerEmail={contact?.email || ""}
          onClose={() => setSigContract(null)}
          onSent={fetchAccount}
        />
      )}

      {/* Send Onboarding Modal */}
      {showOnboarding && (
        <SendOnboardingModal
          accountId={id}
          defaultRecipientName={contact ? `${contact.first_name} ${contact.last_name}`.trim() : ""}
          defaultRecipientEmail={contact?.email || ""}
          onClose={() => setShowOnboarding(false)}
          onSent={() => {
            fetchOnboarding();
            fetchAccount();
          }}
        />
      )}
    </div>
  );
}
