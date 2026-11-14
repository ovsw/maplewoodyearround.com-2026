// SAMPLE DATA for the local database only. Every person here is invented and
// named "Sample …" or marked "(sample)". It never goes to Neon. The Camp groups
// and activities come from the committed seed file (seed-lists.json); their
// Teams are sample.
import { and, asc, between, eq, isNull, sql } from "drizzle-orm";

import { addDays, campDate, weekStart } from "../camp-dates.ts";
import type { CamperLoadRow } from "../campers.ts";
import { createCampHqOperations } from "../operations.ts";
import type { CampHqDb } from "./database.ts";
import { camperDays, campGroups, staffMembers } from "./schema.ts";
import { campHqSeed, loadSeedLists } from "./seed-lists.ts";

const SAMPLE_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const SAMPLE_LEADER_ID = "00000000-0000-4000-8000-000000000002";
const SAMPLE_JUNIOR_ID = "00000000-0000-4000-8000-000000000003";

const samplePeople = [
  { id: SAMPLE_ADMIN_ID, name: "Sample Admin", kind: "senior" },
  { id: SAMPLE_LEADER_ID, name: "Sample Leader", kind: "senior" },
  { id: SAMPLE_JUNIOR_ID, name: "Sample Junior", kind: "junior" },
] as const;

/** The Clerk user ids of the Camp HQ test users, when known. */
export type SampleAccounts = { admin?: string; leader?: string };

/**
 * Loads the sample people and the seed lists into an empty database, then links the Clerk test
 * admin (as Admin) and test leader (as Senior staff) to their sample records
 * when those are still unlinked. Safe to run on every start.
 */
export async function loadSampleData(
  db: CampHqDb,
  { now, accounts = {} }: { now: Date; accounts?: SampleAccounts },
) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffMembers);
  if (count === 0) {
    await db
      .insert(staffMembers)
      .values(samplePeople.map((person) => ({ ...person, createdAt: now, updatedAt: now })));
  }
  await loadSeedLists(db, campHqSeed, { now });
  await loadSampleCampers(db, now);

  const links = [
    { id: SAMPLE_ADMIN_ID, clerkUserId: accounts.admin, role: "admin" },
    { id: SAMPLE_LEADER_ID, clerkUserId: accounts.leader, role: "senior_staff" },
  ] as const;
  for (const { id, clerkUserId, role } of links) {
    if (!clerkUserId) continue;
    const [taken] = await db
      .select({ id: staffMembers.id })
      .from(staffMembers)
      .where(eq(staffMembers.clerkUserId, clerkUserId))
      .limit(1);
    if (taken) continue;
    await db
      .update(staffMembers)
      .set({ clerkUserId, role, updatedAt: now })
      .where(and(eq(staffMembers.id, id), isNull(staffMembers.clerkUserId)));
  }
}

const sampleCamperNames = [
  ["Ava", "Brookfield"],
  ["Ben", "Okafor"],
  ["Cleo", "Marsh"],
  ["Dara", "Quill"],
  ["Eli", "Fenwick"],
  ["Finn", "Harlow"],
  ["Gia", "Romero"],
  ["Hal", "Ito"],
  ["Ivy", "Chen"],
  ["Jo", "Penn"],
  ["Kit", "Vale"],
  ["Lou", "Shaw"],
  ["Mia", "Torres"],
  ["Ned", "Archer"],
  ["Ora", "Lind"],
  ["Pip", "Gallo"],
  ["Rae", "Sutton"],
  ["Sol", "Bishop"],
] as const;

/**
 * Loads invented campers for the current camp week (Monday to Friday) into the
 * first three Camp groups, through the "load campers" operation, when nobody
 * is in the camper list this week. Half of them also come next week, so the
 * others show as in their final week; one is absent on Wednesday in each group
 * and one moves to the next group on Wednesday.
 */
async function loadSampleCampers(db: CampHqDb, now: Date) {
  const monday = weekStart(campDate(now));
  const friday = addDays(monday, 4);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(camperDays)
    .where(between(camperDays.date, monday, friday));
  if (count > 0) return;
  const groups = await db
    .select({ name: campGroups.name })
    .from(campGroups)
    .orderBy(asc(sql`lower(${campGroups.name})`))
    .limit(3);
  if (groups.length === 0) return;

  const thisWeek = [0, 1, 2, 3, 4].map((day) => addDays(monday, day));
  const nextWeek = thisWeek.map((date) => addDays(date, 7));
  const rows: CamperLoadRow[] = [];
  groups.forEach((group, groupIndex) => {
    for (let index = 0; index < 6; index += 1) {
      const [first, last] = sampleCamperNames[groupIndex * 6 + index];
      const camperId = `SAMPLE-${groupIndex + 1}${index + 1}`;
      const name = `${first} ${last} (sample)`;
      const dates = index % 2 === 0 ? [...thisWeek, ...nextWeek] : thisWeek;
      for (const date of dates) {
        const movesOn = index === 5 && groups.length > 1 && date >= thisWeek[2];
        rows.push({
          camperId,
          name,
          date,
          campGroup: movesOn ? groups[(groupIndex + 1) % groups.length].name : group.name,
          expected: !(index === 1 && date === thisWeek[2]),
        });
      }
    }
  });
  await createCampHqOperations(db).loadCampers(
    { actor: { type: "command-line" }, now },
    { source: "Sample data (invented campers)", rows },
  );
}
