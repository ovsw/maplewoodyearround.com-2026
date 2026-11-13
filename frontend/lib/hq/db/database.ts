// Opens Camp HQ's database. Two modes:
//
// - "local": a PGlite Postgres inside the worktree (frontend/.hq-data, ignored
//   by git). The migrations are applied and the sample data loaded when it
//   opens. The default everywhere except on Vercel.
// - "neon": the Neon database in DATABASE_URL. The default on Vercel
//   (previews and production). Migrations are never applied here at request
//   time; `hq:db:migrate` applies them on purpose.
//
// CAMP_HQ_DATABASE=local or CAMP_HQ_DATABASE=neon picks a mode explicitly.
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as schema from "./schema.ts";

export type CampHqSchema = typeof schema;
export type CampHqDb = PgDatabase<PgQueryResultHKT, CampHqSchema>;
export type CampHqDatabaseMode = "local" | "neon";

type Env = Record<string, string | undefined>;

/** Thrown when Camp HQ has no database to use, for example no DATABASE_URL. */
export class CampHqDatabaseUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampHqDatabaseUnavailable";
  }
}

export function getCampHqDatabaseMode(env: Env = process.env): CampHqDatabaseMode {
  const value = env.CAMP_HQ_DATABASE?.trim();
  if (value === "local" || value === "neon") return value;
  if (value) {
    throw new CampHqDatabaseUnavailable(
      `CAMP_HQ_DATABASE must be "local" or "neon", not "${value}".`,
    );
  }
  return env.VERCEL ? "neon" : "local";
}

/** The SQL migrations kept in the repo. Commands and the server run from frontend/. */
export function campHqMigrationsFolder() {
  return path.join(process.cwd(), "lib", "hq", "db", "migrations");
}

export function campHqLocalDataDir(env: Env = process.env) {
  return env.CAMP_HQ_PGLITE_DIR || path.join(process.cwd(), ".hq-data", "pglite");
}

/** Opens a PGlite database (in memory when `dataDir` is omitted) and applies the migrations. */
export async function openPgliteDatabase(dataDir?: string) {
  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle({ client, schema });
  try {
    await migrate(db, { migrationsFolder: campHqMigrationsFolder() });
  } catch (error) {
    await client.close().catch(() => {});
    throw error;
  }
  return { db: db as unknown as CampHqDb, close: () => client.close() };
}

/** Connects to the Neon database at `url`. Applies no migrations. */
export async function openNeonDatabase(url: string) {
  const [{ Pool }, { drizzle }] = await Promise.all([
    import("@neondatabase/serverless"),
    import("drizzle-orm/neon-serverless"),
  ]);
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema });
  return { db: db as unknown as CampHqDb, close: () => pool.end() };
}

export function neonDatabaseUrl(env: Env = process.env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new CampHqDatabaseUnavailable(
      "Camp HQ uses Neon here, but DATABASE_URL is not set.",
    );
  }
  return url;
}
