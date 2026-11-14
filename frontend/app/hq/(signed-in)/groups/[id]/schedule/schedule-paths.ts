import { CAMP_HQ_PATH } from "@/lib/hq/config";

/** One weekday of a Camp group's schedule. */
export function scheduleDayPath(groupId: string, weekday: number) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/schedule?day=${weekday}`;
}

/** Every schedule page, for refreshing after a change. */
export const SCHEDULE_PAGES = `${CAMP_HQ_PATH}/groups/[id]/schedule`;
