// Regenerate one page's review draft from the same source mapping used by the
// final import. SOURCE_SNAPSHOT is a private captured source file, never
// committed here. SOURCE_PAGE is the public path, such as / or /summer-camp/facilities.
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { buildPlan } from "./webflow/plan.mjs";
import { pageId } from "./webflow/pages.mjs";
import { materialize } from "./webflow/write.mjs";

const snapshotPath = process.env.SOURCE_SNAPSHOT ?? process.env.HOME_SOURCE_SNAPSHOT;
const pagePath = process.env.SOURCE_PAGE ?? "/";
if (!snapshotPath)
  throw new Error("Set SOURCE_SNAPSHOT to the private importer source snapshot");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const schema = JSON.parse(
  await readFile(new URL("../schema.json", import.meta.url), "utf8"),
);
const plan = buildPlan(snapshot, schema);
if (plan.gaps.length)
  throw new Error("Resolve source coverage gaps before preparing a page draft");
const manifest = JSON.parse(
  await readFile(
    path.join(homedir(), "backups/mdc/webflow-import/manifest.json"),
    "utf8",
  ),
);
const refs = new Map(
  plan.assets.flatMap((asset) => {
    const id = manifest.assets[asset.url]?.id;
    return id ? [[asset.token, id]] : [];
  }),
);
// The Parent dashboard route is served by its singleton.
const sourceId = pagePath === "/parent-dashboard" ? "parentDashboard" : pageId(pagePath);
const source = plan.documents.find((document) => document._id === sourceId);
if (!source) throw new Error(`The source has no page at ${pagePath}`);
const [page] = materialize([source], refs);
// Program cards list the page-authored program records; refresh their drafts
// with the page so the preview shows the same card groups as the final import.
// Summer document lists read the summer's grade groups; refresh that draft too.
// Leadership profiles read the page-authored leadership staff records.
// A staged source version is the importer's draft, so prefer it.
const supporting = (type, matches, group) =>
  (source.blocks ?? []).some((block) => block._type === type && (!group || block.profileGroup === group))
    ? plan.documents.filter(matches)
    : [];
const summerDraft = (document) =>
  plan.documents.find((draft) => draft._id === `drafts.${document._id}`) ?? document;
const documents = materialize(
  [
    ...supporting("programCards", (document) => document._id.startsWith("wf-authored-program-")),
    ...supporting("teamMembers", (document) => document._id.startsWith("wf-authored-leader-"), "leadership"),
    ...supporting("summerDocumentList", (document) => document._type === "summerDocuments" && !document._id.startsWith("drafts."))
      .map((document) => ({ ...summerDraft(document), _id: document._id })),
  ],
  refs,
);
if (JSON.stringify([page, documents]).includes("import-asset-"))
  throw new Error("Page media must already exist in Maplewood Sanity");
export default { page, documents };
