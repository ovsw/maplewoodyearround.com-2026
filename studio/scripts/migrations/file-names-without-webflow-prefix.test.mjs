import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import migration, { withoutWebflowPrefix } from "./file-names-without-webflow-prefix.mjs";

const file = (id, originalFilename) => ({ _id: `file-${id}-pdf`, _type: "sanity.fileAsset", _rev: "r", originalFilename });

function fixtures() {
  return [
    file("a", "6a43fb2632d2033a996cbd6b_Navigators-Welcome-2026.pdf"),
    file("b", "67b42e508fe80c9438da2a88_171bc0598b4656c15a824d51ecaffd6b_Playground-Calendar-February.pdf"),
    file("c", "Already-Clean.pdf"),
    { _id: "image-d-800x600-jpg", _type: "sanity.imageAsset", originalFilename: "67a9b41444a6fef9a6314194_bob.jpeg" },
  ];
}

const name = (plan, id) => plan.changed.find(({ before }) => before._id === id)?.after.originalFilename;

test("files lose their Webflow ID and hash prefixes; images keep their names", () => {
  const plan = planMigration(migration, fixtures());
  assert.equal(name(plan, "file-a-pdf"), "Navigators-Welcome-2026.pdf");
  assert.equal(name(plan, "file-b-pdf"), "Playground-Calendar-February.pdf");
  assert.equal(name(plan, "file-c-pdf"), undefined);
  assert.equal(name(plan, "image-d-800x600-jpg"), undefined);
  assert.deepEqual([plan.created, plan.deleted], [[], []]);
  assert.deepEqual(plan.notes, ["3 files, 2 renamed."]);
});

test("a second run plans nothing", () => {
  const plan = planMigration(migration, fixtures());
  const after = fixtures().map((document) => plan.changed.find(({ before }) => before._id === document._id)?.after ?? document);
  assert.deepEqual(planMigration(migration, after).changed, []);
});

test("the run stops when two files would get the same name", () => {
  assert.throws(
    () => planMigration(migration, [...fixtures(), file("e", "6a2aa56acdf3c6ee7e19d9ee_navigators-welcome-2026.pdf")]),
    /would both be named "navigators-welcome-2026\.pdf"/,
  );
});

test("the prefix rule strips site folders, IDs and upload hashes only from the start", () => {
  assert.equal(withoutWebflowPrefix("673ebf0eedfc15a41bedc0c3/6763085f54fa6308aa7d9c7e_Hero.mp4"), "Hero.mp4");
  assert.equal(withoutWebflowPrefix("Calendar_67b42e508fe80c9438da2a88.pdf"), "Calendar_67b42e508fe80c9438da2a88.pdf");
  assert.equal(withoutWebflowPrefix("2026-calendar.pdf"), "2026-calendar.pdf");
});
