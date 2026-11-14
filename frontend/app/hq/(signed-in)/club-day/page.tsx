import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubDayOption, ClubDaySetup } from "@/lib/hq/club-day";
import { MAX_OPTION_CAPACITY } from "@/lib/hq/club-day";
import { CAMP_HQ_TEAMS } from "@/lib/hq/lists";
import { isCampHqRefusal } from "@/lib/hq/operations";
import {
  SCHEDULE_WEEKDAYS,
  formatSlotTime,
  slotTimeValue,
  weekdayLabels,
} from "@/lib/hq/schedule-times";

import { CampHqPageNotice, loadCampHqPage } from "../camp-hq-page";
import { ACTIVITIES_PATH } from "../lists-paths";

import { ClubDayForm } from "./club-day-form";

export const metadata: Metadata = { title: "Club day" };

const selectClassName =
  "border-input flex min-h-(--control-height) min-w-40 rounded-control border bg-transparent px-4 py-3 text-base focus-field";
const linkClassName =
  "focus-ring inline-flex min-h-11 items-center rounded-control text-primary underline underline-offset-4";

export default function ClubDayPage() {
  return (
    <Suspense fallback={null}>
      <ClubDay />
    </Suspense>
  );
}

async function ClubDay() {
  const state = await loadCampHqPage();
  if (state.kind !== "ready") return <CampHqPageNotice state={state} />;
  const { campHq, request } = state.context;

  let setup: ClubDaySetup;
  try {
    setup = await campHq.getClubDaySetup(request);
  } catch (error) {
    if (!isCampHqRefusal(error)) throw error;
    return (
      <section className="flex max-w-xl flex-col gap-3">
        <h1 className="text-title-lg">Club day</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-title-lg">Club day</h1>
        <p className="text-muted-foreground">
          The options each Team has on each weekday, how many children each
          option takes, and when signups open and lock. Teams and options are
          sample data until Maplewood confirms them.
        </p>
      </div>

      <SignupTimes setup={setup} />
      <AddOption setup={setup} />

      {CAMP_HQ_TEAMS.map((team) => (
        <TeamOptions
          key={team}
          team={team}
          options={setup.options.filter((option) => option.team === team)}
        />
      ))}
    </div>
  );
}

function SignupTimes({ setup }: { setup: ClubDaySetup }) {
  const { signupOpen, signupLock } = setup.settings;
  return (
    <section
      aria-labelledby="signup-times-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
    >
      <h2 id="signup-times-heading" className="text-label">
        Signup times
      </h2>
      <p className="text-muted-foreground">
        Signups open at {formatSlotTime(signupOpen)} and lock at {formatSlotTime(signupLock)},
        camp time, each Club day.
      </p>
      <ClubDayForm intent="set-times">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Signups open</span>
          <Input type="time" name="open" step={60} required defaultValue={slotTimeValue(signupOpen)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Signups lock</span>
          <Input type="time" name="lock" step={60} required defaultValue={slotTimeValue(signupLock)} />
        </label>
        <Button type="submit" variant="outline">
          Save times
        </Button>
      </ClubDayForm>
    </section>
  );
}

function CapacityFields({ option }: { option?: ClubDayOption }) {
  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Children per period</span>
        <Input
          type="number"
          name="maxPerPeriod"
          min={1}
          max={MAX_OPTION_CAPACITY}
          step={1}
          required
          defaultValue={option?.maxPerPeriod}
          className="w-32"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Per Camp group (optional)</span>
        <Input
          type="number"
          name="maxPerGroup"
          min={1}
          max={MAX_OPTION_CAPACITY}
          step={1}
          placeholder="No limit"
          defaultValue={option?.maxPerGroup ?? ""}
          className="w-40"
        />
      </label>
    </>
  );
}

function AddOption({ setup }: { setup: ClubDaySetup }) {
  const regular = setup.activities.filter((activity) => !activity.clubOnly);
  const clubOnly = setup.activities.filter((activity) => activity.clubOnly);
  return (
    <section
      aria-labelledby="add-option-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
    >
      <h2 id="add-option-heading" className="text-label">
        Add an option
      </h2>
      <p className="text-muted-foreground">
        Choose any activity, or{" "}
        <Link href={`${ACTIVITIES_PATH}/new?club-only=1`} className={linkClassName}>
          add an activity offered only on Club day
        </Link>
        .
      </p>
      <ClubDayForm intent="add-option">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Team</span>
          <select name="team" required className={selectClassName}>
            {CAMP_HQ_TEAMS.map((team) => (
              <option key={team} value={team}>
                Team {team}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Day</span>
          <select name="weekday" required className={selectClassName}>
            {SCHEDULE_WEEKDAYS.map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekdayLabels[weekday]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Activity</span>
          <select name="activityId" required defaultValue="" className={`${selectClassName} min-w-56`}>
            <option value="" disabled>
              Choose an activity
            </option>
            <optgroup label="Activities">
              {regular.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </optgroup>
            {clubOnly.length > 0 ? (
              <optgroup label="Club day only">
                {clubOnly.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
        <CapacityFields />
        <Button type="submit">Add option</Button>
      </ClubDayForm>
    </section>
  );
}

function TeamOptions({ team, options }: { team: number; options: ClubDayOption[] }) {
  const headingId = `team-${team}-heading`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-label">
        Team {team}
      </h2>
      {options.length === 0 ? (
        <p className="text-muted-foreground">No Club day options yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {options.map((option) => (
            <li
              key={option.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex min-w-48 flex-col gap-1">
                <h3 className="text-lg font-semibold">{option.activity.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {weekdayLabels[option.weekday]}
                  {option.activity.clubOnly ? " · Club day only" : ""}
                  {option.activity.kind === "shared" ? " · Shared" : ""}
                </p>
              </div>
              <ClubDayForm intent="update-option" hidden={{ optionId: option.id }}>
                <CapacityFields option={option} />
                <Button type="submit" variant="outline">
                  Save
                </Button>
              </ClubDayForm>
              <ClubDayForm intent="remove-option" hidden={{ optionId: option.id }}>
                <Button type="submit" variant="outline">
                  Remove
                </Button>
              </ClubDayForm>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
