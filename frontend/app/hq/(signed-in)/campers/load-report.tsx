// The report of one camper load. Used by the upload form and the load history.
import { formatCampDateTime } from "@/lib/hq/camp-dates";

import type { CamperLoadReportView } from "./paths";

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export function CamperLoadCounts({ report }: { report: CamperLoadReportView }) {
  const counts = [
    { label: "Added", value: report.added },
    { label: "Changed", value: report.changed },
    { label: "Removed", value: report.removed },
    { label: "Unchanged", value: report.unchanged },
    { label: "Rows not read", value: report.errors.length },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {counts.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1 rounded-control border border-border p-3">
          <dt className="text-label">{label}</dt>
          <dd className="text-title">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Every row that could not be used, with its reason. */
export function CamperLoadErrors({ report }: { report: CamperLoadReportView }) {
  if (report.errors.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-title">
        {plural(report.errors.length, "row could not be read", "rows could not be read")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-label">
              <th scope="col" className="py-2 pr-4">Row</th>
              <th scope="col" className="py-2 pr-4">Camper ID</th>
              <th scope="col" className="py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {report.errors.map((error, index) => (
              <tr key={index} className="border-b border-border align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{error.row ?? "–"}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{error.camperId ?? "–"}</td>
                <td className="py-2">{error.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** What a load did, in plain sentences, then the counts and the rows not read. */
export function CamperLoadSummary({ report }: { report: CamperLoadReportView }) {
  return (
    <div className="flex flex-col gap-4">
      <p>
        {report.source}, loaded {formatCampDateTime(new Date(report.loadedAt))}
        {report.loadedBy ? ` by ${report.loadedBy}` : ""}.{" "}
        {plural(report.rowCount, "row was read", "rows were read")}.
      </p>
      <CamperLoadCounts report={report} />
      {report.campersKept > 0 ? (
        <p>
          {plural(report.campersKept, "camper was", "campers were")} left as before because
          some of their rows could not be read. Correct those rows and load the file again.
        </p>
      ) : null}
      {report.removalsSkipped ? (
        <p>
          Nobody was removed: some rows could not be matched to a camper, or the file had no
          camper rows.
        </p>
      ) : null}
      <CamperLoadErrors report={report} />
    </div>
  );
}
