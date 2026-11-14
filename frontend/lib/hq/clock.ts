// The current time that Camp HQ pages and server actions pass to the
// operations module. It is always the real time, with one exception: the
// automated run-through (frontend/e2e/hq-day.spec.ts) sets
// CAMP_HQ_TEST_CLOCK_FILE to a file holding an ISO time, so it can start the
// day at a fixed weekday morning and then move past the signup lock. The file
// is read only on the local database outside Vercel; previews and production
// always use the real time.
import { readFileSync } from "node:fs";

import { getCampHqDatabaseMode } from "./db/database.ts";

type Env = Record<string, string | undefined>;

export function campHqNow(env: Env = process.env): Date {
  const file = env.CAMP_HQ_TEST_CLOCK_FILE?.trim();
  if (!file || env.VERCEL) return new Date();
  try {
    if (getCampHqDatabaseMode(env) !== "local") return new Date();
    const time = new Date(readFileSync(file, "utf8").trim());
    if (!Number.isNaN(time.getTime())) return time;
  } catch {
    // A missing or unreadable file falls back to the real time.
  }
  return new Date();
}
