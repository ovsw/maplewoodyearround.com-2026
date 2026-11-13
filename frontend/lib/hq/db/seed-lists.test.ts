// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildCampHqSeed, campHqSeed, sampleTeamFor } from "./seed-lists";

const source = "test";

describe("building the seed from the Website's lists", () => {
  it("copies names and grades, and gives each group a sample Team by its youngest grade", () => {
    const seed = buildCampHqSeed(
      {
        campGroups: [
          { name: "Sample Foxes", grades: ["Kindergarten", "Preschool"] },
          { name: "Sample  Hawks ", grades: ["2nd Grade", "1st Grade"] },
          { name: "Sample Owls", grades: ["5th Grade", "3rd Grade"] },
          { name: "Sample Wolves", grades: ["9th Grade", "6th Grade"] },
        ],
        activities: [],
      },
      { source },
    );

    expect(seed.campGroups).toEqual([
      { name: "Sample Foxes", grades: ["preschool", "kindergarten"], team: 1, teamIsSample: true },
      { name: "Sample Hawks", grades: ["grade_1", "grade_2"], team: 2, teamIsSample: true },
      { name: "Sample Owls", grades: ["grade_3", "grade_5"], team: 3, teamIsSample: true },
      { name: "Sample Wolves", grades: ["grade_6", "grade_9"], team: 4, teamIsSample: true },
    ]);
    expect(seed.note).toMatch(/SAMPLE/);
  });

  it("marks lunch and free swim as shared, adds Lunch, and allows every grade when none is set", () => {
    const seed = buildCampHqSeed(
      {
        campGroups: [],
        activities: [
          { name: "Archery", grades: ["4th Grade"] },
          { name: "Free Swim", grades: [] },
        ],
      },
      { source },
    );

    expect(seed.activities.map(({ name, kind }) => [name, kind])).toEqual([
      ["Archery", "exclusive"],
      ["Free Swim", "shared"],
      ["Lunch", "shared"],
    ]);
    expect(seed.activities[0].grades).toEqual(["grade_4"]);
    expect(seed.activities[1].grades).toHaveLength(11);
  });

  it("stops on a grade Camp HQ does not know", () => {
    expect(() =>
      buildCampHqSeed(
        { campGroups: [{ name: "Sample Bears", grades: ["10th Grade"] }], activities: [] },
        { source },
      ),
    ).toThrow(/Unknown grade/);
  });

  it("puts the youngest groups in Team 1 and the oldest in Team 4", () => {
    expect(sampleTeamFor(["kindergarten"])).toBe(1);
    expect(sampleTeamFor(["grade_2", "grade_3"])).toBe(2);
    expect(sampleTeamFor(["grade_8", "grade_9"])).toBe(4);
  });
});

describe("the committed seed file", () => {
  it("has groups and activities, every Team marked as sample", () => {
    expect(campHqSeed.campGroups.length).toBeGreaterThan(0);
    expect(campHqSeed.activities.length).toBeGreaterThan(0);
    expect(campHqSeed.campGroups.every((group) => group.teamIsSample)).toBe(true);
  });
});
