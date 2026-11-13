// Applies Camp HQ's SQL migrations to a Neon database, on purpose. Camp HQ
// never migrates Neon at request time; the local database migrates itself.
//
//   pnpm --dir frontend hq:db:migrate           # shows the target, changes nothing
//   pnpm --dir frontend hq:db:migrate --yes     # applies the migrations
//
// Target: DATABASE_URL_UNPOOLED, else DATABASE_URL (from the environment or
// frontend/.env.local). Check the host it prints before passing --yes.
import { campHqMigrationsFolder } from "../lib/hq/db/database.ts";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL (or DATABASE_URL_UNPOOLED) to the Neon database.");
  const { host, pathname } = new URL(url);
  const target = `${host}${pathname}`;

  if (!process.argv.includes("--yes")) {
    console.log(`Would apply Camp HQ migrations to ${target}. Run again with --yes to apply.`);
    return;
  }

  const [{ Pool }, { drizzle }, { migrate }] = await Promise.all([
    import("@neondatabase/serverless"),
    import("drizzle-orm/neon-serverless"),
    import("drizzle-orm/neon-serverless/migrator"),
  ]);
  const pool = new Pool({ connectionString: url });
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: campHqMigrationsFolder(),
    });
    console.log(`Camp HQ migrations applied to ${target}.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
