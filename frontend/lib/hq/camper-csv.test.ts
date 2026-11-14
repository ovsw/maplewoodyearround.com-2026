// The CSV adapter for "load campers" (#149). All names are invented.
import { describe, expect, it } from "vitest";

import { campDate, isCampDate, weekEnd, weekStart } from "./camp-dates";
import { parseCsv, readCamperCsv } from "./camper-csv";

describe("parseCsv", () => {
  it("reads quoted values, Windows line ends, a byte order mark and blank lines", () => {
    const text = '﻿a,b\r\n"Quill, Dara","say ""hi"""\r\n\r\n"two\nlines",x\n';
    expect(parseCsv(text)).toEqual([
      { row: 1, fields: ["a", "b"] },
      { row: 2, fields: ["Quill, Dara", 'say "hi"'] },
      { row: 4, fields: ["two\nlines", "x"] },
    ]);
  });

  it("reports a quoted value that is never closed", () => {
    expect(parseCsv('a,b\n"open,x\n')).toEqual([
      { row: 1, fields: ["a", "b"] },
      { row: 2, error: "A quoted value is not closed." },
    ]);
  });
});

describe("readCamperCsv", () => {
  it("finds the columns by name, in any order and letter case", () => {
    const text = "expected, camp group ,NAME,Date,Camper ID\nyes,Eagles,Ava Brookfield,2027-07-06,C-1001\n";
    expect(readCamperCsv(text)).toEqual({
      rows: [
        {
          row: 2,
          camperId: "C-1001",
          name: "Ava Brookfield",
          date: "2027-07-06",
          campGroup: "Eagles",
          expected: true,
        },
      ],
      errors: [],
    });
  });

  it("reads nothing from a file without the expected columns", () => {
    const result = readCamperCsv("Camper,Name,Date\nC-1001,Ava Brookfield,2027-07-06\n");
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      {
        row: 1,
        camperId: null,
        reason: expect.stringContaining('no "Camper ID", "Camp group", "Expected" columns'),
      },
    ]);
    expect(readCamperCsv("").errors).toEqual([
      { row: null, camperId: null, reason: "The file is empty." },
    ]);
  });

  it("refuses dates that do not exist", () => {
    const { errors } = readCamperCsv(
      "Camper ID,Name,Date,Camp group,Expected\nC-1,Ava Brookfield,2027-02-30,Eagles,yes\n",
    );
    expect(errors).toEqual([
      { row: 2, camperId: "C-1", reason: expect.stringContaining('"2027-02-30" is not a date') },
    ]);
  });
});

describe("camp dates", () => {
  it("uses the camp-local date", () => {
    // 11:30 PM in New York is already the next day in UTC.
    expect(campDate(new Date("2027-07-07T03:30:00.000Z"))).toBe("2027-07-06");
    expect(isCampDate("2027-07-06")).toBe(true);
    expect(isCampDate("2027-7-6")).toBe(false);
  });

  it("finds the Monday to Sunday week of a date", () => {
    expect(weekStart("2027-07-06")).toBe("2027-07-05");
    expect(weekEnd("2027-07-06")).toBe("2027-07-11");
    expect(weekStart("2027-07-11")).toBe("2027-07-05");
    expect(weekEnd("2027-07-05")).toBe("2027-07-11");
  });
});
