import type { Metadata } from "next";
import { Suspense } from "react";

import { CAMP_HQ_TEAMS } from "@/lib/hq/lists";
import { campClock } from "@/lib/hq/schedule-times";

import { CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { GroupsTable, type GroupRow } from "./groups-table";

export const metadata: Metadata = { title: "Configure Groups" };

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
  // Only an Admin can see who leads what.
  const [groups, board] = await Promise.all([
    campHq.listCampGroups(request),
    isAdmin ? campHq.getAssignmentBoard(request) : null,
  ]);
  const leaderOf = new Map(board?.campGroups.map((group) => [group.id, group.leader]));
  const rows: GroupRow[] = groups.map((group) => ({ ...group, leader: leaderOf.get(group.id) ?? null }));
  const withoutLeader = board?.gaps.campGroupsWithoutLeader.length ?? 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Configure Groups</h1>
        <p className="max-w-3xl text-muted-foreground">
          {isAdmin
            ? "Click a cell to change it. It saves by itself. The last row adds a Camp group. Only people with an active account can lead a group."
            : "Only an Admin can change Camp groups."}
        </p>
      </div>
      {withoutLeader > 0 ? (
        <p className="text-muted-foreground">
          {withoutLeader === 1 ? "1 Camp group has" : `${withoutLeader} Camp groups have`} no leader yet.
        </p>
      ) : null}
      {groups.some((group) => group.teamIsSample) ? (
        <p className="text-muted-foreground">
          Teams marked &ldquo;sample&rdquo; are invented from the group&apos;s grades until
          Maplewood confirms them.
        </p>
      ) : null}
      <GroupsTable
        rows={rows}
        teams={[...CAMP_HQ_TEAMS]}
        people={board?.candidates ?? null}
        weekday={campClock(request.now).weekday ?? 1}
        readOnly={!isAdmin}
      />
    </section>
  );
}
