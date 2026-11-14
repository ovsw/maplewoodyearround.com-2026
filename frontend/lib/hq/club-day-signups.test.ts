// @vitest-environment node
// Club day signups (#151), called the way a page would: as a given person, at
// a given time. Every child, group and staff member here is invented.
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { matchesCamperName } from "./camper-search";
import type { CamperLoadRow } from "./campers";
import type { ClubDaySignups } from "./club-day-signups";
import {
  isCampHqRefusal,
  type CampHqActor,
  type CampHqRefusal,
  type CampHqRequest,
} from "./operations";
import { campers } from "./db/schema";
import { createCampHqTestDatabase } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;
type AccountHolder = Awaited<ReturnType<TestDatabase["addAccountHolder"]>>;

const TODAY = "2027-07-06"; // a Tuesday
const YESTERDAY = "2027-07-05";
const TOMORROW = "2027-07-07";
const TUESDAY = 2;
const WEDNESDAY = 3;

/** A time on Tuesday 6 July 2027, camp local time (EDT, UTC-4). */
function tuesdayAt(time: string) {
  return new Date(`${TODAY}T${time}:00-04:00`);
}

const BEFORE_OPEN = tuesdayAt("09:29");
const OPEN = tuesdayAt("09:30");
const MORNING = tuesdayAt("10:15");
const LAST_MINUTE = tuesdayAt("10:59");
const LOCK = tuesdayAt("11:00");
const AFTERNOON = tuesdayAt("15:00");

let test: TestDatabase;
let admin: AccountHolder;
let rowan: AccountHolder; // leads Otters
let sky: AccountHolder; // leads Herons
let otters: string;
let herons: string;
let falcons: string;
let archery: string; // Team 2, Tuesday: 2 places per period
let crafts: string; // Team 2, Tuesday: 10 places, at most 1 per group
let baking: string; // Team 2, Wednesday
let climbing: string; // Team 4, Tuesday
let camper: Record<string, string>;

const as = (actor: CampHqActor, now = MORNING): CampHqRequest => ({ actor, now });

async function slotAt(groupId: string, weekday: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const schedule = await test.campHq.getGroupSchedule(as(admin), groupId);
  const slot = schedule.days
    .find((day) => day.weekday === weekday)!
    .slots.find((entry) => entry.start === hours * 60 + minutes);
  if (!slot) throw new Error(`No slot at ${time}`);
  return slot;
}

async function makeClubDay(groupId: string, weekday: number, time: string) {
  const slot = await slotAt(groupId, weekday, time);
  await test.campHq.setScheduleSlotContent(as(admin), slot.id, { type: "club-day" });
}

async function addOption(
  team: number,
  weekday: number,
  activityId: string,
  maxPerPeriod: number,
  maxPerGroup: number | null = null,
) {
  const option = await test.campHq.addClubDayOption(as(admin), {
    team,
    weekday,
    activityId,
    maxPerPeriod,
    maxPerGroup,
  });
  return option.id;
}

function day(camperId: string, name: string, date: string, campGroup: string, expected = true): CamperLoadRow {
  return { camperId, name, date, campGroup, expected };
}

async function refusal(promise: Promise<unknown>): Promise<CampHqRefusal> {
  try {
    await promise;
  } catch (error) {
    if (isCampHqRefusal(error)) return error;
    throw error;
  }
  throw new Error("Expected a refusal");
}

function pick(
  who: AccountHolder,
  camperName: string,
  period: number,
  optionId: string | null,
  { now = MORNING, date = TODAY }: { now?: Date; date?: string } = {},
) {
  return test.campHq.setClubDayPick(as(who, now), {
    camperId: camper[camperName],
    date,
    period,
    optionId,
  });
}

async function signups(who: AccountHolder, groupId: string, now = MORNING) {
  return test.campHq.getClubDaySignups(as(who, now), groupId);
}

function picksOf(view: ClubDaySignups, camperName: string) {
  return view.campers.find((entry) => entry.name === camperName)?.picks;
}

function placesOf(view: ClubDaySignups, optionId: string) {
  return view.options.find((option) => option.id === optionId)?.places;
}

