// Campers: who is expected at camp, in which Camp group, on each day. Part of
// the Camp HQ operations module (see operations.ts); pages never call this
// file directly.
//
// - Campers come only from CampMinder through one "load campers" operation,
//   which takes a normalised list of camper days. Adapters (today the CSV
//   upload in camper-csv.ts) turn a source into that list. There is no way to
//   edit campers by hand: CampMinder is where attendance is corrected.
// - A load replaces the camper list: campers missing from it are removed.
//   Loading the same list twice changes nothing the second time. Every load is
//   recorded with its source, time, counts and errors.
// - A row naming a Camp group Camp HQ does not know is an error; Camp HQ never
//   guesses a group. A camper with any row that cannot be used is left exactly
//   as it was, and when a row cannot even be matched to a camper (or nothing
//   could be read) nobody is removed.
// - A camper's Camp group is held per day, so a child who changes group
//   mid-week is in the right group on each day.
// - One "expected today" query (expectedCampersOn) is the only source for
//   lists of children.
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { campDate, isCampDate, weekEnd } from "./camp-dates.ts";
import type { CampHqDb } from "./db/database.ts";
import {
  camperDays,
  camperLoads,
  campers,
  campGroups,
  groupLeaders,
  staffMembers,
  type CamperLoadErrorRecord,
} from "./db/schema.ts";
import {
  CampHqRefusal,
  type CampHqActor,
  type CampHqPerson,
  type CampHqRequest,
} from "./operations.ts";

/** One day of one camper, as an adapter reads it from its source. */
export type CamperLoadRow = {
  /** The row in the source file, counting the header as row 1, when there is one. */
  row?: number;
  /** The camper's id in CampMinder. */
  camperId: string;
  name: string;
  /** The camp-local date, "YYYY-MM-DD". */
  date: string;
  /** The Camp group's name, as Camp HQ knows it. */
  campGroup: string;
  expected: boolean;
};

/** A row that could not be used, and why. */
export type CamperLoadError = CamperLoadErrorRecord;

export type CamperLoadInput = {
  /** Where the list came from, e.g. "File upload: campers.csv". */
  source: string;
  rows: CamperLoadRow[];
  /** Rows the adapter could not read. */
  errors?: CamperLoadError[];
};

/** The record of one load: what it changed and what it could not use. */
export type CamperLoadReport = {
  id: string;
  source: string;
  loadedAt: Date;
  /** The name of the Admin who loaded it; null for a command. */
  loadedBy: string | null;
  /** Rows the adapter could read. */
  rowCount: number;
  added: number;
  changed: number;
  removed: number;
  unchanged: number;
  /** True when campers missing from the list were kept because some rows could not be read. */
  removalsSkipped: boolean;
  errors: CamperLoadError[];
  /** How many campers were left as they were because some of their rows could not be used. */
  campersKept: number;
};

/** A child expected on a given day. */
export type ExpectedCamper = {
  id: string;
  name: string;
  campGroup: { id: string; name: string };
  /** True when this is the last week the child is expected at camp. */
  finalWeek: boolean;
};

/** The children expected in one Camp group today. */
export type GroupCamperList = {
  /** Today's camp-local date. */
  date: string;
  campGroup: { id: string; name: string };
  campers: ExpectedCamper[];
  /** When the camper list was last loaded; null before the first load. */
  lastLoadedAt: Date | null;
};

type CamperDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<CampHqPerson>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CAMPER_ID_LENGTH = 100;
const MAX_NAME_LENGTH = 200;
const MAX_SOURCE_LENGTH = 200;
const INSERT_CHUNK = 500;

type DayValue = { campGroupId: string; expected: boolean };
type FileCamper = { name: string; nameRow: number | null; days: Map<string, DayValue & { row: number | null }> };

function chunks<T>(items: T[], size = INSERT_CHUNK): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

function rowLabel(row: number | null) {
  return row === null ? "another row" : `row ${row}`;
}

function sortErrors(errors: CamperLoadError[]) {
  return [...errors].sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
}

