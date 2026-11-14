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
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    // They land on their own Assignment.
    await expect(page.getByRole("heading", { name: "My Assignment" })).toBeVisible();

    // Staff management and Assignments are for Admins only.
    await page.goto("/hq/staff");
    await expect(page.getByText("Only an Admin can do this.")).toBeVisible();
    await page.goto("/hq/assignments");
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

    // The Admin sees every Assignment and the gaps.
    await page.getByRole("link", { name: "Assignments" }).click();
    await expect(page.getByRole("heading", { name: "Assignments", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gaps" })).toBeVisible();
    await page.goto("/hq");

    // The Admin adds an invented Junior staff member, then removes them.
    await page.getByRole("link", { name: "Staff and accounts" }).click();
    await expect(page.getByRole("heading", { name: "Staff and accounts" })).toBeVisible();
    const name = `Sample Junior E2E ${Date.now()}`;
    const addForm = page.locator("form", { has: page.getByRole("button", { name: "Add", exact: true }) });
    await addForm.getByLabel("Name").fill(name);
    await addForm.getByLabel("Staff").selectOption("junior");
    await addForm.getByRole("button", { name: "Add", exact: true }).click();
    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row.getByText("Junior staff · No account")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(row).toHaveCount(0);
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
