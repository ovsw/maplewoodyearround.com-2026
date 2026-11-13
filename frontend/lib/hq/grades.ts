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

/**
 * The grades for reading, youngest first. Three or more grades in a row are
 * shortened: "Preschool to 3rd Grade, 5th Grade".
 */
export function formatGrades(grades: readonly CampHqGrade[]) {
  const positions = sortGrades(grades).map((grade) => campHqGradeValues.indexOf(grade));
  const runs: number[][] = [];
  for (const position of positions) {
    const run = runs.at(-1);
    if (run && run.at(-1) === position - 1) run.push(position);
    else runs.push([position]);
  }
  const label = (position: number) => campHqGradeLabels[campHqGradeValues[position]];
  return runs
    .flatMap((run) =>
      run.length >= 3 ? [`${label(run[0])} to ${label(run.at(-1)!)}`] : run.map(label),
    )
    .join(", ");
}
