// SAMPLE DATA. Every person here is invented and named "Sample …" or marked
// "(sample)". The local database loads it when it opens; the shared Neon dev
// database (previews) gets it only through `pnpm --dir frontend hq:db:sample`.
// The Camp groups and activities come from the committed seed file
// (seed-lists.json); their Teams, and the Club day setup below, are sample.
import { and, asc, between, eq, inArray, isNotNull, isNull, notLike, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { addDays, campDate, weekStart } from "../camp-dates.ts";
import type { CamperLoadRow } from "../campers.ts";
import { CampHqRefusal, createCampHqOperations } from "../operations.ts";
import type { CampHqDb } from "./database.ts";
import {
  activities,
  camperDays,
  campers,
  campGroups,
  clubDayOptions,
  groupLeaders,
  juniorPlacements,
  scheduleDays,
  scheduleSlots,
  staffMembers,
} from "./schema.ts";
import { campHqSeed, loadSeedLists } from "./seed-lists.ts";

const SAMPLE_ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const SAMPLE_LEADER_ID = "00000000-0000-4000-8000-000000000002";
const SAMPLE_JUNIOR_ID = "00000000-0000-4000-8000-000000000003";

const samplePeople = [
  { id: SAMPLE_ADMIN_ID, name: "Sample Admin", kind: "senior" },
  { id: SAMPLE_LEADER_ID, name: "Sample Leader", kind: "senior" },
  { id: SAMPLE_JUNIOR_ID, name: "Sample Junior", kind: "junior" },
] as const;

/** The Clerk user ids of the Camp HQ test users, when known. */
export type SampleAccounts = { admin?: string; leader?: string };

/**
 * Loads the sample people and the seed lists into an empty database, then links the Clerk test
 * admin (as Admin) and test leader (as Senior staff) to their sample records
 * when those are still unlinked, and sets up a sample Club day (see
 * loadSampleClubDay). Safe to run on every start.
 */
export async function loadSampleData(
  db: CampHqDb,
  { now, accounts = {} }: { now: Date; accounts?: SampleAccounts },
) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(staffMembers);
  if (count === 0) {
    await db
      .insert(staffMembers)
      .values(samplePeople.map((person) => ({ ...person, createdAt: now, updatedAt: now })));
  }
  await loadSeedLists(db, campHqSeed, { now });
  await loadSampleCampers(db, now);

  const links = [
    { id: SAMPLE_ADMIN_ID, clerkUserId: accounts.admin, role: "admin" },
    { id: SAMPLE_LEADER_ID, clerkUserId: accounts.leader, role: "senior_staff" },
  ] as const;
  for (const { id, clerkUserId, role } of links) {
    if (!clerkUserId) continue;
    const [taken] = await db
      .select({ id: staffMembers.id })
      .from(staffMembers)
      .where(eq(staffMembers.clerkUserId, clerkUserId))
      .limit(1);
    if (taken) continue;
    await db
      .update(staffMembers)
      .set({ clerkUserId, role, updatedAt: now })
      .where(and(eq(staffMembers.id, id), isNull(staffMembers.clerkUserId)));
  }
  await loadSampleClubDay(db, now);
  await loadSampleSchedules(db, now);
}

const sampleCamperNames = [
  ["Ava", "Brookfield"],
  ["Ben", "Okafor"],
  ["Cleo", "Marsh"],
  ["Dara", "Quill"],
  ["Eli", "Fenwick"],
  ["Finn", "Harlow"],
  ["Gia", "Romero"],
  ["Hal", "Ito"],
  ["Ivy", "Chen"],
  ["Jo", "Penn"],
  ["Kit", "Vale"],
  ["Lou", "Shaw"],
  ["Mia", "Torres"],
  ["Ned", "Archer"],
  ["Ora", "Lind"],
  ["Pip", "Gallo"],
  ["Rae", "Sutton"],
  ["Sol", "Bishop"],
] as const;

const SAMPLE_CAMPER_PREFIX = "SAMPLE-";

/**
 * Loads invented campers for the current camp week (Monday to Friday) into the
 * first three Camp groups, through the "load campers" operation, when nobody
 * is in the camper list this week. Half of them also come next week, so the
 * others show as in their final week; one is absent on Wednesday in each group
 * and one moves to the next group on Wednesday.
 */
