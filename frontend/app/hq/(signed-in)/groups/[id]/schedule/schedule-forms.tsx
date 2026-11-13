"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  addScheduleSlot,
  changeScheduleSlotTimes,
  removeScheduleSlot,
  setScheduleSlotContent,
} from "./schedule-actions";
import { scheduleDayPath, type ScheduleFormState } from "./schedule-paths";

const initialState: ScheduleFormState = {};

const linkClass =
  "focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4";

function ScheduleFormError({ state }: { state: ScheduleFormState }) {
  if (!state.error) return null;
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-control border border-destructive/60 p-4">
      <p className="font-semibold">{state.error}</p>
      {state.other ? (
        <p>
          <Link href={scheduleDayPath(state.other.id, state.other.weekday)} className={linkClass}>
            Open the schedule of {state.other.name}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function TimeField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label">{label}</span>
      <Input type="time" name={name} defaultValue={defaultValue} step={60} required />
    </label>
  );
}

type SlotIds = { groupId: string; weekday: number };

export function AddSlotForm({
  groupId,
  weekday,
  start,
  end,
}: SlotIds & { start: string; end: string }) {
  const [state, action, pending] = useActionState(addScheduleSlot, initialState);
  const values = state.values ?? { start, end };
  return (
    <form
      // A new key after each save resets the fields to the next suggested times.
      key={state.savedAt ?? "new"}
      action={action}
      className="flex max-w-3xl flex-col gap-4"
    >
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="weekday" value={weekday} />
      <ScheduleFormError state={state} />
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-4">
        <TimeField name="start" label="Starts" defaultValue={values.start} />
        <TimeField name="end" label="Ends" defaultValue={values.end} />
        <Button type="submit" disabled={pending}>
          Add slot
        </Button>
      </div>
    </form>
  );
}

export function RemoveSlotForm({
  slotId,
  weekday,
  label,
}: {
  slotId: string;
  weekday: number;
  label: string;
}) {
  const [state, action, pending] = useActionState(removeScheduleSlot, initialState);
  return (
    <form
      action={action}
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        if (!window.confirm(`Remove the ${label} slot?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="slotId" value={slotId} />
      <input type="hidden" name="weekday" value={weekday} />
      <ScheduleFormError state={state} />
      <Button type="submit" variant="ghost" disabled={pending} aria-label={`Remove the ${label} slot`}>
        Remove
      </Button>
    </form>
  );
}

export function SlotTimesForm({
  groupId,
  weekday,
  slotId,
  start,
  end,
}: SlotIds & { slotId: string; start: string; end: string }) {
  const [state, action, pending] = useActionState(changeScheduleSlotTimes, initialState);
  const values = state.values ?? { start, end };
  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="weekday" value={weekday} />
      <input type="hidden" name="slotId" value={slotId} />
      <ScheduleFormError state={state} />
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-4">
        <TimeField name="start" label="Starts" defaultValue={values.start} />
        <TimeField name="end" label="Ends" defaultValue={values.end} />
        <Button type="submit" disabled={pending}>
          Save times
        </Button>
      </div>
    </form>
  );
}

export type SlotChoiceOption = {
  value: string;
  label: string;
  /** Set for an Exclusive activity another group has at an overlapping time. */
  bookedBy?: { groupId: string; groupName: string; times: string };
};

export function SlotContentForm({
  groupId,
  weekday,
  slotId,
  current,
  options,
}: SlotIds & { slotId: string; current: string; options: SlotChoiceOption[] }) {
  const [state, action, pending] = useActionState(setScheduleSlotContent, initialState);
  const selected = state.values?.choice ?? current;
  return (
    <form action={action} className="flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="weekday" value={weekday} />
      <input type="hidden" name="slotId" value={slotId} />
      <ScheduleFormError state={state} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label">What happens in this slot</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            // The slot's own booking stays choosable, so saving unchanged keeps it.
            const unavailable = Boolean(option.bookedBy) && option.value !== current;
            return (
              <div
                key={option.value}
                className={`flex flex-wrap items-center gap-x-3 rounded-control border border-border px-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:disabled]:bg-muted/40 ${option.bookedBy ? "sm:col-span-2" : ""}`}
              >
                <label
                  className={`flex min-h-11 items-center gap-3 ${unavailable ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="choice"
                    value={option.value}
                    defaultChecked={selected === option.value}
                    disabled={unavailable}
                    className="size-5 accent-primary"
                  />
                  <span>
                    {option.label}
                    {unavailable ? " (unavailable)" : null}
                  </span>
                </label>
                {option.bookedBy ? (
                  <p className="text-sm text-muted-foreground">
                    Booked by{" "}
                    <Link href={scheduleDayPath(option.bookedBy.groupId, weekday)} className={linkClass}>
                      {option.bookedBy.groupName}
                    </Link>
                    , {option.bookedBy.times}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>
      <div>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
