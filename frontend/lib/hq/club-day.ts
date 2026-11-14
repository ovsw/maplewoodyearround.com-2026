// Club day setup: the options each Team has on each weekday, how many children
// each option takes, and when signups open and lock. Part of the Camp HQ
// operations module (see operations.ts); pages never call this file directly.
//
// Only Admins change options and settings. An option can be any activity,
// including one offered only on Club day. Adding an option is refused when it
// breaks the Club day or specialist rules in clash-rules.ts, including the
// provisional Club day overlap rule.
import { and, asc, eq, sql } from "drizzle-orm";

import {
  loadActivityUses,
  loadClubDayPeriods,
  loadSpecialists,
  lockClashRules,
  optionUse,
  refuseUseClashes,
} from "./clash-rules.ts";
import type { CampHqDb } from "./db/database.ts";
import { activities, clubDayOptions, clubDaySettings } from "./db/schema.ts";
import { CAMP_HQ_TEAMS, type Activity } from "./lists.ts";
import { CampHqRefusal, type CampHqActor, type CampHqRequest } from "./operations.ts";
import {
  formatSlotTime,
  isScheduleWeekday,
  parseSlotTime,
  weekdayLabels,
  type ScheduleWeekday,
} from "./schedule-times.ts";
import { sortGrades } from "./grades.ts";

/** Signups open at 9:30 and lock at 11:00, camp local time, until an Admin changes them. */
export const DEFAULT_SIGNUP_OPEN = 9 * 60 + 30;
export const DEFAULT_SIGNUP_LOCK = 11 * 60;

/** The most children one option can be set to take in a period. */
export const MAX_OPTION_CAPACITY = 500;

export type ClubDaySettings = {
  /** Minutes after midnight, camp local time. */
  signupOpen: number;
  signupLock: number;
};

export type ClubDayOption = {
  id: string;
  team: number;
  weekday: ScheduleWeekday;
  activity: Pick<Activity, "id" | "name" | "kind" | "clubOnly">;
  /** The most children the option takes in one Club day period. */
  maxPerPeriod: number;
  /** The most children from one Camp group per period; null means no limit. */
  maxPerGroup: number | null;
};

export type ClubDaySetup = {
  settings: ClubDaySettings;
  /** By Team, then weekday, then activity name. */
  options: ClubDayOption[];
  /** Every activity an option can be: regular ones and those offered only on Club day. */
  activities: Activity[];
};

export type ClubDayCapacityInput = {
  maxPerPeriod: number | string;
  /** Empty, null or omitted: no limit per Camp group. */
  maxPerGroup?: number | string | null;
};

export type ClubDayOptionInput = ClubDayCapacityInput & {
  team: number;
  weekday: number;
  activityId: string;
};

export type SignupTimesInput = { open: string; lock: string };

type ClubDayDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<unknown>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new CampHqRefusal("invalid-input", message);
}

function notFound(what: string): never {
  throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
}

function cleanTeam(value: unknown) {
  if (!CAMP_HQ_TEAMS.includes(value as (typeof CAMP_HQ_TEAMS)[number])) {
    invalid("Choose Team 1, 2, 3 or 4.");
  }
  return value as number;
}

function cleanWeekday(value: unknown): ScheduleWeekday {
  if (!isScheduleWeekday(value)) invalid("Choose a weekday, Monday to Friday.");
  return value;
}

function cleanCount(value: unknown, what: string): number {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(text)) invalid(`Enter the ${what} as a whole number.`);
  const count = Number(text);
  if (count < 1 || count > MAX_OPTION_CAPACITY) {
    invalid(`The ${what} must be between 1 and ${MAX_OPTION_CAPACITY}.`);
  }
  return count;
}

function cleanCapacity(input: ClubDayCapacityInput) {
  const maxPerPeriod = cleanCount(input?.maxPerPeriod, "maximum per period");
  const rawPerGroup = input?.maxPerGroup;
  const perGroupOff =
    rawPerGroup === undefined ||
    rawPerGroup === null ||
    (typeof rawPerGroup === "string" && rawPerGroup.trim() === "");
  const maxPerGroup = perGroupOff ? null : cleanCount(rawPerGroup, "maximum per Camp group");
  if (maxPerGroup !== null && maxPerGroup > maxPerPeriod) {
    invalid("The maximum per Camp group cannot be more than the maximum per period.");
  }
  return { maxPerPeriod, maxPerGroup };
}

type OptionRow = typeof clubDayOptions.$inferSelect;
type ActivityRow = typeof activities.$inferSelect;

function toOption(row: OptionRow, activity: ActivityRow): ClubDayOption {
  return {
    id: row.id,
    team: row.team,
    weekday: row.weekday as ScheduleWeekday,
    activity: {
      id: activity.id,
      name: activity.name,
      kind: activity.kind,
      clubOnly: activity.clubOnly,
    },
    maxPerPeriod: row.maxPerPeriod,
    maxPerGroup: row.maxPerGroup,
  };
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    name: row.name,
    grades: sortGrades(row.grades),
    kind: row.kind,
    clubOnly: row.clubOnly,
  };
}

