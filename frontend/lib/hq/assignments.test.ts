// @vitest-environment node
// Assignments (#146): every refusal and the landing rule, called the way a
// page would. All names are invented.
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CampHqActor, CampHqRequest } from "./operations";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;
type AccountHolder = Awaited<ReturnType<TestDatabase["addAccountHolder"]>>;

let test: TestDatabase;
let admin: AccountHolder;
let asAdmin: CampHqRequest;
let eagles: string;
let otters: string;
let archery: string;
let pottery: string;

const as = (actor: CampHqActor): CampHqRequest => ({ actor, now: TEST_NOW });

beforeEach(async () => {
  test = await createCampHqTestDatabase({ seedLists: false });
  admin = await test.addAccountHolder("Avery Pine", "admin");
  asAdmin = as(admin);
  eagles = (await test.campHq.addCampGroup(asAdmin, { name: "Eagles", grades: ["grade_3"], team: 3 })).id;
  otters = (await test.campHq.addCampGroup(asAdmin, { name: "Otters", grades: ["grade_1"], team: 1 })).id;
  archery = (await test.campHq.addActivity(asAdmin, { name: "Archery", grades: ["grade_3"] })).id;
  pottery = (await test.campHq.addActivity(asAdmin, { name: "Pottery", grades: ["grade_1"] })).id;
});

afterEach(async () => {
  await test.close();
});

async function addJunior(name: string) {
  const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, { name, kind: "junior" });
  return staffMemberId;
}

async function board() {
  return test.campHq.getAssignmentBoard(asAdmin);
}

describe("leaders", () => {
  it("sets, changes and clears the leader of a Camp group", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const sky = await test.addAccountHolder("Sky Maple", "senior_staff");

    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);
    expect((await board()).campGroups.find((g) => g.id === eagles)?.leader).toEqual({
      id: rowan.staffMemberId,
      name: "Rowan Birch",
    });

    await test.campHq.setGroupLeader(asAdmin, eagles, null);
    await test.campHq.setGroupLeader(asAdmin, otters, rowan.staffMemberId);
    await test.campHq.setGroupLeader(asAdmin, eagles, sky.staffMemberId);
    const groups = (await board()).campGroups;
    expect(groups.find((g) => g.id === otters)?.leader?.name).toBe("Rowan Birch");
    expect(groups.find((g) => g.id === eagles)?.leader?.name).toBe("Sky Maple");

    await test.campHq.clearAssignment(asAdmin, rowan.staffMemberId);
    await expect(test.campHq.getMyAssignment(as(rowan))).resolves.toEqual({ kind: "none" });
  });

  it("asks before replacing a group's leader, then replaces them", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const sky = await test.addAccountHolder("Sky Maple", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);

    await expect(
      test.campHq.setGroupLeader(asAdmin, eagles, sky.staffMemberId),
    ).rejects.toMatchObject({
      reason: "confirm-replace",
      message: "Rowan Birch leads Eagles. Replace Rowan Birch with Sky Maple?",
      incumbentId: rowan.staffMemberId,
    });
    expect((await board()).campGroups.find((g) => g.id === eagles)?.leader?.name).toBe(
      "Rowan Birch",
    );

    await test.campHq.setGroupLeader(asAdmin, eagles, sky.staffMemberId, {
      replacing: rowan.staffMemberId,
    });
    expect((await board()).campGroups.find((g) => g.id === eagles)?.leader?.name).toBe(
      "Sky Maple",
    );
    await expect(test.campHq.getMyAssignment(as(rowan))).resolves.toEqual({ kind: "none" });
  });

  it("asks again when the leader changed after the Admin confirmed", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const sky = await test.addAccountHolder("Sky Maple", "senior_staff");
    const quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, quinn.staffMemberId);

    // The Admin agreed to replace Rowan, but Quinn leads Eagles now.
    await expect(
      test.campHq.setGroupLeader(asAdmin, eagles, sky.staffMemberId, {
        replacing: rowan.staffMemberId,
      }),
    ).rejects.toMatchObject({ reason: "confirm-replace", incumbentId: quinn.staffMemberId });
    expect((await board()).campGroups.find((g) => g.id === eagles)?.leader?.name).toBe(
      "Quinn Alder",
    );
  });
});

