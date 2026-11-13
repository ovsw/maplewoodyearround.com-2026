import { describe, expect, it } from "vitest";

import {
  campWeekday,
  defaultDaySlots,
  formatSlotRange,
  parseSlotTime,
  slotsOverlap,
  slotTimeValue,
} from "./schedule-times";

describe("Group schedule times", () => {
  it("reads 24-hour times and refuses anything else", () => {
    expect(parseSlotTime("9:30")).toBe(570);
    expect(parseSlotTime("13:05")).toBe(785);
    expect(parseSlotTime("24:00")).toBe(1440);
    expect(parseSlotTime("24:30")).toBeNull();
    expect(parseSlotTime("9:75")).toBeNull();
    expect(parseSlotTime("9.30")).toBeNull();
    expect(parseSlotTime(undefined)).toBeNull();
  });

  it("writes times for reading and for time fields", () => {
    expect(formatSlotRange(570, 600)).toBe("9:30 AM to 10:00 AM");
    expect(formatSlotRange(720, 780)).toBe("12:00 PM to 1:00 PM");
    expect(slotTimeValue(545)).toBe("09:05");
  });

  it("starts a day with eleven 30-minute slots from 9:30 to 3:00", () => {
    const slots = defaultDaySlots();
    expect(slots).toHaveLength(11);
    expect(slots[0]).toEqual({ start: 570, end: 600 });
    expect(slots.at(-1)).toEqual({ start: 870, end: 900 });
  });

  it("treats back to back as no overlap", () => {
    expect(slotsOverlap({ start: 570, end: 600 }, { start: 600, end: 630 })).toBe(false);
    expect(slotsOverlap({ start: 570, end: 600 }, { start: 585, end: 615 })).toBe(true);
    expect(slotsOverlap({ start: 570, end: 660 }, { start: 600, end: 610 })).toBe(true);
  });

  it("finds today's weekday in camp time, not the server's", () => {
    // 2027-07-06 is a Tuesday; 01:30 UTC on Wednesday is still Tuesday evening in New York.
    expect(campWeekday(new Date("2027-07-07T01:30:00Z"))).toBe(2);
    expect(campWeekday(new Date("2027-07-10T15:00:00Z"))).toBeNull();
  });
});
