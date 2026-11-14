// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { isCampHqRefusal, type CampHqRefusal, type CampHqRequest } from "./operations";
import type { ScheduleDay } from "./schedules";
import { createCampHqTestDatabase, TEST_NOW } from "./test/camp-hq-test-database";

type TestDatabase = Awaited<ReturnType<typeof createCampHqTestDatabase>>;

let test: TestDatabase;

afterEach(async () => {
  await test?.close();
});

/** Two groups of 3rd graders and one of 6th graders, with invented activities. */
async function start() {
  test = await createCampHqTestDatabase({ seedLists: false });
  const admin: CampHqRequest = {
    actor: await test.addAccountHolder("Avery Pine", "admin"),
    now: TEST_NOW,
  };
  const leader: CampHqRequest = {
    actor: await test.addAccountHolder("Rowan Birch", "senior_staff"),
    now: TEST_NOW,
  };
  const campHq = test.campHq;
  const otters = await campHq.addCampGroup(admin, { name: "Otters", grades: ["grade_3"], team: 2 });
  const herons = await campHq.addCampGroup(admin, { name: "Herons", grades: ["grade_3"], team: 2 });
  const falcons = await campHq.addCampGroup(admin, { name: "Falcons", grades: ["grade_6"], team: 4 });
  const archery = await campHq.addActivity(admin, {
    name: "Archery",
    grades: ["grade_3", "grade_4", "grade_5", "grade_6"],
    kind: "exclusive",
  });
  const lunch = await campHq.addActivity(admin, {
    name: "Lunch",
    grades: ["grade_3", "grade_6"],
    kind: "shared",
  });
  const climbing = await campHq.addActivity(admin, {
    name: "Climbing Wall",
    grades: ["grade_6"],
    kind: "exclusive",
  });
  return { campHq, admin, leader, otters, herons, falcons, archery, lunch, climbing };
}

type Setup = Awaited<ReturnType<typeof start>>;

async function day(setup: Setup, groupId: string, weekday: number): Promise<ScheduleDay> {
  const schedule = await setup.campHq.getGroupSchedule(setup.admin, groupId);
  return schedule.days.find((entry) => entry.weekday === weekday)!;
}

