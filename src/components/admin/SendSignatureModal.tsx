"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, PenLine, XCircle } from "lucide-react";
import type { Contract } from "@/lib/crm/types";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

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
    <Modal
      title="Send for signature"
      description={
        <>
          {contract.title} <span className="text-ink-3">· {contract.file_name}</span>
        </>
      }
      onClose={onClose}
      footer={
        !isPdf ? undefined : result ? (
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={signerName.trim().length < 2 || !signerEmail.includes("@")}
              loading={sending}
            >
              {!sending && <PenLine size={14} />}
              Send for signature
            </Button>
          </>
        )
      }
    >
      {!isPdf ? (
        <p className="rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-warn">
          Only PDF contracts can be sent for e-signature. Export this document to PDF and
          re-upload it first.
        </p>
      ) : result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-good/40 bg-good-soft p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-good">
              <Check size={16} />
              {result.email_sent
                ? `Signing link emailed to ${signerEmail.trim()}`
                : "Signing link created — email not configured, share it manually:"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value={result.signing_url} className="flex-1 truncate text-xs" />
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? <Check size={14} className="text-good" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hasPendingRequest && (
            <p className="rounded-lg border border-accent/30 bg-accent-soft p-3 text-xs text-accent-ink">
              A signing link is already outstanding for this contract. Sending a new one will
              cancel the old link.
            </p>
          )}

          <Field label="Signer name">
            <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="e.g. Jane Smith" />
          </Field>

          <Field label="Signer email">
            <Input
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="jane@company.com"
            />
          </Field>

          <Field label="Link expires in">
            <Select value={expiresDays} onChange={(e) => setExpiresDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </Select>
          </Field>

          {hasPendingRequest && (
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={handleCancelPending}
              loading={cancelling}
            >
              {!cancelling && <XCircle size={12} />}
              Cancel outstanding signing link
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
