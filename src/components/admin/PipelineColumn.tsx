"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DealCard from "./DealCard";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal, PipelineStage } from "@/lib/crm/types";

interface PipelineColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDeleteDeal?: (deal: Deal) => void;
  onOpenDeal?: (deal: Deal) => void;
}

export default function PipelineColumn({ stage, deals, onDeleteDeal, onOpenDeal }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="flex w-[264px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-2">{stage.name}</h3>
        <span className="text-xs tabular-nums text-ink-3">{deals.length}</span>
        {totalValue > 0 && <span className="ml-auto text-xs tabular-nums text-ink-3">{formatCurrency(totalValue)}</span>}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] flex-1 rounded-lg p-1.5 transition-colors",
          isOver ? "bg-accent-soft/60 ring-1 ring-accent/40" : "bg-surface-2/60",
          stage.is_closed && "opacity-80",
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {deals.length === 0 ? (
              <p className="rounded-md border border-dashed border-line-strong px-3 py-5 text-center text-xs text-ink-3">
                Drop a deal here
              </p>
            ) : (
              deals.map((deal) => <DealCard key={deal.id} deal={deal} onDelete={onDeleteDeal} onOpen={onOpenDeal} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
