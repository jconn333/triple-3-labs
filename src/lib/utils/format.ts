import { parseDateOnly } from "./dates";

export function formatCurrency(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  // Date-only values (Postgres `date` columns like commitments.next_due arrive
  // as "2026-10-01") would otherwise parse as UTC midnight and render a day
  // early in US timezones ("Sep 30"). Pin them to local midnight instead.
  const value = parseDateOnly(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function daysInStage(createdDate: string): number {
  const now = new Date();
  const created = new Date(createdDate);
  return Math.floor((now.getTime() - created.getTime()) / 86400000);
}
