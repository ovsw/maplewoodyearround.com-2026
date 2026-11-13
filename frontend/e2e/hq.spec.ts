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

  test("a test user signs in through Clerk's testing mode and reaches the Camp HQ home", async ({
    page,
  }) => {
    const response = await page.goto("/hq");
    await expect(page).toHaveURL(/\/hq\/sign-in/);
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");

    const leader = campHqTestUsers.find(({ role }) => role === "Group leader")!;
    await clerk.signIn({ page, emailAddress: leader.emailAddress });

    await page.goto("/hq");
    await expect(page).toHaveURL(/\/hq$/);
    await expect(page.getByText("Nothing to show here yet.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
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