beforeEach(async () => {
  test = await createCampHqTestDatabase({ seedLists: false });
  admin = await test.addAccountHolder("Avery Pine", "admin");
  rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
  sky = await test.addAccountHolder("Sky Maple", "senior_staff");
  const campHq = test.campHq;
  const asAdmin = as(admin);
  const grades = ["grade_3", "grade_6"];
  otters = (await campHq.addCampGroup(asAdmin, { name: "Otters", grades: ["grade_3"], team: 2 })).id;
  herons = (await campHq.addCampGroup(asAdmin, { name: "Herons", grades: ["grade_3"], team: 2 })).id;
  falcons = (await campHq.addCampGroup(asAdmin, { name: "Falcons", grades: ["grade_6"], team: 4 })).id;
  await campHq.setGroupLeader(asAdmin, otters, rowan.staffMemberId);
  await campHq.setGroupLeader(asAdmin, herons, sky.staffMemberId);

  // Otters have two Club day periods on Tuesday, Herons one.
  await makeClubDay(otters, TUESDAY, "14:00");
  await makeClubDay(otters, TUESDAY, "14:30");
  await makeClubDay(herons, TUESDAY, "14:00");
  await makeClubDay(falcons, TUESDAY, "14:00");
  await makeClubDay(otters, WEDNESDAY, "14:00");

  const add = async (name: string, kind: "exclusive" | "shared", clubOnly = false) =>
    (await campHq.addActivity(asAdmin, { name, grades, kind, clubOnly })).id;
  const archeryActivity = await add("Archery", "exclusive");
  const craftsActivity = await add("Crafts", "shared");
  const bakingActivity = await add("Baking Club", "exclusive", true);
  const climbingActivity = await add("Climbing Wall", "exclusive");
  archery = await addOption(2, TUESDAY, archeryActivity, 2);
  crafts = await addOption(2, TUESDAY, craftsActivity, 10, 1);
  baking = await addOption(2, WEDNESDAY, bakingActivity, 10);
  climbing = await addOption(4, TUESDAY, climbingActivity, 10);

  await campHq.loadCampers(asAdmin, {
    source: "Sample test list",
    rows: [
      day("C1", "Ava Brookfield", TODAY, "Otters"),
      day("C1", "Ava Brookfield", TOMORROW, "Otters"),
      day("C2", "Ben Okafor", TODAY, "Otters"),
      day("C3", "Cleo Marsh", TODAY, "Otters"),
      day("C4", "Dara Quill", TODAY, "Herons"),
      day("C5", "Eli Fenwick", TODAY, "Herons"),
      day("C6", "Fay Lindqvist", TODAY, "Otters", false),
      day("C7", "Gus Harrow", TODAY, "Falcons"),
    ],
  });
  // Arranging only: the camper ids, including Fay's, who is not expected today.
  const rows = await test.db.select({ id: campers.id, name: campers.name }).from(campers);
  camper = Object.fromEntries(rows.map((entry) => [entry.name, entry.id]));
});

afterEach(async () => {
  await test.close();
});

