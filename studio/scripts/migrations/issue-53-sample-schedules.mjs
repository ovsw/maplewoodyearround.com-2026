// Issue #53: the one-row-per-slot sample schedule records join into one
// Sample schedule for each sample day, with its slots in source order. The
// card sliders that selected rows by their age-group text point to the new
// record instead.

import { recordId, versionPrefix } from "../lib/migration.mjs";

/** Each old age-group value, and the Sample schedule that replaces its rows. */
export const SCHEDULES = {
  "Preschool & Kindergarten": {
    _id: "sample-schedule-preschool-and-kindergarten",
    title: "Preschool & Kindergarten",
    program: "summerCamp",
    programs: { "wf-authored-program-d07c834e5c46fecd": "Preschool & Kindergarten" },
  },
  "1st–7th Grade": {
    _id: "sample-schedule-k-7th-grade",
    title: "K-7th Grade Program",
    program: "summerCamp",
    programs: { "wf-authored-program-f49413c3b5492eaa": "K-7th Grade Program" },
  },
  "CIT (8th–9th grade)": {
    _id: "sample-schedule-teen-leadership-cit",
    title: "Teen Leadership (C.I.T.)",
    program: "summerCamp",
    programs: { "wf-authored-program-e4366d3ae4f07b3c": "Teen Leadership (C.I.T.)" },
  },
  // Both preschool Programs run the same day and share the Preschool Program page.
  Preschool: {
    _id: "sample-schedule-preschool",
    title: "Preschool Program",
    program: "schoolYear",
    programs: {
      "wf-6778db8fb567d06d3525c12f-677cfc19b867a3cf4cbf69c0": "2 Day Preschool",
      "wf-6778db8fb567d06d3525c12f-677cfc1691309e2cb63150d0": "3 Day Preschool",
    },
  },
};

const ACTIVITY_TYPE = { summerCamp: "summerActivity", schoolYear: "schoolYearActivity" };

/** The fields of an old row. The slug, side and order are not kept. */
const ROW_FIELDS = ["title", "slug", "activity", "audience", "program", "description", "image", "order"];
const SYSTEM = ["_id", "_type", "_rev", "_createdAt", "_updatedAt"];

/** An old row stores its age group as text; a Sample schedule has none. */
const isRow = (document) => document._type === "sampleSchedule" && document.audience !== undefined;

const nameKey = (name) => name?.trim().replace(/\s+/g, " ").toLowerCase();

// The order the Website showed the rows in: no order number first, then by
// order, title and id, as GROQ sorts them.
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sourceOrder = (a, b) =>
  compare(a.order !== undefined, b.order !== undefined) ||
  compare(a.order ?? 0, b.order ?? 0) ||
  compare(a.title ?? "", b.title ?? "") ||
  compare(a._id, b._id);

const LIST_SECTIONS = new Set(["cardSlider", "filterableCards"]);

/**
 * Every list section that selected rows by age group points to the new
 * record. The record must exist after the run.
 */
function moveSections(value, available) {
  if (Array.isArray(value)) return value.map((item) => moveSections(item, available));
  if (!value || typeof value !== "object") return value;
  const moved = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moveSections(item, available)]));
  if (!LIST_SECTIONS.has(value._type) || value.audience === undefined) return moved;
  const schedule = SCHEDULES[value.audience];
  if (value.source !== "sampleSchedule" || !schedule)
    throw new Error(`Section ${value._key} selects the age group "${value.audience}" with the source "${value.source}"`);
  if (!available.has(schedule._id))
    throw new Error(`Section ${value._key} selects "${value.audience}", which has no rows and no Sample schedule`);
  delete moved.audience;
  return { ...moved, sampleSchedule: { _type: "reference", _ref: schedule._id } };
}

export default {
  description:
    "Issue #53: the sample schedule rows join into one Sample schedule for each sample day; card sliders point to it.",

  prepare(dataset) {
    const left = dataset.documents.filter((document) => document._type === "activity");
    if (left.length)
      throw new Error(`${left.length} old activity records remain; run issue-51-school-year-activities first`);

    for (const schedule of Object.values(SCHEDULES))
      for (const [id, title] of Object.entries(schedule.programs)) {
        const program = dataset.get(id);
        if (program?.title !== title || program.program !== schedule.program)
          throw new Error(`${id} is not the ${schedule.program} Program "${title}"`);
      }

    // The activities of each side by name. A name must point to one record.
    const activities = {};
    for (const [side, type] of Object.entries(ACTIVITY_TYPE)) {
      activities[side] = new Map();
      for (const document of dataset.documents.filter((item) => item._type === type)) {
        const ids = activities[side].get(nameKey(document.title)) ?? new Set();
        activities[side].set(nameKey(document.title), ids.add(recordId(document._id)));
      }
    }

    const rows = dataset.documents.filter(isRow);
    for (const row of rows) {
      if (versionPrefix(row._id)) throw new Error(`${row._id} is a draft or release version; publish or discard it first`);
      const unknown = Object.keys(row).filter((key) => row[key] !== undefined && ![...ROW_FIELDS, ...SYSTEM].includes(key));
      if (unknown.length) throw new Error(`${row._id} has fields a slot cannot keep: ${unknown.join(", ")}`);
      const schedule = SCHEDULES[row.audience];
      if (!schedule) throw new Error(`${row._id} has the unknown age group "${row.audience}"`);
      if (row.program !== schedule.program) throw new Error(`${row._id} is ${row.program}, but "${row.audience}" is ${schedule.program}`);
      if (!row.activity?.trim()) throw new Error(`${row._id} has no activity name for the slot label`);
    }

    /** The new record for one age group: its rows as slots, in source order. */
    const replacements = new Map();
    for (const [audience, schedule] of Object.entries(SCHEDULES)) {
      const own = rows.filter((row) => row.audience === audience).sort(sourceOrder);
      if (!own.length) continue;
      const slots = own.map((row) => {
        const ids = activities[schedule.program].get(nameKey(row.activity)) ?? new Set();
        if (ids.size > 1) throw new Error(`"${row.activity}" names ${ids.size} activities: ${[...ids].join(", ")}`);
        const [activity] = ids;
        return {
          // The Webflow item id keeps each slot's key stable.
          _key: recordId(row._id).split("-").pop(),
          _type: "sampleScheduleSlot",
          time: row.title,
          label: row.activity,
          ...(activity && { activity: { _type: "reference", _ref: activity } }),
          ...(row.description !== undefined && { description: row.description }),
          ...(row.image !== undefined && { image: row.image }),
        };
      });
      if (new Set(slots.map((slot) => slot._key)).size !== slots.length)
        throw new Error(`Two rows of "${audience}" share a slot key`);
      replacements.set(own[0]._id, {
        _id: schedule._id,
        _type: "sampleSchedule",
        title: schedule.title,
        program: schedule.program,
        programs: Object.keys(schedule.programs).map((id) => ({ _key: id.split("-").pop(), _type: "reference", _ref: id })),
        slots,
      });
      const labelOnly = slots.filter((slot) => !slot.activity).map((slot) => slot.label);
      dataset.note(
        `"${schedule.title}" (${schedule._id}): ${slots.length} slots, ${slots.length - labelOnly.length} linked to an activity; label only: ${labelOnly.join(", ") || "none"}`,
      );
    }

    const available = new Set([
      ...[...replacements.values()].map((schedule) => schedule._id),
      ...Object.values(SCHEDULES).map((schedule) => schedule._id).filter((id) => dataset.get(id)),
    ]);

    return (document) => {
      if (isRow(document)) return replacements.get(document._id) ?? null;
      return moveSections(document, available);
    };
  },
};
