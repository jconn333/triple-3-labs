import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** A flat white surface with a hairline. One level of elevation, never nested. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)} {...rest} />;
}

export function PanelHeader({
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
    <header className={cn("flex min-h-11 items-center gap-2 border-b border-line px-4 py-1.5", className)}>
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {count !== undefined && count !== null && <span className="text-sub tabular-nums text-ink-3">{count}</span>}
      {sub && <span className="text-sub text-ink-3">{sub}</span>}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </header>
  );
}

export function PanelBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...rest} />;
}

/** Rows separated by hairlines, for lists inside a Panel. */
export function PanelRows({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("divide-y divide-line", className)} {...rest} />;
}

export function PanelRow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-h-10 items-center gap-3 px-4 py-2 text-sm", className)} {...rest} />;
}

/** Muted footer strip (totals, hints). */
export function PanelFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2 text-sub text-ink-2", className)}
      {...rest}
    />
  );
}
