import "server-only";

import type { CampHqDb } from "./db/database.ts";
import {
  getCampHqDatabaseMode,
  neonDatabaseUrl,
  openNeonDatabase,
} from "./db/database.ts";
import { createCampHqOperations, type CampHqOperations } from "./operations.ts";

export { CampHqDatabaseUnavailable } from "./db/database.ts";

// One database per server process. Kept on globalThis so dev reloads and
// separate route bundles share it (PGlite allows one opener per folder).
const cache = globalThis as typeof globalThis & {
  __campHqDb?: Promise<CampHqDb>;
};

async function openCampHqDb(): Promise<CampHqDb> {
  if (getCampHqDatabaseMode() === "neon") {
    return (await openNeonDatabase(neonDatabaseUrl())).db;
  }
  const { openLocalCampHqDatabase } = await import("./db/local.ts");
  return (await openLocalCampHqDatabase()).db;
}

/**
 * The Camp HQ operations for pages and server actions. Throws
 * CampHqDatabaseUnavailable when there is no database to use.
 */
export async function getCampHqOperations(): Promise<CampHqOperations> {
  cache.__campHqDb ??= openCampHqDb().catch((error: unknown) => {
    cache.__campHqDb = undefined;
    throw error;
  });
  return createCampHqOperations(await cache.__campHqDb);
}
