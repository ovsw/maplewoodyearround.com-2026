// @vitest-environment node
// Camper upload and "expected today" (#149), called the way a page would:
// the CSV adapter feeds the "load campers" operation, and lists come from the
// group camper list. Every child in the fixtures is invented.
import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readCamperCsv } from "./camper-csv";
import type { CamperLoadInput } from "./campers";
import type { CampHqActor, CampHqRequest } from "./operations";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;
type AccountHolder = Awaited<ReturnType<TestDatabase["addAccountHolder"]>>;

const TUESDAY = TEST_NOW; // Tuesday 6 July 2027, 9:00 AM camp time
const WEDNESDAY = new Date("2027-07-07T13:00:00.000Z");
const SATURDAY = new Date("2027-07-10T13:00:00.000Z");
const NEXT_MONDAY = new Date("2027-07-12T13:00:00.000Z");

let test: TestDatabase;
let admin: AccountHolder;
let asAdmin: CampHqRequest;
let eagles: string;
let otters: string;

const as = (actor: CampHqActor, now = TUESDAY): CampHqRequest => ({ actor, now });

function fixture(name: string) {
  return readFileSync(new URL(`./test/fixtures/campers/${name}`, import.meta.url), "utf8");
}

/** What the upload page does with a file. */
function fromFile(name: string, text = fixture(name)): CamperLoadInput {
  const { rows, errors } = readCamperCsv(text);
  return { source: `File upload: ${name}`, rows, errors };
}

async function upload(name: string, request = asAdmin) {
  return test.campHq.loadCampers(request, fromFile(name));
}

async function names(campGroupId: string, request = asAdmin) {
  const list = await test.campHq.getGroupCamperList(request, campGroupId);
  return list.campers.map((camper) => camper.name);
}

beforeEach(async () => {
  test = await createCampHqTestDatabase({ seedLists: false });
  admin = await test.addAccountHolder("Avery Pine", "admin");
  asAdmin = as(admin);
  eagles = (await test.campHq.addCampGroup(asAdmin, { name: "Eagles", grades: ["grade_3"], team: 3 })).id;
  otters = (await test.campHq.addCampGroup(asAdmin, { name: "Otters", grades: ["grade_1"], team: 1 })).id;
});

afterEach(async () => {
  await test.close();
});

describe("loading a clean file", () => {
  it("adds every camper and reports it", async () => {
    const report = await upload("clean.csv");
    expect(report).toMatchObject({
      source: "File upload: clean.csv",
      loadedBy: "Avery Pine",
      rowCount: 23,
      added: 4,
      changed: 0,
      removed: 0,
      unchanged: 0,
      removalsSkipped: false,
      errors: [],
    });
  });

  it("lists only the children expected in the group today, by name", async () => {
    await upload("clean.csv");
    // Ben Okafor has a planned absence on Tuesday; Cleo Marsh is in Otters.
    expect(await names(eagles)).toEqual(["Ava Brookfield", "Dara Quill"]);
    expect(await names(otters)).toEqual(["Cleo Marsh"]);
    expect(await names(eagles, as(admin, WEDNESDAY))).toEqual([
      "Ava Brookfield",
      "Ben Okafor",
      "Dara Quill",
    ]);
  });

  it("marks the children in their final week", async () => {
    await upload("clean.csv");
    const list = await test.campHq.getGroupCamperList(asAdmin, eagles);
    expect(list.campers.map(({ name, finalWeek }) => ({ name, finalWeek }))).toEqual([
      // Ava comes back next week. Dara is enrolled next Monday but not expected.
      { name: "Ava Brookfield", finalWeek: false },
      { name: "Dara Quill", finalWeek: true },
    ]);
    const nextWeek = await test.campHq.getGroupCamperList(as(admin, NEXT_MONDAY), eagles);
    expect(nextWeek.campers).toMatchObject([{ name: "Ava Brookfield", finalWeek: true }]);
  });

  it("says when the list was last loaded, and the date it shows", async () => {
    const before = await test.campHq.getGroupCamperList(asAdmin, eagles);
    expect(before).toMatchObject({ date: "2027-07-06", campers: [], lastLoadedAt: null });

    const loadedAt = new Date("2027-07-06T11:30:00.000Z");
    await upload("clean.csv", as(admin, loadedAt));
    const after = await test.campHq.getGroupCamperList(asAdmin, eagles);
    expect(after.lastLoadedAt).toEqual(loadedAt);
    expect(after.campGroup).toEqual({ id: eagles, name: "Eagles" });
  });

  it("lists nobody on a day with no camp", async () => {
    await upload("clean.csv");
    expect(await names(eagles, as(admin, SATURDAY))).toEqual([]);
  });
});