function campersKept(errors: CamperLoadError[]) {
  return new Set(errors.flatMap((error) => (error.camperId ? [error.camperId] : []))).size;
}

/**
 * The children expected on `date`, by name, optionally in one Camp group. The
 * only query that lists children: group lists, signups, rosters and the front
 * desk lookup all use it.
 */
export async function expectedCampersOn(
  db: CampHqDb,
  date: string,
  { campGroupId }: { campGroupId?: string } = {},
): Promise<ExpectedCamper[]> {
  const lastExpected = db
    .select({
      camperId: camperDays.camperId,
      lastDate: sql<string>`max(${camperDays.date})::text`.as("last_date"),
    })
    .from(camperDays)
    .where(eq(camperDays.expected, true))
    .groupBy(camperDays.camperId)
    .as("last_expected");

  const rows = await db
    .select({
      id: campers.id,
      name: campers.name,
      campGroupId: campGroups.id,
      campGroupName: campGroups.name,
      lastDate: lastExpected.lastDate,
    })
    .from(camperDays)
    .innerJoin(campers, eq(campers.id, camperDays.camperId))
    .innerJoin(campGroups, eq(campGroups.id, camperDays.campGroupId))
    .innerJoin(lastExpected, eq(lastExpected.camperId, camperDays.camperId))
    .where(
      and(
        eq(camperDays.date, date),
        eq(camperDays.expected, true),
        campGroupId ? eq(camperDays.campGroupId, campGroupId) : undefined,
      ),
    )
    .orderBy(asc(sql`lower(${campers.name})`), asc(campers.sourceId));

  const lastDayOfWeek = weekEnd(date);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    campGroup: { id: row.campGroupId, name: row.campGroupName },
    finalWeek: row.lastDate <= lastDayOfWeek,
  }));
}

