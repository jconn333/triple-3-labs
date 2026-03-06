"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Deal } from "@/lib/crm/types";

interface DealCardProps {
  deal: Deal;
  isDragOverlay?: boolean;
}

export default function DealCard({ deal, isDragOverlay }: DealCardProps) {
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
        "glass-card cursor-grab rounded-lg p-3 active:cursor-grabbing",
        isDragging && "opacity-30",
        isDragOverlay && "shadow-xl shadow-violet/20 rotate-2"
      )}
    >
      <p className="text-sm font-medium text-white leading-tight">{deal.name}</p>

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
