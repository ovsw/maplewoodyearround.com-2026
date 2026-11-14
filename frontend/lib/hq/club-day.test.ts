// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { isCampHqRefusal, type CampHqRefusal, type CampHqRequest } from "./operations";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;

afterEach(async () => {
  await test?.close();
});

const MONDAY = 1;
const TUESDAY = 2;

/** Invented Camp groups and activities: Otters and Herons are Team 2, Falcons Team 4. */
async function start() {
  test = await createCampHqTestDatabase({ seedLists: false });
  const admin: CampHqRequest = {
    actor: await test.addAccountHolder("Avery Pine", "admin"),
    now: TEST_NOW,
  };
  const leaderActor = await test.addAccountHolder("Rowan Birch", "senior_staff");
  const leader: CampHqRequest = { actor: leaderActor, now: TEST_NOW };
  const specialist = await test.addAccountHolder("Sasha Reed", "senior_staff");
  const campHq = test.campHq;
  const grades = ["grade_3", "grade_4", "grade_5", "grade_6"];
  const otters = await campHq.addCampGroup(admin, { name: "Otters", grades: ["grade_3"], team: 2 });
  const herons = await campHq.addCampGroup(admin, { name: "Herons", grades: ["grade_3"], team: 2 });
  const falcons = await campHq.addCampGroup(admin, { name: "Falcons", grades: ["grade_6"], team: 4 });
  const archery = await campHq.addActivity(admin, { name: "Archery", grades, kind: "exclusive" });
  const climbing = await campHq.addActivity(admin, { name: "Climbing Wall", grades, kind: "exclusive" });
  const crafts = await campHq.addActivity(admin, { name: "Crafts", grades, kind: "shared" });
  const baking = await campHq.addActivity(admin, {
    name: "Baking Club",
    grades,
    kind: "exclusive",
    clubOnly: true,
  });
  return {
    campHq,
    admin,
    leader,
    specialist,
    otters,
    herons,
    falcons,
    archery,
    climbing,
    crafts,
    baking,
  };
}

type Setup = Awaited<ReturnType<typeof start>>;

/** The slot of the group's day that starts at this time ("10:00"). */
async function slotAt(setup: Setup, groupId: string, weekday: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const schedule = await setup.campHq.getGroupSchedule(setup.admin, groupId);
  const slot = schedule.days
    .find((entry) => entry.weekday === weekday)!
    .slots.find((entry) => entry.start === hours * 60 + minutes);
  if (!slot) throw new Error(`No slot at ${time}`);
  return slot;
}

async function book(setup: Setup, groupId: string, weekday: number, time: string, activityId: string) {
  const slot = await slotAt(setup, groupId, weekday, time);
  return setup.campHq.setScheduleSlotContent(setup.admin, slot.id, { type: "activity", activityId });
}

async function makeClubDay(setup: Setup, groupId: string, weekday: number, time: string) {
  const slot = await slotAt(setup, groupId, weekday, time);
  return setup.campHq.setScheduleSlotContent(setup.admin, slot.id, { type: "club-day" });
}

