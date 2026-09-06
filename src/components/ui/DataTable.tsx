"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** CSS width for the column (e.g. "140px", "30%"). Unset = auto. */
  width?: string;
  align?: "left" | "right";
  /** Hide the column below this breakpoint. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  render: (row: T) => ReactNode;
  className?: string;
}

const hide: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Whole row navigates here (links/buttons inside still work on their own). */
  rowHref?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: ReactNode;
  emptyBody?: ReactNode;
  emptyAction?: ReactNode;
  /** Wrap in the standard panel border. Default true. */
  framed?: boolean;
  className?: string;
  footer?: ReactNode;
}

const INTERACTIVE = "a,button,input,select,textarea,label,[data-stop]";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  onRowClick,
  loading,
  skeletonRows = 5,
  emptyTitle = "Nothing here yet",
  emptyBody,
  emptyAction,
  framed = true,
  className,
  footer,
}: DataTableProps<T>) {
  const router = useRouter();
  const clickable = Boolean(rowHref || onRowClick);

  const activate = (row: T, e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(INTERACTIVE)) return;
    if (onRowClick) return onRowClick(row);
    const href = rowHref?.(row);
    if (href) router.push(href);
  };

  return (
    <div className={cn(framed && "overflow-hidden rounded-lg border border-line bg-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    "h-9 whitespace-nowrap border-b border-line bg-surface px-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-ink-3 first:pl-4 last:pr-4",
                    c.align === "right" && "text-right",
                    c.hideBelow && hide[c.hideBelow],
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-b-0">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("h-10 px-3 first:pl-4 last:pr-4", c.hideBelow && hide[c.hideBelow])}>
                      <Skeleton className={cn("h-3.5", i % 2 ? "w-24" : "w-32", c.align === "right" && "ml-auto")} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={rowKey(row)}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? (e) => activate(row, e) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" && e.target === e.currentTarget) activate(row, e);
                          }
                        : undefined
                    }
                    data-href={href}
                    className={cn(
                      "group border-b border-line last:border-b-0",
                      clickable && "cursor-pointer hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "h-10 max-w-0 px-3 align-middle first:pl-4 last:pr-4",
                          c.align === "right" && "text-right",
                          c.hideBelow && hide[c.hideBelow],
                          c.className,
                        )}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

/** Primary cell: name on one line, secondary text inline after it. */
export function NameCell({ name, sub, className }: { name: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-baseline gap-2", className)}>
      <span className="max-w-full shrink-0 truncate font-medium text-ink">{name}</span>
      {sub && <span className="hidden min-w-0 truncate text-sub text-ink-3 md:inline">{sub}</span>}
    </span>
  );
}

export function MutedCell({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("block truncate text-sub text-ink-2", className)}>{children}</span>;
}

export function MoneyCell({ amount, per, className }: { amount: number | null | undefined; per?: string; className?: string }) {
  if (amount === null || amount === undefined) return <span className="text-ink-3">—</span>;
  return (
    <span className={cn("whitespace-nowrap font-medium tabular-nums text-ink", className)}>
      ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}
      {per && <span className="font-normal text-ink-3">/{per}</span>}
    </span>
  );
}
