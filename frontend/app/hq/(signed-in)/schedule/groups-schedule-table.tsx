"use client";

// One weekday of every Camp group as one editable table: a row per group, a
// column per period, then the group's locations. The columns only say what
// each cell saves; the server actions enforce the rules.
import Link from "next/link";
import { useMemo } from "react";

import { formatGrades, type CampHqGrade } from "@/lib/hq/grades";
import { formatSlotRange, slotTimeValue } from "@/lib/hq/schedule-times";

import { EditableTable } from "../editable-table/editable-table";
import type { EditableColumn, EditableOption } from "../editable-table/types";
import {
  restoreScheduleSlot,
  setScheduleSlotContent,
} from "../groups/[id]/schedule/schedule-actions";
import { scheduleDayPath } from "../groups/[id]/schedule/schedule-paths";
import { locationKeys, locationLabels } from "../location-labels";
import { saveCampGroup } from "../table-actions";

export type BoardSlot = {
  id: string;
  /** Minutes after midnight, camp time. */
  start: number;
  end: number;
  /** "empty", "club-day" or "activity:<id>". */
  choice: string;
  activityName: string | null;
};

export type BoardGroup = {
  id: string;
  name: string;
  grades: CampHqGrade[];
  locations: Record<(typeof locationKeys)[number], string>;
  slots: BoardSlot[];
};

export type BoardActivity = { id: string; name: string; grades: CampHqGrade[]; exclusive: boolean };

type Period = { start: number; end: number };

/** A group with no slot at a period shows this; picking something else adds the slot. */
const NO_SLOT = "none";

const overlaps = (a: Period, b: Period) => a.start < b.end && a.end > b.start;

export function GroupsScheduleTable({
  weekday,
  weekdayLabel,
  groups,
  activities,
  readOnly,
}: {
  weekday: number;
  weekdayLabel: string;
  groups: BoardGroup[];
  activities: BoardActivity[];
  readOnly: boolean;
}) {
  const columns = useMemo(() => {
    // Every distinct period any group has on this day, in time order.
    const periods = [
      ...new Map(
        groups.flatMap((group) =>
          group.slots.map((slot) => [`${slot.start}-${slot.end}`, { start: slot.start, end: slot.end }]),
        ),
      ).values(),
    ].sort((a, b) => a.start - b.start || a.end - b.end);

    // Who has each activity when, to grey out an Exclusive activity another group has.
    const bookings = new Map<string, (Period & { groupId: string; groupName: string })[]>();
    for (const group of groups) {
      for (const slot of group.slots) {
        if (!slot.choice.startsWith("activity:")) continue;
        const list = bookings.get(slot.choice) ?? [];
        list.push({ start: slot.start, end: slot.end, groupId: group.id, groupName: group.name });
        bookings.set(slot.choice, list);
      }
    }

    const slotAt = (group: BoardGroup, period: Period) =>
      group.slots.find((slot) => slot.start === period.start && slot.end === period.end);

    function options(group: BoardGroup, period: Period): EditableOption[] {
      const slot = slotAt(group, period);
      const list: EditableOption[] = [
        ...(slot ? [] : [{ value: NO_SLOT, label: "No slot", muted: true }]),
        { value: "empty", label: "Empty", muted: true },
        { value: "club-day", label: "Club day period" },
      ];
      for (const activity of activities) {
        if (!group.grades.every((grade) => activity.grades.includes(grade))) continue;
        const value = `activity:${activity.id}`;
        const other = activity.exclusive
          ? bookings.get(value)?.find((booking) => booking.groupId !== group.id && overlaps(booking, period))
          : undefined;
        list.push({
          value,
          label: activity.name,
          group: "Activities",
          unavailable: other
            ? `${other.groupName} have it ${formatSlotRange(other.start, other.end)}`
            : undefined,
        });
      }
      // Keep what the slot holds visible even if the group's grades changed since.
      if (slot?.activityName && !list.some((option) => option.value === slot.choice)) {
        list.push({
          value: slot.choice,
          label: `${slot.activityName} (not allowed for these grades)`,
          group: "Activities",
        });
      }
      return list;
    }

    const result: EditableColumn<BoardGroup>[] = [
      {
        id: "group",
        header: "Camp group",
        type: "custom",
        className: "w-48 min-w-48",
        render: (group) => (
          <Link
            href={scheduleDayPath(group.id, weekday)}
            aria-label={`Schedule of ${group.name}`}
            className="focus-ring flex min-h-10 flex-col justify-center rounded-control px-2"
          >
            <span className="font-semibold text-primary underline underline-offset-4">{group.name}</span>
            <span className="text-xs text-muted-foreground">{formatGrades(group.grades)}</span>
          </Link>
        ),
      },
      ...periods.map((period): EditableColumn<BoardGroup> => ({
        id: `period-${period.start}-${period.end}`,
        header: formatSlotRange(period.start, period.end),
        type: "select",
        className: "w-52 min-w-52",
        searchPlaceholder: "Search activities",
        value: (group) => slotAt(group, period)?.choice ?? NO_SLOT,
        display: (group) => {
          const slot = slotAt(group, period);
          if (!slot || slot.choice === "empty") return "";
          return slot.activityName ?? "Club day period";
        },
        options: (group) => options(group, period),
        save: (group, choice) => {
          const slot = slotAt(group, period);
          if (slot) return setScheduleSlotContent(slot.id, weekday, choice);
          return restoreScheduleSlot(
            group.id,
            weekday,
            { start: slotTimeValue(period.start), end: slotTimeValue(period.end) },
            choice,
          );
        },
      })),
      ...locationKeys.map((key): EditableColumn<BoardGroup> => ({
        id: `location-${key}`,
        header: `${locationLabels[key]} location`,
        type: "text",
        className: "w-56 min-w-56",
        placeholder: "Not set",
        maxLength: 200,
        value: (group) => group.locations[key],
        display: (group) => group.locations[key] || "Not set",
        save: (group, value) => saveCampGroup(group.id, { locations: { [key]: value } }),
      })),
    ];
    return result;
  }, [groups, activities, weekday]);

  return (
    <EditableTable
      caption={`${weekdayLabel} schedule of every Camp group`}
      rows={groups}
      rowId={(group) => group.id}
      rowLabel={(group) => group.name}
      columns={columns}
      readOnly={readOnly}
      emptyText="There are no Camp groups yet."
      wide
    />
  );
}
