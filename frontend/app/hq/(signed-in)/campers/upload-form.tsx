"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";

import { uploadCamperFile } from "./actions";
import { CamperLoadSummary } from "./load-report";
import { MAX_CAMPER_FILE_BYTES, type CamperUploadState } from "./paths";

const initialState: CamperUploadState = {};

export function CamperUploadForm() {
  const [state, formAction, pending] = useActionState(uploadCamperFile, initialState);
  const [tooLarge, setTooLarge] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex max-w-xl flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-label">Camper file (.csv)</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              setTooLarge(Boolean(file && file.size > MAX_CAMPER_FILE_BYTES));
            }}
            className="min-h-11 rounded-control border border-border bg-background p-2 file:mr-3 file:min-h-9 file:rounded-control file:border-0 file:bg-primary/10 file:px-3 file:font-semibold"
          />
        </label>
        {tooLarge ? (
          <p role="alert" className="font-semibold">
            The file is larger than 1 MB. Ask for help before loading it: each load replaces the
            whole camper list, so it cannot be loaded in parts.
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={pending || tooLarge}>
            {pending ? "Loading…" : "Load campers"}
          </Button>
        </div>
      </form>

      {state.error ? (
        <div role="alert" className="max-w-xl rounded-control border border-destructive/60 p-4">
          <p className="font-semibold">{state.error}</p>
        </div>
      ) : null}

      {state.report ? (
        <section
          aria-labelledby="load-report-heading"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
        >
          <h2 id="load-report-heading" className="text-title">
            Load report
          </h2>
          <CamperLoadSummary report={state.report} />
        </section>
      ) : null}
    </div>
  );
}
