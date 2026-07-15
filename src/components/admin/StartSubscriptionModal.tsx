"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2, X } from "lucide-react";

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

  useEffect(() => {
    fetch(`/api/accounts/${accountId}/subscription`)
      .then((r) => r.json())
      .then(setPreview)
      .catch(() => setPreview({ eligible: false, reason: "Could not load Stripe details" }))
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
    setStarting(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/subscription`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start subscription");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Start Monthly Subscription
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/60">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/50">
            <Loader2 size={16} className="animate-spin" /> Checking Stripe…
          </div>
        ) : !preview?.eligible ? (
          <>
            <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
              {preview?.reason || "Not eligible to start a subscription."}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <div className="space-y-3 rounded-lg bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Account</span>
                <span className="text-white">{accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Payment method on file</span>
                <span className="text-white capitalize">{preview.method?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Monthly charge</span>
                <span className="font-semibold text-white">
                  {amount}/mo{preview.method?.rail === "card" ? " (incl. 3% card fee)" : ""}
                </span>
              </div>
            </div>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-white/40">
              <CalendarClock size={14} className="mt-0.5 shrink-0" />
              Today becomes the Service Start Date: the saved payment method is charged
              immediately and on this day of each month going forward. Stripe emails the
              client a receipt each cycle.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={starting}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet to-purple px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
              >
                {starting ? (
                  <><Loader2 size={16} className="animate-spin" /> Starting…</>
                ) : (
                  <>Start &amp; charge {amount}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