describe("the leader's signup screen", () => {
  it("lists every child expected in the group today, with a pick for each of the group's periods", async () => {
    const view = await signups(rowan, otters);

    expect(view.date).toBe(TODAY);
    expect(view.campGroup).toMatchObject({ name: "Otters", team: 2 });
    expect(view.periods.map(({ period, start, end }) => [period, start, end])).toEqual([
      [1, 14 * 60, 14 * 60 + 30],
      [2, 14 * 60 + 30, 15 * 60],
    ]);
    expect(view.campers.map((entry) => [entry.name, entry.picks])).toEqual([
      ["Ava Brookfield", [null, null]],
      ["Ben Okafor", [null, null]],
      ["Cleo Marsh", [null, null]],
    ]);
    expect(view.window).toBe("open");
    expect(view.canEdit).toBe(true);
  });

  it("offers only the Team's options for today, with the places left in each period", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(sky, "Dara Quill", 1, crafts);

    const view = await signups(rowan, otters);

    expect(view.options.map((option) => option.activity.name)).toEqual(["Archery", "Crafts"]);
    expect(placesOf(view, archery)).toEqual([
      { period: 1, taken: 1, takenByGroup: 1, left: 1 },
      { period: 2, taken: 0, takenByGroup: 0, left: 2 },
    ]);
    // Crafts takes one child per group: a Heron's pick leaves the Otters' place.
    expect(placesOf(view, crafts)).toEqual([
      { period: 1, taken: 1, takenByGroup: 0, left: 1 },
      { period: 2, taken: 0, takenByGroup: 0, left: 1 },
    ]);
  });

  it("refuses an option of another Team or another weekday", async () => {
    expect((await refusal(pick(rowan, "Ava Brookfield", 1, climbing))).reason).toBe("invalid-input");
    const refused = await refusal(pick(rowan, "Ava Brookfield", 1, baking));
    expect(refused.reason).toBe("invalid-input");
    expect(refused.message).toBe("Baking Club is not one of Team 2's Club day options today.");
  });

  it("refuses a period the group does not have", async () => {
    const refused = await refusal(pick(sky, "Dara Quill", 2, archery));
    expect(refused.reason).toBe("invalid-input");
    expect(refused.message).toBe("Herons has one Club day period today.");
  });

  it("shows the children with no pick yet, and who goes where", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(rowan, "Ava Brookfield", 2, crafts);
    await pick(rowan, "Ben Okafor", 1, archery);

    const view = await signups(rowan, otters);

    expect(view.missing).toEqual([
      { id: camper["Ben Okafor"], name: "Ben Okafor", periods: [2] },
      { id: camper["Cleo Marsh"], name: "Cleo Marsh", periods: [1, 2] },
    ]);
    expect(view.byOption).toEqual([
      {
        period: 1,
        option: { id: archery, name: "Archery" },
        campers: [
          { id: camper["Ava Brookfield"], name: "Ava Brookfield" },
          { id: camper["Ben Okafor"], name: "Ben Okafor" },
        ],
      },
      {
        period: 2,
        option: { id: crafts, name: "Crafts" },
        campers: [{ id: camper["Ava Brookfield"], name: "Ava Brookfield" }],
      },
    ]);
  });

  it("is closed to the leader of another group", async () => {
    const refused = await refusal(signups(sky, otters));
    expect(refused.reason).toBe("not-your-group");
  });

  it("finds a child by typing part of their name", () => {
    expect(matchesCamperName("Ava Brookfield", "brook")).toBe(true);
    expect(matchesCamperName("Ava Brookfield", "ava b")).toBe(true);
    expect(matchesCamperName("Ava Brookfield", "  AVA  ")).toBe(true);
    expect(matchesCamperName("Zoë Hart", "zoe")).toBe(true);
    expect(matchesCamperName("Ava Brookfield", "ben")).toBe(false);
    expect(matchesCamperName("Ben Okafor", "")).toBe(true);
  });
});

