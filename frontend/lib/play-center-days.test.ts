import { describe, expect, it } from "vitest";
import { maplewoodDate, upcomingPlayCenterDays } from "./play-center-days";

describe("maplewoodDate", () => {
  it("uses the Maplewood day, not the UTC day", () => {
    // 23:30 in Maplewood on Oct 27 is already Oct 28 in UTC.
    expect(maplewoodDate(new Date("2026-10-28T03:30:00Z"))).toBe("2026-10-27");
    expect(maplewoodDate(new Date("2026-10-28T04:30:00Z"))).toBe("2026-10-28");
  });
});

describe("upcomingPlayCenterDays", () => {
  const days = [
    { _id: "sat", date: "2026-10-24T00:00:00.000Z" },
    { _id: "mon", date: "2026-10-26T00:00:00.000Z" },
    { _id: "tue", date: "2026-10-27T00:00:00.000Z" },
    { _id: "wed", date: "2026-10-28T00:00:00.000Z" },
  ];

  it("starts the calendar at today and drops past days", () => {
    expect(upcomingPlayCenterDays(days, "2026-10-27").map((day) => day._id)).toEqual(["tue", "wed"]);
  });

  it("drops every day once all of them have passed", () => {
    expect(upcomingPlayCenterDays(days, "2026-11-02")).toEqual([]);
  });

  it("keeps a day without a date", () => {
    expect(upcomingPlayCenterDays([{ _id: "draft", date: null }], "2026-10-27")).toHaveLength(1);
  });
});