describe("loading again", () => {
  it("changes nothing when the same file is loaded twice, and records both loads", async () => {
    await upload("clean.csv", as(admin, new Date("2027-07-06T11:00:00.000Z")));
    const second = await upload("clean.csv", as(admin, new Date("2027-07-06T12:00:00.000Z")));
    expect(second).toMatchObject({ added: 0, changed: 0, removed: 0, unchanged: 4, errors: [] });
    expect(await names(eagles)).toEqual(["Ava Brookfield", "Dara Quill"]);

    const loads = await test.campHq.listCamperLoads(asAdmin);
    expect(loads.map(({ added, unchanged }) => ({ added, unchanged }))).toEqual([
      { added: 0, unchanged: 4 },
      { added: 4, unchanged: 0 },
    ]);
    expect(loads[0]).toMatchObject({
      source: "File upload: clean.csv",
      loadedAt: new Date("2027-07-06T12:00:00.000Z"),
      loadedBy: "Avery Pine",
      rowCount: 23,
    });
  });

  it("removes campers missing from the new file and counts changes", async () => {
    await upload("clean.csv");
    const text = fixture("clean.csv")
      .split("\n")
      .filter((line) => !line.startsWith("C-1004"))
      .map((line) => line.replace("Cleo Marsh", "Cleo Marsh-Lee"))
      .join("\n");
    const report = await test.campHq.loadCampers(asAdmin, fromFile("edited.csv", text));
    expect(report).toMatchObject({ added: 0, changed: 1, removed: 1, unchanged: 2 });
    expect(await names(eagles)).toEqual(["Ava Brookfield"]);
    expect(await names(otters)).toEqual(["Cleo Marsh-Lee"]);
  });

  it("removes nobody when the file has no camper rows", async () => {
    await upload("clean.csv");
    const report = await test.campHq.loadCampers(
      asAdmin,
      fromFile("empty.csv", "Camper ID,Name,Date,Camp group,Expected\n"),
    );
    expect(report).toMatchObject({ removed: 0, removalsSkipped: true });
    expect(await names(eagles)).toEqual(["Ava Brookfield", "Dara Quill"]);
  });
});

describe("a camper who changes group mid-week", () => {
  it("is in the right group on each day", async () => {
    await upload("mid-week-group-change.csv");
    expect(await names(otters)).toEqual(["Eli Fenwick"]);
    expect(await names(eagles)).toEqual([]);
    expect(await names(otters, as(admin, WEDNESDAY))).toEqual([]);
    expect(await names(eagles, as(admin, WEDNESDAY))).toEqual(["Eli Fenwick"]);
  });
});