describe("capacity", () => {
  it("refuses a full option with a clear message", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(sky, "Dara Quill", 1, archery);

    const refused = await refusal(pick(rowan, "Ben Okafor", 1, archery));

    expect(refused.reason).toBe("option-full");
    expect(refused.message).toBe(
      "Archery is full in period 1: all 2 places are taken. Choose another option.",
    );
    // Capacity is per period: period 2 still has both places.
    await pick(rowan, "Ben Okafor", 2, archery);
  });

  it("counts capacity per date", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(sky, "Dara Quill", 1, archery);
    // A week later the places are free again.
    await test.campHq.loadCampers(as(admin), {
      source: "Sample test list",
      rows: [day("C2", "Ben Okafor", "2027-07-13", "Otters"), day("C1", "Ava Brookfield", TODAY, "Otters")],
    });
    const nextTuesday = new Date("2027-07-13T10:15:00-04:00");
    await test.campHq.setClubDayPick(as(rowan, nextTuesday), {
      camperId: camper["Ben Okafor"],
      date: "2027-07-13",
      period: 1,
      optionId: archery,
    });
    const view = await signups(rowan, otters, nextTuesday);
    expect(placesOf(view, archery)?.[0]).toMatchObject({ taken: 1, left: 1 });
  });

  it("frees the place of a child who moves to a group of another Team", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(sky, "Dara Quill", 1, archery);
    // Ava moves to Falcons (Team 4); her Archery pick stays but holds no place.
    await test.campHq.loadCampers(as(admin), {
      source: "Sample test list",
      rows: [
        day("C1", "Ava Brookfield", TODAY, "Falcons"),
        day("C2", "Ben Okafor", TODAY, "Otters"),
        day("C4", "Dara Quill", TODAY, "Herons"),
      ],
    });

    await pick(rowan, "Ben Okafor", 1, archery);

    const view = await signups(rowan, otters);
    expect(placesOf(view, archery)?.[0]).toMatchObject({ taken: 2, takenByGroup: 1, left: 0 });
  });

  it("gives the last place to one of two leaders picking at the same moment, and refuses the other", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);

    const results = await Promise.allSettled([
      pick(rowan, "Ben Okafor", 1, archery),
      pick(sky, "Dara Quill", 1, archery),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((result) => result.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect(isCampHqRefusal(rejected[0].reason, "option-full")).toBe(true);
    const view = await signups(admin, otters);
    expect(placesOf(view, archery)?.[0]).toMatchObject({ taken: 2, left: 0 });
  });

  it("enforces the per-group maximum when it is set", async () => {
    await pick(rowan, "Ava Brookfield", 1, crafts);

    const refused = await refusal(pick(rowan, "Ben Okafor", 1, crafts));

    expect(refused.reason).toBe("group-limit");
    expect(refused.message).toBe(
      "Crafts takes at most 1 child from Otters in period 1, and that many already have it. Choose another option.",
    );
    // Another group, and another period, have their own places.
    await pick(sky, "Dara Quill", 1, crafts);
    await pick(rowan, "Ben Okafor", 2, crafts);
  });

  it("has no per-group maximum when it is not set", async () => {
    await pick(rowan, "Ava Brookfield", 2, archery);
    await pick(rowan, "Ben Okafor", 2, archery);
    expect(placesOf(await signups(rowan, otters), archery)?.[1]).toMatchObject({
      takenByGroup: 2,
      left: 0,
    });
  });
});

describe("changing picks", () => {
  it("lets the leader change and clear a pick while signups are open, freeing the place", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(rowan, "Ava Brookfield", 1, crafts);
    let view = await signups(rowan, otters);
    expect(picksOf(view, "Ava Brookfield")).toEqual([crafts, null]);
    expect(placesOf(view, archery)?.[0]).toMatchObject({ taken: 0, left: 2 });

    await pick(rowan, "Ava Brookfield", 1, null);
    view = await signups(rowan, otters);
    expect(picksOf(view, "Ava Brookfield")).toEqual([null, null]);
  });

  it("keeps a child's own place when the same pick is saved again on a full option", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(sky, "Dara Quill", 1, archery);
    await pick(rowan, "Ava Brookfield", 1, archery);
  });

  it("allows the same activity in both periods", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(rowan, "Ava Brookfield", 2, archery);
    expect(picksOf(await signups(rowan, otters), "Ava Brookfield")).toEqual([archery, archery]);
  });

  it("refuses a child who is not expected today", async () => {
    const refused = await refusal(
      test.campHq.setClubDayPick(as(rowan), {
        camperId: camper["Fay Lindqvist"],
        date: TODAY,
        period: 1,
        optionId: archery,
      }),
    );
    expect(refused.reason).toBe("not-expected");
  });

  it("refuses removing an option a child has picked", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    const refused = await refusal(test.campHq.removeClubDayOption(as(admin), archery));
    expect(refused.reason).toBe("in-use");
  });
});

