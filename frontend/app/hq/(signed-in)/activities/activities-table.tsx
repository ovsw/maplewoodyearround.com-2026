"use client";

// Configure Activities: every activity as an editable table, with its
// specialist. The columns only say what each cell saves; the server actions
// enforce the rules.
import { campHqGrades, formatGrades, type CampHqGrade } from "@/lib/hq/grades";

import { EditableTable } from "../editable-table/editable-table";
import type { AddRow, EditableColumn, RemoveRow } from "../editable-table/types";
import { NOBODY, peopleOptions, type PersonChoice } from "../people-options";
import { addActivity, removeActivity, saveActivity, setActivitySpecialist } from "../table-actions";

export type ActivityRow = {
  id: string;
  name: string;
  grades: CampHqGrade[];
  kind: "exclusive" | "shared";
  clubOnly: boolean;
  specialist: { id: string; name: string } | null;
};

const gradeOptions = campHqGrades.map(({ value, label }) => ({ value, label }));
const summarizeGrades = (values: string[]) => formatGrades(values as CampHqGrade[]);
const kindOptions = [
  { value: "exclusive", label: "Exclusive", note: "one group at a time" },
  { value: "shared", label: "Shared", note: "many groups at once" },
];

export function ActivitiesTable({
  rows,
  people,
  readOnly,
}: {
  rows: ActivityRow[];
  /** The people who can run an activity; null when the person cannot see Assignments. */
  people: PersonChoice[] | null;
  readOnly: boolean;
}) {
  const columns: EditableColumn<ActivityRow>[] = [
    {
      id: "name",
      header: "Name",
      type: "text",
      className: "w-64 min-w-64",
      maxLength: 80,
      value: (row) => row.name,
      display: (row) => row.name,
      save: (row, name) => saveActivity(row.id, { name }),
    },
    {
      id: "grades",
      header: "Grades",
      type: "multi",
      filter: true,
      className: "w-56 min-w-56",
      searchPlaceholder: "Search grades",
      value: (row) => row.grades,
      display: (row) => formatGrades(row.grades),
      options: () => gradeOptions,
      summary: summarizeGrades,
      save: (row, grades) => saveActivity(row.id, { grades }),
    },
    {
      id: "kind",
      header: "Exclusive or shared",
      type: "select",
      filter: true,
      className: "w-52 min-w-52",
      value: (row) => row.kind,
      display: (row) => (row.kind === "exclusive" ? "Exclusive" : "Shared"),
      options: () => kindOptions,
      save: (row, kind) => saveActivity(row.id, { kind }),
    },
    {
      id: "clubOnly",
      header: "Club day only",
      type: "checkbox",
      filter: true,
      className: "w-40 min-w-40",
      value: (row) => row.clubOnly,
      display: (row) => (row.clubOnly ? "Yes" : "No"),
      save: (row, clubOnly) => saveActivity(row.id, { clubOnly }),
    },
    ...(people
      ? [
          {
            id: "specialist",
            header: "Specialist",
            type: "select",
            filter: true,
            className: "w-64 min-w-64",
            searchPlaceholder: "Search staff",
            value: (row) => row.specialist?.id ?? NOBODY,
            display: (row) => row.specialist?.name ?? "No specialist",
            options: (row) =>
              peopleOptions({
                people,
                nobody: "No specialist",
                current: row.specialist,
                // A specialist can run several activities, but cannot lead or help a group.
                blocked: (person) =>
                  person.job && !person.job.startsWith("specialist") ? person.job : undefined,
              }),
            save: (row, staffMemberId) =>
              setActivitySpecialist(row.id, staffMemberId || null, row.specialist?.id ?? null),
          } satisfies EditableColumn<ActivityRow>,
        ]
      : []),
  ];

  const addRow: AddRow = {
    label: "New activity",
    hint: "Give it a name and grades to add it. It starts as Exclusive.",
    columns: ["name", "grades"],
    options: { grades: gradeOptions },
    isComplete: (draft) => Boolean(draft.name?.trim() && draft.grades),
    save: (draft) => addActivity({ name: draft.name, grades: draft.grades.split(",") }),
  };

  const removeRow: RemoveRow<ActivityRow> = {
    label: (row) => `Remove ${row.name}`,
    remove: (row) => removeActivity(row.id),
    removed: (row) => `Removed ${row.name}.`,
    undo: (row) =>
      addActivity({ name: row.name, grades: row.grades, kind: row.kind, clubOnly: row.clubOnly }),
  };

  return (
    <EditableTable
      caption="Activities"
      searchPlaceholder="Search activities"
      rows={rows}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={columns}
      readOnly={readOnly}
      emptyText="There are no activities yet."
      addRow={addRow}
      removeRow={removeRow}
      wide
    />
  );
}
