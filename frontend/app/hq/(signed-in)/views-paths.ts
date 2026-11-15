import { CAMP_HQ_PATH } from "@/lib/hq/config";

/** A Camp group's read-only leader view, optionally on one weekday. */
export function leaderViewPath(groupId: string, weekday?: number) {
  const path = `${CAMP_HQ_PATH}/groups/${groupId}/leader`;
  return weekday === undefined ? path : `${path}?day=${weekday}`;
}

/** The signed-in specialist's activities today. */
export const MY_ACTIVITIES_PATH = `${CAMP_HQ_PATH}/my-activities`;

/** Where every group is, by activity, optionally on one weekday. */
export function byActivityPath(weekday?: number) {
  const path = `${CAMP_HQ_PATH}/by-activity`;
  return weekday === undefined ? path : `${path}?day=${weekday}`;
}

/** Every Camp group's day in one table, optionally on one weekday. */
export function groupsSchedulePath(weekday?: number) {
  const path = `${CAMP_HQ_PATH}/schedule`;
  return weekday === undefined ? path : `${path}?day=${weekday}`;
}

/** How often a schedule screen fetches again while it is open. */
export const SCHEDULE_REFRESH_MS = 30_000;
