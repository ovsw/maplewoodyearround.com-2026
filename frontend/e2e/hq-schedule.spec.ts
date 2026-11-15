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

/** A retry in the same run takes a day the earlier attempt left untouched. */
const DAYS = ["Friday", "Thursday", "Wednesday"];

/** Opens one day of the schedule of the Camp group at this place in the list of groups. */
async function openDay(page: Page, place: number, day: string) {
  await page.goto("/hq/groups");
  const link = page.getByRole("link", { name: /^Schedule of / }).nth(place);
  const name = (await link.getAttribute("aria-label"))!.replace("Schedule of ", "");
  await link.click();
  await page.getByRole("link", { name: day }).click();
  await expect(page.getByRole("heading", { name: day })).toBeVisible();
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

  test("an Admin edits a day in the rows; a leader sees it read-only", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const day = DAYS[testInfo.retry % DAYS.length];
    await page.goto("/hq/sign-in");
    await clerk.signIn({ page, emailAddress: admin.emailAddress });

    const first = await openDay(page, 0, day);
    const table = page.getByRole("table", { name: `${day} schedule of ${first}` });

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
      await openDay(page, 1, day);
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
      await openDay(page, 0, day);
      await expect(page.getByText("Only an Admin can change schedules.")).toBeVisible();
      await expect(table.getByRole("row", { name: /2:00 PM 2:20 PM Archery/ })).toBeVisible();
      await expect(table.getByRole("combobox")).toHaveCount(0);
      await expect(table.locator("input")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    });
  });

  test("an Admin edits every group's day and the Configure tables in place", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    // A retry in the same run takes a day the earlier attempt left untouched.
    const day = ["Monday", "Tuesday"][testInfo.retry % 2];
    const slot = "2:30 PM to 3:00 PM";
    await page.goto("/hq/sign-in");
    await clerk.signIn({ page, emailAddress: admin.emailAddress });

    await page.goto("/hq");
    await page.getByRole("link", { name: "Groups Schedule" }).click();
    await page.getByRole("link", { name: day }).click();
    const board = page.getByRole("table", { name: `${day} schedule of every Camp group` });
    await expect(board).toBeVisible();
    const names = await board.getByRole("link", { name: /^Schedule of / }).allTextContents();
    expect(names.length).toBeGreaterThan(2);
    const groupName = async (place: number) =>
      (await board.getByRole("link", { name: /^Schedule of / }).nth(place).getAttribute("aria-label"))!.replace(
        "Schedule of ",
        "",
      );
    const first = await groupName(0);
    const second = await groupName(1);

    await test.step("several groups have a schedule to look at", async () => {
      await expect(board.getByRole("combobox", { name: `12:00 PM to 12:30 PM of ${second}` })).toHaveText(
        "Lunch",
      );
    });

    await test.step("picking an activity for one group greys it out for the others", async () => {
      await board.getByRole("combobox", { name: `${slot} of ${first}` }).click();
      await page.getByPlaceholder("Search activities").fill("Archery");
      await page.getByRole("option", { name: "Archery" }).first().click();
      await expect(board.getByRole("combobox", { name: `${slot} of ${first}` })).toHaveText("Archery");

      await board.getByRole("combobox", { name: `${slot} of ${second}` }).click();
      const taken = page.getByRole("option", { name: /Archery/ });
      await expect(taken).toBeDisabled();
      await expect(taken).toContainText(`${first} have it ${slot}`);
      await page.keyboard.press("Escape");
    });

    await test.step("a location is typed in the schedule and shows on Configure Groups", async () => {
      const place = `Pavilion ${testInfo.retry + 1}`;
      const lunch = board.getByLabel(`Lunch location of ${first}`);
      await lunch.fill(place);
      await lunch.blur();
      await expect(board.getByText("Saved", { exact: true }).first()).toBeAttached();
      await page.goto("/hq/groups");
      await expect(page.getByLabel(`Lunch location of ${first}`)).toHaveValue(place);
    });

    await test.step("the blank row adds a Camp group; removing it can be undone", async () => {
      const name = `Test Otters ${testInfo.retry + 1}`;
      await page.getByLabel("Name, New Camp group").fill(name);
      await page.getByRole("combobox", { name: "Grades, New Camp group" }).click();
      await page.getByRole("option", { name: "3rd Grade" }).click();
      await page.keyboard.press("Escape");
      await page.getByRole("combobox", { name: "Team, New Camp group" }).click();
      await page.getByRole("option", { name: "Team 3" }).click();
      await page.getByRole("button", { name: "Add: New Camp group" }).click();
      const added = page.getByLabel(`Name of ${name}`);
      await expect(added).toHaveValue(name);

      await page.getByRole("button", { name: `Remove ${name}` }).click();
      await expect(added).toHaveCount(0);
      await page.getByRole("button", { name: "Undo" }).click();
      await expect(added).toHaveValue(name);
      await page.getByRole("button", { name: `Remove ${name}` }).click();
      await expect(added).toHaveCount(0);
    });

    await test.step("a group's leader is picked in its row", async () => {
      await expect(page.getByRole("combobox", { name: `Leader of ${second}` })).toHaveText("No leader");
      await page.getByRole("combobox", { name: `Leader of ${second}` }).click();
      await expect(page.getByRole("option", { name: /No leader/ })).toBeVisible();
      await page.keyboard.press("Escape");
    });

    await test.step("an activity is changed in its row", async () => {
      await page.goto("/hq/activities");
      const kind = page.getByRole("combobox", { name: "Exclusive or shared of Yoga" });
      await kind.click();
      await page.getByRole("option", { name: /Shared/ }).click();
      await expect(kind).toHaveText("Shared");
      await kind.click();
      await page.getByRole("option", { name: /Exclusive/ }).click();
      await expect(kind).toHaveText("Exclusive");
    });
  });
});
