// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadSampleData } from "./db/sample-data";
import type { CampHqActor } from "./operations";
import {
  createCampHqTestDatabase,
  TEST_NOW,
} from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;

beforeEach(async () => {
  test = await createCampHqTestDatabase();
});

afterEach(async () => {
  await test.close();
});

const unknownAccount: CampHqActor = { type: "account", clerkUserId: "user_nobody" };
const commandLine: CampHqActor = { type: "command-line" };

describe("who is signed in", () => {
  it("recognises an Admin", async () => {
    const actor = await test.addAccountHolder("Avery Pine", "admin");

    await expect(
      test.campHq.getSignedInPerson({ actor, now: TEST_NOW }),
    ).resolves.toMatchObject({ name: "Avery Pine", role: "admin", kind: "senior" });
  });

  it("recognises a Senior staff member", async () => {
    const actor = await test.addAccountHolder("Rowan Birch", "senior_staff");

    await expect(
      test.campHq.getSignedInPerson({ actor, now: TEST_NOW }),
    ).resolves.toMatchObject({ name: "Rowan Birch", role: "senior_staff" });
  });

  it("refuses an account with no staff record", async () => {
    await test.addAccountHolder("Avery Pine", "admin");

    await expect(
      test.campHq.getSignedInPerson({ actor: unknownAccount, now: TEST_NOW }),
    ).rejects.toMatchObject({ name: "CampHqRefusal", reason: "no-staff-record" });
  });
});

describe("making an Admin", () => {
  const newAdmin = { clerkUserId: "user_new_admin", name: "Quinn Maple" };

  it("lets the first-Admin command create the first Admin", async () => {
    await expect(
      test.campHq.makeAdmin({ actor: commandLine, now: TEST_NOW }, newAdmin),
    ).resolves.toMatchObject({ created: true });

    await expect(
      test.campHq.getSignedInPerson({
        actor: { type: "account", clerkUserId: newAdmin.clerkUserId },
        now: TEST_NOW,
      }),
    ).resolves.toMatchObject({ name: "Quinn Maple", role: "admin" });
  });

  it("lets an Admin promote a Senior staff member", async () => {
    const admin = await test.addAccountHolder("Avery Pine", "admin");
    const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");
    if (leader.type !== "account") throw new Error("expected an account");

    await expect(
      test.campHq.makeAdmin(
        { actor: admin, now: TEST_NOW },
        { clerkUserId: leader.clerkUserId, name: "Rowan Birch" },
      ),
    ).resolves.toMatchObject({ created: false });
    await expect(
      test.campHq.getSignedInPerson({ actor: leader, now: TEST_NOW }),
    ).resolves.toMatchObject({ role: "admin" });
  });

  it("refuses a Senior staff member", async () => {
    const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");

    await expect(
      test.campHq.makeAdmin({ actor: leader, now: TEST_NOW }, newAdmin),
    ).rejects.toMatchObject({ reason: "admins-only" });
    await expect(
      test.campHq.getSignedInPerson({
        actor: { type: "account", clerkUserId: newAdmin.clerkUserId },
        now: TEST_NOW,
      }),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
  });

  it("refuses an account with no staff record", async () => {
    await expect(
      test.campHq.makeAdmin({ actor: unknownAccount, now: TEST_NOW }, newAdmin),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
  });
});

describe("local sample data", () => {
  it("makes the test admin an Admin and the test leader Senior staff, once", async () => {
    const accounts = { admin: "user_sample_admin", leader: "user_sample_leader" };
    await loadSampleData(test.db, { now: TEST_NOW, accounts });
    await loadSampleData(test.db, { now: TEST_NOW, accounts });

    await expect(
      test.campHq.getSignedInPerson({
        actor: { type: "account", clerkUserId: accounts.admin },
        now: TEST_NOW,
      }),
    ).resolves.toMatchObject({ name: "Sample Admin", role: "admin" });
    await expect(
      test.campHq.getSignedInPerson({
        actor: { type: "account", clerkUserId: accounts.leader },
        now: TEST_NOW,
      }),
    ).resolves.toMatchObject({ name: "Sample Leader", role: "senior_staff" });
  });

  it("includes invented campers for the current week, loaded once", async () => {
    const asCommand = { actor: { type: "command-line" } as const, now: TEST_NOW };
    await loadSampleData(test.db, { now: TEST_NOW });
    await loadSampleData(test.db, { now: TEST_NOW });

    const loads = await test.campHq.listCamperLoads(asCommand);
    expect(loads).toHaveLength(1);
    expect(loads[0]).toMatchObject({ added: 18, errors: [] });

    const [group] = await test.campHq.listCampGroups(asCommand);
    const list = await test.campHq.getGroupCamperList(asCommand, group.id);
    expect(list.campers.length).toBeGreaterThan(0);
    expect(list.campers.every((camper) => camper.name.endsWith("(sample)"))).toBe(true);
    expect(list.campers.some((camper) => camper.finalWeek)).toBe(true);
  });
});
