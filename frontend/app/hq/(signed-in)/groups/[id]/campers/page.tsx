import type { Metadata } from "next";
import { Suspense } from "react";

import { formatCampDate, formatCampDateTime } from "@/lib/hq/camp-dates";
import { isCampHqRefusal } from "@/lib/hq/operations";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../camp-hq-page";

export const metadata: Metadata = { title: "Campers today" };

export default function GroupCampersPage({ params }: PageProps<"/hq/groups/[id]/campers">) {
  return (
    <Suspense fallback={null}>
      <GroupCampers params={params} />
    </Suspense>
  );
}

async function GroupCampers({ params }: { params: Promise<{ id: string }> }) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const { id } = await params;

  const { list, refusal } = await campHq.getGroupCamperList(request, id).then(
    (found) => ({ list: found, refusal: null }),
    (error: unknown) => {
      if (isCampHqRefusal(error, "not-found") || isCampHqRefusal(error, "not-your-group")) {
        return { list: null, refusal: error.message };
      }
      throw error;
    },
  );

  if (!list) {
    return (
      <section className="flex flex-col gap-6">
        <BackLink href="/hq">Camp HQ</BackLink>
        <p className="text-muted-foreground">{refusal}</p>
      </section>
    );
  }

  const finalWeekCount = list.campers.filter((camper) => camper.finalWeek).length;

  return (
    <section className="flex flex-col gap-6">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Campers today: {list.campGroup.name}</h1>
        <p className="text-lg">{formatCampDate(list.date)}</p>
        <p className="text-muted-foreground">
          {list.lastLoadedAt
            ? `Camper list last updated ${formatCampDateTime(list.lastLoadedAt)}. Ask the front desk if a child looks wrong.`
            : "The camper list has not been loaded yet. Ask the front desk."}
        </p>
      </div>

      {list.campers.length === 0 ? (
        <p className="text-muted-foreground">No children are expected in this group today.</p>
      ) : (
        <>
          <p>
            <strong>{list.campers.length}</strong>{" "}
            {list.campers.length === 1 ? "child is" : "children are"} expected today
            {finalWeekCount > 0 ? (
              <>
                , <strong>{finalWeekCount}</strong> in their final week
              </>
            ) : null}
            .
          </p>
          <ol className="flex max-w-2xl flex-col">
            {list.campers.map((camper) => (
              <li
                key={camper.id}
                className="flex min-h-11 items-center justify-between gap-4 border-b border-border py-2 text-lg"
              >
                <span>{camper.name}</span>
                {camper.finalWeek ? (
                  <span className="rounded-control border border-primary bg-primary/10 px-2 py-1 text-sm font-semibold">
                    Final week
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
