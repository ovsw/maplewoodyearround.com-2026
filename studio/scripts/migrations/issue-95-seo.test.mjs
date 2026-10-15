import assert from "node:assert/strict";
import test from "node:test";
import { planMigration } from "../lib/migration.mjs";
import migration, { SEO_CHANGES } from "./issue-95-seo.mjs";

const changes = Object.values(SEO_CHANGES);
const published = (id, extra = {}) => {
  const change = SEO_CHANGES[id.replace(/^drafts\./, "")];
  return {
    _id: id,
    _type: "page",
    _rev: `r-${id}`,
    _createdAt: "2025-01-01T00:00:00Z",
    _updatedAt: "2025-01-01T00:00:00Z",
    title: change.title,
    pageBuilder: [{ _key: "b1", _type: "hero", title: "Hero" }],
    meta: { ...change.from, noindex: false },
    ...extra,
  };
};
const documents = changes.map((change) => published(change.id));

test("every proposal is within the limits and differs from every other page", () => {
  const seen = new Set();
  for (const { path, to } of changes) {
    assert.ok(to.title.length <= 60, `${path}: title is ${to.title.length} characters`);
    assert.ok(to.description.length >= 120 && to.description.length <= 160, `${path}: description is ${to.description.length} characters`);
    for (const value of [to.title, to.description]) {
      assert.ok(!seen.has(value.toLowerCase()), `${path} repeats "${value}"`);
      seen.add(value.toLowerCase());
    }
  }
});

test("each page gets a draft with the proposed SEO values; published pages do not change", () => {
  const plan = planMigration(migration, documents);
  assert.deepEqual(plan.changed, []);
  assert.deepEqual(plan.deleted, []);
  assert.equal(plan.created.length, changes.length);
  for (const draft of plan.created) {
    const id = draft._id.slice("drafts.".length);
    const original = documents.find((document) => document._id === id);
    assert.deepEqual(draft.meta, { ...SEO_CHANGES[id].to, noindex: false }, "other meta fields stay");
    assert.deepEqual(draft.pageBuilder, original.pageBuilder, "the draft keeps the page content");
    assert.equal(draft._rev, undefined);
  }
});

test("an existing draft with the published values changes; an edited one is left alone", () => {
  const [first, second] = changes;
  const drafts = [
    published(`drafts.${first.id}`, { pageBuilder: [] }),
    published(`drafts.${second.id}`, { meta: { title: "Edited" } }),
  ];
  const result = planMigration(migration, [...documents, ...drafts]);
  assert.equal(result.created.length, changes.length - 2);
  assert.deepEqual(result.changed.map((change) => change.before._id), [`drafts.${first.id}`]);
  assert.deepEqual(result.changed[0].after.meta, { ...first.to, noindex: false });
  assert.deepEqual(result.changed[0].after.pageBuilder, [], "the draft keeps its own edits");
  assert.match(result.notes.join("\n"), new RegExp(`Left alone: the draft of "${second.path}"`));
});

test("a published page whose SEO values an editor changed gets no draft", () => {
  const [first] = changes;
  const edited = documents.map((document) =>
    document._id === first.id ? { ...document, meta: { title: "Editor's title" } } : document,
  );
  const result = planMigration(migration, edited);
  assert.ok(!result.created.some((document) => document._id === `drafts.${first.id}`));
  assert.match(result.notes.join("\n"), /published SEO values an editor changed/);
});

test("a different page under a known id stops the run", () => {
  const renamed = documents.map((document, index) => (index === 0 ? { ...document, title: "Renamed" } : document));
  assert.throws(() => planMigration(migration, renamed), /is not the published page/);
});

test("a second run plans no changes", () => {
  const first = planMigration(migration, documents);
  const second = planMigration(migration, [...documents, ...first.created]);
  assert.deepEqual(second.created, []);
  assert.deepEqual(second.changed, []);
});
