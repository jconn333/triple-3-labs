"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { formatCurrency, daysInStage } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal } from "@/lib/crm/types";

interface DealCardProps {
  deal: Deal;
  isDragOverlay?: boolean;
  onDelete?: (deal: Deal) => void;
  onOpen?: (deal: Deal) => void;
}

/** Kanban card: name, who, amount, and the two signals that predict a close. */
export default function DealCard({ deal, isDragOverlay, onDelete, onOpen }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [now] = useState(() => Date.now());

  const who = deal.contact
    ? deal.contact.company || `${deal.contact.first_name} ${deal.contact.last_name}`.trim()
    : null;
  const age = daysInStage(deal.updated_at || deal.created_at);
  const views = deal.report_engagement?.views ?? null;
  const lastViewed = deal.report_engagement?.last_viewed_at ?? null;
  const hot = lastViewed && now - new Date(lastViewed).getTime() < 3 * 86_400_000;
  const quiet = age >= 7 && !hot;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(deal)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onOpen) onOpen(deal);
      }}
      className={cn(
        "group relative cursor-grab rounded-lg border border-line bg-surface px-3 py-2.5 text-sub transition-colors hover:border-line-strong active:cursor-grabbing",
        isDragging && "opacity-30",
        isDragOverlay && "rotate-1 shadow-pop",
      )}
    >
      {onDelete && !isDragOverlay && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(deal);
          }}
          aria-label="Delete deal"
          className="absolute right-1.5 top-1.5 rounded p-1 text-ink-3 opacity-0 transition hover:bg-bad-soft hover:text-bad focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      )}

      <p className="pr-5 text-sm font-medium leading-snug text-ink">{deal.name}</p>

      <div className="mt-1 flex items-center gap-2 text-ink-3">
        <span className="min-w-0 flex-1 truncate">{who ?? "—"}</span>
        <span className="shrink-0 font-medium tabular-nums text-ink">{deal.amount ? formatCurrency(deal.amount) : ""}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <span className={cn("tabular-nums", quiet ? "font-medium text-warn" : "text-ink-3")}>
          {age === 0 ? "today" : `${age}d in stage`}
        </span>
        <span className="flex-1" />
        {views !== null && (
          <span className={cn("tabular-nums", hot ? "font-medium text-good" : "text-ink-3")}>
            {views > 0 ? `${views} report ${views === 1 ? "view" : "views"}` : "report unopened"}
          </span>
        )}
      </div>
    </div>
  );
}