async function addOption(setup: Setup, team: number, weekday: number, activityId: string, maxPerPeriod = 12) {
  return setup.campHq.addClubDayOption(setup.admin, { team, weekday, activityId, maxPerPeriod });
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

describe("Club day options", () => {
  it("lets an Admin give each Team its own options per weekday, from any activity", async () => {
    const setup = await start();
    const { campHq, admin } = setup;

    await addOption(setup, 2, MONDAY, setup.archery.id);
    await addOption(setup, 2, MONDAY, setup.baking.id);
    await addOption(setup, 4, MONDAY, setup.climbing.id);
    await addOption(setup, 2, TUESDAY, setup.climbing.id);

    const { options } = await campHq.getClubDaySetup(admin);
    expect(
      options.map((option) => [option.team, option.weekday, option.activity.name]),
    ).toEqual([
      [2, MONDAY, "Archery"],
      [2, MONDAY, "Baking Club"],
      [2, TUESDAY, "Climbing Wall"],
      [4, MONDAY, "Climbing Wall"],
    ]);
  });

  it("refuses the same activity twice for one Team and weekday", async () => {
    const setup = await start();
    await addOption(setup, 2, MONDAY, setup.archery.id);

    const refused = await refusal(addOption(setup, 2, MONDAY, setup.archery.id));

    expect(refused.reason).toBe("option-exists");
  });

  it("keeps Club day only activities out of the schedule builder", async () => {
    const setup = await start();
    const { campHq, admin, otters, baking } = setup;
    const slot = await slotAt(setup, otters.id, MONDAY, "10:00");

    const { choices } = await campHq.getSlotChoices(admin, slot.id);
    expect(choices.map((choice) => choice.activity.name)).not.toContain("Baking Club");
    const refused = await refusal(book(setup, otters.id, MONDAY, "10:00", baking.id));
    expect(refused.reason).toBe("club-day-only");

    const { activities } = await campHq.getClubDaySetup(admin);
    expect(activities.find((activity) => activity.id === baking.id)?.clubOnly).toBe(true);
  });

  it("refuses to make a booked activity Club day only", async () => {
    const setup = await start();
    const { campHq, admin, otters, archery } = setup;
    await book(setup, otters.id, MONDAY, "10:00", archery.id);

    const refused = await refusal(
      campHq.updateActivity(admin, archery.id, { name: "Archery", grades: archery.grades, clubOnly: true }),
    );

    expect(refused.reason).toBe("in-use");
    expect(refused.usedIn).toEqual(["Schedule of Otters, Monday 10:00 AM to 10:30 AM"]);
  });

  it("keeps an activity that is a Club day option from being removed", async () => {
    const setup = await start();
    await addOption(setup, 2, MONDAY, setup.archery.id);

    const refused = await refusal(setup.campHq.removeActivity(setup.admin, setup.archery.id));

    expect(refused.reason).toBe("in-use");
    expect(refused.usedIn).toEqual(["Club day option for Team 2, Monday"]);
  });

  it("lets an Admin remove an option", async () => {
    const setup = await start();
    const option = await addOption(setup, 2, MONDAY, setup.archery.id);

    await setup.campHq.removeClubDayOption(setup.admin, option.id);

    expect((await setup.campHq.getClubDaySetup(setup.admin)).options).toEqual([]);
  });
});

describe("Club day capacity", () => {
  it("has a maximum per period and no maximum per Camp group by default", async () => {
    const setup = await start();

    const option = await addOption(setup, 2, MONDAY, setup.archery.id, 16);

    expect(option).toMatchObject({ maxPerPeriod: 16, maxPerGroup: null });
  });

  it("takes an optional maximum per Camp group, no higher than the maximum per period", async () => {
    const setup = await start();
    const { campHq, admin } = setup;

    const option = await campHq.addClubDayOption(admin, {
      team: 2,
      weekday: MONDAY,
      activityId: setup.archery.id,
      maxPerPeriod: "16",
      maxPerGroup: "6",
    });
    expect(option).toMatchObject({ maxPerPeriod: 16, maxPerGroup: 6 });

    const tooMany = await refusal(
      campHq.updateClubDayOption(admin, option.id, { maxPerPeriod: 10, maxPerGroup: 11 }),
    );
    expect(tooMany.reason).toBe("invalid-input");

    const changed = await campHq.updateClubDayOption(admin, option.id, {
      maxPerPeriod: 20,
      maxPerGroup: "",
    });
    expect(changed).toMatchObject({ maxPerPeriod: 20, maxPerGroup: null });
    expect((await campHq.getClubDaySetup(admin)).options[0]).toMatchObject({
      maxPerPeriod: 20,
      maxPerGroup: null,
    });
  });

  it.each([0, -3, 2.5, "", "lots", 501])("refuses %j as the maximum per period", async (value) => {
    const setup = await start();

    const refused = await refusal(
      setup.campHq.addClubDayOption(setup.admin, {
        team: 2,
        weekday: MONDAY,
        activityId: setup.archery.id,
        maxPerPeriod: value,
      }),
    );

    expect(refused.reason).toBe("invalid-input");
  });

  it("refuses a Team or weekday that does not exist", async () => {
    const setup = await start();

    for (const [team, weekday] of [
      [5, MONDAY],
      [2, 6],
    ]) {
      const refused = await refusal(addOption(setup, team, weekday, setup.archery.id));
      expect(refused.reason).toBe("invalid-input");
    }
  });
});

describe("Club day signup times", () => {
  it("open at 9:30 and lock at 11:00 until an Admin changes them", async () => {
    const setup = await start();
    const { campHq, admin, leader } = setup;

    expect(await campHq.getClubDaySettings(leader)).toEqual({ signupOpen: 570, signupLock: 660 });

    await campHq.setClubDaySignupTimes(admin, { open: "09:45", lock: "11:15" });

    expect(await campHq.getClubDaySettings(leader)).toEqual({ signupOpen: 585, signupLock: 675 });
    expect((await campHq.getClubDaySetup(admin)).settings).toEqual({
      signupOpen: 585,
      signupLock: 675,
    });
  });

  it("must lock after they open", async () => {
    const setup = await start();

    const refused = await refusal(
      setup.campHq.setClubDaySignupTimes(setup.admin, { open: "11:00", lock: "11:00" }),
    );

    expect(refused.reason).toBe("invalid-input");
    expect(await setup.campHq.getClubDaySettings(setup.admin)).toEqual({
      signupOpen: 570,
      signupLock: 660,
    });
  });
});

describe("who can change Club day", () => {
  it("refuses every change from someone who is not an Admin", async () => {
    const setup = await start();
    const { campHq, leader } = setup;
    const option = await addOption(setup, 2, MONDAY, setup.archery.id);

    const attempts = [
      campHq.getClubDaySetup(leader),
      campHq.addClubDayOption(leader, {
        team: 2,
        weekday: TUESDAY,
        activityId: setup.archery.id,
        maxPerPeriod: 10,
      }),
      campHq.updateClubDayOption(leader, option.id, { maxPerPeriod: 30 }),
      campHq.removeClubDayOption(leader, option.id),
      campHq.setClubDaySignupTimes(leader, { open: "08:00", lock: "12:00" }),
    ];
    for (const attempt of attempts) {
      expect((await refusal(attempt)).reason).toBe("admins-only");
    }
    expect((await campHq.getClubDaySetup(setup.admin)).options[0]).toMatchObject({
      maxPerPeriod: 12,
    });
  });
});

describe("the gaps view", () => {
  it("lists Club day options whose activity has no specialist", async () => {
    const setup = await start();
    const { campHq, admin, specialist } = setup;
    await addOption(setup, 2, MONDAY, setup.archery.id);
    const baking = await addOption(setup, 4, TUESDAY, setup.baking.id);
    await campHq.setActivitySpecialist(admin, setup.archery.id, specialist.staffMemberId);

    const { gaps } = await campHq.getAssignmentBoard(admin);

    expect(gaps.clubDayOptionsWithoutSpecialist).toEqual([
      { id: baking.id, name: "Baking Club (Team 4 Tuesday)" },
    ]);
  });
});

// PROVISIONAL rule, until Maplewood confirms it: an Exclusive activity cannot be
// booked while it is a Club day option in an overlapping Club day period.
describe("the provisional Club day overlap rule", () => {
  it("refuses booking an Exclusive activity during a Club day period where it is an option", async () => {
    const setup = await start();
    const { otters, falcons, archery } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await addOption(setup, 2, MONDAY, archery.id);

    const refused = await refusal(book(setup, falcons.id, MONDAY, "10:00", archery.id));

    expect(refused.reason).toBe("club-day-clash");
    expect(refused.other).toEqual({ kind: "camp-group", id: otters.id, name: "Otters" });
    expect(refused.message).toContain("Club day option for Team 2");
    expect(refused.message).toContain("Otters");
  });

  it("refuses adding the option when the booking already exists", async () => {
    const setup = await start();
    const { otters, falcons, archery } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await book(setup, falcons.id, MONDAY, "10:00", archery.id);

    const refused = await refusal(addOption(setup, 2, MONDAY, archery.id));

    expect(refused.reason).toBe("club-day-clash");
    expect(refused.other).toEqual({ kind: "camp-group", id: falcons.id, name: "Falcons" });
    expect((await setup.campHq.getClubDaySetup(setup.admin)).options).toEqual([]);
  });

  it("refuses making a slot a Club day period, or moving one, onto such a booking", async () => {
    const setup = await start();
    const { campHq, admin, otters, falcons, archery } = setup;
    await addOption(setup, 2, MONDAY, archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", archery.id);

    const refused = await refusal(makeClubDay(setup, otters.id, MONDAY, "10:00"));
    expect(refused.reason).toBe("club-day-clash");
    expect(refused.other).toMatchObject({ name: "Falcons" });

    await campHq.removeScheduleSlot(admin, (await slotAt(setup, otters.id, MONDAY, "10:00")).id);
    const period = await makeClubDay(setup, otters.id, MONDAY, "10:30");
    const moved = await refusal(
      campHq.changeScheduleSlotTimes(admin, period.id, { start: "10:15", end: "11:00" }),
    );
    expect(moved.reason).toBe("club-day-clash");
  });

  it("allows back to back, other weekdays, other Teams' days and Shared activities", async () => {
    const setup = await start();
    const { otters, herons, falcons, archery, crafts } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await addOption(setup, 2, MONDAY, archery.id);
    await addOption(setup, 2, MONDAY, crafts.id);
    await addOption(setup, 4, TUESDAY, archery.id);

    await book(setup, falcons.id, MONDAY, "10:30", archery.id);
    await book(setup, falcons.id, MONDAY, "9:30", archery.id);
    await book(setup, herons.id, TUESDAY, "10:00", archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", crafts.id);
  });

  it("checks every Club day period of the Team on that weekday", async () => {
    const setup = await start();
    const { otters, herons, falcons, archery } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await makeClubDay(setup, herons.id, MONDAY, "13:00");
    await addOption(setup, 2, MONDAY, archery.id);

    const refused = await refusal(book(setup, falcons.id, MONDAY, "13:00", archery.id));

    expect(refused.other).toMatchObject({ name: "Herons" });
  });

  it("refuses moving a Camp group to a Team whose option clashes with a booking", async () => {
    const setup = await start();
    const { campHq, admin, otters, falcons, archery } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await addOption(setup, 4, MONDAY, archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", archery.id);
    const values = { name: "Otters", grades: ["grade_3"] };

    const refused = await refusal(campHq.updateCampGroup(admin, otters.id, { ...values, team: 4 }));

    expect(refused.reason).toBe("club-day-clash");
    expect(refused.other).toMatchObject({ name: "Falcons" });
    expect((await campHq.getCampGroup(admin, otters.id)).team).toBe(2);
    await campHq.updateCampGroup(admin, otters.id, { ...values, team: 3 });
  });

  it("refuses making a Shared activity Exclusive while it is booked during its own option", async () => {
    const setup = await start();
    const { campHq, admin, otters, falcons, crafts } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await addOption(setup, 2, MONDAY, crafts.id);
    await book(setup, falcons.id, MONDAY, "10:00", crafts.id);

    const refused = await refusal(
      campHq.updateActivity(admin, crafts.id, { name: "Crafts", grades: crafts.grades, kind: "exclusive" }),
    );

    expect(refused.reason).toBe("club-day-clash");
    expect((await campHq.getActivity(admin, crafts.id)).kind).toBe("shared");
  });
});

describe("one specialist in one place at a time", () => {
  async function withSpecialist() {
    const setup = await start();
    const { campHq, admin, specialist, archery, climbing } = setup;
    await campHq.setActivitySpecialist(admin, archery.id, specialist.staffMemberId);
    await campHq.setActivitySpecialist(admin, climbing.id, specialist.staffMemberId);
    return setup;
  }

  it("refuses a booking that puts the specialist's activities in use at overlapping times", async () => {
    const setup = await withSpecialist();
    const { otters, falcons, archery, climbing, specialist } = setup;
    await book(setup, otters.id, MONDAY, "10:00", archery.id);

    const refused = await refusal(book(setup, falcons.id, MONDAY, "10:00", climbing.id));

    expect(refused.reason).toBe("specialist-clash");
    expect(refused.other).toEqual({
      kind: "specialist",
      id: specialist.staffMemberId,
      name: "Sasha Reed",
    });
    expect(refused.message).toContain("Sasha Reed");

    await book(setup, falcons.id, MONDAY, "10:30", climbing.id);
  });

  it("refuses moving a booking onto another of the specialist's bookings", async () => {
    const setup = await withSpecialist();
    const { campHq, admin, otters, falcons, archery, climbing } = setup;
    await book(setup, otters.id, MONDAY, "10:00", archery.id);
    await campHq.removeScheduleSlot(admin, (await slotAt(setup, falcons.id, MONDAY, "10:00")).id);
    const later = await book(setup, falcons.id, MONDAY, "10:30", climbing.id);

    const refused = await refusal(
      campHq.changeScheduleSlotTimes(admin, later.id, { start: "10:15", end: "10:45" }),
    );

    expect(refused.reason).toBe("specialist-clash");
  });

  it("refuses an option that is in use while another of the specialist's activities is", async () => {
    const setup = await withSpecialist();
    const { otters, falcons, archery, climbing } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await book(setup, falcons.id, MONDAY, "10:00", climbing.id);

    const refused = await refusal(addOption(setup, 2, MONDAY, archery.id));

    expect(refused.reason).toBe("specialist-clash");
    expect(refused.other).toMatchObject({ kind: "specialist", name: "Sasha Reed" });
  });

  it("refuses two of the specialist's activities as options in the same Club day period", async () => {
    const setup = await withSpecialist();
    const { otters, archery, climbing } = setup;
    await makeClubDay(setup, otters.id, MONDAY, "10:00");
    await addOption(setup, 2, MONDAY, archery.id);

    const refused = await refusal(addOption(setup, 2, MONDAY, climbing.id));

    expect(refused.reason).toBe("specialist-clash");
  });

  it("refuses making a slot a Club day period that would need the specialist twice", async () => {
    const setup = await withSpecialist();
    const { otters, archery, climbing, falcons } = setup;
    await addOption(setup, 2, MONDAY, archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", climbing.id);

    const refused = await refusal(makeClubDay(setup, otters.id, MONDAY, "10:00"));

    expect(refused.reason).toBe("specialist-clash");
  });

  it("refuses an Assignment change that would put the specialist in two places", async () => {
    const setup = await start();
    const { campHq, admin, specialist, otters, falcons, archery, climbing } = setup;
    await campHq.setActivitySpecialist(admin, archery.id, specialist.staffMemberId);
    await book(setup, otters.id, MONDAY, "10:00", archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", climbing.id);

    const refused = await refusal(
      campHq.setActivitySpecialist(admin, climbing.id, specialist.staffMemberId),
    );

    expect(refused.reason).toBe("specialist-clash");
    expect(refused.other).toMatchObject({ kind: "specialist", name: "Sasha Reed" });
    const board = await campHq.getAssignmentBoard(admin);
    expect(board.activities.find((activity) => activity.id === climbing.id)?.specialist).toBeNull();
  });

  it("does not check Shared activities or different specialists", async () => {
    const setup = await withSpecialist();
    const { campHq, admin, otters, herons, falcons, archery, crafts } = setup;
    const other = await test.addAccountHolder("Jordan Vale", "senior_staff");
    await campHq.setActivitySpecialist(admin, crafts.id, setup.specialist.staffMemberId);
    await book(setup, otters.id, MONDAY, "10:00", archery.id);

    await book(setup, falcons.id, MONDAY, "10:00", crafts.id);
    await campHq.setActivitySpecialist(admin, setup.climbing.id, other.staffMemberId, {
      replacing: setup.specialist.staffMemberId,
    });
    await book(setup, herons.id, MONDAY, "10:00", setup.climbing.id);
  });

  it("refuses making a Shared activity Exclusive when it puts the specialist in two places", async () => {
    const setup = await withSpecialist();
    const { campHq, admin, otters, falcons, archery, crafts } = setup;
    await campHq.setActivitySpecialist(admin, crafts.id, setup.specialist.staffMemberId);
    await book(setup, otters.id, MONDAY, "10:00", archery.id);
    await book(setup, falcons.id, MONDAY, "10:00", crafts.id);

    const refused = await refusal(
      campHq.updateActivity(admin, crafts.id, { name: "Crafts", grades: crafts.grades, kind: "exclusive" }),
    );

    expect(refused.reason).toBe("specialist-clash");
    expect(refused.other).toMatchObject({ kind: "specialist", name: "Sasha Reed" });
  });
});
