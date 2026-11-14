"use server";

import { revalidatePath } from "next/cache";

import { CAMP_HQ_PATH } from "@/lib/hq/config";
import { getCampHqOperations } from "@/lib/hq/camp-hq";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { ASSIGNMENTS_PATH } from "./paths";

export type AssignmentActionState = {
  ok?: string;
  error?: string;
  /**
   * Asked before replacing a leader or specialist; sent back with `replace`.
   * `incumbentId` is the person the Admin agreed to replace.
   */
  confirm?: { message: string; staffMemberId: string; incumbentId: string };
} | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Every change on the Assignments page. The form names what to do in
 * `intent`; the Camp HQ operations module decides whether it is allowed.
 */
export async function assignmentAction(
  _previous: AssignmentActionState,
  formData: FormData,
): Promise<AssignmentActionState> {
  const request = { actor: await requireCampHqActor(), now: new Date() };
  const campHq = await getCampHqOperations();
  const replace = field(formData, "replace") === "1";
  // After a confirmation, the person asked about is sent back on its own.
  const staffMemberId =
    field(formData, replace ? "confirmedStaffMemberId" : "staffMemberId") || null;
  // Only the person the Admin agreed to replace can be replaced.
  const replacing = replace ? field(formData, "replacingStaffMemberId") || null : null;

  try {
    switch (field(formData, "intent")) {
      case "set-leader":
        await campHq.setGroupLeader(request, field(formData, "campGroupId"), staffMemberId, {
          replacing,
        });
        break;
      case "set-specialist":
        await campHq.setActivitySpecialist(
          request,
          field(formData, "activityId"),
          staffMemberId,
          { replacing },
        );
        break;
      case "set-junior":
        await campHq.setJuniorPlacement(request, field(formData, "staffMemberId"), {
          campGroupId: field(formData, "campGroupId") || null,
          clubDayActivityId: field(formData, "clubDayActivityId") || null,
        });
        break;
      case "clear":
        await campHq.clearAssignment(request, field(formData, "staffMemberId"));
        break;
      default:
        return { error: "Unknown action." };
    }
    revalidatePath(ASSIGNMENTS_PATH);
    revalidatePath(CAMP_HQ_PATH);
    return { ok: "Saved." };
  } catch (error) {
    if (isCampHqRefusal(error, "confirm-replace") && staffMemberId && error.incumbentId) {
      return {
        confirm: { message: error.message, staffMemberId, incumbentId: error.incumbentId },
      };
    }
    if (isCampHqRefusal(error)) {
      revalidatePath(ASSIGNMENTS_PATH);
      return { error: error.message };
    }
    throw error;
  }
}