/** The slot of the group's day that starts at this time ("9:30"). */
async function slotAt(setup: Setup, groupId: string, weekday: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const slot = (await day(setup, groupId, weekday)).slots.find(
    (entry) => entry.start === hours * 60 + minutes,
  );
  if (!slot) throw new Error(`No slot at ${time}`);
  return slot;
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

describe("a Camp group's weekly schedule", () => {
  it("has Monday to Friday, each starting with eleven empty 30-minute slots from 9:30", async () => {
    const setup = await start();

    const schedule = await setup.campHq.getGroupSchedule(setup.leader, setup.otters.id);

    expect(schedule.group).toMatchObject({ id: setup.otters.id, name: "Otters" });
    expect(schedule.days.map((entry) => entry.weekday)).toEqual([1, 2, 3, 4, 5]);
    for (const entry of schedule.days) {
      expect(entry.slots.map((slot) => [slot.start, slot.end])).toEqual(
        Array.from({ length: 11 }, (_, index) => [570 + index * 30, 600 + index * 30]),
      );
      expect(entry.slots.every((slot) => slot.content.type === "empty")).toBe(true);
    }
  });

  it("is the same schedule every time it is read", async () => {
    const setup = await start();
    const first = await setup.campHq.getGroupSchedule(setup.admin, setup.otters.id);
    const again = await setup.campHq.getGroupSchedule(setup.leader, setup.otters.id);
    expect(again).toEqual(first);
  });

  it("lets an Admin change a slot's times, add slots and remove slots", async () => {
    const setup = await start();
    const { campHq, admin, otters } = setup;
    const first = await slotAt(setup, otters.id, 1, "9:30");

    await campHq.changeScheduleSlotTimes(admin, first.id, { start: "09:15", end: "10:00" });
    const late = await slotAt(setup, otters.id, 1, "14:30");
    await campHq.removeScheduleSlot(admin, late.id);
    const added = await campHq.addScheduleSlot(admin, otters.id, 1, { start: "14:30", end: "15:45" });

    const monday = await day(setup, otters.id, 1);
    expect(monday.slots).toHaveLength(11);
    expect(monday.slots[0]).toMatchObject({ id: first.id, start: 555, end: 600 });
    expect(monday.slots.at(-1)).toMatchObject({ id: added.id, start: 870, end: 945 });
    expect((await day(setup, otters.id, 2)).slots[0]).toMatchObject({ start: 570, end: 600 });
  });

  it("keeps a day empty once all its slots are removed", async () => {
    const setup = await start();
    for (const slot of (await day(setup, setup.otters.id, 5)).slots) {
      await setup.campHq.removeScheduleSlot(setup.admin, slot.id);
    }
    expect((await day(setup, setup.otters.id, 5)).slots).toEqual([]);
  });

  it("refuses a slot that overlaps another slot of the same day, but allows back to back", async () => {
    const setup = await start();
    const { campHq, admin, otters } = setup;
    const second = await slotAt(setup, otters.id, 1, "10:00");

    const overlap = await refusal(
      campHq.changeScheduleSlotTimes(admin, second.id, { start: "09:45", end: "10:30" }),
    );
    expect(overlap.reason).toBe("slot-overlap");
    expect(overlap.message).toContain("9:30 AM to 10:00 AM");
    expect(
      (await refusal(campHq.addScheduleSlot(admin, otters.id, 1, { start: "11:10", end: "11:20" })))
        .reason,
    ).toBe("slot-overlap");

    const late = await campHq.addScheduleSlot(admin, otters.id, 1, { start: "15:00", end: "15:30" });
    expect(late).toMatchObject({ start: 900, end: 930 });
  });

  it("refuses unreadable times, a slot that ends before it starts and days off Monday to Friday", async () => {
    const setup = await start();
    const { campHq, admin, otters } = setup;
    const add = (weekday: number, start: string, end: string) =>
      refusal(campHq.addScheduleSlot(admin, otters.id, weekday, { start, end }));

    expect((await add(1, "", "16:00")).reason).toBe("invalid-input");
    expect((await add(1, "16:30", "16:00")).reason).toBe("invalid-input");
    expect((await add(1, "16:00", "16:00")).reason).toBe("invalid-input");
    expect((await add(1, "25:00", "26:00")).reason).toBe("invalid-input");
    expect((await add(6, "16:00", "16:30")).reason).toBe("invalid-input");
  });
});

describe("what a slot holds", () => {
  it("holds one activity, a Club day period or nothing, with more than one Club day period a day", async () => {
    const setup = await start();
    const { campHq, admin, otters, archery } = setup;
    const [a, b, c] = (await day(setup, otters.id, 3)).slots;

    await campHq.setScheduleSlotContent(admin, a.id, { type: "activity", activityId: archery.id });
    await campHq.setScheduleSlotContent(admin, b.id, { type: "club-day" });
    await campHq.setScheduleSlotContent(admin, c.id, { type: "club-day" });

    let slots = (await day(setup, otters.id, 3)).slots;
    expect(slots[0].content).toEqual({
      type: "activity",
      activity: { id: archery.id, name: "Archery", kind: "exclusive" },
    });
    expect(slots[1].content).toEqual({ type: "club-day" });
    expect(slots[2].content).toEqual({ type: "club-day" });

    await campHq.setScheduleSlotContent(admin, a.id, { type: "club-day" });
    await campHq.setScheduleSlotContent(admin, b.id, { type: "empty" });
    slots = (await day(setup, otters.id, 3)).slots;
    expect(slots[0].content).toEqual({ type: "club-day" });
    expect(slots[1].content).toEqual({ type: "empty" });
  });
});

describe("the grade rule", () => {
  it("leaves activities not allowed for the group's grades out of the picker", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 1, "9:30");

    const { choices } = await setup.campHq.getSlotChoices(setup.admin, slot.id);

    expect(choices.map((choice) => choice.activity.name)).toEqual(["Archery", "Lunch"]);
  });

  it("leaves out an activity allowed for only some of the group's grades", async () => {
    const setup = await start();
    const mixed = await setup.campHq.addCampGroup(setup.admin, {
      name: "Wrens",
      grades: ["grade_5", "grade_6"],
      team: 3,
    });
    const slot = await slotAt(setup, mixed.id, 1, "9:30");

    const { choices } = await setup.campHq.getSlotChoices(setup.admin, slot.id);

    expect(choices.map((choice) => choice.activity.name)).toEqual(["Archery"]);
  });

  it("refuses a booking that breaks the grade rule, whatever the page sent", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 1, "9:30");

    const refused = await refusal(
      setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
        type: "activity",
        activityId: setup.climbing.id,
      }),
    );

    expect(refused.reason).toBe("grade-not-allowed");
    expect(refused.message).toBe(
      "Climbing Wall is not allowed for 3rd Grade, so Otters cannot have it.",
    );
    expect((await slotAt(setup, setup.otters.id, 1, "9:30")).content).toEqual({ type: "empty" });
  });
});

