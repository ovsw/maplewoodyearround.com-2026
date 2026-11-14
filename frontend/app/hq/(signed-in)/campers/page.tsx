import type { Metadata } from "next";
import { Suspense } from "react";

import { campDate, formatCampDateTime } from "@/lib/hq/camp-dates";
import { CAMPER_CSV_COLUMNS } from "@/lib/hq/camper-csv";

import { BackLink, CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { ClearCamperDataForm } from "./clear-form";
import { CamperLoadErrors } from "./load-report";
import { toReportView } from "./paths";
import { CamperUploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Camper list" };

export default function CampersPage() {
  return (
    <Suspense fallback={null}>
      <Campers />
    </Suspense>
  );
}

const columnHelp: Record<keyof typeof CAMPER_CSV_COLUMNS, string> = {
  camperId: "The camper's id in CampMinder. The same child keeps the same id on every row.",
  name: "The camper's name, as it should appear on lists.",
  date: "One camp day, written YYYY-MM-DD, for example 2027-07-06.",
  campGroup: "The Camp group that day, spelled as in Camp HQ's Camp groups.",
  expected: "yes, or no for a planned absence.",
};

async function Campers() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request, isAdmin } = state.context;

  if (!isAdmin) {
    return (
      <section className="flex flex-col gap-6">
        <BackLink href="/hq">Camp HQ</BackLink>
        <p className="text-muted-foreground">Only an Admin can load the camper list.</p>
      </section>
    );
  }

  const loads = await campHq.listCamperLoads(request, { limit: 10 });
  const last = loads[0];

  return (
    <section className="flex flex-col gap-8">
      <BackLink href="/hq">Camp HQ</BackLink>
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-title-lg">Camper list</h1>
        <p className="text-muted-foreground">
          The camper list comes from CampMinder. Load its export here: each load replaces the
          whole list. Camp HQ has no way to change campers by hand, so correct attendance in
          CampMinder and load the file again.
        </p>
        <p>
          {last
            ? `Last loaded ${formatCampDateTime(last.loadedAt)}.`
            : "No camper list has been loaded yet."}
        </p>
      </div>

      <CamperUploadForm />

      <section aria-labelledby="camper-file-heading" className="flex max-w-3xl flex-col gap-3">
        <h2 id="camper-file-heading" className="text-title">
          The camper file
        </h2>
        <p className="text-muted-foreground">
          A CSV file with one row per camper per camp day. The first row names the columns, in
          any order:
        </p>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-label">
              <th scope="col" className="py-2 pr-4">Column</th>
              <th scope="col" className="py-2">What it holds</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(CAMPER_CSV_COLUMNS) as (keyof typeof CAMPER_CSV_COLUMNS)[]).map((key) => (
              <tr key={key} className="border-b border-border align-top">
                <th scope="row" className="py-2 pr-4 font-semibold whitespace-nowrap">
                  {CAMPER_CSV_COLUMNS[key]}
                </th>
                <td className="py-2">{columnHelp[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="loads-heading" className="flex flex-col gap-3">
        <h2 id="loads-heading" className="text-title">
          Recent loads
        </h2>
        {loads.length === 0 ? (
          <p className="text-muted-foreground">Nothing has been loaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-label">
                  <th scope="col" className="py-3 pr-4">When</th>
                  <th scope="col" className="py-3 pr-4">Source</th>
                  <th scope="col" className="py-3 pr-4">By</th>
                  <th scope="col" className="py-3 pr-4">Added</th>
                  <th scope="col" className="py-3 pr-4">Changed</th>
                  <th scope="col" className="py-3 pr-4">Removed</th>
                  <th scope="col" className="py-3">Rows not read</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((load) => (
                  <tr key={load.id} className="border-b border-border align-top">
                    <td className="py-3 pr-4">{formatCampDateTime(load.loadedAt)}</td>
                    <td className="py-3 pr-4">{load.source}</td>
                    <td className="py-3 pr-4">{load.loadedBy ?? "–"}</td>
                    <td className="py-3 pr-4">{load.added}</td>
                    <td className="py-3 pr-4">{load.changed}</td>
                    <td className="py-3 pr-4">{load.removed}</td>
                    <td className="py-3">
                      {load.errors.length === 0 ? (
                        "0"
                      ) : (
                        <details>
                          <summary className="focus-ring inline-flex min-h-11 cursor-pointer items-center rounded-control text-primary underline underline-offset-4">
                            {load.errors.length}
                          </summary>
                          <div className="mt-2 min-w-80">
                            <CamperLoadErrors report={toReportView(load)} />
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ClearCamperDataForm today={campDate(request.now)} />
    </section>
  );
}
