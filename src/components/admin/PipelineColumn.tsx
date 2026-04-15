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
}

export default function PipelineColumn({ stage, deals, onDeleteDeal }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white/80">{stage.name}</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-[10px] text-white/40">{formatCurrency(totalValue)}</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[200px] rounded-xl border border-white/5 p-2 transition-colors",
          isOver ? "border-violet/30 bg-violet/5" : "bg-white/[0.01]",
          stage.is_closed && "opacity-70"
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {deals.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/20">No deals</p>
            ) : (
              deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onDelete={onDeleteDeal} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