describe("Exclusive activities", () => {
  async function ottersHaveArcheryMonday930(setup: Setup) {
    const slot = await slotAt(setup, setup.otters.id, 1, "9:30");
    await setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
      type: "activity",
      activityId: setup.archery.id,
    });
  }

  it("shows an Exclusive activity another group has at the same time as unavailable, naming that group", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const slot = await slotAt(setup, setup.herons.id, 1, "9:30");

    const { choices } = await setup.campHq.getSlotChoices(setup.admin, slot.id);

    expect(choices.find((choice) => choice.activity.name === "Archery")?.bookedBy).toEqual({
      campGroupId: setup.otters.id,
      campGroupName: "Otters",
      weekday: 1,
      start: 570,
      end: 600,
    });
    expect(choices.find((choice) => choice.activity.name === "Lunch")?.bookedBy).toBeNull();
  });

  it("refuses booking it at the same time, with the reason and the other group", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const slot = await slotAt(setup, setup.herons.id, 1, "9:30");

    const refused = await refusal(
      setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
        type: "activity",
        activityId: setup.archery.id,
      }),
    );

    expect(refused.reason).toBe("clash");
    expect(refused.message).toBe(
      "Archery is an Exclusive activity and Otters already has it on Monday, 9:30 AM to 10:00 AM.",
    );
    expect(refused.other).toEqual({ kind: "camp-group", id: setup.otters.id, name: "Otters" });
    expect((await slotAt(setup, setup.herons.id, 1, "9:30")).content).toEqual({ type: "empty" });
  });

  it("refuses an overlap off the 30-minute grid", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const { campHq, admin, herons } = setup;
    // Herons' Monday becomes 9:45 to 10:15, overlapping Otters' 9:30 to 10:00.
    await campHq.removeScheduleSlot(admin, (await slotAt(setup, herons.id, 1, "9:30")).id);
    await campHq.removeScheduleSlot(admin, (await slotAt(setup, herons.id, 1, "10:00")).id);
    const offGrid = await campHq.addScheduleSlot(admin, herons.id, 1, {
      start: "09:45",
      end: "10:15",
    });

    const { choices } = await campHq.getSlotChoices(admin, offGrid.id);
    expect(choices.find((choice) => choice.activity.name === "Archery")?.bookedBy).toMatchObject({
      campGroupName: "Otters",
    });
    const refused = await refusal(
      campHq.setScheduleSlotContent(admin, offGrid.id, {
        type: "activity",
        activityId: setup.archery.id,
      }),
    );
    expect(refused.reason).toBe("clash");
    expect(refused.other?.name).toBe("Otters");
  });

  it("refuses moving a booked slot so that it overlaps another group's booking", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const { campHq, admin, herons } = setup;
    await campHq.removeScheduleSlot(admin, (await slotAt(setup, herons.id, 1, "9:30")).id);
    const heronsTen = await slotAt(setup, herons.id, 1, "10:00");
    await campHq.setScheduleSlotContent(admin, heronsTen.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    const refused = await refusal(
      campHq.changeScheduleSlotTimes(admin, heronsTen.id, { start: "09:50", end: "10:30" }),
    );

    expect(refused.reason).toBe("clash");
    expect(refused.other?.name).toBe("Otters");
    expect(await slotAt(setup, herons.id, 1, "10:00")).toMatchObject({ start: 600, end: 630 });
  });

  it("allows back-to-back bookings of the same activity", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const slot = await slotAt(setup, setup.herons.id, 1, "10:00");

    const { choices } = await setup.campHq.getSlotChoices(setup.admin, slot.id);
    expect(choices.find((choice) => choice.activity.name === "Archery")?.bookedBy).toBeNull();
    await expect(
      setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
        type: "activity",
        activityId: setup.archery.id,
      }),
    ).resolves.toMatchObject({ content: { type: "activity" } });
  });

  it("allows back-to-back bookings off the grid", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const { campHq, admin, herons } = setup;
    await campHq.removeScheduleSlot(admin, (await slotAt(setup, herons.id, 1, "9:30")).id);
    const early = await campHq.addScheduleSlot(admin, herons.id, 1, { start: "09:05", end: "09:30" });

    await expect(
      campHq.setScheduleSlotContent(admin, early.id, {
        type: "activity",
        activityId: setup.archery.id,
      }),
    ).resolves.toMatchObject({ start: 545, end: 570 });
  });

  it("does not clash with the same time on another weekday", async () => {
    const setup = await start();
    await ottersHaveArcheryMonday930(setup);
    const tuesday = await slotAt(setup, setup.herons.id, 2, "9:30");

    await expect(
      setup.campHq.setScheduleSlotContent(setup.admin, tuesday.id, {
        type: "activity",
        activityId: setup.archery.id,
      }),
    ).resolves.toMatchObject({ weekday: 2 });
  });

  it("checks bookings made after a Shared activity becomes Exclusive", async () => {
    const setup = await start();
    const { campHq, admin, otters, herons, falcons } = setup;
    const kayaks = await campHq.addActivity(admin, {
      name: "Kayaks",
      grades: ["grade_3", "grade_6"],
      kind: "shared",
    });
    const book = async (groupId: string) =>
      campHq.setScheduleSlotContent(admin, (await slotAt(setup, groupId, 4, "11:00")).id, {
        type: "activity",
        activityId: kayaks.id,
      });
    await book(otters.id);
    await book(herons.id);
    await campHq.updateActivity(admin, kayaks.id, { ...kayaks, kind: "exclusive" });

    const refused = await refusal(book(falcons.id));

    expect(refused.reason).toBe("clash");
    expect(refused.other?.name).toBe("Herons");
  });
});

