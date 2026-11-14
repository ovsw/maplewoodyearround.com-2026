// Clash rules shared by Group schedules, Club day options and Assignments.
// Part of the Camp HQ operations module (see operations.ts); pages never call
// this file directly.
//
// An activity is in use at a time in two ways:
// - a booking: a Camp group has it in a slot of its Group schedule;
// - an option use: it is a Club day option of a Team on a weekday, and one of
//   that Team's Camp groups has a Club day period then.
//
// Rules checked here. Shared activities are never checked, and back to back is
// not an overlap.
// - PROVISIONAL, until Maplewood confirms it: an Exclusive activity cannot be
//   booked at a time that overlaps a Club day period in which it is a Club day
//   option, and cannot become a Club day option while such a booking exists.
// - One specialist cannot have two of their activities in use at overlapping
//   times.
// The rule that an Exclusive activity has one Camp group at a time lives in
// schedules.ts.
import { and, asc, eq, sql, type SQL } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import {
  activities,
  activitySpecialists,
  campGroups,
  clubDayOptions,
  scheduleSlots,
  staffMembers,
} from "./db/schema.ts";
import { CampHqRefusal } from "./operations.ts";
import { formatSlotRange, slotsOverlap, weekdayLabels, type ScheduleWeekday } from "./schedule-times.ts";

/** One activity in use at one time. */
export type ActivityUse = {
  activityId: string;
  activityName: string;
  exclusive: boolean;
  weekday: number;
  /** Minutes after midnight, camp local time. */
  start: number;
  end: number;
  /** The Group schedule slot behind the use: the booking, or the Club day period. */
  slotId: string;
  /** The Camp group that has the booking, or whose Club day period it is. */
  campGroupId: string;
  campGroupName: string;
  /** Set on an option use. */
  option: { id: string; team: number } | null;
};

export type ActivityRef = { id: string; name: string; kind: string };

export type SlotRef = {
  slotId: string;
  campGroupId: string;
  campGroupName: string;
  weekday: number;
  start: number;
  end: number;
};

export type OptionRef = { id: string; team: number; activity: ActivityRef };

type Specialist = { id: string; name: string };

/** Any number that no other advisory lock in Camp HQ uses. */
const CLASH_RULES_LOCK = 1_400_150;

/**
 * Makes every change that the clash rules check run one after the other until
 * the transaction ends. Take it first in the transaction, before any row lock.
 */
export async function lockClashRules(tx: CampHqDb) {
  await tx.execute(sql`select pg_advisory_xact_lock(${CLASH_RULES_LOCK})`);
}

export function bookingUse(activity: ActivityRef, slot: SlotRef): ActivityUse {
  return {
    activityId: activity.id,
    activityName: activity.name,
    exclusive: activity.kind === "exclusive",
    ...slot,
    option: null,
  };
}

export function optionUse(option: OptionRef, period: SlotRef): ActivityUse {
  return {
    activityId: option.activity.id,
    activityName: option.activity.name,
    exclusive: option.activity.kind === "exclusive",
    ...period,
    option: { id: option.id, team: option.team },
  };
}

/** Every activity in use, on one weekday or on all of them, in time order. */
export async function loadActivityUses(tx: CampHqDb, weekday?: number): Promise<ActivityUse[]> {
  const bookingFilter: SQL | undefined =
    weekday === undefined ? undefined : eq(scheduleSlots.weekday, weekday);
  const optionFilter: SQL | undefined =
    weekday === undefined ? undefined : eq(clubDayOptions.weekday, weekday);
  const slotColumns = {
    slotId: scheduleSlots.id,
    weekday: scheduleSlots.weekday,
    start: scheduleSlots.startMinute,
    end: scheduleSlots.endMinute,
    campGroupId: campGroups.id,
    campGroupName: campGroups.name,
  };
  const activityColumns = { id: activities.id, name: activities.name, kind: activities.kind };
  // One query after the other: both may run inside one transaction.
  const bookings = await tx
      .select({ slot: slotColumns, activity: activityColumns })
      .from(scheduleSlots)
      .innerJoin(activities, eq(activities.id, scheduleSlots.activityId))
      .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
      .where(bookingFilter);
  const options = await tx
      .select({
        slot: slotColumns,
        activity: activityColumns,
        optionId: clubDayOptions.id,
        team: clubDayOptions.team,
      })
      .from(clubDayOptions)
      .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
      .innerJoin(campGroups, eq(campGroups.team, clubDayOptions.team))
      .innerJoin(
        scheduleSlots,
        and(
          eq(scheduleSlots.campGroupId, campGroups.id),
          eq(scheduleSlots.weekday, clubDayOptions.weekday),
          eq(scheduleSlots.isClubDay, true),
        ),
      )
      .where(optionFilter);
  const uses = [
    ...bookings.map((row) => bookingUse(row.activity, row.slot)),
    ...options.map((row) =>
      optionUse({ id: row.optionId, team: row.team, activity: row.activity }, row.slot),
    ),
  ];
  return uses.sort(
    (a, b) =>
      a.weekday - b.weekday ||
      a.start - b.start ||
      a.campGroupName.localeCompare(b.campGroupName) ||
      a.activityName.localeCompare(b.activityName),
  );
}

