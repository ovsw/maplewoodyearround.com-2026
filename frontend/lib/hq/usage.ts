// Where a Camp group or an activity is used elsewhere in Camp HQ. Removing one
// that is still used is refused with these descriptions. Each later feature
// that refers to a group or an activity (Assignments, schedules, Club day
// options) adds its check here.
import { asc, eq, sql } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import {
  activitySpecialists,
  camperDays,
  campGroups,
  groupLeaders,
  juniorPlacements,
  scheduleSlots,
  staffMembers,
} from "./db/schema.ts";
import { formatSlotRange, weekdayLabels, type ScheduleWeekday } from "./schedule-times.ts";

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

/**
 * Campers the camper list puts in the group on some day. Camp HQ cannot edit
 * campers, so the group stays until a camper file without it is loaded.
 */
const camperListUsage: CampHqUsageCheck = async (db, campGroupId) => {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${camperDays.camperId})::int` })
    .from(camperDays)
    .where(eq(camperDays.campGroupId, campGroupId));
  const count = row?.count ?? 0;
  if (count === 0) return [];
  return [
    `Camper list: ${count === 1 ? "1 camper is" : `${count} campers are`} in this group on some days. Load a camper file without this group first.`,
  ];
};

/**
 * Where an activity is booked on a Group schedule, e.g. "Schedule of Knights,
 * Monday 9:30 AM to 10:00 AM". A Camp group's own schedule is removed with it,
 * so it is not a use of the group.
 */
export const activityOnGroupSchedules: CampHqUsageCheck = async (db, activityId) => {
  const rows = await db
    .select({
      groupName: campGroups.name,
      weekday: scheduleSlots.weekday,
      start: scheduleSlots.startMinute,
      end: scheduleSlots.endMinute,
    })
    .from(scheduleSlots)
    .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
    .where(eq(scheduleSlots.activityId, activityId))
    .orderBy(
      asc(sql`lower(${campGroups.name})`),
      asc(scheduleSlots.weekday),
      asc(scheduleSlots.startMinute),
    );
  return rows.map(
    (row) =>
      `Schedule of ${row.groupName}, ${weekdayLabels[row.weekday as ScheduleWeekday]} ${formatSlotRange(row.start, row.end)}`,
  );
};

export const campHqUsageChecks: CampHqUsageChecks = {
  campGroup: [groupLeaderUsage, groupHelperUsage, camperListUsage],
  activity: [specialistUsage, clubDayHelperUsage, activityOnGroupSchedules],
};
