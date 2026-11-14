// Loads Camp HQ's sample data into the shared Neon dev database, so deployed
// previews have the Clerk test users, invented campers and a sample Club day.
// Run it after `hq:db:migrate --yes`. Only for the dev database that previews
// use: never for production.
//
//   pnpm --dir frontend hq:db:sample           # shows the target, changes nothing
//   pnpm --dir frontend hq:db:sample --yes     # loads the sample data
//
// Target: DATABASE_URL_UNPOOLED, else DATABASE_URL (from the environment or
// frontend/.env.local). Check the host it prints before passing --yes. Safe to
// run again: it adds only what is missing, and loads this week's invented
// campers when nobody is on the camper list this week (never replacing an
// uploaded list). CLERK_SECRET_KEY must be the development instance's
// `sk_test_` key that previews use, so the test users can be linked.
import { openNeonDatabase } from "../lib/hq/db/database.ts";
import { findSampleAccounts } from "../lib/hq/db/local.ts";
import { loadSampleData } from "../lib/hq/db/sample-data.ts";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL (or DATABASE_URL_UNPOOLED) to the Neon dev database.");
  if (process.env.CLERK_SECRET_KEY?.startsWith("sk_live_")) {
    throw new Error("CLERK_SECRET_KEY is a production key. The sample data is for the dev database only.");
  }
  const { host, pathname } = new URL(url);
  const target = `${host}${pathname}`;

  if (!process.argv.includes("--yes")) {
    console.log(`Would load Camp HQ sample data into ${target}. Run again with --yes to load it.`);
    return;
  }

  const accounts = await findSampleAccounts(process.env);
  if (!accounts.admin || !accounts.leader) {
    console.warn(
      "The Clerk test users could not be found, so the sample people stay unlinked. " +
        "Set CLERK_SECRET_KEY to the development instance's key and run again.",
    );
  }
  const database = await openNeonDatabase(url);
  try {
    await loadSampleData(database.db, { now: new Date(), accounts });
    console.log(`Camp HQ sample data loaded into ${target}.`);
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
