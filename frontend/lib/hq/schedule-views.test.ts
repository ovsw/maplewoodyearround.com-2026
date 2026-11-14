// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { isCampHqRefusal, type CampHqRefusal, type CampHqRequest } from "./operations";
import { campClock, isCurrentSlot } from "./schedule-times";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;

afterEach(async () => {
  await test?.close();
});

/** Camp time on Tuesday 6 July 2027 (New York is UTC-4 in summer). */
function tuesdayAt(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(2027, 6, 6, hours + 4, minutes));
}

/** Invented groups, activities and staff, with Tuesday schedules for two groups. */
async function start() {
  test = await createCampHqTestDatabase({ seedLists: false });
  const campHq = test.campHq;
  const adminActor = await test.addAccountHolder("Avery Pine", "admin");
  const leaderActor = await test.addAccountHolder("Rowan Birch", "senior_staff");
  const otherLeaderActor = await test.addAccountHolder("Sage Willow", "senior_staff");
  const specialistActor = await test.addAccountHolder("Quinn Maple", "senior_staff");
  const admin: CampHqRequest = { actor: adminActor, now: TEST_NOW };
  const as = (actor: typeof adminActor, now = TEST_NOW): CampHqRequest => ({ actor, now });

  const otters = await campHq.addCampGroup(admin, {
    name: "Otters",
    grades: ["grade_3"],
    team: 2,
    locations: { change: "Cabin 4", freeSwim: "Lake dock", lunch: "Pavilion", swimLessons: "Pool A" },
  });
  const herons = await campHq.addCampGroup(admin, {
    name: "Herons",
    grades: ["grade_3"],
    team: 2,
    locations: { change: "Cabin 7", freeSwim: "Pool B", lunch: "Dining hall", swimLessons: "Pool A" },
  });
  const archery = await campHq.addActivity(admin, {
    name: "Archery",
    grades: ["grade_3"],
    kind: "exclusive",
  });
  const lunch = await campHq.addActivity(admin, { name: "Lunch", grades: ["grade_3"], kind: "shared" });
  const pottery = await campHq.addActivity(admin, {
    name: "Pottery",
    grades: ["grade_3"],
    kind: "exclusive",
  });
  const canoeing = await campHq.addActivity(admin, {
    name: "Canoeing",
    grades: ["grade_3"],
    kind: "exclusive",
  });

  await campHq.setGroupLeader(admin, otters.id, leaderActor.staffMemberId);
  await campHq.setGroupLeader(admin, herons.id, otherLeaderActor.staffMemberId);
  await campHq.setActivitySpecialist(admin, archery.id, specialistActor.staffMemberId);
  await campHq.setActivitySpecialist(admin, canoeing.id, specialistActor.staffMemberId);

  /** Books the group's Tuesday slot that starts at `time`. */
  async function book(groupId: string, time: string, content: { activityId: string } | "club-day") {
    const schedule = await campHq.getGroupSchedule(admin, groupId);
    const [hours, minutes] = time.split(":").map(Number);
    const slot = schedule.days[1].slots.find((entry) => entry.start === hours * 60 + minutes);
    if (!slot) throw new Error(`No slot at ${time}`);
    await campHq.setScheduleSlotContent(
      admin,
      slot.id,
      content === "club-day" ? { type: "club-day" } : { type: "activity", ...content },
    );
    return slot.id;
  }

  const ottersArchery = await book(otters.id, "9:30", { activityId: archery.id });
  const ottersPottery = await book(otters.id, "10:00", { activityId: pottery.id });
  await book(otters.id, "12:00", { activityId: lunch.id });
  await book(otters.id, "13:00", "club-day");
  const heronsArchery = await book(herons.id, "10:00", { activityId: archery.id });
  await book(herons.id, "12:00", { activityId: lunch.id });

  return {
    campHq,
    admin,
    leader: as(leaderActor),
    otherLeader: as(otherLeaderActor),
    specialist: as(specialistActor),
    as,
    actors: { leaderActor, specialistActor },
    otters,
    herons,
    archery,
    lunch,
    pottery,
    canoeing,
    slots: { ottersArchery, ottersPottery, heronsArchery },
  };
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

describe("the camp clock", () => {
  it("reads the time passed in as camp local time", () => {
    expect(campClock(tuesdayAt("9:30"))).toEqual({ weekday: 2, minute: 570 });
    // 2:30 AM UTC on Wednesday is still Tuesday evening in New York.
    expect(campClock(new Date("2027-07-07T02:30:00Z"))).toEqual({ weekday: 2, minute: 22 * 60 + 30 });
    expect(campClock(new Date("2027-07-10T15:00:00Z")).weekday).toBeNull();
  });

  it("counts a slot as current from its start until just before its end", () => {
    const slot = { weekday: 2, start: 570, end: 600 };
    expect(isCurrentSlot(slot, { weekday: 2, minute: 569 })).toBe(false);
    expect(isCurrentSlot(slot, { weekday: 2, minute: 570 })).toBe(true);
    expect(isCurrentSlot(slot, { weekday: 2, minute: 599 })).toBe(true);
    expect(isCurrentSlot(slot, { weekday: 2, minute: 600 })).toBe(false);
    expect(isCurrentSlot(slot, { weekday: 3, minute: 580 })).toBe(false);
    expect(isCurrentSlot(slot, { weekday: null, minute: 580 })).toBe(false);
  });
});

describe("a group leader's view", () => {
  it("shows today's schedule with the current slot marked, the other weekdays and the locations", async () => {
    const setup = await start();

    const view = await setup.campHq.getLeaderView(
      setup.as(setup.actors.leaderActor, tuesdayAt("9:45")),
      setup.otters.id,
    );

    expect(view.group).toMatchObject({ id: setup.otters.id, name: "Otters" });
    expect(view.today).toBe(2);
    expect(view.currentSlotId).toBe(setup.slots.ottersArchery);
    expect(view.days.map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5]);
    const tuesday = view.days[1].slots.filter((slot) => slot.content.type !== "empty");
    expect(
      tuesday.map((slot) => [
        slot.start,
        slot.content.type === "activity" ? slot.content.activity.name : slot.content.type,
      ]),
    ).toEqual([
      [570, "Archery"],
      [600, "Pottery"],
      [720, "Lunch"],
      [780, "club-day"],
    ]);
    expect(view.locations).toEqual({
      change: "Cabin 4",
      freeSwim: "Lake dock",
      lunch: "Pavilion",
      swimLessons: "Pool A",
    });
  });

  it("moves the current slot at the slot's edge", async () => {
    const setup = await start();
    const at = (time: string) =>
      setup.campHq.getLeaderView(setup.as(setup.actors.leaderActor, tuesdayAt(time)), setup.otters.id);

    expect((await at("9:30")).currentSlotId).toBe(setup.slots.ottersArchery);
    expect((await at("9:59")).currentSlotId).toBe(setup.slots.ottersArchery);
    expect((await at("10:00")).currentSlotId).toBe(setup.slots.ottersPottery);
  });

  it("marks no slot outside camp hours or at the weekend", async () => {
    const setup = await start();
    const at = (now: Date) =>
      setup.campHq.getLeaderView(setup.as(setup.actors.leaderActor, now), setup.otters.id);

    expect((await at(tuesdayAt("7:00"))).currentSlotId).toBeNull();
    expect((await at(tuesdayAt("15:00"))).currentSlotId).toBeNull();
    const saturday = await at(new Date("2027-07-10T14:00:00Z"));
    expect(saturday.today).toBeNull();
    expect(saturday.currentSlotId).toBeNull();
  });

  it("is open to an Admin for any group and refused to another group's leader", async () => {
    const setup = await start();

    const asAdmin = await setup.campHq.getLeaderView(setup.admin, setup.herons.id);
    expect(asAdmin.group.name).toBe("Herons");

    const refused = await refusal(setup.campHq.getLeaderView(setup.otherLeader, setup.otters.id));
    expect(refused.reason).toBe("not-your-group");
  });

  it("is read-only for a leader: changing a slot is refused", async () => {
    const setup = await start();
    const refused = await refusal(
      setup.campHq.setScheduleSlotContent(setup.leader, setup.slots.ottersArchery, { type: "empty" }),
    );
    expect(refused.reason).toBe("admins-only");
  });

  it("shows an Admin's change on the next read", async () => {
    const setup = await start();
    await setup.campHq.setScheduleSlotContent(setup.admin, setup.slots.ottersPottery, {
      type: "activity",
      activityId: setup.canoeing.id,
    });

    const view = await setup.campHq.getLeaderView(setup.leader, setup.otters.id);
    const slot = view.days[1].slots.find((entry) => entry.id === setup.slots.ottersPottery);
    expect(slot?.content).toMatchObject({ type: "activity", activity: { name: "Canoeing" } });
  });
});

