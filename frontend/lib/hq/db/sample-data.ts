// SAMPLE DATA for the local database only. Every person here is invented and
// named "Sample …". It never goes to Neon. The Camp groups and activities come
// from the committed seed file (seed-lists.json); their Teams are sample.
import { and, eq, isNull, sql } from "drizzle-orm";

import type { CampHqDb } from "./database.ts";
import { staffMembers } from "./schema.ts";
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
