"use client";

// The Camp HQ editable table: click a cell, type or pick a value, and it saves
// by itself. A blank row at the bottom adds a row; removing a row happens at
// once with an "Undo" message. Read-only, it is the same table as plain text.
//
// The screen that uses it passes plain rows and column definitions whose
// `save` calls a server action; the rules stay on the server.
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  CheckboxCell,
  DenseTable,
  MultiCell,
  Picker,
  Refusal,
  SelectCell,
  TextCell,
  TimeCell,
  attempt,
  editorClass,
  pickedSummary,
  togglePicked,
} from "./cells";
import type { AddRow, CellResult, EditableColumn, RemoveRow } from "./types";

type EditableTableProps<Row> = {
  /** Names the table for screen readers. */
  caption: string;
  rows: Row[];
  rowId: (row: Row) => string;
  /** Names a row inside cell labels, for example "the 9:30 AM slot". */
  rowLabel: (row: Row) => string;
  columns: EditableColumn<Row>[];
  /** Shows every cell as text, without the blank row or the remove buttons. */
  readOnly?: boolean;
  /** Shown instead of the table when it is read-only and has no rows. */
  emptyText: string;
  addRow?: AddRow;
  removeRow?: RemoveRow<Row>;
  /**
   * For a table with many columns: it scrolls sideways under its first column,
   * each column takes the width its class gives it, and the "Saved" mark is
   * only its tick.
   */
  wide?: boolean;
};

function EditableCell<Row>({
  column,
  row,
  label,
}: {
  column: Exclude<EditableColumn<Row>, { type: "custom" }>;
  row: Row;
  label: string;
}) {
  switch (column.type) {
    case "time":
      return <TimeCell label={label} value={column.value(row)} save={(next) => column.save(row, next)} />;
    case "text":
      return (
        <TextCell
          label={label}
          value={column.value(row)}
          save={(next) => column.save(row, next)}
          placeholder={column.placeholder}
          maxLength={column.maxLength}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell label={label} value={column.value(row)} save={(next) => column.save(row, next)} />
      );
    case "select":
      return (
        <SelectCell
          label={label}
          value={column.value(row)}
          save={(next) => column.save(row, next)}
          options={column.options(row)}
          searchPlaceholder={column.searchPlaceholder}
        />
      );
    case "multi":
      return (
        <MultiCell
          label={label}
          value={column.value(row)}
          save={(next) => column.save(row, next)}
          options={column.options(row)}
          searchPlaceholder={column.searchPlaceholder}
          summary={column.summary}
        />
      );
  }
}

