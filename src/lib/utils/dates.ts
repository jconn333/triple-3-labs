/** Postgres date values are local calendar dates, not UTC instants. */
export function parseDateOnly(value: string | Date): Date {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
}

function calendarDay(value: string | Date): number {
  const date = parseDateOnly(value);
  // UTC is used only for day arithmetic, so DST days still count as one day.
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

export function daysUntil(nextDue: string | Date, today: string | Date = new Date()): number {
  return calendarDay(nextDue) - calendarDay(today);
}

export function isOverdue(
  nextDue: string | null | undefined,
  graceDays: number | null | undefined = 2,
  today: string | Date = new Date(),
): boolean {
  return !!nextDue && daysUntil(nextDue, today) < -(graceDays ?? 2);
}
