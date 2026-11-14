// The front desk lookup: an Admin types part of a child's name and sees where
// the child is right now, for an early pick-up. Part of the Camp HQ operations
// module (see operations.ts); pages never call this file directly.
//
// Rules:
// - Whether a child is expected today, and in which Camp group, comes from
//   expectedCampersOn (campers.ts), the same query as the group lists. Any
//   other child the camper list knows is "not expected today".
// - Where an expected child is comes from their group's Group schedule today
//   at the time passed in (camp local time): the activity of the current slot,
//   or, in a Club day period, the child's Club day pick for that period. A pick
//   counts only while it is one of the group's Team's options today.
// - An activity's location is the group's matching location (change, free
//   swim, lunch, swim lessons) when the activity is one of those; any other
//   activity is its own place.
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { campDate } from "./camp-dates.ts";
import { matchesCamperName } from "./camper-search.ts";
import { expectedCampersOn } from "./campers.ts";
import type { CampHqDb } from "./db/database.ts";
import {
  activities,
  campers,
  campGroups,
  clubDayOptions,
  clubDayPicks,
  scheduleSlots,
} from "./db/schema.ts";
import { toCampGroup, type CampGroupLocations } from "./lists.ts";
import type { CampHqActor, CampHqRequest } from "./operations.ts";
import { campClock, isCurrentSlot } from "./schedule-times.ts";

type NamedRef = { id: string; name: string };

/** Where an expected child is right now. Times in minutes, camp local time. */
export type ChildWhereabouts =
  /** Before the group's first slot, after its last, or at a weekend. */
  | { kind: "outside-hours"; dayStart: number | null; dayEnd: number | null }
  /** Inside the group's day, but no activity is booked right now. */
  | { kind: "nothing-booked" }
  | {
      kind: "activity";
      start: number;
      end: number;
      activity: NamedRef;
      /** The group's location for this activity, when it has one. */
      location: string | null;
    }
  | {
      kind: "club-day";
      start: number;
      end: number;
      period: number;
      /** The child's Club day activity; null when they have no pick. */
      activity: NamedRef | null;
    };

export type ChildLookupResult =
  | { camper: NamedRef; expected: false }
  | {
      camper: NamedRef;
      expected: true;
      campGroup: NamedRef;
      finalWeek: boolean;
      where: ChildWhereabouts;
    };

export type ChildLookup = {
  /** Today's camp-local date. */
  date: string;
  search: string;
  /** Matching children, by name. */
  results: ChildLookupResult[];
  /** True when more children match than are shown. */
  more: boolean;
};

