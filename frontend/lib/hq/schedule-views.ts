// Schedule views: what staff read from the Group schedules on their own
// sign-in. A group leader sees their group's day, a specialist sees which
// groups come to their activities, and everyone can see where each group is by
// activity and every group's locations. Part of the Camp HQ operations module
// (see operations.ts); pages never call this file directly.
//
// These views only read. A weekday an Admin never opened has no slots here
// (the builder fills a new day with empty default slots when an Admin opens
// it, and those hold nothing a reader needs). The current slot comes from the
// time passed in, read as camp local time (America/New_York).
import { and, asc, eq, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import { activities, activitySpecialists, campGroups, groupLeaders, scheduleSlots } from "./db/schema.ts";
import { sortGrades, type CampHqGrade } from "./grades.ts";
import { toCampGroup, type Activity, type CampGroupLocations } from "./lists.ts";
import {
  CampHqRefusal,
  type CampHqActor,
  type CampHqPerson,
  type CampHqRequest,
} from "./operations.ts";
import {
  SCHEDULE_WEEKDAYS,
  campClock,
  isCurrentSlot,
  isScheduleWeekday,
  type ScheduleWeekday,
} from "./schedule-times.ts";
import { toSlot, type ScheduleDay } from "./schedules.ts";

type NamedRef = { id: string; name: string };

/** A group leader's read-only view of their group's week. */
export type LeaderView = {
  group: NamedRef & { grades: CampHqGrade[] };
  locations: CampGroupLocations;
  /** Today's weekday in camp time, or null on a weekend. */
  today: ScheduleWeekday | null;
  /** The slot running now, or null outside camp hours, between slots and at weekends. */
  currentSlotId: string | null;
  days: ScheduleDay[];
};

/** One Camp group's visit to an activity. */
export type ActivityVisit = {
  slotId: string;
  campGroup: NamedRef;
  start: number;
  end: number;
  isCurrent: boolean;
};

/** Which groups come to each of a specialist's activities today. */
export type SpecialistDay = {
  today: ScheduleWeekday | null;
  activities: { activity: Pick<Activity, "id" | "name" | "kind">; visits: ActivityVisit[] }[];
};

/** Where every group is on one weekday, by activity. */
export type ActivityBoard = {
  weekday: ScheduleWeekday;
  today: ScheduleWeekday | null;
  /** Activities booked on the weekday, by name, each with its visits in time order. */
  activities: { activity: Pick<Activity, "id" | "name" | "kind">; visits: ActivityVisit[] }[];
  /** Groups in a Club day period, in time order. */
  clubDay: ActivityVisit[];
};

export type GroupLocationsEntry = NamedRef & { locations: CampGroupLocations };

type ScheduleViewDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<CampHqPerson>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(what: string): never {
  throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
}

function cleanWeekday(value: unknown): ScheduleWeekday {
  if (!isScheduleWeekday(value)) {
    throw new CampHqRefusal("invalid-input", "Choose a weekday, Monday to Friday.");
  }
  return value;
}

export function createScheduleViewOperations({ db, requirePerson }: ScheduleViewDeps) {
  /** The person, or null for a trusted command. */
  async function requireReader(actor: CampHqActor) {
    if (actor.type === "command-line") return null;
    return requirePerson(actor);
  }

  /** Every booked slot (an activity or a Club day period) matching `where`, in time order. */
  async function bookedSlots(where: SQL | undefined) {
    return db
      .select({ slot: scheduleSlots, activity: activities, group: campGroups })
      .from(scheduleSlots)
      .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
      .leftJoin(activities, eq(activities.id, scheduleSlots.activityId))
      .where(
        and(where, or(isNotNull(scheduleSlots.activityId), eq(scheduleSlots.isClubDay, true))),
      )
      .orderBy(
        asc(scheduleSlots.startMinute),
        asc(scheduleSlots.endMinute),
        asc(sql`lower(${campGroups.name})`),
      );
  }

  type BookedRow = Awaited<ReturnType<typeof bookedSlots>>[number];

  function toVisit({ slot, group }: BookedRow, clock: ReturnType<typeof campClock>): ActivityVisit {
    return {
      slotId: slot.id,
      campGroup: { id: group.id, name: group.name },
      start: slot.startMinute,
      end: slot.endMinute,
      isCurrent: isCurrentSlot(
        { weekday: slot.weekday, start: slot.startMinute, end: slot.endMinute },
        clock,
      ),
    };
  }

  /** Groups the booked rows by activity, activities by name. */
  function byActivity(rows: BookedRow[], clock: ReturnType<typeof campClock>) {
    const found = new Map<string, SpecialistDay["activities"][number]>();
    for (const row of rows) {
      if (!row.activity) continue;
      let entry = found.get(row.activity.id);
      if (!entry) {
        entry = {
          activity: { id: row.activity.id, name: row.activity.name, kind: row.activity.kind },
          visits: [],
        };
        found.set(row.activity.id, entry);
      }
      entry.visits.push(toVisit(row, clock));
    }
    return [...found.values()].sort((a, b) =>
      a.activity.name.localeCompare(b.activity.name, "en", { sensitivity: "base" }),
    );
  }

  return {
    /**
     * A Camp group's week as its leader sees it: every weekday, today's
     * weekday, the slot running now, and the group's locations. Read-only.
     * The group's leader and Admins can open it; anyone else is refused.
     */
    async getLeaderView({ actor, now }: CampHqRequest, campGroupId: string): Promise<LeaderView> {
      const person = await requireReader(actor);
      if (typeof campGroupId !== "string" || !UUID.test(campGroupId)) notFound("Camp group");
      const [group] = await db
        .select()
        .from(campGroups)
        .where(eq(campGroups.id, campGroupId))
        .limit(1);
      if (!group) notFound("Camp group");

      if (person && person.role !== "admin") {
        const [leader] = await db
          .select({ staffMemberId: groupLeaders.staffMemberId })
          .from(groupLeaders)
          .where(eq(groupLeaders.campGroupId, group.id))
          .limit(1);
        if (leader?.staffMemberId !== person.staffMemberId) {
          throw new CampHqRefusal(
            "not-your-group",
            `Only the leader of ${group.name} or an Admin can open this view.`,
          );
        }
      }

      const rows = await db
        .select({ slot: scheduleSlots, activity: activities })
        .from(scheduleSlots)
        .leftJoin(activities, eq(activities.id, scheduleSlots.activityId))
        .where(eq(scheduleSlots.campGroupId, group.id))
        .orderBy(asc(scheduleSlots.weekday), asc(scheduleSlots.startMinute));
      const slots = rows.map(({ slot, activity }) => toSlot(slot, activity));
      const clock = campClock(now);
      const current = slots.find((slot) => isCurrentSlot(slot, clock));
      const { locations } = toCampGroup(group);

      return {
        group: { id: group.id, name: group.name, grades: sortGrades(group.grades) },
        locations,
        today: clock.weekday,
        currentSlotId: current?.id ?? null,
        days: SCHEDULE_WEEKDAYS.map((weekday) => ({
          weekday,
          slots: slots.filter((slot) => slot.weekday === weekday),
        })),
      };
    },

    /**
     * Today's visits to each activity the signed-in person runs as the
     * specialist, activities by name and visits in time order. Empty at
     * weekends; no activities for a person who is not a specialist.
     */
    async getSpecialistDay({ actor, now }: CampHqRequest): Promise<SpecialistDay> {
      const person = await requirePerson(actor);
      const clock = campClock(now);
      const runs = await db
        .select({ id: activities.id, name: activities.name, kind: activities.kind })
        .from(activitySpecialists)
        .innerJoin(activities, eq(activities.id, activitySpecialists.activityId))
        .where(eq(activitySpecialists.staffMemberId, person.staffMemberId));

      const rows =
        clock.weekday === null || runs.length === 0
          ? []
          : await bookedSlots(
              and(
                eq(scheduleSlots.weekday, clock.weekday),
                inArray(
                  scheduleSlots.activityId,
                  runs.map((run) => run.id),
                ),
              ),
            );
      const visited = new Map(byActivity(rows, clock).map((entry) => [entry.activity.id, entry]));
      return {
        today: clock.weekday,
        activities: runs
          .map((activity) => visited.get(activity.id) ?? { activity, visits: [] })
          .sort((a, b) =>
            a.activity.name.localeCompare(b.activity.name, "en", { sensitivity: "base" }),
          ),
      };
    },

    /**
     * Where every Camp group is on one weekday: each booked activity with the
     * groups that come to it in time order, and the groups in a Club day
     * period. Any signed-in person can open it.
     */
    async getActivityBoard({ actor, now }: CampHqRequest, weekday: number): Promise<ActivityBoard> {
      await requireReader(actor);
      const day = cleanWeekday(weekday);
      const clock = campClock(now);
      const rows = await bookedSlots(eq(scheduleSlots.weekday, day));
      return {
        weekday: day,
        today: clock.weekday,
        activities: byActivity(rows, clock),
        clubDay: rows.filter((row) => row.slot.isClubDay).map((row) => toVisit(row, clock)),
      };
    },

    /** Every Camp group's change, free swim, lunch and swim lesson locations, by name. */
    async listGroupLocations({ actor }: CampHqRequest): Promise<GroupLocationsEntry[]> {
      await requireReader(actor);
      const rows = await db
        .select()
        .from(campGroups)
        .orderBy(asc(sql`lower(${campGroups.name})`));
      return rows.map((row) => ({ id: row.id, name: row.name, locations: toCampGroup(row).locations }));
    },
  };
}
