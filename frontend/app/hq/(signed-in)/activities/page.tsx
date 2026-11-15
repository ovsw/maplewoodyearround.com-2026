import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { ActivitiesTable, type ActivityRow } from "./activities-table";

export const metadata: Metadata = { title: "Configure Activities" };

export default function ActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <Activities />
    </Suspense>
  );
}

async function Activities() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  // Only an Admin can see who runs what.
  const [activities, board] = await Promise.all([
    campHq.listActivities(request),
    isAdmin ? campHq.getAssignmentBoard(request) : null,
  ]);
  const specialistOf = new Map(board?.activities.map((activity) => [activity.id, activity.specialist]));
  const rows: ActivityRow[] = activities.map((activity) => ({
    ...activity,
    specialist: specialistOf.get(activity.id) ?? null,
  }));
  // "Archery (Team 4 Monday)" names the option; the activity is what needs a specialist.
  const withoutSpecialist = [
    ...new Set(
      (board?.gaps.clubDayOptionsWithoutSpecialist ?? []).map((option) =>
        option.name.replace(/ \([^)]*\)$/, ""),
      ),
    ),
  ];

  return (
    <section className="flex flex-col gap-6">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Configure Activities</h1>
        <p className="max-w-3xl text-muted-foreground">
          Only exclusive activities are checked for clashes. Shared activities, such as lunch,
          can have many Camp groups at once.{" "}
          {isAdmin
            ? "Click a cell to change it. It saves by itself. The last row adds an activity."
            : "Only an Admin can change activities."}
        </p>
      </div>
      {withoutSpecialist.length > 0 ? (
        <p className="max-w-3xl text-muted-foreground">
          Club day options with no specialist yet: {withoutSpecialist.join(", ")}.
        </p>
      ) : null}
      <ActivitiesTable rows={rows} people={board?.candidates ?? null} readOnly={!isAdmin} />
    </section>
  );
}