export function createCamperOperations({ db, requirePerson, requireAdmin }: CamperDeps) {
  async function lastLoadedAt(): Promise<Date | null> {
    const [row] = await db
      .select({ loadedAt: camperLoads.loadedAt })
      .from(camperLoads)
      .orderBy(desc(camperLoads.loadedAt))
      .limit(1);
    return row?.loadedAt ?? null;
  }

  return {
    /**
     * Loads the camper list from a normalised list of camper days, replacing
     * the one held now, and records the load. Admins only. Returns the report:
     * campers added, changed and removed, and the rows that could not be used.
     */
    async loadCampers(
      { actor, now }: CampHqRequest,
      input: CamperLoadInput,
    ): Promise<CamperLoadReport> {
      await requireAdmin(actor);
      const loadedBy = actor.type === "account" ? await requirePerson(actor) : null;
      const source =
        String(input?.source ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_SOURCE_LENGTH) ||
        "Unnamed source";
      const inputRows = Array.isArray(input?.rows) ? input.rows : [];
      const errors: CamperLoadError[] = (input?.errors ?? []).map((error) => ({
        row: error.row ?? null,
        camperId: error.camperId?.trim() || null,
        reason: String(error.reason),
      }));

      return db.transaction(async (tx) => {
        // Two loads at once run one after the other.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext('camp-hq-camper-load'))`);

        const groups = await tx.select({ id: campGroups.id, name: campGroups.name }).from(campGroups);
        const groupByName = new Map(groups.map((group) => [group.name.trim().toLowerCase(), group.id]));

        // Read the list into one entry per camper, refusing rows Camp HQ cannot use.
        const inFile = new Map<string, FileCamper>();
        for (const input of inputRows) {
          const row = typeof input?.row === "number" ? input.row : null;
          const camperId = String(input?.camperId ?? "").trim();
          const refuse = (reason: string) =>
            errors.push({ row, camperId: camperId || null, reason });
          if (!camperId) {
            refuse("The camper id is missing.");
            continue;
          }
          if (camperId.length > MAX_CAMPER_ID_LENGTH) {
            errors.push({
              row,
              camperId: null,
              reason: `The camper id is longer than ${MAX_CAMPER_ID_LENGTH} characters.`,
            });
            continue;
          }
          const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
          if (!name) {
            refuse("The camper's name is missing.");
            continue;
          }
          if (name.length > MAX_NAME_LENGTH) {
            refuse(`The camper's name is longer than ${MAX_NAME_LENGTH} characters.`);
            continue;
          }
          if (!isCampDate(input.date)) {
            refuse(`"${String(input.date ?? "")}" is not a date. Dates are written YYYY-MM-DD.`);
            continue;
          }
          if (typeof input.expected !== "boolean") {
            refuse("It does not say whether the camper is expected.");
            continue;
          }
          const groupName = String(input.campGroup ?? "").trim();
          if (!groupName) {
            refuse("The Camp group is missing.");
            continue;
          }
          const campGroupId = groupByName.get(groupName.toLowerCase());
          if (!campGroupId) {
            refuse(
              `Camp HQ has no Camp group named "${groupName}". Correct the file, or add the group in Camp groups, then load again.`,
            );
            continue;
          }

          const camper = inFile.get(camperId) ?? { name, nameRow: row, days: new Map() };
          inFile.set(camperId, camper);
          if (camper.name !== name) {
            refuse(`This row names the camper "${name}"; ${rowLabel(camper.nameRow)} names them "${camper.name}".`);
            continue;
          }
          const day = camper.days.get(input.date);
          if (day) {
            if (day.campGroupId !== campGroupId || day.expected !== input.expected) {
              refuse(`The camper has two different rows for ${input.date}; the other is ${rowLabel(day.row)}.`);
            }
            continue;
          }
          camper.days.set(input.date, { campGroupId, expected: input.expected, row });
        }

        // A camper with any row Camp HQ could not use is left as it was.
        const kept = new Set(errors.flatMap((error) => (error.camperId ? [error.camperId] : [])));
        // A row that names no camper could belong to anyone, so nobody is
        // removed and nobody loses a day the file leaves out.
        const unmatchedRows = errors.some((error) => error.camperId === null);
        const removalsSkipped =
          unmatchedRows || ![...inFile.keys()].some((sourceId) => !kept.has(sourceId));

        const existing = await tx.select().from(campers);
        const existingBySource = new Map(existing.map((row) => [row.sourceId, row]));
        const existingDays = await tx.select().from(camperDays);
        const daysByCamper = new Map<string, Map<string, DayValue>>();
        for (const day of existingDays) {
          const days = daysByCamper.get(day.camperId) ?? new Map<string, DayValue>();
          days.set(day.date, { campGroupId: day.campGroupId, expected: day.expected });
          daysByCamper.set(day.camperId, days);
        }

        let added = 0;
        let changed = 0;
        let unchanged = 0;
        const replaceDaysOf: string[] = [];
        const newDays: (typeof camperDays.$inferInsert)[] = [];

        for (const [sourceId, camper] of inFile) {
          if (kept.has(sourceId)) continue;
          const current = existingBySource.get(sourceId);
          let camperUuid: string;
          if (!current) {
            const [created] = await tx
              .insert(campers)
              .values({ sourceId, name: camper.name, createdAt: now, updatedAt: now })
              .returning({ id: campers.id });
            camperUuid = created.id;
            added += 1;
          } else {
            camperUuid = current.id;
            const currentDays = daysByCamper.get(current.id) ?? new Map<string, DayValue>();
            if (unmatchedRows) {
              // Keep the days the file leaves out; the file's own days win.
              for (const [date, day] of currentDays) {
                if (!camper.days.has(date)) camper.days.set(date, { ...day, row: null });
              }
            }
            const sameDays =
              currentDays.size === camper.days.size &&
              [...camper.days].every(([date, day]) => {
                const held = currentDays.get(date);
                return held?.campGroupId === day.campGroupId && held.expected === day.expected;
              });
            if (current.name === camper.name && sameDays) {
              unchanged += 1;
              continue;
            }
            changed += 1;
            if (current.name !== camper.name) {
              await tx
                .update(campers)
                .set({ name: camper.name, updatedAt: now })
                .where(eq(campers.id, current.id));
            }
            if (sameDays) continue;
            replaceDaysOf.push(current.id);
          }
          for (const [date, day] of camper.days) {
            newDays.push({
              camperId: camperUuid,
              date,
              campGroupId: day.campGroupId,
              expected: day.expected,
            });
          }
        }

        for (const ids of chunks(replaceDaysOf)) {
          await tx.delete(camperDays).where(inArray(camperDays.camperId, ids));
        }
        for (const values of chunks(newDays)) {
          await tx.insert(camperDays).values(values);
        }

        let removed = 0;
        if (!removalsSkipped) {
          const gone = existing
            .filter((row) => !inFile.has(row.sourceId) && !kept.has(row.sourceId))
            .map((row) => row.id);
          for (const ids of chunks(gone)) {
            await tx.delete(campers).where(inArray(campers.id, ids));
          }
          removed = gone.length;
        }

        const sorted = sortErrors(errors);
        const [load] = await tx
          .insert(camperLoads)
          .values({
            source,
            loadedAt: now,
            loadedBy: loadedBy?.staffMemberId ?? null,
            rowCount: inputRows.length,
            added,
            changed,
            removed,
            unchanged,
            removalsSkipped,
            errors: sorted,
          })
          .returning({ id: camperLoads.id });

        return {
          id: load.id,
          source,
          loadedAt: now,
          loadedBy: loadedBy?.name ?? null,
          rowCount: inputRows.length,
          added,
          changed,
          removed,
          unchanged,
          removalsSkipped,
          errors: sorted,
          campersKept: campersKept(sorted),
        };
      });
    },

    /** The most recent loads, newest first. Admins only. */
    async listCamperLoads(
      { actor }: CampHqRequest,
      { limit = 10 }: { limit?: number } = {},
    ): Promise<CamperLoadReport[]> {
      await requireAdmin(actor);
      const rows = await db
        .select({ load: camperLoads, loadedBy: staffMembers.name })
        .from(camperLoads)
        .leftJoin(staffMembers, eq(staffMembers.id, camperLoads.loadedBy))
        .orderBy(desc(camperLoads.loadedAt), desc(camperLoads.id))
        .limit(Math.max(1, Math.min(limit, 100)));
      return rows.map(({ load, loadedBy }) => ({
        id: load.id,
        source: load.source,
        loadedAt: load.loadedAt,
        loadedBy,
        rowCount: load.rowCount,
        added: load.added,
        changed: load.changed,
        removed: load.removed,
        unchanged: load.unchanged,
        removalsSkipped: load.removalsSkipped,
        errors: load.errors,
        campersKept: campersKept(load.errors),
      }));
    },

    /**
     * The children expected in a Camp group today, with the time of the last
     * load. For the group's leader and for Admins.
     */
    async getGroupCamperList(
      { actor, now }: CampHqRequest,
      campGroupId: string,
    ): Promise<GroupCamperList> {
      const person = actor.type === "account" ? await requirePerson(actor) : null;
      if (typeof campGroupId !== "string" || !UUID.test(campGroupId)) {
        throw new CampHqRefusal("not-found", "This Camp group no longer exists.");
      }
      const [group] = await db
        .select({ id: campGroups.id, name: campGroups.name })
        .from(campGroups)
        .where(eq(campGroups.id, campGroupId))
        .limit(1);
      if (!group) throw new CampHqRefusal("not-found", "This Camp group no longer exists.");
      if (person && person.role !== "admin") {
        const [leads] = await db
          .select({ id: groupLeaders.campGroupId })
          .from(groupLeaders)
          .where(
            and(
              eq(groupLeaders.campGroupId, group.id),
              eq(groupLeaders.staffMemberId, person.staffMemberId),
            ),
          )
          .limit(1);
        if (!leads) {
          throw new CampHqRefusal(
            "not-your-group",
            `Only the leader of ${group.name} or an Admin can see its campers.`,
          );
        }
      }
      const date = campDate(now);
      const [list, loadedAt] = await Promise.all([
        expectedCampersOn(db, date, { campGroupId: group.id }),
        lastLoadedAt(),
      ]);
      return { date, campGroup: group, campers: list, lastLoadedAt: loadedAt };
    },
  };
}