describe("a specialist's day", () => {
  it("shows which groups come to each of their activities today and when", async () => {
    const setup = await start();

    const day = await setup.campHq.getSpecialistDay(
      setup.as(setup.actors.specialistActor, tuesdayAt("10:15")),
    );

    expect(day.today).toBe(2);
    expect(
      day.activities.map(({ activity, visits }) => ({
        activity: activity.name,
        visits: visits.map((visit) => [visit.campGroup.name, visit.start, visit.end, visit.isCurrent]),
      })),
    ).toEqual([
      {
        activity: "Archery",
        visits: [
          ["Otters", 570, 600, false],
          ["Herons", 600, 630, true],
        ],
      },
      { activity: "Canoeing", visits: [] },
    ]);
  });

  it("has no visits at the weekend and no activities for someone who is not a specialist", async () => {
    const setup = await start();

    const saturday = await setup.campHq.getSpecialistDay(
      setup.as(setup.actors.specialistActor, new Date("2027-07-10T14:00:00Z")),
    );
    expect(saturday.today).toBeNull();
    expect(saturday.activities.every((entry) => entry.visits.length === 0)).toBe(true);

    const leaderDay = await setup.campHq.getSpecialistDay(setup.leader);
    expect(leaderDay.activities).toEqual([]);
  });
});

