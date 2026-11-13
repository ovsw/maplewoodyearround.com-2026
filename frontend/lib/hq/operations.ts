// The Camp HQ operations module: the only way pages, server actions and
// commands reach Camp HQ's database. Every operation takes the acting person
// and the current time, and decides permissions itself, so no rule depends on
// the page or the request proxy.
import { eq } from "drizzle-orm";

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

export type CampHqRefusalReason = "no-staff-record" | "admins-only";

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

export function createCampHqOperations(db: CampHqDb) {
  async function findPerson(actor: CampHqActor): Promise<CampHqPerson | null> {
    if (actor.type !== "account") return null;
    const [row] = await db
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.clerkUserId, actor.clerkUserId))
      .limit(1);
    if (!row?.role) return null;
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

  return {
    /** The signed-in person and their role, or a "no-staff-record" refusal. */
    async getSignedInPerson({ actor }: CampHqRequest): Promise<CampHqPerson> {
      return requirePerson(actor);
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
