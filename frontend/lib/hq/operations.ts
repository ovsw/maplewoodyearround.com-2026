// The Camp HQ operations module: the only way pages, server actions and
// commands reach Camp HQ's database. Every operation takes the acting person
// and the current time, and decides permissions itself, so no rule depends on
// the page or the request proxy.
import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import type { CampHqAccounts } from "./accounts.ts";
import type { CampHqDb } from "./db/database.ts";
import { staffMembers } from "./db/schema.ts";

/** Who is acting: a signed-in account, or a trusted command run by hand. */
export type CampHqActor =
  | { type: "account"; clerkUserId: string }
  | { type: "command-line" };

export type CampHqRequest = { actor: CampHqActor; now: Date };

export type CampHqRole = (typeof staffMembers.$inferSelect)["role"] & string;
export type StaffKind = (typeof staffMembers.$inferSelect)["kind"];

export type CampHqPerson = {
  staffMemberId: string;
  name: string;
  kind: StaffKind;
  role: CampHqRole;
};

export const campHqRoleLabels: Record<CampHqRole, string> = {
  admin: "Admin",
  senior_staff: "Senior staff",
};

export type CampHqRefusalReason =
  | "no-staff-record"
  | "account-switched-off"
  | "admins-only"
  | "not-found"
  | "invalid-input"
  | "has-account"
  | "no-account"
  | "email-in-use"
  | "switch-off-first"
  | "last-admin"
  | "accounts-unavailable";

/** Thrown when Camp HQ refuses an operation. `reason` says why. */
export class CampHqRefusal extends Error {
  readonly reason: CampHqRefusalReason;

  constructor(reason: CampHqRefusalReason, message: string) {
    super(message);
    this.name = "CampHqRefusal";
    this.reason = reason;
  }
}

export function isCampHqRefusal(
  error: unknown,
  reason?: CampHqRefusalReason,
): error is CampHqRefusal {
  return (
    error instanceof CampHqRefusal && (reason === undefined || error.reason === reason)
  );
}

/** The state of a staff member's sign-in account. */
export type StaffAccountStatus = "invited" | "active" | "switched-off";

export type StaffAccount = {
  email: string | null;
  status: StaffAccountStatus;
  /** Null while an invitation waits to be accepted. */
  role: CampHqRole | null;
};

export type StaffListEntry = {
  id: string;
  name: string;
  kind: StaffKind;
  account: StaffAccount | null;
};

const staffKinds: readonly StaffKind[] = ["senior", "junior"];
const roles: readonly CampHqRole[] = ["admin", "senior_staff"];
const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StaffRow = typeof staffMembers.$inferSelect;

function accountOf(row: StaffRow): StaffAccount | null {
  if (row.clerkUserId) {
    return {
      email: row.accountEmail,
      status: row.accountSwitchedOff ? "switched-off" : "active",
      role: row.role,
    };
  }
  if (row.accountEmail) return { email: row.accountEmail, status: "invited", role: null };
  return null;
}

function cleanName(name: string) {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned || cleaned.length > MAX_NAME_LENGTH) {
    throw new CampHqRefusal(
      "invalid-input",
      `Enter a name of 1 to ${MAX_NAME_LENGTH} characters.`,
    );
  }
  return cleaned;
}

function cleanEmail(email: string) {
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(cleaned)) {
    throw new CampHqRefusal("invalid-input", "Enter a valid email address.");
  }
  return cleaned;
}

function cleanKind(kind: string): StaffKind {
  if (!staffKinds.includes(kind as StaffKind)) {
    throw new CampHqRefusal("invalid-input", "Choose Senior staff or Junior staff.");
  }
  return kind as StaffKind;
}

function cleanRole(role: string): CampHqRole {
  if (!roles.includes(role as CampHqRole)) {
    throw new CampHqRefusal("invalid-input", "Choose Admin or Senior staff.");
  }
  return role as CampHqRole;
}

