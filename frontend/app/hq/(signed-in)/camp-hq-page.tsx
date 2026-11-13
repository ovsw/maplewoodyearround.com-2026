import Link from "next/link";

import {
  CampHqDatabaseUnavailable,
  getCampHqOperations,
} from "@/lib/hq/camp-hq";
import { getCampHqClerkKeys } from "@/lib/hq/config";
import {
  isCampHqRefusal,
  type CampHqOperations,
  type CampHqPerson,
  type CampHqRequest,
} from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

export type CampHqPageContext = {
  campHq: CampHqOperations;
  request: CampHqRequest;
  person: CampHqPerson;
  isAdmin: boolean;
};

export type CampHqPageState =
  | { kind: "ready"; context: CampHqPageContext }
  | { kind: "no-keys" }
  | { kind: "no-staff-record" }
  | { kind: "no-database" };

/** The signed-in person and the operations, or why a page cannot show. */
export async function loadCampHqPage(): Promise<CampHqPageState> {
  // Without Clerk keys the layout shows "not available"; auth() would throw.
  if (!getCampHqClerkKeys()) return { kind: "no-keys" };
  const actor = await requireCampHqActor();
  const request = { actor, now: new Date() };
  try {
    const campHq = await getCampHqOperations();
    const person = await campHq.getSignedInPerson(request);
    return {
      kind: "ready",
      context: { campHq, request, person, isAdmin: person.role === "admin" },
    };
  } catch (error) {
    if (isCampHqRefusal(error, "no-staff-record")) return { kind: "no-staff-record" };
    if (error instanceof CampHqDatabaseUnavailable) return { kind: "no-database" };
    throw error;
  }
}

/** What a page shows instead of its content when it cannot load. */
export function CampHqPageNotice({ state }: { state: Exclude<CampHqPageState, { kind: "ready" }> }) {
  if (state.kind === "no-keys") return null;
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
  return (
    <section className="flex max-w-xl flex-col gap-3">
      <h1 className="text-title-lg">Camp HQ is not available</h1>
      <p className="text-muted-foreground">
        Camp HQ&apos;s database is not set up on this site yet.
      </p>
    </section>
  );
}

/** A plain "back to …" link with a 44px touch target. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline-offset-4 hover:underline"
    >
      ← {children}
    </Link>
  );
}
