import { CAMP_HQ_PATH } from "@/lib/hq/config";

/** One weekday of a Camp group's schedule. */
export function scheduleDayPath(groupId: string, weekday: number) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/schedule?day=${weekday}`;
}

/** The page where an Admin changes one slot. */
export function scheduleSlotPath(groupId: string, slotId: string) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/schedule/${slotId}`;
}

/** Every schedule page, for refreshing after a change. */
export const SCHEDULE_PAGES = `${CAMP_HQ_PATH}/groups/[id]/schedule`;

/** What a schedule form shows after a refused change. */
export type ScheduleFormState = {
  error?: string;
  /** The Camp group that has the activity, when a booking clashed. */
  other?: { id: string; name: string; weekday: number };
  /** The values the person entered, so a refused form keeps them. */
  values?: Record<string, string>;
  /** Changes on every success, so a form can clear itself. */
  savedAt?: number;
};
