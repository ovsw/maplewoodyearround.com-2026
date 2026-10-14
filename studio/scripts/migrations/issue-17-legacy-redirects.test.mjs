import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration from "./issue-17-legacy-redirects.mjs";

const playCenter = {
  _id: "wf-page-play-center",
  _type: "page",
  _rev: "r1",
  slug: { _type: "slug", current: "school-year/programs/indoor-outdoor-play-center" },
};

test("the old playground path gets a published 301 to the Play Center page", () => {
  const plan = planMigration(migration, [playCenter]);
  assert.deepEqual(plan.changed, []);
  assert.deepEqual(plan.created, [
    {
      _id: "redirect-indoor-outdoor-playground",
      _type: "redirect",
      status: "active",
      source: { _type: "slug", current: "/school-year/programs/indoor-outdoor-playground" },
      destinationReference: { _type: "reference", _ref: "wf-page-play-center" },
      permanent: "true",
    },
  ]);
  assert.ok(isEmpty(planMigration(migration, [playCenter, ...plan.created])), "a second run plans nothing");
});

test("a Redirect an editor already made for the path stays as it is", () => {
  const existing = {
    _id: "redirect-by-editor",
    _type: "redirect",
    _rev: "r1",
    source: { _type: "slug", current: "/school-year/programs/indoor-outdoor-playground" },
  };
  const plan = planMigration(migration, [playCenter, existing]);
  assert.ok(isEmpty(plan));
  assert.match(plan.notes[0], /stays as it is/);
  assert.ok(isEmpty(planMigration(migration, [existing])), "it does not need the page then");
});

test("the run stops when the Play Center page is missing", () => {
  assert.throws(() => planMigration(migration, []), /0 published pages/);
  assert.throws(
    () => planMigration(migration, [{ ...playCenter, _id: "drafts.wf-page-play-center" }]),
    /0 published pages/,
  );
});
