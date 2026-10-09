// Issue #50: Summer Camp activities become Summer activities. Each one gets
// the Grades of its Camp groups. Schedule rows and strays are deleted, Camp
// groups and Activity categories lose their activity lists, and the Summer
// Camp list sections select the new type.

import { recordId, versionPrefix } from "../lib/migration.mjs";
import { SCHOOL_ORDER } from "./issue-47-grades-and-programs.mjs";

const source = (suffix) => `wf-677fb80f7129b9488d3d6c63-${suffix}`;

/** Hidden Summer Camp records that are not activities. Deleted, not moved. */
export const NOT_ACTIVITIES = {
  [source("67ab8f035a66937dbe60cb42")]: "Snack Time",
  [source("67ab8f604633418a99325a7a")]: "Lunch",
  [source("67ab90198d270b1285150fb2")]: "Change",
  [source("67ab9027d6e3a62cb8a42deb")]: "Ice Cream Dismissal",
  [source("67ab90d9541abd4af8d332fb")]: "Club Day",
  [source("67ab9217eb2cbb8ea37e2c96")]: "Counselor in Training with Camp Groups",
  [source("67b81e7c797c6f6abab8a425")]: "Roundup",
  [source("67b8dbc399b997c5d7a26848")]: "Train Ride",
  [source("68f0de5e758dcaade252ea37")]: "Pontoon Boat",
};

/** The hidden Activity category of the six schedule rows. */
export const SCHEDULE_CATEGORY = "wf-677fb8025883d61a620d56db-67ace892fe4e2dece20bd778";

/** The fields a Summer activity keeps. The others are dropped on purpose. */
const KEPT = ["title", "slug", "category", "image", "description", "order", "visible"];
const DROPPED = ["program", "groups", "gradeLabel", "groupText"];
const SYSTEM = ["_id", "_type", "_rev", "_createdAt", "_updatedAt"];

/** The Summer activity that replaces an old record keeps its id with a prefix. */
export const summerActivityId = (id) => `${versionPrefix(id)}summer-${recordId(id)}`;

const isSummerCampActivity = (document) =>
  document._type === "activity" && document.program === "summerCamp";

const LIST_SECTIONS = new Set(["cardSlider", "filterableCards"]);

/** Every card slider or filterable cards section on Summer Camp selects the new type. */
function moveSections(value) {
  if (Array.isArray(value)) return value.map(moveSections);
  if (!value || typeof value !== "object") return value;
  const moved = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moveSections(item)]));
  if (!LIST_SECTIONS.has(value._type) || value.source !== "activity") return moved;
  if (!value.program) throw new Error(`Section ${value._key} lists activities without a side; choose one first`);
  return value.program === "summerCamp" ? { ...moved, source: "summerActivity" } : moved;
}

export default {
  description:
    "Issue #50: Summer Camp activities become Summer activities with Grades from their Camp groups; schedule rows, strays and the Schedule category are deleted.",

  prepare(dataset) {
    const published = (id) => dataset.get(id) ?? dataset.get(`drafts.${id}`);
    for (const [id, title] of Object.entries(NOT_ACTIVITIES))
      for (const document of [dataset.get(id), dataset.get(`drafts.${id}`)].filter(Boolean))
        if (!isSummerCampActivity(document) || document.title !== title || document.visible !== false)
          throw new Error(`${document._id} is not the hidden Summer Camp record "${title}"`);
    const schedule = dataset.get(SCHEDULE_CATEGORY);
    if (schedule && schedule.title !== "Schedule")
      throw new Error(`${SCHEDULE_CATEGORY} is "${schedule.title}", expected "Schedule"`);

    const gradeIds = new Map(
      dataset.documents.filter((document) => document._type === "grade").map((grade) => [grade.slug?.current, recordId(grade._id)]),
    );
    const gradeSlugs = new Map([...gradeIds].map(([slug, id]) => [id, slug]));
    const groups = dataset.documents.filter((document) => document._type === "campGroup");

    // The grades of every Camp group the activity lists, or that lists it.
    // The two lists agree today; the union keeps a grade if they ever differ.
    function gradesOf(activity) {
      const id = recordId(activity._id);
      const groupIds = new Set([
        ...(activity.groups ?? []).map((group) => recordId(group._ref)),
        ...groups.filter((group) => group.activities?.some((item) => recordId(item._ref) === id)).map((group) => recordId(group._id)),
      ]);
      const slugs = new Set();
      for (const groupId of groupIds) {
        const group = published(groupId);
        if (!group) throw new Error(`${activity._id} lists the missing Camp group ${groupId}`);
        for (const grade of group.grades ?? []) {
          const slug = gradeSlugs.get(recordId(grade._ref));
          if (!SCHOOL_ORDER.includes(slug)) throw new Error(`Camp group ${groupId} has the unknown Grade ${grade._ref}`);
          slugs.add(slug);
        }
      }
      return SCHOOL_ORDER.filter((slug) => slugs.has(slug)).map((slug) => ({
        _key: slug,
        _type: "reference",
        _ref: gradeIds.get(slug),
      }));
    }

    for (const document of dataset.documents) {
      if (!isSummerCampActivity(document) || NOT_ACTIVITIES[recordId(document._id)]) continue;
      const unknown = Object.keys(document).filter(
        (key) => document[key] !== undefined && ![...KEPT, ...DROPPED, ...SYSTEM].includes(key),
      );
      if (unknown.length) throw new Error(`${document._id} has fields a Summer activity cannot keep: ${unknown.join(", ")}`);
      if (gradesOf(document).length) continue;
      if (document.visible !== false)
        throw new Error(`${document._id} "${document.title}" is visible but has no Camp groups to give it Grades`);
      if (!versionPrefix(document._id))
        dataset.note(`Needs Grades before it is shown: "${document.title}" (${summerActivityId(document._id)})`);
    }

    return (document) => {
      const id = recordId(document._id);
      if (id === SCHEDULE_CATEGORY || NOT_ACTIVITIES[id]) return null;
      if (isSummerCampActivity(document)) {
        const kept = Object.fromEntries(KEPT.filter((key) => document[key] !== undefined).map((key) => [key, document[key]]));
        return { _id: summerActivityId(document._id), _type: "summerActivity", ...kept, grades: gradesOf(document) };
      }
      if (document._type === "campGroup" || document._type === "activityCategory") {
        delete document.activities;
        return document;
      }
      return moveSections(document);
    };
  },
};
