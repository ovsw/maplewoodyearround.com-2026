import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import migration, {
  AGE_PROGRAMS,
  EMPTY_ARTS_CLASS,
  KEPT_BIRTHDAY,
  MERGED_BIRTHDAY,
  SCHOOL_ORDER,
} from "./issue-47-grades-and-programs.mjs";

const ref = (_ref, _key = _ref) => ({ _key, _type: "reference", _ref });
const [PRESCHOOL_KINDERGARTEN, K_TO_7, TEEN_LEADERSHIP] = Object.keys(AGE_PROGRAMS);

// Today's records: Grades stored out of school order, Age programs with a
// draft and a published version, and the two duplicates.
function fixtures() {
  const grades = [...SCHOOL_ORDER].reverse().map((slug) => ({
    _id: `grade-${slug}`,
    _type: "grade",
    title: slug,
    slug: { current: slug },
  }));
  const ageProgram = (id) => ({ _id: id, _type: "programOffering", title: AGE_PROGRAMS[id].title });
  const program = (id, title) => ({ _id: id, _type: "programOffering", title });
  return [
    ...grades,
    ...Object.keys(AGE_PROGRAMS).flatMap((id) => [ageProgram(id), { ...ageProgram(id), _id: `drafts.${id}` }]),
    program(KEPT_BIRTHDAY, "Birthday Party Exclusive"),
    program(MERGED_BIRTHDAY, "Birthday Party Exclusive"),
    program("birthday-parties", "Birthday Parties"),
    { _id: "train-rides", _type: "activity", programs: [ref("birthday-parties"), ref(MERGED_BIRTHDAY)] },
    { _id: "party-room", _type: "activity", programs: [ref(KEPT_BIRTHDAY)] },
    { _id: "kept-arts", _type: "faqCategory", title: "Arts Class" },
    { _id: EMPTY_ARTS_CLASS, _type: "faqCategory", title: "Arts Class" },
    { _id: "faq", _type: "faq", categories: [ref("kept-arts")] },
  ];
}

const changed = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after;
const gradeSlugs = (document) => document.grades.map((grade) => grade._ref.replace("grade-", ""));

test("Grades get their school order: Preschool first, 9th Grade last", () => {
  const plan = planMigration(migration, fixtures());
  const ordered = plan.changed
    .filter(({ after }) => after._type === "grade")
    .map(({ after }) => after)
    .sort((a, b) => a.order - b.order)
    .map((grade) => grade.slug.current);
  assert.deepEqual(ordered, SCHOOL_ORDER);
  assert.equal(changed(plan, "grade-preschool").order, 0);
  assert.equal(changed(plan, "grade-9th-grade").order, 10);
});

test("the three summer Age programs get their Grades in draft and published", () => {
  const plan = planMigration(migration, fixtures());
  for (const id of [PRESCHOOL_KINDERGARTEN, `drafts.${PRESCHOOL_KINDERGARTEN}`])
    assert.deepEqual(gradeSlugs(changed(plan, id)), ["preschool", "kindergarten"]);
  for (const id of [K_TO_7, `drafts.${K_TO_7}`])
    assert.deepEqual(gradeSlugs(changed(plan, id)), [
      "kindergarten",
      "1st-grade",
      "2nd-grade",
      "3rd-grade",
      "4th-grade",
      "5th-grade",
      "6th-grade",
      "7th-grade",
    ]);
  for (const id of [TEEN_LEADERSHIP, `drafts.${TEEN_LEADERSHIP}`])
    assert.deepEqual(gradeSlugs(changed(plan, id)), ["8th-grade", "9th-grade"]);
  assert.equal(plan.created.length, 0);
});

test("references move to the kept Birthday Party Exclusive before the duplicates are deleted", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(changed(plan, "train-rides").programs, [
    ref("birthday-parties"),
    ref(KEPT_BIRTHDAY, MERGED_BIRTHDAY),
  ]);
  assert.equal(changed(plan, "party-room"), undefined);
  assert.deepEqual(plan.deleted.map((document) => document._id).sort(), [EMPTY_ARTS_CLASS, MERGED_BIRTHDAY].sort());
  assert.deepEqual(plan.referenceChecks, [
    { id: MERGED_BIRTHDAY, before: ["train-rides (activity)"], after: [] },
    { id: EMPTY_ARTS_CLASS, before: [], after: [] },
  ]);
});

test("the Arts Class delete stops when a record points to the empty category", () => {
  const documents = [
    ...fixtures(),
    { _id: "drafts.new-faq", _type: "faq", categories: [ref(EMPTY_ARTS_CLASS)] },
  ];
  assert.throws(
    () => planMigration(migration, documents),
    new RegExp(`Cannot delete ${EMPTY_ARTS_CLASS}; still referenced by drafts\\.new-faq`),
  );
});

test("a second run changes nothing", () => {
  const plan = planMigration(migration, fixtures());
  const after = new Map(fixtures().map((document) => [document._id, document]));
  for (const { after: document } of plan.changed) after.set(document._id, document);
  for (const document of plan.deleted) after.delete(document._id);
  const second = planMigration(migration, [...after.values()]);
  assert.deepEqual([second.created, second.changed, second.deleted], [[], [], []]);
});

test("the run stops when today's records are not what it expects", () => {
  const withoutGrade = fixtures().filter((document) => document._id !== "grade-5th-grade");
  assert.throws(() => planMigration(migration, withoutGrade), /Expected one published Grade/);

  const renamed = fixtures().map((document) =>
    document._id === MERGED_BIRTHDAY ? { ...document, title: "Birthday Parties" } : document,
  );
  assert.throws(() => planMigration(migration, renamed), /expected "Birthday Party Exclusive"/);

  const withoutKept = fixtures().filter((document) => document._id !== KEPT_BIRTHDAY);
  assert.throws(() => planMigration(migration, withoutKept), /kept Birthday Party Exclusive/);
});