describe("specialists", () => {
  it("sets one or more activities for a specialist, and clears one", async () => {
    const quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");

    await test.campHq.setActivitySpecialist(asAdmin, archery, quinn.staffMemberId);
    await test.campHq.setActivitySpecialist(asAdmin, pottery, quinn.staffMemberId);
    await expect(test.campHq.getMyAssignment(as(quinn))).resolves.toEqual({
      kind: "specialist",
      activities: [
        { id: archery, name: "Archery" },
        { id: pottery, name: "Pottery" },
      ],
    });

    await test.campHq.setActivitySpecialist(asAdmin, archery, null);
    await expect(test.campHq.getMyAssignment(as(quinn))).resolves.toEqual({
      kind: "specialist",
      activities: [{ id: pottery, name: "Pottery" }],
    });
  });

  it("asks before replacing an activity's specialist", async () => {
    const quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");
    const sky = await test.addAccountHolder("Sky Maple", "senior_staff");
    await test.campHq.setActivitySpecialist(asAdmin, archery, quinn.staffMemberId);

    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, sky.staffMemberId),
    ).rejects.toMatchObject({ reason: "confirm-replace", incumbentId: quinn.staffMemberId });
    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, sky.staffMemberId, {
        replacing: sky.staffMemberId,
      }),
    ).rejects.toMatchObject({ reason: "confirm-replace" });

    await test.campHq.setActivitySpecialist(asAdmin, archery, sky.staffMemberId, {
      replacing: quinn.staffMemberId,
    });
    expect((await board()).activities.find((a) => a.id === archery)?.specialist?.name).toBe(
      "Sky Maple",
    );
  });
});

describe("Junior staff", () => {
  it("sets a junior's Camp group and, optionally, their Club day activity", async () => {
    const juniper = await addJunior("Juniper Ash");

    await test.campHq.setJuniorPlacement(asAdmin, juniper, { campGroupId: eagles });
    expect((await board()).juniors).toEqual([
      { id: juniper, name: "Juniper Ash", campGroupId: eagles, clubDayActivityId: null },
    ]);

    await test.campHq.setJuniorPlacement(asAdmin, juniper, {
      campGroupId: otters,
      clubDayActivityId: pottery,
    });
    const after = await board();
    expect(after.juniors[0]).toMatchObject({ campGroupId: otters, clubDayActivityId: pottery });
    expect(after.campGroups.find((g) => g.id === otters)?.juniors).toEqual([
      { id: juniper, name: "Juniper Ash" },
    ]);

    await test.campHq.setJuniorPlacement(asAdmin, juniper, { campGroupId: null });
    expect((await board()).juniors[0]).toMatchObject({ campGroupId: null });
  });

  it("refuses to place Senior staff as a junior helper", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await expect(
      test.campHq.setJuniorPlacement(asAdmin, rowan.staffMemberId, { campGroupId: eagles }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });

  it("refuses a Club day activity without a Camp group", async () => {
    const juniper = await addJunior("Juniper Ash");
    await expect(
      test.campHq.setJuniorPlacement(asAdmin, juniper, {
        campGroupId: null,
        clubDayActivityId: archery,
      }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });
});

describe("no active account", () => {
  async function seniorWithoutAccount() {
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Hazel Oak",
      kind: "senior",
    });
    return staffMemberId;
  }

  it("refuses a leader or specialist with no account", async () => {
    const hazel = await seniorWithoutAccount();
    await expect(test.campHq.setGroupLeader(asAdmin, eagles, hazel)).rejects.toMatchObject({
      reason: "no-account",
      message: expect.stringContaining("Hazel Oak has no active account"),
    });
    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, hazel),
    ).rejects.toMatchObject({ reason: "no-account" });
  });

  it("refuses a person whose invitation is not accepted yet", async () => {
    const hazel = await seniorWithoutAccount();
    test.fakeAccounts.refuseDirectCreation();
    await test.campHq.createAccount(asAdmin, hazel, "hazel+clerk_test@example.com");

    await expect(test.campHq.setGroupLeader(asAdmin, eagles, hazel)).rejects.toMatchObject({
      reason: "no-account",
    });
  });

  it("refuses a person whose account is switched off", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.switchAccountOff(asAdmin, rowan.staffMemberId);

    await expect(
      test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId),
    ).rejects.toMatchObject({ reason: "no-account" });
    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, rowan.staffMemberId),
    ).rejects.toMatchObject({ reason: "no-account" });
  });

  it("lets a Junior staff member with an account lead, as an exception", async () => {
    const juniper = await test.addAccountHolder("Juniper Ash", "senior_staff", "junior");
    await test.campHq.setGroupLeader(asAdmin, eagles, juniper.staffMemberId);
    await expect(test.campHq.getMyAssignment(as(juniper))).resolves.toMatchObject({
      kind: "leader",
    });
  });
});

