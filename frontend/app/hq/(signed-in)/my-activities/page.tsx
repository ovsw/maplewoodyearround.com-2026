import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatSlotRange, weekdayLabels } from "@/lib/hq/schedule-times";

import { AutoRefresh } from "../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { SCHEDULE_REFRESH_MS, byActivityPath } from "../views-paths";
import { VisitList } from "../visit-list";

export const metadata: Metadata = { title: "My activities today" };

export default function MyActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <MyActivities />
    </Suspense>
  );
}

async function MyActivities() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const day = await campHq.getSpecialistDay(request);

  return (
    <section className="flex flex-col gap-6">
      <AutoRefresh intervalMs={SCHEDULE_REFRESH_MS} />
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">
          My activities{day.today ? `, ${weekdayLabels[day.today]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          The groups that come to you today. Times are camp time (New York).
        </p>
      </div>

      {day.activities.length === 0 ? (
        <p className="text-muted-foreground">
          You are not the specialist for any activity. Ask an Admin if this is wrong.
        </p>
      ) : day.today === null ? (
        <p className="text-muted-foreground">There is no camp today.</p>
      ) : (
        day.activities.map(({ activity, visits }) => (
          <section key={activity.id} className="flex max-w-3xl flex-col gap-3">
            <h2 className="text-title">{activity.name}</h2>
            {visits.length === 0 ? (
              <p className="text-muted-foreground">No group comes to {activity.name} today.</p>
            ) : (
              <VisitList
                visits={visits}
                describe={(visit) => ({
                  time: formatSlotRange(visit.start, visit.end),
                  what: visit.campGroup.name,
                })}
              />
            )}
          </section>
        ))
      )}

      <p>
        <Link
          href={byActivityPath()}
          className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
        >
          Where every group is today
        </Link>
      </p>
    </section>
  );
}
