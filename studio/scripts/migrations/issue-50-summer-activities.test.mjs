import assert from "node:assert/strict";
import test from "node:test";
import { planMigration, recordId, referencedIds } from "../lib/migration.mjs";
import { SCHOOL_ORDER } from "./issue-47-grades-and-programs.mjs";
import migration, { NOT_ACTIVITIES, SCHEDULE_CATEGORY, summerActivityId } from "./issue-50-summer-activities.mjs";

const ref = (_ref, _key = _ref) => ({ _key, _type: "reference", _ref });
const [SNACK_TIME, LUNCH] = Object.keys(NOT_ACTIVITIES);
const ROUNDUP = Object.keys(NOT_ACTIVITIES).find((id) => NOT_ACTIVITIES[id] === "Roundup");

const activity = (_id, extra = {}) => ({
  _id,
  _type: "activity",
  _rev: "r1",
  program: "summerCamp",
  title: _id,
  slug: { _type: "slug", current: _id },
  category: ref("swimming"),
  image: { _type: "image", asset: ref("image-frog") },
  description: `About ${_id}`,
  gradeLabel: "3rd Grade",
  groupText: "Mermaids",
  order: 3,
  visible: true,
  ...extra,
});
const group = (_id, grades, activities) => ({
  _id,
  _type: "campGroup",
  title: _id,
  grades: grades.map((slug) => ref(`grade-${slug}`)),
  activities: activities?.map((id) => ref(id)),
});
const section = (_key, _type, program) => ({ _key, _type, source: "activity", program });

// Today's records: Frog Water Slide lists two of the four 3rd-grade groups,
// as in Maplewood, and Muppets lists Kindergarten before Preschool.
function fixtures() {
  return [
    ...SCHOOL_ORDER.map((slug, order) => ({ _id: `grade-${slug}`, _type: "grade", title: slug, slug: { current: slug }, order })),
    activity("frog", { groups: [ref("mermaids"), ref("musketeers"), ref("muppets")] }),
    activity("drafts.frog", { title: "Frog Water Slide (edited)", groups: [ref("mermaids"), ref("musketeers"), ref("muppets")] }),
    activity("archery", { category: ref("sports"), groups: [ref("knights")], order: undefined }),
    activity("free-swim", { visible: false, groupText: undefined }),
    // The first six are the rows of the Schedule category.
    ...Object.entries(NOT_ACTIVITIES).map(([id, title], index) =>
      activity(id, { title, visible: false, category: index < 6 ? ref(SCHEDULE_CATEGORY) : undefined }),
    ),
    { _id: "train-rides", _type: "activity", program: "schoolYear", title: "Train Rides", programs: [ref("play-center")] },
    group("mermaids", ["3rd-grade"], ["frog", ROUNDUP]),
    group("musketeers", ["3rd-grade"], ["frog"]),
    group("unicorns", ["3rd-grade"]),
    group("vikings", ["3rd-grade"]),
    group("muppets", ["kindergarten", "preschool"], ["frog"]),
    // Knights list Archery, but Archery does not list them.
    group("knights", ["4th-grade"], ["archery"]),
    { _id: "swimming", _type: "activityCategory", title: "Swimming", activities: [ref("frog"), ref("free-swim")] },
    { _id: SCHEDULE_CATEGORY, _type: "activityCategory", title: "Schedule", activities: [ref(SNACK_TIME), ref(LUNCH)] },
    { _id: "lunch-slot", _type: "sampleSchedule", title: "12-12:30", activity: "Lunch" },
    {
      _id: "summer-page",
      _type: "page",
      blocks: [section("slider", "cardSlider", "summerCamp"), section("list", "filterableCards", "summerCamp")],
    },
    { _id: "drafts.summer-page", _type: "page", blocks: [section("slider", "cardSlider", "summerCamp")] },
    { _id: "play-center", _type: "page", blocks: [section("indoor", "cardSlider", "schoolYear")] },
  ];
}

const created = (plan, id) => plan.created.find((document) => document._id === id);
const changed = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after;
const gradesOf = (document) => document.grades.map((grade) => grade._ref.replace("grade-", ""));

function applyLocally(documents, plan) {
  const after = new Map(documents.map((document) => [document._id, document]));
  for (const document of plan.created) after.set(document._id, document);
  for (const { after: document } of plan.changed) after.set(document._id, document);
  for (const document of plan.deleted) after.delete(document._id);
  return [...after.values()];
}

test("each Summer Camp activity becomes a Summer activity with the kept values, draft and published", () => {
  const plan = planMigration(migration, fixtures());
  const frog = created(plan, "summer-frog");
  assert.deepEqual(frog, {
    _id: "summer-frog",
    _type: "summerActivity",
    title: "frog",
    slug: { _type: "slug", current: "frog" },
    category: ref("swimming"),
    image: { _type: "image", asset: ref("image-frog") },
    description: "About frog",
    order: 3,
    visible: true,
    grades: frog.grades,
  });
  assert.equal(created(plan, "drafts.summer-frog").title, "Frog Water Slide (edited)");
  assert.deepEqual(
    plan.created.map((document) => document._id).sort(),
    ["drafts.summer-frog", "summer-archery", "summer-free-swim", "summer-frog"],
  );
  assert.equal(created(plan, "summer-archery").order, undefined);
  assert.equal(summerActivityId("drafts.frog"), "drafts.summer-frog");
});

