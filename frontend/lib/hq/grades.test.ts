import { describe, expect, it } from "vitest";

import { campHqGrades, formatGrades } from "./grades";

describe("Camp HQ's grades", () => {
  it("runs from Preschool to 9th Grade", () => {
    expect(campHqGrades.map((grade) => grade.label)).toEqual([
      "Preschool",
      "Kindergarten",
      "1st Grade",
      "2nd Grade",
      "3rd Grade",
      "4th Grade",
      "5th Grade",
      "6th Grade",
      "7th Grade",
      "8th Grade",
      "9th Grade",
    ]);
  });

  it("shows grades youngest first and shortens three or more in a row", () => {
    expect(formatGrades(["kindergarten", "preschool"])).toBe("Preschool, Kindergarten");
    expect(formatGrades(["grade_9", "grade_1", "grade_2", "grade_3", "grade_5"])).toBe(
      "1st Grade to 3rd Grade, 5th Grade, 9th Grade",
    );
    expect(formatGrades([])).toBe("");
  });
});
