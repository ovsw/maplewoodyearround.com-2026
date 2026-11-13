// Where a Camp group or an activity is used elsewhere in Camp HQ. Removing one
// that is still used is refused with these descriptions. Each later feature
// that refers to a group or an activity (Assignments, schedules, Club day
// options) adds its check here.
import type { CampHqDb } from "./db/database.ts";

/** Returns one plain description per place the record is used, e.g. "Schedule of Knights, Monday 9:00". */
export type CampHqUsageCheck = (db: CampHqDb, id: string) => Promise<string[]>;

export type CampHqUsageChecks = {
  campGroup: CampHqUsageCheck[];
  activity: CampHqUsageCheck[];
};

export const campHqUsageChecks: CampHqUsageChecks = {
  campGroup: [],
  activity: [],
};