describe("the view by activity", () => {
  it("shows which group is where in each slot of a chosen weekday, for any signed-in person", async () => {
    const setup = await start();

    const board = await setup.campHq.getActivityBoard(
      setup.as(setup.actors.leaderActor, tuesdayAt("12:10")),
      2,
    );

    expect(board.weekday).toBe(2);
    expect(
      board.activities.map(({ activity, visits }) => [
        activity.name,
        visits.map((visit) => `${visit.campGroup.name} ${visit.start}${visit.isCurrent ? " now" : ""}`),
      ]),
    ).toEqual([
      ["Archery", ["Otters 570", "Herons 600"]],
      ["Lunch", ["Herons 720 now", "Otters 720 now"]],
      ["Pottery", ["Otters 600"]],
    ]);
    expect(board.clubDay.map((visit) => [visit.campGroup.name, visit.start])).toEqual([["Otters", 780]]);

    const monday = await setup.campHq.getActivityBoard(setup.leader, 1);
    expect(monday.activities).toEqual([]);
    expect((await refusal(setup.campHq.getActivityBoard(setup.leader, 6))).reason).toBe("invalid-input");
  });
});

describe("every group's locations", () => {
  it("lists the change, free swim, lunch and swim lesson locations of all groups", async () => {
    const setup = await start();

    const list = await setup.campHq.listGroupLocations(setup.specialist);

    expect(list.map((entry) => [entry.name, entry.locations])).toEqual([
      ["Herons", { change: "Cabin 7", freeSwim: "Pool B", lunch: "Dining hall", swimLessons: "Pool A" }],
      ["Otters", { change: "Cabin 4", freeSwim: "Lake dock", lunch: "Pavilion", swimLessons: "Pool A" }],
    ]);
  });

  it("is refused to an account without a staff record", async () => {
    const setup = await start();
    const stranger: CampHqRequest = {
      actor: { type: "account", clerkUserId: "user_test_nobody" },
      now: TEST_NOW,
    };
    expect((await refusal(setup.campHq.listGroupLocations(stranger))).reason).toBe("no-staff-record");
    expect((await refusal(setup.campHq.getSpecialistDay(stranger))).reason).toBe("no-staff-record");
  });
});
