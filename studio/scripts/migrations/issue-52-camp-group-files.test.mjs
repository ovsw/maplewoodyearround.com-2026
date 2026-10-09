import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import migration from "./issue-52-camp-group-files.mjs";

const ref = (_ref) => ({ _type: "reference", _ref });
const file = (asset) => ({ _type: "file", asset: ref(asset) });
const row = (group, kind, asset = `${group}-${kind}`) => ({
  _key: `${group}-${kind}-${asset}`,
  _type: "summerDocumentEntry",
  title: group,
  kind,
  group: ref(group),
  file: file(asset),
});
const both = (group) => [row(group, "schedule"), row(group, "welcomeLetter")];
const group = (_id, extra = {}) => ({ _id, _type: "campGroup", title: _id, grades: [ref("grade")], ...extra });
const listSection = (kind) => ({ _key: kind, _type: "summerDocumentList", kind, documents: ref("summer") });

// Today's records: the published Summer documents list with Chipmunks under
// two grades, its stale draft, and the two pages that point at it.
function fixtures({ rows = [...both("chipmunks"), ...both("knights")], extraGroups = [] } = {}) {
  const gradeGroups = [
    { _key: "preschool", grade: ref("preschool"), entries: both("chipmunks") },
    { _key: "kindergarten", grade: ref("kindergarten"), entries: rows },
  ];
  return [
    { _id: "summer", _type: "summerDocuments", seasonLabel: "Summer 2026", gradeGroups },
    { _id: "drafts.summer", _type: "summerDocuments", seasonLabel: "Summer 2026", gradeGroups: gradeGroups.slice(0, 1) },
    group("chipmunks"),
    group("knights"),
    ...extraGroups,
    { _id: "schedules", _type: "page", blocks: [{ _key: "hero", _type: "innerHero" }, listSection("schedule")] },
    { _id: "drafts.letters", _type: "page", blocks: [listSection("welcomeLetter")] },
  ];
}

const changed = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after;
const report = (plan) => plan.notes.find((line) => line.startsWith("Report"));

test("each Camp group gets its Group schedule and Welcome letter from the published record", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(changed(plan, "chipmunks").groupSchedule, file("chipmunks-schedule"));
  assert.deepEqual(changed(plan, "chipmunks").welcomeLetter, file("chipmunks-welcomeLetter"));
  assert.deepEqual(changed(plan, "knights").groupSchedule, file("knights-schedule"));
  assert.deepEqual(changed(plan, "knights").welcomeLetter, file("knights-welcomeLetter"));
});

test("a group listed under two grades with the same files is not reported", () => {
  const plan = planMigration(migration, fixtures());
  assert.equal(report(plan), "Report: every Camp group has one Group schedule and one Welcome letter.");
});

test("the report names groups with no file or two different files of one kind", () => {
  const plan = planMigration(
    migration,
    fixtures({
      rows: [row("chipmunks", "schedule", "other-schedule"), row("knights", "schedule")],
      extraGroups: [group("hidden", { visible: false })],
    }),
  );
  assert.equal(
    report(plan),
    [
      "Report, groups with no file or two different files of one kind:",
      "  chipmunks: 2 different Group schedule files (chipmunks-schedule, other-schedule); keeps chipmunks-schedule",
      "  hidden: no Group schedule",
      "  hidden: no Welcome letter",
      "  knights: no Welcome letter",
    ].join("\n"),
  );
  assert.deepEqual(changed(plan, "chipmunks").groupSchedule, file("chipmunks-schedule"));
  assert.equal(changed(plan, "knights").welcomeLetter, undefined);
});

test("Summer documents and its stale draft are deleted, and no section points to them", () => {
  const plan = planMigration(migration, fixtures());
  assert.deepEqual(plan.deleted.map((document) => document._id).sort(), ["drafts.summer", "summer"]);
  assert.ok(plan.notes.includes("Discards the unpublished Summer documents versions: drafts.summer"));
  assert.deepEqual(changed(plan, "schedules").blocks, [
    { _key: "hero", _type: "innerHero" },
    { _key: "schedule", _type: "summerDocumentList", kind: "schedule" },
  ]);
  assert.deepEqual(changed(plan, "drafts.letters").blocks, [
    { _key: "welcomeLetter", _type: "summerDocumentList", kind: "welcomeLetter" },
  ]);
  assert.deepEqual(plan.referenceChecks, [
    { id: "summer", before: ["schedules (page)", "drafts.letters (page)"], after: [] },
  ]);
});

test("a second run changes nothing", () => {
  const plan = planMigration(migration, fixtures());
  const after = new Map(fixtures().map((document) => [document._id, document]));
  for (const { after: document } of plan.changed) after.set(document._id, document);
  for (const document of plan.deleted) after.delete(document._id);
  const second = planMigration(migration, [...after.values()]);
  assert.deepEqual([second.created, second.changed, second.deleted], [[], [], []]);
  assert.equal(report(second), "Report: every Camp group has one Group schedule and one Welcome letter.");
});

test("the run stops when a row cannot move to a Camp group", () => {
  const orphan = { ...row("chipmunks", "schedule"), group: undefined };
  assert.throws(() => planMigration(migration, fixtures({ rows: [orphan] })), /has no published Camp group/);
  assert.throws(
    () => planMigration(migration, fixtures({ rows: [row("missing", "schedule")] })),
    /has no published Camp group/,
  );
  const twoRecords = [...fixtures(), { _id: "summer-2027", _type: "summerDocuments", gradeGroups: [] }];
  assert.throws(() => planMigration(migration, twoRecords), /Expected one published Summer documents record/);
});
