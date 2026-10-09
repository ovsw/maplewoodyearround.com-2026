import assert from "node:assert/strict";
import test from "node:test";
import { planMigration, recordId, referencedIds } from "../lib/migration.mjs";
import migration, { schoolYearActivityId } from "./issue-51-school-year-activities.mjs";

const ref = (_ref, _key = _ref) => ({ _key, _type: "reference", _ref });

const activity = (_id, extra = {}) => ({
  _id,
  _type: "activity",
  _rev: "r1",
  program: "schoolYear",
  title: _id,
  slug: { _type: "slug", current: _id },
  programs: [ref("play-center")],
  availability: "Mo-Fri",
  location: "Indoor",
  image: { _type: "image", asset: ref("image-reptiles") },
  description: `About ${_id}`,
  playgroundLabel: "no",
  order: 2,
  visible: true,
  ...extra,
});
const program = (_id, activities, extra = {}) => ({
  _id,
  _type: "programOffering",
  program: "schoolYear",
  title: _id,
  activities: activities?.map((id) => ref(id)),
  ...extra,
});
const section = (_key, _type, source, program = "schoolYear") => ({ _key, _type, source, program });

// Today's records: Reptiles has a draft, Spidey Heroes names no Program, and
// Birthday Parties is named by Reptiles without listing it.
function fixtures() {
  return [
    activity("reptiles", { programs: [ref("play-center"), ref("birthday-parties")] }),
    activity("drafts.reptiles", { title: "Animal Program - Reptiles (edited)", programs: [ref("play-center")] }),
    activity("gym", { programs: [ref("gymnastics")], location: "Outdoor", availability: undefined, order: undefined }),
    activity("spidey-heroes", { programs: undefined, location: "Special" }),
    activity("childrens-classes", { programs: [], visible: false }),
    program("play-center", ["reptiles"]),
    program("drafts.play-center", ["reptiles"], { title: "Indoor Play Center (edited)" }),
    program("gymnastics", ["gym"]),
    program("birthday-parties"),
    program("summer", undefined, { program: "summerCamp" }),
    {
      _id: "play-page",
      _type: "page",
      blocks: [
        section("indoor", "cardSlider", "activity"),
        { ...section("all", "filterableCards", "activity"), programOffering: ref("play-center") },
        section("rooms", "cardSlider", "facility"),
      ],
    },
    { _id: "drafts.play-page", _type: "page", blocks: [section("indoor", "cardSlider", "activity")] },
    { _id: "summer-page", _type: "page", blocks: [section("events", "cardSlider", "summerActivity", "summerCamp")] },
    { _id: "slot", _type: "sampleSchedule", title: "9am", activity: "Free play" },
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

test("each activity becomes a School Year activity with the kept values, draft and published", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(created(plan, "school-year-reptiles"), {
    _id: "school-year-reptiles",
    _type: "schoolYearActivity",
    title: "reptiles",
    slug: { _type: "slug", current: "reptiles" },
    programs: [ref("play-center"), ref("birthday-parties")],
    availability: "Mo-Fri",
    location: "Indoor",
    image: { _type: "image", asset: ref("image-reptiles") },
    description: "About reptiles",
    order: 2,
    visible: true,
  });
  const draft = created(plan, "drafts.school-year-reptiles");
  assert.equal(draft.title, "Animal Program - Reptiles (edited)");
  assert.deepEqual(draft.programs, [ref("play-center")]);
  assert.deepEqual(
    plan.created.map((document) => document._id).sort(),
    [
      "drafts.school-year-reptiles",
      "school-year-childrens-classes",
      "school-year-gym",
      "school-year-reptiles",
      "school-year-spidey-heroes",
    ],
  );
  const gym = created(plan, "school-year-gym");
  assert.equal(gym.availability, undefined);
  assert.equal(gym.order, undefined);
  assert.equal(schoolYearActivityId("drafts.reptiles"), "drafts.school-year-reptiles");
});

test("activities without a Program move with an empty list and are named in the plan", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(created(plan, "school-year-spidey-heroes").programs, []);
  assert.equal(created(plan, "school-year-spidey-heroes").visible, true);
  assert.deepEqual(created(plan, "school-year-childrens-classes").programs, []);
  assert.deepEqual(plan.notes, [
    'Needs a Program: "spidey-heroes" (school-year-spidey-heroes)',
    'Needs a Program: "childrens-classes" (school-year-childrens-classes)',
  ]);
});

