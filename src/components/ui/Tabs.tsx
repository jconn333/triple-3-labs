"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem<K extends string> {
  key: K;
  label: ReactNode;
  count?: number | null;
}

/** Underline tabs for record pages. */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("-mb-px flex gap-1 overflow-x-auto", className)}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 pb-2.5 pt-2 text-[13px] font-medium transition-colors",
              on ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count !== null && <span className="text-xs tabular-nums text-ink-3">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
