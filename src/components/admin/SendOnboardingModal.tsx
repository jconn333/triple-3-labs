"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ClipboardList, Copy, Loader2, Plus, Trash2, X } from "lucide-react";
import { ONBOARDING_FORMS, type AccessGrant } from "@/lib/onboarding/forms";

interface SendOnboardingModalProps {
  accountId: string;
  defaultRecipientName?: string;
  defaultRecipientEmail?: string;
  onClose: () => void;
  onSent: () => void;
}

const DEFAULT_GRANTS: AccessGrant[] = [
  {
    tool: "Google Search Console",
    address: "",
    role: "Restricted user",
    url: "https://search.google.com/search-console/users",
  },
  {
    tool: "Google Analytics 4",
    address: "",
    role: "Viewer",
    url: "https://analytics.google.com/analytics/web/",
  },
  {
    tool: "Google Business Profile",
    address: "",
    role: "Manager",
    url: "https://business.google.com/",
  },
];

const FORM_OPTIONS = Object.values(ONBOARDING_FORMS);

export default function SendOnboardingModal({
  accountId,
  defaultRecipientName = "",
  defaultRecipientEmail = "",
  onClose,
  onSent,
}: SendOnboardingModalProps) {
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [formKey, setFormKey] = useState(FORM_OPTIONS[0]?.key ?? "");
  const [grants, setGrants] = useState<AccessGrant[]>(DEFAULT_GRANTS);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    onboarding_url: string;
    email_sent: boolean;
    email_error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function updateGrant(idx: number, patch: Partial<AccessGrant>) {
    setGrants((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addGrantRow() {
    setGrants((prev) => [...prev, { tool: "", address: "", role: "" }]);
  }

  function removeGrantRow(idx: number) {
    setGrants((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    if (recipientName.trim().length < 2 || !recipientEmail.includes("@") || !formKey) return;
    setSending(true);
    try {
      const cleanGrants = grants.filter((g) => g.address.trim().length > 0);
      const res = await fetch(`/api/accounts/${accountId}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_key: formKey,
          recipient_name: recipientName.trim(),
          recipient_email: recipientEmail.trim(),
          access_grants: cleanGrants.length > 0 ? cleanGrants : undefined,
          send_email: sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult({
        onboarding_url: data.onboarding_url,
        email_sent: data.email_sent,
        email_error: data.email_error,
      });
      toast.success(data.email_sent ? "Onboarding link emailed" : "Onboarding link created");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send onboarding request");
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.onboarding_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3
            className="flex items-center gap-2 text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            <ClipboardList size={18} className="text-violet" /> Send Onboarding
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/60">
            <X size={20} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <Check size={16} />
                {result.email_sent
                  ? `Onboarding link emailed to ${recipientEmail.trim()}`
                  : "Onboarding link created — share it manually:"}
              </p>
            </div>
            {result.email_error && (
              <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
                Email could not be sent: {result.email_error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.onboarding_url}
                className="flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/70 outline-none"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/70 hover:bg-white/5"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Recipient name
              </label>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Recipient email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">
                Onboarding form
              </label>
              <select
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet/50"
              >
                {FORM_OPTIONS.map((spec) => (
                  <option key={spec.key} value={spec.key} className="bg-zinc-900">
                    {spec.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-white/60">Access grants</label>
                <button
                  type="button"
                  onClick={addGrantRow}
                  className="flex items-center gap-1 text-xs text-violet hover:text-violet/80"
                >
                  <Plus size={12} /> Add row
                </button>
              </div>
              <div className="space-y-2">
                {grants.map((grant, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={grant.tool}
                      onChange={(e) => updateGrant(idx, { tool: e.target.value })}
                      placeholder="Tool"
                      className="w-[30%] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet/50"
                    />
                    <input
                      value={grant.address}
                      onChange={(e) => updateGrant(idx, { address: e.target.value })}
                      placeholder="Address to grant (blank = skip)"
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-violet/50"
                    />
                    <input
                      value={grant.role}
                      onChange={(e) => updateGrant(idx, { role: e.target.value })}
                      placeholder="Role"
                      className="w-[22%] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-violet/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeGrantRow(idx)}
                      className="shrink-0 text-white/30 hover:text-rose-400"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-white/30">
                Rows with a blank address are dropped when sending.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 accent-violet-500"
              />
              Email the link now
            </label>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={
                  recipientName.trim().length < 2 ||
                  !recipientEmail.includes("@") ||
                  !formKey ||
                  sending
                }
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet to-purple px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <ClipboardList size={16} /> Send Onboarding
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
