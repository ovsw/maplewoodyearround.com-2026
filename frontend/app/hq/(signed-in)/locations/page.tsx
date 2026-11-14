import type { Metadata } from "next";
import { Suspense } from "react";

import { AutoRefresh } from "../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { LocationValue, locationKeys, locationLabels } from "../schedule-view-parts";
import { SCHEDULE_REFRESH_MS } from "../views-paths";

export const metadata: Metadata = { title: "Group locations" };

export default function GroupLocationsPage() {
  return (
    <Suspense fallback={null}>
      <GroupLocations />
    </Suspense>
  );
}

async function GroupLocations() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const groups = await campHq.listGroupLocations(request);

  return (
    <section className="flex flex-col gap-6">
      <AutoRefresh intervalMs={SCHEDULE_REFRESH_MS} />
      <BackLink href="/hq">Camp HQ</BackLink>
      <h1 className="text-title-lg">Group locations</h1>
      {groups.length === 0 ? (
        <p className="text-muted-foreground">There are no Camp groups yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-label">
                <th scope="col" className="py-3 pr-4">Camp group</th>
                {locationKeys.map((key) => (
                  <th key={key} scope="col" className="py-3 pr-4">
                    {locationLabels[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border align-middle">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {group.name}
                  </th>
                  {locationKeys.map((key) => (
                    <td key={key} className="py-3 pr-4">
                      <LocationValue value={group.locations[key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
