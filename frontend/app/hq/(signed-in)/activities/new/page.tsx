import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { ActivityForm } from "../../list-forms";
import { ACTIVITIES_PATH } from "../../lists-paths";

export const metadata: Metadata = { title: "Add an activity" };

export default function NewActivityPage() {
  return (
    <Suspense fallback={null}>
      <NewActivity />
    </Suspense>
  );
}

async function NewActivity() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={ACTIVITIES_PATH}>Activities</BackLink>
      <h1 className="text-title-lg">Add an activity</h1>
      {state.context.isAdmin ? (
        <ActivityForm activity={{ name: "", grades: [], kind: "exclusive" }} />
      ) : (
        <p className="text-muted-foreground">Only an Admin can add activities.</p>
      )}
    </section>
  );
}
