import type { Metadata } from "next";
import { Suspense } from "react";

import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import { campHqNow } from "@/lib/hq/clock";
import { getCampHqClerkKeys } from "@/lib/hq/config";
import {
  isCampHqRefusal,
  type StaffListEntry,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { JuniorsTable, type JuniorRow } from "./juniors-table";
import { StaffTable } from "./staff-table";

export const metadata: Metadata = { title: "Staff and accounts" };



export default function StaffPage() {
  return (
    <Suspense fallback={null}>
      <Staff />
    </Suspense>
  );
}

type StaffState =
  | {
      kind: "staff";
      staff: StaffListEntry[];
      juniors: JuniorRow[];
      campGroups: { id: string; name: string }[];
      activities: { id: string; name: string }[];
    }
  | { kind: "refused"; message: string }
  | { kind: "no-database" };

async function loadStaff(): Promise<StaffState> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    const request = { actor, now: campHqNow() };
    const [staff, board] = await Promise.all([
      campHq.listStaff(request),
      campHq.getAssignmentBoard(request),
    ]);
    return {
      kind: "staff",
      staff,
      juniors: board.juniors,
      campGroups: board.campGroups.map(({ id, name }) => ({ id, name })),
      activities: board.activities.map(({ id, name }) => ({ id, name })),
    };
  } catch (error) {
    if (isCampHqRefusal(error)) return { kind: "refused", message: error.message };
    if (error instanceof CampHqDatabaseUnavailable) return { kind: "no-database" };
    throw error;
  }
}

async function Staff() {
  if (!getCampHqClerkKeys()) return null;
  const state = await loadStaff();

  if (state.kind !== "staff") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Staff and accounts</h1>
        <p className="text-muted-foreground">
          {state.kind === "refused"
            ? state.message
            : "Camp HQ's database is not set up on this site yet."}
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-title-lg">Staff and accounts</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-label">
          Staff <span className="text-muted-foreground">({state.staff.length})</span>
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Click a name or a role to change it. It saves by itself. The ⋯ menu holds the
          account actions. The last row adds a person.
        </p>
        <StaffTable rows={state.staff} />
      </section>

      {state.juniors.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-label">Junior staff: who they help</h2>
          <p className="max-w-3xl text-muted-foreground">
            Click a cell to change it. It saves by itself. Leaders are set on Configure Groups
            and specialists on Configure Activities.
          </p>
          <JuniorsTable
            rows={state.juniors}
            campGroups={state.campGroups}
            activities={state.activities}
          />
        </section>
      ) : null}
    </div>
  );
}
