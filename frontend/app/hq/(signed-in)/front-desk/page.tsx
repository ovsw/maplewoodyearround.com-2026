import type { Metadata } from "next";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCampDate } from "@/lib/hq/camp-dates";
import type { ChildLookup, ChildLookupResult, ChildWhereabouts } from "@/lib/hq/front-desk";
import { isCampHqRefusal } from "@/lib/hq/operations";
import { formatSlotRange } from "@/lib/hq/schedule-times";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { FRONT_DESK_PATH } from "./paths";

export const metadata: Metadata = { title: "Find a child" };

export default function FrontDeskPage({ searchParams }: PageProps<"/hq/front-desk">) {
  return (
    <Suspense fallback={null}>
      <FrontDesk searchParams={searchParams} />
    </Suspense>
  );
}

async function FrontDesk({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;
  const query = await searchParams;
  const raw = Array.isArray(query.q) ? query.q[0] : query.q;

  let lookup: ChildLookup;
  try {
    lookup = await campHq.findChild(request, raw ?? "");
  } catch (error) {
    if (!isCampHqRefusal(error)) throw error;
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <BackLink href="/hq">Camp HQ</BackLink>
        <p className="text-muted-foreground">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-title-lg">Find a child</h1>
        <p className="text-lg">{formatCampDate(lookup.date)}</p>
        <p className="text-muted-foreground">
          Type part of a child&apos;s name to see where they are right now. Times are camp time
          (New York).
        </p>
      </div>

      <form action={FRONT_DESK_PATH} method="get" role="search" className="flex max-w-xl flex-col gap-2">
        <label htmlFor="child-search" className="text-label">
          Child&apos;s name
        </label>
        <div className="flex gap-3">
          <Input
            id="child-search"
            name="q"
            type="search"
            autoComplete="off"
            autoFocus
            defaultValue={lookup.search}
            placeholder="Type part of a name"
          />
          <Button type="submit">Find</Button>
        </div>
      </form>

      {lookup.search === "" ? null : lookup.results.length === 0 ? (
        <p className="text-lg">No child on the camper list matches “{lookup.search}”.</p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {lookup.results.map((result) => (
              <li key={result.camper.id}>
                <ResultCard result={result} />
              </li>
            ))}
          </ul>
          {lookup.more ? (
            <p className="text-muted-foreground">
              More children match. Type more of the name to narrow the list.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ResultCard({ result }: { result: ChildLookupResult }) {
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      <h2 className="text-title">{result.camper.name}</h2>
      {result.expected ? (
        <>
          <p className="text-muted-foreground">
            {result.campGroup.name}
            {result.finalWeek ? " · Final week" : ""}
          </p>
          <Whereabouts where={result.where} groupName={result.campGroup.name} />
        </>
      ) : (
        <p className="text-lg font-semibold">Not expected today.</p>
      )}
    </article>
  );
}

function Whereabouts({ where, groupName }: { where: ChildWhereabouts; groupName: string }) {
  switch (where.kind) {
    case "outside-hours":
      return (
        <p className="text-lg">
          Camp is not running for {groupName} right now
          {where.dayStart !== null && where.dayEnd !== null
            ? ` (today ${formatSlotRange(where.dayStart, where.dayEnd)})`
            : ""}
          .
        </p>
      );
    case "no-schedule":
      return (
        <p className="text-lg">
          {groupName} has no schedule for today. Ask the group&apos;s leader where they are.
        </p>
      );
    case "nothing-booked":
      return (
        <p className="text-lg">
          {groupName} has nothing booked right now. Ask the group&apos;s leader where they are.
        </p>
      );
    case "activity":
      return (
        <>
          <p className="text-lg">
            Now at <strong>{where.activity.name}</strong> with {groupName}, {formatSlotRange(where.start, where.end)}.
          </p>
          {where.location ? (
            <p className="text-lg">
              Location: <strong>{where.location}</strong>
            </p>
          ) : null}
        </>
      );
    case "club-day":
      return where.activity ? (
        <p className="text-lg">
          Club day, period {where.period} ({formatSlotRange(where.start, where.end)}): at{" "}
          <strong>{where.activity.name}</strong>.
        </p>
      ) : (
        <p className="text-lg">
          Club day, period {where.period} ({formatSlotRange(where.start, where.end)}): no Club day
          pick. Ask {groupName}&apos;s leader.
        </p>
      );
  }
}
