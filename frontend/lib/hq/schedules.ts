// Group schedules: each Camp group's weekly schedule, Monday to Friday, and the
// rules that keep bookings from clashing. Part of the Camp HQ operations module
// (see operations.ts); pages never call this file directly. Any signed-in
// person can read schedules; only Admins can change them.
//
// Booking rules:
// - An activity must be allowed for every grade of the Camp group.
// - An Exclusive activity can be used by one Camp group at a time. A booking
//   that overlaps another group's booking of it is refused, naming that group.
// - Shared activities are never checked.
// - Back to back is not an overlap. A group's own slots cannot overlap.
import { and, asc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import { activities, campGroups, scheduleDays, scheduleSlots } from "./db/schema.ts";
import { campHqGradeLabels, sortGrades, type CampHqGrade } from "./grades.ts";
import type { Activity } from "./lists.ts";
import { CampHqRefusal, type CampHqActor, type CampHqRequest } from "./operations.ts";
import {
  SCHEDULE_WEEKDAYS,
  defaultDaySlots,
  formatSlotRange,
  isScheduleWeekday,
  parseSlotTime,
  weekdayLabels,
  type ScheduleWeekday,
} from "./schedule-times.ts";

export type ScheduleSlotContent =
  | { type: "empty" }
  | { type: "club-day" }
  | { type: "activity"; activity: Pick<Activity, "id" | "name" | "kind"> };

export type ScheduleSlot = {
  id: string;
  campGroupId: string;
  weekday: ScheduleWeekday;
  /** Minutes after midnight, camp local time. */
  start: number;
  end: number;
  content: ScheduleSlotContent;
};

export type ScheduleDay = { weekday: ScheduleWeekday; slots: ScheduleSlot[] };

export type GroupSchedule = {
  group: { id: string; name: string; grades: CampHqGrade[] };
  days: ScheduleDay[];
};

/** Another Camp group's booking of an Exclusive activity at an overlapping time. */
export type ScheduleBooking = {
  campGroupId: string;
  campGroupName: string;
  weekday: ScheduleWeekday;
  start: number;
  end: number;
};

export type ActivityChoice = {
  activity: Activity;
  /** Set when the activity is Exclusive and another group has it at an overlapping time. */
  bookedBy: ScheduleBooking | null;
};

export type SlotChoices = {
  slot: ScheduleSlot;
  group: GroupSchedule["group"];
  /** The activities allowed for the group's grades, by name. */
  choices: ActivityChoice[];
};

export type SlotTimesInput = { start: string; end: string };

export type SlotContentInput =
  | { type: "empty" }
  | { type: "club-day" }
  | { type: "activity"; activityId: string };

type ScheduleDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<unknown>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SlotRow = typeof scheduleSlots.$inferSelect;
type ActivityRow = typeof activities.$inferSelect;
type GroupRow = typeof campGroups.$inferSelect;

function invalid(message: string): never {
  throw new CampHqRefusal("invalid-input", message);
}

function notFound(what: string): never {
  throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
}

function cleanWeekday(value: unknown): ScheduleWeekday {
  if (!isScheduleWeekday(value)) invalid("Choose a weekday, Monday to Friday.");
  return value;
}

function cleanTimes(input: SlotTimesInput) {
  const start = parseSlotTime(input?.start);
  const end = parseSlotTime(input?.end);
  if (start === null) invalid("Give the slot a start time.");
  if (end === null) invalid("Give the slot an end time.");
  if (end <= start) invalid("The slot must end after it starts.");
  return { start, end };
}

function describeDay(weekday: number) {
  return weekdayLabels[weekday as ScheduleWeekday];
}

function toSlot(row: SlotRow, activity: ActivityRow | null): ScheduleSlot {
  const content: ScheduleSlotContent = row.isClubDay
    ? { type: "club-day" }
    : activity
      ? { type: "activity", activity: { id: activity.id, name: activity.name, kind: activity.kind } }
      : { type: "empty" };
  return {
    id: row.id,
    campGroupId: row.campGroupId,
    weekday: row.weekday as ScheduleWeekday,
    start: row.startMinute,
    end: row.endMinute,
    content,
  };
}

function toGroup(row: GroupRow): GroupSchedule["group"] {
  return { id: row.id, name: row.name, grades: sortGrades(row.grades) };
}

function toActivity(row: ActivityRow): Activity {
  return { id: row.id, name: row.name, grades: sortGrades(row.grades), kind: row.kind };
}

/** The group's grades that the activity is not allowed for. */
function gradesNotAllowed(group: GroupRow, activity: ActivityRow) {
  return sortGrades(group.grades).filter((grade) => !activity.grades.includes(grade));
}

export function createScheduleOperations({ db, requirePerson, requireAdmin }: ScheduleDeps) {
  async function requireReader(actor: CampHqActor) {
    if (actor.type === "command-line") return;
    await requirePerson(actor);
  }

  async function findGroupRow(tx: CampHqDb, id: string) {
    if (typeof id !== "string" || !UUID.test(id)) return undefined;
    const [row] = await tx.select().from(campGroups).where(eq(campGroups.id, id)).limit(1);
    return row;
  }

  async function findSlotRow(tx: CampHqDb, id: string) {
    if (typeof id !== "string" || !UUID.test(id)) return undefined;
    const [row] = await tx.select().from(scheduleSlots).where(eq(scheduleSlots.id, id)).limit(1);
    return row;
  }

  /**
   * Starts every weekday of the group that has not been started yet with the
   * default slots. Safe to run again or at the same time from two requests.
   */
  async function startDays(tx: CampHqDb, groupId: string, now: Date) {
    const started = await tx
      .insert(scheduleDays)
      .values(SCHEDULE_WEEKDAYS.map((weekday) => ({ campGroupId: groupId, weekday, createdAt: now })))
      .onConflictDoNothing()
      .returning({ weekday: scheduleDays.weekday });
    if (started.length === 0) return;
    await tx.insert(scheduleSlots).values(
      started.flatMap(({ weekday }) =>
        defaultDaySlots().map(({ start, end }) => ({
          campGroupId: groupId,
          weekday,
          startMinute: start,
          endMinute: end,
          createdAt: now,
          updatedAt: now,
        })),
      ),
    );
  }

  /** Holds the group's day until the transaction ends, so two edits to it run one after the other. */
  async function lockDay(tx: CampHqDb, groupId: string, weekday: number) {
    await tx
      .select({ weekday: scheduleDays.weekday })
      .from(scheduleDays)
      .where(and(eq(scheduleDays.campGroupId, groupId), eq(scheduleDays.weekday, weekday)))
      .for("update");
  }

  /** Refuses a time that overlaps another slot of the same group's day. */
  async function refuseOwnOverlap(
    tx: CampHqDb,
    groupId: string,
    weekday: number,
    times: { start: number; end: number },
    exceptSlotId?: string,
  ) {
    const conditions = [
      eq(scheduleSlots.campGroupId, groupId),
      eq(scheduleSlots.weekday, weekday),
      lt(scheduleSlots.startMinute, times.end),
      gt(scheduleSlots.endMinute, times.start),
    ];
    if (exceptSlotId) conditions.push(ne(scheduleSlots.id, exceptSlotId));
    const [overlap] = await tx
      .select()
      .from(scheduleSlots)
      .where(and(...conditions))
      .orderBy(asc(scheduleSlots.startMinute))
      .limit(1);
    if (overlap) {
      throw new CampHqRefusal(
        "slot-overlap",
        `This time overlaps the ${formatSlotRange(overlap.startMinute, overlap.endMinute)} slot on ${describeDay(weekday)}. Change or remove that slot first.`,
      );
    }
  }

  /** Other groups' bookings of these activities that overlap the time, earliest first. */
  async function overlappingBookings(
    tx: CampHqDb,
    activityIds: string[],
    groupId: string,
    weekday: number,
    times: { start: number; end: number },
  ) {
    if (activityIds.length === 0) return [];
    return tx
      .select({
        activityId: scheduleSlots.activityId,
        campGroupId: campGroups.id,
        campGroupName: campGroups.name,
        start: scheduleSlots.startMinute,
        end: scheduleSlots.endMinute,
      })
      .from(scheduleSlots)
      .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
      .where(
        and(
          inArray(scheduleSlots.activityId, activityIds),
          eq(scheduleSlots.weekday, weekday),
          ne(scheduleSlots.campGroupId, groupId),
          lt(scheduleSlots.startMinute, times.end),
          gt(scheduleSlots.endMinute, times.start),
        ),
      )
      .orderBy(asc(scheduleSlots.startMinute), asc(sql`lower(${campGroups.name})`));
  }

  /**
   * Refuses booking an Exclusive activity that another group has at an
   * overlapping time. Locks the activity first, so two bookings of it at the
   * same moment cannot both pass the check.
   */
  async function refuseClash(
    tx: CampHqDb,
    activityId: string,
    groupId: string,
    weekday: number,
    times: { start: number; end: number },
  ) {
    const [activity] = await tx
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .for("update");
    if (!activity) notFound("activity");
    if (activity.kind !== "exclusive") return activity;
    const [clash] = await overlappingBookings(tx, [activityId], groupId, weekday, times);
    if (clash) {
      throw new CampHqRefusal(
        "clash",
        `${activity.name} is an Exclusive activity and ${clash.campGroupName} already has it on ${describeDay(weekday)}, ${formatSlotRange(clash.start, clash.end)}.`,
        [],
        { kind: "camp-group", id: clash.campGroupId, name: clash.campGroupName },
      );
    }
    return activity;
  }

  async function readSchedule(groupId: string, now: Date): Promise<GroupSchedule> {
    return db.transaction(async (transaction) => {
      const tx = transaction as unknown as CampHqDb;
      const group = await findGroupRow(tx, groupId);
      if (!group) notFound("Camp group");
      await startDays(tx, group.id, now);
      const rows = await tx
        .select({ slot: scheduleSlots, activity: activities })
        .from(scheduleSlots)
        .leftJoin(activities, eq(activities.id, scheduleSlots.activityId))
        .where(eq(scheduleSlots.campGroupId, group.id))
        .orderBy(asc(scheduleSlots.weekday), asc(scheduleSlots.startMinute));
      const slots = rows.map(({ slot, activity }) => toSlot(slot, activity));
      return {
        group: toGroup(group),
        days: SCHEDULE_WEEKDAYS.map((weekday) => ({
          weekday,
          slots: slots.filter((slot) => slot.weekday === weekday),
        })),
      };
    });
  }

  /** Loads a slot and its group for a change, locking the group's day. */
  async function slotForChange(tx: CampHqDb, slotId: string) {
    const found = await findSlotRow(tx, slotId);
    if (!found) notFound("slot");
    await lockDay(tx, found.campGroupId, found.weekday);
    // Read again under the lock, in case it changed meanwhile.
    const slot = await findSlotRow(tx, slotId);
    if (!slot) notFound("slot");
    const group = await findGroupRow(tx, slot.campGroupId);
    if (!group) notFound("Camp group");
    return { slot, group };
  }

  return {
    /**
     * The Camp group's weekly schedule, Monday to Friday, slots in time order.
     * A weekday that was never started gets the default slots first.
     */
    async getGroupSchedule({ actor, now }: CampHqRequest, groupId: string): Promise<GroupSchedule> {
      await requireReader(actor);
      return readSchedule(groupId, now);
    },

    /**
     * What a slot can hold: the activities allowed for the group's grades, each
     * marked with the other group's booking when it is an Exclusive activity
     * that group has at an overlapping time.
     */
    async getSlotChoices({ actor }: CampHqRequest, slotId: string): Promise<SlotChoices> {
      await requireReader(actor);
      const slot = await findSlotRow(db, slotId);
      if (!slot) notFound("slot");
      const group = await findGroupRow(db, slot.campGroupId);
      if (!group) notFound("Camp group");
      const [activityRows, current] = await Promise.all([
        db.select().from(activities).orderBy(asc(sql`lower(${activities.name})`)),
        slot.activityId
          ? db.select().from(activities).where(eq(activities.id, slot.activityId)).limit(1)
          : Promise.resolve([]),
      ]);
      const allowed = activityRows.filter((activity) => gradesNotAllowed(group, activity).length === 0);
      const exclusiveIds = allowed.filter((a) => a.kind === "exclusive").map((a) => a.id);
      const bookings = await overlappingBookings(db, exclusiveIds, group.id, slot.weekday, {
        start: slot.startMinute,
        end: slot.endMinute,
      });
      const bookedBy = new Map<string, ScheduleBooking>();
      for (const booking of bookings) {
        if (!booking.activityId || bookedBy.has(booking.activityId)) continue;
        bookedBy.set(booking.activityId, {
          campGroupId: booking.campGroupId,
          campGroupName: booking.campGroupName,
          weekday: slot.weekday as ScheduleWeekday,
          start: booking.start,
          end: booking.end,
        });
      }
      return {
        slot: toSlot(slot, current[0] ?? null),
        group: toGroup(group),
        choices: allowed.map((activity) => ({
          activity: toActivity(activity),
          bookedBy: bookedBy.get(activity.id) ?? null,
        })),
      };
    },

    /** Adds an empty slot to one weekday of the group's schedule. */
    async addScheduleSlot(
      { actor, now }: CampHqRequest,
      groupId: string,
      weekday: number,
      input: SlotTimesInput,
    ): Promise<ScheduleSlot> {
      await requireAdmin(actor);
      const day = cleanWeekday(weekday);
      const times = cleanTimes(input);
      return db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        const group = await findGroupRow(tx, groupId);
        if (!group) notFound("Camp group");
        await startDays(tx, group.id, now);
        await lockDay(tx, group.id, day);
        await refuseOwnOverlap(tx, group.id, day, times);
        const [row] = await tx
          .insert(scheduleSlots)
          .values({
            campGroupId: group.id,
            weekday: day,
            startMinute: times.start,
            endMinute: times.end,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return toSlot(row, null);
      });
    },

    /** Changes a slot's start and end. A booked Exclusive activity is checked again. */
    async changeScheduleSlotTimes(
      { actor, now }: CampHqRequest,
      slotId: string,
      input: SlotTimesInput,
    ): Promise<ScheduleSlot> {
      await requireAdmin(actor);
      const times = cleanTimes(input);
      return db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        const { slot, group } = await slotForChange(tx, slotId);
        await refuseOwnOverlap(tx, group.id, slot.weekday, times, slot.id);
        const activity = slot.activityId
          ? await refuseClash(tx, slot.activityId, group.id, slot.weekday, times)
          : null;
        const [row] = await tx
          .update(scheduleSlots)
          .set({ startMinute: times.start, endMinute: times.end, updatedAt: now })
          .where(eq(scheduleSlots.id, slot.id))
          .returning();
        return toSlot(row, activity);
      });
    },

    /**
     * Sets what a slot holds: an activity, a Club day period, or nothing. An
     * activity not allowed for the group's grades, or an Exclusive activity
     * another group has at an overlapping time, is refused with the reason.
     */
    async setScheduleSlotContent(
      { actor, now }: CampHqRequest,
      slotId: string,
      content: SlotContentInput,
    ): Promise<ScheduleSlot> {
      await requireAdmin(actor);
      const type = content?.type;
      if (type !== "empty" && type !== "club-day" && type !== "activity") {
        invalid("Choose an activity, a Club day period or an empty slot.");
      }
      return db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        const { slot, group } = await slotForChange(tx, slotId);
        let activity: ActivityRow | null = null;
        if (content.type === "activity") {
          const activityId = content.activityId;
          if (typeof activityId !== "string" || !UUID.test(activityId)) notFound("activity");
          const [found] = await tx
            .select()
            .from(activities)
            .where(eq(activities.id, activityId))
            .for("update");
          if (!found) notFound("activity");
          const missing = gradesNotAllowed(group, found);
          if (missing.length > 0) {
            throw new CampHqRefusal(
              "grade-not-allowed",
              `${found.name} is not allowed for ${missing.map((grade) => campHqGradeLabels[grade]).join(", ")}, so ${group.name} cannot have it.`,
            );
          }
          activity = await refuseClash(tx, found.id, group.id, slot.weekday, {
            start: slot.startMinute,
            end: slot.endMinute,
          });
        }
        const [row] = await tx
          .update(scheduleSlots)
          .set({
            activityId: activity?.id ?? null,
            isClubDay: content.type === "club-day",
            updatedAt: now,
          })
          .where(eq(scheduleSlots.id, slot.id))
          .returning();
        return toSlot(row, activity);
      });
    },

    /** Removes a slot from the group's day. */
    async removeScheduleSlot({ actor }: CampHqRequest, slotId: string): Promise<void> {
      await requireAdmin(actor);
      await db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        const { slot } = await slotForChange(tx, slotId);
        await tx.delete(scheduleSlots).where(eq(scheduleSlots.id, slot.id));
      });
    },
  };
}
