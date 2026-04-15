"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal } from "@/lib/crm/types";

interface DealCardProps {
  deal: Deal;
  isDragOverlay?: boolean;
  onDelete?: (deal: Deal) => void;
}

export default function DealCard({ deal, isDragOverlay, onDelete }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "glass-card group relative cursor-grab rounded-lg p-3 active:cursor-grabbing",
        isDragging && "opacity-30",
        isDragOverlay && "shadow-xl shadow-violet/20 rotate-2"
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
          aria-label="Delete lead"
          className="absolute right-1.5 top-1.5 rounded p-1 text-white/30 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      )}

      <p className="pr-5 text-sm font-medium text-white leading-tight">{deal.name}</p>

      {deal.amount && (
        <p className="mt-1 text-xs font-semibold text-emerald-400">
          {formatCurrency(deal.amount)}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {deal.contact_id ? (
          <Link href={`/admin/contacts/${deal.contact_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-violet hover:underline">
            View contact
          </Link>
        ) : <span />}
        <span className="text-[10px] text-white/30">{formatRelativeTime(deal.created_at)}</span>
      </div>
    </div>
  );
}
