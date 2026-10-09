import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration, { SCHEDULES } from "./issue-53-sample-schedules.mjs";

const ref = (_ref) => ({ _type: "reference", _ref });
const image = (name) => ({ _type: "image", alt: "", asset: ref(`image-${name}`) });

const row = (item, audience, title, activity, extra = {}) => ({
  _id: `wf-67ac6866f1c45e07ffcb3c01-${item}`,
  _type: "sampleSchedule",
  _rev: "r1",
  title,
  slug: { _type: "slug", current: item },
  activity,
  audience,
  program: SCHEDULES[audience].program,
  description: `About ${activity}`,
  image: image(item),
  ...extra,
});

const programs = Object.values(SCHEDULES).flatMap((schedule) =>
  Object.entries(schedule.programs).map(([_id, title]) => ({
    _id,
    _type: "programOffering",
    title,
    program: schedule.program,
  })),
);

const section = (_key, audience) => ({
  _key,
  _type: "cardSlider",
  title: "Sample Daily Schedule",
  source: "sampleSchedule",
  program: SCHEDULES[audience].program,
  audience,
});

// Today's records: the Preschool & Kindergarten rows are stored out of order
// and one has no order number; "Lunch" is a School Year activity only.
function fixtures() {
  return [
    ...programs,
    { _id: "summer-swim", _type: "summerActivity", title: "Swimming Lessons (daily)" },
    { _id: "drafts.summer-swim", _type: "summerActivity", title: "Swimming Lessons (daily)" },
    { _id: "summer-soccer", _type: "summerActivity", title: "Soccer" },
    { _id: "school-year-lunch", _type: "schoolYearActivity", title: "Lunch" },
    { _id: "school-year-story", _type: "schoolYearActivity", title: "Story Time" },
    row("a3", "Preschool & Kindergarten", "11:30-12", "Lunch", { order: 50 }),
    row("a1", "Preschool & Kindergarten", "9:30–10", "Soccer", { order: 10 }),
    row("a2", "Preschool & Kindergarten", "1–1:30", "Swimming Lessons  (daily)", { order: 30, image: undefined }),
    row("a0", "Preschool & Kindergarten", "9-9:30", "Roundup"),
    row("b1", "Preschool", "10:15–10:30", "Story Time", { order: 3 }),
    row("b2", "Preschool", "12:20–12:55", "Lunch", { order: 9, description: undefined }),
    {
      _id: "pk-page",
      _type: "page",
      blocks: [
        section("sample-schedule-2", "Preschool & Kindergarten"),
        { _key: "events", _type: "cardSlider", source: "summerActivity", program: "summerCamp" },
      ],
    },
    { _id: "drafts.pk-page", _type: "page", blocks: [section("sample-schedule-2", "Preschool & Kindergarten")] },
    { _id: "preschool-page", _type: "page", blocks: [section("sample-schedule-5", "Preschool")] },
  ];
}

const created = (plan, id) => plan.created.find((document) => document._id === id);
const changed = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after;

function applyLocally(documents, plan) {
  const after = new Map(documents.map((document) => [document._id, document]));
  for (const document of plan.created) after.set(document._id, document);
  for (const { after: document } of plan.changed) after.set(document._id, document);
  for (const document of plan.deleted) after.delete(document._id);
  return [...after.values()];
}

test("the rows of each age group join into one Sample schedule for its Programs, in source order", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(
    plan.created.map((document) => document._id).sort(),
    ["sample-schedule-preschool", "sample-schedule-preschool-and-kindergarten"],
  );
  const summer = created(plan, "sample-schedule-preschool-and-kindergarten");
  assert.equal(summer.title, "Preschool & Kindergarten");
  assert.equal(summer.program, "summerCamp");
  assert.deepEqual(summer.programs.map((program) => program._ref), ["wf-authored-program-d07c834e5c46fecd"]);
  assert.deepEqual(
    summer.slots.map((slot) => [slot._key, slot.time, slot.label]),
    [
      ["a0", "9-9:30", "Roundup"],
      ["a1", "9:30–10", "Soccer"],
      ["a2", "1–1:30", "Swimming Lessons  (daily)"],
      ["a3", "11:30-12", "Lunch"],
    ],
  );
  assert.deepEqual(summer.slots[1], {
    _key: "a1",
    _type: "sampleScheduleSlot",
    time: "9:30–10",
    label: "Soccer",
    activity: ref("summer-soccer"),
    description: "About Soccer",
    image: image("a1"),
  });
  assert.equal(summer.slots[2].image, undefined);

  const preschool = created(plan, "sample-schedule-preschool");
  assert.equal(preschool.program, "schoolYear");
  assert.deepEqual(
    preschool.programs.map((program) => program._ref),
    ["wf-6778db8fb567d06d3525c12f-677cfc19b867a3cf4cbf69c0", "wf-6778db8fb567d06d3525c12f-677cfc1691309e2cb63150d0"],
  );
  assert.deepEqual(preschool.slots.map((slot) => slot.time), ["10:15–10:30", "12:20–12:55"]);
  assert.equal(preschool.slots[1].description, undefined);
});

