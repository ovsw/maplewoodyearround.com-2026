// Club day rosters: after the lock, who goes to each Club day option in each
// period today, with their Camp group, the children in their final week and
// the Junior staff placed at the activity. Admins print them all; a specialist
// sees the rosters of the activities they run. Part of the Camp HQ operations
// module (see operations.ts); pages never call this file directly.
//
// Rules:
// - A roster is one Club day option in one period today. An option has a
//   roster for every period that at least one Camp group of its Team has
//   today, even when nobody has picked it.
// - The children come from expectedCampersOn (campers.ts), the same query as
//   the group lists. A pick counts only while it is for one of the child's
//   group's Team's options today and for a period the group has today, as on
//   the signup screen.
// - The Junior staff are those whose Club day activity is the option's
//   activity.
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { campDate } from "./camp-dates.ts";
import { expectedCampersOn } from "./campers.ts";
import type { CampHqDb } from "./db/database.ts";
import {
  activities,
  activitySpecialists,
  campGroups,
  clubDayOptions,
  clubDayPicks,
  juniorPlacements,
  scheduleSlots,
  staffMembers,
} from "./db/schema.ts";
import {
  CampHqRefusal,
  type CampHqActor,
  type CampHqPerson,
  type CampHqRequest,
} from "./operations.ts";
import { campClock, type ScheduleWeekday } from "./schedule-times.ts";

type NamedRef = { id: string; name: string };

/** A child on a roster. */
export type RosterCamper = NamedRef & {
  campGroup: NamedRef;
  /** True when this is the last week the child is expected at camp. */
  finalWeek: boolean;
};

/** One Club day option in one period today. */
export type ClubDayRoster = {
  option: { id: string; team: number; maxPerPeriod: number };
  activity: NamedRef;
  /** 1 for the first Club day period of the Team's groups today. */
  period: number;
  /** When the period runs, in minutes camp local time; groups of a Team can differ. */
  times: { start: number; end: number }[];
  /** The specialist who runs the activity, if any. */
  specialist: NamedRef | null;
  /** Junior staff whose Club day activity this is, by name. */
  juniorStaff: NamedRef[];
  /** The children going, by name. */
  campers: RosterCamper[];
};

export type ClubDayRosters = {
  /** Today's camp-local date. */
  date: string;
  /** Today's weekday, or null at a weekend. */
  weekday: ScheduleWeekday | null;
  /** By activity name, then Team, then period. */
  rosters: ClubDayRoster[];
};

/** Picks one roster: an option and a period. */
export type RosterChoice = { optionId: string; period: number | string };

type RosterDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<CampHqPerson>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rosterNotFound(): never {
  throw new CampHqRefusal("not-found", "This Club day roster does not exist today.");
}

function cleanChoice(choice: RosterChoice) {
  const optionId = choice?.optionId;
  const rawPeriod = choice?.period;
  const periodText =
    typeof rawPeriod === "number" ? String(rawPeriod) : typeof rawPeriod === "string" ? rawPeriod.trim() : "";
  if (typeof optionId !== "string" || !UUID.test(optionId) || !/^\d{1,2}$/.test(periodText)) {
    rosterNotFound();
  }
  return { optionId, period: Number(periodText) };
}

/**
 * Today's rosters of the options matching `activityIds` (every option when
 * omitted), or the one roster `only` names.
 */
