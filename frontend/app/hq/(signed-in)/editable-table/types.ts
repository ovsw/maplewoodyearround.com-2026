// Types of the Camp HQ editable table. No "use client" here, so server actions
// can return a CellResult.
import type { ReactNode } from "react";

/** What saving a cell or a row came to. A refusal carries the reason to show. */
export type CellResult =
  | { ok: true }
  | { ok: false; error: string; link?: { href: string; label: string } };

/** One choice of a dropdown cell. */
export type EditableOption = {
  value: string;
  label: string;
  /** Heading the choice is listed under. Choices keep the order they come in. */
  group?: string;
  /** Why the choice cannot be picked. It stays in the list, greyed out, with this text. */
  unavailable?: string;
  /** A note beside a choice that can be picked, for example what the person does now. */
  note?: string;
  /** Shows the picked choice in a muted colour, for a choice that means "nothing". */
  muted?: boolean;
};

type Column<Row, Type extends string, Value> = {
  id: string;
  header: string;
  type: Type;
  /** Classes for the column's cells, for example a width. */
  className?: string;
  value: (row: Row) => Value;
  /** The text shown when the cell cannot be edited. */
  display: (row: Row) => string;
  /** False shows this row's cell as text. Left out, every row's cell is editable. */
  editable?: (row: Row) => boolean;
  /** Saves the cell. A refusal puts the cell back to its old value. */
  save: (row: Row, value: Value) => Promise<CellResult>;
};

type Choices<Row> = {
  options: (row: Row) => EditableOption[];
  searchPlaceholder?: string;
};

/**
 * A column of an editable table, by cell type. To add a cell type, add a
 * member here and its cell in cells.tsx.
 */
export type EditableColumn<Row> =
  | Column<Row, "time", string>
  | (Column<Row, "text", string> & { placeholder?: string; maxLength?: number })
  | (Column<Row, "select", string> & Choices<Row>)
  | (Column<Row, "multi", string[]> &
      Choices<Row> & {
        /** What the closed cell shows for the picked values. Left out: their labels. */
        summary?: (values: string[]) => string;
      })
  | Column<Row, "checkbox", boolean>
  /** Anything that is not edited in place, for example links to other screens. */
  | {
      id: string;
      header: string;
      type: "custom";
      className?: string;
      render: (row: Row) => ReactNode;
    };

/** The blank row at the bottom of the table that adds a row. */
export type AddRow = {
  /** Names the row for screen readers, for example "New slot". */
  label: string;
  /** Shown in the cells the blank row does not fill in. */
  hint: string;
  /**
   * The ids of the columns the blank row fills in: time, text, select or multi
   * columns. A multi column's choices are kept as one comma-separated string.
   */
  columns: string[];
  /** The choices of a select or multi column in the blank row. */
  options?: Record<string, EditableOption[]>;
  /** Lets one cell fill in another, for example the end from the start. */
  fill?: (draft: Record<string, string>, changed: string) => Record<string, string>;
  isComplete: (draft: Record<string, string>) => boolean;
  /** Runs when the row is complete and the person leaves it. */
  save: (draft: Record<string, string>) => Promise<CellResult>;
};

/** Removing a row: at once, with an "Undo" message. */
export type RemoveRow<Row> = {
  /** The button's name, for example "Remove the 9:30 AM slot". */
  label: (row: Row) => string;
  remove: (row: Row) => Promise<CellResult>;
  /** The message after removing, for example "Removed the 9:30 AM slot." */
  removed: (row: Row) => string;
  undo?: (row: Row) => Promise<CellResult>;
};
