import type { Metadata } from "next";
import { Suspense } from "react";

import { campClock, formatSlotRange, weekdayLabels } from "@/lib/hq/schedule-times";

import { AutoRefresh } from "../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { WeekdayNav, chosenWeekday } from "../schedule-view-parts";
import { SCHEDULE_REFRESH_MS, byActivityPath } from "../views-paths";
import { VisitList } from "../visit-list";

export const metadata: Metadata = { title: "Where groups are" };

export default function ByActivityPage({ searchParams }: PageProps<"/hq/by-activity">) {
  return (
    <Suspense fallback={null}>
      <ByActivity searchParams={searchParams} />
    </Suspense>
  );
}

async function ByActivity({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const query = await searchParams;
  const weekday = chosenWeekday(query.day, campClock(request.now).weekday);
  const board = await campHq.getActivityBoard(request, weekday);
  const describe = (visit: { campGroup: { name: string }; start: number; end: number }) => ({
    time: formatSlotRange(visit.start, visit.end),
    what: visit.campGroup.name,
  });

  return (
    <section className="flex flex-col gap-6">
      <AutoRefresh intervalMs={SCHEDULE_REFRESH_MS} />
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Where groups are, by activity</h1>
        <p className="text-muted-foreground">
          Each activity with the groups that come to it, in time order. Times are camp
          time (New York).
        </p>
      </div>

      <WeekdayNav weekday={weekday} today={board.today} hrefFor={byActivityPath} />

      <h2 className="text-title">
        {weekday === board.today ? `Today, ${weekdayLabels[weekday]}` : weekdayLabels[weekday]}
      </h2>
      {board.activities.length === 0 && board.clubDay.length === 0 ? (
        <p className="text-muted-foreground">No group has anything scheduled on this day yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {board.activities.map(({ activity, visits }) => (
            <section key={activity.id} className="flex flex-col gap-3">
              <h3 className="text-title">{activity.name}</h3>
              <VisitList visits={visits} describe={describe} />
            </section>
          ))}
          {board.clubDay.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-title">Club day</h3>
              <VisitList visits={board.clubDay} describe={describe} />
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
