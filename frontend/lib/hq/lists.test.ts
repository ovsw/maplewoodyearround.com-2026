// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { campHqSeed } from "./db/seed-lists";
import type { CampHqActor } from "./operations";
import {
  createCampHqTestDatabase,
  TEST_NOW,
} from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;

async function start(options?: Parameters<typeof createCampHqTestDatabase>[0]) {
  test = await createCampHqTestDatabase(options);
  const admin = await test.addAccountHolder("Avery Pine", "admin");
  const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");
  return { admin: { actor: admin, now: TEST_NOW }, leader: { actor: leader, now: TEST_NOW } };
}

afterEach(async () => {
  await test?.close();
});

const unknownAccount: CampHqActor = { type: "account", clerkUserId: "user_nobody" };

const newGroup = {
  name: "Otters",
  grades: ["grade_3"],
  team: 3,
  locations: { change: "Cabin 4", freeSwim: "Big pool", lunch: "Pavilion", swimLessons: "Small pool" },
};

describe("the starting lists", () => {
  it("starts with the seeded Camp groups and activities", async () => {
    const { leader } = await start();

    const groups = await test.campHq.listCampGroups(leader);
    const activities = await test.campHq.listActivities(leader);

    expect(groups).toHaveLength(campHqSeed.campGroups.length);
    expect(activities).toHaveLength(campHqSeed.activities.length);
    expect(groups.find((group) => group.name === "Knights")).toMatchObject({
      grades: ["grade_4"],
      team: 3,
      teamIsSample: true,
    });
  });

  it("seeds lunch and free swim as shared and everything else as exclusive", async () => {
    const { leader } = await start();

    const activities = await test.campHq.listActivities(leader);
    const shared = activities.filter((activity) => activity.kind === "shared").map((a) => a.name);

    expect(shared.sort()).toEqual(["Free Swim", "Lunch"]);
    expect(activities.find((activity) => activity.name === "Archery")?.kind).toBe("exclusive");
  });
});

