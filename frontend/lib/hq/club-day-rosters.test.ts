// @vitest-environment node
// Club day rosters and the front desk lookup (#152), called the way a page
// would: as a given person, at a given time. Every child, group and staff
// member here is invented.
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { CamperLoadRow } from "./campers";
import type { ClubDayRoster } from "./club-day-rosters";
import { locationForActivity } from "./front-desk";
import {
  isCampHqRefusal,
  type CampHqActor,
  type CampHqRefusal,
  type CampHqRequest,
} from "./operations";
import { campers, clubDayPicks, scheduleSlots } from "./db/schema";
import { createCampHqTestDatabase } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;
type AccountHolder = Awaited<ReturnType<TestDatabase["addAccountHolder"]>>;

const TODAY = "2027-07-06"; // a Tuesday
const TOMORROW = "2027-07-07";
const NEXT_WEEK = "2027-07-13";
const TUESDAY = 2;

/** A time on Tuesday 6 July 2027, camp local time (EDT, UTC-4). */
function tuesdayAt(time: string) {
  return new Date(`${TODAY}T${time}:00-04:00`);
}

const MORNING = tuesdayAt("10:15"); // signups open; Otters are at lunch
const AFTER_LOCK = tuesdayAt("11:30");
const CLUB_DAY_PERIOD_1 = tuesdayAt("14:10");
const CLUB_DAY_PERIOD_2 = tuesdayAt("14:40");
const BEFORE_CAMP = tuesdayAt("08:00");
const AFTER_CAMP = tuesdayAt("15:30");
const SATURDAY = new Date("2027-07-10T10:15:00-04:00");

const minutes = (time: string) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

let test: TestDatabase;
let admin: AccountHolder;
let rowan: AccountHolder; // leads Otters
let sky: AccountHolder; // leads Herons
let quinn: AccountHolder; // the Archery specialist
let jules: string; // Junior staff at Archery on Club day
let otters: string;
let herons: string;
let falcons: string;
let archeryActivity: string;
let lunchActivity: string;
let archery: string; // Team 2, Tuesday: 2 places per period
let crafts: string; // Team 2, Tuesday: 10 places
let climbing: string; // Team 4, Tuesday
let camper: Record<string, string>;

const as = (actor: CampHqActor, now = AFTER_LOCK): CampHqRequest => ({ actor, now });

async function slotAt(groupId: string, weekday: number, time: string) {
  const schedule = await test.campHq.getGroupSchedule(as(admin), groupId);
  const slot = schedule.days
    .find((day) => day.weekday === weekday)!
    .slots.find((entry) => entry.start === minutes(time));
  if (!slot) throw new Error(`No slot at ${time}`);
  return slot;
}

async function makeClubDay(groupId: string, time: string) {
  const slot = await slotAt(groupId, TUESDAY, time);
  await test.campHq.setScheduleSlotContent(as(admin), slot.id, { type: "club-day" });
}

