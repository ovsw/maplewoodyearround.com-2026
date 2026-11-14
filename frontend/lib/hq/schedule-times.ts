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

/** The weekday at `now` in camp local time, or null on a weekend. */
export function campWeekday(now: Date): ScheduleWeekday | null {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: CAMP_TIME_ZONE, weekday: "long" })
    .format(now);
  const found = SCHEDULE_WEEKDAYS.find((weekday) => weekdayLabels[weekday] === name);
  return found ?? null;
}

/** The camp local weekday (null on a weekend) and minutes after midnight at `now`. */
export type CampClock = { weekday: ScheduleWeekday | null; minute: number };

const campClockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMP_TIME_ZONE,
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function campClock(now: Date): CampClock {
  const parts = campClockFormat.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  const name = part("weekday");
  const weekday = SCHEDULE_WEEKDAYS.find((day) => weekdayLabels[day] === name) ?? null;
  return { weekday, minute: (Number(part("hour")) % 24) * 60 + Number(part("minute")) };
}

/**
 * True when the slot is running at the camp clock: same weekday, started, not
 * yet ended. A slot ends at its end minute, so at 10:00 the 9:30 to 10:00 slot
 * is over and the 10:00 slot is current.
 */
export function isCurrentSlot(
  slot: { weekday: number; start: number; end: number },
  clock: CampClock,
) {
  return (
    clock.weekday !== null &&
    slot.weekday === clock.weekday &&
    slot.start <= clock.minute &&
    clock.minute < slot.end
  );
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
