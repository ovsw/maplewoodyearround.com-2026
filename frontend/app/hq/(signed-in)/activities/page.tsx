import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { formatGrades } from "@/lib/hq/grades";
import { activityKindLabels } from "@/lib/hq/lists";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { ACTIVITIES_PATH } from "../lists-paths";

export const metadata: Metadata = { title: "Activities" };

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
  const activities = await campHq.listActivities(request);

  return (
    <section className="flex flex-col gap-6">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-title-lg">Activities</h1>
        {isAdmin ? (
          <Button asChild>
            <Link href={`${ACTIVITIES_PATH}/new`}>Add activity</Link>
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground">
        Only exclusive activities are checked for clashes. Shared activities, such as lunch,
        can have many Camp groups at once.
      </p>
      {activities.length === 0 ? (
        <p className="text-muted-foreground">There are no activities yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-label">
                <th scope="col" className="py-3 pr-4">Name</th>
                <th scope="col" className="py-3 pr-4">Exclusive or shared</th>
                <th scope="col" className="py-3">Grades</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-border align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {isAdmin ? (
                      <Link
                        href={`${ACTIVITIES_PATH}/${activity.id}`}
                        className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
                      >
                        {activity.name}
                      </Link>
                    ) : (
                      activity.name
                    )}
                  </th>
                  <td className="py-3 pr-4">{activityKindLabels[activity.kind]}</td>
                  <td className="py-3">{formatGrades(activity.grades)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
