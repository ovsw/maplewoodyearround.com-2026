// Club day signups: each morning a group leader enters every child's Club day
// pick, one per Club day period of the group that day. Part of the Camp HQ
// operations module (see operations.ts); pages never call this file directly.
//
// Rules:
// - A group's Club day periods on a day are the Club day slots of its Group
//   schedule that weekday, in time order. Period 1 is the first of them. Every
//   group of a Team shares the capacity of period 1, period 2 and so on.
// - The choices are the group's Team's Club day options for the weekday.
// - Capacity is counted per option, per period, per date, over the children
//   expected that day. The optional per-group maximum counts only the children
//   of one Camp group. The check and the save happen in one transaction that
//   locks the option row, so two leaders cannot both take the last place.
// - The signup window is camp local time (America/New_York). Before it opens
//   nobody can enter picks, and picks can be entered only for today. While it
//   is open the leader of the child's Camp group today can enter and change
//   picks. From the lock only Admins can.
// - Every list of children comes from expectedCampersOn (campers.ts).
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";

import { campDate, formatCampDate, isCampDate } from "./camp-dates.ts";
import { expectedCampersOn } from "./campers.ts";
import { readClubDaySettings, type ClubDaySettings } from "./club-day.ts";
import type { CampHqDb } from "./db/database.ts";
import {
  activities,
  camperDays,
  campGroups,
  clubDayOptions,
  clubDayPicks,
  groupLeaders,
  scheduleSlots,
} from "./db/schema.ts";
import {
  CampHqRefusal,
  type CampHqActor,
  type CampHqPerson,
  type CampHqRequest,
} from "./operations.ts";
import { campClock, formatSlotTime, type ScheduleWeekday } from "./schedule-times.ts";

/** Where today is in the signup window. */
export type SignupWindow = "before-open" | "open" | "locked";

/** One Club day period of a Camp group today. Times in minutes, camp local time. */
export type ClubDayPeriod = { period: number; start: number; end: number };

/** How full an option is in one period. */
export type OptionPlaces = {
  period: number;
  /** Children expected today who have the option in this period, from every group. */
  taken: number;
  /** Of those, the children of this Camp group. */
  takenByGroup: number;
  /** Places this group can still take: the option's and the per-group limit, whichever is lower. */
  left: number;
};

export type SignupOption = {
  id: string;
  activity: { id: string; name: string };
  maxPerPeriod: number;
  maxPerGroup: number | null;
  /** One entry per period of the group, in period order. */
  places: OptionPlaces[];
};

export type SignupCamper = {
  id: string;
  name: string;
  finalWeek: boolean;
  /** The option picked for each period, in period order; null for no pick yet. */
  picks: (string | null)[];
};

/** The children of one group in one option and period. */
export type OptionGroupList = {
  period: number;
  option: { id: string; name: string };
  campers: { id: string; name: string }[];
};

/** What a group leader (or an Admin) sees on a Camp group's signup screen. */
export type ClubDaySignups = {
  /** Today's camp-local date. */
  date: string;
  /** Today's weekday, or null at a weekend. */
  weekday: ScheduleWeekday | null;
  campGroup: { id: string; name: string; team: number };
  settings: ClubDaySettings;
  window: SignupWindow;
  /** True when the person can enter or change picks now. */
  canEdit: boolean;
  /** The group's Club day periods today; empty when it has none. */
  periods: ClubDayPeriod[];
  /** The Team's options today, by activity name. */
  options: SignupOption[];
  /** Every child expected in the group today, by name. */
  campers: SignupCamper[];
  /** Children with no pick yet in at least one period, by name. */
  missing: { id: string; name: string; periods: number[] }[];
  /** Who from the group goes to which option, by period then activity name. */
  byOption: OptionGroupList[];
};

/** Expected children with no pick in at least one Club day period, for Admins. */
export type MissingPicks = {
  date: string;
  window: SignupWindow;
  settings: ClubDaySettings;
  /** Groups with at least one child missing a pick, by name. */
  groups: {
    campGroup: { id: string; name: string };
    campers: { id: string; name: string; periods: number[] }[];
  }[];
};