describe("who and when", () => {
  it("refuses everyone before signups open, Admins included", async () => {
    for (const who of [rowan, admin]) {
      const refused = await refusal(pick(who, "Ava Brookfield", 1, archery, { now: BEFORE_OPEN }));
      expect(refused.reason).toBe("signups-not-open");
      expect(refused.message).toBe(
        "Club day signups open at 9:30 AM. Picks cannot be entered before then.",
      );
    }
    const view = await signups(rowan, otters, BEFORE_OPEN);
    expect(view.window).toBe("before-open");
    expect(view.canEdit).toBe(false);
  });

  it("opens signups at the open time", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery, { now: OPEN });
  });

  it("refuses picks for a later day, even while today's signups are open, Admins included", async () => {
    for (const who of [rowan, admin]) {
      const refused = await refusal(
        pick(who, "Ava Brookfield", 1, baking, { date: TOMORROW, now: MORNING }),
      );
      expect(refused.reason).toBe("signups-not-open");
    }
  });

  it("refuses picks for an earlier day", async () => {
    const refused = await refusal(pick(admin, "Ava Brookfield", 1, archery, { date: YESTERDAY }));
    expect(refused.reason).toBe("not-today");
  });

  it("refuses a leader entering a pick for another group's child", async () => {
    const refused = await refusal(pick(sky, "Ava Brookfield", 1, archery));
    expect(refused.reason).toBe("not-your-group");
    expect(refused.message).toBe(
      "This child is in Otters today. Only its leader or an Admin can enter their pick.",
    );
  });

  it("refuses staff who lead no group", async () => {
    const sasha = await test.addAccountHolder("Sasha Reed", "senior_staff");
    expect((await refusal(pick(sasha, "Ava Brookfield", 1, archery))).reason).toBe(
      "not-your-group",
    );
  });

  it("makes the leader's picks read-only at the lock", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery, { now: LAST_MINUTE });

    const refused = await refusal(pick(rowan, "Ava Brookfield", 1, crafts, { now: LOCK }));

    expect(refused.reason).toBe("signups-locked");
    expect(refused.message).toBe(
      "Club day signups locked at 11:00 AM. Only an Admin can change a pick now.",
    );
    expect((await refusal(pick(rowan, "Ben Okafor", 1, crafts, { now: AFTERNOON }))).reason).toBe(
      "signups-locked",
    );
    const view = await signups(rowan, otters, LOCK);
    expect(view.window).toBe("locked");
    expect(view.canEdit).toBe(false);
    expect(picksOf(view, "Ava Brookfield")).toEqual([archery, null]);
  });

  it("lets an Admin change picks after the lock, still within capacity", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(admin, "Ava Brookfield", 1, crafts, { now: LOCK });
    await pick(admin, "Ben Okafor", 2, archery, { now: AFTERNOON });

    const view = await signups(admin, otters, AFTERNOON);
    expect(view.canEdit).toBe(true);
    expect(picksOf(view, "Ava Brookfield")).toEqual([crafts, null]);
    expect(picksOf(view, "Ben Okafor")).toEqual([null, archery]);
    expect((await refusal(pick(admin, "Cleo Marsh", 1, crafts, { now: AFTERNOON }))).reason).toBe(
      "group-limit",
    );
  });

  it("follows the signup times an Admin sets", async () => {
    await test.campHq.setClubDaySignupTimes(as(admin), { open: "08:00", lock: "09:15" });
    await pick(rowan, "Ava Brookfield", 1, archery, { now: tuesdayAt("08:00") });
    const refused = await refusal(pick(rowan, "Ben Okafor", 1, archery, { now: tuesdayAt("09:15") }));
    expect(refused.message).toBe(
      "Club day signups locked at 9:15 AM. Only an Admin can change a pick now.",
    );
  });
});

describe("children with no pick at the lock", () => {
  it("lists every expected child missing a pick, by group, for Admins", async () => {
    await pick(rowan, "Ava Brookfield", 1, archery);
    await pick(rowan, "Ava Brookfield", 2, crafts);
    await pick(rowan, "Ben Okafor", 1, archery);
    await pick(sky, "Dara Quill", 1, crafts);

    const missing = await test.campHq.getMissingClubDayPicks(as(admin, LOCK));

    expect(missing.window).toBe("locked");
    expect(
      missing.groups.map((group) => [
        group.campGroup.name,
        group.campers.map((entry) => [entry.name, entry.periods]),
      ]),
    ).toEqual([
      ["Falcons", [["Gus Harrow", [1]]]],
      ["Herons", [["Eli Fenwick", [1]]]],
      [
        "Otters",
        [
          ["Ben Okafor", [2]],
          ["Cleo Marsh", [1, 2]],
        ],
      ],
    ]);
  });

  it("is for Admins only", async () => {
    const refused = await refusal(test.campHq.getMissingClubDayPicks(as(rowan, LOCK)));
    expect(refused.reason).toBe("admins-only");
  });
});
