import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

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
  | { kind: "person"; person: CampHqPerson }
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
    try {
      return { kind: "person", person: await campHq.getSignedInPerson({ actor, now }) };
    } catch (error) {
      if (!isCampHqRefusal(error, "no-staff-record")) throw error;
      // A person invited by email gets linked on their first sign-in.
      const person = await campHq.acceptInvitation({ actor, now }, await verifiedEmails());
      return person ? { kind: "person", person } : { kind: "no-staff-record" };
    }
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

  const { person } = state;
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-title-lg">Hello, {person.name}</h1>
      <p className="text-muted-foreground">
        Your role: <span className="text-foreground">{campHqRoleLabels[person.role]}</span>
      </p>
      <nav aria-label="Camp HQ lists" className="mt-3 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={CAMP_GROUPS_PATH}>Camp groups</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ACTIVITIES_PATH}>Activities</Link>
        </Button>
        {person.role === "admin" ? (
          <Button asChild variant="outline">
            <Link href={STAFF_PATH}>Staff and accounts</Link>
          </Button>
        ) : null}
      </nav>
    </section>
  );
}
