// Camp HQ's tables. Change them here, then run `pnpm --dir frontend
// hq:db:generate` to write the next SQL migration. Never edit a migration by
// hand. Relative imports with `.ts` extensions keep this file loadable by the
// Node scripts as well as by Next.js.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
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
    /**
     * The email the account was created or invited with, lower case. Set with
     * no Clerk user id while an invitation waits to be accepted.
     */
    accountEmail: text("account_email").unique(),
    /** True when an Admin has switched the account off: no sign-in, no access. */
    accountSwitchedOff: boolean("account_switched_off").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    // A role belongs to an account: both are set, or neither is.
    check(
      "staff_members_role_needs_account",
      sql`(${table.clerkUserId} is null) = (${table.role} is null)`,
    ),
    // Only an existing account can be switched off.
    check(
      "staff_members_switched_off_needs_account",
      sql`not ${table.accountSwitchedOff} or ${table.clerkUserId} is not null`,
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

// Assignments: who works where now. A Camp group or an activity that is still
// in an Assignment cannot be removed (see lib/hq/usage.ts); removing a staff
// member removes their Assignment.

/** The leader of a Camp group: one per group, one group per leader. */
export const groupLeaders = pgTable("group_leaders", {
  campGroupId: uuid("camp_group_id")
    .primaryKey()
    .references(() => campGroups.id),
  staffMemberId: uuid("staff_member_id")
    .notNull()
    .unique()
    .references(() => staffMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

/** The specialist who runs an activity: one per activity; one person can run several. */
export const activitySpecialists = pgTable(
  "activity_specialists",
  {
    activityId: uuid("activity_id")
      .primaryKey()
      .references(() => activities.id),
    staffMemberId: uuid("staff_member_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("activity_specialists_staff_member").on(table.staffMemberId)],
);

/** The Camp group a Junior staff member helps, and their optional Club day activity. */
export const juniorPlacements = pgTable(
  "junior_placements",
  {
    staffMemberId: uuid("staff_member_id")
      .primaryKey()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    campGroupId: uuid("camp_group_id")
      .notNull()
      .references(() => campGroups.id),
    clubDayActivityId: uuid("club_day_activity_id").references(() => activities.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("junior_placements_camp_group").on(table.campGroupId),
    index("junior_placements_club_day_activity").on(table.clubDayActivityId),
  ],
);
