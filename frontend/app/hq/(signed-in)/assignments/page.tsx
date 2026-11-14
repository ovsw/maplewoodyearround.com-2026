import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import type { AssignmentBoard, AssignmentCandidate } from "@/lib/hq/assignments";
import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import { getCampHqClerkKeys } from "@/lib/hq/config";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { AssignmentForm } from "./assignment-form";

export const metadata: Metadata = { title: "Assignments" };

const selectClassName =
  "border-input flex min-h-(--control-height) min-w-56 rounded-control border bg-transparent px-4 py-3 text-base focus-field";

export default function AssignmentsPage() {
  return (
    <Suspense fallback={null}>
      <Assignments />
    </Suspense>
  );
}

type AssignmentsState =
  | { kind: "board"; board: AssignmentBoard }
  | { kind: "refused"; message: string }
  | { kind: "no-database" };

async function loadBoard(): Promise<AssignmentsState> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    return { kind: "board", board: await campHq.getAssignmentBoard({ actor, now: new Date() }) };
  } catch (error) {
    if (isCampHqRefusal(error)) return { kind: "refused", message: error.message };
    if (error instanceof CampHqDatabaseUnavailable) return { kind: "no-database" };
    throw error;
  }
}

async function Assignments() {
  if (!getCampHqClerkKeys()) return null;
  const state = await loadBoard();

  if (state.kind !== "board") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Assignments</h1>
        <p className="text-muted-foreground">
          {state.kind === "refused"
            ? state.message
            : "Camp HQ's database is not set up on this site yet."}
        </p>
      </section>
    );
  }

  const { board } = state;
  const { gaps } = board;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-title-lg">Assignments</h1>
        <p className="text-muted-foreground">
          Who leads each Camp group, who runs each activity, and which group
          each Junior staff member helps. Only people with an active account
          can lead or be a specialist.
        </p>
      </div>

      <section
        aria-labelledby="gaps-heading"
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
      >
        <h2 id="gaps-heading" className="text-label">
          Gaps
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GapList
            title="Camp groups without a leader"
            items={gaps.campGroupsWithoutLeader}
            none="Every Camp group has a leader."
          />
          <GapList
            title="Activities without a specialist"
            items={gaps.activitiesWithoutSpecialist}
            none="Every activity has a specialist."
          />
          <GapList
            title="Club day options without a specialist"
            items={gaps.clubDayOptionsWithoutSpecialist}
            none="Every Club day option has a specialist."
          />
        </div>
        {board.withoutActiveAccount.length > 0 ? (
          <p role="alert" className="text-sm text-destructive">
            No active account any more, but still assigned:{" "}
            {board.withoutActiveAccount.map((person) => person.name).join(", ")}.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="leaders-heading" className="flex flex-col gap-3">
        <h2 id="leaders-heading" className="text-label">
          Camp group leaders
        </h2>
        <ul className="grid gap-3 lg:grid-cols-2">
          {board.campGroups.map((group) => (
            <li key={group.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">
                {group.name} <span className="text-sm font-normal text-muted-foreground">Team {group.team}</span>
              </h3>
              <AssignmentForm intent="set-leader" hidden={{ campGroupId: group.id }}>
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-sm font-medium">Leader</span>
                  <PersonSelect
                    candidates={board.candidates}
                    current={group.leader}
                    noneLabel="No leader"
                  />
                </label>
                <Button type="submit" variant="outline">
                  Save
                </Button>
              </AssignmentForm>
              <p className="text-sm text-muted-foreground">
                Junior staff:{" "}
                {group.juniors.length > 0
                  ? group.juniors.map((junior) => junior.name).join(", ")
                  : "none"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="specialists-heading" className="flex flex-col gap-3">
        <h2 id="specialists-heading" className="text-label">
          Activity specialists
        </h2>
        <ul className="grid gap-3 lg:grid-cols-2">
          {board.activities.map((activity) => (
            <li key={activity.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{activity.name}</h3>
              <AssignmentForm intent="set-specialist" hidden={{ activityId: activity.id }}>
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-sm font-medium">Specialist</span>
                  <PersonSelect
                    candidates={board.candidates}
                    current={activity.specialist}
                    noneLabel="No specialist"
                  />
                </label>
                <Button type="submit" variant="outline">
                  Save
                </Button>
              </AssignmentForm>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="juniors-heading" className="flex flex-col gap-3">
        <h2 id="juniors-heading" className="text-label">
          Junior staff
        </h2>
        {board.juniors.length === 0 ? (
          <p className="text-muted-foreground">No Junior staff yet. Add them on the staff page.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {board.juniors.map((junior) => (
              <li key={junior.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">{junior.name}</h3>
                <AssignmentForm intent="set-junior" hidden={{ staffMemberId: junior.id }}>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Helps Camp group</span>
                    <select
                      key={junior.campGroupId ?? ""}
                      name="campGroupId"
                      defaultValue={junior.campGroupId ?? ""}
                      className={selectClassName}
                    >
                      <option value="">No group</option>
                      {board.campGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Club day activity (optional)</span>
                    <select
                      key={junior.clubDayActivityId ?? ""}
                      name="clubDayActivityId"
                      defaultValue={junior.clubDayActivityId ?? ""}
                      className={selectClassName}
                    >
                      <option value="">None</option>
                      {board.activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" variant="outline">
                    Save
                  </Button>
                </AssignmentForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="people-heading" className="flex flex-col gap-3">
        <h2 id="people-heading" className="text-label">
          People with an account
        </h2>
        <p className="text-sm text-muted-foreground">
          To move someone, clear their Assignment here, then give them the new one above.
        </p>
        <ul className="flex flex-col gap-3">
          {board.candidates.map((person) => (
            <li
              key={person.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-3"
            >
              <p>
                <span className="font-semibold">{person.name}</span>{" "}
                <span className="text-muted-foreground">· {person.job ?? "no Assignment"}</span>
              </p>
              {person.job ? (
                <AssignmentForm intent="clear" hidden={{ staffMemberId: person.id }}>
                  <Button type="submit" variant="ghost">
                    Clear Assignment
                  </Button>
                </AssignmentForm>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GapList({
  title,
  items,
  none,
}: {
  title: string;
  items: { id: string; name: string }[];
  none: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-semibold">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      <p className="text-muted-foreground">
        {items.length > 0 ? items.map((item) => item.name).join(", ") : none}
      </p>
    </div>
  );
}

function PersonSelect({
  candidates,
  current,
  noneLabel,
}: {
  candidates: AssignmentCandidate[];
  current: { id: string; name: string } | null;
  noneLabel: string;
}) {
  // A person whose account was switched off stays visible while assigned.
  const options =
    current && !candidates.some((person) => person.id === current.id)
      ? [{ ...current, job: "no active account" }, ...candidates]
      : candidates;
  // Keyed by the saved person so the select shows a change made elsewhere.
  return (
    <select
      key={current?.id ?? ""}
      name="staffMemberId"
      defaultValue={current?.id ?? ""}
      className={selectClassName}
    >
      <option value="">{noneLabel}</option>
      {options.map((person) => (
        <option key={person.id} value={person.id}>
          {person.job && person.id !== current?.id ? `${person.name} (${person.job})` : person.name}
        </option>
      ))}
    </select>
  );
}
