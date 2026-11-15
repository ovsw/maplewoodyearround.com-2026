"use client";

// Which Camp group each Junior staff member helps, and their Club day
// activity, as an editable table. The server actions enforce the rules.
import { EditableTable } from "../editable-table/editable-table";
import type { EditableColumn, EditableOption } from "../editable-table/types";
import { setJuniorPlacement } from "../table-actions";

export type JuniorRow = {
  id: string;
  name: string;
  campGroupId: string | null;
  clubDayActivityId: string | null;
};

type Named = { id: string; name: string };

const NONE = "";

const choices = (none: string, items: Named[]): EditableOption[] => [
  { value: NONE, label: none, muted: true },
  ...items.map(({ id, name }) => ({ value: id, label: name })),
];

export function JuniorsTable({
  rows,
  campGroups,
  activities,
}: {
  rows: JuniorRow[];
  campGroups: Named[];
  activities: Named[];
}) {
  const groupOptions = choices("No group", campGroups);
  const activityOptions = choices("No Club day activity", activities);
  const nameOf = (items: Named[], id: string | null) => items.find((item) => item.id === id)?.name;

  const columns: EditableColumn<JuniorRow>[] = [
    {
      id: "name",
      header: "Junior staff",
      type: "custom",
      className: "w-64",
      render: (row) => <span className="flex min-h-8 items-center px-2 font-medium">{row.name}</span>,
    },
    {
      id: "group",
      header: "Helps Camp group",
      type: "select",
      filter: true,
      searchPlaceholder: "Search Camp groups",
      value: (row) => row.campGroupId ?? NONE,
      display: (row) => nameOf(campGroups, row.campGroupId) ?? "No group",
      options: () => groupOptions,
      // Without a group there is no Club day activity either.
      save: (row, campGroupId) =>
        setJuniorPlacement(row.id, {
          campGroupId: campGroupId || null,
          clubDayActivityId: campGroupId ? row.clubDayActivityId : null,
        }),
    },
    {
      id: "clubDay",
      header: "Club day activity",
      type: "select",
      filter: true,
      searchPlaceholder: "Search activities",
      value: (row) => row.clubDayActivityId ?? NONE,
      display: (row) => nameOf(activities, row.clubDayActivityId) ?? "No Club day activity",
      options: () => activityOptions,
      save: (row, clubDayActivityId) =>
        setJuniorPlacement(row.id, {
          campGroupId: row.campGroupId,
          clubDayActivityId: clubDayActivityId || null,
        }),
    },
  ];

  return (
    <EditableTable
      caption="Junior staff and the Camp group each helps"
      rows={rows}
      rowId={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={columns}
      emptyText="No Junior staff yet."
    />
  );
}
