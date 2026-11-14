import { CAMP_HQ_PATH } from "@/lib/hq/config";

export const CLUB_DAY_PATH = `${CAMP_HQ_PATH}/club-day`;

/** Admins: children expected today who have no Club day pick yet. */
export const CLUB_DAY_MISSING_PATH = `${CLUB_DAY_PATH}/missing`;

/** A Camp group's Club day signups today. */
export function groupClubDayPath(groupId: string) {
  return `${CAMP_HQ_PATH}/groups/${groupId}/club-day`;
}

/** Every group's signup page, for refreshing after a pick. */
export const GROUP_CLUB_DAY_PAGES = `${CAMP_HQ_PATH}/groups/[id]/club-day`;

/** How often a signup screen fetches again while it is open. */
export const SIGNUP_REFRESH_MS = 15_000;

/** Admins: today's Club day rosters, ready to print. */
export const CLUB_DAY_ROSTERS_PATH = `${CLUB_DAY_PATH}/rosters`;

/** Admins: one Club day roster, by option and period. */
export function clubDayRosterPath(optionId: string, period: number) {
  return `${CLUB_DAY_ROSTERS_PATH}?option=${encodeURIComponent(optionId)}&period=${period}`;
}

/** A specialist's Club day rosters today. */
export const MY_CLUB_DAY_ROSTERS_PATH = `${CAMP_HQ_PATH}/my-activities/rosters`;
