import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { formatGrades } from "@/lib/hq/grades";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { CAMP_GROUPS_PATH } from "../lists-paths";
import { leaderViewPath } from "../views-paths";

export const metadata: Metadata = { title: "Camp groups" };

export default function CampGroupsPage() {
  return (
    <Suspense fallback={null}>
      <CampGroups />
    </Suspense>
  );
}

async function CampGroups() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const groups = await campHq.listCampGroups(request);
  const hasSampleTeams = groups.some((group) => group.teamIsSample);

  return (
    <section className="flex flex-col gap-6">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-title-lg">Camp groups</h1>
        {isAdmin ? (
          <Button asChild>
            <Link href={`${CAMP_GROUPS_PATH}/new`}>Add Camp group</Link>
          </Button>
        ) : null}
      </div>
      {hasSampleTeams ? (
        <p className="text-muted-foreground">
          Teams marked &ldquo;sample&rdquo; are invented from the group&apos;s grades until
          Maplewood confirms them.
        </p>
      ) : null}
      {groups.length === 0 ? (
        <p className="text-muted-foreground">There are no Camp groups yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-label">
                <th scope="col" className="py-3 pr-4">Name</th>
                <th scope="col" className="py-3 pr-4">Grades</th>
                <th scope="col" className="py-3 pr-4">Team</th>
                <th scope="col" className="py-3 pr-4">Change</th>
                <th scope="col" className="py-3 pr-4">Free swim</th>
                <th scope="col" className="py-3 pr-4">Lunch</th>
                <th scope="col" className="py-3 pr-4">Swim lessons</th>
                <th scope="col" className="py-3">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border align-middle">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {isAdmin ? (
                      <Link
                        href={`${CAMP_GROUPS_PATH}/${group.id}`}
                        className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
                      >
                        {group.name}
                      </Link>
                    ) : (
                      group.name
                    )}
                  </th>
                  <td className="py-3 pr-4">{formatGrades(group.grades)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    Team {group.team}
                    {group.teamIsSample ? (
                      <span className="text-muted-foreground"> (sample)</span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">{group.locations.change}</td>
                  <td className="py-3 pr-4">{group.locations.freeSwim}</td>
                  <td className="py-3 pr-4">{group.locations.lunch}</td>
                  <td className="py-3 pr-4">{group.locations.swimLessons}</td>
                  <td className="py-3 whitespace-nowrap">
                    <Link
                      href={`${CAMP_GROUPS_PATH}/${group.id}/schedule`}
                      className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
                      aria-label={`Schedule of ${group.name}`}
                    >
                      Schedule
                    </Link>
                    {isAdmin ? (
                      <Link
                        href={leaderViewPath(group.id)}
                        className="focus-ring ml-4 inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4"
                        aria-label={`Leader view of ${group.name}`}
                      >
                        Leader view
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