export function createClubDayOperations({ db, requirePerson, requireAdmin }: ClubDayDeps) {
  async function requireReader(actor: CampHqActor) {
    if (actor.type === "command-line") return;
    await requirePerson(actor);
  }

  async function readSettings(tx: CampHqDb): Promise<ClubDaySettings> {
    const [row] = await tx.select().from(clubDaySettings).where(eq(clubDaySettings.id, 1)).limit(1);
    return row
      ? { signupOpen: row.signupOpenMinute, signupLock: row.signupLockMinute }
      : { signupOpen: DEFAULT_SIGNUP_OPEN, signupLock: DEFAULT_SIGNUP_LOCK };
  }

  async function findOption(tx: CampHqDb, id: string) {
    if (typeof id !== "string" || !UUID.test(id)) return undefined;
    const [row] = await tx
      .select({ option: clubDayOptions, activity: activities })
      .from(clubDayOptions)
      .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
      .where(eq(clubDayOptions.id, id))
      .limit(1);
    return row;
  }

  return {
    /** When Club day signups open and lock, camp local time. Anyone signed in. */
    async getClubDaySettings({ actor }: CampHqRequest): Promise<ClubDaySettings> {
      await requireReader(actor);
      return readSettings(db);
    },

    /** Everything an Admin sets up for Club day. Admins only. */
    async getClubDaySetup({ actor }: CampHqRequest): Promise<ClubDaySetup> {
      await requireAdmin(actor);
      const settings = await readSettings(db);
      const optionRows = await db
        .select({ option: clubDayOptions, activity: activities })
        .from(clubDayOptions)
        .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
        .orderBy(
          asc(clubDayOptions.team),
          asc(clubDayOptions.weekday),
          asc(sql`lower(${activities.name})`),
        );
      const activityRows = await db
        .select()
        .from(activities)
        .orderBy(asc(sql`lower(${activities.name})`));
      return {
        settings,
        options: optionRows.map(({ option, activity }) => toOption(option, activity)),
        activities: activityRows.map(toActivity),
      };
    },

    /**
     * Gives a Team an activity as a Club day option on a weekday. Refused when
     * the Team already has it that day, or when it breaks the Club day or
     * specialist rules during one of the Team's Club day periods that weekday.
     */
    async addClubDayOption(
      { actor, now }: CampHqRequest,
      input: ClubDayOptionInput,
    ): Promise<ClubDayOption> {
      await requireAdmin(actor);
      const team = cleanTeam(input?.team);
      const weekday = cleanWeekday(input?.weekday);
      const capacity = cleanCapacity(input);
      const activityId = input?.activityId;
      if (typeof activityId !== "string" || !UUID.test(activityId)) notFound("activity");
      return db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        await lockClashRules(tx);
        const [activity] = await tx
          .select()
          .from(activities)
          .where(eq(activities.id, activityId))
          .limit(1);
        if (!activity) notFound("activity");
        const [existing] = await tx
          .select({ id: clubDayOptions.id })
          .from(clubDayOptions)
          .where(
            and(
              eq(clubDayOptions.team, team),
              eq(clubDayOptions.weekday, weekday),
              eq(clubDayOptions.activityId, activity.id),
            ),
          )
          .limit(1);
        if (existing) {
          throw new CampHqRefusal(
            "option-exists",
            `${activity.name} is already a Club day option for Team ${team} on ${weekdayLabels[weekday]}.`,
          );
        }
        const periods = await loadClubDayPeriods(tx, team, weekday);
        const proposed = periods.map((period) =>
          optionUse({ id: "new", team, activity }, period),
        );
        if (proposed.length > 0) {
          refuseUseClashes({
            proposed,
            existing: await loadActivityUses(tx, weekday),
            specialistOf: await loadSpecialists(tx),
          });
        }
        const [row] = await tx
          .insert(clubDayOptions)
          .values({
            team,
            weekday,
            activityId: activity.id,
            ...capacity,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        return toOption(row, activity);
      });
    },

    /** Sets how many children an option takes per period, and per Camp group. */
    async updateClubDayOption(
      { actor, now }: CampHqRequest,
      optionId: string,
      input: ClubDayCapacityInput,
    ): Promise<ClubDayOption> {
      await requireAdmin(actor);
      const capacity = cleanCapacity(input);
      const found = await findOption(db, optionId);
      if (!found) notFound("Club day option");
      const [row] = await db
        .update(clubDayOptions)
        .set({ ...capacity, updatedAt: now })
        .where(eq(clubDayOptions.id, found.option.id))
        .returning();
      if (!row) notFound("Club day option");
      return toOption(row, found.activity);
    },

    /** Removes a Club day option. */
    async removeClubDayOption({ actor }: CampHqRequest, optionId: string): Promise<void> {
      await requireAdmin(actor);
      const found = await findOption(db, optionId);
      if (!found) notFound("Club day option");
      await db.delete(clubDayOptions).where(eq(clubDayOptions.id, found.option.id));
    },

    /** Sets when Club day signups open and lock each day, camp local time. */
    async setClubDaySignupTimes(
      { actor, now }: CampHqRequest,
      input: SignupTimesInput,
    ): Promise<ClubDaySettings> {
      await requireAdmin(actor);
      const open = parseSlotTime(input?.open);
      const lock = parseSlotTime(input?.lock);
      if (open === null) invalid("Give the time signups open.");
      if (lock === null) invalid("Give the time signups lock.");
      if (lock <= open) {
        invalid(
          `Signups must lock after they open. They open at ${formatSlotTime(open)}.`,
        );
      }
      const values = { signupOpenMinute: open, signupLockMinute: lock, updatedAt: now };
      await db
        .insert(clubDaySettings)
        .values({ id: 1, ...values })
        .onConflictDoUpdate({ target: clubDaySettings.id, set: values });
      return { signupOpen: open, signupLock: lock };
    },
  };
}
