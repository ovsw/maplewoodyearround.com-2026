// Where a Camp group or an activity is used elsewhere in Camp HQ. Removing one
// that is still used is refused with these descriptions. Each later feature
// that refers to a group or an activity (Assignments, schedules, Club day
// options) adds its check here.
import { asc, eq } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import {
  activitySpecialists,
  groupLeaders,
  juniorPlacements,
  staffMembers,
} from "./db/schema.ts";

/** Returns one plain description per place the record is used, e.g. "Schedule of Knights, Monday 9:00". */
export type CampHqUsageCheck = (db: CampHqDb, id: string) => Promise<string[]>;

export type CampHqUsageChecks = {
  campGroup: CampHqUsageCheck[];
  activity: CampHqUsageCheck[];
};

const groupLeaderUsage: CampHqUsageCheck = async (db, campGroupId) => {
  const rows = await db
    .select({ name: staffMembers.name })
    .from(groupLeaders)
    .innerJoin(staffMembers, eq(staffMembers.id, groupLeaders.staffMemberId))
    .where(eq(groupLeaders.campGroupId, campGroupId));
  return rows.map(({ name }) => `Assignment: ${name} leads this group`);
};

const groupHelperUsage: CampHqUsageCheck = async (db, campGroupId) => {
  const rows = await db
    .select({ name: staffMembers.name })
    .from(juniorPlacements)
    .innerJoin(staffMembers, eq(staffMembers.id, juniorPlacements.staffMemberId))
    .where(eq(juniorPlacements.campGroupId, campGroupId))
    .orderBy(asc(staffMembers.name));
  return rows.map(({ name }) => `Assignment: ${name} helps this group`);
};

const specialistUsage: CampHqUsageCheck = async (db, activityId) => {
  const rows = await db
    .select({ name: staffMembers.name })
    .from(activitySpecialists)
    .innerJoin(staffMembers, eq(staffMembers.id, activitySpecialists.staffMemberId))
    .where(eq(activitySpecialists.activityId, activityId));
  return rows.map(({ name }) => `Assignment: ${name} is the specialist`);
};

const clubDayHelperUsage: CampHqUsageCheck = async (db, activityId) => {
  const rows = await db
    .select({ name: staffMembers.name })
    .from(juniorPlacements)
    .innerJoin(staffMembers, eq(staffMembers.id, juniorPlacements.staffMemberId))
    .where(eq(juniorPlacements.clubDayActivityId, activityId))
    .orderBy(asc(staffMembers.name));
  return rows.map(({ name }) => `Assignment: ${name}'s Club day activity`);
};

export const campHqUsageChecks: CampHqUsageChecks = {
  campGroup: [groupLeaderUsage, groupHelperUsage],
  activity: [specialistUsage, clubDayHelperUsage],
};