test("a Summer activity gets the Grades of its Camp groups, in school order", () => {
  const plan = planMigration(migration, fixtures());
  // Frog Water Slide lists Mermaids and Musketeers; its 3rd Grade now covers
  // all four 3rd-grade groups.
  assert.deepEqual(gradesOf(created(plan, "summer-frog")), ["preschool", "kindergarten", "3rd-grade"]);
  assert.deepEqual(created(plan, "summer-frog").grades[0], ref("grade-preschool", "preschool"));
  // A group that lists the activity counts too.
  assert.deepEqual(gradesOf(created(plan, "summer-archery")), ["4th-grade"]);
});

test("Free Swim moves with no Grades and is named in the plan", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(created(plan, "summer-free-swim").grades, []);
  assert.equal(created(plan, "summer-free-swim").visible, false);
  assert.deepEqual(plan.notes, ['Needs Grades before it is shown: "free-swim" (summer-free-swim)']);

  const visible = fixtures().map((document) => (document._id === "free-swim" ? { ...document, visible: true } : document));
  assert.throws(() => planMigration(migration, visible), /is visible but has no Camp groups/);
});

test("schedule rows, strays, the Schedule category and the old records are deleted after a reference check", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(
    plan.deleted.map((document) => document._id).sort(),
    ["archery", "drafts.frog", "free-swim", "frog", ...Object.keys(NOT_ACTIVITIES), SCHEDULE_CATEGORY].sort(),
  );
  const check = (id) => plan.referenceChecks.find((item) => item.id === id);
  assert.deepEqual(check(ROUNDUP).before, ['mermaids (campGroup "mermaids")']);
  assert.deepEqual(check(SNACK_TIME).before, [`${SCHEDULE_CATEGORY} (activityCategory "Schedule")`]);
  assert.equal(check(SCHEDULE_CATEGORY).before.length, 6);
  for (const item of plan.referenceChecks) assert.deepEqual(item.after, [], item.id);
  // The sample schedule row stores the name as text and stays.
  assert.ok(!plan.deleted.some((document) => document._id === "lunch-slot"));
});

test("the run stops when anything else points to a record it deletes", () => {
  const documents = [...fixtures(), { _id: "drafts.slot", _type: "sampleSchedule", link: ref(LUNCH) }];
  assert.throws(() => planMigration(migration, documents), new RegExp(`Cannot delete ${LUNCH}; still referenced by drafts\\.slot`));
});

test("Camp groups and Activity categories lose their activity lists", () => {
  const plan = planMigration(migration, fixtures());
  for (const id of ["mermaids", "musketeers", "muppets", "knights", "swimming"])
    assert.equal(changed(plan, id).activities, undefined, id);
  assert.ok(!plan.changed.some(({ before }) => ["unicorns", "vikings"].includes(before._id)));
});

test("Summer Camp list sections select Summer activities in drafts and published", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(
    changed(plan, "summer-page").blocks.map((block) => block.source),
    ["summerActivity", "summerActivity"],
  );
  assert.equal(changed(plan, "drafts.summer-page").blocks[0].source, "summerActivity");
  assert.equal(changed(plan, "play-center"), undefined);

  const withoutSide = [...fixtures(), { _id: "other", _type: "page", blocks: [section("x", "cardSlider")] }];
  assert.throws(() => planMigration(migration, withoutSide), /lists activities without a side/);
});

test("no reference points to an old Summer Camp record after the run, and a second run changes nothing", () => {
  const documents = fixtures();
  const plan = planMigration(migration, documents);
  const after = applyLocally(documents, plan);
  const removed = new Set(plan.deleted.map((document) => recordId(document._id)));
  for (const document of after)
    for (const id of referencedIds(document)) assert.ok(!removed.has(recordId(id)), `${document._id} -> ${id}`);
  assert.ok(!after.some((document) => document._type === "activity" && document.program === "summerCamp"));

  const second = planMigration(migration, after);
  assert.deepEqual([second.created, second.changed, second.deleted, second.notes], [[], [], [], []]);
});

test("the run stops when a record to delete is not the expected hidden one", () => {
  const visible = fixtures().map((document) => (document._id === LUNCH ? { ...document, visible: true } : document));
  assert.throws(() => planMigration(migration, visible), /is not the hidden Summer Camp record "Lunch"/);

  const renamed = fixtures().map((document) => (document._id === SCHEDULE_CATEGORY ? { ...document, title: "Daily" } : document));
  assert.throws(() => planMigration(migration, renamed), /expected "Schedule"/);

  const extraField = fixtures().map((document) => (document._id === "frog" ? { ...document, programs: [] } : document));
  assert.throws(() => planMigration(migration, extraField), /fields a Summer activity cannot keep: programs/);
});
