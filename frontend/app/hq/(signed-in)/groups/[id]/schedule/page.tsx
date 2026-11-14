import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { formatGrades } from "@/lib/hq/grades";
import { isCampHqRefusal } from "@/lib/hq/operations";
import {
  SCHEDULE_WEEKDAYS,
  campWeekday,
  formatSlotRange,
  isScheduleWeekday,
  weekdayLabels,
  type ScheduleWeekday,
} from "@/lib/hq/schedule-times";
import type { DayChoices, ScheduleSlot } from "@/lib/hq/schedules";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../camp-hq-page";
import { CAMP_GROUPS_PATH } from "../../../lists-paths";
import type { EditableOption } from "../../../editable-table/types";
import { scheduleDayPath } from "./schedule-paths";
import { ScheduleTable, type ScheduleRow } from "./schedule-table";

export const metadata: Metadata = { title: "Group schedule" };

export default function GroupSchedulePage({
  params,
  searchParams,
}: PageProps<"/hq/groups/[id]/schedule">) {
  return (
    <Suspense fallback={null}>
      <GroupSchedule params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function slotChoice(slot: ScheduleSlot) {
  return slot.content.type === "activity" ? `activity:${slot.content.activity.id}` : slot.content.type;
}

/** What one slot can hold: nothing, a Club day period, or an activity allowed for the group. */
function slotOptions(slot: ScheduleSlot, { activities, bookedBy }: DayChoices): EditableOption[] {
  const options: EditableOption[] = [
    { value: "empty", label: "Empty" },
    { value: "club-day", label: "Club day period" },
    ...activities.map((activity) => {
      const booking = bookedBy[slot.id]?.[activity.id];
      return {
        value: `activity:${activity.id}`,
        label: activity.name,
        group: "Activities",
        unavailable: booking
          ? `${booking.campGroupName} have it ${formatSlotRange(booking.start, booking.end)}`
          : undefined,
      };
    }),
  ];
  // Keep the slot's current activity visible even if the group's grades changed since.
  const current = slotChoice(slot);
  if (slot.content.type === "activity" && !options.some((option) => option.value === current)) {
    options.push({
      value: current,
      label: `${slot.content.activity.name} (not allowed for these grades)`,
      group: "Activities",
    });
  }
  return options;
}

async function GroupSchedule({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const asked = Number(query.day);
  const weekday: ScheduleWeekday = isScheduleWeekday(asked)
    ? asked
    : (campWeekday(request.now) ?? 1);

  const schedule = await campHq.getDayChoices(request, id, weekday).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found")) return null;
    throw error;
  });

  if (!schedule) {
    return (
      <section className="flex flex-col gap-6">
        <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
        <p className="text-muted-foreground">This Camp group no longer exists.</p>
      </section>
    );
  }

  const rows: ScheduleRow[] = schedule.slots.map((slot) => ({
    id: slot.id,
    start: slot.start,
    end: slot.end,
    choice: slotChoice(slot),
    options: slotOptions(slot, schedule),
  }));

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Schedule of {schedule.group.name}</h1>
        <p className="text-muted-foreground">
          {formatGrades(schedule.group.grades)}. Repeats every week. Times are camp time
          (New York).
        </p>
      </div>

      <nav aria-label="Weekdays" className="grid grid-cols-5 gap-2">
        {SCHEDULE_WEEKDAYS.map((day) => (
          <Button key={day} asChild variant={day === weekday ? "primary" : "outline"}>
            <Link
              href={scheduleDayPath(schedule.group.id, day)}
              aria-current={day === weekday ? "page" : undefined}
            >
              {weekdayLabels[day]}
            </Link>
          </Button>
        ))}
      </nav>

      <h2 className="text-title">{weekdayLabels[weekday]}</h2>
      <p className="max-w-3xl text-muted-foreground">
        {isAdmin
          ? `Click a time or an activity to change it. It saves by itself. Only activities allowed for the grades of ${schedule.group.name} are listed.`
          : "Only an Admin can change schedules."}
      </p>
      <ScheduleTable
        key={`${schedule.group.id}:${weekday}`}
        groupId={schedule.group.id}
        groupName={schedule.group.name}
        weekday={weekday}
        weekdayLabel={weekdayLabels[weekday]}
        rows={rows}
        readOnly={!isAdmin}
      />
    </section>
  );
}
