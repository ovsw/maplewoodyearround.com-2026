import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { campClock, weekdayLabels } from "@/lib/hq/schedule-times";

import { AutoRefresh } from "../auto-refresh";
import { CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { WeekdayNav, chosenWeekday } from "../schedule-view-parts";
import { SCHEDULE_REFRESH_MS, byActivityPath, groupsSchedulePath } from "../views-paths";
import { GroupsScheduleTable, type BoardActivity, type BoardGroup } from "./groups-schedule-table";

export const metadata: Metadata = { title: "Groups Schedule" };

export default function GroupsSchedulePage({ searchParams }: PageProps<"/hq/schedule">) {
  return (
    <Suspense fallback={null}>
      <GroupsSchedule searchParams={searchParams} />
    </Suspense>
  );
}

async function GroupsSchedule({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const query = await searchParams;
  const today = campClock(request.now).weekday;
  const weekday = chosenWeekday(query.day, today);
  const board = await campHq.getDayBoard(request, weekday);

  const groups: BoardGroup[] = board.groups.map(({ group, locations, slots }) => ({
    id: group.id,
    name: group.name,
    grades: group.grades,
    locations,
    slots: slots.map((slot) => ({
      id: slot.id,
      start: slot.start,
      end: slot.end,
      choice: slot.content.type === "activity" ? `activity:${slot.content.activity.id}` : slot.content.type,
      activityName: slot.content.type === "activity" ? slot.content.activity.name : null,
    })),
  }));
  const activities: BoardActivity[] = board.activities.map(({ id, name, grades, kind }) => ({
    id,
    name,
    grades,
    exclusive: kind === "exclusive",
  }));

  return (
    <section className="flex flex-col gap-6">
      {/* An Admin's table is being edited: it reads again after each save instead. */}
      {isAdmin ? null : <AutoRefresh intervalMs={SCHEDULE_REFRESH_MS} />}
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Groups Schedule</h1>
        <p className="max-w-3xl text-muted-foreground">
          Every Camp group&apos;s day, with where it changes, swims and has lunch. Repeats
          every week. Times are camp time (New York).{" "}
          {isAdmin
            ? "Click a cell to change it. It saves by itself. Open a group to change its times or add a slot."
            : "Only an Admin can change schedules."}
        </p>
      </div>

      <WeekdayNav weekday={weekday} today={today} hrefFor={groupsSchedulePath} />

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-title">
          {weekday === today ? `Today, ${weekdayLabels[weekday]}` : weekdayLabels[weekday]}
        </h2>
        <Link
          href={byActivityPath(weekday)}
          className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
        >
          See this day by activity
        </Link>
      </div>
      <GroupsScheduleTable
        key={weekday}
        weekday={weekday}
        weekdayLabel={weekdayLabels[weekday]}
        groups={groups}
        activities={activities}
        readOnly={!isAdmin}
      />
    </section>
  );
}
