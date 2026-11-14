// Assignments: who works where now. Part of the Camp HQ operations module (see
// operations.ts); pages never call this file directly.
//
// A Senior staff member leads one Camp group or runs one or more activities as
// the specialist. A Junior staff member helps one Camp group and may have a
// Club day activity. Nobody has two jobs at once, and only a person with an
// active account can lead or be a specialist. Only Admins change Assignments;
// anyone signed in can see their own.
import { asc, eq, sql } from "drizzle-orm";

import type { CampHqDb } from "./db/database.ts";
import {
  activities,
  activitySpecialists,
  campGroups,
  groupLeaders,
  juniorPlacements,
  staffMembers,
} from "./db/schema.ts";
import {
  CampHqRefusal,
  type CampHqActor,
  type CampHqPerson,
  type CampHqRequest,
} from "./operations.ts";

export type NamedRef = { id: string; name: string };

/** The signed-in person's own Assignment, for the page they land on. */
export type MyAssignment =
  | { kind: "leader"; campGroup: NamedRef }
  | { kind: "specialist"; activities: NamedRef[] }
  | { kind: "helper"; campGroup: NamedRef; clubDayActivity: NamedRef | null }
  | { kind: "none" };

/** A person who can lead or be a specialist: their account is on. */
export type AssignmentCandidate = NamedRef & {
  /** What they do now, e.g. "leads Eagles"; null with no Assignment. */
  job: string | null;
};

export type AssignmentBoard = {
  campGroups: (NamedRef & { team: number; leader: NamedRef | null; juniors: NamedRef[] })[];
  activities: (NamedRef & { specialist: NamedRef | null })[];
  juniors: (NamedRef & { campGroupId: string | null; clubDayActivityId: string | null })[];
  /** Senior staff (and Junior staff with an account) who can lead or run activities. */
  candidates: AssignmentCandidate[];
  /** Staff members with an Assignment and no active account any more. */
  withoutActiveAccount: NamedRef[];
  gaps: {
    campGroupsWithoutLeader: NamedRef[];
    activitiesWithoutSpecialist: NamedRef[];
  };
};

type AssignmentDeps = {
  db: CampHqDb;
  requirePerson: (actor: CampHqActor) => Promise<CampHqPerson>;
  requireAdmin: (actor: CampHqActor) => Promise<void>;
};

type Tx = Parameters<Parameters<CampHqDb["transaction"]>[0]>[0];
type StaffRow = typeof staffMembers.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(what: string): never {
  throw new CampHqRefusal("not-found", `This ${what} no longer exists.`);
}

function hasActiveAccount(row: StaffRow) {
  return Boolean(row.clerkUserId) && !row.accountSwitchedOff;
}

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** What a person does now, read inside the transaction that changes it. */
async function currentJobs(tx: Tx, staffMemberId: string) {
  const [leads] = await tx
    .select({ id: campGroups.id, name: campGroups.name })
    .from(groupLeaders)
    .innerJoin(campGroups, eq(campGroups.id, groupLeaders.campGroupId))
    .where(eq(groupLeaders.staffMemberId, staffMemberId))
    .limit(1);
  const runs = await tx
    .select({ id: activities.id, name: activities.name })
    .from(activitySpecialists)
    .innerJoin(activities, eq(activities.id, activitySpecialists.activityId))
    .where(eq(activitySpecialists.staffMemberId, staffMemberId))
    .orderBy(asc(sql`lower(${activities.name})`));
  const [helps] = await tx
    .select({ id: campGroups.id, name: campGroups.name })
    .from(juniorPlacements)
    .innerJoin(campGroups, eq(campGroups.id, juniorPlacements.campGroupId))
    .where(eq(juniorPlacements.staffMemberId, staffMemberId))
    .limit(1);
  return { leads: leads ?? null, runs, helps: helps ?? null };
}

function twoJobs(message: string): never {
  throw new CampHqRefusal("two-jobs", message);
}