describe("two jobs at once", () => {
  it("refuses leading two Camp groups", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);

    await expect(
      test.campHq.setGroupLeader(asAdmin, otters, rowan.staffMemberId),
    ).rejects.toMatchObject({
      reason: "two-jobs",
      message: "Rowan Birch already leads Eagles. Clear that Assignment first.",
    });
  });

  it("refuses a leader as a specialist", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);

    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, rowan.staffMemberId),
    ).rejects.toMatchObject({
      reason: "two-jobs",
      message: "Rowan Birch leads Eagles. A leader cannot also be a specialist.",
    });
  });

  it("refuses a specialist as a leader", async () => {
    const quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");
    await test.campHq.setActivitySpecialist(asAdmin, archery, quinn.staffMemberId);
    await test.campHq.setActivitySpecialist(asAdmin, pottery, quinn.staffMemberId);

    await expect(
      test.campHq.setGroupLeader(asAdmin, eagles, quinn.staffMemberId),
    ).rejects.toMatchObject({
      reason: "two-jobs",
      message:
        "Quinn Alder is the specialist for Archery and Pottery. A leader cannot also be a specialist.",
    });
  });

  it("refuses a junior helper as a leader or specialist, and a leader as a helper", async () => {
    const juniper = await test.addAccountHolder("Juniper Ash", "senior_staff", "junior");
    await test.campHq.setJuniorPlacement(asAdmin, juniper.staffMemberId, { campGroupId: otters });

    await expect(
      test.campHq.setGroupLeader(asAdmin, eagles, juniper.staffMemberId),
    ).rejects.toMatchObject({ reason: "two-jobs" });
    await expect(
      test.campHq.setActivitySpecialist(asAdmin, archery, juniper.staffMemberId),
    ).rejects.toMatchObject({ reason: "two-jobs" });

    await test.campHq.setJuniorPlacement(asAdmin, juniper.staffMemberId, { campGroupId: null });
    await test.campHq.setGroupLeader(asAdmin, eagles, juniper.staffMemberId);
    await expect(
      test.campHq.setJuniorPlacement(asAdmin, juniper.staffMemberId, { campGroupId: otters }),
    ).rejects.toMatchObject({ reason: "two-jobs" });
  });
});

describe("gaps", () => {
  it("lists Camp groups without a leader and activities without a specialist", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);
    await test.campHq.setActivitySpecialist(asAdmin, pottery, quinn.staffMemberId);

    const { gaps, candidates } = await board();
    expect(gaps).toEqual({
      campGroupsWithoutLeader: [{ id: otters, name: "Otters" }],
      activitiesWithoutSpecialist: [{ id: archery, name: "Archery" }],
      clubDayOptionsWithoutSpecialist: [],
    });
    expect(candidates).toEqual([
      { id: admin.staffMemberId, name: "Avery Pine", job: null },
      { id: quinn.staffMemberId, name: "Quinn Alder", job: "specialist for Pottery" },
      { id: rowan.staffMemberId, name: "Rowan Birch", job: "leads Eagles" },
    ]);
  });

  it("flags an assigned leader whose account was switched off", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);
    await test.campHq.switchAccountOff(asAdmin, rowan.staffMemberId);

    expect((await board()).withoutActiveAccount).toEqual([
      { id: rowan.staffMemberId, name: "Rowan Birch" },
    ]);
  });
});

