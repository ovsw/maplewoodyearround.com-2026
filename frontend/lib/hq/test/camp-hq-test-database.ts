// Test harness for Camp HQ: a fresh in-memory PGlite database with the real
// migrations applied, and the operations module on top of it, with a fake
// sign-in service. Tests call the operations the way a page would; `db` is
// only for arranging starting data.
import { openPgliteDatabase } from "../db/database.ts";
import { staffMembers } from "../db/schema.ts";
import { campHqSeed, loadSeedLists } from "../db/seed-lists.ts";
import {
  createCampHqOperations,
  type CampHqActor,
  type CampHqOperationsOptions,
} from "../operations.ts";

import { createFakeAccounts } from "./fake-accounts.ts";

export const TEST_NOW = new Date("2027-07-06T13:00:00.000Z");

/**
 * `seedLists` loads the committed Camp groups and activities (the default);
 * `options` replaces parts of the module, such as the usage checks.
 */
export async function createCampHqTestDatabase({
  seedLists = true,
  options,
}: { seedLists?: boolean; options?: CampHqOperationsOptions } = {}) {
  const { db, close } = await openPgliteDatabase();
  if (seedLists) await loadSeedLists(db, campHqSeed, { now: TEST_NOW });
  const fakeAccounts = createFakeAccounts();
  const campHq = createCampHqOperations(db, { accounts: fakeAccounts.accounts, ...options });

  /** Adds a staff member with an account and returns them as an actor. */
  async function addAccountHolder(
    name: string,
    role: "admin" | "senior_staff",
    kind: "senior" | "junior" = "senior",
  ): Promise<CampHqActor & { type: "account"; staffMemberId: string }> {
    const clerkUserId = `user_test_${name.toLowerCase().replaceAll(" ", "_")}`;
    const [row] = await db
      .insert(staffMembers)
      .values({
        name,
        kind,
        clerkUserId,
        role,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
      })
      .returning({ id: staffMembers.id });
    return { type: "account", clerkUserId, staffMemberId: row.id };
  }

  return { db, campHq, close, addAccountHolder, fakeAccounts };
}
