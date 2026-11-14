"use server";

// Server actions for the Club day setup page. They only call the Camp HQ
// operations module, which decides who may change what and refuses clashes.
import { revalidatePath } from "next/cache";

import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { CLUB_DAY_PATH } from "./paths";

export type ClubDayActionState = { ok?: string; error?: string } | null;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Every change on the Club day page. The form names what to do in `intent`. */
export async function clubDayAction(
  _previous: ClubDayActionState,
  formData: FormData,
): Promise<ClubDayActionState> {
  const request = { actor: await requireCampHqActor(), now: new Date() };
  const capacity = {
    maxPerPeriod: field(formData, "maxPerPeriod"),
    maxPerGroup: field(formData, "maxPerGroup"),
  };
  let ok: string;
  try {
    const campHq = await getCampHqOperations();
    switch (field(formData, "intent")) {
      case "set-times":
        await campHq.setClubDaySignupTimes(request, {
          open: field(formData, "open"),
          lock: field(formData, "lock"),
        });
        ok = "Signup times saved.";
        break;
      case "add-option": {
        const option = await campHq.addClubDayOption(request, {
          team: Number(field(formData, "team")),
          weekday: Number(field(formData, "weekday")),
          activityId: field(formData, "activityId"),
          ...capacity,
        });
        ok = `${option.activity.name} added.`;
        break;
      }
      case "update-option":
        await campHq.updateClubDayOption(request, field(formData, "optionId"), capacity);
        ok = "Saved.";
        break;
      case "remove-option":
        await campHq.removeClubDayOption(request, field(formData, "optionId"));
        ok = "Removed.";
        break;
      default:
        return { error: "Camp HQ did not understand this form. Reload the page and try again." };
    }
  } catch (error) {
    if (isCampHqRefusal(error)) return { error: error.message };
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was saved." };
    }
    throw error;
  }
  revalidatePath(CLUB_DAY_PATH);
  return { ok };
}
