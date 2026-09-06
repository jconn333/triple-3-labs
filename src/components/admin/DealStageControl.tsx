"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";
import type { Deal, PipelineStage } from "@/lib/crm/types";

// Close (or reopen) a deal without visiting the pipeline board. Used on both the
// contact and account detail pages. Writes through PATCH /api/deals/[id], which
// stamps closed_at and logs a stage_change activity on the account timeline.

// Stages rarely change; fetch once and share across every control on the page.
let stagesCache: PipelineStage[] | null = null;
let stagesPromise: Promise<PipelineStage[]> | null = null;

async function loadStages(): Promise<PipelineStage[]> {
  if (stagesCache) return stagesCache;
  if (!stagesPromise) {
    stagesPromise = fetch("/api/pipeline")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("stages"))))
      .then((d) => {
        stagesCache = (d.stages ?? []) as PipelineStage[];
        return stagesCache;
      })
      .catch((e) => {
        stagesPromise = null; // allow a retry on the next mount
        throw e;
      });
  }
  return stagesPromise;
}

export default function DealStageControl({
  deal,
  onChanged,
}: {
  deal: Deal;
  onChanged?: () => void;
}) {
  const [stages, setStages] = useState<PipelineStage[]>(stagesCache ?? []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadStages()
      .then((s) => alive && setStages(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const current = deal.stage ?? stages.find((s) => s.id === deal.stage_id);
  const isClosed = current?.is_closed ?? false;
  const isWon = current?.name === "Won";

  const byName = (name: string) => stages.find((s) => s.name === name);
  // Reopen lands the deal back in the first open stage (Prospecting, else the
  // earliest non-closed stage) so it re-enters the active pipeline.
  const reopenStage =
    byName("Prospecting") ??
    [...stages].sort((a, b) => a.display_order - b.display_order).find((s) => !s.is_closed);

  async function moveTo(stage: PipelineStage | undefined, verb: string) {
    if (!stage || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: stage.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${deal.name} — ${verb}`);
      onChanged?.();
    } catch {
      toast.error("Couldn't update the deal");
      setBusy(false); // onChanged unmounts/refreshes on success, so only reset on failure
    }
  }

  return (
    <div className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2.5">
      {!isClosed ? (
        <>
          <Button variant="primary" size="sm" disabled={busy} onClick={() => moveTo(byName("Won"), "marked won")}>
            Mark won
          </Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={() => moveTo(byName("Lost"), "marked lost")}>
            Mark lost
          </Button>
        </>
      ) : (
        <>
          <span className={cn("text-sub font-medium", isWon ? "text-good" : "text-ink-3")}>
            {isWon ? "Won" : "Lost"}
          </span>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => moveTo(reopenStage, "reopened")}>
            Reopen
          </Button>
        </>
      )}
    </div>
  );
}
