// Issue #52: each Camp group holds its own Group schedule and Welcome letter.
// The files move from the published Summer documents record onto their Camp
// groups. Then every version of Summer documents is deleted, and the page
// sections that pointed at it point at nothing. The draft is stale, so the
// run reads only the published record and discards the draft.

import { recordId, versionPrefix } from "../lib/migration.mjs";

/** The Camp group field for each Summer documents kind. */
export const FIELDS = { schedule: "groupSchedule", welcomeLetter: "welcomeLetter" };
const NAMES = { schedule: "Group schedule", welcomeLetter: "Welcome letter" };

const assetId = (file) => file?.asset?._ref;

/** Drop the Summer documents reference from every Summer document list section. */
function withoutSummerDocuments(value) {
  if (Array.isArray(value)) return value.map(withoutSummerDocuments);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !(value._type === "summerDocumentList" && key === "documents"))
      .map(([key, item]) => [key, withoutSummerDocuments(item)]),
  );
}

export default {
  description:
    "Issue #52: Group schedule and Welcome letter PDFs on each Camp group; Summer documents deleted.",

  prepare(dataset) {
    const [source, ...others] = dataset.documents.filter(
      (document) => document._type === "summerDocuments" && !versionPrefix(document._id),
    );
    if (others.length)
      throw new Error(`Expected one published Summer documents record, found ${[source, ...others].map((d) => d._id).join(", ")}`);

    // The distinct files of each kind for each Camp group, in page order. A
    // group with two grades is listed under each; its rows share one file.
    const files = new Map();
    for (const gradeGroup of source?.gradeGroups ?? [])
      for (const entry of gradeGroup.entries ?? []) {
        const groupId = entry.group?._ref;
        if (!groupId || !dataset.get(groupId))
          throw new Error(`The Summer documents row "${entry.title}" (${entry._key}) has no published Camp group`);
        if (!FIELDS[entry.kind]) throw new Error(`The Summer documents row ${entry._key} has the unknown kind "${entry.kind}"`);
        if (!assetId(entry.file)) throw new Error(`The Summer documents row ${entry._key} has no file`);
        if (!files.has(groupId)) files.set(groupId, { schedule: [], welcomeLetter: [] });
        const found = files.get(groupId)[entry.kind];
        if (!found.some((file) => assetId(file) === assetId(entry.file))) found.push(entry.file);
      }

    // A file already on the group wins; otherwise the first file in page order.
    const filesFor = (group) =>
      Object.entries(FIELDS).map(([kind, field]) => {
        const candidates = [group[field], ...(files.get(recordId(group._id))?.[kind] ?? [])].filter(assetId);
        return { kind, field, candidates: [...new Map(candidates.map((file) => [assetId(file), file])).values()] };
      });

    const report = dataset.documents
      .filter((document) => document._type === "campGroup" && !versionPrefix(document._id))
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
      .flatMap((group) =>
        filesFor(group).flatMap(({ kind, candidates }) => {
          if (!candidates.length) return [`${group.title}: no ${NAMES[kind]}`];
          if (candidates.length === 1) return [];
          return [`${group.title}: ${candidates.length} different ${NAMES[kind]} files (${candidates.map(assetId).join(", ")}); keeps ${assetId(candidates[0])}`];
        }),
      );
    dataset.note(
      report.length
        ? `Report, groups with no file or two different files of one kind:\n  ${report.join("\n  ")}`
        : "Report: every Camp group has one Group schedule and one Welcome letter.",
    );
    const drafts = dataset.documents.filter(
      (document) => document._type === "summerDocuments" && versionPrefix(document._id),
    );
    if (drafts.length) dataset.note(`Discards the unpublished Summer documents versions: ${drafts.map((d) => d._id).join(", ")}`);

    return (document) => {
      if (document._type === "summerDocuments") return null;
      if (document._type !== "campGroup") return withoutSummerDocuments(document);
      const next = { ...document };
      for (const { field, candidates } of filesFor(document)) if (candidates.length) next[field] = candidates[0];
      return next;
    };
  },
};
