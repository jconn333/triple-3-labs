"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ClipboardList, Copy, Plus, Trash2 } from "lucide-react";
import { ONBOARDING_FORMS, type AccessGrant } from "@/lib/onboarding/forms";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

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
    <Modal
      title={
        <span className="flex items-center gap-2">
          <ClipboardList size={16} className="text-ink-2" /> Send onboarding
        </span>
      }
      onClose={onClose}
      size="lg"
      footer={
        result ? (
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
              disabled={recipientName.trim().length < 2 || !recipientEmail.includes("@") || !formKey}
              loading={sending}
            >
              {!sending && <ClipboardList size={14} />}
              Send onboarding
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-good/40 bg-good-soft p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-good">
              <Check size={16} />
              {result.email_sent
                ? `Onboarding link emailed to ${recipientEmail.trim()}`
                : "Onboarding link created — share it manually:"}
            </p>
          </div>
          {result.email_error && (
            <p className="rounded-lg border border-warn/40 bg-warn-soft p-3 text-xs text-warn">
              Email could not be sent: {result.email_error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input readOnly value={result.onboarding_url} className="flex-1 truncate text-xs" />
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? <Check size={14} className="text-good" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Recipient name">
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Jane Smith" />
          </Field>

          <Field label="Recipient email">
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="jane@company.com"
            />
          </Field>

          <Field label="Onboarding form">
            <Select value={formKey} onChange={(e) => setFormKey(e.target.value)}>
              {FORM_OPTIONS.map((spec) => (
                <option key={spec.key} value={spec.key}>
                  {spec.title}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-ink-2">Access grants</label>
              <Button variant="ghost" size="sm" onClick={addGrantRow}>
                <Plus size={12} /> Add row
              </Button>
            </div>
            <div className="space-y-2">
              {grants.map((grant, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={grant.tool}
                    onChange={(e) => updateGrant(idx, { tool: e.target.value })}
                    placeholder="Tool"
                    className="w-[30%] text-xs"
                  />
                  <Input
                    value={grant.address}
                    onChange={(e) => updateGrant(idx, { address: e.target.value })}
                    placeholder="Address to grant (blank = skip)"
                    className="flex-1 font-mono text-xs"
                  />
                  <Input
                    value={grant.role}
                    onChange={(e) => updateGrant(idx, { role: e.target.value })}
                    placeholder="Role"
                    className="w-[22%] text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeGrantRow(idx)}
                    title="Remove row"
                    className="shrink-0 hover:text-bad"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-3">Rows with a blank address are dropped when sending.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Email the link now
          </label>
        </div>
      )}
    </Modal>
  );
}