describe("rows that cannot be used", () => {
  it("reports an unknown Camp group and never guesses one", async () => {
    const report = await upload("unknown-group.csv");
    expect(report).toMatchObject({ added: 4, removed: 0, campersKept: 1 });
    expect(report.errors).toEqual([
      {
        row: 25,
        camperId: "C-1006",
        reason: expect.stringContaining('no Camp group named "Falcons"'),
      },
    ]);
    expect([...(await names(eagles)), ...(await names(otters))]).not.toContain("Finn Harlow");
  });

  it("reports each malformed row with its reason and loads the rest", async () => {
    const report = await upload("malformed-row.csv");
    expect(report).toMatchObject({ added: 4, rowCount: 23, campersKept: 3 });
    expect(report.errors).toEqual([
      { row: 25, camperId: "C-1007", reason: expect.stringContaining("has 4 values") },
      { row: 26, camperId: "C-1008", reason: expect.stringContaining("is not a date") },
      { row: 27, camperId: "C-1009", reason: expect.stringContaining('"yes" or "no"') },
    ]);
    expect(await names(eagles)).toEqual(["Ava Brookfield", "Dara Quill"]);

    const [load] = await test.campHq.listCamperLoads(asAdmin);
    expect(load.errors).toEqual(report.errors);
  });

  it("leaves a camper with an unusable row exactly as they were", async () => {
    await upload("clean.csv");
    // Ava's Tuesday now names a group Camp HQ does not know, and her Wednesday
    // moved to Otters. Neither is applied: her rows are all kept as they were.
    const text = fixture("clean.csv")
      .replace("C-1001,Ava Brookfield,2027-07-06,Eagles", "C-1001,Ava Brookfield,2027-07-06,Hawks")
      .replace("C-1001,Ava Brookfield,2027-07-07,Eagles", "C-1001,Ava Brookfield,2027-07-07,Otters");
    const report = await test.campHq.loadCampers(asAdmin, fromFile("edited.csv", text));
    expect(report).toMatchObject({ changed: 0, removed: 0, unchanged: 3, campersKept: 1 });
    expect(await names(eagles)).toEqual(["Ava Brookfield", "Dara Quill"]);
    expect(await names(eagles, as(admin, WEDNESDAY))).toContain("Ava Brookfield");
  });

  it("keeps a camper whose only row cannot be read", async () => {
    await upload("clean.csv");
    const text = fixture("clean.csv")
      .split("\n")
      .filter((line) => !line.startsWith("C-1004") || line.includes("2027-07-06"))
      .map((line) => (line.startsWith("C-1004") ? line.replace(",yes", ",perhaps") : line))
      .join("\n");
    const report = await test.campHq.loadCampers(asAdmin, fromFile("edited.csv", text));
    expect(report).toMatchObject({ removed: 0, campersKept: 1 });
    expect(await names(eagles)).toContain("Dara Quill");
  });

  it("removes nobody when a row cannot be matched to a camper", async () => {
    await upload("clean.csv");
    const text = `${fixture("clean.csv")
      .split("\n")
      .filter((line) => !line.startsWith("C-1004"))
      .join("\n")}\n,Someone,2027-07-06,Eagles,yes\n`;
    const report = await test.campHq.loadCampers(asAdmin, fromFile("edited.csv", text));
    expect(report).toMatchObject({ removed: 0, removalsSkipped: true });
    expect(report.errors).toEqual([
      { row: expect.any(Number), camperId: null, reason: "The camper id is missing." },
    ]);
    expect(await names(eagles)).toContain("Dara Quill");
  });

  it("keeps a camper's other days when a row cannot be matched to a camper", async () => {
    await upload("clean.csv");
    // Ava's Wednesday lost its camper id, so it cannot be matched to her.
    const text = fixture("clean.csv").replace(
      "C-1001,Ava Brookfield,2027-07-07,Eagles",
      ",Ava Brookfield,2027-07-07,Eagles",
    );
    const report = await test.campHq.loadCampers(asAdmin, fromFile("edited.csv", text));
    expect(report).toMatchObject({ removed: 0, removalsSkipped: true });
    expect(await names(eagles, as(admin, WEDNESDAY))).toContain("Ava Brookfield");
  });

  it("removes nobody when no camper in the file can be loaded", async () => {
    await upload("clean.csv");
    const text = [
      "Camper ID,Name,Date,Camp group,Expected",
      "C-2002,Kit Vale,2027-07-06,Eagles,yes",
      "C-2002,Kit Vale,2027-07-06,Otters,yes",
    ].join("\n");
    const report = await test.campHq.loadCampers(asAdmin, fromFile("conflicts.csv", text));
    expect(report).toMatchObject({ added: 0, removed: 0, removalsSkipped: true });
    expect(await names(eagles)).toContain("Dara Quill");
  });

  it("refuses a camper with two different names or two different rows for one day", async () => {
    const text = [
      "Camper ID,Name,Date,Camp group,Expected",
      "C-2001,Jo Penn,2027-07-06,Eagles,yes",
      "C-2001,Joanna Penn,2027-07-07,Eagles,yes",
      "C-2002,Kit Vale,2027-07-06,Eagles,yes",
      "C-2002,Kit Vale,2027-07-06,Otters,yes",
      "C-2003,Lou Shaw,2027-07-06,Otters,yes",
      "C-2003,Lou Shaw,2027-07-06,otters,YES",
    ].join("\n");
    const report = await test.campHq.loadCampers(asAdmin, fromFile("conflicts.csv", text));
    expect(report.errors.map(({ row, camperId }) => ({ row, camperId }))).toEqual([
      { row: 3, camperId: "C-2001" },
      { row: 5, camperId: "C-2002" },
    ]);
    // A repeated identical row is fine; group names match in any letter case.
    expect(report.added).toBe(1);
    expect(await names(otters)).toEqual(["Lou Shaw"]);
  });
});

describe("who can do what", () => {
  it("lets only Admins load campers or see the loads", async () => {
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await expect(test.campHq.loadCampers(as(rowan), fromFile("clean.csv"))).rejects.toMatchObject({
      reason: "admins-only",
    });
    await expect(test.campHq.listCamperLoads(as(rowan))).rejects.toMatchObject({
      reason: "admins-only",
    });
    expect(await test.campHq.listCamperLoads(asAdmin)).toEqual([]);
  });

  it("shows a group's campers to its leader and to Admins only", async () => {
    await upload("clean.csv");
    const rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
    await test.campHq.setGroupLeader(asAdmin, eagles, rowan.staffMemberId);

    expect(await names(eagles, as(rowan))).toEqual(["Ava Brookfield", "Dara Quill"]);
    await expect(test.campHq.getGroupCamperList(as(rowan), otters)).rejects.toMatchObject({
      reason: "not-your-group",
    });
    expect(await names(otters)).toEqual(["Cleo Marsh"]);
    await expect(
      test.campHq.getGroupCamperList(as({ type: "account", clerkUserId: "user_unknown" }), eagles),
    ).rejects.toMatchObject({ reason: "no-staff-record" });
    await expect(test.campHq.getGroupCamperList(asAdmin, "not-a-group")).rejects.toMatchObject({
      reason: "not-found",
    });
  });

  it("offers no way to edit campers by hand", () => {
    const camperOperations = Object.keys(test.campHq).filter((name) => /camper/i.test(name));
    // Clearing a past summer (#153) only removes days before a date; it never edits a camper.
    expect(camperOperations.sort()).toEqual([
      "clearCamperDataBefore",
      "getGroupCamperList",
      "listCamperLoads",
      "loadCampers",
    ]);
  });

  it("refuses to remove a Camp group the camper list still uses", async () => {
    await upload("clean.csv");
    await expect(test.campHq.removeCampGroup(asAdmin, otters)).rejects.toMatchObject({
      reason: "in-use",
      usedIn: [expect.stringContaining("Camper list: 1 camper is in this group")],
    });
  });
});
