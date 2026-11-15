import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

import {
  campHqTestUsers,
  ensureClerkTestUsers,
} from "../scripts/clerk-test-users.mjs";

// The server reads frontend/.env.local itself; the test process needs the
// same Clerk keys to sign the test user in. CI sets them in the environment.
const localEnv = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

test.describe("Camp HQ with sign-in", () => {
  test.skip(!hasClerkKeys, "Needs the Clerk keys");

  test.beforeAll(async () => {
    await clerkSetup();
    await ensureClerkTestUsers({ secretKey: process.env.CLERK_SECRET_KEY });
  });

  test("the test leader signs in through Clerk's testing mode and sees their name and role", async ({
    page,
  }) => {
    const response = await page.goto("/hq");
    await expect(page).toHaveURL(/\/hq\/sign-in/);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");

    const leader = campHqTestUsers.find(({ role }) => role === "Group leader")!;
    await clerk.signIn({ page, emailAddress: leader.emailAddress });

    // The local sample data links the test leader as Senior staff.
    await page.goto("/hq");
    await expect(page).toHaveURL(/\/hq$/);
    await expect(
      page.getByRole("heading", { name: "Hello, Sample Leader" }),
    ).toBeVisible();
    await expect(page.getByText("Your role: Senior staff")).toBeVisible();
    // The sidebar keeps the main menu and the account menu in view.
    await expect(page.getByRole("button", { name: "Account: Sample Leader" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Groups Schedule" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Staff and accounts" })).toHaveCount(0);
    // They land on their own Assignment.
    await expect(page.getByRole("heading", { name: "My Assignment" })).toBeVisible();

    // Staff management is for Admins only.
    await page.goto("/hq/staff");
    await expect(page.getByText("Only an Admin can do this.")).toBeVisible();
  });

  test("the test admin sees the Admin role", async ({ page }) => {
    await page.goto("/hq/sign-in");
    const admin = campHqTestUsers.find(({ role }) => role === "Admin")!;
    await clerk.signIn({ page, emailAddress: admin.emailAddress });

    await page.goto("/hq");
    await expect(
      page.getByRole("heading", { name: "Hello, Sample Admin" }),
    ).toBeVisible();
    await expect(page.getByText("Your role: Admin")).toBeVisible();

    // The Admin sees who leads each Camp group and who runs each activity.
    await page.getByRole("link", { name: "Configure Groups" }).click();
    await expect(page.getByRole("heading", { name: "Configure Groups", level: 1 })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Leader" })).toBeVisible();
    // The sidebar moves between pages without going back to Home.
    await page.getByRole("link", { name: "Configure Activities" }).click();
    await expect(page.getByRole("columnheader", { name: "Specialist" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Configure Activities" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // The Admin adds an invented Junior staff member, then removes them.
    await page.getByRole("link", { name: "Staff and accounts" }).click();
    await expect(page.getByRole("heading", { name: "Staff and accounts" })).toBeVisible();
    const name = `Sample Junior E2E ${Date.now()}`;
    await page.getByLabel("Name, New staff member").fill(name);
    await page.getByRole("combobox", { name: "Staff, New staff member" }).click();
    await page.getByRole("option", { name: /Junior staff/ }).click();
    await page.getByRole("button", { name: "Add: New staff member" }).click();
    const row = page.getByRole("row").filter({ has: page.getByLabel(`Name of ${name}`) });
    await expect(row.getByText("Junior staff")).toBeVisible();
    await expect(row.getByText("No account")).toBeVisible();

    // Removing is in the row's menu and asks first.
    await row.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByRole("menuitem", { name: "Remove from Camp HQ" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
    await expect(row).toHaveCount(0);

    // The Admin uploads a camper file. Its only row names an unknown Camp
    // group, so the report shows it and the camper list stays as it was.
    await page.goto("/hq");
    await page.getByRole("link", { name: "Camper list" }).click();
    await expect(page.getByRole("heading", { name: "Camper list", level: 1 })).toBeVisible();
    await page.getByLabel("Camper file (.csv)").setInputFiles({
      name: "campers-e2e.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "Camper ID,Name,Date,Camp group,Expected\nE2E-1,Sample E2E Camper,2027-07-06,No Such Group,yes\n",
      ),
    });
    await page.getByRole("button", { name: "Load campers" }).click();
    const report = page.getByRole("region", { name: "Load report" });
    await expect(report.getByText('Camp HQ has no Camp group named "No Such Group"')).toBeVisible();
    await expect(report.getByText("Nobody was removed")).toBeVisible();

    // Any group's list of children expected today is open to the Admin.
    await page.goto("/hq/groups");
    await page.getByRole("link", { name: /^Campers expected today in / }).first().click();
    await expect(page.getByRole("heading", { name: /^Campers today: / })).toBeVisible();
  });
});

test("without the Clerk keys, Camp HQ says it is not available", async ({
  page,
}) => {
  test.skip(hasClerkKeys, "Runs only when the Clerk keys are missing");
  await page.goto("/hq");
  await expect(
    page.getByRole("heading", { name: "Camp HQ is not available" }),
  ).toBeVisible();
});
