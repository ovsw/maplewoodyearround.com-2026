"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCampDate } from "@/lib/hq/camp-dates";
import { CLEAR_CONFIRMATION_WORD } from "@/lib/hq/campers";

import { clearPastSummer } from "./actions";
import type { ClearCamperDataState } from "./paths";

const initialState: ClearCamperDataState = {};

function count(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`;
}

/** Clears a past summer's camper data after the Admin types the confirmation word. */
export function ClearCamperDataForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState(clearPastSummer, initialState);

  return (
    <section
      aria-labelledby="clear-heading"
      className="flex max-w-3xl flex-col gap-4 rounded-lg border border-destructive/60 p-5"
    >
      <h2 id="clear-heading" className="text-title">
        Clear a past summer
      </h2>
      <p className="text-muted-foreground">
        Camp HQ keeps camper data until an Admin clears it; nothing is cleared on its own. Clearing
        removes every camper day and Club day pick before the date you choose, the campers with no
        day left, and the records of loads made before it. It cannot be undone.
      </p>
      <form action={formAction} className="flex max-w-xl flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-label">Clear everything before</span>
          <Input type="date" name="before" max={today} required />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-label">Type {CLEAR_CONFIRMATION_WORD} to confirm</span>
          <Input name="confirmation" autoComplete="off" required />
        </label>
        <div>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Clearing…" : "Clear camper data"}
          </Button>
        </div>
      </form>

      {state.error ? (
        <p role="alert" className="font-semibold">
          {state.error}
        </p>
      ) : null}
      {state.cleared ? (
        <p role="status" className="font-semibold">
          Cleared everything before {formatCampDate(state.cleared.before)}:{" "}
          {count(state.cleared.campers, "camper", "campers")},{" "}
          {count(state.cleared.camperDays, "camper day", "camper days")},{" "}
          {count(state.cleared.clubDayPicks, "Club day pick", "Club day picks")} and{" "}
          {count(state.cleared.camperLoads, "load record", "load records")}.
        </p>
      ) : null}
    </section>
  );
}