async function book(groupId: string, time: string, activityId: string) {
  const slot = await slotAt(groupId, TUESDAY, time);
  await test.campHq.setScheduleSlotContent(as(admin), slot.id, { type: "activity", activityId });
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

function pick(who: AccountHolder, camperName: string, period: number, optionId: string) {
  return test.campHq.setClubDayPick(as(who, MORNING), {
    camperId: camper[camperName],
    date: TODAY,
    period,
    optionId,
  });
}

/** A roster as a short summary: activity, Team, period and who goes. */
function summary(roster: ClubDayRoster) {
  return [
    roster.activity.name,
    roster.option.team,
    roster.period,
    roster.campers.map((entry) => entry.name),
  ];
}

beforeEach(async () => {
  test = await createCampHqTestDatabase({ seedLists: false });
  admin = await test.addAccountHolder("Avery Pine", "admin");
  rowan = await test.addAccountHolder("Rowan Birch", "senior_staff");
  sky = await test.addAccountHolder("Sky Maple", "senior_staff");
  quinn = await test.addAccountHolder("Quinn Alder", "senior_staff");
  const campHq = test.campHq;
  const asAdmin = as(admin);
  const grades = ["grade_3", "grade_6"];
  otters = (
    await campHq.addCampGroup(asAdmin, {
      name: "Otters",
      grades: ["grade_3"],
      team: 2,
      locations: { lunch: "Picnic Pavilion", freeSwim: "Big Pool" },
    })
  ).id;
  herons = (await campHq.addCampGroup(asAdmin, { name: "Herons", grades: ["grade_3"], team: 2 })).id;
  falcons = (await campHq.addCampGroup(asAdmin, { name: "Falcons", grades: ["grade_6"], team: 4 })).id;
  await campHq.setGroupLeader(asAdmin, otters, rowan.staffMemberId);
  await campHq.setGroupLeader(asAdmin, herons, sky.staffMemberId);

  const add = async (name: string, kind: "exclusive" | "shared") =>
    (await campHq.addActivity(asAdmin, { name, grades, kind })).id;
  archeryActivity = await add("Archery", "exclusive");
  lunchActivity = await add("Lunch", "shared");
  const craftsActivity = await add("Crafts", "shared");
  const climbingActivity = await add("Climbing Wall", "exclusive");
  const soccerActivity = await add("Soccer", "exclusive");

  // Every group's day runs 9:30 to 15:00 in 30-minute slots. Otters have two
  // Club day periods on Tuesday, Herons and Falcons one.
  await makeClubDay(otters, "14:00");
  await makeClubDay(otters, "14:30");
  await makeClubDay(herons, "14:00");
  await makeClubDay(falcons, "14:00");
  await book(otters, "10:00", lunchActivity);
  await book(otters, "11:00", soccerActivity);

  const addOption = async (team: number, activityId: string, maxPerPeriod: number) =>
    (await campHq.addClubDayOption(asAdmin, { team, weekday: TUESDAY, activityId, maxPerPeriod })).id;
  archery = await addOption(2, archeryActivity, 2);
  crafts = await addOption(2, craftsActivity, 10);
  climbing = await addOption(4, climbingActivity, 10);
  // A Wednesday option never shows on a Tuesday.
  await campHq.addClubDayOption(asAdmin, {
    team: 2,
    weekday: 3,
    activityId: soccerActivity,
    maxPerPeriod: 10,
  });

  await campHq.setActivitySpecialist(asAdmin, archeryActivity, quinn.staffMemberId);
  jules = (await campHq.addStaffMember(asAdmin, { name: "Jules Fern", kind: "junior" })).staffMemberId;
  await campHq.setJuniorPlacement(asAdmin, jules, {
    campGroupId: otters,
    clubDayActivityId: archeryActivity,
  });
  const kit = (await campHq.addStaffMember(asAdmin, { name: "Kit Rowe", kind: "junior" })).staffMemberId;
  await campHq.setJuniorPlacement(asAdmin, kit, { campGroupId: herons, clubDayActivityId: null });

  await campHq.loadCampers(asAdmin, {
    source: "Sample test list",
    rows: [
      // Ava's last day is tomorrow: this is her final week.
      day("C1", "Ava Brookfield", TODAY, "Otters"),
      day("C1", "Ava Brookfield", TOMORROW, "Otters"),
      day("C2", "Ben Okafor", TODAY, "Otters"),
      day("C2", "Ben Okafor", NEXT_WEEK, "Otters"),
      day("C3", "Cleo Marsh", TODAY, "Otters"),
      day("C3", "Cleo Marsh", NEXT_WEEK, "Otters"),
      day("C4", "Dara Quill", TODAY, "Herons"),
      day("C4", "Dara Quill", NEXT_WEEK, "Herons"),
      day("C6", "Fay Lindqvist", TODAY, "Otters", false),
      day("C6", "Fay Lindqvist", NEXT_WEEK, "Otters"),
      day("C7", "Gus Harrow", TODAY, "Falcons"),
      day("C7", "Gus Harrow", NEXT_WEEK, "Falcons"),
    ],
  });
  const rows = await test.db.select({ id: campers.id, name: campers.name }).from(campers);
  camper = Object.fromEntries(rows.map((entry) => [entry.name, entry.id]));

  await pick(rowan, "Ava Brookfield", 1, archery);
  await pick(rowan, "Ava Brookfield", 2, archery);
  await pick(rowan, "Cleo Marsh", 1, archery);
  await pick(rowan, "Ben Okafor", 1, crafts);
  await pick(sky, "Dara Quill", 1, crafts);
  await pick(admin, "Gus Harrow", 1, climbing);
});

afterEach(async () => {
  await test.close();
});

describe("today's Club day rosters", () => {
  it("has a roster for each of today's options and periods, with the children going", async () => {
    const { date, rosters } = await test.campHq.getClubDayRosters(as(admin));

    expect(date).toBe(TODAY);
    expect(rosters.map(summary)).toEqual([
      ["Archery", 2, 1, ["Ava Brookfield", "Cleo Marsh"]],
      ["Archery", 2, 2, ["Ava Brookfield"]],
      ["Climbing Wall", 4, 1, ["Gus Harrow"]],
      ["Crafts", 2, 1, ["Ben Okafor", "Dara Quill"]],
      ["Crafts", 2, 2, []],
    ]);
  });

  it("gives each child's Camp group, marks the children in their final week and names the staff", async () => {
    const { rosters } = await test.campHq.getClubDayRosters(as(admin));
    const archeryFirst = rosters[0];

    expect(archeryFirst.campers).toEqual([
      {
        id: camper["Ava Brookfield"],
        name: "Ava Brookfield",
        campGroup: { id: otters, name: "Otters" },
        finalWeek: true,
      },
      {
        id: camper["Cleo Marsh"],
        name: "Cleo Marsh",
        campGroup: { id: otters, name: "Otters" },
        finalWeek: false,
      },
    ]);
    expect(archeryFirst.juniorStaff).toEqual([{ id: jules, name: "Jules Fern" }]);
    expect(archeryFirst.specialist).toEqual({ id: quinn.staffMemberId, name: "Quinn Alder" });
    expect(archeryFirst.times).toEqual([{ start: minutes("14:00"), end: minutes("14:30") }]);

    const crafts = rosters.find((roster) => roster.activity.name === "Crafts")!;
    expect(crafts.campers.map((entry) => entry.campGroup.name)).toEqual(["Otters", "Herons"]);
    expect(crafts.juniorStaff).toEqual([]);
    expect(crafts.specialist).toBeNull();
  });

  it("leaves out a child who is not expected today, using the same list as the group lists", async () => {
    // Arranging only: a pick left behind for Fay, who is not expected today.
    await test.db.insert(clubDayPicks).values({
      camperId: camper["Fay Lindqvist"],
      date: TODAY,
      period: 1,
      optionId: crafts,
      updatedAt: MORNING,
    });
    const groupList = await test.campHq.getGroupCamperList(as(admin), otters);
    const { rosters } = await test.campHq.getClubDayRosters(as(admin));

    expect(groupList.campers.map((entry) => entry.name)).not.toContain("Fay Lindqvist");
    expect(rosters.flatMap((roster) => roster.campers.map((entry) => entry.name))).not.toContain(
      "Fay Lindqvist",
    );
  });

  it("opens one roster by option and period", async () => {
    const { rosters } = await test.campHq.getClubDayRosters(as(admin), {
      optionId: archery,
      period: "2",
    });

    expect(rosters.map(summary)).toEqual([["Archery", 2, 2, ["Ava Brookfield"]]]);
  });

  it("refuses a roster that does not exist today", async () => {
    const noSuchPeriod = await refusal(
      test.campHq.getClubDayRosters(as(admin), { optionId: climbing, period: 2 }),
    );
    const badId = await refusal(
      test.campHq.getClubDayRosters(as(admin), { optionId: "nope", period: 1 }),
    );

    expect(noSuchPeriod.reason).toBe("not-found");
    expect(badId.reason).toBe("not-found");
  });

  it("is for Admins only", async () => {
    const error = await refusal(test.campHq.getClubDayRosters(as(rowan)));

    expect(error.reason).toBe("admins-only");
  });

  it("has no rosters at a weekend", async () => {
    const { weekday, rosters } = await test.campHq.getClubDayRosters(as(admin, SATURDAY));

    expect(weekday).toBeNull();
    expect(rosters).toEqual([]);
  });
});

describe("a specialist's rosters", () => {
  it("shows today's roster for each Club day activity they run", async () => {
    const { rosters } = await test.campHq.getMyClubDayRosters(as(quinn));

    expect(rosters.map(summary)).toEqual([
      ["Archery", 2, 1, ["Ava Brookfield", "Cleo Marsh"]],
      ["Archery", 2, 2, ["Ava Brookfield"]],
    ]);
  });

  it("is empty for a person who runs no Club day activity", async () => {
    const { rosters } = await test.campHq.getMyClubDayRosters(as(rowan));

    expect(rosters).toEqual([]);
  });
});

describe("the front desk lookup", () => {
  async function lookUp(search: string, now: Date) {
    const { results } = await test.campHq.findChild(as(admin, now), search);
    return results;
  }

  it("shows the group's current activity and its location during a regular slot", async () => {
    const [ava] = await lookUp("ava", MORNING);

    expect(ava).toEqual({
      camper: { id: camper["Ava Brookfield"], name: "Ava Brookfield" },
      expected: true,
      campGroup: { id: otters, name: "Otters" },
      finalWeek: true,
      where: {
        kind: "activity",
        start: minutes("10:00"),
        end: minutes("10:30"),
        activity: { id: lunchActivity, name: "Lunch" },
        location: "Picnic Pavilion",
      },
    });
  });

  it("shows an activity with no group location as its own place", async () => {
    const [ben] = await lookUp("Okafor", tuesdayAt("11:10"));

    expect(ben.expected && ben.where).toMatchObject({
      kind: "activity",
      activity: { name: "Soccer" },
      location: null,
    });
  });

  it("says when nothing is booked for the group right now", async () => {
    const [dara] = await lookUp("dara", MORNING);

    expect(dara.expected && dara.where).toEqual({ kind: "nothing-booked" });
  });

  it("shows the child's Club day activity during a Club day period", async () => {
    const [ava] = await lookUp("ava b", CLUB_DAY_PERIOD_2);
    const [ben] = await lookUp("ben", CLUB_DAY_PERIOD_2);
    const [dara] = await lookUp("dara", CLUB_DAY_PERIOD_1);

    expect(ava.expected && ava.where).toEqual({
      kind: "club-day",
      start: minutes("14:30"),
      end: minutes("15:00"),
      period: 2,
      activity: { id: archeryActivity, name: "Archery" },
    });
    expect(ben.expected && ben.where).toMatchObject({ kind: "club-day", period: 2, activity: null });
    expect(dara.expected && dara.where).toMatchObject({
      kind: "club-day",
      period: 1,
      activity: { name: "Crafts" },
    });
  });

  it("says when it is outside camp hours", async () => {
    const [before] = await lookUp("cleo", BEFORE_CAMP);
    const [after] = await lookUp("cleo", AFTER_CAMP);
    const [weekend] = await lookUp("cleo", SATURDAY);

    const hours = { kind: "outside-hours", dayStart: minutes("09:30"), dayEnd: minutes("15:00") };
    expect(before.expected && before.where).toEqual(hours);
    expect(after.expected && after.where).toEqual(hours);
    // Cleo is not expected on Saturday at all.
    expect(weekend.expected).toBe(false);
  });

  it("says when the group has no schedule today", async () => {
    await test.db
      .delete(scheduleSlots)
      .where(and(eq(scheduleSlots.campGroupId, falcons), eq(scheduleSlots.weekday, TUESDAY)));

    const [gus] = await lookUp("gus", MORNING);

    expect(gus.expected && gus.where).toEqual({ kind: "no-schedule" });
  });

  it("says plainly when a child is not expected today", async () => {
    const results = await lookUp("fay", MORNING);

    expect(results).toEqual([
      { camper: { id: camper["Fay Lindqvist"], name: "Fay Lindqvist" }, expected: false },
    ]);
  });

  it("finds every child matching part of a name, by name", async () => {
    const results = await lookUp("a", MORNING);

    expect(results.map((result) => result.camper.name)).toEqual([
      "Ava Brookfield",
      "Ben Okafor",
      "Cleo Marsh",
      "Dara Quill",
      "Fay Lindqvist",
      "Gus Harrow",
    ]);
    expect(await lookUp("  ", MORNING)).toEqual([]);
    expect(await lookUp("Zed", MORNING)).toEqual([]);
  });

  it("is for Admins only", async () => {
    const error = await refusal(test.campHq.findChild(as(rowan, MORNING), "ava"));

    expect(error.reason).toBe("admins-only");
  });
});

describe("an activity's location", () => {
  it("is the group's matching location for lunch, free swim, swim lessons and changing", () => {
    const locations = {
      change: "Cabin 3",
      freeSwim: "Big Pool",
      lunch: "Picnic Pavilion",
      swimLessons: "Small Pool",
    };

    expect(locationForActivity("Lunch", locations)).toBe("Picnic Pavilion");
    expect(locationForActivity("Free Swim", locations)).toBe("Big Pool");
    expect(locationForActivity("Swimming Lessons (daily)", locations)).toBe("Small Pool");
    expect(locationForActivity("Change", locations)).toBe("Cabin 3");
    expect(locationForActivity("Archery", locations)).toBeNull();
    expect(locationForActivity("Lunch", { ...locations, lunch: "" })).toBeNull();
  });
});
