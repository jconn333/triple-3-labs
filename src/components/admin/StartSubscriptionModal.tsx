"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button, Modal } from "@/components/ui";

interface Preview {
  eligible: boolean;
  reason?: string;
  method?: { rail: "ach" | "card"; label: string };
  monthly_amount_cents?: number;
}

interface StartSubscriptionModalProps {
  accountId: string;
  accountName: string;
  onClose: () => void;
  onStarted: () => void;
}

export default function StartSubscriptionModal({
  accountId,
  accountName,
  onClose,
  onStarted,
}: StartSubscriptionModalProps) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/accounts/${accountId}/subscription`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(res.status === 401 ? "Session expired; reload this page." : data.error || "Could not load Stripe details");
        }
        return res.json();
      })
      .then(setPreview)
      .catch((err) => setPreviewError(err instanceof Error ? err.message : "Could not load Stripe details"))
      .finally(() => setLoading(false));
  }, [accountId]);

  const amount =
    preview?.monthly_amount_cents != null
      ? (preview.monthly_amount_cents / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "usd",
        })
      : null;

  async function handleStart() {
    if (loading || starting || !preview?.eligible) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/subscription`, { method: "POST" });
      const data = await res.json();
      if (res.status === 409) {
        setPreview({ eligible: false, reason: data.error });
      }
      if (!res.ok) throw new Error(res.status === 401 ? "Session expired; reload this page." : data.error || "Failed to start subscription");
      toast.success(`Subscription started — ${amount}/mo`);
      onStarted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start subscription");
    } finally {
      setStarting(false);
    }
  }

  return (
    <Modal
      title="Start monthly subscription"
      onClose={onClose}
      size="sm"
      footer={
        loading ? undefined : !preview?.eligible ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStart} loading={starting}>
              Start &amp; charge {amount}
            </Button>
          </>
        )
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-2">
          Checking Stripe…
        </div>
      ) : previewError ? (
        <p role="alert" className="rounded-lg border border-bad/40 bg-bad-soft p-3 text-sm text-bad">{previewError}</p>
      ) : !preview?.eligible ? (
        <p className="rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-warn">
          {preview?.reason || "Not eligible to start a subscription."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-line bg-ground p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-3">Account</span>
              <span className="text-ink">{accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">Payment method on file</span>
              <span className="capitalize text-ink">{preview.method?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">Monthly charge</span>
              <span className="font-semibold text-ink">
                {amount}/mo{preview.method?.rail === "card" ? " (incl. 3% card fee)" : ""}
              </span>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-3">
            <CalendarClock size={14} className="mt-0.5 shrink-0" />
            Today becomes the Service Start Date: the saved payment method is charged
            immediately and on this day of each month going forward. Stripe emails the
            client a receipt each cycle.
          </p>
        </div>
      )}
    </Modal>
  );
}
