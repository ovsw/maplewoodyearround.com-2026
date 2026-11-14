// @vitest-environment node
// Clearing a past summer's camper data (#153), called the way the camper list
// page does. Nothing is cleared without an Admin and the typed confirmation.
// Every child here is invented.
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CamperLoadRow } from "./campers";
import { clubDayPicks } from "./db/schema";
import type { CampHqActor, CampHqRequest } from "./operations";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

const SUMMER_2026 = new Date("2026-07-06T13:00:00.000Z");
const START_OF_2027_CAMP = new Date("2027-07-05T13:00:00.000Z");

let test: TestDatabase;
let admin: CampHqActor;
let asAdmin: CampHqRequest;
let eagles: string;

const as = (actor: CampHqActor, now = TEST_NOW): CampHqRequest => ({ actor, now });

/** Pat came in 2026 only; Sam came in 2026 and comes again in 2027. */
const rows: CamperLoadRow[] = [
  { camperId: "S-1", name: "Pat Ellery", date: "2026-07-06", campGroup: "Eagles", expected: true },
  { camperId: "S-1", name: "Pat Ellery", date: "2026-07-07", campGroup: "Eagles", expected: true },
  { camperId: "S-2", name: "Sam Ashdown", date: "2026-07-06", campGroup: "Eagles", expected: true },
  { camperId: "S-2", name: "Sam Ashdown", date: "2027-07-06", campGroup: "Eagles", expected: true },
];

async function camperIdOf(name: string) {
  const lookup = await test.campHq.findChild(asAdmin, name);
  return lookup.results[0].camper.id;
}

beforeEach(async () => {
  test = await createCampHqTestDatabase({ seedLists: false });
  admin = await test.addAccountHolder("Avery Pine", "admin");
  asAdmin = as(admin);
  eagles = (await test.campHq.addCampGroup(asAdmin, { name: "Eagles", grades: ["grade_3"], team: 3 }))
    .id;

  // Two loads: one during summer 2026, one as summer 2027 starts.
  await test.campHq.loadCampers(as(admin, SUMMER_2026), { source: "2026 list", rows });
  await test.campHq.loadCampers(as(admin, START_OF_2027_CAMP), { source: "2027 list", rows });

  // A Club day pick on each summer, arranged directly.
  const archery = await test.campHq.addActivity(asAdmin, { name: "Archery", grades: ["grade_3"] });
  const option = await test.campHq.addClubDayOption(asAdmin, {
    team: 3,
    weekday: 1,
    activityId: archery.id,
    maxPerPeriod: 10,
  });
  await test.db.insert(clubDayPicks).values([
    { camperId: await camperIdOf("Pat"), date: "2026-07-06", period: 1, optionId: option.id, updatedAt: SUMMER_2026 },
    { camperId: await camperIdOf("Sam"), date: "2027-07-06", period: 1, optionId: option.id, updatedAt: TEST_NOW },
  ]);
});

afterEach(async () => {
  await test.close();
});

describe("clearing a past summer", () => {
  it("clears the days, picks and load records before the date, and campers with no day left", async () => {
    const cleared = await test.campHq.clearCamperDataBefore(asAdmin, {
      before: "2027-01-01",
      confirmation: "CLEAR",
    });
    expect(cleared).toEqual({
      before: "2027-01-01",
      campers: 1,
      camperDays: 3,
      clubDayPicks: 1,
      camperLoads: 1,
    });

    // Pat is gone; Sam stays, expected today, with their 2027 pick.
    const pat = await test.campHq.findChild(asAdmin, "Pat");
    expect(pat.results).toEqual([]);
    const list = await test.campHq.getGroupCamperList(asAdmin, eagles);
    expect(list.campers.map((camper) => camper.name)).toEqual(["Sam Ashdown"]);
    expect(list.lastLoadedAt).toEqual(START_OF_2027_CAMP);
    const loads = await test.campHq.listCamperLoads(asAdmin);
    expect(loads.map((load) => load.source)).toEqual(["2027 list"]);
    const picksLeft = await test.db.select().from(clubDayPicks);
    expect(picksLeft).toHaveLength(1);
  });

  it("clears nothing more the second time", async () => {
    const request = { before: "2027-01-01", confirmation: "CLEAR" };
    await test.campHq.clearCamperDataBefore(asAdmin, request);
    await expect(test.campHq.clearCamperDataBefore(asAdmin, request)).resolves.toEqual({
      before: "2027-01-01",
      campers: 0,
      camperDays: 0,
      clubDayPicks: 0,
      camperLoads: 0,
    });
  });

  it("keeps the newest load record while campers remain, and drops it when none do", async () => {
    const keep = await test.campHq.clearCamperDataBefore(asAdmin, {
      before: "2027-07-06",
      confirmation: "CLEAR",
    });
    // The 2027 load was made on 5 July, but Sam is still on the list.
    expect(keep).toMatchObject({ campers: 1, camperLoads: 1 });
    expect(await test.campHq.listCamperLoads(asAdmin)).toHaveLength(1);

    const later = as(admin, new Date("2027-09-01T13:00:00.000Z"));
    const all = await test.campHq.clearCamperDataBefore(later, {
      before: "2027-09-01",
      confirmation: "CLEAR",
    });
    expect(all).toMatchObject({ campers: 1, camperDays: 1, clubDayPicks: 1, camperLoads: 1 });
    expect(await test.campHq.listCamperLoads(later)).toEqual([]);
  });

  it("refuses without the typed confirmation, and clears nothing", async () => {
    for (const confirmation of ["", "clear please", "yes"]) {
      await expect(
        test.campHq.clearCamperDataBefore(asAdmin, { before: "2027-01-01", confirmation }),
      ).rejects.toMatchObject({ reason: "invalid-input", message: "Type CLEAR to confirm. Nothing was cleared." });
    }
    expect((await test.campHq.findChild(asAdmin, "Pat")).results).toHaveLength(1);
  });

  it("refuses a date after today, or no date", async () => {
    await expect(
      test.campHq.clearCamperDataBefore(asAdmin, { before: "2027-07-07", confirmation: "CLEAR" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    await expect(
      test.campHq.clearCamperDataBefore(asAdmin, { before: "2027-13-01", confirmation: "CLEAR" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    expect((await test.campHq.findChild(asAdmin, "Pat")).results).toHaveLength(1);
  });

  it("is for Admins only", async () => {
    const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await expect(
      test.campHq.clearCamperDataBefore(as(leader), { before: "2027-01-01", confirmation: "CLEAR" }),
    ).rejects.toMatchObject({ reason: "admins-only" });
    await expect(
      test.campHq.clearCamperDataBefore(as({ type: "account", clerkUserId: "user_nobody" }), {
        before: "2027-01-01",
        confirmation: "CLEAR",
      }),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
  });
});

describe("nothing is cleared on its own", () => {
  it("keeps a past summer through later loads and the passing of time", async () => {
    // Months later, the same list is loaded again: every day is still held.
    const report = await test.campHq.loadCampers(as(admin, new Date("2028-03-01T13:00:00.000Z")), {
      source: "Reloaded",
      rows,
    });
    expect(report).toMatchObject({ added: 0, changed: 0, removed: 0, unchanged: 2 });
    const pat = await test.campHq.findChild(asAdmin, "Pat");
    expect(pat.results).toHaveLength(1);
  });
});
