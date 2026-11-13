// Test harness for Camp HQ: a fresh in-memory PGlite database with the real
// migrations applied, and the operations module on top of it. Tests call the
// operations the way a page would; `db` is only for arranging starting data.
import { openPgliteDatabase } from "../db/database.ts";
import { staffMembers } from "../db/schema.ts";
import { createCampHqOperations, type CampHqActor } from "../operations.ts";

export const TEST_NOW = new Date("2027-07-06T13:00:00.000Z");

export async function createCampHqTestDatabase() {
  const { db, close } = await openPgliteDatabase();
  const campHq = createCampHqOperations(db);

  /** Adds a staff member with an account and returns them as an actor. */
  async function addAccountHolder(
    name: string,
    role: "admin" | "senior_staff",
    kind: "senior" | "junior" = "senior",
  ): Promise<CampHqActor> {
    const clerkUserId = `user_test_${name.toLowerCase().replaceAll(" ", "_")}`;
    await db.insert(staffMembers).values({
      name,
      kind,
      clerkUserId,
      role,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
    });
    return { type: "account", clerkUserId };
  }

  return { db, campHq, close, addAccountHolder };
}
