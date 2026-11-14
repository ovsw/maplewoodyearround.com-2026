import type { ActivityVisit } from "@/lib/hq/schedule-views";

/** Visits in time order, one row each; the one running now is marked. */
export function VisitList({
  visits,
  describe,
}: {
  visits: ActivityVisit[];
  describe: (visit: ActivityVisit) => { time: string; what: string };
}) {
  return (
    <ol className="flex flex-col gap-2">
      {visits.map((visit) => {
        const { time, what } = describe(visit);
        return (
          <li
            key={visit.slotId}
            aria-current={visit.isCurrent ? "time" : undefined}
            className={`flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border px-4 py-3 ${
              visit.isCurrent ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <span className="whitespace-nowrap">{time}</span>
            <span className="flex-1 text-lg font-semibold">{what}</span>
            {visit.isCurrent ? <span className="text-label text-primary">Now</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