async function loadSampleCampers(db: CampHqDb, now: Date) {
  const monday = weekStart(campDate(now));
  const friday = addDays(monday, 4);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(camperDays)
    .where(between(camperDays.date, monday, friday));
  if (count > 0) return;
  // The load replaces the whole list, so never replace an uploaded one.
  const [{ uploaded }] = await db
    .select({ uploaded: sql<number>`count(*)::int` })
    .from(campers)
    .where(notLike(campers.sourceId, `${SAMPLE_CAMPER_PREFIX}%`));
  if (uploaded > 0) return;
  const groups = await db
    .select({ name: campGroups.name })
    .from(campGroups)
    .orderBy(asc(sql`lower(${campGroups.name})`))
    .limit(3);
  if (groups.length === 0) return;

  const thisWeek = [0, 1, 2, 3, 4].map((day) => addDays(monday, day));
  const nextWeek = thisWeek.map((date) => addDays(date, 7));
  const rows: CamperLoadRow[] = [];
  groups.forEach((group, groupIndex) => {
    for (let index = 0; index < 6; index += 1) {
      const [first, last] = sampleCamperNames[groupIndex * 6 + index];
      const camperId = `${SAMPLE_CAMPER_PREFIX}${groupIndex + 1}${index + 1}`;
      const name = `${first} ${last} (sample)`;
      const dates = index % 2 === 0 ? [...thisWeek, ...nextWeek] : thisWeek;
      for (const date of dates) {
        const movesOn = index === 5 && groups.length > 1 && date >= thisWeek[2];
        rows.push({
          camperId,
          name,
          date,
          campGroup: movesOn ? groups[(groupIndex + 1) % groups.length].name : group.name,
          expected: !(index === 1 && date === thisWeek[2]),
        });
      }
    }
  });
  await createCampHqOperations(db).loadCampers(
    { actor: { type: "command-line" }, now },
    { source: "Sample data (invented campers)", rows },
  );
}

/** The sample Club day period: the default slot from 11:30, after the 11:00 lock. */
const SAMPLE_CLUB_DAY_START = 11 * 60 + 30;

/** SAMPLE Club day options for the first group's Team, every weekday. */
const sampleClubDayOptions = [
  { activity: "Archery", maxPerPeriod: 8 },
  { activity: "Drama", maxPerPeriod: 8 },
  { activity: "Ceramics", maxPerPeriod: 2 },
] as const;

async function countOf(db: CampHqDb, table: PgTable) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return count;
}

/**
 * A sample day for the first Camp group (by name), through the operations
 * module: the Sample Leader leads it (once their account is linked), the
 * Sample Junior helps it and runs Archery on Club day, its 11:30 slot is a
 * Club day period every weekday, and its Team has three Club day options every
 * weekday. Each part is added only while Camp HQ has nothing of that kind, so
 * an Admin's own setup is never changed.
 */
async function loadSampleClubDay(db: CampHqDb, now: Date) {
  const [group] = await db
    .select({ id: campGroups.id, team: campGroups.team })
    .from(campGroups)
    .orderBy(asc(sql`lower(${campGroups.name})`))
    .limit(1);
  if (!group) return;
  const campHq = createCampHqOperations(db);
  const request = { actor: { type: "command-line" } as const, now };

  if ((await countOf(db, scheduleDays)) === 0) {
    // Reading the schedule starts every weekday with the default slots.
    const schedule = await campHq.getGroupSchedule(request, group.id);
    for (const day of schedule.days) {
      const slot = day.slots.find((candidate) => candidate.start === SAMPLE_CLUB_DAY_START);
      if (slot) await campHq.setScheduleSlotContent(request, slot.id, { type: "club-day" });
    }
  }

  const names = sampleClubDayOptions.map((option) => option.activity);
  const activityRows = await db
    .select({ id: activities.id, name: activities.name })
    .from(activities)
    .where(inArray(activities.name, names));
  const activityId = (name: string) => activityRows.find((row) => row.name === name)?.id;

  if ((await countOf(db, clubDayOptions)) === 0) {
    // All or nothing, so a failed start leaves the table empty for the next try.
    await db.transaction(async (transaction) => {
      const inTransaction = createCampHqOperations(transaction as unknown as CampHqDb);
      for (const weekday of [1, 2, 3, 4, 5]) {
        for (const option of sampleClubDayOptions) {
          const id = activityId(option.activity);
          if (!id) continue;
          try {
            await inTransaction.addClubDayOption(request, {
              team: group.team,
              weekday,
              activityId: id,
              maxPerPeriod: option.maxPerPeriod,
            });
          } catch (error) {
            // An option that clashes with an Admin's own setup is left out.
            if (!(error instanceof CampHqRefusal)) throw error;
          }
        }
      }
    });
  }

  const [leader] = await db
    .select()
    .from(staffMembers)
    .where(eq(staffMembers.id, SAMPLE_LEADER_ID))
    .limit(1);
  if (
    leader?.clerkUserId &&
    !leader.accountSwitchedOff &&
    (await countOf(db, groupLeaders)) === 0
  ) {
    await campHq.setGroupLeader(request, group.id, leader.id);
  }

  const [junior] = await db
    .select({ id: staffMembers.id })
    .from(staffMembers)
    .where(eq(staffMembers.id, SAMPLE_JUNIOR_ID))
    .limit(1);
  if (junior && (await countOf(db, juniorPlacements)) === 0) {
    await campHq.setJuniorPlacement(request, junior.id, {
      campGroupId: group.id,
      clubDayActivityId: activityId("Archery") ?? null,
    });
  }
}

