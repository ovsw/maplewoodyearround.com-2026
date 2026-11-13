import type { Metadata } from "next";
import { Suspense } from "react";

import { isCampHqRefusal } from "@/lib/hq/operations";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { CampGroupForm, RemoveForm } from "../../list-forms";
import { CAMP_GROUPS_PATH } from "../../lists-paths";

export const metadata: Metadata = { title: "Edit a Camp group" };

export default function EditCampGroupPage({ params }: PageProps<"/hq/groups/[id]">) {
  return (
    <Suspense fallback={null}>
      <EditCampGroup params={params} />
    </Suspense>
  );
}

async function EditCampGroup({ params }: { params: Promise<{ id: string }> }) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const { id } = await params;

  const group = await campHq.getCampGroup(request, id).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found")) return null;
    throw error;
  });

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={CAMP_GROUPS_PATH}>Camp groups</BackLink>
      {!group ? (
        <p className="text-muted-foreground">This Camp group no longer exists.</p>
      ) : !isAdmin ? (
        <p className="text-muted-foreground">Only an Admin can change Camp groups.</p>
      ) : (
        <>
          <h1 className="text-title-lg">{group.name}</h1>
          {group.teamIsSample ? (
            <p className="text-muted-foreground">
              Team {group.team} is sample data. Choose another Team to replace it.
            </p>
          ) : null}
          <CampGroupForm
            group={{
              id: group.id,
              name: group.name,
              grades: group.grades,
              team: group.team,
              ...group.locations,
            }}
          />
          <hr className="max-w-3xl border-border" />
          <h2 className="text-title">Remove this Camp group</h2>
          <RemoveForm id={group.id} name={group.name} what="camp-group" />
        </>
      )}
    </section>
  );
}
