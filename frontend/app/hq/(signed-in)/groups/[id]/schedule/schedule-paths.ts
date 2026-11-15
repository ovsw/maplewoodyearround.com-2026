import { CAMP_HQ_PATH } from "@/lib/hq/config";

/** One weekday of a Camp group's schedule. */
export function scheduleDayPath(groupId: string, weekday: number) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/schedule?day=${weekday}`;
}
