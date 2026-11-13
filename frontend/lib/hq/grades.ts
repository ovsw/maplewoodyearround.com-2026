// Camp HQ's own list of grades, Preschool to 9th Grade, youngest first. It is
// kept here and in the database's `grade` type, not read from the Website.

export const campHqGradeValues = [
  "preschool",
  "kindergarten",
  "grade_1",
  "grade_2",
  "grade_3",
  "grade_4",
  "grade_5",
  "grade_6",
  "grade_7",
  "grade_8",
  "grade_9",
] as const;

export type CampHqGrade = (typeof campHqGradeValues)[number];

export const campHqGradeLabels: Record<CampHqGrade, string> = {
  preschool: "Preschool",
  kindergarten: "Kindergarten",
  grade_1: "1st Grade",
  grade_2: "2nd Grade",
  grade_3: "3rd Grade",
  grade_4: "4th Grade",
  grade_5: "5th Grade",
  grade_6: "6th Grade",
  grade_7: "7th Grade",
  grade_8: "8th Grade",
  grade_9: "9th Grade",
};

export const campHqGrades = campHqGradeValues.map((value) => ({
  value,
  label: campHqGradeLabels[value],
}));

export function isCampHqGrade(value: unknown): value is CampHqGrade {
  return (campHqGradeValues as readonly unknown[]).includes(value);
}

/** The grades without repeats, youngest first. */
export function sortGrades(grades: readonly CampHqGrade[]): CampHqGrade[] {
  return campHqGradeValues.filter((grade) => grades.includes(grade));
}

/** "Preschool, Kindergarten" for showing a list of grades. */
export function formatGrades(grades: readonly CampHqGrade[]) {
  return sortGrades(grades)
    .map((grade) => campHqGradeLabels[grade])
    .join(", ");
}
