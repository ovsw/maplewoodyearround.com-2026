// @vitest-environment node
// Staff list and accounts (#144): every rule, called the way a page would.
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CampHqActor, CampHqRequest } from "./operations";
import { createCampHqOperations } from "./operations";
import {
  createCampHqTestDatabase,
  TEST_NOW,
} from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;
let admin: Awaited<ReturnType<TestDatabase["addAccountHolder"]>>;
let asAdmin: CampHqRequest;

beforeEach(async () => {
  test = await createCampHqTestDatabase();
  admin = await test.addAccountHolder("Avery Pine", "admin");
  asAdmin = { actor: admin, now: TEST_NOW };
});

afterEach(async () => {
  await test.close();
});

const as = (actor: CampHqActor): CampHqRequest => ({ actor, now: TEST_NOW });

async function entryFor(staffMemberId: string) {
  const staff = await test.campHq.listStaff(asAdmin);
  return staff.find((entry) => entry.id === staffMemberId);
}

async function addWithAccount(name: string, email: string, kind = "senior") {
  const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, { name, kind });
  await test.campHq.createAccount(asAdmin, staffMemberId, email);
  const clerkUserId = test.fakeAccounts.userIdFor(email);
  if (!clerkUserId) throw new Error("expected an account");
  const actor: CampHqActor = { type: "account", clerkUserId };
  return { staffMemberId, actor };
}

