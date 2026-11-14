"use client";

import { startTransition, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { matchesCamperName } from "@/lib/hq/camper-search";
import type { ClubDaySignups, SignupCamper } from "@/lib/hq/club-day-signups";
import { formatSlotRange } from "@/lib/hq/schedule-times";
import { cn } from "@/lib/utils";

import { setPickAction } from "./actions";

const selectClassName =
  "border-input flex min-h-(--control-height) w-full min-w-48 rounded-control border bg-background px-4 py-3 text-base focus-field disabled:opacity-60";

/** A pick being saved, or the refusal of the last save, for one child and period. */
type SaveState = { saving: string | null; error: string | null };

const cellKey = (camperId: string, period: number) => `${camperId}:${period}`;

/** The children of the group with a pick for each period, and a name search. */
export function SignupBoard({ signups }: { signups: ClubDaySignups }) {
  const [search, setSearch] = useState("");
  // Kept here, not in each picker, so a save finishing while its child is
  // filtered out by the search still shows its refusal when they come back.
  const [saves, setSaves] = useState<Record<string, SaveState>>({});
  const searchId = useId();
  const shown = signups.campers.filter((camper) => matchesCamperName(camper.name, search));

  async function save(camperId: string, period: number, optionId: string) {
    const key = cellKey(camperId, period);
    if (saves[key]?.saving != null) return;
    setSaves((all) => ({ ...all, [key]: { saving: optionId, error: null } }));
    let error: string | null = null;
    try {
      const result = await setPickAction({
        camperId,
        date: signups.date,
        period,
        optionId: optionId || null,
      });
      error = result.error ?? null;
    } catch {
      error = "The pick could not be saved. Try again.";
    }
    // Lands with the refreshed page, so the saved pick shows without a flicker.
    startTransition(() => {
      setSaves((all) => ({ ...all, [key]: { saving: null, error } }));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-md flex-col gap-2">
        <label htmlFor={searchId} className="text-label">
          Find a child
        </label>
        <Input
          id={searchId}
          type="search"
          autoComplete="off"
          placeholder="Type part of a name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {shown.length === 0 ? (
        <p className="text-muted-foreground">No child in this group matches “{search.trim()}”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 text-label">
                  Child
                </th>
                {signups.periods.map((period) => (
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
              {shown.map((camper) => (
                <tr key={camper.id} className="border-b border-border align-top">
                  <th scope="row" className="py-3 pr-4 text-lg font-normal">
                    {camper.name}
                    {camper.finalWeek ? (
                      <span className="ml-2 rounded-control border border-primary bg-primary/10 px-2 py-0.5 text-sm font-semibold">
                        Final week
                      </span>
                    ) : null}
                  </th>
                  {signups.periods.map((period, index) => (
                    <td key={period.period} className="py-2 pr-4">
                      {signups.canEdit ? (
                        <PickSelect
                          signups={signups}
                          camper={camper}
                          period={period.period}
                          current={camper.picks[index]}
                          periodIndex={index}
                          state={saves[cellKey(camper.id, period.period)]}
                          onChange={(optionId) => save(camper.id, period.period, optionId)}
                        />
                      ) : (
                        <span className="inline-flex min-h-11 items-center text-lg">
                          {optionName(signups, camper.picks[index]) ?? (
                            <span className="text-muted-foreground">No pick</span>
                          )}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function optionName(signups: ClubDaySignups, optionId: string | null) {
  if (!optionId) return null;
  return signups.options.find((option) => option.id === optionId)?.activity.name ?? null;
}

/**
 * One child's pick for one period. Saves as soon as it changes; a refusal is
 * shown under it and the saved pick comes back. It stays enabled while saving
 * so keyboard focus is kept, and ignores changes until the save finishes.
 */
function PickSelect({
  signups,
  camper,
  period,
  periodIndex,
  current,
  state,
  onChange,
}: {
  signups: ClubDaySignups;
  camper: SignupCamper;
  period: number;
  periodIndex: number;
  current: string | null;
  state: SaveState | undefined;
  onChange: (optionId: string) => void;
}) {
  const errorId = useId();
  const pending = state?.saving != null;
  const error = state?.error ?? null;
  const value = state?.saving ?? current ?? "";

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={`${camper.name}, period ${period}`}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        aria-busy={pending || undefined}
        className={selectClassName}
        value={value}
        onChange={(event) => {
          if (!pending) onChange(event.target.value);
        }}
      >
        <option value="">No pick yet</option>
        {signups.options.map((option) => {
          const left = option.places[periodIndex]?.left ?? 0;
          const label =
            option.id === current ? option.activity.name : `${option.activity.name} (${left === 0 ? "full" : `${left} left`})`;
          return (
            <option key={option.id} value={option.id}>
              {label}
            </option>
          );
        })}
      </select>
      <p
        id={errorId}
        role={error ? "alert" : "status"}
        className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
      >
        {pending ? "Saving…" : (error ?? "")}
      </p>
    </div>
  );
}
