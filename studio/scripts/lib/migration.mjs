// The migration runner. A migration changes stored content as a transform
// from today's records to the new records, so it can be tested on fixtures.
//
// A migration module default-exports:
//   {
//     description: "One line that says what the run changes.",
//     // Reads today's records once and throws when they are not what the
//     // change expects. Returns the change for one stored version.
//     prepare(dataset) {
//       return (document) => document;
//     },
//   }
//
// The change runs on every stored version: the published document and its
// draft each get their own call, so both change. It returns the document
// (changed or not), null to delete it, or a list of documents that replace
// it, for example a record of a new type. A version keeps its state: a draft
// only becomes drafts and a published document only published documents.
// Migrations must be idempotent: a second run plans no changes.

import { isDeepStrictEqual } from "node:util";
import { assertMdcProductionTarget } from "../assert-mdc-production-target.mjs";

const SYSTEM_FIELDS = new Set(["_id", "_type", "_rev", "_createdAt", "_updatedAt"]);

/** The state part of an id: "" for published, "drafts." or "versions.<release>.". */
export function versionPrefix(id) {
  if (id.startsWith("drafts.")) return "drafts.";
  return /^versions\.[^.]+\./.exec(id)?.[0] ?? "";
}

/** The id that every version of a record shares. */
export const recordId = (id) => id.slice(versionPrefix(id).length);

/** Every id that a value references. */
export function referencedIds(value, found = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => referencedIds(item, found));
  else if (value && typeof value === "object")
    for (const [key, item] of Object.entries(value)) {
      if (key === "_ref" && typeof item === "string") found.add(item);
      else referencedIds(item, found);
    }
  return found;
}

/**
 * Point every reference to `fromId` at `toId`. In an array, a moved reference
 * that would repeat a reference to `toId` is dropped.
 */
export function moveReferences(value, fromId, toId) {
  if (Array.isArray(value)) {
    const present = new Set(value.filter((item) => item?._ref !== fromId).map((item) => item?._ref));
    return value.flatMap((item) => {
      if (item?._ref !== fromId) return [moveReferences(item, fromId, toId)];
      if (present.has(toId)) return [];
      present.add(toId);
      return [{ ...item, _ref: toId }];
    });
  }
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key === "_ref" && item === fromId ? toId : moveReferences(item, fromId, toId),
      ]),
    );
  return value;
}

const content = (document) =>
  Object.fromEntries(
    Object.entries(document).filter(([key, value]) => !SYSTEM_FIELDS.has(key) && value !== undefined),
  );

const label = (document) =>
  `${document._id} (${document._type}${document.title ? ` "${document.title}"` : ""})`;

/**
 * Plan a migration on a list of stored documents, drafts and published alike.
 * Writes nothing. Throws when the result would change a version's state,
 * delete only part of a record, or leave a reference to a deleted record.
 */
export function planMigration(migration, documents) {
  const before = new Map(documents.map((document) => [document._id, document]));
  const change = migration.prepare({ documents, get: (id) => before.get(id) });
  const after = new Map();

  for (const document of documents) {
    const result = change(structuredClone(document));
    for (const output of result == null ? [] : [result].flat()) {
      if (versionPrefix(output._id) !== versionPrefix(document._id))
        throw new Error(`${document._id} would become ${output._id}; a version keeps its draft or published state`);
      if (after.has(output._id)) throw new Error(`Two documents would have the id ${output._id}`);
      after.set(output._id, output);
    }
  }

  const created = [...after.values()].filter((document) => !before.has(document._id));
  const deleted = documents.filter((document) => !after.has(document._id));
  const changed = documents.flatMap((document) => {
    const next = after.get(document._id);
    if (!next || isDeepStrictEqual(content(document), content(next))) return [];
    if (next._type !== document._type)
      throw new Error(`${document._id} would change type; create a new record instead`);
    const set = Object.fromEntries(
      Object.entries(content(next)).filter(([key, value]) => !isDeepStrictEqual(document[key], value)),
    );
    const unset = Object.keys(content(document)).filter((key) => next[key] === undefined);
    return [{ before: document, after: next, set, unset }];
  });

  const deletedRecords = new Set(deleted.map((document) => recordId(document._id)));
  for (const id of after.keys())
    if (deletedRecords.has(recordId(id)) && before.has(id))
      throw new Error(`The run would delete only part of record ${recordId(id)}; delete its draft and published versions together`);

  const referenceChecks = [...deletedRecords].map((id) => {
    const pointing = (list) =>
      list.filter((document) => referencedIds(document).has(id)).map(label);
    return { id, before: pointing(documents), after: pointing([...after.values()]) };
  });
  const blocked = referenceChecks.filter((check) => check.after.length);
  if (blocked.length)
    throw new Error(
      blocked.map((check) => `Cannot delete ${check.id}; still referenced by ${check.after.join(", ")}`).join("\n"),
    );

  return { description: migration.description, created, changed, deleted, referenceChecks };
}

