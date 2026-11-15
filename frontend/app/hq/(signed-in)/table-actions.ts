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

export async function renameStaffMember(id: string, name: string): Promise<CellResult> {
  return runCell((campHq, request) => campHq.renameStaffMember(request, id, name));
}

export async function addStaffMember(input: { name: string; kind: string }): Promise<CellResult> {
  return runCell((campHq, request) => campHq.addStaffMember(request, input));
}

export async function removeStaffMember(id: string): Promise<CellResult> {
  return runCell((campHq, request) => campHq.removeStaffMember(request, id));
}

export async function setStaffRole(id: string, role: string): Promise<CellResult> {
  return runCell((campHq, request) => campHq.setRole(request, id, role));
}

export async function switchStaffAccount(id: string, on: boolean): Promise<CellResult> {
  return runCell((campHq, request) =>
    on ? campHq.switchAccountOn(request, id) : campHq.switchAccountOff(request, id),
  );
}

/**
 * Creates the account, or sends an invitation when the email has no Clerk
 * user yet. `message` says which happened.
 */
export async function createStaffAccount(
  id: string,
  email: string,
): Promise<CellResult & { message?: string }> {
  let message = "";
  const result = await runCell(async (campHq, request) => {
    const { status } = await campHq.createAccount(request, id, email);
    message =
      status === "created"
        ? "Account created. They can sign in with this email."
        : "Invitation sent. The account links when they accept it and sign in.";
  });
  return result.ok ? { ...result, message } : result;
}