describe("the staff list", () => {
  it("adds Senior and Junior staff, without accounts", async () => {
    await test.campHq.addStaffMember(asAdmin, { name: "  Rowan   Birch ", kind: "senior" });
    await test.campHq.addStaffMember(asAdmin, { name: "Juniper Ash", kind: "junior" });

    await expect(test.campHq.listStaff(asAdmin)).resolves.toEqual([
      expect.objectContaining({ name: "Avery Pine", account: expect.objectContaining({ role: "admin" }) }),
      expect.objectContaining({ name: "Juniper Ash", kind: "junior", account: null }),
      expect.objectContaining({ name: "Rowan Birch", kind: "senior", account: null }),
    ]);
  });

  it("renames a staff member", async () => {
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Juniper Ash",
      kind: "junior",
    });

    await test.campHq.renameStaffMember(asAdmin, staffMemberId, "Juniper Ashford");

    await expect(entryFor(staffMemberId)).resolves.toMatchObject({ name: "Juniper Ashford" });
  });

  it("removes a staff member without an account", async () => {
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Juniper Ash",
      kind: "junior",
    });

    await test.campHq.removeStaffMember(asAdmin, staffMemberId);

    await expect(entryFor(staffMemberId)).resolves.toBeUndefined();
  });

  it("refuses an empty or overlong name and an unknown kind", async () => {
    await expect(
      test.campHq.addStaffMember(asAdmin, { name: "   ", kind: "senior" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    await expect(
      test.campHq.addStaffMember(asAdmin, { name: "x".repeat(101), kind: "senior" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
    await expect(
      test.campHq.addStaffMember(asAdmin, { name: "Rowan Birch", kind: "floater" }),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });

  it("refuses to rename or remove someone who no longer exists", async () => {
    const missing = "00000000-0000-4000-8000-0000000000ff";
    await expect(
      test.campHq.renameStaffMember(asAdmin, missing, "Rowan Birch"),
    ).rejects.toMatchObject({ reason: "not-found" });
    await expect(test.campHq.removeStaffMember(asAdmin, missing)).rejects.toMatchObject({
      reason: "not-found",
    });
  });

  it("removes an account holder only once their account is switched off", async () => {
    const { staffMemberId } = await addWithAccount("Rowan Birch", "rowan@example.com");

    await expect(test.campHq.removeStaffMember(asAdmin, staffMemberId)).rejects.toMatchObject({
      reason: "switch-off-first",
    });

    await test.campHq.switchAccountOff(asAdmin, staffMemberId);
    await test.campHq.removeStaffMember(asAdmin, staffMemberId);
    await expect(entryFor(staffMemberId)).resolves.toBeUndefined();
  });
});

describe("creating an account", () => {
  it("creates an account for a Senior staff member and links it", async () => {
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Rowan Birch",
      kind: "senior",
    });

    await expect(
      test.campHq.createAccount(asAdmin, staffMemberId, " Rowan@Example.com "),
    ).resolves.toEqual({ status: "created" });

    await expect(entryFor(staffMemberId)).resolves.toMatchObject({
      account: { email: "rowan@example.com", status: "active", role: "senior_staff" },
    });
    const clerkUserId = test.fakeAccounts.userIdFor("rowan@example.com");
    expect(clerkUserId).toBeDefined();
    await expect(
      test.campHq.getSignedInPerson(as({ type: "account", clerkUserId: clerkUserId! })),
    ).resolves.toMatchObject({ name: "Rowan Birch", role: "senior_staff" });
  });

  it("gives a Junior staff member an account as an exception", async () => {
    const { actor } = await addWithAccount("Juniper Ash", "juniper@example.com", "junior");

    await expect(test.campHq.getSignedInPerson(as(actor))).resolves.toMatchObject({
      name: "Juniper Ash",
      kind: "junior",
      role: "senior_staff",
    });
  });

  it("links an account that already uses the email", async () => {
    const clerkUserId = test.fakeAccounts.addExistingUser("rowan@example.com");
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Rowan Birch",
      kind: "senior",
    });

    await test.campHq.createAccount(asAdmin, staffMemberId, "rowan@example.com");

    await expect(
      test.campHq.getSignedInPerson(as({ type: "account", clerkUserId })),
    ).resolves.toMatchObject({ name: "Rowan Birch" });
  });

  it("invites the person when direct creation is refused, and links them on sign-in", async () => {
    test.fakeAccounts.refuseDirectCreation();
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Rowan Birch",
      kind: "senior",
    });

    await expect(
      test.campHq.createAccount(asAdmin, staffMemberId, "rowan@example.com"),
    ).resolves.toEqual({ status: "invited" });
    expect(test.fakeAccounts.invitations).toEqual(["rowan@example.com"]);
    await expect(entryFor(staffMemberId)).resolves.toMatchObject({
      account: { email: "rowan@example.com", status: "invited", role: null },
    });

    const newAccount: CampHqActor = { type: "account", clerkUserId: "user_accepted" };
    await expect(
      test.campHq.acceptInvitation(as(newAccount), ["someone-else@example.com"]),
    ).resolves.toBeNull();
    await expect(
      test.campHq.acceptInvitation(as(newAccount), ["Rowan@example.com"]),
    ).resolves.toMatchObject({ name: "Rowan Birch", role: "senior_staff" });
    await expect(test.campHq.getSignedInPerson(as(newAccount))).resolves.toMatchObject({
      staffMemberId,
    });
    await expect(entryFor(staffMemberId)).resolves.toMatchObject({
      account: { status: "active" },
    });
  });

  it("links an account with two invited emails to one staff member only", async () => {
    test.fakeAccounts.refuseDirectCreation();
    const rowan = await test.campHq.addStaffMember(asAdmin, { name: "Rowan Birch", kind: "senior" });
    const sage = await test.campHq.addStaffMember(asAdmin, { name: "Sage Willow", kind: "senior" });
    await test.campHq.createAccount(asAdmin, rowan.staffMemberId, "rowan@example.com");
    await test.campHq.createAccount(asAdmin, sage.staffMemberId, "sage@example.com");

    const newAccount: CampHqActor = { type: "account", clerkUserId: "user_two_emails" };
    const person = await test.campHq.acceptInvitation(as(newAccount), [
      "rowan@example.com",
      "sage@example.com",
    ]);

    expect(person).toMatchObject({ role: "senior_staff" });
    const staff = await test.campHq.listStaff(asAdmin);
    expect(staff.filter((entry) => entry.account?.status === "active")).toHaveLength(2);
    expect(staff.filter((entry) => entry.account?.status === "invited")).toHaveLength(1);
  });

  it("links one staff member when the same account signs in twice at once", async () => {
    test.fakeAccounts.refuseDirectCreation();
    const rowan = await test.campHq.addStaffMember(asAdmin, { name: "Rowan Birch", kind: "senior" });
    const sage = await test.campHq.addStaffMember(asAdmin, { name: "Sage Willow", kind: "senior" });
    await test.campHq.createAccount(asAdmin, rowan.staffMemberId, "rowan@example.com");
    await test.campHq.createAccount(asAdmin, sage.staffMemberId, "sage@example.com");

    const newAccount: CampHqActor = { type: "account", clerkUserId: "user_two_emails" };
    const [first, second] = await Promise.all([
      test.campHq.acceptInvitation(as(newAccount), ["rowan@example.com", "sage@example.com"]),
      test.campHq.acceptInvitation(as(newAccount), ["sage@example.com", "rowan@example.com"]),
    ]);

    expect(first?.staffMemberId).toBeDefined();
    expect(second?.staffMemberId).toBe(first?.staffMemberId);
    const staff = await test.campHq.listStaff(asAdmin);
    expect(staff.filter((entry) => entry.account?.status === "invited")).toHaveLength(1);
  });

  it("allows sign-in again when it links an account that was switched off", async () => {
    const rowan = await addWithAccount("Rowan Birch", "rowan@example.com");
    await test.campHq.switchAccountOff(asAdmin, rowan.staffMemberId);
    await test.campHq.removeStaffMember(asAdmin, rowan.staffMemberId);
    expect(test.fakeAccounts.canSignIn(rowan.actor.clerkUserId)).toBe(false);

    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Rowan Birch",
      kind: "senior",
    });
    await test.campHq.createAccount(asAdmin, staffMemberId, "rowan@example.com");

    expect(test.fakeAccounts.canSignIn(rowan.actor.clerkUserId)).toBe(true);
    await expect(entryFor(staffMemberId)).resolves.toMatchObject({
      account: { status: "active" },
    });
  });

  it("refuses a second account, an email in use and an invalid email", async () => {
    const rowan = await addWithAccount("Rowan Birch", "rowan@example.com");
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Sage Willow",
      kind: "senior",
    });

    await expect(
      test.campHq.createAccount(asAdmin, rowan.staffMemberId, "rowan2@example.com"),
    ).rejects.toMatchObject({ reason: "has-account" });
    await expect(
      test.campHq.createAccount(asAdmin, staffMemberId, "ROWAN@example.com"),
    ).rejects.toMatchObject({ reason: "email-in-use" });
    await expect(
      test.campHq.createAccount(asAdmin, staffMemberId, "not an email"),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });

  it("refuses when Camp HQ has no connection to the sign-in service", async () => {
    const campHq = createCampHqOperations(test.db);
    const { staffMemberId } = await campHq.addStaffMember(asAdmin, {
      name: "Rowan Birch",
      kind: "senior",
    });

    await expect(
      campHq.createAccount(asAdmin, staffMemberId, "rowan@example.com"),
    ).rejects.toMatchObject({ reason: "accounts-unavailable" });
  });
});