/** How many Camp groups get a sample schedule, and until when in the day. */
const SAMPLE_SCHEDULE_GROUPS = 8;
const SAMPLE_SCHEDULE_END = 14 * 60;
const SAMPLE_SCHEDULES_ENOUGH = 3;
const SAMPLE_LUNCH_START = 12 * 60;

/**
 * SAMPLE schedules for the first Camp groups (by name), through the operations
 * module, so the Groups Schedule has something to show: each morning and early
 * afternoon slot gets an activity allowed for the group, with Lunch at noon.
 * The later slots stay empty. A booking the rules refuse is left out. Loaded
 * only while fewer than three groups have an activity booked, and only into
 * groups with nothing booked, so an Admin's own schedules are never changed.
 */
async function loadSampleSchedules(db: CampHqDb, now: Date) {
  const bookedRows = await db
    .selectDistinct({ campGroupId: scheduleSlots.campGroupId })
    .from(scheduleSlots)
    .where(isNotNull(scheduleSlots.activityId));
  if (bookedRows.length >= SAMPLE_SCHEDULES_ENOUGH) return;
  const hasBookings = new Set(bookedRows.map((row) => row.campGroupId));
  const campHq = createCampHqOperations(db);
  const request = { actor: { type: "command-line" } as const, now };
  // The Club day options stay free, so they never clash with a booking.
  const reserved = new Set<string>(sampleClubDayOptions.map((option) => option.activity));

  for (const weekday of [1, 2, 3, 4, 5]) {
    const board = await campHq.getDayBoard(request, weekday);
    const lunch = board.activities.find((activity) => activity.name === "Lunch");
    const taken = new Set<string>();
    for (const [groupIndex, entry] of board.groups.slice(0, SAMPLE_SCHEDULE_GROUPS).entries()) {
      if (hasBookings.has(entry.group.id)) continue;
      const allowed = board.activities.filter(
        (activity) =>
          activity.id !== lunch?.id &&
          !reserved.has(activity.name) &&
          entry.group.grades.every((grade) => activity.grades.includes(grade)),
      );
      const usedToday = new Set<string>();
      for (const [slotIndex, slot] of entry.slots.entries()) {
        if (slot.content.type !== "empty" || slot.start >= SAMPLE_SCHEDULE_END) continue;
        let pick = slot.start === SAMPLE_LUNCH_START ? lunch : undefined;
        // A different start for every group, day and slot, then the first one free.
        const first = groupIndex * 7 + weekday * 3 + slotIndex * 5;
        for (let step = 0; !pick && step < allowed.length; step += 1) {
          const candidate = allowed[(first + step) % allowed.length];
          if (usedToday.has(candidate.id)) continue;
          if (candidate.kind === "exclusive" && taken.has(`${candidate.id}:${slot.start}`)) continue;
          pick = candidate;
        }
        if (!pick) continue;
        try {
          await campHq.setScheduleSlotContent(request, slot.id, {
            type: "activity",
            activityId: pick.id,
          });
          taken.add(`${pick.id}:${slot.start}`);
          usedToday.add(pick.id);
        } catch (error) {
          if (!(error instanceof CampHqRefusal)) throw error;
        }
      }
    }
  }
}
