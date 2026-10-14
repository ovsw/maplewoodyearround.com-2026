import assert from "node:assert/strict";
import test from "node:test";
import { isEmpty, planMigration } from "../lib/migration.mjs";
import migration, { SEO_FIXES } from "./issue-38-post-seo.mjs";

const [membershipsId, halloweenId] = Object.keys(SEO_FIXES);
const published = (id, extra = {}) => {
  const fix = SEO_FIXES[id.replace(/^drafts\./, "")];
  return {
    _id: id,
    _type: "post",
    _rev: `r-${id}`,
    _createdAt: "2025-01-01T00:00:00Z",
    _updatedAt: "2025-01-01T00:00:00Z",
    title: fix.title,
    slug: { _type: "slug", current: id },
    body: [{ _key: "b1", _type: "block", children: [{ _key: "s1", _type: "span", marks: [], text: "Body" }] }],
    meta: { ...fix.from },
    ...extra,
  };
};

const documents = [
  published(membershipsId),
  published(halloweenId),
  { _id: "other-post", _type: "post", _rev: "r-other", title: "Other", meta: { title: "Play Center" } },
];

const plan = planMigration(migration, documents);

test("each post gets a draft with the proposed SEO values; published posts do not change", () => {
  assert.deepEqual(plan.changed, []);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(plan.created.map((document) => document._id).sort(), [`drafts.${halloweenId}`, `drafts.${membershipsId}`].sort());
  for (const draft of plan.created) {
    const id = draft._id.slice("drafts.".length);
    assert.deepEqual(draft.meta, SEO_FIXES[id].to);
    assert.equal(draft.title, SEO_FIXES[id].title, "the draft keeps the post content");
    assert.deepEqual(draft.body, documents.find((document) => document._id === id).body);
    assert.equal(draft._rev, undefined);
  }
});

test("an existing draft with the Airtable values changes; an edited one is left alone", () => {
  const drafts = [
    published(`drafts.${membershipsId}`, { body: [] }),
    published(`drafts.${halloweenId}`, { meta: { title: "Edited" } }),
  ];
  const result = planMigration(migration, [...documents, ...drafts]);
  assert.deepEqual(result.created, []);
  assert.deepEqual(result.changed.map((change) => change.before._id), [`drafts.${membershipsId}`]);
  assert.deepEqual(result.changed[0].after.meta, SEO_FIXES[membershipsId].to);
  assert.deepEqual(result.changed[0].after.body, [], "the draft keeps its own edits");
  assert.match(result.notes.join("\n"), /Left alone/);
});

test("a different post under a known id stops the run", () => {
  assert.throws(
    () => planMigration(migration, [published(membershipsId, { title: "Renamed" }), published(halloweenId)]),
    /is not the published post/,
  );
});

test("a second run changes nothing", () => {
  assert.ok(isEmpty(planMigration(migration, [...documents, ...plan.created])));
});
