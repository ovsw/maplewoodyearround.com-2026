import { CAMP_HQ_PATH } from "@/lib/hq/config";
import type { CamperLoadReport } from "@/lib/hq/campers";

/** Where an Admin loads the camper list. */
export const CAMPERS_PATH = `${CAMP_HQ_PATH}/campers`;

/** The children expected in one Camp group today. */
export function groupCampersPath(groupId: string) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/campers`;
}

/** Every group camper list, for refreshing after a load. */
export const GROUP_CAMPERS_PAGES = `${CAMP_HQ_PATH}/groups/[id]/campers`;

/** Larger files are refused before they are sent (server actions take up to 1 MB). */
export const MAX_CAMPER_FILE_BYTES = 1_000_000;

/** A load report as the upload form receives it. */
export type CamperLoadReportView = Omit<CamperLoadReport, "loadedAt"> & { loadedAt: string };

export type CamperUploadState = { error?: string; report?: CamperLoadReportView };

export function toReportView(report: CamperLoadReport): CamperLoadReportView {
  return { ...report, loadedAt: report.loadedAt.toISOString() };
}
