import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1 font-ui-mono text-[11px] text-ink-3",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