export function createAssignmentOperations({ db, requirePerson, requireAdmin }: AssignmentDeps) {
  async function lockStaff(tx: Tx, id: string) {
    if (!UUID.test(id)) notFound("staff member");
    const [row] = await tx
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.id, id))
      .limit(1)
      .for("update");
    if (!row) notFound("staff member");
    return row;
  }

  async function lockCampGroup(tx: Tx, id: string) {
    if (!UUID.test(id)) notFound("Camp group");
    const [row] = await tx
      .select({ id: campGroups.id, name: campGroups.name })
      .from(campGroups)
      .where(eq(campGroups.id, id))
      .limit(1)
      .for("update");
    if (!row) notFound("Camp group");
    return row;
  }

  async function lockActivity(tx: Tx, id: string) {
    if (!UUID.test(id)) notFound("activity");
    const [row] = await tx
      .select({ id: activities.id, name: activities.name })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1)
      .for("update");
    if (!row) notFound("activity");
    return row;
  }

  function requireActiveAccount(row: StaffRow, job: string) {
    if (!hasActiveAccount(row)) {
      throw new CampHqRefusal(
        "no-account",
        `${row.name} has no active account, so they cannot ${job}. Give them an account first, or switch it on.`,
      );
    }
  }

  return {
    /**
     * Makes a person the leader of a Camp group, or clears the leader when
     * `staffMemberId` is null. A group that already has a different leader is
     * only changed with `replacing` set to that leader's id, after the Admin
     * confirms; if the leader changed since, the Admin is asked again.
     */
    async setGroupLeader(
      { actor, now }: CampHqRequest,
      campGroupId: string,
      staffMemberId: string | null,
      { replacing = null }: { replacing?: string | null } = {},
    ): Promise<void> {
      await requireAdmin(actor);
      await db.transaction(async (tx) => {
        // Every setter locks the staff member before the group or activity.
        const person = staffMemberId === null ? null : await lockStaff(tx, staffMemberId);
        const group = await lockCampGroup(tx, campGroupId);
        if (person === null) {
          await tx.delete(groupLeaders).where(eq(groupLeaders.campGroupId, group.id));
          return;
        }
        requireActiveAccount(person, "lead a Camp group");

        const jobs = await currentJobs(tx, person.id);
        if (jobs.leads?.id === group.id) return;
        if (jobs.leads) {
          twoJobs(`${person.name} already leads ${jobs.leads.name}. Clear that Assignment first.`);
        }
        if (jobs.runs.length > 0) {
          twoJobs(
            `${person.name} is the specialist for ${listNames(jobs.runs.map((a) => a.name))}. A leader cannot also be a specialist.`,
          );
        }
        if (jobs.helps) {
          twoJobs(`${person.name} helps ${jobs.helps.name} as Junior staff. Clear that Assignment first.`);
        }

        const [current] = await tx
          .select({ id: staffMembers.id, name: staffMembers.name })
          .from(groupLeaders)
          .innerJoin(staffMembers, eq(staffMembers.id, groupLeaders.staffMemberId))
          .where(eq(groupLeaders.campGroupId, group.id))
          .limit(1);
        if (current && current.id !== replacing) {
          throw new CampHqRefusal(
            "confirm-replace",
            `${current.name} leads ${group.name}. Replace ${current.name} with ${person.name}?`,
            [],
            current.id,
          );
        }
        await tx.delete(groupLeaders).where(eq(groupLeaders.campGroupId, group.id));
        await tx
          .insert(groupLeaders)
          .values({ campGroupId: group.id, staffMemberId: person.id, createdAt: now });
      });
    },

    /**
     * Makes a person the specialist for an activity, or clears it when
     * `staffMemberId` is null. One person can run several activities. An
     * activity that already has a different specialist is only changed with
     * `replacing` set to that specialist's id, after the Admin confirms; if
     * the specialist changed since, the Admin is asked again.
     */
    async setActivitySpecialist(
      { actor, now }: CampHqRequest,
      activityId: string,
      staffMemberId: string | null,
      { replacing = null }: { replacing?: string | null } = {},
    ): Promise<void> {
      await requireAdmin(actor);
      await db.transaction(async (tx) => {
        const person = staffMemberId === null ? null : await lockStaff(tx, staffMemberId);
        const activity = await lockActivity(tx, activityId);
        if (person === null) {
          await tx.delete(activitySpecialists).where(eq(activitySpecialists.activityId, activity.id));
          return;
        }
        requireActiveAccount(person, "be a specialist");

        const jobs = await currentJobs(tx, person.id);
        if (jobs.runs.some((a) => a.id === activity.id)) return;
        if (jobs.leads) {
          twoJobs(
            `${person.name} leads ${jobs.leads.name}. A leader cannot also be a specialist.`,
          );
        }
        if (jobs.helps) {
          twoJobs(`${person.name} helps ${jobs.helps.name} as Junior staff. Clear that Assignment first.`);
        }

        const [current] = await tx
          .select({ id: staffMembers.id, name: staffMembers.name })
          .from(activitySpecialists)
          .innerJoin(staffMembers, eq(staffMembers.id, activitySpecialists.staffMemberId))
          .where(eq(activitySpecialists.activityId, activity.id))
          .limit(1);
        if (current && current.id !== replacing) {
          throw new CampHqRefusal(
            "confirm-replace",
            `${current.name} is the specialist for ${activity.name}. Replace ${current.name} with ${person.name}?`,
            [],
            current.id,
          );
        }
        await tx.delete(activitySpecialists).where(eq(activitySpecialists.activityId, activity.id));
        await tx
          .insert(activitySpecialists)
          .values({ activityId: activity.id, staffMemberId: person.id, createdAt: now });
      });
    },

    /**
     * Sets the Camp group a Junior staff member helps and, optionally, their
     * Club day activity. A null group clears the placement.
     */
    async setJuniorPlacement(
      { actor, now }: CampHqRequest,
      staffMemberId: string,
      placement: { campGroupId: string | null; clubDayActivityId?: string | null },
    ): Promise<void> {
      await requireAdmin(actor);
      const clubDayActivityId = placement.clubDayActivityId || null;
      await db.transaction(async (tx) => {
        const person = await lockStaff(tx, staffMemberId);
        if (person.kind !== "junior") {
          throw new CampHqRefusal(
            "invalid-input",
            `${person.name} is Senior staff. Make them a group's leader or an activity's specialist instead.`,
          );
        }
        if (!placement.campGroupId) {
          if (clubDayActivityId) {
            throw new CampHqRefusal(
              "invalid-input",
              "Choose the Camp group they help before their Club day activity.",
            );
          }
          await tx.delete(juniorPlacements).where(eq(juniorPlacements.staffMemberId, person.id));
          return;
        }
        const group = await lockCampGroup(tx, placement.campGroupId);
        if (clubDayActivityId) await lockActivity(tx, clubDayActivityId);

        const jobs = await currentJobs(tx, person.id);
        if (jobs.leads) {
          twoJobs(`${person.name} leads ${jobs.leads.name}. Clear that Assignment first.`);
        }
        if (jobs.runs.length > 0) {
          twoJobs(
            `${person.name} is the specialist for ${listNames(jobs.runs.map((a) => a.name))}. Clear that Assignment first.`,
          );
        }
        await tx
          .insert(juniorPlacements)
          .values({
            staffMemberId: person.id,
            campGroupId: group.id,
            clubDayActivityId,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: juniorPlacements.staffMemberId,
            set: { campGroupId: group.id, clubDayActivityId, updatedAt: now },
          });
      });
    },

    /** Clears every part of a person's Assignment. */
    async clearAssignment({ actor }: CampHqRequest, staffMemberId: string): Promise<void> {
      await requireAdmin(actor);
      await db.transaction(async (tx) => {
        const person = await lockStaff(tx, staffMemberId);
        await tx.delete(groupLeaders).where(eq(groupLeaders.staffMemberId, person.id));
        await tx.delete(activitySpecialists).where(eq(activitySpecialists.staffMemberId, person.id));
        await tx.delete(juniorPlacements).where(eq(juniorPlacements.staffMemberId, person.id));
      });
    },

    /** The signed-in person's own Assignment. */
    async getMyAssignment({ actor }: CampHqRequest): Promise<MyAssignment> {
      const person = await requirePerson(actor);
      return db.transaction(async (tx) => {
        const jobs = await currentJobs(tx, person.staffMemberId);
        if (jobs.leads) return { kind: "leader", campGroup: jobs.leads };
        if (jobs.runs.length > 0) return { kind: "specialist", activities: jobs.runs };
        if (jobs.helps) {
          const [placement] = await tx
            .select({ id: activities.id, name: activities.name })
            .from(juniorPlacements)
            .innerJoin(activities, eq(activities.id, juniorPlacements.clubDayActivityId))
            .where(eq(juniorPlacements.staffMemberId, person.staffMemberId))
            .limit(1);
          return { kind: "helper", campGroup: jobs.helps, clubDayActivity: placement ?? null };
        }
        return { kind: "none" };
      });
    },

    /** Every Assignment, the people who can be given one, and the gaps. Admins only. */
    async getAssignmentBoard({ actor }: CampHqRequest): Promise<AssignmentBoard> {
      await requireAdmin(actor);
      const [staff, groups, acts, leaders, specialists, placements] = await Promise.all([
        db.select().from(staffMembers).orderBy(asc(sql`lower(${staffMembers.name})`)),
        db.select().from(campGroups).orderBy(asc(sql`lower(${campGroups.name})`)),
        db.select().from(activities).orderBy(asc(sql`lower(${activities.name})`)),
        db.select().from(groupLeaders),
        db.select().from(activitySpecialists),
        db.select().from(juniorPlacements),
      ]);
      const staffById = new Map(staff.map((row) => [row.id, row]));
      const ref = (id: string): NamedRef => ({ id, name: staffById.get(id)?.name ?? "" });
      const groupName = new Map(groups.map((row) => [row.id, row.name]));
      const leaderOf = new Map(leaders.map((row) => [row.campGroupId, row.staffMemberId]));
      const specialistOf = new Map(specialists.map((row) => [row.activityId, row.staffMemberId]));

      function jobOf(staffMemberId: string): string | null {
        const leads = leaders.find((row) => row.staffMemberId === staffMemberId);
        if (leads) return `leads ${groupName.get(leads.campGroupId)}`;
        const runs = acts
          .filter((act) => specialistOf.get(act.id) === staffMemberId)
          .map((act) => act.name);
        if (runs.length > 0) return `specialist for ${listNames(runs)}`;
        const helps = placements.find((row) => row.staffMemberId === staffMemberId);
        if (helps) return `helps ${groupName.get(helps.campGroupId)}`;
        return null;
      }

      const assignedIds = new Set([
        ...leaders.map((row) => row.staffMemberId),
        ...specialists.map((row) => row.staffMemberId),
      ]);

      const boardGroups = groups.map((group) => {
        const leaderId = leaderOf.get(group.id);
        return {
          id: group.id,
          name: group.name,
          team: group.team,
          leader: leaderId ? ref(leaderId) : null,
          juniors: placements
            .filter((row) => row.campGroupId === group.id)
            .map((row) => ref(row.staffMemberId))
            .sort((a, b) => a.name.localeCompare(b.name)),
        };
      });
      const boardActivities = acts.map((act) => {
        const specialistId = specialistOf.get(act.id);
        return { id: act.id, name: act.name, specialist: specialistId ? ref(specialistId) : null };
      });

      return {
        campGroups: boardGroups,
        activities: boardActivities,
        juniors: staff
          .filter((row) => row.kind === "junior")
          .map((row) => {
            const placement = placements.find((p) => p.staffMemberId === row.id);
            return {
              id: row.id,
              name: row.name,
              campGroupId: placement?.campGroupId ?? null,
              clubDayActivityId: placement?.clubDayActivityId ?? null,
            };
          }),
        candidates: staff
          .filter(hasActiveAccount)
          .map((row) => ({ id: row.id, name: row.name, job: jobOf(row.id) })),
        withoutActiveAccount: staff
          .filter((row) => assignedIds.has(row.id) && !hasActiveAccount(row))
          .map((row) => ({ id: row.id, name: row.name })),
        gaps: {
          campGroupsWithoutLeader: boardGroups
            .filter((group) => !group.leader)
            .map(({ id, name }) => ({ id, name })),
          activitiesWithoutSpecialist: boardActivities
            .filter((act) => !act.specialist)
            .map(({ id, name }) => ({ id, name })),
        },
      };
    },
  };
}
