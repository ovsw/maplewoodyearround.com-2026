"use server";

// The camper upload. It reads the file with the CSV adapter and hands the
// camper days to the Camp HQ operations module, which decides who may load.
import { revalidatePath } from "next/cache";

import { readCamperCsv } from "@/lib/hq/camper-csv";
import { CAMP_HQ_PATH } from "@/lib/hq/config";
import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import { campHqNow } from "@/lib/hq/clock";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import {
  CAMPERS_PATH,
  GROUP_CAMPERS_PAGES,
  MAX_CAMPER_FILE_BYTES,
  toReportView,
  type CamperUploadState,
  type ClearCamperDataState,
} from "./paths";

export async function uploadCamperFile(
  _previous: CamperUploadState,
  formData: FormData,
): Promise<CamperUploadState> {
  const actor = await requireCampHqActor();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a camper file (.csv) to load." };
  }
  if (file.size > MAX_CAMPER_FILE_BYTES) {
    return { error: "The file is larger than 1 MB. Nothing was loaded." };
  }
  const { rows, errors } = readCamperCsv(await file.text());
  try {
    const campHq = await getCampHqOperations();
    const report = await campHq.loadCampers(
      { actor, now: campHqNow() },
      { source: `File upload: ${file.name || "camper file"}`, rows, errors },
    );
    revalidatePath(CAMPERS_PATH);
    revalidatePath(GROUP_CAMPERS_PAGES, "page");
    return { report: toReportView(report) };
  } catch (error) {
    if (isCampHqRefusal(error)) return { error: error.message };
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was loaded." };
    }
    throw error;
  }
}

/** Clears a past summer's camper data. The operations module checks the role and the confirmation. */
export async function clearPastSummer(
  _previous: ClearCamperDataState,
  formData: FormData,
): Promise<ClearCamperDataState> {
  const actor = await requireCampHqActor();
  try {
    const campHq = await getCampHqOperations();
    const cleared = await campHq.clearCamperDataBefore(
      { actor, now: campHqNow() },
      {
        before: String(formData.get("before") ?? ""),
        confirmation: String(formData.get("confirmation") ?? ""),
      },
    );
    // Every list of children can change.
    revalidatePath(CAMP_HQ_PATH, "layout");
    return { cleared };
  } catch (error) {
    if (isCampHqRefusal(error)) return { error: error.message };
    if (error instanceof CampHqDatabaseUnavailable) {
      return { error: "Camp HQ's database is not available. Nothing was cleared." };
    }
    throw error;
  }
}
