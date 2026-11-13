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
  slotTimeValue,
  weekdayLabels,
  type ScheduleWeekday,
} from "@/lib/hq/schedule-times";
import type { ScheduleSlot } from "@/lib/hq/schedules";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../camp-hq-page";
import { CAMP_GROUPS_PATH } from "../../../lists-paths";
import { AddSlotForm, RemoveSlotForm } from "./schedule-forms";
import { scheduleDayPath, scheduleSlotPath } from "./schedule-paths";

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

function slotLabel(slot: ScheduleSlot) {
  if (slot.content.type === "club-day") return "Club day period";
  if (slot.content.type === "activity") return slot.content.activity.name;
  return "Empty";
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

  const schedule = await campHq.getGroupSchedule(request, id).catch((error: unknown) => {
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

  const slots = schedule.days.find((day) => day.weekday === weekday)?.slots ?? [];
  const lastEnd = slots.at(-1)?.end ?? 9 * 60 + 30;
  const nextStart = Math.min(lastEnd, 23 * 60);

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
      {slots.length === 0 ? (
        <p className="text-muted-foreground">This day has no slots.</p>
      ) : (
        <table className="w-full max-w-4xl border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-label">
              <th scope="col" className="py-3 pr-4">Time</th>
              <th scope="col" className="py-3 pr-4">Activity</th>
              {isAdmin ? (
                <th scope="col" className="py-3">
                  <span className="sr-only">Changes</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const times = formatSlotRange(slot.start, slot.end);
              return (
                <tr key={slot.id} className="border-b border-border align-middle">
                  <th scope="row" className="py-3 pr-4 font-normal whitespace-nowrap">
                    {times}
                  </th>
                  <td
                    className={`py-3 pr-4 ${slot.content.type === "empty" ? "text-muted-foreground" : "font-semibold"}`}
                  >
                    {slotLabel(slot)}
                  </td>
                  {isAdmin ? (
                    <td className="py-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline">
                          <Link
                            href={scheduleSlotPath(schedule.group.id, slot.id)}
                            aria-label={`Change the ${times} slot`}
                          >
                            Change
                          </Link>
                        </Button>
                        <RemoveSlotForm slotId={slot.id} weekday={weekday} label={times} />
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {isAdmin ? (
        <>
          <h2 className="text-title">Add a slot on {weekdayLabels[weekday]}</h2>
          <AddSlotForm
            groupId={schedule.group.id}
            weekday={weekday}
            start={slotTimeValue(nextStart)}
            end={slotTimeValue(nextStart + 30)}
          />
        </>
      ) : (
        <p className="text-muted-foreground">Only an Admin can change schedules.</p>
      )}
    </section>
  );
}
