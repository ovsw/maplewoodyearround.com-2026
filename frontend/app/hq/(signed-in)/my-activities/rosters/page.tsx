import type { Metadata } from "next";
import { Suspense } from "react";

import { formatCampDate } from "@/lib/hq/camp-dates";

import { AutoRefresh } from "../../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { SIGNUP_REFRESH_MS } from "../../club-day/paths";
import { PrintButton } from "../../club-day/print-button";
import { RosterSheet } from "../../club-day/roster-sheet";
import { MY_ACTIVITIES_PATH } from "../../views-paths";

export const metadata: Metadata = { title: "My Club day rosters" };

export default function MyClubDayRostersPage() {
  return (
    <Suspense fallback={null}>
      <MyClubDayRosters />
    </Suspense>
  );
}

async function MyClubDayRosters() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const { date, rosters } = await campHq.getMyClubDayRosters(request);

  return (
    <section className="flex flex-col gap-6 print:gap-0">
      <AutoRefresh intervalMs={SIGNUP_REFRESH_MS} />
      <div className="flex flex-col gap-6 print:hidden">
        <BackLink href={MY_ACTIVITIES_PATH}>My activities</BackLink>
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-title-lg">My Club day rosters</h1>
          <p className="text-lg">{formatCampDate(date)}</p>
          <p className="text-muted-foreground">
            Who should come to your Club day activities today. Picks can change until signups
            lock.
          </p>
        </div>
        {rosters.length > 0 ? <PrintButton>Print my rosters</PrintButton> : null}
      </div>

      {rosters.length === 0 ? (
        <p className="text-muted-foreground">
          None of your activities is a Club day option today. Ask an Admin if this is wrong.
        </p>
      ) : (
        <div className="flex max-w-4xl flex-col gap-6 print:max-w-none print:gap-0">
          {rosters.map((roster) => (
            <RosterSheet key={`${roster.option.id}-${roster.period}`} roster={roster} date={date} />
          ))}
        </div>
      )}
    </section>
  );
}
