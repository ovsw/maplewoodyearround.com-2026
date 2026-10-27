import { stegaClean } from "next-sanity";
import { cacheLife } from "next/cache";

// The Play Center is in Maplewood, New Jersey. "en-CA" writes "YYYY-MM-DD".
const maplewoodDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" });

/** The calendar day in Maplewood at `now`, as "YYYY-MM-DD". */
export function maplewoodDate(now: Date) {
  return maplewoodDayFormat.format(now);
}

/**
 * Today in Maplewood. Pages that use it refresh every hour, so the Play
 * Center calendar moves on to a new day without a content edit.
 */
export async function getMaplewoodToday(): Promise<string> {
  "use cache";
  cacheLife("hours");
  return maplewoodDate(new Date());
}

/**
 * The Play Center calendar days from `today` on, as the live site shows them.
 * Dates are stored as calendar days at midnight UTC.
 */
export function upcomingPlayCenterDays<Day extends { date?: string | null }>(days: Day[], today: string) {
  return days.filter((day) => {
    const date = stegaClean(day.date);
    return !date || date.slice(0, 10) >= today;
  });
}
