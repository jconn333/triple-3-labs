"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

/**
 * The one record layout: header (name, status, key facts, actions), tabs,
 * a main column and a right rail. Clients, people and tickets all use it.
 */
export function RecordShell<K extends string>({
  title,
  status,
  facts,
  actions,
  tabs,
  tab,
  onTab,
  rail,
  children,
  railWidth = 288,
}: {
  title: ReactNode;
  status?: ReactNode;
  /** Short key facts under the name: `<Fact label="MRR">$499 / mo</Fact>` etc. */
  facts?: ReactNode;
  actions?: ReactNode;
  tabs?: TabItem<K>[];
  tab?: K;
  onTab?: (k: K) => void;
  rail?: ReactNode;
  children: ReactNode;
  railWidth?: number;
}) {
  return (
    <div className="-mx-6 -mt-5">
      <header className="border-b border-line bg-surface px-6 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-[-0.015em] text-ink">{title}</h2>
          {status}
          {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {facts && <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sub text-ink-2">{facts}</div>}
        {tabs && tab && onTab ? (
          <Tabs items={tabs} value={tab} onChange={onTab} className="mt-3" />
        ) : (
          <div className="h-4" />
        )}
      </header>
      <div
        className={cn("grid gap-5 px-6 py-5", rail && "lg:grid-cols-[minmax(0,1fr)_var(--rail)]")}
        style={rail ? ({ "--rail": `${railWidth}px` } as React.CSSProperties) : undefined}
      >
        <div className="flex min-w-0 flex-col gap-5">{children}</div>
        {rail && <aside className="flex min-w-0 flex-col gap-5">{rail}</aside>}
      </div>
    </div>
  );
}

export function Fact({ label, children, className }: { label?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
      {label && <span className="text-ink-3">{label}</span>}
      <span className="font-medium text-ink">{children}</span>
    </span>
  );
}

/** Label / value pairs for a rail panel. */
export function Details({ items, className }: { items: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[104px_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-4 py-3 text-sub", className)}>
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="truncate text-ink-3">{it.label}</dt>
          <dd className="min-w-0 break-words text-ink">{it.value ?? <span className="text-ink-3">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
