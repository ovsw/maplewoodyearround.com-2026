// The Group schedule as an editable table: an Admin changes a slot's activity
// and times in the row, sees another group's Exclusive activity greyed out,
// adds a slot from the blank row, removes one and undoes it. A leader sees the
// same day read-only. It uses Clerk's testing mode and the run's fresh local
// database with its sample data.
import { existsSync } from "node:fs";
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

const leader = campHqTestUsers.find(({ role }) => role === "Group leader")!;
const admin = campHqTestUsers.find(({ role }) => role === "Admin")!;

/** Opens the Friday schedule of the Camp group at this place in the list of groups. */
async function openFriday(page: Page, place: number) {
  await page.goto("/hq/groups");
  const link = page.getByRole("link", { name: /^Schedule of / }).nth(place);
  const name = (await link.getAttribute("aria-label"))!.replace("Schedule of ", "");
  await link.click();
  await page.getByRole("link", { name: "Friday" }).click();
  await expect(page.getByRole("heading", { name: "Friday" })).toBeVisible();
  return name;
}

/** Picks a choice in a slot's activity dropdown. */
async function pickActivity(page: Page, slot: string, choice: string) {
  await page.getByRole("combobox", { name: `Activity of the ${slot} slot` }).click();
  await page.getByPlaceholder("Search activities").fill(choice);
  await page.getByRole("option", { name: choice }).first().click();
}

test.describe("Camp HQ: the Group schedule table", () => {
  test.skip(!hasClerkKeys, "Needs the Clerk keys");

  test.beforeAll(async () => {
    await clerkSetup();
    await ensureClerkTestUsers({ secretKey: process.env.CLERK_SECRET_KEY });
  });

  test("an Admin edits a day in the rows; a leader sees it read-only", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/hq/sign-in");
    await clerk.signIn({ page, emailAddress: admin.emailAddress });

    const first = await openFriday(page, 0);
    const table = page.getByRole("table", { name: `Friday schedule of ${first}` });

    await test.step("picking an activity saves it", async () => {
      await pickActivity(page, "2:00 PM to 2:30 PM", "Archery");
      const cell = page.getByRole("combobox", { name: "Activity of the 2:00 PM to 2:30 PM slot" });
      await expect(cell).toHaveText("Archery");
      await expect(table.getByText("Saved")).toBeVisible();
    });

    await test.step("a time saves when the cell is left, and a refused time goes back", async () => {
      const end = page.getByLabel("End of the 2:00 PM to 2:30 PM slot");
      await end.fill("14:20");
      await end.blur();
      await expect(page.getByLabel("End of the 2:00 PM to 2:20 PM slot")).toHaveValue("14:20");

      const start = page.getByLabel("Start of the 2:00 PM to 2:20 PM slot");
      await start.fill("14:40");
      await start.blur();
      await expect(table.getByRole("alert")).toHaveText("The slot must end after it starts.");
      await expect(start).toHaveValue("14:00");
    });

    await test.step("the blank row adds a slot", async () => {
      const start = page.getByLabel("Start, New slot");
      await start.fill("16:00");
      await expect(page.getByLabel("End, New slot")).toHaveValue("16:30");
      await page.getByLabel("End, New slot").press("Enter");
      await expect(page.getByLabel("Start of the 4:00 PM to 4:30 PM slot")).toBeVisible();
      await expect(start).toHaveValue("");
    });

    await test.step("removing a slot happens at once and can be undone", async () => {
      let asked = false;
      page.on("dialog", (dialog) => {
        asked = true;
        void dialog.dismiss();
      });
      await page.getByRole("button", { name: "Remove the 2:00 PM to 2:20 PM slot" }).click();
      const cell = page.getByRole("combobox", { name: "Activity of the 2:00 PM to 2:20 PM slot" });
      await expect(cell).toHaveCount(0);
      expect(asked).toBe(false);
      await page.getByRole("button", { name: "Undo" }).click();
      await expect(cell).toHaveText("Archery");
    });

    await test.step("another group sees the Exclusive activity greyed out, with who has it", async () => {
      await openFriday(page, 1);
      await page
        .getByRole("combobox", { name: "Activity of the 2:00 PM to 2:30 PM slot" })
        .click();
      const taken = page.getByRole("option", { name: /Archery/ });
      await expect(taken).toBeDisabled();
      await expect(taken).toContainText(`${first} have it 2:00 PM to 2:20 PM`);
      await page.keyboard.press("Escape");
    });

    await test.step("a leader sees the day as text", async () => {
      await clerk.signOut({ page });
      await page.goto("/hq/sign-in");
      await clerk.signIn({ page, emailAddress: leader.emailAddress });
      await openFriday(page, 0);
      await expect(page.getByText("Only an Admin can change schedules.")).toBeVisible();
      await expect(table.getByRole("row", { name: /2:00 PM 2:20 PM Archery/ })).toBeVisible();
      await expect(table.getByRole("combobox")).toHaveCount(0);
      await expect(table.locator("input")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    });
  });
});
