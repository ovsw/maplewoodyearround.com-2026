import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatCampDate } from "@/lib/hq/camp-dates";
import type { MissingPicks } from "@/lib/hq/club-day-signups";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { formatSlotTime } from "@/lib/hq/schedule-times";

import { AutoRefresh } from "../../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../camp-hq-page";
import { CLUB_DAY_ROSTERS_PATH, SIGNUP_REFRESH_MS, groupClubDayPath } from "../paths";

export const metadata: Metadata = { title: "Children with no Club day pick" };

const linkClassName =
  "focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4";

export default function MissingPicksPage() {
  return (
    <Suspense fallback={null}>
      <MissingPicksView />
    </Suspense>
  );
}

function windowText(missing: MissingPicks) {
  const open = formatSlotTime(missing.settings.signupOpen);
  const lock = formatSlotTime(missing.settings.signupLock);
  if (missing.window === "before-open") return `Signups open at ${open} and lock at ${lock}.`;
  if (missing.window === "open") return `Signups are open until ${lock}. Leaders are still entering picks.`;
  return `Signups locked at ${lock}. Only Admins can enter or change picks now.`;
}

async function MissingPicksView() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;

  let missing: MissingPicks;
  try {
    missing = await campHq.getMissingClubDayPicks(request);
  } catch (error) {
    if (!isCampHqRefusal(error)) throw error;
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <BackLink href="/hq">Camp HQ</BackLink>
        <p className="text-muted-foreground">{error.message}</p>
      </section>
    );
  }
  const groups = await campHq.listCampGroups(request);
  const total = missing.groups.reduce((sum, group) => sum + group.campers.length, 0);

  return (
    <section className="flex flex-col gap-8">
      <AutoRefresh intervalMs={SIGNUP_REFRESH_MS} />
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-title-lg">Children with no Club day pick</h1>
        <p className="text-lg">{formatCampDate(missing.date)}</p>
        <p className="text-muted-foreground">{windowText(missing)}</p>
        <Link href={CLUB_DAY_ROSTERS_PATH} className={linkClassName}>
          Today&apos;s Club day rosters
        </Link>
      </div>

      {total === 0 ? (
        <p className="text-lg">Every child expected today has a pick for each Club day period.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-lg">
            <strong>{total}</strong> {total === 1 ? "child has" : "children have"} no pick yet.
          </p>
          {missing.groups.map((group) => (
            <section
              key={group.campGroup.id}
              aria-labelledby={`missing-${group.campGroup.id}`}
              className="flex max-w-3xl flex-col gap-2 rounded-lg border border-border bg-card p-5"
            >
              <h2 id={`missing-${group.campGroup.id}`} className="text-title">
                {group.campGroup.name}: {group.campers.length}
              </h2>
              <ul className="flex flex-col">
                {group.campers.map((camper) => (
                  <li key={camper.id} className="flex min-h-11 items-center gap-2 text-lg">
                    {camper.name}
                    <span className="text-sm text-muted-foreground">
                      (period {camper.periods.join(" and ")})
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={groupClubDayPath(group.campGroup.id)} className={linkClassName}>
                Enter picks for {group.campGroup.name}
              </Link>
            </section>
          ))}
        </div>
      )}

      <nav aria-labelledby="all-groups-heading" className="flex flex-col gap-2">
        <h2 id="all-groups-heading" className="text-title">
          Signups by Camp group
        </h2>
        <ul className="flex flex-wrap gap-x-6">
          {groups.map((group) => (
            <li key={group.id}>
              <Link href={groupClubDayPath(group.id)} className={linkClassName}>
                {group.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
