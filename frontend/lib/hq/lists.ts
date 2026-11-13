// Camp HQ's own lists: Camp groups and activities. Part of the Camp HQ
// operations module (see operations.ts); pages never call this file directly.
// Any signed-in person can read the lists; only Admins can change them.
import { and, asc, eq, ne, sql } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import { activities, campGroups } from "./db/schema.ts";
import { isCampHqGrade, sortGrades, type CampHqGrade } from "./grades.ts";
import { CampHqRefusal, type CampHqActor, type CampHqRequest } from "./operations.ts";
import type { CampHqUsageCheck, CampHqUsageChecks } from "./usage.ts";

export const CAMP_HQ_TEAMS = [1, 2, 3, 4] as const;

export type CampGroupLocations = {
  change: string;
  freeSwim: string;
  lunch: string;
  swimLessons: string;
};

export type CampGroup = {
  id: string;
  name: string;
  grades: CampHqGrade[];
  team: number;
  /** True while the Team is sample data that no Admin has changed. */
  teamIsSample: boolean;
  locations: CampGroupLocations;
};

export type CampGroupInput = {
  name: string;
  grades: readonly string[];
  team: number;
  locations?: Partial<CampGroupLocations>;
};

export type ActivityKind = (typeof activities.$inferSelect)["kind"];

export const activityKindLabels: Record<ActivityKind, string> = {
  exclusive: "Exclusive",
  shared: "Shared",
};

export type Activity = {
  id: string;
  name: string;
  grades: CampHqGrade[];
  kind: ActivityKind;
};

export type ActivityInput = {
  name: string;
  grades: readonly string[];
  /** Defaults to exclusive. */
  kind?: string;
};

const NAME_MAX = 80;
const LOCATION_MAX = 200;

type ListDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<unknown>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
  usageChecks: CampHqUsageChecks;
};

function invalid(message: string): never {
  throw new CampHqRefusal("invalid-input", message);
}

function cleanName(value: unknown, what: string) {
  const name = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!name) invalid(`Give the ${what} a name.`);
  if (name.length > NAME_MAX) invalid(`Keep the name to ${NAME_MAX} characters.`);
  return name;
}

function cleanGrades(values: readonly unknown[] | undefined, what: string) {
  const grades = values ?? [];
  const unknown = grades.find((grade) => !isCampHqGrade(grade));
  if (unknown !== undefined) invalid(`"${String(unknown)}" is not a Camp HQ grade.`);
  const sorted = sortGrades(grades as CampHqGrade[]);
  if (sorted.length === 0) invalid(`Choose at least one grade for the ${what}.`);
  return sorted;
}

function cleanTeam(value: unknown) {
  if (!CAMP_HQ_TEAMS.includes(value as (typeof CAMP_HQ_TEAMS)[number])) {
    invalid("Choose Team 1, 2, 3 or 4.");
  }
  return value as number;
}

function cleanLocation(value: unknown) {
  const location = typeof value === "string" ? value.trim() : "";
  if (location.length > LOCATION_MAX) invalid(`Keep each location to ${LOCATION_MAX} characters.`);
  return location;
}

function cleanKind(value: unknown): ActivityKind {
  if (value === undefined) return "exclusive";
  if (value === "exclusive" || value === "shared") return value;
  invalid("An activity is either exclusive or shared.");
}

