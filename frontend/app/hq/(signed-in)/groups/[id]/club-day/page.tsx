import type { Metadata } from "next";
import { Suspense } from "react";

import { formatCampDate } from "@/lib/hq/camp-dates";
import type { ClubDaySignups } from "@/lib/hq/club-day-signups";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { formatSlotRange, formatSlotTime } from "@/lib/hq/schedule-times";

import { AutoRefresh } from "../../../auto-refresh";
import { BackLink, CampHqPageNotice, loadCampHqPage } from "../../../camp-hq-page";
import { CLUB_DAY_MISSING_PATH, SIGNUP_REFRESH_MS } from "../../../club-day/paths";

import { SignupBoard } from "./signup-board";

export const metadata: Metadata = { title: "Club day signups" };

export default function ClubDaySignupsPage({ params }: PageProps<"/hq/groups/[id]/club-day">) {
  return (
    <Suspense fallback={null}>
      <ClubDaySignupsView params={params} />
    </Suspense>
  );
}

async function ClubDaySignupsView({ params }: { params: Promise<{ id: string }> }) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;
  const { id } = await params;
  const back = isAdmin ? (
    <BackLink href={CLUB_DAY_MISSING_PATH}>Children with no pick</BackLink>
  ) : (
    <BackLink href="/hq">Camp HQ</BackLink>
  );

  const signups = await campHq.getClubDaySignups(request, id).catch((error: unknown) => {
    if (isCampHqRefusal(error, "not-found") || isCampHqRefusal(error, "not-your-group")) {
      return error.message;
    }
    throw error;
  });

  if (typeof signups === "string") {
    return (
      <section className="flex flex-col gap-6">
        {back}
        <p className="text-muted-foreground">{signups}</p>
      </section>
    );
  }

  const { campGroup, periods, campers } = signups;
  return (
    <section className="flex flex-col gap-8">
      <AutoRefresh intervalMs={SIGNUP_REFRESH_MS} />
      {back}
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg">Club day: {campGroup.name}</h1>
        <p className="text-lg">
          {formatCampDate(signups.date)} · Team {campGroup.team}
        </p>
        <WindowNote signups={signups} isAdmin={isAdmin} />
      </div>

      {periods.length === 0 ? (
        <p className="text-muted-foreground">{campGroup.name} has no Club day period today.</p>
      ) : campers.length === 0 ? (
        <p className="text-muted-foreground">No children are expected in this group today.</p>
      ) : (
        <>
          {signups.options.length === 0 ? (
            <p className="text-muted-foreground">
              Team {campGroup.team} has no Club day options today. Ask an Admin.
            </p>
          ) : (
            <PlacesLeft signups={signups} />
          )}
          <MissingPicks signups={signups} />
          <SignupBoard signups={signups} />
          <WhoGoesWhere signups={signups} />
        </>
      )}
    </section>
  );
}

function WindowNote({ signups, isAdmin }: { signups: ClubDaySignups; isAdmin: boolean }) {
  const open = formatSlotTime(signups.settings.signupOpen);
  const lock = formatSlotTime(signups.settings.signupLock);
  let text: string;
  if (signups.window === "before-open") {
    text = `Signups open at ${open} and lock at ${lock}. Picks cannot be entered yet.`;
  } else if (signups.window === "open") {
    text = `Signups are open until ${lock}. A pick is saved as soon as you choose it.`;
  } else if (isAdmin) {
    text = `Signups locked at ${lock}. As an Admin you can still change picks.`;
  } else {
    text = `Signups locked at ${lock}. Picks are read-only now; ask an Admin to change one.`;
  }
  return (
    <p className={signups.window === "open" ? "font-semibold" : "text-muted-foreground"}>{text}</p>
  );
}

function PlacesLeft({ signups }: { signups: ClubDaySignups }) {
  const { periods, options, campGroup } = signups;
  return (
    <section aria-labelledby="places-heading" className="flex flex-col gap-3">
      <h2 id="places-heading" className="text-title">
        Places left
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full max-w-3xl border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 text-label">
                Option
              </th>
              {periods.map((period) => (
                <th key={period.period} scope="col" className="py-2 pr-4 text-label">
                  Period {period.period}
                  <span className="block font-normal text-muted-foreground">
                    {formatSlotRange(period.start, period.end)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id} className="border-b border-border">
                <th scope="row" className="py-3 pr-4 text-lg font-normal">
                  {option.activity.name}
                  {option.maxPerGroup !== null ? (
                    <span className="block text-sm text-muted-foreground">
                      At most {option.maxPerGroup} from {campGroup.name}
                    </span>
                  ) : null}
                </th>
                {option.places.map((places) => (
                  <td key={places.period} className="py-3 pr-4 text-lg">
                    {places.left === 0 ? (
                      <strong className="text-destructive">Full</strong>
                    ) : (
                      <>
                        <strong>{places.left}</strong> left
                      </>
                    )}
                    <span className="block text-sm text-muted-foreground">
                      {places.taken} of {option.maxPerPeriod} taken
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MissingPicks({ signups }: { signups: ClubDaySignups }) {
  const { missing, periods } = signups;
  return (
    <section
      aria-labelledby="missing-heading"
      className="flex max-w-3xl flex-col gap-2 rounded-lg border border-border bg-card p-5"
    >
      <h2 id="missing-heading" className="text-title">
        No pick yet: {missing.length}
      </h2>
      {missing.length === 0 ? (
        <p className="text-muted-foreground">Every child has a pick for each period.</p>
      ) : (
        <ul className="flex flex-col">
          {missing.map((camper) => (
            <li key={camper.id} className="flex min-h-11 items-center gap-2 text-lg">
              {camper.name}
              {periods.length > 1 ? (
                <span className="text-sm text-muted-foreground">
                  (period {camper.periods.join(" and ")})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WhoGoesWhere({ signups }: { signups: ClubDaySignups }) {
  const { periods, byOption } = signups;
  return (
    <section aria-labelledby="where-heading" className="flex flex-col gap-4">
      <h2 id="where-heading" className="text-title">
        Who goes where
      </h2>
      {byOption.length === 0 ? (
        <p className="text-muted-foreground">No picks yet.</p>
      ) : (
        periods.map((period) => {
          const lists = byOption.filter((entry) => entry.period === period.period);
          return (
            <div key={period.period} className="flex flex-col gap-2">
              <h3 className="text-label">
                Period {period.period}, {formatSlotRange(period.start, period.end)}
              </h3>
              {lists.length === 0 ? (
                <p className="text-muted-foreground">No picks yet.</p>
              ) : (
                <ul className="grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {lists.map((entry) => (
                    <li
                      key={entry.option.id}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4"
                    >
                      <span className="font-semibold">
                        {entry.option.name} ({entry.campers.length})
                      </span>
                      <span>{entry.campers.map((camper) => camper.name).join(", ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
