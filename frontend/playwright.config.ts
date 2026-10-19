import { execFileSync } from "node:child_process";
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
    env: { PORT: String(port) },
    reuseExistingServer:
      !process.env.CI && !process.env.PLAYWRIGHT_REUSE_BUILD,
    timeout: 180_000,
  },
});
