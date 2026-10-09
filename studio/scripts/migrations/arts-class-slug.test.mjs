import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import migration, { ARTS_CLASS } from "./arts-class-slug.mjs";

const category = (_id, slug, title = "Arts Class") => ({
  _id,
  _type: "faqCategory",
  title,
  slug: { _type: "slug", current: slug },
});

test("the Arts Class category gets the URL name arts-class in every version", () => {
  const plan = planMigration(migration, [
    category(ARTS_CLASS, "arts-class-16799"),
    category(`drafts.${ARTS_CLASS}`, "arts-class-16799"),
    category("other", "sports-class", "Sports Class"),
  ]);
  assert.deepEqual(
    plan.changed.map(({ before, after }) => [before._id, after.slug.current]),
    [
      [ARTS_CLASS, "arts-class"],
      [`drafts.${ARTS_CLASS}`, "arts-class"],
    ],
  );
});

test("the run stops when another category already uses arts-class", () => {
  assert.throws(
    () => planMigration(migration, [category(ARTS_CLASS, "arts-class-16799"), category("other", "arts-class")]),
    /taken by other/,
  );
});
