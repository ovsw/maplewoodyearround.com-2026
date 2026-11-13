// Camp HQ's tables. Change them here, then run `pnpm --dir frontend
// hq:db:generate` to write the next SQL migration. Never edit a migration by
// hand. Relative imports with `.ts` extensions keep this file loadable by the
// Node scripts as well as by Next.js.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { campHqGradeValues } from "../grades.ts";

/** Senior staff lead a Camp group or run activities; Junior staff help. */
export const staffKind = pgEnum("staff_kind", ["senior", "junior"]);

/** The role of a staff member who has an account. Clerk only proves identity. */
export const accountRole = pgEnum("account_role", ["admin", "senior_staff"]);

export const staffMembers = pgTable(
  "staff_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    kind: staffKind("kind").notNull(),
    /** The Clerk user id of the person's account; null when they have none. */
    clerkUserId: text("clerk_user_id").unique(),
    role: accountRole("role"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    // A role belongs to an account: both are set, or neither is.
    check(
      "staff_members_role_needs_account",
      sql`(${table.clerkUserId} is null) = (${table.role} is null)`,
    ),
  ],
);

/** Camp HQ's own grades, Preschool to 9th Grade (see lib/hq/grades.ts). */
export const grade = pgEnum("grade", campHqGradeValues);

/** Exclusive: one Camp group per time slot. Shared: many groups at once. */
export const activityKind = pgEnum("activity_kind", ["exclusive", "shared"]);

/** A Summer Camp group of campers. Camp HQ's own record, not the Website's. */
export const campGroups = pgTable(
  "camp_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    grades: grade("grades").array().notNull(),
    /** Team 1 (youngest) to Team 4 (oldest). */
    team: smallint("team").notNull(),
    /** True while the Team comes from the sample data and no Admin has set it. */
    teamIsSample: boolean("team_is_sample").notNull().default(false),
    changeLocation: text("change_location").notNull().default(""),
    freeSwimLocation: text("free_swim_location").notNull().default(""),
    lunchLocation: text("lunch_location").notNull().default(""),
    swimLessonsLocation: text("swim_lessons_location").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("camp_groups_name_unique").on(sql`lower(${table.name})`),
    check("camp_groups_team_range", sql`${table.team} between 1 and 4`),
  ],
);

/** Something campers do at Summer Camp. Camp HQ's own record. */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** The grades the activity is allowed for. */
    grades: grade("grades").array().notNull(),
    kind: activityKind("kind").notNull().default("exclusive"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("activities_name_unique").on(sql`lower(${table.name})`)],
);

/**
 * One weekday (1 Monday to 5 Friday) of a Camp group's weekly Group schedule.
 * The row exists once the day has been started with its default slots, so a
 * day whose slots were all removed stays empty.
 */
export const scheduleDays = pgTable(
  "schedule_days",
  {
    campGroupId: uuid("camp_group_id")
      .notNull()
      .references(() => campGroups.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.campGroupId, table.weekday] }),
    check("schedule_days_weekday_range", sql`${table.weekday} between 1 and 5`),
  ],
);

/**
 * A slot in a Camp group's day. Times are minutes after midnight in camp local
 * time (America/New_York). A slot holds one activity, is a Club day period, or
 * is empty.
 */
export const scheduleSlots = pgTable(
  "schedule_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campGroupId: uuid("camp_group_id").notNull(),
    weekday: smallint("weekday").notNull(),
    startMinute: smallint("start_minute").notNull(),
    endMinute: smallint("end_minute").notNull(),
    activityId: uuid("activity_id").references(() => activities.id, { onDelete: "restrict" }),
    isClubDay: boolean("is_club_day").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.campGroupId, table.weekday],
      foreignColumns: [scheduleDays.campGroupId, scheduleDays.weekday],
      name: "schedule_slots_day_fk",
    }).onDelete("cascade"),
    index("schedule_slots_day_index").on(table.campGroupId, table.weekday),
    index("schedule_slots_activity_index").on(table.activityId, table.weekday),
    check(
      "schedule_slots_times",
      sql`${table.startMinute} >= 0 and ${table.endMinute} <= 1440 and ${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "schedule_slots_one_use",
      sql`not (${table.isClubDay} and ${table.activityId} is not null)`,
    ),
  ],
);