export function createCampHqOperations(
  db: CampHqDb,
  { accounts }: { accounts?: CampHqAccounts } = {},
) {
  type Tx = Parameters<Parameters<CampHqDb["transaction"]>[0]>[0];

  async function findPerson(actor: CampHqActor): Promise<CampHqPerson | null> {
    if (actor.type !== "account") return null;
    const [row] = await db
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.clerkUserId, actor.clerkUserId))
      .limit(1);
    if (!row?.role) return null;
    if (row.accountSwitchedOff) {
      throw new CampHqRefusal(
        "account-switched-off",
        "This account is switched off. Ask an Admin.",
      );
    }
    return {
      staffMemberId: row.id,
      name: row.name,
      kind: row.kind,
      role: row.role,
    };
  }

  async function requirePerson(actor: CampHqActor) {
    const person = await findPerson(actor);
    if (!person) {
      throw new CampHqRefusal(
        "no-staff-record",
        "Camp HQ has no staff record for this account. Ask an Admin.",
      );
    }
    return person;
  }

  /** Admins and trusted commands pass; everyone else is refused. */
  async function requireAdmin(actor: CampHqActor) {
    if (actor.type === "command-line") return;
    const person = await requirePerson(actor);
    if (person.role !== "admin") {
      throw new CampHqRefusal("admins-only", "Only an Admin can do this.");
    }
  }

  function requireAccounts() {
    if (!accounts) {
      throw new CampHqRefusal(
        "accounts-unavailable",
        "Accounts cannot be managed here: Camp HQ has no connection to its sign-in service.",
      );
    }
    return accounts;
  }

  /** The staff member's row, locked until the transaction ends. */
  async function lockStaffMember(tx: Tx, staffMemberId: string) {
    const [row] = await tx
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.id, staffMemberId))
      .limit(1)
      .for("update");
    if (!row) throw new CampHqRefusal("not-found", "This staff member no longer exists.");
    return row;
  }

  /**
   * Refuses when `row` is the only Admin whose account is on. Locks every
   * active Admin row, so two Admins cannot remove each other at once.
   */
  async function keepAnotherAdmin(tx: Tx, row: StaffRow, message: string) {
    if (row.role !== "admin" || row.accountSwitchedOff) return;
    const activeAdmins = await tx
      .select({ id: staffMembers.id })
      .from(staffMembers)
      .where(and(eq(staffMembers.role, "admin"), eq(staffMembers.accountSwitchedOff, false)))
      .for("update");
    if (!activeAdmins.some(({ id }) => id !== row.id)) {
      throw new CampHqRefusal("last-admin", message);
    }
  }

  function requireAccount(row: StaffRow) {
    if (!row.clerkUserId) {
      throw new CampHqRefusal("no-account", `${row.name} has no account.`);
    }
    return row.clerkUserId;
  }

  return {
    /** The signed-in person and their role, or a "no-staff-record" refusal. */
    async getSignedInPerson({ actor }: CampHqRequest): Promise<CampHqPerson> {
      return requirePerson(actor);
    },

    /**
     * Links the signed-in account to the staff member invited with one of its
     * verified emails. Returns the person, or null when no invitation matches.
     * The caller passes only emails that Clerk has verified.
     */
    async acceptInvitation(
      { actor, now }: CampHqRequest,
      verifiedEmails: string[],
    ): Promise<CampHqPerson | null> {
      if (actor.type !== "account") return null;
      const existing = await findPerson(actor);
      if (existing) return existing;
      const emails = verifiedEmails.map((email) => email.trim().toLowerCase());
      if (emails.length === 0) return null;
      // An account can have several verified emails, each invited for a
      // different staff member. It links to one of them only: one account, one
      // staff member.
      const linked = await db.transaction(async (tx) => {
        const [invited] = await tx
          .select({ id: staffMembers.id })
          .from(staffMembers)
          .where(
            and(inArray(staffMembers.accountEmail, emails), isNull(staffMembers.clerkUserId)),
          )
          .orderBy(asc(staffMembers.createdAt), asc(staffMembers.id))
          .limit(1)
          .for("update");
        if (!invited) return null;
        const [row] = await tx
          .update(staffMembers)
          .set({ clerkUserId: actor.clerkUserId, role: "senior_staff", updatedAt: now })
          .where(eq(staffMembers.id, invited.id))
          .returning();
        return row ?? null;
      });
      // A sign-in running at the same moment may have linked it already.
      if (!linked?.role) return findPerson(actor);
      return {
        staffMemberId: linked.id,
        name: linked.name,
        kind: linked.kind,
        role: linked.role,
      };
    },

    /** Every Senior and Junior staff member, by name. Admins only. */
    async listStaff({ actor }: CampHqRequest): Promise<StaffListEntry[]> {
      await requireAdmin(actor);
      const rows = await db.select().from(staffMembers).orderBy(asc(staffMembers.name));
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
        account: accountOf(row),
      }));
    },

    /** Registers a Senior or Junior staff member, without an account. */
    async addStaffMember(
      { actor, now }: CampHqRequest,
      person: { name: string; kind: string },
    ): Promise<{ staffMemberId: string }> {
      await requireAdmin(actor);
      const [created] = await db
        .insert(staffMembers)
        .values({
          name: cleanName(person.name),
          kind: cleanKind(person.kind),
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: staffMembers.id });
      return { staffMemberId: created.id };
    },

    async renameStaffMember(
      { actor, now }: CampHqRequest,
      staffMemberId: string,
      name: string,
    ): Promise<void> {
      await requireAdmin(actor);
      const cleaned = cleanName(name);
      await db.transaction(async (tx) => {
        await lockStaffMember(tx, staffMemberId);
        await tx
          .update(staffMembers)
          .set({ name: cleaned, updatedAt: now })
          .where(eq(staffMembers.id, staffMemberId));
      });
    },

    /**
     * Removes a staff member. Someone whose account is on must have it
     * switched off first, so the last Admin can never be removed.
     */
    async removeStaffMember({ actor }: CampHqRequest, staffMemberId: string): Promise<void> {
      await requireAdmin(actor);
      await db.transaction(async (tx) => {
        const row = await lockStaffMember(tx, staffMemberId);
        if (row.clerkUserId && !row.accountSwitchedOff) {
          throw new CampHqRefusal(
            "switch-off-first",
            `Switch off ${row.name}'s account before removing them.`,
          );
        }
        await tx.delete(staffMembers).where(eq(staffMembers.id, staffMemberId));
      });
    },

    /**
     * Gives a staff member (Senior, or Junior as an exception) an account for
     * this email, with the Senior staff role. When the sign-in service refuses
     * direct creation it sends an invitation, and the account links when the
     * person accepts it and signs in.
     */
    async createAccount(
      { actor, now }: CampHqRequest,
      staffMemberId: string,
      email: string,
    ): Promise<{ status: "created" | "invited" }> {
      await requireAdmin(actor);
      const service = requireAccounts();
      const cleaned = cleanEmail(email);

      const [row] = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.id, staffMemberId))
        .limit(1);
      if (!row) throw new CampHqRefusal("not-found", "This staff member no longer exists.");
      if (row.clerkUserId) {
        throw new CampHqRefusal("has-account", `${row.name} already has an account.`);
      }
      const [emailOwner] = await db
        .select({ id: staffMembers.id, name: staffMembers.name })
        .from(staffMembers)
        .where(eq(staffMembers.accountEmail, cleaned))
        .limit(1);
      if (emailOwner && emailOwner.id !== row.id) {
        throw new CampHqRefusal("email-in-use", `${emailOwner.name} already uses ${cleaned}.`);
      }

      const result = await service.createAccount({ email: cleaned, name: row.name });

      const linked = await db.transaction(async (tx) => {
        const current = await lockStaffMember(tx, staffMemberId);
        if (current.clerkUserId) {
          throw new CampHqRefusal("has-account", `${current.name} already has an account.`);
        }
        if (result.status === "invited") {
          await tx
            .update(staffMembers)
            .set({ accountEmail: cleaned, updatedAt: now })
            .where(eq(staffMembers.id, staffMemberId));
          return null;
        }
        const [linkedElsewhere] = await tx
          .select({ name: staffMembers.name })
          .from(staffMembers)
          .where(eq(staffMembers.clerkUserId, result.clerkUserId))
          .limit(1);
        if (linkedElsewhere) {
          throw new CampHqRefusal(
            "email-in-use",
            `The account for ${cleaned} already belongs to ${linkedElsewhere.name}.`,
          );
        }
        // Linked switched off until sign-in is allowed: an existing account may
        // still be blocked from an earlier switch-off. If allowing sign-in
        // fails, the Admin sees it switched off and can switch it on.
        await tx
          .update(staffMembers)
          .set({
            accountEmail: cleaned,
            clerkUserId: result.clerkUserId,
            role: "senior_staff",
            accountSwitchedOff: true,
            updatedAt: now,
          })
          .where(eq(staffMembers.id, staffMemberId));
        return result.clerkUserId;
      });
      if (!linked) return { status: "invited" };

      await service.setSignInAllowed(linked, true);
      await db
        .update(staffMembers)
        .set({ accountSwitchedOff: false, updatedAt: now })
        .where(and(eq(staffMembers.id, staffMemberId), eq(staffMembers.clerkUserId, linked)));
      return { status: "created" };
    },

    /** Stops a person signing in. The last Admin cannot be switched off. */
    async switchAccountOff({ actor, now }: CampHqRequest, staffMemberId: string): Promise<void> {
      await requireAdmin(actor);
      const service = requireAccounts();
      // Camp HQ refuses a switched-off account at once; the sign-in service
      // then blocks sign-in. Repeating this retries a failed block.
      const clerkUserId = await db.transaction(async (tx) => {
        const row = await lockStaffMember(tx, staffMemberId);
        const id = requireAccount(row);
        await keepAnotherAdmin(
          tx,
          row,
          `${row.name} is the last Admin. Make someone else an Admin first.`,
        );
        await tx
          .update(staffMembers)
          .set({ accountSwitchedOff: true, updatedAt: now })
          .where(eq(staffMembers.id, staffMemberId));
        return id;
      });
      await service.setSignInAllowed(clerkUserId, false);
    },

    /** Lets a switched-off person sign in again. */
    async switchAccountOn({ actor, now }: CampHqRequest, staffMemberId: string): Promise<void> {
      await requireAdmin(actor);
      const service = requireAccounts();
      const [row] = await db
        .select()
        .from(staffMembers)
        .where(eq(staffMembers.id, staffMemberId))
        .limit(1);
      if (!row) throw new CampHqRefusal("not-found", "This staff member no longer exists.");
      // Sign-in first: if Camp HQ's update then fails, the person can sign in
      // but Camp HQ still refuses them, which is the safe side.
      await service.setSignInAllowed(requireAccount(row), true);
      await db
        .update(staffMembers)
        .set({ accountSwitchedOff: false, updatedAt: now })
        .where(eq(staffMembers.id, staffMemberId));
    },

    /**
     * Makes an account holder an Admin or takes the role away. The last Admin
     * keeps the role.
     */
    async setRole(
      { actor, now }: CampHqRequest,
      staffMemberId: string,
      role: string,
    ): Promise<void> {
      await requireAdmin(actor);
      const newRole = cleanRole(role);
      await db.transaction(async (tx) => {
        const row = await lockStaffMember(tx, staffMemberId);
        requireAccount(row);
        if (row.accountSwitchedOff) {
          throw new CampHqRefusal(
            "account-switched-off",
            `${row.name}'s account is switched off. Switch it on first.`,
          );
        }
        if (newRole !== "admin") {
          await keepAnotherAdmin(
            tx,
            row,
            `${row.name} is the last Admin. Make someone else an Admin first.`,
          );
        }
        await tx
          .update(staffMembers)
          .set({ role: newRole, updatedAt: now })
          .where(eq(staffMembers.id, staffMemberId));
      });
    },

    /**
     * Makes the person with this Clerk account an Admin. Creates their staff
     * record (Senior staff) when they have none. Only an Admin, or the
     * first-Admin command, can do it.
     */
    async makeAdmin(
      { actor, now }: CampHqRequest,
      account: { clerkUserId: string; name: string },
    ): Promise<{ staffMemberId: string; created: boolean }> {
      await requireAdmin(actor);
      return db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: staffMembers.id })
          .from(staffMembers)
          .where(eq(staffMembers.clerkUserId, account.clerkUserId))
          .limit(1);
        if (existing) {
          await tx
            .update(staffMembers)
            .set({ role: "admin", updatedAt: now })
            .where(eq(staffMembers.id, existing.id));
          return { staffMemberId: existing.id, created: false };
        }
        const [created] = await tx
          .insert(staffMembers)
          .values({
            name: account.name,
            kind: "senior",
            clerkUserId: account.clerkUserId,
            role: "admin",
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: staffMembers.id });
        return { staffMemberId: created.id, created: true };
      });
    },
  };
}

export type CampHqOperations = ReturnType<typeof createCampHqOperations>;