async function buildRosters(
  db: CampHqDb,
  now: Date,
  { activityIds, only }: { activityIds?: string[]; only?: { optionId: string; period: number } } = {},
): Promise<ClubDayRosters> {
  const date = campDate(now);
  const { weekday } = campClock(now);
  const result: ClubDayRosters = { date, weekday, rosters: [] };
  if (weekday === null || activityIds?.length === 0) return result;

  // Every group's Club day periods today, numbered from 1 in time order.
  const slotRows = await db
    .select({
      campGroupId: scheduleSlots.campGroupId,
      team: campGroups.team,
      start: scheduleSlots.startMinute,
      end: scheduleSlots.endMinute,
    })
    .from(scheduleSlots)
    .innerJoin(campGroups, eq(campGroups.id, scheduleSlots.campGroupId))
    .where(and(eq(scheduleSlots.weekday, weekday), eq(scheduleSlots.isClubDay, true)))
    .orderBy(asc(scheduleSlots.startMinute), asc(scheduleSlots.endMinute));
  const groupPeriods = new Map<string, { team: number; periods: { start: number; end: number }[] }>();
  for (const row of slotRows) {
    const entry = groupPeriods.get(row.campGroupId) ?? { team: row.team, periods: [] };
    entry.periods.push({ start: row.start, end: row.end });
    groupPeriods.set(row.campGroupId, entry);
  }
  /** Period number → the distinct times it runs, per Team. */
  const teamPeriods = new Map<number, Map<number, Map<string, { start: number; end: number }>>>();
  for (const { team, periods } of groupPeriods.values()) {
    const byPeriod = teamPeriods.get(team) ?? new Map();
    periods.forEach((time, index) => {
      const times = byPeriod.get(index + 1) ?? new Map();
      times.set(`${time.start}-${time.end}`, time);
      byPeriod.set(index + 1, times);
    });
    teamPeriods.set(team, byPeriod);
  }

  const optionRows = await db
    .select({ option: clubDayOptions, activity: { id: activities.id, name: activities.name } })
    .from(clubDayOptions)
    .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
    .where(
      and(
        eq(clubDayOptions.weekday, weekday),
        activityIds ? inArray(clubDayOptions.activityId, activityIds) : undefined,
        only ? eq(clubDayOptions.id, only.optionId) : undefined,
      ),
    )
    .orderBy(asc(sql`lower(${activities.name})`), asc(clubDayOptions.team));

  const rosterKey = (optionId: string, period: number) => `${optionId}:${period}`;
  const rosters = new Map<string, ClubDayRoster>();
  for (const { option, activity } of optionRows) {
    const byPeriod = teamPeriods.get(option.team) ?? new Map();
    for (const [period, times] of [...byPeriod.entries()].sort(([a], [b]) => a - b)) {
      if (only && only.period !== period) continue;
      rosters.set(rosterKey(option.id, period), {
        option: { id: option.id, team: option.team, maxPerPeriod: option.maxPerPeriod },
        activity,
        period,
        times: [...times.values()].sort((a, b) => a.start - b.start || a.end - b.end),
        specialist: null,
        juniorStaff: [],
        campers: [],
      });
    }
  }
  if (only && rosters.size === 0) rosterNotFound();
  if (rosters.size === 0) return result;

  const rosterActivityIds = [...new Set(optionRows.map(({ activity }) => activity.id))];
  const optionTeam = new Map(optionRows.map(({ option }) => [option.id, option.team]));

  const [expected, pickRows, specialistRows, juniorRows] = await Promise.all([
    expectedCampersOn(db, date),
    db
      .select({
        camperId: clubDayPicks.camperId,
        period: clubDayPicks.period,
        optionId: clubDayPicks.optionId,
      })
      .from(clubDayPicks)
      .where(
        and(eq(clubDayPicks.date, date), inArray(clubDayPicks.optionId, [...optionTeam.keys()])),
      ),
    db
      .select({
        activityId: activitySpecialists.activityId,
        id: staffMembers.id,
        name: staffMembers.name,
      })
      .from(activitySpecialists)
      .innerJoin(staffMembers, eq(staffMembers.id, activitySpecialists.staffMemberId))
      .where(inArray(activitySpecialists.activityId, rosterActivityIds)),
    db
      .select({
        activityId: juniorPlacements.clubDayActivityId,
        id: staffMembers.id,
        name: staffMembers.name,
      })
      .from(juniorPlacements)
      .innerJoin(staffMembers, eq(staffMembers.id, juniorPlacements.staffMemberId))
      .where(inArray(juniorPlacements.clubDayActivityId, rosterActivityIds))
      .orderBy(asc(sql`lower(${staffMembers.name})`), asc(staffMembers.id)),
  ]);

  const specialistOf = new Map(
    specialistRows.map((row) => [row.activityId, { id: row.id, name: row.name }]),
  );
  for (const roster of rosters.values()) {
    roster.specialist = specialistOf.get(roster.activity.id) ?? null;
    roster.juniorStaff = juniorRows
      .filter((row) => row.activityId === roster.activity.id)
      .map(({ id, name }) => ({ id, name }));
  }

  const picksOf = new Map<string, { period: number; optionId: string }[]>();
  for (const row of pickRows) {
    const list = picksOf.get(row.camperId) ?? [];
    list.push(row);
    picksOf.set(row.camperId, list);
  }
  // expectedCampersOn is sorted by name, so every roster is too.
  for (const camper of expected) {
    const group = groupPeriods.get(camper.campGroup.id);
    if (!group) continue;
    for (const pick of picksOf.get(camper.id) ?? []) {
      if (optionTeam.get(pick.optionId) !== group.team) continue;
      if (pick.period > group.periods.length) continue;
      rosters.get(rosterKey(pick.optionId, pick.period))?.campers.push({
        id: camper.id,
        name: camper.name,
        campGroup: camper.campGroup,
        finalWeek: camper.finalWeek,
      });
    }
  }

  result.rosters = [...rosters.values()];
  return result;
}

export function createClubDayRosterOperations({ db, requirePerson, requireAdmin }: RosterDeps) {
  return {
    /**
     * Today's Club day rosters, one per option and period, ready to print; or
     * only the roster `only` names. Admins only.
     */
    async getClubDayRosters(
      { actor, now }: CampHqRequest,
      only?: RosterChoice,
    ): Promise<ClubDayRosters> {
      await requireAdmin(actor);
      return buildRosters(db, now, { only: only === undefined ? undefined : cleanChoice(only) });
    },

    /** Today's rosters of the Club day options whose activity the signed-in person runs. */
    async getMyClubDayRosters({ actor, now }: CampHqRequest): Promise<ClubDayRosters> {
      const person = await requirePerson(actor);
      const runs = await db
        .select({ activityId: activitySpecialists.activityId })
        .from(activitySpecialists)
        .where(eq(activitySpecialists.staffMemberId, person.staffMemberId));
      return buildRosters(db, now, { activityIds: runs.map((row) => row.activityId) });
    },
  };
}
