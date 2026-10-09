// Issue #51: the remaining records of the shared activity type become School
// Year activities. Programs lose their activity lists, and the list sections
// that showed activities select the new type.

import { recordId, versionPrefix } from "../lib/migration.mjs";

/** The fields a School Year activity keeps. */
const KEPT = ["title", "slug", "programs", "availability", "location", "image", "description", "order", "visible"];
// The side is now the type. The Play Center label holds "no" on every record
// and the Website never reads it.
const DROPPED = ["program", "playgroundLabel"];
const SYSTEM = ["_id", "_type", "_rev", "_createdAt", "_updatedAt"];

/** The School Year activity that replaces an old record keeps its id with a prefix. */
export const schoolYearActivityId = (id) => `${versionPrefix(id)}school-year-${recordId(id)}`;

const LIST_SECTIONS = new Set(["cardSlider", "filterableCards"]);

/** Every card slider or filterable cards section that lists activities selects the new type. */
function moveSections(value) {
  if (Array.isArray(value)) return value.map(moveSections);
  if (!value || typeof value !== "object") return value;
  const moved = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moveSections(item)]));
  return LIST_SECTIONS.has(value._type) && value.source === "activity"
    ? { ...moved, source: "schoolYearActivity" }
    : moved;
}

export default {
  description:
    "Issue #51: School Year activities move to their own type; Programs lose their activity lists; list sections select the new type.",

  prepare(dataset) {
    const activities = dataset.documents.filter((document) => document._type === "activity");
    for (const document of activities) {
      if (document.program !== "schoolYear")
        throw new Error(`${document._id} "${document.title}" is not a School Year activity`);
      if (![undefined, "no"].includes(document.playgroundLabel))
        throw new Error(`${document._id} has the Play Center label "${document.playgroundLabel}"; only "no" can be dropped`);
      const unknown = Object.keys(document).filter(
        (key) => document[key] !== undefined && ![...KEPT, ...DROPPED, ...SYSTEM].includes(key),
      );
      if (unknown.length)
        throw new Error(`${document._id} has fields a School Year activity cannot keep: ${unknown.join(", ")}`);
      if (!document.programs?.length && !versionPrefix(document._id))
        dataset.note(`Needs a Program: "${document.title}" (${schoolYearActivityId(document._id)})`);
    }

    // A Program's list must not hold an activity the activity does not name
    // back, or removing the list would drop that link.
    const names = (activityId, programId) =>
      activities.some(
        (document) =>
          recordId(document._id) === activityId &&
          document.programs?.some((program) => recordId(program._ref) === programId),
      );
    for (const program of dataset.documents.filter((document) => document._type === "programOffering"))
      for (const item of program.activities ?? [])
        if (!names(recordId(item._ref), recordId(program._id)))
          throw new Error(`${program._id} "${program.title}" lists ${item._ref}, which does not name it as a Program`);

    return (document) => {
      if (document._type === "activity") {
        const kept = Object.fromEntries(KEPT.filter((key) => document[key] !== undefined).map((key) => [key, document[key]]));
        return { _id: schoolYearActivityId(document._id), _type: "schoolYearActivity", ...kept, programs: document.programs ?? [] };
      }
      if (document._type === "programOffering") {
        delete document.activities;
        return document;
      }
      return moveSections(document);
    };
  },
};
