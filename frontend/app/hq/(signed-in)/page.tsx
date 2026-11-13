import type { Metadata } from "next";
import { Suspense } from "react";

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
  | { kind: "no-database" };

async function loadHome(): Promise<HomeState> {
  const actor = await requireCampHqActor();
  const now = new Date();
  try {
    const campHq = await getCampHqOperations();
    return { kind: "person", person: await campHq.getSignedInPerson({ actor, now }) };
  } catch (error) {
    if (isCampHqRefusal(error, "no-staff-record")) return { kind: "no-staff-record" };
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
    </section>
  );
}
