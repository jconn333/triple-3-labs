"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, PenLine, X, XCircle } from "lucide-react";
import type { Contract } from "@/lib/crm/types";

interface SendSignatureModalProps {
  accountId: string;
  contract: Contract;
  defaultSignerName?: string;
  defaultSignerEmail?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function SendSignatureModal({
  accountId,
  contract,
  defaultSignerName = "",
  defaultSignerEmail = "",
  onClose,
  onSent,
}: SendSignatureModalProps) {
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerEmail, setSignerEmail] = useState(defaultSignerEmail);
  const [expiresDays, setExpiresDays] = useState(14);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState<{ signing_url: string; email_sent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const isPdf = contract.mime_type === "application/pdf";
  const hasPendingRequest = contract.status === "sent";

  async function handleSend() {
    if (signerName.trim().length < 2 || !signerEmail.includes("@")) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/accounts/${accountId}/contracts/${contract.id}/send-signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signer_name: signerName.trim(),
            signer_email: signerEmail.trim(),
            expires_in_days: expiresDays,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult({ signing_url: data.signing_url, email_sent: data.email_sent });
      toast.success(data.email_sent ? "Signing link emailed" : "Signing link created");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send for signature");
    } finally {
      setSending(false);
    }
  }

  async function handleCancelPending() {
    if (!confirm("Cancel the outstanding signing link? The signer's link will stop working.")) return;
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/accounts/${accountId}/contracts/${contract.id}/send-signature`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed");
      toast.success("Signature request cancelled");
      onSent();
      onClose();
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancelling(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.signing_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Send for Signature
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/60">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-white/50">
          {contract.title} <span className="text-white/30">· {contract.file_name}</span>
        </p>

        {!isPdf ? (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            Only PDF contracts can be sent for e-signature. Export this document to PDF and
            re-upload it first.
          </p>
        ) : result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <Check size={16} />
                {result.email_sent
                  ? `Signing link emailed to ${signerEmail.trim()}`
                  : "Signing link created — email not configured, share it manually:"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.signing_url}
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
            {hasPendingRequest && (
              <p className="rounded-lg border border-blue-400/30 bg-blue-400/10 p-3 text-xs text-blue-300">
                A signing link is already outstanding for this contract. Sending a new one will
                cancel the old link.
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Signer name</label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Signer email</label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Link expires in</label>
              <select
                value={expiresDays}
                onChange={(e) => setExpiresDays(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-violet/50"
              >
                <option value={7} className="bg-zinc-900">7 days</option>
                <option value={14} className="bg-zinc-900">14 days</option>
                <option value={30} className="bg-zinc-900">30 days</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={signerName.trim().length < 2 || !signerEmail.includes("@") || sending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet to-purple px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
              >
                {sending ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : (
                  <><PenLine size={16} /> Send for Signature</>
                )}
              </button>
            </div>

            {hasPendingRequest && (
              <button
                onClick={handleCancelPending}
                disabled={cancelling}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-rose-400/70 hover:text-rose-400 disabled:opacity-50"
              >
                {cancelling ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Cancel outstanding signing link
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