/** The Club day periods of a Team's Camp groups on a weekday. */
export async function loadClubDayPeriods(
  tx: CampHqDb,
  team: number,
  weekday: number,
): Promise<SlotRef[]> {
  return tx
    .select({
      slotId: scheduleSlots.id,
      weekday: scheduleSlots.weekday,
      start: scheduleSlots.startMinute,
      end: scheduleSlots.endMinute,
      campGroupId: campGroups.id,
      campGroupName: campGroups.name,
    })
    .from(scheduleSlots)
    .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
    .where(
      and(
        eq(campGroups.team, team),
        eq(scheduleSlots.weekday, weekday),
        eq(scheduleSlots.isClubDay, true),
      ),
    )
    .orderBy(asc(scheduleSlots.startMinute), asc(sql`lower(${campGroups.name})`));
}

/** Every Club day period of one Camp group, on all weekdays. */
export async function loadGroupClubDayPeriods(tx: CampHqDb, campGroupId: string): Promise<SlotRef[]> {
  return tx
    .select({
      slotId: scheduleSlots.id,
      weekday: scheduleSlots.weekday,
      start: scheduleSlots.startMinute,
      end: scheduleSlots.endMinute,
      campGroupId: campGroups.id,
      campGroupName: campGroups.name,
    })
    .from(scheduleSlots)
    .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
    .where(and(eq(scheduleSlots.campGroupId, campGroupId), eq(scheduleSlots.isClubDay, true)))
    .orderBy(asc(scheduleSlots.weekday), asc(scheduleSlots.startMinute));
}

/** The Club day options of a Team on a weekday. */
export async function loadTeamOptions(
  tx: CampHqDb,
  team: number,
  weekday: number,
): Promise<OptionRef[]> {
  const rows = await tx
    .select({
      id: clubDayOptions.id,
      team: clubDayOptions.team,
      activity: { id: activities.id, name: activities.name, kind: activities.kind },
    })
    .from(clubDayOptions)
    .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
    .where(and(eq(clubDayOptions.team, team), eq(clubDayOptions.weekday, weekday)))
    .orderBy(asc(sql`lower(${activities.name})`));
  return rows;
}

/** The specialist of each activity that has one. */
export async function loadSpecialists(tx: CampHqDb): Promise<Map<string, Specialist>> {
  const rows = await tx
    .select({
      activityId: activitySpecialists.activityId,
      id: staffMembers.id,
      name: staffMembers.name,
    })
    .from(activitySpecialists)
    .innerJoin(staffMembers, eq(staffMembers.id, activitySpecialists.staffMemberId));
  return new Map(rows.map(({ activityId, id, name }) => [activityId, { id, name }]));
}

function describeTime(use: ActivityUse) {
  return `${weekdayLabels[use.weekday as ScheduleWeekday]}, ${formatSlotRange(use.start, use.end)}`;
}

function describeUse(use: ActivityUse) {
  if (use.option) {
    return `it is a Club day option for Team ${use.option.team} during the Club day period of ${use.campGroupName} on ${describeTime(use)}`;
  }
  return `${use.campGroupName} has it on ${describeTime(use)}`;
}

function campGroupOf(use: ActivityUse) {
  return { kind: "camp-group" as const, id: use.campGroupId, name: use.campGroupName };
}

/** The refusal when `proposed` cannot be in use alongside `other`, or null. */
function clashBetween(
  proposed: ActivityUse,
  other: ActivityUse,
  specialistOf: Map<string, Specialist>,
): CampHqRefusal | null {
  if (proposed.weekday !== other.weekday || !slotsOverlap(proposed, other)) return null;
  if (!proposed.exclusive || !other.exclusive) return null;

  if (proposed.activityId === other.activityId) {
    // PROVISIONAL rule, until Maplewood confirms it (see the top of this file).
    if (!proposed.option && other.option) {
      return new CampHqRefusal(
        "club-day-clash",
        `${proposed.activityName} is a Club day option for Team ${other.option.team} during the Club day period of ${other.campGroupName} on ${describeTime(other)}. An Exclusive activity cannot be booked while it is a Club day option.`,
        [],
        campGroupOf(other),
      );
    }
    if (proposed.option && !other.option) {
      return new CampHqRefusal(
        "club-day-clash",
        `${other.campGroupName} has ${other.activityName} on ${describeTime(other)}, during the Club day period of ${proposed.campGroupName}. An Exclusive activity cannot be a Club day option while it is booked then.`,
        [],
        campGroupOf(other),
      );
    }
    return null;
  }

  const specialist = specialistOf.get(proposed.activityId);
  if (specialist && specialistOf.get(other.activityId)?.id === specialist.id) {
    return new CampHqRefusal(
      "specialist-clash",
      `${specialist.name} is the specialist for ${proposed.activityName} and ${other.activityName}, and ${other.activityName} is in use then: ${describeUse(other)}. One specialist cannot run two activities at once.`,
      [],
      { kind: "specialist", id: specialist.id, name: specialist.name },
    );
  }
  return null;
}

/**
 * Refuses when a proposed use clashes with an existing use or with another
 * proposed use. `existing` must leave out the uses the change replaces.
 */
export function refuseUseClashes({
  proposed,
  existing,
  specialistOf,
}: {
  proposed: ActivityUse[];
  existing: ActivityUse[];
  specialistOf: Map<string, Specialist>;
}) {
  const checked = [...existing];
  for (const use of proposed) {
    for (const other of checked) {
      const refusal = clashBetween(use, other, specialistOf);
      if (refusal) throw refusal;
    }
    checked.push(use);
  }
}
