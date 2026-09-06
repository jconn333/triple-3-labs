import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  body,
  action,
  className,
  compact,
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-6" : "px-6 py-12", className)}>
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sub text-ink-3">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
