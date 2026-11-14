import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CampGroupLocations } from "@/lib/hq/lists";
import {
  SCHEDULE_WEEKDAYS,
  isScheduleWeekday,
  weekdayLabels,
  type ScheduleWeekday,
} from "@/lib/hq/schedule-times";

/** The weekday asked for in `?day=`, else today, else Monday at a weekend. */
export function chosenWeekday(
  day: string | string[] | undefined,
  today: ScheduleWeekday | null,
): ScheduleWeekday {
  const asked = Number(day);
  return isScheduleWeekday(asked) ? asked : (today ?? 1);
}

/** Monday to Friday as five buttons; today is labelled. */
export function WeekdayNav({
  weekday,
  today,
  hrefFor,
}: {
  weekday: ScheduleWeekday;
  today: ScheduleWeekday | null;
  hrefFor: (weekday: ScheduleWeekday) => string;
}) {
  return (
    <nav aria-label="Weekdays" className="grid grid-cols-5 gap-2">
      {SCHEDULE_WEEKDAYS.map((day) => (
        <Button key={day} asChild variant={day === weekday ? "primary" : "outline"}>
          <Link href={hrefFor(day)} aria-current={day === weekday ? "page" : undefined}>
            {weekdayLabels[day]}
            {day === today ? " (today)" : ""}
          </Link>
        </Button>
      ))}
    </nav>
  );
}

export const locationLabels: Record<keyof CampGroupLocations, string> = {
  change: "Change",
  freeSwim: "Free swim",
  lunch: "Lunch",
  swimLessons: "Swim lessons",
};

export const locationKeys = Object.keys(locationLabels) as (keyof CampGroupLocations)[];

/** A location, or a muted "Not set" when the Admin left it empty. */
export function LocationValue({ value }: { value: string }) {
  return value ? <>{value}</> : <span className="text-muted-foreground">Not set</span>;
}
