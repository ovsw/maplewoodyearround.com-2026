"use server";

// Server actions for the Configure Groups, Configure Activities and Staff
// tables. Each saves one cell or one row and returns what the cell shows. They
// only call the Camp HQ operations module, which decides who may change what.
import type { ActivityChange, ActivityInput, CampGroupChange, CampGroupInput } from "@/lib/hq/lists";

import { runCell } from "./cell-run";
import type { CellResult } from "./editable-table/types";

export async function saveCampGroup(id: string, change: CampGroupChange): Promise<CellResult> {
  return runCell((campHq, request) => campHq.updateCampGroup(request, id, change));
}

export async function addCampGroup(input: CampGroupInput): Promise<CellResult> {
  return runCell((campHq, request) => campHq.addCampGroup(request, input));
}

export async function removeCampGroup(id: string): Promise<CellResult> {
  return runCell((campHq, request) => campHq.removeCampGroup(request, id));
}

/**
 * Sets or clears the leader of a Camp group. `replacing` is the leader the
 * table showed: a different leader by now is not replaced without asking.
 */
export async function setGroupLeader(
  campGroupId: string,
  staffMemberId: string | null,
  replacing: string | null,
): Promise<CellResult> {
  return runCell((campHq, request) =>
    campHq.setGroupLeader(request, campGroupId, staffMemberId, { replacing }),
  );
}

export async function saveActivity(id: string, change: ActivityChange): Promise<CellResult> {
  return runCell((campHq, request) => campHq.updateActivity(request, id, change));
}

export async function addActivity(input: ActivityInput): Promise<CellResult> {
  return runCell((campHq, request) => campHq.addActivity(request, input));
}

export async function removeActivity(id: string): Promise<CellResult> {
  return runCell((campHq, request) => campHq.removeActivity(request, id));
}

/**
 * Sets or clears the specialist of an activity. `replacing` is the specialist
 * the table showed: a different one by now is not replaced without asking.
 */
export async function setActivitySpecialist(
  activityId: string,
  staffMemberId: string | null,
  replacing: string | null,
): Promise<CellResult> {
  return runCell((campHq, request) =>
    campHq.setActivitySpecialist(request, activityId, staffMemberId, { replacing }),
  );
}

/** The Camp group a Junior staff member helps and their Club day activity. */
export async function setJuniorPlacement(
  staffMemberId: string,
  placement: { campGroupId: string | null; clubDayActivityId: string | null },
): Promise<CellResult> {
  return runCell((campHq, request) => campHq.setJuniorPlacement(request, staffMemberId, placement));
}