/** The Postgres error code of a failed query, looking through wrappers. */
function postgresErrorCode(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

function toCampGroup(row: typeof campGroups.$inferSelect): CampGroup {
  return {
    id: row.id,
    name: row.name,
    grades: sortGrades(row.grades),
    team: row.team,
    teamIsSample: row.teamIsSample,
    locations: {
      change: row.changeLocation,
      freeSwim: row.freeSwimLocation,
      lunch: row.lunchLocation,
      swimLessons: row.swimLessonsLocation,
    },
  };
}

function toActivity(row: typeof activities.$inferSelect): Activity {
  return { id: row.id, name: row.name, grades: sortGrades(row.grades), kind: row.kind };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createListOperations({ db, requirePerson, requireAdmin, usageChecks }: ListDeps) {
  /** Any signed-in person with a staff record, or a trusted command. */
  async function requireReader(actor: CampHqActor) {
    if (actor.type === "command-line") return;
    await requirePerson(actor);
  }

  function notFound(what: string): never {
    throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
  }

  async function findGroupRow(id: string) {
    if (!UUID.test(id)) return undefined;
    const [row] = await db.select().from(campGroups).where(eq(campGroups.id, id)).limit(1);
    return row;
  }

  async function findActivityRow(id: string) {
    if (!UUID.test(id)) return undefined;
    const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    return row;
  }

  async function refuseTakenName(
    table: typeof campGroups | typeof activities,
    name: string,
    what: string,
    exceptId?: string,
  ) {
    const sameName = eq(sql`lower(${table.name})`, name.toLowerCase());
    const [taken] = await db
      .select({ id: table.id })
      .from(table)
      .where(exceptId ? and(sameName, ne(table.id, exceptId)) : sameName)
      .limit(1);
    if (taken) throw new CampHqRefusal("name-taken", `There is already ${what} called ${name}.`);
  }

  /** Runs a write; a duplicate name that slipped past the check is refused too. */
  async function writeNamed<T>(name: string, what: string, write: () => Promise<T>) {
    try {
      return await write();
    } catch (error) {
      if (postgresErrorCode(error) === UNIQUE_VIOLATION) {
        throw new CampHqRefusal("name-taken", `There is already ${what} called ${name}.`);
      }
      throw error;
    }
  }

  /** Removes a record after checking every place it may be used. */
  async function removeUnlessUsed(
    checks: CampHqUsageCheck[],
    id: string,
    name: string,
    remove: (tx: CampHqDb) => Promise<unknown>,
  ) {
    try {
      await db.transaction(async (tx) => {
        const usedIn = (
          await Promise.all(checks.map((check) => check(tx as unknown as CampHqDb, id)))
        ).flat();
        if (usedIn.length > 0) {
          throw new CampHqRefusal(
            "in-use",
            `${name} is still used, so it was not removed. Change these first.`,
            usedIn,
          );
        }
        await remove(tx as unknown as CampHqDb);
      });
    } catch (error) {
      if (postgresErrorCode(error) === FOREIGN_KEY_VIOLATION) {
        throw new CampHqRefusal(
          "in-use",
          `${name} is still used elsewhere in Camp HQ, so it was not removed.`,
        );
      }
      throw error;
    }
  }

  return {
    /** Every Camp group, by name. */
    async listCampGroups({ actor }: CampHqRequest): Promise<CampGroup[]> {
      await requireReader(actor);
      const rows = await db.select().from(campGroups).orderBy(asc(sql`lower(${campGroups.name})`));
      return rows.map(toCampGroup);
    },

    async getCampGroup({ actor }: CampHqRequest, id: string): Promise<CampGroup> {
      await requireReader(actor);
      const row = await findGroupRow(id);
      if (!row) notFound("Camp group");
      return toCampGroup(row);
    },

    async addCampGroup({ actor, now }: CampHqRequest, input: CampGroupInput): Promise<CampGroup> {
      await requireAdmin(actor);
      const name = cleanName(input.name, "Camp group");
      const values = {
        name,
        grades: cleanGrades(input.grades, "Camp group"),
        team: cleanTeam(input.team),
        teamIsSample: false,
        changeLocation: cleanLocation(input.locations?.change),
        freeSwimLocation: cleanLocation(input.locations?.freeSwim),
        lunchLocation: cleanLocation(input.locations?.lunch),
        swimLessonsLocation: cleanLocation(input.locations?.swimLessons),
      };
      await refuseTakenName(campGroups, name, "a Camp group");
      const [row] = await writeNamed(name, "a Camp group", () =>
        db
          .insert(campGroups)
          .values({ ...values, createdAt: now, updatedAt: now })
          .returning(),
      );
      return toCampGroup(row);
    },

    /**
     * Renames a Camp group and sets its grades, Team and locations. A sample
     * Team stops being sample once an Admin changes it.
     */
    async updateCampGroup(
      { actor, now }: CampHqRequest,
      id: string,
      input: CampGroupInput,
    ): Promise<CampGroup> {
      await requireAdmin(actor);
      const existing = await findGroupRow(id);
      if (!existing) notFound("Camp group");
      const name = cleanName(input.name, "Camp group");
      const team = cleanTeam(input.team);
      const values = {
        name,
        grades: cleanGrades(input.grades, "Camp group"),
        team,
        teamIsSample: existing.teamIsSample && team === existing.team,
        changeLocation: cleanLocation(input.locations?.change),
        freeSwimLocation: cleanLocation(input.locations?.freeSwim),
        lunchLocation: cleanLocation(input.locations?.lunch),
        swimLessonsLocation: cleanLocation(input.locations?.swimLessons),
      };
      await refuseTakenName(campGroups, name, "a Camp group", id);
      const [row] = await writeNamed(name, "a Camp group", () =>
        db
          .update(campGroups)
          .set({ ...values, updatedAt: now })
          .where(eq(campGroups.id, id))
          .returning(),
      );
      if (!row) notFound("Camp group");
      return toCampGroup(row);
    },

    /** Removes a Camp group, or refuses with the places it is still used. */
    async removeCampGroup({ actor }: CampHqRequest, id: string): Promise<void> {
      await requireAdmin(actor);
      const existing = await findGroupRow(id);
      if (!existing) notFound("Camp group");
      await removeUnlessUsed(usageChecks.campGroup, id, existing.name, (tx) =>
        tx.delete(campGroups).where(eq(campGroups.id, id)),
      );
    },

    /** Every activity, by name. */
    async listActivities({ actor }: CampHqRequest): Promise<Activity[]> {
      await requireReader(actor);
      const rows = await db.select().from(activities).orderBy(asc(sql`lower(${activities.name})`));
      return rows.map(toActivity);
    },

    async getActivity({ actor }: CampHqRequest, id: string): Promise<Activity> {
      await requireReader(actor);
      const row = await findActivityRow(id);
      if (!row) notFound("activity");
      return toActivity(row);
    },

    /** Adds an activity. It is exclusive unless marked shared. */
    async addActivity({ actor, now }: CampHqRequest, input: ActivityInput): Promise<Activity> {
      await requireAdmin(actor);
      const name = cleanName(input.name, "activity");
      const values = {
        name,
        grades: cleanGrades(input.grades, "activity"),
        kind: cleanKind(input.kind),
      };
      await refuseTakenName(activities, name, "an activity");
      const [row] = await writeNamed(name, "an activity", () =>
        db
          .insert(activities)
          .values({ ...values, createdAt: now, updatedAt: now })
          .returning(),
      );
      return toActivity(row);
    },

    /** Renames an activity and sets its grades and whether it is exclusive or shared. */
    async updateActivity(
      { actor, now }: CampHqRequest,
      id: string,
      input: ActivityInput,
    ): Promise<Activity> {
      await requireAdmin(actor);
      const existing = await findActivityRow(id);
      if (!existing) notFound("activity");
      const name = cleanName(input.name, "activity");
      const values = {
        name,
        grades: cleanGrades(input.grades, "activity"),
        kind: input.kind === undefined ? existing.kind : cleanKind(input.kind),
      };
      await refuseTakenName(activities, name, "an activity", id);
      const [row] = await writeNamed(name, "an activity", () =>
        db
          .update(activities)
          .set({ ...values, updatedAt: now })
          .where(eq(activities.id, id))
          .returning(),
      );
      if (!row) notFound("activity");
      return toActivity(row);
    },

    /** Removes an activity, or refuses with the places it is still used. */
    async removeActivity({ actor }: CampHqRequest, id: string): Promise<void> {
      await requireAdmin(actor);
      const existing = await findActivityRow(id);
      if (!existing) notFound("activity");
      await removeUnlessUsed(usageChecks.activity, id, existing.name, (tx) =>
        tx.delete(activities).where(eq(activities.id, id)),
      );
    },
  };
}
