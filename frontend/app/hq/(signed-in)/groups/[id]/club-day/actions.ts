"use server";

// Server action for the Club day signup screen. It only calls the Camp HQ
// operations module, which decides the window, the group and the capacity.
import { revalidatePath } from "next/cache";

import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import { campHqNow } from "@/lib/hq/clock";
import type { ClubDayPickInput } from "@/lib/hq/club-day-signups";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { CLUB_DAY_MISSING_PATH, GROUP_CLUB_DAY_PAGES } from "../../../club-day/paths";

export type PickActionResult = { error?: string };

/** Enters, changes or clears one child's pick for one period. */
export async function setPickAction(input: ClubDayPickInput): Promise<PickActionResult> {
  const request = { actor: await requireCampHqActor(), now: campHqNow() };
  try {
    const campHq = await getCampHqOperations();
    await campHq.setClubDayPick(request, input);
  } catch (error) {
    if (isCampHqRefusal(error)) return { error: error.message };
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was saved." };
    }
    throw error;
  } finally {
    // Places left change for every group of the Team, refused or not.
    revalidatePath(GROUP_CLUB_DAY_PAGES, "page");
    revalidatePath(CLUB_DAY_MISSING_PATH);
  }
  return {};
}
