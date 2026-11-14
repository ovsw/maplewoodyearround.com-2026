"use client";

// One day of a Group schedule as an editable table. The columns only say what
// each cell saves; the server actions enforce the rules.
import {
  DEFAULT_SLOT_LENGTH,
  formatSlotRange,
  formatSlotTime,
  parseSlotTime,
  slotTimeValue,
} from "@/lib/hq/schedule-times";

import { EditableTable } from "../../../editable-table/editable-table";
import type {
  AddRow,
  EditableColumn,
  EditableOption,
  RemoveRow,
} from "../../../editable-table/types";
import {
  addScheduleSlot,
  changeScheduleSlotTimes,
  removeScheduleSlot,
  restoreScheduleSlot,
  setScheduleSlotContent,
} from "./schedule-actions";

/** One slot as the table needs it. */
export type ScheduleRow = {
  id: string;
  /** Minutes after midnight, camp time. */
  start: number;
  end: number;
  /** "empty", "club-day" or "activity:<id>". */
  choice: string;
  /** What the slot can hold, with the choices another group has greyed out. */
  options: EditableOption[];
};

const slotName = (row: ScheduleRow) => `the ${formatSlotRange(row.start, row.end)} slot`;

export function ScheduleTable({
  groupId,
  groupName,
  weekday,
  weekdayLabel,
  rows,
  readOnly,
}: {
  groupId: string;
  groupName: string;
  weekday: number;
  weekdayLabel: string;
  rows: ScheduleRow[];
  readOnly: boolean;
}) {
  const columns: EditableColumn<ScheduleRow>[] = [
    {
      id: "start",
      header: "Start",
      type: "time",
      className: "w-56",
      value: (row) => slotTimeValue(row.start),
      display: (row) => formatSlotTime(row.start),
      save: (row, start) =>
        changeScheduleSlotTimes(row.id, weekday, { start, end: slotTimeValue(row.end) }),
    },
    {
      id: "end",
      header: "End",
      type: "time",
      className: "w-56",
      value: (row) => slotTimeValue(row.end),
      display: (row) => formatSlotTime(row.end),
      save: (row, end) =>
        changeScheduleSlotTimes(row.id, weekday, { start: slotTimeValue(row.start), end }),
    },
    {
      id: "activity",
      header: "Activity",
      type: "select",
      searchPlaceholder: "Search activities",
      value: (row) => row.choice,
      display: (row) => row.options.find((option) => option.value === row.choice)?.label ?? "",
      options: (row) => row.options,
      save: (row, choice) => setScheduleSlotContent(row.id, weekday, choice),
    },
  ];

  const addRow: AddRow = {
    label: "New slot",
    hint: "Set a start and an end to add a slot.",
    columns: ["start", "end"],
    // A new start proposes the usual slot length; the end stays editable.
    fill: (draft, changed) => {
      const start = parseSlotTime(draft.start);
      if (changed !== "start" || start === null || draft.end) return draft;
      return { ...draft, end: slotTimeValue(Math.min(start + DEFAULT_SLOT_LENGTH, 24 * 60 - 1)) };
    },
    isComplete: (draft) => Boolean(draft.start && draft.end),
    save: (draft) => addScheduleSlot(groupId, weekday, { start: draft.start, end: draft.end }),
  };

  const removeRow: RemoveRow<ScheduleRow> = {
    label: (row) => `Remove ${slotName(row)}`,
    remove: (row) => removeScheduleSlot(row.id, weekday),
    removed: (row) => `Removed ${slotName(row)}.`,
    undo: (row) =>
      restoreScheduleSlot(
        groupId,
        weekday,
        { start: slotTimeValue(row.start), end: slotTimeValue(row.end) },
        row.choice,
      ),
  };

  return (
    <EditableTable
      caption={`${weekdayLabel} schedule of ${groupName}`}
      rows={rows}
      rowId={(row) => row.id}
      rowLabel={slotName}
      columns={columns}
      readOnly={readOnly}
      emptyText="This day has no slots."
      addRow={addRow}
      removeRow={removeRow}
    />
  );
}
