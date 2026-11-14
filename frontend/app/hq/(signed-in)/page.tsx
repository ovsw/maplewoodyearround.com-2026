import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import type { MyAssignment } from "@/lib/hq/assignments";
import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import { getCampHqClerkKeys } from "@/lib/hq/config";
import {
  campHqRoleLabels,
  isCampHqRefusal,
  type CampHqPerson,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { ASSIGNMENTS_PATH } from "./assignments/paths";
import { CAMPERS_PATH, groupCampersPath } from "./campers/paths";
import { ACTIVITIES_PATH, CAMP_GROUPS_PATH } from "./lists-paths";
import { STAFF_PATH } from "./staff/paths";

export const metadata: Metadata = { title: { absolute: "Camp HQ" } };

export default function CampHqHomePage() {
  return (
    <Suspense fallback={null}>
      <CampHqHome />
    </Suspense>
  );
}

type HomeState =
  | { kind: "person"; person: CampHqPerson; assignment: MyAssignment }
  | { kind: "no-staff-record" }
  | { kind: "switched-off" }
  | { kind: "no-database" };

/** The signed-in account's emails that Clerk has verified. */
async function verifiedEmails() {
  const user = await currentUser();
  return (user?.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress);
}

async function loadHome(): Promise<HomeState> {
  const actor = await requireCampHqActor();
  const now = new Date();
  try {
    const campHq = await getCampHqOperations();
    let person: CampHqPerson | null;
    try {
      person = await campHq.getSignedInPerson({ actor, now });
    } catch (error) {
      if (!isCampHqRefusal(error, "no-staff-record")) throw error;
      // A person invited by email gets linked on their first sign-in.
      person = await campHq.acceptInvitation({ actor, now }, await verifiedEmails());
    }
    if (!person) return { kind: "no-staff-record" };
    // Everyone lands on their own Assignment after signing in.
    return { kind: "person", person, assignment: await campHq.getMyAssignment({ actor, now }) };
  } catch (error) {
    if (isCampHqRefusal(error, "account-switched-off")) return { kind: "switched-off" };
    if (error instanceof CampHqDatabaseUnavailable) return { kind: "no-database" };
    throw error;
  }
}

async function CampHqHome() {
  // Without Clerk keys the layout shows "not available"; auth() would throw.
  if (!getCampHqClerkKeys()) return null;
  const state = await loadHome();

  if (state.kind === "no-staff-record") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Ask an Admin for access</h1>
        <p className="text-muted-foreground">
          You are signed in, but Camp HQ has no staff record for your account
          yet. Ask an Admin to add you, then sign in again.
        </p>
      </section>
    );
  }

  if (state.kind === "switched-off") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Your account is switched off</h1>
        <p className="text-muted-foreground">
          An Admin has switched off your Camp HQ account. Ask an Admin if you
          need access again.
        </p>
      </section>
    );
  }

  if (state.kind === "no-database") {
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Camp HQ is not available</h1>
        <p className="text-muted-foreground">
          Camp HQ&apos;s database is not set up on this site yet.
        </p>
      </section>
    );
  }

  const { person, assignment } = state;
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-title-lg">Hello, {person.name}</h1>
      <p className="text-muted-foreground">
        Your role: <span className="text-foreground">{campHqRoleLabels[person.role]}</span>
      </p>
      <MyAssignmentCard assignment={assignment} isAdmin={person.role === "admin"} />
      <nav aria-label="Camp HQ lists" className="mt-3 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={CAMP_GROUPS_PATH}>Camp groups</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ACTIVITIES_PATH}>Activities</Link>
        </Button>
        {person.role === "admin" ? (
          <>
            <Button asChild variant="outline">
              <Link href={ASSIGNMENTS_PATH}>Assignments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={CAMPERS_PATH}>Camper list</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={STAFF_PATH}>Staff and accounts</Link>
            </Button>
          </>
        ) : null}
      </nav>
    </section>
  );
}

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** "My Assignment": the group or activities the signed-in person works on now. */
function MyAssignmentCard({ assignment, isAdmin }: { assignment: MyAssignment; isAdmin: boolean }) {
  let body: React.ReactNode;
  switch (assignment.kind) {
    case "leader":
      body = (
        <>
          <p className="text-lg">
            You lead <strong>{assignment.campGroup.name}</strong>.
          </p>
          <div>
            <Button asChild>
              <Link href={groupCampersPath(assignment.campGroup.id)}>Campers expected today</Link>
            </Button>
          </div>
        </>
      );
      break;
    case "specialist":
      body = (
        <p className="text-lg">
          You are the specialist for{" "}
          <strong>{listNames(assignment.activities.map((activity) => activity.name))}</strong>.
        </p>
      );
      break;
    case "helper":
      body = (
        <p className="text-lg">
          You help <strong>{assignment.campGroup.name}</strong>
          {assignment.clubDayActivity ? (
            <>
              . On Club day you help at <strong>{assignment.clubDayActivity.name}</strong>
            </>
          ) : null}
          .
        </p>
      );
      break;
    case "none":
      body = (
        <p className="text-muted-foreground">
          {isAdmin
            ? "You have no Assignment. Set Assignments on the Assignments page."
            : "You have no Assignment yet. Ask an Admin to give you one."}
        </p>
      );
      break;
  }
  return (
    <section
      aria-labelledby="my-assignment-heading"
      className="mt-3 flex max-w-xl flex-col gap-2 rounded-lg border border-border bg-card p-5"
    >
      <h2 id="my-assignment-heading" className="text-label">
        My Assignment
      </h2>
      {body}
    </section>
  );
}
