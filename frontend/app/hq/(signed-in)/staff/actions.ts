"use server";

import { revalidatePath } from "next/cache";

import { getCampHqOperations } from "@/lib/hq/camp-hq";
import { ClerkRequestFailed } from "@/lib/hq/clerk-accounts";
import { campHqNow } from "@/lib/hq/clock";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { STAFF_PATH } from "./paths";

export type StaffActionState = { ok?: string; error?: string } | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Every change on the staff page. The form names what to do in `intent`; the
 * Camp HQ operations module decides whether the signed-in person may do it.
 */
export async function staffAction(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const request = { actor: await requireCampHqActor(), now: campHqNow() };
  const campHq = await getCampHqOperations();
  const id = field(formData, "staffMemberId");

  try {
    let ok: string;
    switch (field(formData, "intent")) {
      case "add":
        await campHq.addStaffMember(request, {
          name: field(formData, "name"),
          kind: field(formData, "kind"),
        });
        ok = "Added.";
        break;
      case "rename":
        await campHq.renameStaffMember(request, id, field(formData, "name"));
        ok = "Saved.";
        break;
      case "remove":
        await campHq.removeStaffMember(request, id);
        ok = "Removed.";
        break;
      case "create-account": {
        const { status } = await campHq.createAccount(request, id, field(formData, "email"));
        ok =
          status === "created"
            ? "Account created. They can sign in with this email."
            : "Invitation sent. The account links when they accept it and sign in.";
        break;
      }
      case "switch-off":
        await campHq.switchAccountOff(request, id);
        ok = "Account switched off.";
        break;
      case "switch-on":
        await campHq.switchAccountOn(request, id);
        ok = "Account switched on.";
        break;
      case "set-role":
        await campHq.setRole(request, id, field(formData, "role"));
        ok = "Role changed.";
        break;
      default:
        return { error: "Unknown action." };
    }
    revalidatePath(STAFF_PATH);
    return { ok };
  } catch (error) {
    if (isCampHqRefusal(error)) {
      revalidatePath(STAFF_PATH);
      return { error: error.message };
    }
    if (error instanceof ClerkRequestFailed || (error instanceof Error && error.name === "TimeoutError")) {
      console.error(error);
      revalidatePath(STAFF_PATH);
      return { error: "Clerk, the sign-in service, did not accept the change. Try again." };
    }
    throw error;
  }
}