describe("Camp groups", () => {
  it("lets an Admin add a group with its grades, Team and locations", async () => {
    const { admin } = await start({ seedLists: false });

    const group = await test.campHq.addCampGroup(admin, newGroup);

    expect(group).toMatchObject({
      name: "Otters",
      grades: ["grade_3"],
      team: 3,
      teamIsSample: false,
      locations: newGroup.locations,
    });
    await expect(test.campHq.getCampGroup(admin, group.id)).resolves.toEqual(group);
  });

  it("lets an Admin rename a group and change its grades, Team and locations", async () => {
    const { admin } = await start({ seedLists: false });
    const group = await test.campHq.addCampGroup(admin, newGroup);

    const updated = await test.campHq.updateCampGroup(admin, group.id, {
      name: "River Otters",
      grades: ["grade_4", "grade_3"],
      team: 4,
      locations: { change: "Cabin 5" },
    });

    expect(updated).toMatchObject({
      name: "River Otters",
      grades: ["grade_3", "grade_4"],
      team: 4,
      locations: { change: "Cabin 5", freeSwim: "", lunch: "", swimLessons: "" },
    });
  });

  it("keeps a sample Team marked as sample until an Admin changes it", async () => {
    const { admin } = await start();
    const knights = (await test.campHq.listCampGroups(admin)).find((g) => g.name === "Knights")!;
    const input = { name: "Knights", grades: knights.grades, team: knights.team };

    await expect(test.campHq.updateCampGroup(admin, knights.id, input)).resolves.toMatchObject({
      teamIsSample: true,
    });
    await expect(
      test.campHq.updateCampGroup(admin, knights.id, { ...input, team: 2 }),
    ).resolves.toMatchObject({ team: 2, teamIsSample: false });
  });

  it("lets an Admin remove a group that is not used anywhere", async () => {
    const { admin } = await start({ seedLists: false });
    const group = await test.campHq.addCampGroup(admin, newGroup);

    await test.campHq.removeCampGroup(admin, group.id);

    await expect(test.campHq.listCampGroups(admin)).resolves.toEqual([]);
    await expect(test.campHq.getCampGroup(admin, group.id)).rejects.toMatchObject({
      reason: "not-found",
    });
  });

  it("refuses to remove a group that is used, and says where", async () => {
    const { admin } = await start({
      seedLists: false,
      options: {
        usageChecks: {
          campGroup: [async () => ["Schedule of Otters, Monday 9:00"], async () => []],
          activity: [],
        },
      },
    });
    const group = await test.campHq.addCampGroup(admin, newGroup);

    await expect(test.campHq.removeCampGroup(admin, group.id)).rejects.toMatchObject({
      name: "CampHqRefusal",
      reason: "in-use",
      usedIn: ["Schedule of Otters, Monday 9:00"],
    });
    await expect(test.campHq.listCampGroups(admin)).resolves.toHaveLength(1);
  });

  it("refuses a second group with the same name, whatever the case", async () => {
    const { admin } = await start({ seedLists: false });
    await test.campHq.addCampGroup(admin, newGroup);
    const other = await test.campHq.addCampGroup(admin, { ...newGroup, name: "Beavers" });

    await expect(
      test.campHq.addCampGroup(admin, { ...newGroup, name: " otters " }),
    ).rejects.toMatchObject({ reason: "name-taken" });
    await expect(
      test.campHq.updateCampGroup(admin, other.id, { ...newGroup, name: "OTTERS" }),
    ).rejects.toMatchObject({ reason: "name-taken" });
  });

  it.each([
    ["no name", { name: "  " }],
    ["no grades", { grades: [] }],
    ["an unknown grade", { grades: ["grade_10"] }],
    ["Team 0", { team: 0 }],
    ["Team 5", { team: 5 }],
  ])("refuses a group with %s", async (_, change) => {
    const { admin } = await start({ seedLists: false });

    await expect(
      test.campHq.addCampGroup(admin, { ...newGroup, ...change }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });
});

describe("activities", () => {
  it("adds a new activity as exclusive unless it is marked shared", async () => {
    const { admin } = await start({ seedLists: false });

    await expect(
      test.campHq.addActivity(admin, { name: "Canoeing", grades: ["grade_5", "grade_4"] }),
    ).resolves.toMatchObject({ name: "Canoeing", grades: ["grade_4", "grade_5"], kind: "exclusive" });
    await expect(
      test.campHq.addActivity(admin, { name: "Snack", grades: ["preschool"], kind: "shared" }),
    ).resolves.toMatchObject({ kind: "shared" });
  });

  it("lets an Admin rename an activity, change its grades and mark it shared", async () => {
    const { admin } = await start({ seedLists: false });
    const activity = await test.campHq.addActivity(admin, { name: "Canoe", grades: ["grade_4"] });

    await expect(
      test.campHq.updateActivity(admin, activity.id, {
        name: "Canoeing",
        grades: ["grade_6"],
        kind: "shared",
      }),
    ).resolves.toEqual({
      id: activity.id,
      name: "Canoeing",
      grades: ["grade_6"],
      kind: "shared",
      clubOnly: false,
    });
  });

  it("lets an Admin remove an activity that is not used anywhere", async () => {
    const { admin } = await start({ seedLists: false });
    const activity = await test.campHq.addActivity(admin, { name: "Canoe", grades: ["grade_4"] });

    await test.campHq.removeActivity(admin, activity.id);

    await expect(test.campHq.listActivities(admin)).resolves.toEqual([]);
  });

  it("refuses to remove an activity that is used, and says where", async () => {
    const { admin } = await start({
      seedLists: false,
      options: {
        usageChecks: {
          campGroup: [],
          activity: [async () => ["Schedule of Otters, Monday 9:00", "Club day, Team 3, Tuesday"]],
        },
      },
    });
    const activity = await test.campHq.addActivity(admin, { name: "Canoe", grades: ["grade_4"] });

    await expect(test.campHq.removeActivity(admin, activity.id)).rejects.toMatchObject({
      reason: "in-use",
      usedIn: ["Schedule of Otters, Monday 9:00", "Club day, Team 3, Tuesday"],
    });
    await expect(test.campHq.listActivities(admin)).resolves.toHaveLength(1);
  });

  it("refuses a duplicate name, no grades and an unknown kind", async () => {
    const { admin } = await start({ seedLists: false });
    await test.campHq.addActivity(admin, { name: "Canoe", grades: ["grade_4"] });

    await expect(
      test.campHq.addActivity(admin, { name: "canoe", grades: ["grade_4"] }),
    ).rejects.toMatchObject({ reason: "name-taken" });
    await expect(
      test.campHq.addActivity(admin, { name: "Kayak", grades: [] }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    await expect(
      test.campHq.addActivity(admin, { name: "Kayak", grades: ["grade_4"], kind: "sometimes" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });

  it("says when the activity no longer exists", async () => {
    const { admin } = await start({ seedLists: false });

    await expect(
      test.campHq.updateActivity(admin, "00000000-0000-4000-8000-0000000000ff", {
        name: "Canoe",
        grades: ["grade_4"],
      }),
    ).rejects.toMatchObject({ reason: "not-found" });
    await expect(test.campHq.removeActivity(admin, "not-an-id")).rejects.toMatchObject({
      reason: "not-found",
    });
  });
});

describe("who can change the lists", () => {
  it("lets any signed-in person read the lists", async () => {
    const { leader } = await start();

    await expect(test.campHq.listCampGroups(leader)).resolves.not.toHaveLength(0);
    await expect(test.campHq.listActivities(leader)).resolves.not.toHaveLength(0);
  });

  it("refuses to show the lists to an account with no staff record", async () => {
    await start();
    const request = { actor: unknownAccount, now: TEST_NOW };

    await expect(test.campHq.listCampGroups(request)).rejects.toMatchObject({
      reason: "no-staff-record",
    });
    await expect(test.campHq.listActivities(request)).rejects.toMatchObject({
      reason: "no-staff-record",
    });
  });

  it("refuses every change by Senior staff and leaves the lists as they were", async () => {
    const { leader } = await start();
    const [group] = await test.campHq.listCampGroups(leader);
    const [activity] = await test.campHq.listActivities(leader);
    const activityInput = { name: "Canoe", grades: ["grade_4"] };

    const attempts = [
      () => test.campHq.addCampGroup(leader, newGroup),
      () => test.campHq.updateCampGroup(leader, group.id, newGroup),
      () => test.campHq.removeCampGroup(leader, group.id),
      () => test.campHq.addActivity(leader, activityInput),
      () => test.campHq.updateActivity(leader, activity.id, activityInput),
      () => test.campHq.removeActivity(leader, activity.id),
    ];
    for (const attempt of attempts) {
      await expect(attempt()).rejects.toMatchObject({ reason: "admins-only" });
    }

    await expect(test.campHq.getCampGroup(leader, group.id)).resolves.toEqual(group);
    await expect(test.campHq.getActivity(leader, activity.id)).resolves.toEqual(activity);
    await expect(test.campHq.listCampGroups(leader)).resolves.toHaveLength(
      campHqSeed.campGroups.length,
    );
  });
});