/** The blank row: saves when it is complete and the person leaves it, presses Enter or "Add". */
function BlankRow<Row>({
  columns,
  addRow,
  hasRemoveColumn,
  firstCellClass,
}: {
  columns: EditableColumn<Row>[];
  addRow: AddRow;
  hasRemoveColumn: boolean;
  firstCellClass?: string;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refused, setRefused] = useState<Extract<CellResult, { ok: false }> | null>(null);
  // A list of choices opens outside the row; the row is not left while it is open.
  const pickerOpen = useRef(false);
  const hintColumn = columns.find((column) => !addRow.columns.includes(column.id))?.id;
  const complete = addRow.isComplete(draft);

  async function save() {
    if (saving || !changed || !addRow.isComplete(draft)) return;
    setSaving(true);
    setChanged(false);
    const result = await attempt(() => addRow.save(draft));
    setSaving(false);
    if (result.ok) {
      setDraft({});
      setRefused(null);
    } else {
      // Leaving the row or pressing Enter again tries once more.
      setChanged(true);
      setRefused(result);
    }
  }

  function change(columnId: string, value: string) {
    const next = { ...draft, [columnId]: value };
    setDraft(addRow.fill ? addRow.fill(next, columnId) : next);
    setChanged(true);
    setRefused(null);
  }

  function editor(column: EditableColumn<Row>) {
    const label = `${column.header}, ${addRow.label}`;
    const dashed = "border-dashed border-border";
    if (column.type === "select" || column.type === "multi") {
      const options = addRow.options?.[column.id] ?? [];
      const picked = (draft[column.id] ?? "").split(",").filter(Boolean);
      const multi = column.type === "multi";
      return (
        <Picker
          label={label}
          options={options}
          picked={picked}
          summary={
            picked.length > 0 && column.type === "multi" && column.summary
              ? column.summary(picked)
              : pickedSummary(options, picked, column.header)
          }
          muted={picked.length === 0}
          invalid={Boolean(refused)}
          searchPlaceholder={column.searchPlaceholder}
          className={cn("w-full", dashed)}
          keepOpen={multi}
          onPick={(value) =>
            change(column.id, multi ? togglePicked(options, picked, value).join(",") : value)
          }
          onOpenChange={(open) => {
            pickerOpen.current = open;
          }}
        />
      );
    }
    const time = column.type === "time";
    return (
      <input
        type={time ? "time" : "text"}
        step={time ? 60 : undefined}
        aria-label={label}
        aria-invalid={refused ? true : undefined}
        className={cn(editorClass, time ? "w-32" : "w-full", dashed)}
        placeholder={column.type === "text" ? (column.placeholder ?? column.header) : undefined}
        maxLength={column.type === "text" ? column.maxLength : undefined}
        autoComplete="off"
        value={draft[column.id] ?? ""}
        disabled={saving}
        onChange={(event) => change(column.id, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void save();
        }}
      />
    );
  }

  return (
    <>
      <TableRow
        aria-label={addRow.label}
        className="hover:bg-transparent"
        onBlur={(event) => {
          if (pickerOpen.current) return;
          if (!event.currentTarget.contains(event.relatedTarget)) void save();
        }}
      >
        {columns.map((column, index) => {
          const className = cn(column.className, index === 0 && firstCellClass);
          if (!addRow.columns.includes(column.id)) {
            return (
              <TableCell key={column.id} className={cn("px-4 text-muted-foreground", className)}>
                {column.id === hintColumn ? (saving ? "Adding" : addRow.hint) : null}
              </TableCell>
            );
          }
          return (
            <TableCell key={column.id} className={className}>
              {editor(column)}
            </TableCell>
          );
        })}
        {hasRemoveColumn ? (
          <TableCell className="text-right">
            {saving ? (
              <LoaderCircle aria-hidden className="ml-auto size-4 animate-spin text-muted-foreground" />
            ) : complete && changed ? (
              <Button type="button" variant="ghost" aria-label={`Add: ${addRow.label}`} onClick={() => void save()}>
                <Plus aria-hidden className="size-4" />
              </Button>
            ) : null}
          </TableCell>
        ) : null}
      </TableRow>
      {refused ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length + (hasRemoveColumn ? 1 : 0)} className="pt-0">
            <Refusal error={refused.error} link={refused.link} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function EditableTable<Row>({
  caption,
  rows,
  rowId,
  rowLabel,
  columns,
  readOnly = false,
  emptyText,
  addRow,
  removeRow,
  wide = false,
}: EditableTableProps<Row>) {
  // Rows being removed disappear at once; a refused removal brings the row back.
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set());
  const visible = rows.filter((row) => !removing.has(rowId(row)));
  const canRemove = !readOnly && Boolean(removeRow);
  // The first column stays in view while a wide table scrolls sideways.
  const firstCellClass = wide ? "sticky left-0 z-10 bg-background" : undefined;

  if (rows.length === 0 && (readOnly || !addRow)) {
    return <p className="text-muted-foreground">{emptyText}</p>;
  }

  async function remove(row: Row, { remove: run, removed, undo }: RemoveRow<Row>) {
    const id = rowId(row);
    setRemoving((current) => new Set(current).add(id));
    const result = await attempt(() => run(row));
    if (!result.ok) {
      setRemoving((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      toast.error(result.error);
      return;
    }
    toast(removed(row), {
      action: undo
        ? {
            label: "Undo",
            onClick: async () => {
              const restored = await attempt(() => undo(row));
              if (!restored.ok) toast.error(restored.error);
            },
          }
        : undefined,
    });
  }

  return (
    <DenseTable value={wide}>
      <div className={wide ? undefined : "max-w-4xl"}>
        <Table className={cn("text-base", wide ? "w-max min-w-full" : "table-fixed")}>
          <caption className="sr-only">{caption}</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead
                  key={column.id}
                  scope="col"
                  className={cn("px-4", column.className, index === 0 && firstCellClass)}
                >
                  {column.header}
                </TableHead>
              ))}
              {canRemove ? (
                <TableHead scope="col" className="w-12">
                  <span className="sr-only">Remove</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={rowId(row)} className="align-top hover:bg-transparent">
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    className={cn("align-top", column.className, index === 0 && firstCellClass)}
                  >
                    {column.type === "custom" ? (
                      column.render(row)
                    ) : readOnly || column.editable?.(row) === false ? (
                      <span className="flex min-h-10 items-center px-2">{column.display(row)}</span>
                    ) : (
                      <EditableCell
                        column={column}
                        row={row}
                        label={`${column.header} of ${rowLabel(row)}`}
                      />
                    )}
                  </TableCell>
                ))}
                {canRemove && removeRow ? (
                  <TableCell className="text-right align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={removeRow.label(row)}
                      onClick={() => void remove(row, removeRow)}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!readOnly && addRow ? (
              <BlankRow
                columns={columns}
                addRow={addRow}
                hasRemoveColumn={canRemove}
                firstCellClass={firstCellClass}
              />
            ) : null}
          </TableBody>
        </Table>
      </div>
    </DenseTable>
  );
}
