import assert from "node:assert/strict";
import test from "node:test";
import { moveReferences, planMigration, runMigration } from "./migration.mjs";

const ref = (_ref, _key = _ref) => ({ _key, _type: "reference", _ref });
const migration = (change) => ({ description: "test", prepare: () => change });
const MAPLEWOOD = { projectId: "193h5qm1", dataset: "production" };

function fakeClient(documents, config = MAPLEWOOD) {
  const calls = [];
  return {
    calls,
    config: () => config,
    fetch: async () => structuredClone(documents),
    transaction() {
      calls.push("transaction");
      throw new Error("no writes in this test");
    },
  };
}

test("a change keeps each version's state and changes both versions", () => {
  const plan = planMigration(
    migration((document) => ({ ...document, title: `${document.title}!` })),
    [
      { _id: "both", _type: "faq", _rev: "1", title: "Published" },
      { _id: "drafts.both", _type: "faq", _rev: "2", title: "Draft" },
      { _id: "drafts.draft-only", _type: "faq", _rev: "3", title: "New" },
    ],
  );
  assert.deepEqual(
    plan.changed.map(({ before, set }) => [before._id, set.title]),
    [
      ["both", "Published!"],
      ["drafts.both", "Draft!"],
      ["drafts.draft-only", "New!"],
    ],
  );
  assert.deepEqual(plan.created, []);

  assert.throws(
    () =>
      planMigration(
        migration((document) => ({ ...document, _id: "draft-only" })),
        [{ _id: "drafts.draft-only", _type: "faq" }],
      ),
    /keeps its draft or published state/,
  );
});

test("a record is deleted with all its versions or not at all", () => {
  assert.throws(
    () =>
      planMigration(migration((document) => (document._id === "old" ? null : document)), [
        { _id: "old", _type: "faq" },
        { _id: "drafts.old", _type: "faq" },
      ]),
    /only part of record old/,
  );
});

test("a delete is refused while a record still points to it", () => {
  const documents = [
    { _id: "old", _type: "programOffering" },
    { _id: "kept", _type: "programOffering" },
    { _id: "drafts.activity", _type: "activity", programs: [ref("old")] },
  ];
  assert.throws(
    () => planMigration(migration((document) => (document._id === "old" ? null : document)), documents),
    /Cannot delete old; still referenced by drafts\.activity/,
  );

  const plan = planMigration(
    migration((document) => (document._id === "old" ? null : moveReferences(document, "old", "kept"))),
    documents,
  );
  assert.deepEqual(plan.changed[0].set.programs, [ref("kept", "old")]);
  assert.deepEqual(plan.referenceChecks, [
    { id: "old", before: ['drafts.activity (activity)'], after: [] },
  ]);
});

test("a moved reference that repeats one in the same list is dropped", () => {
  assert.deepEqual(moveReferences({ programs: [ref("old"), ref("kept"), ref("other")] }, "old", "kept"), {
    programs: [ref("kept"), ref("other")],
  });
  assert.deepEqual(moveReferences({ program: ref("old") }, "old", "kept"), { program: ref("kept", "old") });
});

test("a field set to undefined is removed, and unchanged records plan nothing", () => {
  const plan = planMigration(
    migration((document) => (document._id === "a" ? { ...document, label: undefined } : document)),
    [
      { _id: "a", _type: "faq", label: "x", _rev: "1" },
      { _id: "b", _type: "faq", label: "y", _rev: "1" },
    ],
  );
  assert.deepEqual(plan.changed.map(({ before, set, unset }) => [before._id, set, unset]), [["a", {}, ["label"]]]);
});

test("a dry run lists the changes and writes nothing", async () => {
  const client = fakeClient([{ _id: "a", _type: "faq", title: "Old" }]);
  const lines = [];
  let backups = 0;
  const plan = await runMigration({
    migration: migration((document) => ({ ...document, title: "New" })),
    client,
    backup: async () => backups++,
    verifyTarget: async () => ({}),
    log: (line) => lines.push(line),
  });
  assert.equal(plan.changed.length, 1);
  assert.match(lines.join("\n"), /Change a \(faq "Old"\)\n {2}title: "Old" -> "New"/);
  assert.match(lines.at(-1), /Dry run: nothing was written/);
  assert.deepEqual(client.calls, []);
  assert.equal(backups, 0);
});

test("the runner refuses every target that is not the Maplewood project and dataset", async () => {
  for (const config of [
    { projectId: "193h5qm1", dataset: "development" },
    { projectId: "another-project", dataset: "production" },
  ])
    await assert.rejects(
      runMigration({ migration: migration((document) => document), client: fakeClient([], config), apply: true }),
      /Refusing to run against/,
    );
});

test("a failed backup stops the run before the first write", async () => {
  const client = fakeClient([{ _id: "a", _type: "faq", title: "Old" }]);
  await assert.rejects(
    runMigration({
      migration: migration((document) => ({ ...document, title: "New" })),
      client,
      apply: true,
      verifyTarget: async () => ({}),
      backup: async () => {
        throw new Error("Dataset backup failed; no writes were made");
      },
      log: () => {},
    }),
    /backup failed/,
  );
  assert.deepEqual(client.calls, []);
});

test("an applied run writes one transaction after the backup", async () => {
  const documents = [
    { _id: "a", _type: "faq", _rev: "r1", title: "Old" },
    { _id: "gone", _type: "faq" },
  ];
  const steps = [];
  const mutations = [];
  const client = {
    config: () => MAPLEWOOD,
    fetch: async () => structuredClone(documents),
    transaction() {
      steps.push("transaction");
      const transaction = {
        create: (document) => (mutations.push(["create", document]), transaction),
        patch(id, build) {
          const operations = {};
          const patch = {
            ifRevisionId: (rev) => ((operations.ifRevisionId = rev), patch),
            set: (fields) => ((operations.set = fields), patch),
            unset: (keys) => ((operations.unset = keys), patch),
          };
          build(patch);
          mutations.push(["patch", id, operations]);
          return transaction;
        },
        delete: (id) => (mutations.push(["delete", id]), transaction),
        async commit() {
          documents.splice(0, documents.length, { ...documents[0], title: "New" });
        },
      };
      return transaction;
    },
  };
  await runMigration({
    migration: migration((document) =>
      document._id === "gone" ? null : { ...document, title: "New" },
    ),
    client,
    apply: true,
    verifyTarget: async () => (steps.push("target"), {}),
    backup: async () => (steps.push("backup"), "/backups/file.tar.gz"),
    log: () => {},
  });
  assert.deepEqual(steps, ["target", "backup", "transaction"]);
  assert.deepEqual(mutations, [
    ["patch", "a", { ifRevisionId: "r1", set: { title: "New" } }],
    ["delete", "gone"],
  ]);
});
