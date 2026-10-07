const INDIA_TIME_ZONE = "Asia/Kolkata";

export function getISTDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

export function formatDateIST(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00+05:30`)
    : new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function weekdayIST(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00+05:30`);
  return new Intl.DateTimeFormat("en-IN", { timeZone: INDIA_TIME_ZONE, weekday: "long" }).format(date);
}

export function formatDateTimeIST(value: string | Date) {
  return formatDateIST(value, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
