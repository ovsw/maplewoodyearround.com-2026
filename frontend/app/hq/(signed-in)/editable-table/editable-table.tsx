"use client";

// The Camp HQ editable table: click a cell, type or pick a value, and it saves
// by itself. A blank row at the bottom adds a row; removing a row happens at
// once with an "Undo" message. Read-only, it is the same table as plain text.
//
// The screen that uses it passes plain rows and column definitions whose
// `save` calls a server action; the rules stay on the server.
import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
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

import { Refusal, SelectCell, TimeCell, attempt, editorClass } from "./cells";
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
};

function EditableCell<Row>({
  column,
  row,
  label,
}: {
  column: EditableColumn<Row>;
  row: Row;
  label: string;
}) {
  switch (column.type) {
    case "time":
      return (
        <TimeCell
          label={label}
          value={column.value(row)}
          save={(next) => column.save(row, next)}
        />
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
  }
}

/** The blank row: saves when it is complete and the person leaves it or presses Enter. */
function BlankRow<Row>({
  columns,
  addRow,
  hasRemoveColumn,
}: {
  columns: EditableColumn<Row>[];
  addRow: AddRow;
  hasRemoveColumn: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refused, setRefused] = useState<Extract<CellResult, { ok: false }> | null>(null);
  const hintColumn = columns.find((column) => !addRow.columns.includes(column.id))?.id;

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
      setRefused(result);
    }
  }

  return (
    <>
      <TableRow
        aria-label={addRow.label}
        className="hover:bg-transparent"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) void save();
        }}
      >
        {columns.map((column) => {
          if (!addRow.columns.includes(column.id)) {
            return (
              <TableCell key={column.id} className="px-4 text-muted-foreground">
                {column.id === hintColumn ? (saving ? "Adding" : addRow.hint) : null}
              </TableCell>
            );
          }
          return (
            <TableCell key={column.id} className={column.className}>
              <input
                type="time"
                step={60}
                aria-label={`${column.header}, ${addRow.label}`}
                aria-invalid={refused ? true : undefined}
                className={cn(editorClass, "w-32 border-dashed border-border")}
                value={draft[column.id] ?? ""}
                disabled={saving}
                onChange={(event) => {
                  const next = { ...draft, [column.id]: event.target.value };
                  setDraft(addRow.fill ? addRow.fill(next, column.id) : next);
                  setChanged(true);
                  setRefused(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void save();
                }}
              />
            </TableCell>
          );
        })}
        {hasRemoveColumn ? (
          <TableCell className="text-right">
            {saving ? (
              <LoaderCircle aria-hidden className="ml-auto size-4 animate-spin text-muted-foreground" />
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
}: EditableTableProps<Row>) {
  // Rows being removed disappear at once; a refused removal brings the row back.
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set());
  const visible = rows.filter((row) => !removing.has(rowId(row)));
  const canRemove = !readOnly && Boolean(removeRow);

  if (readOnly && rows.length === 0) {
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
    <div className="max-w-4xl">
      <Table className="table-fixed text-base">
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.id} scope="col" className={cn("px-4", column.className)}>
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
              {columns.map((column) => (
                <TableCell key={column.id} className={cn("align-top", column.className)}>
                  {readOnly ? (
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
            <BlankRow columns={columns} addRow={addRow} hasRemoveColumn={canRemove} />
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
