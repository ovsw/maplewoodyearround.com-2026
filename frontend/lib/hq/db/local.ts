// The local per-worktree database: PGlite on disk, migrated and loaded with
// sample data when it opens. PGlite allows one process at a time, so stop the
// dev server before running a Camp HQ command against it.
import {
  campHqTestUsers,
  ensureClerkTestUsers,
} from "../../../scripts/clerk-test-users.mjs";

import { campHqLocalDataDir, openPgliteDatabase } from "./database.ts";
import { loadSampleData, type SampleAccounts } from "./sample-data.ts";

type Env = Record<string, string | undefined>;

/**
 * Finds (and creates when missing) the Clerk test users so the sample data can
 * link them. Without a development Clerk key the sample people stay unlinked.
 */
async function findSampleAccounts(env: Env): Promise<SampleAccounts> {
  const secretKey = env.CLERK_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) return {};
  try {
    const users = await ensureClerkTestUsers({ secretKey });
    const idFor = (role: string) => users.find((user) => user.role === role)?.id;
    return { admin: idFor("Admin"), leader: idFor("Group leader") };
  } catch (error) {
    console.warn(
      `Camp HQ sample data: could not reach Clerk for the test users (${campHqTestUsers
        .map((user) => user.emailAddress)
        .join(", ")}). ${error instanceof Error ? error.message : error}`,
    );
    return {};
  }
}

export async function openLocalCampHqDatabase({
  env = process.env,
  now = new Date(),
}: { env?: Env; now?: Date } = {}) {
  const database = await openPgliteDatabase(campHqLocalDataDir(env));
  try {
    await loadSampleData(database.db, { now, accounts: await findSampleAccounts(env) });
  } catch (error) {
    await database.close().catch(() => {});
    throw error;
  }
  return database;
}
