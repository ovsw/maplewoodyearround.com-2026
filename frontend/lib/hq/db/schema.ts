// Camp HQ's tables. Change them here, then run `pnpm --dir frontend
// hq:db:generate` to write the next SQL migration. Never edit a migration by
// hand. Relative imports with `.ts` extensions keep this file loadable by the
// Node scripts as well as by Next.js.
import { sql } from "drizzle-orm";
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
