// Loads who is signed in and gives the sidebar their links. Anything it cannot
// read (no staff record yet, account switched off, no database) leaves only
// Home; the page itself explains why.
import { CampHqDatabaseUnavailable, getCampHqOperations } from "@/lib/hq/camp-hq";
import { campHqNow } from "@/lib/hq/clock";
import { campHqRoleLabels, isCampHqRefusal } from "@/lib/hq/operations";
import { requireCampHqActor } from "@/lib/hq/session";

import { HqSidebar } from "./hq-sidebar";
import { navFor, type NavPerson } from "./nav";

async function loadNavPerson(): Promise<NavPerson> {
  const request = { actor: await requireCampHqActor(), now: campHqNow() };
  try {
    const campHq = await getCampHqOperations();
    const person = await campHq.getSignedInPerson(request);
    if (!person) return null;
    const assignment = await campHq.getMyAssignment(request);
    return {
      name: person.name,
      role: person.role,
      roleLabel: campHqRoleLabels[person.role],
      assignment,
    };
  } catch (error) {
    if (isCampHqRefusal(error) || error instanceof CampHqDatabaseUnavailable) return null;
    throw error;
  }
}

export async function LoadedSidebar() {
  const person = await loadNavPerson();
  return <HqSidebar groups={navFor(person)} person={person} />;
}
