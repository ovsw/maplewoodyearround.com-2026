import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

// Playwright reloads this config in every worker, so pick the port once in
// the main process and hand it to the workers through the environment.
if (!process.env.PLAYWRIGHT_PORT) {
  process.env.PLAYWRIGHT_PORT = process.env.CI
    ? "3000"
    : execFileSync(
        process.execPath,
        [
          "-e",
          "const s=require('node:net').createServer().listen(0,()=>{process.stdout.write(String(s.address().port));s.close()})",
        ],
        { encoding: "utf8" },
      );
}
// Camp HQ gets a fresh local database for every run, and a test clock that
// starts on a camp Tuesday at 10:00 AM (signups open), so the run-through in
// e2e/hq-day.spec.ts can move the day past the lock. Set up once, in the main
// process, before the server starts; the workers inherit the paths.
if (!process.env.CAMP_HQ_PGLITE_DIR) {
  const runDir = fileURLToPath(new URL("./.hq-data/e2e/", import.meta.url));
  rmSync(runDir, { recursive: true, force: true });
  mkdirSync(runDir, { recursive: true });
  process.env.CAMP_HQ_PGLITE_DIR = `${runDir}pglite`;
  process.env.CAMP_HQ_TEST_CLOCK_FILE = `${runDir}clock.txt`;
  writeFileSync(process.env.CAMP_HQ_TEST_CLOCK_FILE, "2027-07-06T14:00:00.000Z\n");
}
const port = Number(process.env.PLAYWRIGHT_PORT);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.PLAYWRIGHT_REUSE_BUILD
      ? "pnpm start"
      : "pnpm build && pnpm start",
    url: baseURL,
    env: {
      PORT: String(port),
      CAMP_HQ_DATABASE: "local",
      CAMP_HQ_PGLITE_DIR: process.env.CAMP_HQ_PGLITE_DIR ?? "",
      CAMP_HQ_TEST_CLOCK_FILE: process.env.CAMP_HQ_TEST_CLOCK_FILE ?? "",
    },
    reuseExistingServer:
      !process.env.CI && !process.env.PLAYWRIGHT_REUSE_BUILD,
    timeout: 180_000,
  },
});
