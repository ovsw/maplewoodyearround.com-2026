import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { ActivityForm } from "../../list-forms";
import { ACTIVITIES_PATH } from "../../lists-paths";

export const metadata: Metadata = { title: "Add an activity" };

/** `?club-only=1` starts the form with "Offered only on Club day" ticked. */
export default function NewActivityPage({ searchParams }: PageProps<"/hq/activities/new">) {
  return (
    <Suspense fallback={null}>
      <NewActivity searchParams={searchParams} />
    </Suspense>
  );
}

async function NewActivity({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const clubOnly = (await searchParams)["club-only"] === "1";

  return (
    <section className="flex flex-col gap-6">
      <BackLink href={ACTIVITIES_PATH}>Activities</BackLink>
      <h1 className="text-title-lg">
        {clubOnly ? "Add a Club day only activity" : "Add an activity"}
      </h1>
      {state.context.isAdmin ? (
        <ActivityForm activity={{ name: "", grades: [], kind: "exclusive", clubOnly }} />
      ) : (
        <p className="text-muted-foreground">Only an Admin can add activities.</p>
      )}
    </section>
  );
}