describe("the landing page: my Assignment", () => {
  it("names a leader's Camp group", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);
    await expect(test.campHq.getMyAssignment(as(rowan))).resolves.toEqual({
      kind: "leader",
      campGroup: { id: eagles, name: "Eagles" },
    });
  });

  it("names a junior helper's group and Club day activity", async () => {
    const juniper = await test.addAccountHolder("Juniper Ash", "senior_staff", "junior");
    await test.campHq.setJuniorPlacement(asAdmin, juniper.staffMemberId, {
      campGroupId: otters,
      clubDayActivityId: archery,
    });
    await expect(test.campHq.getMyAssignment(as(juniper))).resolves.toEqual({
      kind: "helper",
      campGroup: { id: otters, name: "Otters" },
      clubDayActivity: { id: archery, name: "Archery" },
    });
  });

  it("says there is no Assignment when there is none", async () => {
    const sky = await test.addAccountHolder("Sky Maple", "senior_staff");
    await expect(test.campHq.getMyAssignment(as(sky))).resolves.toEqual({ kind: "none" });
  });

  it("refuses an account with no staff record", async () => {
    await expect(
      test.campHq.getMyAssignment(as({ type: "account", clerkUserId: "user_test_nobody" })),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
  });
});

describe("who can change Assignments", () => {
  it("refuses Senior staff", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const asRowan = as(rowan);
    const juniper = await addJunior("Juniper Ash");

    await expect(
      test.campHq.setGroupLeader(asRowan, eagles, rowan.staffMemberId),
    ).rejects.toMatchObject({ reason: "admins-only" });
    await expect(
      test.campHq.setActivitySpecialist(asRowan, archery, rowan.staffMemberId),
    ).rejects.toMatchObject({ reason: "admins-only" });
    await expect(
      test.campHq.setJuniorPlacement(asRowan, juniper, { campGroupId: eagles }),
    ).rejects.toMatchObject({ reason: "admins-only" });
    await expect(test.campHq.clearAssignment(asRowan, juniper)).rejects.toMatchObject({
      reason: "admins-only",
    });
    await expect(test.campHq.getAssignmentBoard(asRowan)).rejects.toMatchObject({
      reason: "admins-only",
    });
  });
});

describe("Assignments and the lists", () => {
  it("refuses to remove a Camp group or activity still in an Assignment", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    const juniper = await addJunior("Juniper Ash");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);
    await test.campHq.setJuniorPlacement(asAdmin, juniper, {
      campGroupId: eagles,
      clubDayActivityId: archery,
    });

    await expect(test.campHq.removeCampGroup(asAdmin, eagles)).rejects.toMatchObject({
      reason: "in-use",
      usedIn: [
        "Assignment: Rowan Birch leads this group",
        "Assignment: Juniper Ash helps this group",
      ],
    });
    await expect(test.campHq.removeActivity(asAdmin, archery)).rejects.toMatchObject({
      reason: "in-use",
      usedIn: ["Assignment: Juniper Ash's Club day activity"],
    });
  });

  it("removes a person's Assignment when the person is removed", async () => {
    const juniper = await addJunior("Juniper Ash");
    await test.campHq.setJuniorPlacement(asAdmin, juniper, { campGroupId: eagles });

    await test.campHq.removeStaffMember(asAdmin, juniper);

    expect((await board()).campGroups.find((g) => g.id === eagles)?.juniors).toEqual([]);
    await expect(test.campHq.removeCampGroup(asAdmin, eagles)).resolves.toBeUndefined();
  });
});
