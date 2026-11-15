"use client";

// Configure Groups: every Camp group as an editable table, with its leader and
// locations. The columns only say what each cell saves; the server actions
// enforce the rules.
import Link from "next/link";

import { campHqGrades, formatGrades, type CampHqGrade } from "@/lib/hq/grades";

import { groupCampersPath } from "../campers/paths";
import { EditableTable } from "../editable-table/editable-table";
import type { AddRow, EditableColumn, RemoveRow } from "../editable-table/types";
import { locationKeys, locationLabels } from "../location-labels";
import { NOBODY, peopleOptions, type PersonChoice } from "../people-options";
import { addCampGroup, removeCampGroup, saveCampGroup, setGroupLeader } from "../table-actions";
import { leaderViewPath } from "../views-paths";
import { scheduleDayPath } from "./[id]/schedule/schedule-paths";

export type GroupRow = {
  id: string;
  name: string;
  grades: CampHqGrade[];
  team: number;
  /** True while the Team is sample data that no Admin has changed. */
  teamIsSample: boolean;
  locations: Record<(typeof locationKeys)[number], string>;
  leader: { id: string; name: string } | null;
};

const gradeOptions = campHqGrades.map(({ value, label }) => ({ value, label }));
const summarizeGrades = (values: string[]) => formatGrades(values as CampHqGrade[]);
const linkClass =
  "focus-ring inline-flex min-h-8 items-center rounded-control text-primary underline underline-offset-4 whitespace-nowrap";

export function GroupsTable({
  rows,
  teams,
  people,
  weekday,
  readOnly,
}: {
  rows: GroupRow[];
  teams: number[];
  /** The people who can lead a group; null when the person cannot see Assignments. */
  people: PersonChoice[] | null;
  /** The weekday the "Schedule" link opens. */
  weekday: number;
  readOnly: boolean;
}) {
  const teamOptions = teams.map((team) => ({ value: String(team), label: `Team ${team}` }));

  const columns: EditableColumn<GroupRow>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      className: "w-52 min-w-52",
      maxLength: 80,
      value: (row) => row.name,
      display: (row) => row.name,
      save: (row, name) => saveCampGroup(row.id, { name }),
    },
    {
      id: "grades",
      header: "Grades",
      type: "multi",
      className: "w-56 min-w-56",
      searchPlaceholder: "Search grades",
      value: (row) => row.grades,
      display: (row) => formatGrades(row.grades),
      options: () => gradeOptions,
      summary: summarizeGrades,
      save: (row, grades) => saveCampGroup(row.id, { grades }),
    },
    {
      id: "team",
      header: "Team",
      type: "select",
      className: "w-40 min-w-40",
      searchPlaceholder: "Search Teams",
      value: (row) => String(row.team),
      display: (row) => `Team ${row.team}${row.teamIsSample ? " (sample)" : ""}`,
      options: (row) =>
        teamOptions.map((option) =>
          row.teamIsSample && option.value === String(row.team)
            ? { ...option, label: `${option.label} (sample)` }
            : option,
        ),
      save: (row, team) => saveCampGroup(row.id, { team: Number(team) }),
    },
    ...(people
      ? [
          {
            id: "leader",
            header: "Leader",
            type: "select",
            className: "w-60 min-w-60",
            searchPlaceholder: "Search staff",
            value: (row) => row.leader?.id ?? NOBODY,
            display: (row) => row.leader?.name ?? "No leader",
            options: (row) =>
              peopleOptions({
                people,
                nobody: "No leader",
                current: row.leader,
                // A person has one job: leading one group, or running activities.
                blocked: (person) => person.job ?? undefined,
              }),
            save: (row, staffMemberId) =>
              setGroupLeader(row.id, staffMemberId || null, row.leader?.id ?? null),
          } satisfies EditableColumn<GroupRow>,
        ]
      : []),
    ...locationKeys.map((key): EditableColumn<GroupRow> => ({
      id: `location-${key}`,
      header: `${locationLabels[key]} location`,
      type: "text",
      className: "w-52 min-w-52",
      placeholder: "Not set",
      maxLength: 200,
      value: (row) => row.locations[key],
      display: (row) => row.locations[key] || "Not set",
      save: (row, value) => saveCampGroup(row.id, { locations: { [key]: value } }),
    })),
    {
      id: "open",
      header: "Open",
      type: "custom",
      className: "min-w-72",
      render: (row) => (
        <span className="flex flex-wrap gap-x-4 px-2">
          <Link href={scheduleDayPath(row.id, weekday)} aria-label={`Schedule of ${row.name}`} className={linkClass}>
            Schedule
          </Link>
          {readOnly ? null : (
            <>
              <Link href={leaderViewPath(row.id)} aria-label={`Leader view of ${row.name}`} className={linkClass}>
                Leader view
              </Link>
              <Link
                href={groupCampersPath(row.id)}
                aria-label={`Campers expected today in ${row.name}`}
                className={linkClass}
              >
                Campers today
              </Link>
            </>
          )}
        </span>
      ),
    },
  ];

  const addRow: AddRow = {
    label: "New Camp group",
    hint: "Give it a name, grades and a Team to add it.",
    columns: ["name", "grades", "team"],
    options: { grades: gradeOptions, team: teamOptions },
    isComplete: (draft) => Boolean(draft.name?.trim() && draft.grades && draft.team),
    save: (draft) =>
      addCampGroup({ name: draft.name, grades: draft.grades.split(","), team: Number(draft.team) }),
  };

  const removeRow: RemoveRow<GroupRow> = {
    label: (row) => `Remove ${row.name}`,
    remove: (row) => removeCampGroup(row.id),
    removed: (row) => `Removed ${row.name}.`,
    undo: (row) =>
      addCampGroup({ name: row.name, grades: row.grades, team: row.team, locations: row.locations }),
  };

  return (
    <EditableTable
      caption="Camp groups"
      rows={rows}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={columns}
      readOnly={readOnly}
      emptyText="There are no Camp groups yet."
      addRow={addRow}
      removeRow={removeRow}
      wide
    />
  );
}
