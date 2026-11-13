"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { campHqGrades } from "@/lib/hq/grades";

import {
  removeActivity,
  removeCampGroup,
  saveActivity,
  saveCampGroup,
} from "./lists-actions";
import type { ListFormState } from "./lists-paths";

const TEAMS = [1, 2, 3, 4];

const initialState: ListFormState = {};

type Values = Record<string, string | string[]>;

function pick(values: Values, name: string) {
  const value = values[name];
  return typeof value === "string" ? value : "";
}

function pickAll(values: Values, name: string) {
  const value = values[name];
  return Array.isArray(value) ? value : [];
}

function FormError({ state }: { state: ListFormState }) {
  if (!state.error) return null;
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-control border border-destructive/60 p-4">
      <p className="font-semibold">{state.error}</p>
      {state.usedIn && state.usedIn.length > 0 ? (
        <ul className="list-disc pl-5">
          {state.usedIn.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label">{label}</span>
      <Input name={name} defaultValue={defaultValue} required={required} autoComplete="off" />
    </label>
  );
}

/** One large tick box or radio per choice, at least 44px tall. */
function Choice({
  type,
  name,
  value,
  label,
  defaultChecked,
}: {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-border px-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-5 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

function GradeChoices({ selected }: { selected: string[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label">Grades</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {campHqGrades.map((grade) => (
          <Choice
            key={grade.value}
            type="checkbox"
            name="grades"
            value={grade.value}
            label={grade.label}
            defaultChecked={selected.includes(grade.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export type CampGroupFormValues = {
  id?: string;
  name: string;
  grades: string[];
  team: number | null;
  change: string;
  freeSwim: string;
  lunch: string;
  swimLessons: string;
};

export function CampGroupForm({ group }: { group: CampGroupFormValues }) {
  const [state, action, pending] = useActionState(saveCampGroup, initialState);
  const values: Values = state.values ?? {
    name: group.name,
    grades: group.grades,
    team: group.team === null ? "" : String(group.team),
    change: group.change,
    freeSwim: group.freeSwim,
    lunch: group.lunch,
    swimLessons: group.swimLessons,
  };

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      {group.id ? <input type="hidden" name="id" value={group.id} /> : null}
      <FormError state={state} />
      <TextField name="name" label="Name" defaultValue={pick(values, "name")} required />
      <GradeChoices selected={pickAll(values, "grades")} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label">Team</legend>
        <div className="grid grid-cols-4 gap-2">
          {TEAMS.map((team) => (
            <Choice
              key={team}
              type="radio"
              name="team"
              value={String(team)}
              label={`Team ${team}`}
              defaultChecked={pick(values, "team") === String(team)}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-label">Locations</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="change" label="Change" defaultValue={pick(values, "change")} />
          <TextField name="freeSwim" label="Free swim" defaultValue={pick(values, "freeSwim")} />
          <TextField name="lunch" label="Lunch" defaultValue={pick(values, "lunch")} />
          <TextField
            name="swimLessons"
            label="Swim lessons"
            defaultValue={pick(values, "swimLessons")}
          />
        </div>
      </fieldset>
      <div>
        <Button type="submit" disabled={pending}>
          {group.id ? "Save changes" : "Add Camp group"}
        </Button>
      </div>
    </form>
  );
}

export type ActivityFormValues = {
  id?: string;
  name: string;
  grades: string[];
  kind: "exclusive" | "shared";
};

export function ActivityForm({ activity }: { activity: ActivityFormValues }) {
  const [state, action, pending] = useActionState(saveActivity, initialState);
  const values: Values = state.values ?? {
    name: activity.name,
    grades: activity.grades,
    kind: activity.kind,
  };

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      {activity.id ? <input type="hidden" name="id" value={activity.id} /> : null}
      <FormError state={state} />
      <TextField name="name" label="Name" defaultValue={pick(values, "name")} required />
      <GradeChoices selected={pickAll(values, "grades")} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-label">Exclusive or shared</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            type="radio"
            name="kind"
            value="exclusive"
            label="Exclusive: one Camp group at a time"
            defaultChecked={pick(values, "kind") !== "shared"}
          />
          <Choice
            type="radio"
            name="kind"
            value="shared"
            label="Shared: many Camp groups at once"
            defaultChecked={pick(values, "kind") === "shared"}
          />
        </div>
      </fieldset>
      <div>
        <Button type="submit" disabled={pending}>
          {activity.id ? "Save changes" : "Add activity"}
        </Button>
      </div>
    </form>
  );
}

export function RemoveForm({
  id,
  name,
  what,
}: {
  id: string;
  name: string;
  what: "camp-group" | "activity";
}) {
  const [state, action, pending] = useActionState(
    what === "camp-group" ? removeCampGroup : removeActivity,
    initialState,
  );

  return (
    <form
      action={action}
      className="flex max-w-3xl flex-col gap-4"
      onSubmit={(event) => {
        if (!window.confirm(`Remove ${name}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <FormError state={state} />
      <div>
        <Button type="submit" variant="destructive" disabled={pending}>
          Remove {name}
        </Button>
      </div>
    </form>
  );
}