describe("the choices for a whole day", () => {
  it("lists the day's slots and the activities allowed for the group's grades", async () => {
    const setup = await start();

    const choices = await setup.campHq.getDayChoices(setup.admin, setup.otters.id, 1);

    expect(choices.group.name).toBe("Otters");
    expect(choices.weekday).toBe(1);
    expect(choices.slots).toEqual((await day(setup, setup.otters.id, 1)).slots);
    expect(choices.activities.map((activity) => activity.name)).toEqual(["Archery", "Lunch"]);
  });

  it("marks an Exclusive activity only on the slots another group's booking overlaps", async () => {
    const setup = await start();
    const theirs = await slotAt(setup, setup.otters.id, 1, "9:30");
    const next = await slotAt(setup, setup.otters.id, 1, "10:00");
    await setup.campHq.removeScheduleSlot(setup.admin, next.id);
    await setup.campHq.changeScheduleSlotTimes(setup.admin, theirs.id, {
      start: "9:45",
      end: "10:15",
    });
    await setup.campHq.setScheduleSlotContent(setup.admin, theirs.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    const { slots, bookedBy } = await setup.campHq.getDayChoices(setup.admin, setup.herons.id, 1);

    const booking = {
      campGroupId: setup.otters.id,
      campGroupName: "Otters",
      weekday: 1,
      start: 585,
      end: 615,
    };
    const at = (start: number) => bookedBy[slots.find((slot) => slot.start === start)!.id];
    expect(at(570)).toEqual({ [setup.archery.id]: booking });
    expect(at(600)).toEqual({ [setup.archery.id]: booking });
    expect(at(630)).toEqual({});
  });

  it("agrees with the choices of each single slot", async () => {
    const setup = await start();
    const theirs = await slotAt(setup, setup.otters.id, 1, "9:30");
    await setup.campHq.setScheduleSlotContent(setup.admin, theirs.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    const dayChoices = await setup.campHq.getDayChoices(setup.admin, setup.herons.id, 1);

    for (const slot of dayChoices.slots) {
      const { choices } = await setup.campHq.getSlotChoices(setup.admin, slot.id);
      expect(dayChoices.activities).toEqual(choices.map((choice) => choice.activity));
      for (const { activity, bookedBy } of choices) {
        expect(dayChoices.bookedBy[slot.id][activity.id] ?? null).toEqual(bookedBy);
      }
    }
  });

  it("does not mark the group's own booking or another weekday's", async () => {
    const setup = await start();
    const own = await slotAt(setup, setup.herons.id, 1, "9:30");
    await setup.campHq.setScheduleSlotContent(setup.admin, own.id, {
      type: "activity",
      activityId: setup.archery.id,
    });
    const tuesday = await slotAt(setup, setup.otters.id, 2, "9:30");
    await setup.campHq.setScheduleSlotContent(setup.admin, tuesday.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    const { bookedBy } = await setup.campHq.getDayChoices(setup.admin, setup.herons.id, 1);

    expect(Object.values(bookedBy).every((taken) => Object.keys(taken).length === 0)).toBe(true);
  });

  it("can be read by any signed-in person and refuses a missing group or a weekend", async () => {
    const setup = await start();

    await expect(
      setup.campHq.getDayChoices(setup.leader, setup.otters.id, 1),
    ).resolves.toBeTruthy();
    expect(
      (await refusal(setup.campHq.getDayChoices(setup.admin, crypto.randomUUID(), 1))).reason,
    ).toBe("not-found");
    expect(
      (await refusal(setup.campHq.getDayChoices(setup.admin, setup.otters.id, 6))).reason,
    ).toBe("invalid-input");
  });
});

describe("Shared activities", () => {
  it("can be booked by many groups at the same time", async () => {
    const setup = await start();
    const { campHq, admin, lunch } = setup;

    for (const group of [setup.otters, setup.herons, setup.falcons]) {
      const slot = await slotAt(setup, group.id, 1, "12:00");
      await campHq.setScheduleSlotContent(admin, slot.id, { type: "activity", activityId: lunch.id });
    }

    const slot = await slotAt(setup, setup.falcons.id, 1, "12:00");
    expect(slot.content).toMatchObject({ type: "activity", activity: { name: "Lunch" } });
    const { choices } = await campHq.getSlotChoices(admin, slot.id);
    expect(choices.find((choice) => choice.activity.name === "Lunch")?.bookedBy).toBeNull();
  });
});

describe("who can change schedules", () => {
  it("lets any signed-in person read a schedule and the slot choices", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 1, "9:30");

    await expect(setup.campHq.getGroupSchedule(setup.leader, setup.otters.id)).resolves.toBeTruthy();
    await expect(setup.campHq.getSlotChoices(setup.leader, slot.id)).resolves.toBeTruthy();
  });

  it("refuses every change from someone who is not an Admin", async () => {
    const setup = await start();
    const { campHq, leader, otters, archery } = setup;
    const slot = await slotAt(setup, otters.id, 1, "9:30");

    const attempts = [
      campHq.addScheduleSlot(leader, otters.id, 1, { start: "15:00", end: "15:30" }),
      campHq.changeScheduleSlotTimes(leader, slot.id, { start: "09:00", end: "10:00" }),
      campHq.setScheduleSlotContent(leader, slot.id, { type: "activity", activityId: archery.id }),
      campHq.setScheduleSlotContent(leader, slot.id, { type: "club-day" }),
      campHq.removeScheduleSlot(leader, slot.id),
    ];
    for (const attempt of attempts) {
      expect((await refusal(attempt)).reason).toBe("admins-only");
    }
    expect(await slotAt(setup, otters.id, 1, "9:30")).toEqual(slot);
  });

  it("refuses an account without a staff record, even for reading", async () => {
    const setup = await start();
    const stranger = { actor: { type: "account" as const, clerkUserId: "user_nobody" }, now: TEST_NOW };

    expect((await refusal(setup.campHq.getGroupSchedule(stranger, setup.otters.id))).reason).toBe(
      "no-staff-record",
    );
  });

  it("says when a group or slot no longer exists", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 1, "9:30");
    await setup.campHq.removeScheduleSlot(setup.admin, slot.id);

    expect((await refusal(setup.campHq.getSlotChoices(setup.admin, slot.id))).reason).toBe(
      "not-found",
    );
    expect((await refusal(setup.campHq.getGroupSchedule(setup.admin, "not-an-id"))).reason).toBe(
      "not-found",
    );
  });
});

describe("removing what a schedule uses", () => {
  it("refuses removing an activity that is on a schedule, listing where", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 2, "10:00");
    await setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    const refused = await refusal(setup.campHq.removeActivity(setup.admin, setup.archery.id));

    expect(refused.reason).toBe("in-use");
    expect(refused.usedIn).toEqual(["Schedule of Otters, Tuesday 10:00 AM to 10:30 AM"]);
  });

  it("removes a Camp group's schedule with the group", async () => {
    const setup = await start();
    const slot = await slotAt(setup, setup.otters.id, 2, "10:00");
    await setup.campHq.setScheduleSlotContent(setup.admin, slot.id, {
      type: "activity",
      activityId: setup.archery.id,
    });

    await setup.campHq.removeCampGroup(setup.admin, setup.otters.id);

    await expect(setup.campHq.removeActivity(setup.admin, setup.archery.id)).resolves.toBeUndefined();
  });
});
