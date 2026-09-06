import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Section title + count on the left, filters/actions on the right. Every list uses this. */
export function SectionHeader({
  title,
  count,
  sub,
  children,
  className,
}: {
  title: ReactNode;
  count?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5 flex min-h-8 flex-wrap items-center gap-x-2.5 gap-y-2", className)}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {count !== undefined && count !== null && <span className="text-sub tabular-nums text-ink-3">{count}</span>}
      {sub && <span className="text-sub text-ink-3">{sub}</span>}
      {children && <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