describe("switching an account off and on", () => {
  it("stops sign-in and Camp HQ access, then restores both", async () => {
    const { staffMemberId, actor } = await addWithAccount("Rowan Birch", "rowan@example.com");
    if (actor.type !== "account") throw new Error("expected an account");

    await test.campHq.switchAccountOff(asAdmin, staffMemberId);

    expect(test.fakeAccounts.canSignIn(actor.clerkUserId)).toBe(false);
    await expect(test.campHq.getSignedInPerson(as(actor))).rejects.toMatchObject({
      reason: "account-switched-off",
    });
    await expect(entryFor(staffMemberId)).resolves.toMatchObject({
      account: { status: "switched-off" },
    });

    await test.campHq.switchAccountOn(asAdmin, staffMemberId);

    expect(test.fakeAccounts.canSignIn(actor.clerkUserId)).toBe(true);
    await expect(test.campHq.getSignedInPerson(as(actor))).resolves.toMatchObject({
      name: "Rowan Birch",
    });
  });

  it("refuses for someone without an account", async () => {
    const { staffMemberId } = await test.campHq.addStaffMember(asAdmin, {
      name: "Juniper Ash",
      kind: "junior",
    });

    await expect(test.campHq.switchAccountOff(asAdmin, staffMemberId)).rejects.toMatchObject({
      reason: "no-account",
    });
    await expect(test.campHq.switchAccountOn(asAdmin, staffMemberId)).rejects.toMatchObject({
      reason: "no-account",
    });
  });
});

