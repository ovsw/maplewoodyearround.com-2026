// The whole Camp HQ day in one run (#153): a group leader signs in and enters
// Club day picks, the lock passes, and an Admin opens the rosters and looks a
// child up at the front desk. It uses Clerk's testing mode, the run's fresh
// local database with its sample data, and the test clock that
// playwright.config.ts points the server at. Every child is invented. The
// clock is shared by the whole server, so only one copy of this test may run
// at a time (no --repeat-each across workers).
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  campHqTestUsers,
  ensureClerkTestUsers,
} from "../scripts/clerk-test-users.mjs";

const localEnv = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const clockFile = process.env.CAMP_HQ_TEST_CLOCK_FILE;

/** Tuesday 6 July 2027 in camp time (New York, EDT). */
const SIGNUPS_OPEN = "2027-07-06T14:00:00.000Z"; // 10:00 AM: signups are open
const DURING_CLUB_DAY = "2027-07-06T15:35:00.000Z"; // 11:35 AM: locked at 11:00, Club day period 1

function setCampTime(iso: string) {
  writeFileSync(clockFile!, `${iso}\n`);
}

const leader = campHqTestUsers.find(({ role }) => role === "Group leader")!;
const admin = campHqTestUsers.find(({ role }) => role === "Admin")!;

/** Chooses an option for one child's period on the signup board and waits for the save. */
async function pick(page: Page, child: string, activity: string) {
  const select = page.getByLabel(`${child}, period 1`);
  const value = await select.locator("option", { hasText: activity }).getAttribute("value");
  await select.selectOption(value!);
  await expect(
    page.getByRole("region", { name: "Who goes where" }).getByText(child),
  ).toBeVisible();
  await expect(select).toHaveValue(value!);
}

test.describe("Camp HQ: one whole day", () => {
  test.skip(!hasClerkKeys, "Needs the Clerk keys");
  test.skip(!clockFile, "Needs the Camp HQ test clock from playwright.config.ts");

  test.beforeAll(async () => {
    await clerkSetup();
    await ensureClerkTestUsers({ secretKey: process.env.CLERK_SECRET_KEY });
  });

  test("a leader enters picks, the lock passes, an Admin prints rosters and finds a child", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    setCampTime(SIGNUPS_OPEN);

    await test.step("the group leader enters Club day picks while signups are open", async () => {
      await page.goto("/hq/sign-in");
      await clerk.signIn({ page, emailAddress: leader.emailAddress });
      await page.goto("/hq");
      const assignment = page.getByRole("region", { name: "My Assignment" });
      await expect(assignment.getByText("You lead Angels.")).toBeVisible();
      await assignment.getByRole("link", { name: "Club day signups" }).click();

      await expect(page.getByRole("heading", { name: "Club day: Angels" })).toBeVisible();
      await expect(page.getByText("Signups are open until 11:00 AM.", { exact: false })).toBeVisible();

      await pick(page, "Ava Brookfield (sample)", "Archery");
      // Find a child by part of their name, then pick for them.
      await page.getByLabel("Find a child").fill("okaf");
      await expect(page.getByLabel("Cleo Marsh (sample), period 1")).toHaveCount(0);
      await pick(page, "Ben Okafor (sample)", "Drama");
    });

    await test.step("the lock passes and the picks become read-only", async () => {
      setCampTime(DURING_CLUB_DAY);
      await page.reload();
      await expect(
        page.getByText("Signups locked at 11:00 AM. Picks are read-only now", { exact: false }),
      ).toBeVisible();
      await expect(page.getByLabel("Ava Brookfield (sample), period 1")).toHaveCount(0);
      const avaRow = page.getByRole("row", { name: /Ava Brookfield \(sample\)/ });
      await expect(avaRow.getByText("Archery")).toBeVisible();

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/hq\/sign-in/);
    });

    await test.step("an Admin opens today's Club day rosters", async () => {
      await clerk.signIn({ page, emailAddress: admin.emailAddress });
      await page.goto("/hq");
      await page.getByRole("link", { name: "Club day rosters" }).click();
      await expect(page.getByRole("heading", { name: "Club day rosters", level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Print all rosters" })).toBeVisible();

      const archery = page.getByRole("region", { name: "Archery, period 1" });
      await expect(archery.getByRole("cell", { name: "Ava Brookfield (sample)" })).toBeVisible();
      await expect(archery.getByText("Sample Junior")).toBeVisible();
      const drama = page.getByRole("region", { name: "Drama, period 1" });
      await expect(drama.getByRole("cell", { name: "Ben Okafor (sample)" })).toBeVisible();
    });

    await test.step("the Admin looks a child up at the front desk", async () => {
      await page.goto("/hq");
      await page.getByRole("link", { name: "Find a child" }).click();
      await page.getByLabel("Child's name").fill("Ava Brook");
      await page.getByRole("button", { name: "Find" }).click();
      const result = page.getByRole("article").filter({ hasText: "Ava Brookfield (sample)" });
      await expect(result.getByText("Club day, period 1 (11:30 AM to 12:00 PM): at")).toBeVisible();
      await expect(result.getByText("Archery", { exact: true })).toBeVisible();
    });
  });
});
