// Weekdays and slot times of a Group schedule. Times are minutes after
// midnight in camp local time (America/New_York); they are wall-clock times and
// are never converted. Safe to import from client components.

export const CAMP_TIME_ZONE = "America/New_York";

export const SCHEDULE_WEEKDAYS = [1, 2, 3, 4, 5] as const;
export type ScheduleWeekday = (typeof SCHEDULE_WEEKDAYS)[number];

export const weekdayLabels: Record<ScheduleWeekday, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

export function isScheduleWeekday(value: unknown): value is ScheduleWeekday {
  return SCHEDULE_WEEKDAYS.includes(value as ScheduleWeekday);
}

/** A new day starts with eleven 30-minute slots from 9:30. */
export const DEFAULT_DAY_START = 9 * 60 + 30;
export const DEFAULT_SLOT_LENGTH = 30;
export const DEFAULT_SLOT_COUNT = 11;

export function defaultDaySlots() {
  return Array.from({ length: DEFAULT_SLOT_COUNT }, (_, index) => {
    const start = DEFAULT_DAY_START + index * DEFAULT_SLOT_LENGTH;
    return { start, end: start + DEFAULT_SLOT_LENGTH };
  });
}

/** "9:30" or "13:05" (24-hour, as a time field sends it) to minutes; null when unreadable. */
export function parseSlotTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) return null;
  return hours * 60 + minutes;
}

/** Minutes to "9:30 AM". */
export function formatSlotTime(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24;
  const rest = String(minutes % 60).padStart(2, "0");
  const suffix = hours < 12 ? "AM" : "PM";
  const clock = hours % 12 === 0 ? 12 : hours % 12;
  return `${clock}:${rest} ${suffix}`;
}

/** Minutes to "09:30", the value a time field expects. */
export function slotTimeValue(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

/** "9:30 AM to 10:00 AM". */
export function formatSlotRange(start: number, end: number) {
  return `${formatSlotTime(start)} to ${formatSlotTime(end)}`;
}

/** Two slots overlap when each starts before the other ends. Back to back is not an overlap. */
export function slotsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
) {
  return a.start < b.end && b.start < a.end;
}
