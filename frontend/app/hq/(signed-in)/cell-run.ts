// Runs one Camp HQ operation for a table cell or row and says what the cell
// shows. Used by the server actions of the editable tables; the operations
// module decides who may change what.
import { revalidatePath } from "next/cache";

import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import { ClerkRequestFailed } from "@/lib/hq/clerk-accounts";
import { campHqNow } from "@/lib/hq/clock";
import { CAMP_HQ_PATH } from "@/lib/hq/config";
import {
  isCampHqRefusal,
  type CampHqOperations,
  type CampHqRefusal,
  type CampHqRequest,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import type { CellResult } from "./editable-table/types";

type Refused = Extract<CellResult, { ok: false }>;

/**
 * Runs one operation; a refusal comes back as the reason for the cell, with
 * the places a record is still used. Every Camp HQ page reads again after a
 * change, because one record shows on several screens.
 */
export async function runCell(
  operation: (campHq: CampHqOperations, request: CampHqRequest) => Promise<unknown>,
  link?: (refusal: CampHqRefusal) => Refused["link"],
): Promise<CellResult> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    await operation(campHq, { actor, now: campHqNow() });
  } catch (error) {
    if (isCampHqRefusal(error)) {
      const usedIn = error.usedIn.length > 0 ? ` Still used in: ${error.usedIn.join("; ")}.` : "";
      return { ok: false, error: `${error.message}${usedIn}`, link: link?.(error) };
    }
    if (error instanceof CampHqDatabaseUnavailable) {
      return { ok: false, error: "Camp HQ's database is not available. Nothing was saved." };
    }
    if (error instanceof ClerkRequestFailed || (error instanceof Error && error.name === "TimeoutError")) {
      console.error(error);
      return { ok: false, error: "Clerk, the sign-in service, did not accept the change. Try again." };
    }
    throw error;
  }
  revalidatePath(CAMP_HQ_PATH, "layout");
  return { ok: true };
}
