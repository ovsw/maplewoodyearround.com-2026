// Camp HQ's starting lists of Camp groups and activities. `pnpm --dir frontend
// hq:seed-lists` reads them once from the Website's published content and
// writes seed-lists.json, which is committed. The local database and the tests
// load that file; Camp HQ never reads the Website at run time.
import { sql } from "drizzle-orm";

import { campHqGradeLabels, campHqGradeValues, sortGrades, type CampHqGrade } from "../grades.ts";

import type { CampHqDb } from "./database.ts";
import { activities, campGroups } from "./schema.ts";
import seedListsJson from "./seed-lists.json" with { type: "json" };

export type SeedCampGroup = {
  name: string;
  grades: CampHqGrade[];
  team: number;
  /** Always true: the Team is sample data until Maplewood confirms it. */
  teamIsSample: boolean;
};

export type SeedActivity = {
  name: string;
  grades: CampHqGrade[];
  kind: "exclusive" | "shared";
};

export type CampHqSeed = {
  note: string;
  source: string;
  campGroups: SeedCampGroup[];
  activities: SeedActivity[];
};

/** The committed seed file, loaded by the local database and the tests. */
export const campHqSeed = seedListsJson as CampHqSeed;

/** A Camp group or Summer activity as the Website stores it: grade titles. */
export type WebsiteListItem = { name: string; grades: string[] };

/** Activities that many Camp groups share at once, such as lunch and free swim. */
const SHARED_ACTIVITY = /\b(lunch|free swim)\b/i;

/** Camp HQ needs a lunch activity for schedules; the Website lists none. */
const EXTRA_ACTIVITIES = ["Lunch"];

export const SEED_NOTE =
  "Camp groups and activities copied once from the Website's published content. " +
  "SAMPLE: every Team is invented from the group's youngest grade " +
  "(Preschool and Kindergarten: Team 1; 1st and 2nd: Team 2; 3rd to 5th: Team 3; " +
  "6th and up: Team 4) until Maplewood confirms the Teams. " +
  "An activity with no grades on the Website is allowed for every grade. " +
  "Lunch is added for schedules. Lunch and free swim are shared; the rest start as exclusive.";

function gradeFromTitle(title: string): CampHqGrade {
  const wanted = title.trim().toLowerCase();
  const grade = campHqGradeValues.find(
    (value) => campHqGradeLabels[value].toLowerCase() === wanted,
  );
  if (!grade) throw new Error(`Unknown grade on the Website: "${title}"`);
  return grade;
}

function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

/** SAMPLE: the Team of a group from its youngest grade. */
export function sampleTeamFor(grades: readonly CampHqGrade[]): number {
  const youngest = campHqGradeValues.indexOf(sortGrades(grades)[0] ?? "grade_9");
  if (youngest <= campHqGradeValues.indexOf("kindergarten")) return 1;
  if (youngest <= campHqGradeValues.indexOf("grade_2")) return 2;
  if (youngest <= campHqGradeValues.indexOf("grade_5")) return 3;
  return 4;
}

export function activityKindFor(name: string): SeedActivity["kind"] {
  return SHARED_ACTIVITY.test(name) ? "shared" : "exclusive";
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "en");

/** Turns the Website's Camp groups and Summer activities into Camp HQ's seed. */
export function buildCampHqSeed(
  website: { campGroups: WebsiteListItem[]; activities: WebsiteListItem[] },
  { source }: { source: string },
): CampHqSeed {
  const groups = website.campGroups.map((group) => {
    const grades = sortGrades(group.grades.map(gradeFromTitle));
    if (grades.length === 0) throw new Error(`Camp group "${group.name}" has no grades.`);
    return { name: cleanName(group.name), grades, team: sampleTeamFor(grades), teamIsSample: true };
  });

  const activityNames = new Set(website.activities.map((a) => cleanName(a.name).toLowerCase()));
  const extras = EXTRA_ACTIVITIES.filter((name) => !activityNames.has(name.toLowerCase())).map(
    (name) => ({ name, grades: [] as string[] }),
  );
  const seededActivities = [...website.activities, ...extras].map((activity) => {
    const name = cleanName(activity.name);
    const grades = sortGrades(activity.grades.map(gradeFromTitle));
    return {
      name,
      grades: grades.length > 0 ? grades : [...campHqGradeValues],
      kind: activityKindFor(name),
    };
  });

  return {
    note: SEED_NOTE,
    source,
    campGroups: groups.sort(byName),
    activities: seededActivities.sort(byName),
  };
}

/**
 * Loads the seed into a database whose lists are empty. A list that already
 * has rows is left alone, so Admins' edits are never overwritten.
 */
export async function loadSeedLists(db: CampHqDb, seed: CampHqSeed, { now }: { now: Date }) {
  const [{ groupCount }] = await db
    .select({ groupCount: sql<number>`count(*)::int` })
    .from(campGroups);
  if (groupCount === 0 && seed.campGroups.length > 0) {
    await db
      .insert(campGroups)
      .values(seed.campGroups.map((group) => ({ ...group, createdAt: now, updatedAt: now })));
  }

  const [{ activityCount }] = await db
    .select({ activityCount: sql<number>`count(*)::int` })
    .from(activities);
  if (activityCount === 0 && seed.activities.length > 0) {
    await db
      .insert(activities)
      .values(seed.activities.map((activity) => ({ ...activity, createdAt: now, updatedAt: now })));
  }
}
