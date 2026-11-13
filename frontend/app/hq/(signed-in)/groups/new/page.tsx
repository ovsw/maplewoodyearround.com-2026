import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { CampGroupForm } from "../../list-forms";
import { CAMP_GROUPS_PATH } from "../../lists-paths";

export const metadata: Metadata = { title: "Add a Camp group" };

export default function NewCampGroupPage() {
  return (
    <Suspense fallback={null}>
      <NewCampGroup />
    </Suspense>
  );
}

async function NewCampGroup() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
      <h1 className="text-title-lg">Add a Camp group</h1>
      {state.context.isAdmin ? (
        <CampGroupForm
          group={{
            name: "",
            grades: [],
            team: null,
            change: "",
            freeSwim: "",
            lunch: "",
            swimLessons: "",
          }}
        />
      ) : (
        <p className="text-muted-foreground">Only an Admin can add Camp groups.</p>
      )}
    </section>
  );
}
