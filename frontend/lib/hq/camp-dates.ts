// Calendar dates in camp local time (America/New_York), as "YYYY-MM-DD"
// strings. Safe to import from client components.
import { CAMP_TIME_ZONE } from "./schedule-times.ts";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The camp-local date at `now`, e.g. "2027-07-06". */
export function campDate(now: Date): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isCampDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function toUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtc(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** The date `days` after `date` (before, when negative). */
export function addDays(date: string, days: number): string {
  const moved = toUtc(date);
  moved.setUTCDate(moved.getUTCDate() + days);
  return fromUtc(moved);
}

/** The Monday of the week (Monday to Sunday) that holds `date`. */
export function weekStart(date: string): string {
  const day = toUtc(date).getUTCDay(); // 0 Sunday … 6 Saturday
  return addDays(date, day === 0 ? -6 : 1 - day);
}

/** The Sunday that ends the week (Monday to Sunday) that holds `date`. */
export function weekEnd(date: string): string {
  return addDays(weekStart(date), 6);
}

/** "Tuesday, July 6, 2027". */
export function formatCampDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toUtc(date));
}

/** "Tuesday, July 6, 2027 at 9:05 AM", in camp local time. */
export function formatCampDateTime(at: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return `${formatCampDate(campDate(at))} at ${time}`;
}