test("a slot references an activity of its own side with that name; the others carry only the label", () => {
  const plan = planMigration(migration, fixtures());
  const activities = (id) => created(plan, id).slots.map((slot) => slot.activity?._ref ?? null);
  // Spacing and case do not matter; a School Year "Lunch" is not a Summer Camp activity.
  assert.deepEqual(activities("sample-schedule-preschool-and-kindergarten"), [null, "summer-soccer", "summer-swim", null]);
  assert.deepEqual(activities("sample-schedule-preschool"), ["school-year-story", "school-year-lunch"]);
  assert.deepEqual(plan.notes, [
    '"Preschool & Kindergarten" (sample-schedule-preschool-and-kindergarten): 4 slots, 2 linked to an activity; label only: Roundup, Lunch',
    '"Preschool Program" (sample-schedule-preschool): 2 slots, 2 linked to an activity; label only: none',
  ]);
});

test("the sections point to the new records in drafts and published, and the rows are deleted", () => {
  const documents = fixtures();
  const plan = planMigration(migration, documents);
  const pointer = { _type: "reference", _ref: "sample-schedule-preschool-and-kindergarten" };
  for (const id of ["pk-page", "drafts.pk-page"]) {
    const [schedule] = changed(plan, id).blocks;
    assert.equal(schedule.audience, undefined);
    assert.deepEqual(schedule.sampleSchedule, pointer);
    assert.equal(schedule.source, "sampleSchedule");
  }
  assert.deepEqual(changed(plan, "pk-page").blocks[1], documents.find((d) => d._id === "pk-page").blocks[1]);
  assert.deepEqual(changed(plan, "preschool-page").blocks[0].sampleSchedule, ref("sample-schedule-preschool"));
  assert.equal(plan.deleted.length, 6);
  assert.ok(plan.deleted.every((document) => document.audience !== undefined));
  assert.ok(isEmpty(planMigration(migration, applyLocally(documents, plan))));
});

test("the run stops when the records are not what it expects", () => {
  const stops = (documents, message) => assert.throws(() => planMigration(migration, documents), message);
  stops([...fixtures(), { _id: "old", _type: "activity", title: "Lunch" }], /run issue-51-school-year-activities first/);
  stops([...fixtures(), row("x", "Preschool", "9", "Snack", { _id: "drafts.x" })], /draft or release version/);
  stops([...fixtures(), { ...row("x", "Preschool", "9", "Snack"), audience: "Toddlers" }], /unknown age group "Toddlers"/);
  stops([...fixtures(), { ...row("x", "Preschool", "9", "Snack"), program: "summerCamp" }], /is summerCamp, but "Preschool" is schoolYear/);
  stops([...fixtures(), row("x", "Preschool", "9", "Snack", { visible: false })], /fields a slot cannot keep: visible/);
  stops([...fixtures(), row("x", "Preschool", "9", " ")], /no activity name/);
  stops([...fixtures(), { _id: "school-year-lunch-2", _type: "schoolYearActivity", title: "lunch" }], /"Lunch" names 2 activities/);
  stops(
    fixtures().map((document) => (document.title === "2 Day Preschool" ? { ...document, program: "summerCamp" } : document)),
    /is not the schoolYear Program "2 Day Preschool"/,
  );
  stops(
    [...fixtures(), { _id: "odd", _type: "page", blocks: [{ ...section("s", "Preschool"), source: "facility" }] }],
    /selects the age group "Preschool" with the source "facility"/,
  );
});
