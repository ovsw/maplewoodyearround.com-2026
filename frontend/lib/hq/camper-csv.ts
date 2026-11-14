// The CSV adapter for "load campers": turns an uploaded camper file into the
// normalised list of camper days that the operation takes. Maplewood has not
// supplied a real CampMinder export yet, so the file layout is Camp HQ's own
// (documented in docs/camp-hq/camper-file.md). CAMPER_CSV_COLUMNS is the only
// place that knows the column names; swap it when the real layout is known.
import { isCampDate } from "./camp-dates.ts";
import type { CamperLoadError, CamperLoadRow } from "./campers.ts";

/** Which column of the file holds each part of a camper day. */
export const CAMPER_CSV_COLUMNS = {
  camperId: "Camper ID",
  name: "Name",
  date: "Date",
  campGroup: "Camp group",
  expected: "Expected",
} as const;

type Field = keyof typeof CAMPER_CSV_COLUMNS;

/** The values the Expected column takes, in any letter case. */
const EXPECTED_VALUES: Record<string, boolean> = { yes: true, no: false };

type CsvRecord = { row: number; fields: string[] } | { row: number; error: string };

/**
 * Splits CSV text into records. Fields may be quoted ("…", with "" for a
 * quote) and may then hold commas and line breaks. `row` is the line a record
 * starts on, counting the header as row 1. Blank lines are skipped.
 */
export function parseCsv(text: string): CsvRecord[] {
  const source = text.startsWith("﻿") ? text.slice(1) : text;
  const records: CsvRecord[] = [];
  let line = 1;
  let index = 0;

  while (index < source.length) {
    const startLine = line;
    const fields: string[] = [];
    let field = "";
    let quoted = false;
    let error: string | null = null;

    while (index < source.length) {
      const char = source[index];
      if (quoted) {
        if (char === '"' && source[index + 1] === '"') {
          field += '"';
          index += 2;
        } else if (char === '"') {
          quoted = false;
          index += 1;
        } else {
          if (char === "\n") line += 1;
          field += char;
          index += 1;
        }
        continue;
      }
      if (char === '"' && field.trim() === "") {
        quoted = true;
        field = "";
        index += 1;
      } else if (char === ",") {
        fields.push(field);
        field = "";
        index += 1;
      } else if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      } else if (char === "\n") {
        index += 1;
        line += 1;
        break;
      } else {
        field += char;
        index += 1;
      }
    }
    if (quoted) error = "A quoted value is not closed.";
    fields.push(field);

    if (error) records.push({ row: startLine, error });
    else if (fields.some((value) => value.trim() !== "")) {
      records.push({ row: startLine, fields: fields.map((value) => value.trim()) });
    }
  }
  return records;
}

const columnList = Object.values(CAMPER_CSV_COLUMNS).join(", ");

/**
 * Reads a camper file. Returns the camper days it could read and, for every
 * row it could not, the reason and the camper id when the row names one.
 */
export function readCamperCsv(text: string): {
  rows: CamperLoadRow[];
  errors: CamperLoadError[];
} {
  const [header, ...records] = parseCsv(text);
  if (!header) {
    return { rows: [], errors: [{ row: null, camperId: null, reason: "The file is empty." }] };
  }
  if ("error" in header) {
    return { rows: [], errors: [{ row: header.row, camperId: null, reason: header.error }] };
  }

  const names = header.fields.map((name) => name.toLowerCase());
  const position = {} as Record<Field, number>;
  const missing: string[] = [];
  for (const [field, column] of Object.entries(CAMPER_CSV_COLUMNS) as [Field, string][]) {
    position[field] = names.indexOf(column.toLowerCase());
    if (position[field] === -1) missing.push(column);
  }
  if (missing.length > 0) {
    const reason =
      missing.length === 1
        ? `The file has no "${missing[0]}" column. The first row must name the columns: ${columnList}.`
        : `The file has no ${missing.map((name) => `"${name}"`).join(", ")} columns. The first row must name the columns: ${columnList}.`;
    return { rows: [], errors: [{ row: header.row, camperId: null, reason }] };
  }

  const rows: CamperLoadRow[] = [];
  const errors: CamperLoadError[] = [];
  for (const record of records) {
    if ("error" in record) {
      errors.push({ row: record.row, camperId: null, reason: record.error });
      continue;
    }
    const value = (field: Field) => record.fields[position[field]] ?? "";
    const camperId = value("camperId") || null;
    const refuse = (reason: string) => errors.push({ row: record.row, camperId, reason });

    if (record.fields.length !== header.fields.length) {
      refuse(
        `The row has ${record.fields.length} values; the first row names ${header.fields.length} columns.`,
      );
      continue;
    }
    const date = value("date");
    if (!isCampDate(date)) {
      refuse(
        date
          ? `"${date}" is not a date. Write dates as YYYY-MM-DD, for example 2027-07-06.`
          : "The date is missing.",
      );
      continue;
    }
    const expected = EXPECTED_VALUES[value("expected").toLowerCase()];
    if (expected === undefined) {
      refuse(`Expected must be "yes" or "no", not "${value("expected")}".`);
      continue;
    }
    rows.push({
      row: record.row,
      camperId: value("camperId"),
      name: value("name"),
      date,
      campGroup: value("campGroup"),
      expected,
    });
  }
  return { rows, errors };
}