type FrontDeskDeps = {
  db: CampHqDb;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

export const MAX_LOOKUP_RESULTS = 20;
const MAX_SEARCH_LENGTH = 100;

/** The group's location for an activity named like one of its locations. */
export function locationForActivity(name: string, locations: CampGroupLocations): string | null {
  const folded = name.toLowerCase();
  const pick = /free swim/.test(folded)
    ? locations.freeSwim
    : /swim(ming)? lesson/.test(folded)
      ? locations.swimLessons
      : /lunch/.test(folded)
        ? locations.lunch
        : /\bchang(e|ing)\b/.test(folded)
          ? locations.change
          : "";
  return pick.trim() || null;
}

export function createFrontDeskOperations({ db, requireAdmin }: FrontDeskDeps) {
  return {
    /**
     * Finds children by part of their name and says where each one is right
     * now, or that they are not expected today. Admins only.
     */
    async findChild({ actor, now }: CampHqRequest, search: string): Promise<ChildLookup> {
      await requireAdmin(actor);
      const date = campDate(now);
      const text = typeof search === "string" ? search.trim().slice(0, MAX_SEARCH_LENGTH) : "";
      const lookup: ChildLookup = { date, search: text, results: [], more: false };
      if (!text) return lookup;

      const [expected, known] = await Promise.all([
        expectedCampersOn(db, date),
        db
          .select({ id: campers.id, name: campers.name })
          .from(campers)
          .orderBy(asc(sql`lower(${campers.name})`), asc(campers.sourceId)),
      ]);
      const matches = known.filter((camper) => matchesCamperName(camper.name, text));
      lookup.more = matches.length > MAX_LOOKUP_RESULTS;
      const shown = matches.slice(0, MAX_LOOKUP_RESULTS);
      if (shown.length === 0) return lookup;

      const expectedById = new Map(expected.map((camper) => [camper.id, camper]));
      const shownExpected = shown.flatMap((camper) => {
        const found = expectedById.get(camper.id);
        return found ? [found] : [];
      });
      const groupIds = [...new Set(shownExpected.map((camper) => camper.campGroup.id))];
      const clock = campClock(now);

      if (groupIds.length === 0) {
        lookup.results = shown.map((camper) => ({ camper, expected: false }));
        return lookup;
      }

      const [groupRows, slotRows, pickRows] = await Promise.all([
              db.select().from(campGroups).where(inArray(campGroups.id, groupIds)),
              clock.weekday === null
                ? []
                : db
                    .select({ slot: scheduleSlots, activity: { id: activities.id, name: activities.name } })
                    .from(scheduleSlots)
                    .leftJoin(activities, eq(activities.id, scheduleSlots.activityId))
                    .where(
                      and(
                        eq(scheduleSlots.weekday, clock.weekday),
                        inArray(scheduleSlots.campGroupId, groupIds),
                      ),
                    )
                    .orderBy(asc(scheduleSlots.startMinute), asc(scheduleSlots.endMinute)),
              clock.weekday === null
                ? []
                : db
                    .select({
                      camperId: clubDayPicks.camperId,
                      period: clubDayPicks.period,
                      team: clubDayOptions.team,
                      weekday: clubDayOptions.weekday,
                      activity: { id: activities.id, name: activities.name },
                    })
                    .from(clubDayPicks)
                    .innerJoin(clubDayOptions, eq(clubDayOptions.id, clubDayPicks.optionId))
                    .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
                    .where(
                      and(
                        eq(clubDayPicks.date, date),
                        inArray(
                          clubDayPicks.camperId,
                          shownExpected.map((camper) => camper.id),
                        ),
                      ),
                    ),
            ]);
      const groups = new Map(groupRows.map((row) => [row.id, toCampGroup(row)]));

      function whereIs(camperId: string, campGroupId: string): ChildWhereabouts {
        const slots = slotRows.filter(({ slot }) => slot.campGroupId === campGroupId);
        const dayStart = slots.length > 0 ? Math.min(...slots.map(({ slot }) => slot.startMinute)) : null;
        const dayEnd = slots.length > 0 ? Math.max(...slots.map(({ slot }) => slot.endMinute)) : null;
        if (clock.weekday === null || dayStart === null || dayEnd === null) {
          return { kind: "outside-hours", dayStart, dayEnd };
        }
        if (clock.minute < dayStart || clock.minute >= dayEnd) {
          return { kind: "outside-hours", dayStart, dayEnd };
        }
        const current = slots.find(({ slot }) =>
          isCurrentSlot({ weekday: slot.weekday, start: slot.startMinute, end: slot.endMinute }, clock),
        );
        if (!current) return { kind: "nothing-booked" };
        const { slot, activity } = current;
        if (slot.isClubDay) {
          const period =
            slots.filter(({ slot: other }) => other.isClubDay).findIndex(({ slot: other }) => other.id === slot.id) + 1;
          const team = groups.get(campGroupId)?.team;
          const pick = pickRows.find(
            (row) =>
              row.camperId === camperId &&
              row.period === period &&
              row.team === team &&
              row.weekday === clock.weekday,
          );
          return {
            kind: "club-day",
            start: slot.startMinute,
            end: slot.endMinute,
            period,
            activity: pick?.activity ?? null,
          };
        }
        if (!activity) return { kind: "nothing-booked" };
        const locations = groups.get(campGroupId)?.locations;
        return {
          kind: "activity",
          start: slot.startMinute,
          end: slot.endMinute,
          activity,
          location: locations ? locationForActivity(activity.name, locations) : null,
        };
      }

      lookup.results = shown.map((camper): ChildLookupResult => {
        const found = expectedById.get(camper.id);
        if (!found) return { camper, expected: false };
        return {
          camper,
          expected: true,
          campGroup: found.campGroup,
          finalWeek: found.finalWeek,
          where: whereIs(camper.id, found.campGroup.id),
        };
      });
      return lookup;
    },
  };
}