test("the old records are deleted after the Programs stop pointing to them", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(
    plan.deleted.map((document) => document._id).sort(),
    ["childrens-classes", "drafts.reptiles", "gym", "reptiles", "spidey-heroes"],
  );
  const check = (id) => plan.referenceChecks.find((item) => item.id === id);
  assert.deepEqual(check("reptiles").before, [
    'play-center (programOffering "play-center")',
    'drafts.play-center (programOffering "Indoor Play Center (edited)")',
  ]);
  for (const item of plan.referenceChecks) assert.deepEqual(item.after, [], item.id);
});

test("the run stops when anything else points to an old record", () => {
  const documents = [...fixtures(), { _id: "drafts.slot", _type: "sampleSchedule", link: ref("gym") }];
  assert.throws(() => planMigration(migration, documents), /Cannot delete gym; still referenced by drafts\.slot/);
});

test("Programs lose their activity lists, in drafts and published", () => {
  const plan = planMigration(migration, fixtures());
  for (const id of ["play-center", "drafts.play-center", "gymnastics"]) {
    const after = changed(plan, id);
    assert.ok(after, id);
    assert.equal(after.activities, undefined, id);
    assert.equal(after._type, "programOffering", id);
  }
  // Programs without a list do not change.
  assert.equal(changed(plan, "birthday-parties"), undefined);
  assert.equal(changed(plan, "summer"), undefined);
});

test("the run stops when a Program lists an activity that does not name it", () => {
  const documents = fixtures().map((document) =>
    document._id === "gymnastics" ? program("gymnastics", ["gym", "reptiles"]) : document,
  );
  assert.throws(() => planMigration(migration, documents), /"gymnastics" lists reptiles, which does not name it/);
});

test("list sections that showed activities select School Year activities, in drafts and published", () => {
  const plan = planMigration(migration, fixtures());
  const page = changed(plan, "play-page");
  assert.deepEqual(
    page.blocks.map((block) => block.source),
    ["schoolYearActivity", "schoolYearActivity", "facility"],
  );
  assert.deepEqual(page.blocks[1].programOffering, ref("play-center"));
  assert.equal(changed(plan, "drafts.play-page").blocks[0].source, "schoolYearActivity");
  assert.equal(changed(plan, "summer-page"), undefined);
  assert.equal(changed(plan, "slot"), undefined);
});

test("the run stops on records it cannot move without losing data", () => {
  const replace = (id, extra) =>
    fixtures().map((document) => (document._id === id ? { ...document, ...extra } : document));
  assert.throws(
    () => planMigration(migration, replace("gym", { program: "summerCamp" })),
    /"gym" is not a School Year activity/,
  );
  assert.throws(
    () => planMigration(migration, replace("gym", { playgroundLabel: "yes" })),
    /Play Center label "yes"/,
  );
  assert.throws(
    () => planMigration(migration, replace("gym", { groups: [ref("mermaids")] })),
    /fields a School Year activity cannot keep: groups/,
  );
});

test("no reference points to an old record after the run, and a second run changes nothing", () => {
  const documents = fixtures();
  const plan = planMigration(migration, documents);
  const after = applyLocally(documents, plan);
  const removed = new Set(plan.deleted.map((document) => recordId(document._id)));
  for (const document of after)
    for (const id of referencedIds(document)) assert.ok(!removed.has(recordId(id)), `${document._id} -> ${id}`);
  assert.ok(!after.some((document) => document._type === "activity"));
  assert.ok(!after.some((document) => "activities" in document && document.activities !== undefined));

  const second = planMigration(migration, after);
  assert.deepEqual([second.created, second.changed, second.deleted, second.notes], [[], [], [], []]);
});
