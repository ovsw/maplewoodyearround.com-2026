import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  SCHEDULE_WEEKDAYS,
  isScheduleWeekday,
  weekdayLabels,
  type ScheduleWeekday,
} from "@/lib/hq/schedule-times";

export { locationKeys, locationLabels } from "./location-labels";

/** The weekday asked for in `?day=`, else today, else Monday at a weekend. */
export function chosenWeekday(
  day: string | string[] | undefined,
  today: ScheduleWeekday | null,
): ScheduleWeekday {
  const asked = Number(day);
  return isScheduleWeekday(asked) ? asked : (today ?? 1);
}

/** Monday to Friday as a compact tab strip; today is labelled. */
export function WeekdayNav({
  weekday,
  today = null,
  hrefFor,
}: {
  weekday: ScheduleWeekday;
  today?: ScheduleWeekday | null;
  hrefFor: (weekday: ScheduleWeekday) => string;
}) {
  return (
    <nav
      aria-label="Weekdays"
      className="inline-flex h-9 w-fit items-center gap-0.5 rounded-lg bg-foreground/5 p-[3px]"
    >
      {SCHEDULE_WEEKDAYS.map((day) => {
        const current = day === weekday;
        return (
          <Link
            key={day}
            href={hrefFor(day)}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex h-full items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
              current && "bg-background text-foreground shadow-sm",
            )}
          >
            {weekdayLabels[day]}
            {day === today ? " (today)" : ""}
          </Link>
        );
      })}
    </nav>
  );
}

/** A location, or a muted "Not set" when the Admin left it empty. */
export function LocationValue({ value }: { value: string }) {
  return value ? <>{value}</> : <span className="text-muted-foreground">Not set</span>;
}