export type ClubDayPickInput = {
  camperId: string;
  /** The camp-local date, "YYYY-MM-DD". Only today is accepted. */
  date: string;
  /** 1 for the group's first Club day period that day. */
  period: number | string;
  /** The Club day option; null or empty clears the pick. */
  optionId: string | null;
};

type SignupDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<CampHqPerson>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(what: string): never {
  throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
}

function invalid(message: string): never {
  throw new CampHqRefusal("invalid-input", message);
}

export function signupWindowAt(settings: ClubDaySettings, minute: number): SignupWindow {
  if (minute < settings.signupOpen) return "before-open";
  if (minute < settings.signupLock) return "open";
  return "locked";
}

function cleanPeriod(value: unknown): number {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d{1,2}$/.test(text) || Number(text) < 1) invalid("Choose a Club day period.");
  return Number(text);
}

/** The group's Club day periods on a weekday, numbered from 1 in time order. */
async function groupPeriods(
  tx: CampHqDb,
  campGroupId: string,
  weekday: ScheduleWeekday | null,
): Promise<ClubDayPeriod[]> {
  if (weekday === null) return [];
  const rows = await tx
    .select({ start: scheduleSlots.startMinute, end: scheduleSlots.endMinute })
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.campGroupId, campGroupId),
        eq(scheduleSlots.weekday, weekday),
        eq(scheduleSlots.isClubDay, true),
      ),
    )
    .orderBy(asc(scheduleSlots.startMinute), asc(scheduleSlots.endMinute));
  return rows.map((row, index) => ({ period: index + 1, start: row.start, end: row.end }));
}

/** Picks of children expected on `date`: only they hold a place. */
function expectedPick(date: string) {
  return and(
    eq(camperDays.camperId, clubDayPicks.camperId),
    eq(camperDays.date, clubDayPicks.date),
    eq(camperDays.expected, true),
    eq(clubDayPicks.date, date),
  );
}

