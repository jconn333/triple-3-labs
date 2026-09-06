"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<V extends string> {
  value: V;
  label: ReactNode;
  count?: number | null;
}

/** Compact filter switch. Use for 2–6 mutually exclusive views. */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("inline-flex h-8 overflow-hidden rounded-[7px] border border-line bg-surface", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-r border-line px-3 text-xs transition-colors last:border-r-0",
              on ? "bg-surface-2 font-medium text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && o.count !== null && (
              <span className={cn("tabular-nums", on ? "text-ink-2" : "text-ink-3")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
