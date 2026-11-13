import type { Metadata } from "next";
import { Suspense } from "react";

import { isCampHqRefusal } from "@/lib/hq/operations";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { ActivityForm, RemoveForm } from "../../list-forms";
import { ACTIVITIES_PATH } from "../../lists-paths";

export const metadata: Metadata = { title: "Edit an activity" };

export default function EditActivityPage({ params }: PageProps<"/hq/activities/[id]">) {
  return (
    <Suspense fallback={null}>
      <EditActivity params={params} />
    </Suspense>
  );
}

async function EditActivity({ params }: { params: Promise<{ id: string }> }) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const { id } = await params;

  const activity = await campHq.getActivity(request, id).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found")) return null;
    throw error;
  });

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={ACTIVITIES_PATH}>Activities</BackLink>
      {!activity ? (
        <p className="text-muted-foreground">This activity no longer exists.</p>
      ) : !isAdmin ? (
        <p className="text-muted-foreground">Only an Admin can change activities.</p>
      ) : (
        <>
          <h1 className="text-title-lg">{activity.name}</h1>
          <ActivityForm activity={activity} />
          <hr className="max-w-3xl border-border" />
          <h2 className="text-title">Remove this activity</h2>
          <RemoveForm id={activity.id} name={activity.name} what="activity" />
        </>
      )}
    </section>
  );
}
