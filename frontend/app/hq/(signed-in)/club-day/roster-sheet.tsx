import { formatCampDate } from "@/lib/hq/camp-dates";
import type { ClubDayRoster } from "@/lib/hq/club-day-rosters";
import { formatSlotRange } from "@/lib/hq/schedule-times";

function names(people: { name: string }[], none: string) {
  return people.length === 0 ? none : people.map((person) => person.name).join(", ");
}

/**
 * One Club day roster: the option, the period, its staff and the children
 * going. Printed, each roster starts on its own page.
 */
export function RosterSheet({ roster, date }: { roster: ClubDayRoster; date: string }) {
  const headingId = `roster-${roster.option.id}-${roster.period}`;
  const count = roster.campers.length;
  return (
    <section
      id={headingId}
      aria-labelledby={`${headingId}-heading`}
      className="flex scroll-mt-4 flex-col gap-4 rounded-lg border border-border bg-card p-5 print:break-after-page print:rounded-none print:border-0 print:p-0 print:last:break-after-auto"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${headingId}-heading`} className="text-title">
          {roster.activity.name}, period {roster.period}
        </h2>
        <p className="text-muted-foreground print:text-foreground">
          {formatCampDate(date)} · Team {roster.option.team}
          {roster.times.length > 0
            ? ` · ${roster.times.map((time) => formatSlotRange(time.start, time.end)).join(" or ")}`
            : ""}
        </p>
      </div>

      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-label">Specialist</dt>
        <dd>{roster.specialist?.name ?? "None assigned"}</dd>
        <dt className="text-label">Junior staff</dt>
        <dd>{names(roster.juniorStaff, "None assigned")}</dd>
        <dt className="text-label">Children</dt>
        <dd>
          {count} of {roster.option.maxPerPeriod} places
        </dd>
      </dl>

      {count === 0 ? (
        <p className="text-muted-foreground print:text-foreground">No child has picked this option.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-12 py-2 pr-3 text-label">
                #
              </th>
              <th scope="col" className="py-2 pr-3 text-label">
                Child
              </th>
              <th scope="col" className="py-2 pr-3 text-label">
                Camp group
              </th>
              <th scope="col" className="py-2 text-label">
                Final week
              </th>
            </tr>
          </thead>
          <tbody>
            {roster.campers.map((camper, index) => (
              <tr key={camper.id} className="border-b border-border print:break-inside-avoid">
                <td className="py-2 pr-3 text-muted-foreground print:text-foreground">{index + 1}</td>
                <td className="py-2 pr-3 text-lg font-semibold">{camper.name}</td>
                <td className="py-2 pr-3">{camper.campGroup.name}</td>
                <td className="py-2">{camper.finalWeek ? "★ Final week" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