export function createClubDaySignupOperations({ db, requirePerson, requireAdmin }: SignupDeps) {
  /** The person, or null for a trusted command, which acts as an Admin. */
  async function findActor(actor: CampHqActor) {
    if (actor.type === "command-line") return { person: null, isAdmin: true };
    const person = await requirePerson(actor);
    return { person, isAdmin: person.role === "admin" };
  }

  async function leads(tx: CampHqDb, person: CampHqPerson, campGroupId: string) {
    const [row] = await tx
      .select({ id: groupLeaders.campGroupId })
      .from(groupLeaders)
      .where(
        and(
          eq(groupLeaders.campGroupId, campGroupId),
          eq(groupLeaders.staffMemberId, person.staffMemberId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async function findGroup(tx: CampHqDb, campGroupId: unknown) {
    if (typeof campGroupId !== "string" || !UUID.test(campGroupId)) notFound("Camp group");
    const [group] = await tx
      .select({ id: campGroups.id, name: campGroups.name, team: campGroups.team })
      .from(campGroups)
      .where(eq(campGroups.id, campGroupId))
      .limit(1);
    if (!group) notFound("Camp group");
    return group;
  }

  /** Taken places per option and period on `date`, in total and for one group. */
  async function countPlaces(tx: CampHqDb, date: string, optionIds: string[], campGroupId: string) {
    if (optionIds.length === 0) return new Map<string, { taken: number; takenByGroup: number }>();
    const rows = await tx
      .select({
        optionId: clubDayPicks.optionId,
        period: clubDayPicks.period,
        taken: sql<number>`count(*)::int`,
        takenByGroup: sql<number>`count(*) filter (where ${camperDays.campGroupId} = ${campGroupId})::int`,
      })
      .from(clubDayPicks)
      .innerJoin(camperDays, expectedPick(date))
      .where(inArray(clubDayPicks.optionId, optionIds))
      .groupBy(clubDayPicks.optionId, clubDayPicks.period);
    return new Map(
      rows.map((row) => [
        `${row.optionId}:${row.period}`,
        { taken: row.taken, takenByGroup: row.takenByGroup },
      ]),
    );
  }

  return {
    /**
     * A Camp group's Club day signups today: its periods, its Team's options
     * with the places left, every expected child with their picks, who has no
     * pick yet and who goes where. The group's leader and Admins only.
     */
    async getClubDaySignups(
      { actor, now }: CampHqRequest,
      campGroupId: string,
    ): Promise<ClubDaySignups> {
      const { person, isAdmin } = await findActor(actor);
      const group = await findGroup(db, campGroupId);
      if (person && !isAdmin && !(await leads(db, person, group.id))) {
        throw new CampHqRefusal(
          "not-your-group",
          `Only the leader of ${group.name} or an Admin can see its Club day signups.`,
        );
      }

      const date = campDate(now);
      const clock = campClock(now);
      const settings = await readClubDaySettings(db);
      const window = signupWindowAt(settings, clock.minute);
      const periods = await groupPeriods(db, group.id, clock.weekday);

      const optionRows =
        clock.weekday === null || periods.length === 0
          ? []
          : await db
              .select({ option: clubDayOptions, activity: activities })
              .from(clubDayOptions)
              .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
              .where(
                and(eq(clubDayOptions.team, group.team), eq(clubDayOptions.weekday, clock.weekday)),
              )
              .orderBy(asc(sql`lower(${activities.name})`));
      const places = await countPlaces(
        db,
        date,
        optionRows.map(({ option }) => option.id),
        group.id,
      );
      const options: SignupOption[] = optionRows.map(({ option, activity }) => ({
        id: option.id,
        activity: { id: activity.id, name: activity.name },
        maxPerPeriod: option.maxPerPeriod,
        maxPerGroup: option.maxPerGroup,
        places: periods.map(({ period }) => {
          const { taken, takenByGroup } = places.get(`${option.id}:${period}`) ?? {
            taken: 0,
            takenByGroup: 0,
          };
          const leftInOption = option.maxPerPeriod - taken;
          const leftForGroup =
            option.maxPerGroup === null ? leftInOption : option.maxPerGroup - takenByGroup;
          return {
            period,
            taken,
            takenByGroup,
            left: Math.max(0, Math.min(leftInOption, leftForGroup)),
          };
        }),
      }));

      const expected = await expectedCampersOn(db, date, { campGroupId: group.id });
      const pickRows =
        expected.length === 0 || periods.length === 0
          ? []
          : await db
              .select({
                camperId: clubDayPicks.camperId,
                period: clubDayPicks.period,
                optionId: clubDayPicks.optionId,
              })
              .from(clubDayPicks)
              .where(
                and(
                  eq(clubDayPicks.date, date),
                  inArray(
                    clubDayPicks.camperId,
                    expected.map((camper) => camper.id),
                  ),
                ),
              );
      const pickOf = new Map(pickRows.map((row) => [`${row.camperId}:${row.period}`, row.optionId]));
      const optionIds = new Set(options.map((option) => option.id));
      const campers: SignupCamper[] = expected.map((camper) => ({
        id: camper.id,
        name: camper.name,
        finalWeek: camper.finalWeek,
        picks: periods.map(({ period }) => {
          const optionId = pickOf.get(`${camper.id}:${period}`) ?? null;
          return optionId && optionIds.has(optionId) ? optionId : null;
        }),
      }));

      const missing = campers.flatMap((camper) => {
        const missingPeriods = periods
          .filter((_, index) => camper.picks[index] === null)
          .map(({ period }) => period);
        return missingPeriods.length > 0
          ? [{ id: camper.id, name: camper.name, periods: missingPeriods }]
          : [];
      });

      const byOption: OptionGroupList[] = periods.flatMap(({ period }, index) =>
        options.flatMap((option) => {
          const going = campers
            .filter((camper) => camper.picks[index] === option.id)
            .map(({ id, name }) => ({ id, name }));
          return going.length > 0
            ? [{ period, option: { id: option.id, name: option.activity.name }, campers: going }]
            : [];
        }),
      );

      const canEdit =
        periods.length > 0 && (window === "open" || (window === "locked" && isAdmin));

      return {
        date,
        weekday: clock.weekday,
        campGroup: group,
        settings,
        window,
        canEdit,
        periods,
        options,
        campers,
        missing,
        byOption,
      };
    },

    /**
     * Enters, changes or clears one child's pick for one period today. The
     * leader of the child's Camp group today can do it while signups are open;
     * Admins also after the lock. Nobody can before signups open, or for any
     * day but today. Refused when the option is full, or when the group has
     * reached the option's per-group maximum.
     */
    async setClubDayPick({ actor, now }: CampHqRequest, input: ClubDayPickInput): Promise<void> {
      const { person, isAdmin } = await findActor(actor);
      const camperId = input?.camperId;
      if (typeof camperId !== "string" || !UUID.test(camperId)) notFound("child");
      const date = input?.date;
      if (!isCampDate(date)) invalid("Choose a day.");
      const period = cleanPeriod(input?.period);
      const rawOption = input?.optionId;
      const optionId = rawOption === null || rawOption === undefined || rawOption === "" ? null : rawOption;
      if (optionId !== null && (typeof optionId !== "string" || !UUID.test(optionId))) {
        notFound("Club day option");
      }

      const today = campDate(now);
      const clock = campClock(now);
      const settings = await readClubDaySettings(db);
      const openAt = formatSlotTime(settings.signupOpen);
      const lockAt = formatSlotTime(settings.signupLock);
      if (date > today) {
        throw new CampHqRefusal(
          "signups-not-open",
          `Club day signups for ${formatCampDate(date)} open at ${openAt} that day. Picks cannot be entered before then.`,
        );
      }
      if (date < today) {
        throw new CampHqRefusal("not-today", "Club day picks can be entered only for today.");
      }
      const window = signupWindowAt(settings, clock.minute);
      if (window === "before-open") {
        throw new CampHqRefusal(
          "signups-not-open",
          `Club day signups open at ${openAt}. Picks cannot be entered before then.`,
        );
      }
      if (window === "locked" && !isAdmin) {
        throw new CampHqRefusal(
          "signups-locked",
          `Club day signups locked at ${lockAt}. Only an Admin can change a pick now.`,
        );
      }

      await db.transaction(async (transaction) => {
        const tx = transaction as unknown as CampHqDb;
        const [day] = await tx
          .select({ campGroupId: camperDays.campGroupId })
          .from(camperDays)
          .where(
            and(
              eq(camperDays.camperId, camperId),
              eq(camperDays.date, date),
              eq(camperDays.expected, true),
            ),
          )
          .limit(1);
        if (!day) {
          throw new CampHqRefusal("not-expected", "This child is not expected today.");
        }
        const group = await findGroup(tx, day.campGroupId);
        if (person && !isAdmin && !(await leads(tx, person, group.id))) {
          throw new CampHqRefusal(
            "not-your-group",
            `This child is in ${group.name} today. Only its leader or an Admin can enter their pick.`,
          );
        }
        const periods = await groupPeriods(tx, group.id, clock.weekday);
        if (period > periods.length) {
          invalid(
            periods.length === 0
              ? `${group.name} has no Club day period today.`
              : `${group.name} has ${periods.length === 1 ? "one Club day period" : `${periods.length} Club day periods`} today.`,
          );
        }

        const thisPick = and(
          eq(clubDayPicks.camperId, camperId),
          eq(clubDayPicks.date, date),
          eq(clubDayPicks.period, period),
        );
        if (optionId === null) {
          await tx.delete(clubDayPicks).where(thisPick);
          return;
        }

        // Locking the option row makes every pick of it wait its turn, so the
        // count below cannot change before this pick is saved.
        const [found] = await tx
          .select({ option: clubDayOptions, activityName: activities.name })
          .from(clubDayOptions)
          .innerJoin(activities, eq(activities.id, clubDayOptions.activityId))
          .where(eq(clubDayOptions.id, optionId))
          .limit(1)
          .for("update", { of: clubDayOptions });
        if (!found) notFound("Club day option");
        const { option, activityName } = found;
        if (option.team !== group.team || option.weekday !== clock.weekday) {
          invalid(`${activityName} is not one of Team ${group.team}'s Club day options today.`);
        }

        const [current] = await tx
          .select({ optionId: clubDayPicks.optionId })
          .from(clubDayPicks)
          .where(thisPick)
          .limit(1);
        if (current?.optionId === option.id) return;

        const [count] = await tx
          .select({
            taken: sql<number>`count(*)::int`,
            takenByGroup: sql<number>`count(*) filter (where ${camperDays.campGroupId} = ${group.id})::int`,
          })
          .from(clubDayPicks)
          .innerJoin(camperDays, expectedPick(date))
          .where(
            and(
              eq(clubDayPicks.optionId, option.id),
              eq(clubDayPicks.period, period),
              ne(clubDayPicks.camperId, camperId),
            ),
          );
        const taken = count?.taken ?? 0;
        const takenByGroup = count?.takenByGroup ?? 0;
        if (taken >= option.maxPerPeriod) {
          throw new CampHqRefusal(
            "option-full",
            `${activityName} is full in period ${period}: all ${option.maxPerPeriod} places are taken. Choose another option.`,
          );
        }
        if (option.maxPerGroup !== null && takenByGroup >= option.maxPerGroup) {
          throw new CampHqRefusal(
            "group-limit",
            `${activityName} takes at most ${option.maxPerGroup} ${option.maxPerGroup === 1 ? "child" : "children"} from ${group.name} in period ${period}, and that many already have it. Choose another option.`,
          );
        }

        const values = {
          optionId: option.id,
          enteredBy: person?.staffMemberId ?? null,
          updatedAt: now,
        };
        await tx
          .insert(clubDayPicks)
          .values({ camperId, date, period, ...values })
          .onConflictDoUpdate({
            target: [clubDayPicks.camperId, clubDayPicks.date, clubDayPicks.period],
            set: values,
          });
      });
    },

    /** Children expected today with no pick in at least one of their group's periods. Admins only. */
    async getMissingClubDayPicks({ actor, now }: CampHqRequest): Promise<MissingPicks> {
      await requireAdmin(actor);
      const date = campDate(now);
      const clock = campClock(now);
      const settings = await readClubDaySettings(db);
      const window = signupWindowAt(settings, clock.minute);
      const result: MissingPicks = { date, window, settings, groups: [] };
      if (clock.weekday === null) return result;

      const slotRows = await db
        .select({ campGroupId: scheduleSlots.campGroupId, count: sql<number>`count(*)::int` })
        .from(scheduleSlots)
        .where(and(eq(scheduleSlots.weekday, clock.weekday), eq(scheduleSlots.isClubDay, true)))
        .groupBy(scheduleSlots.campGroupId);
      const periodCount = new Map(slotRows.map((row) => [row.campGroupId, row.count]));

      const expected = (await expectedCampersOn(db, date)).filter((camper) =>
        periodCount.has(camper.campGroup.id),
      );
      if (expected.length === 0) return result;

      // A pick counts only when its option is one of the group's Team's options today.
      const pickRows = await db
        .select({ camperId: clubDayPicks.camperId, period: clubDayPicks.period })
        .from(clubDayPicks)
        .innerJoin(camperDays, expectedPick(date))
        .innerJoin(campGroups, eq(campGroups.id, camperDays.campGroupId))
        .innerJoin(
          clubDayOptions,
          and(
            eq(clubDayOptions.id, clubDayPicks.optionId),
            eq(clubDayOptions.team, campGroups.team),
            eq(clubDayOptions.weekday, clock.weekday),
          ),
        );
      const picked = new Set(pickRows.map((row) => `${row.camperId}:${row.period}`));

      const byGroup = new Map<string, MissingPicks["groups"][number]>();
      for (const camper of expected) {
        const count = periodCount.get(camper.campGroup.id) ?? 0;
        const periods = Array.from({ length: count }, (_, index) => index + 1).filter(
          (period) => !picked.has(`${camper.id}:${period}`),
        );
        if (periods.length === 0) continue;
        const entry = byGroup.get(camper.campGroup.id) ?? {
          campGroup: camper.campGroup,
          campers: [],
        };
        entry.campers.push({ id: camper.id, name: camper.name, periods });
        byGroup.set(camper.campGroup.id, entry);
      }
      result.groups = [...byGroup.values()].sort((a, b) =>
        a.campGroup.name.localeCompare(b.campGroup.name, "en", { sensitivity: "base" }),
      );
      return result;
    },
  };
}