describe("the Admin role", () => {
  it("makes an account holder an Admin and takes the role away", async () => {
    const { staffMemberId, actor } = await addWithAccount("Rowan Birch", "rowan@example.com");

    await test.campHq.setRole(asAdmin, staffMemberId, "admin");
    await expect(test.campHq.listStaff(as(actor))).resolves.toHaveLength(2);

    await test.campHq.setRole(asAdmin, staffMemberId, "senior_staff");
    await expect(test.campHq.listStaff(as(actor))).rejects.toMatchObject({
      reason: "admins-only",
    });
  });

  it("refuses a role for someone without an account, or with it switched off", async () => {
    const junior = await test.campHq.addStaffMember(asAdmin, { name: "Juniper Ash", kind: "junior" });
    const rowan = await addWithAccount("Rowan Birch", "rowan@example.com");
    await test.campHq.switchAccountOff(asAdmin, rowan.staffMemberId);

    await expect(
      test.campHq.setRole(asAdmin, junior.staffMemberId, "admin"),
    ).rejects.toMatchObject({ reason: "no-account" });
    await expect(
      test.campHq.setRole(asAdmin, rowan.staffMemberId, "admin"),
    ).rejects.toMatchObject({ reason: "account-switched-off" });
    await expect(
      test.campHq.setRole(asAdmin, rowan.staffMemberId, "owner"),
    ).rejects.toMatchObject({ reason: "invalid-input" });
  });

  it("keeps the last Admin: no role removal, no switching off", async () => {
    await expect(
      test.campHq.setRole(asAdmin, admin.staffMemberId, "senior_staff"),
    ).rejects.toMatchObject({ reason: "last-admin" });
    await expect(
      test.campHq.switchAccountOff(asAdmin, admin.staffMemberId),
    ).rejects.toMatchObject({ reason: "last-admin" });
    await expect(
      test.campHq.removeStaffMember(asAdmin, admin.staffMemberId),
    ).rejects.toMatchObject({ reason: "switch-off-first" });
    await expect(test.campHq.getSignedInPerson(asAdmin)).resolves.toMatchObject({
      role: "admin",
    });
    expect(test.fakeAccounts.canSignIn(admin.clerkUserId)).toBe(true);
  });

  it("lets one of two Admins step down, then keeps the other", async () => {
    const second = await test.addAccountHolder("Quinn Maple", "admin");

    await test.campHq.switchAccountOff(asAdmin, second.staffMemberId);

    // A switched-off Admin does not count: Avery is now the last one.
    await expect(
      test.campHq.setRole(asAdmin, admin.staffMemberId, "senior_staff"),
    ).rejects.toMatchObject({ reason: "last-admin" });
    await expect(
      test.campHq.switchAccountOff(asAdmin, admin.staffMemberId),
    ).rejects.toMatchObject({ reason: "last-admin" });

    await test.campHq.switchAccountOn(asAdmin, second.staffMemberId);
    await test.campHq.setRole(as(second), admin.staffMemberId, "senior_staff");
    await expect(test.campHq.getSignedInPerson(asAdmin)).resolves.toMatchObject({
      role: "senior_staff",
    });
  });
});

describe("who may manage staff", () => {
  const someId = "00000000-0000-4000-8000-0000000000aa";
  const operations: [string, (request: CampHqRequest) => Promise<unknown>][] = [
    ["list staff", (request) => test.campHq.listStaff(request)],
    [
      "add staff",
      (request) => test.campHq.addStaffMember(request, { name: "Rowan Birch", kind: "senior" }),
    ],
    ["rename staff", (request) => test.campHq.renameStaffMember(request, someId, "Rowan")],
    ["remove staff", (request) => test.campHq.removeStaffMember(request, someId)],
    [
      "create an account",
      (request) => test.campHq.createAccount(request, someId, "rowan@example.com"),
    ],
    ["switch an account off", (request) => test.campHq.switchAccountOff(request, someId)],
    ["switch an account on", (request) => test.campHq.switchAccountOn(request, someId)],
    ["set a role", (request) => test.campHq.setRole(request, someId, "admin")],
  ];

  it.each(operations)("refuses Senior staff: %s", async (_, run) => {
    const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await expect(run(as(leader))).rejects.toMatchObject({ reason: "admins-only" });
  });

  it.each(operations)("refuses a Junior staff account: %s", async (_, run) => {
    const junior = await test.addAccountHolder("Juniper Ash", "senior_staff", "junior");
    await expect(run(as(junior))).rejects.toMatchObject({ reason: "admins-only" });
  });

  it.each(operations)("refuses an account with no staff record: %s", async (_, run) => {
    await expect(
      run(as({ type: "account", clerkUserId: "user_nobody" })),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
  });

  it.each(operations)("refuses a switched-off Admin: %s", async (_, run) => {
    const second = await test.addAccountHolder("Quinn Maple", "admin");
    await test.campHq.switchAccountOff(asAdmin, second.staffMemberId);
    await expect(run(as(second))).rejects.toMatchObject({ reason: "account-switched-off" });
  });

  it("changes nothing when refused", async () => {
    const leader = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await expect(
      test.campHq.addStaffMember(as(leader), { name: "Sage Willow", kind: "senior" }),
    ).rejects.toThrow();
    await expect(
      test.campHq.setRole(as(leader), admin.staffMemberId, "senior_staff"),
    ).rejects.toThrow();

    const staff = await test.campHq.listStaff(asAdmin);
    expect(staff.map((entry) => entry.name)).toEqual(["Avery Pine", "Rowan Birch"]);
    expect(staff[0].account?.role).toBe("admin");
  });
});