export const isEmpty = (plan) => !plan.created.length && !plan.changed.length && !plan.deleted.length;

// Shows a reference as "-> <id>" so a list of references fits on one line.
const brief = (value) => {
  const text =
    JSON.stringify(value, (key, item) => (item?._ref ? `-> ${item._ref}` : item)) ?? "(none)";
  return text.length > 400 ? `${text.slice(0, 397)}...` : text;
};

/** The plan as lines a person can check. */
export function describePlan(plan) {
  const lines = [
    plan.description,
    `Create ${plan.created.length}, change ${plan.changed.length}, delete ${plan.deleted.length} documents.`,
  ];
  for (const document of plan.created) lines.push(`Create ${label(document)}`);
  for (const { before, set, unset } of plan.changed) {
    lines.push(`Change ${label(before)}`);
    for (const [key, value] of Object.entries(set)) lines.push(`  ${key}: ${brief(before[key])} -> ${brief(value)}`);
    for (const key of unset) lines.push(`  ${key}: ${brief(before[key])} -> (removed)`);
  }
  for (const document of plan.deleted) lines.push(`Delete ${label(document)}`);
  for (const check of plan.referenceChecks) {
    lines.push(`Reference check for ${check.id}:`);
    lines.push(`  before the run: ${check.before.join(", ") || "none"}`);
    lines.push(`  after the run: ${check.after.join(", ") || "none"}`);
  }
  return lines.join("\n");
}

/** Write a plan in one transaction. A document edited since it was read stops the write. */
export function applyPlan(client, plan) {
  const transaction = client.transaction();
  for (const document of plan.created)
    transaction.create({ _id: document._id, _type: document._type, ...content(document) });
  for (const { before, set, unset } of plan.changed)
    transaction.patch(before._id, (patch) => {
      let next = patch.ifRevisionId(before._rev);
      if (Object.keys(set).length) next = next.set(set);
      if (unset.length) next = next.unset(unset);
      return next;
    });
  for (const document of plan.deleted) transaction.delete(document._id);
  return transaction.commit({ visibility: "sync" });
}

/**
 * Run a migration on the Maplewood dataset. A dry run prints the plan and
 * writes nothing. An applied run checks the target, makes a verified backup,
 * plans again on fresh records, writes, and then checks that a second run
 * would change nothing.
 */
export async function runMigration({ migration, client, apply = false, verifyTarget, backup, log = console.log }) {
  assertMdcProductionTarget(client.config());
  const load = () => client.fetch("*", {}, { perspective: "raw" });

  let plan = planMigration(migration, await load());
  log(describePlan(plan));
  if (!apply) {
    log("Dry run: nothing was written.");
    return plan;
  }
  if (isEmpty(plan)) {
    log("Nothing to change.");
    return plan;
  }

  log(`Target: ${JSON.stringify(await verifyTarget(client))}`);
  log(`Verified backup: ${await backup()}`);
  plan = planMigration(migration, await load());
  log(`Checked again after the backup:\n${describePlan(plan)}`);
  if (isEmpty(plan)) return plan;

  await applyPlan(client, plan);
  if (!isEmpty(planMigration(migration, await load())))
    throw new Error("The write finished, but a second run would still change records; check the dataset");
  log("Written. A second run would change nothing.");
  return plan;
}
