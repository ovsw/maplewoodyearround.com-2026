import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatCampDate } from "@/lib/hq/camp-dates";
import type { ClubDayRosters, RosterChoice } from "@/lib/hq/club-day-rosters";
import { isCampHqRefusal } from "@/lib/hq/operations";

import { AutoRefresh } from "../../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import {
  CLUB_DAY_MISSING_PATH,
  CLUB_DAY_ROSTERS_PATH,
  SIGNUP_REFRESH_MS,
  clubDayRosterPath,
} from "../paths";
import { PrintButton } from "../print-button";
import { RosterSheet } from "../roster-sheet";

export const metadata: Metadata = { title: "Club day rosters" };

const linkClassName =
  "focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4";

export default function ClubDayRostersPage({ searchParams }: PageProps<"/hq/club-day/rosters">) {
  return (
    <Suspense fallback={null}>
      <ClubDayRostersView searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function ClubDayRostersView({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const query = await searchParams;
  const optionId = first(query.option);
  const only: RosterChoice | undefined = optionId
    ? { optionId, period: first(query.period) ?? "" }
    : undefined;

  let result: ClubDayRosters;
  try {
    result = await campHq.getClubDayRosters(request, only);
  } catch (error) {
    if (!isCampHqRefusal(error)) throw error;
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <BackLink href={only ? CLUB_DAY_ROSTERS_PATH : "/hq"}>
          {only ? "All Club day rosters" : "Camp HQ"}
        </BackLink>
        <p className="text-muted-foreground">{error.message}</p>
      </section>
    );
  }
  const { date, rosters } = result;

  return (
    <section className="flex flex-col gap-8 print:gap-0">
      <AutoRefresh intervalMs={SIGNUP_REFRESH_MS} />
      <div className="flex flex-col gap-6 print:hidden">
        <BackLink href={only ? CLUB_DAY_ROSTERS_PATH : "/hq"}>
          {only ? "All Club day rosters" : "Camp HQ"}
        </BackLink>
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-title-lg">{only ? "Club day roster" : "Club day rosters"}</h1>
          <p className="text-lg">{formatCampDate(date)}</p>
          <p className="text-muted-foreground">
            {only
              ? "One roster. It prints on one page."
              : "One roster for each Club day option and period today. Each roster prints on its own page."}{" "}
            Print after signups lock, so the rosters stay correct.
          </p>
        </div>
        {rosters.length > 0 ? (
          <PrintButton>{only ? "Print this roster" : "Print all rosters"}</PrintButton>
        ) : null}
        {!only && rosters.length > 0 ? (
          <nav aria-labelledby="roster-list-heading" className="flex flex-col gap-2">
            <h2 id="roster-list-heading" className="text-title">
              Open one roster
            </h2>
            <ul className="flex flex-wrap gap-x-6">
              {rosters.map((roster) => (
                <li key={`${roster.option.id}-${roster.period}`}>
                  <Link href={clubDayRosterPath(roster.option.id, roster.period)} className={linkClassName}>
                    {roster.activity.name}, period {roster.period}
                    {rosters.some(
                      (other) =>
                        other.activity.id === roster.activity.id && other.option.team !== roster.option.team,
                    )
                      ? ` (Team ${roster.option.team})`
                      : ""}{" "}
                    ({roster.campers.length})
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      {rosters.length === 0 ? (
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-lg">There are no Club day rosters today.</p>
          <p className="text-muted-foreground">
            Rosters appear on a day when a Camp group has a Club day period and its Team has
            Club day options.
          </p>
        </div>
      ) : (
        <div className="flex max-w-4xl flex-col gap-6 print:max-w-none print:gap-0">
          {rosters.map((roster) => (
            <RosterSheet key={`${roster.option.id}-${roster.period}`} roster={roster} date={date} />
          ))}
        </div>
      )}

      <p className="print:hidden">
        <Link href={CLUB_DAY_MISSING_PATH} className={linkClassName}>
          Children with no Club day pick
        </Link>
      </p>
    </section>
  );
}
