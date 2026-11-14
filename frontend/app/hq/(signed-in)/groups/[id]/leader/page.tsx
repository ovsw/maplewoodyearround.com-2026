import type { Metadata } from "next";
import { Suspense } from "react";

import { formatGrades } from "@/lib/hq/grades";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { formatSlotRange, weekdayLabels } from "@/lib/hq/schedule-times";
import type { ScheduleSlot } from "@/lib/hq/schedules";

import { AutoRefresh } from "../../../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../camp-hq-page";
import { CAMP_GROUPS_PATH } from "../../../lists-paths";
import {
  LocationValue,
  WeekdayNav,
  chosenWeekday,
  locationKeys,
  locationLabels,
} from "../../../schedule-view-parts";
import { SCHEDULE_REFRESH_MS, leaderViewPath } from "../../../views-paths";

export const metadata: Metadata = { title: "Group schedule" };

export default function LeaderViewPage({
  params,
  searchParams,
}: PageProps<"/hq/groups/[id]/leader">) {
  return (
    <Suspense fallback={null}>
      <LeaderView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function slotLabel(slot: ScheduleSlot) {
  if (slot.content.type === "club-day") return "Club day";
  if (slot.content.type === "activity") return slot.content.activity.name;
  return "Free";
}

async function LeaderView({
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
  const back = isAdmin ? (
    <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
  ) : (
    <BackLink href="/hq">Camp HQ</BackLink>
  );

  const view = await campHq.getLeaderView(request, id).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found") || isCampHqRefusal(error, "not-your-group")) {
      return error.message;
    }
    throw error;
  });

  if (typeof view === "string") {
    return (
      <section className="flex flex-col gap-6">
        {back}
        <p className="text-muted-foreground">{view}</p>
      </section>
    );
  }

  const weekday = chosenWeekday(query.day, view.today);
  const slots = view.days.find((day) => day.weekday === weekday)?.slots ?? [];
  const isToday = weekday === view.today;

  return (
    <section className="flex flex-col gap-6">
      <AutoRefresh intervalMs={SCHEDULE_REFRESH_MS} />
      {back}
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">{view.group.name}</h1>
        <p className="text-muted-foreground">
          {formatGrades(view.group.grades)}. Times are camp time (New York). Only an Admin
          can change this schedule.
        </p>
      </div>

      <WeekdayNav
        weekday={weekday}
        today={view.today}
        hrefFor={(day) => leaderViewPath(view.group.id, day)}
      />

      <h2 className="text-title">
        {isToday ? `Today, ${weekdayLabels[weekday]}` : weekdayLabels[weekday]}
      </h2>
      {slots.length === 0 ? (
        <p className="text-muted-foreground">Nothing is scheduled on this day yet.</p>
      ) : (
        <ol className="flex max-w-3xl flex-col gap-2">
          {slots.map((slot) => {
            const current = isToday && slot.id === view.currentSlotId;
            return (
              <li
                key={slot.id}
                aria-current={current ? "time" : undefined}
                className={`flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border px-4 py-3 ${
                  current ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="whitespace-nowrap">{formatSlotRange(slot.start, slot.end)}</span>
                <span
                  className={`flex-1 text-lg ${slot.content.type === "empty" ? "text-muted-foreground" : "font-semibold"}`}
                >
                  {slotLabel(slot)}
                </span>
                {current ? <span className="text-label text-primary">Now</span> : null}
              </li>
            );
          })}
        </ol>
      )}

      <section aria-labelledby="locations-heading" className="flex max-w-3xl flex-col gap-3">
        <h2 id="locations-heading" className="text-title">
          Locations of {view.group.name}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {locationKeys.map((key) => (
            <div key={key} className="rounded-lg border border-border bg-card p-4">
              <dt className="text-label">{locationLabels[key]}</dt>
              <dd className="mt-1 text-lg">
                <LocationValue value={view.locations[key]} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
