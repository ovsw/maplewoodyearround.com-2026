// Copy Raster's AI descriptions onto matching Sanity image assets.
//
// Workflow: upload the same image files to a Raster library and to the Sanity
// media library, wait for Raster to describe them, then run this script.
// See docs/agents/raster-descriptions.md.
//
// Match key: the Sanity asset `originalFilename` without its extension, compared
// case-insensitively against the Raster asset `name` (Raster strips extensions
// on upload). A stem is patched only when it is unambiguous on both sides: one
// Raster description, and one Sanity asset.
//
// `--library <id>` picks the Raster library. Without it, the library holding the
// most recently uploaded asset is used. Dry-run by default. `--apply` writes.
// Only `description` is written, and only where Sanity has none, unless
// `--overwrite` is passed.
//
//   node --env-file=.env.local scripts/sync-raster-descriptions.mjs
//   node --env-file=.env.local scripts/sync-raster-descriptions.mjs --library old --apply
import { createClient } from "@sanity/client";
import { assertMdcProductionTarget } from "./assert-mdc-production-target.mjs";

const RASTER_API_VERSION = "2026-05-20";
const PAGE_SIZE = 50;
const TRANSACTION_SIZE = 50;

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const OVERWRITE = args.includes("--overwrite");
const libraryIndex = args.indexOf("--library");
const requestedLibraryId = libraryIndex === -1 ? "" : (args[libraryIndex + 1] ?? "");
if (libraryIndex !== -1 && !requestedLibraryId) {
  throw new Error("Usage: sync-raster-descriptions.mjs [--library <raster-library-id>] [--apply] [--overwrite]");
}

for (const name of [
  "SANITY_STUDIO_PROJECT_ID",
  "SANITY_STUDIO_DATASET",
  "SANITY_AUTH_TOKEN",
  "RASTER_API_KEY",
  "RASTER_ORG_ID",
]) {
  if (!process.env[name]?.trim()) throw new Error(`Missing ${name} in studio/.env.local`);
}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID.trim();
const dataset = process.env.SANITY_STUDIO_DATASET.trim();
const rasterOrgId = process.env.RASTER_ORG_ID.trim();
const rasterApiKey = process.env.RASTER_API_KEY.trim();
assertMdcProductionTarget({ dataset, projectId });

const sanity = createClient({
  apiVersion: "2026-03-23",
  dataset,
  projectId,
  token: process.env.SANITY_AUTH_TOKEN.trim(),
  useCdn: false,
});

const rasterBase = `https://api.raster.app/organizations/${encodeURIComponent(rasterOrgId)}`;
const rasterHeaders = {
  Authorization: `Bearer ${rasterApiKey}`,
  "Api-Version": RASTER_API_VERSION,
};

async function rasterGet(path) {
  const response = await fetch(`${rasterBase}${path}`, { headers: rasterHeaders });
  if (!response.ok) throw new Error(`Raster ${response.status} ${path}: ${await response.text()}`);
  const { data } = await response.json();
  return Array.isArray(data) ? data : [];
}

async function listRasterAssets(libraryId) {
  const assets = [];
  for (let page = 1; ; page += 1) {
    const data = await rasterGet(
      `/libraries/${encodeURIComponent(libraryId)}/assets?page=${page}&pageSize=${PAGE_SIZE}`,
    );
    assets.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return assets;
}

// Libraries carry no creation date, so the default library is the one whose
// newest asset was uploaded most recently. Unlike the assets endpoint,
// `/libraries` is not paginated: it returns every library in one call, and
// returns an empty list if `page` is passed. Do not add paging here.
async function findMostRecentlyUploadedLibrary() {
  let best = null;
  for (const library of await rasterGet("/libraries")) {
    const assets = await listRasterAssets(library.id);
    const newest = Math.max(0, ...assets.map((asset) => Number(asset.created) || 0));
    if (!best || newest > best.newest) best = { id: library.id, newest, assets };
  }
  if (!best) throw new Error("No Raster libraries visible to this API key");
  return best;
}

const stem = (filename) =>
  filename
    .replace(/\.[a-z0-9]+$/i, "")
    .trim()
    .toLowerCase();

const selected = requestedLibraryId
  ? { id: requestedLibraryId, assets: await listRasterAssets(requestedLibraryId) }
  : await findMostRecentlyUploadedLibrary();
const RASTER_LIBRARY_ID = selected.id;
const rasterAssets = selected.assets;
const descriptionByStem = new Map();
const ambiguousStems = new Set();
let undescribedInRaster = 0;
for (const asset of rasterAssets) {
  const name = typeof asset.name === "string" ? stem(asset.name) : "";
  const description = typeof asset.description === "string" ? asset.description.trim() : "";
  if (!name) continue;
  if (!description) {
    undescribedInRaster += 1;
    continue;
  }
  if (descriptionByStem.has(name) && descriptionByStem.get(name) !== description) {
    ambiguousStems.add(name);
  }
  descriptionByStem.set(name, description);
}

const sanityAssets = await sanity.fetch(
  `*[_type == "sanity.imageAsset"]{_id, originalFilename, description}`,
);

// Two Sanity assets can share one stem, for example `cabin.jpg` and
// `cabin.png`. That is a one-to-many match, so the description could land on an
// unrelated image. Group first, then patch only the stems that hold one asset.
const sanityAssetsByStem = new Map();
for (const asset of sanityAssets) {
  const key = asset.originalFilename ? stem(asset.originalFilename) : "";
  if (!key) continue;
  if (!sanityAssetsByStem.has(key)) sanityAssetsByStem.set(key, []);
  sanityAssetsByStem.get(key).push(asset);
}

const patches = [];
const skippedDescribed = [];
const duplicateStems = [];
const matchedStems = new Set();
for (const [key, assets] of sanityAssetsByStem) {
  const description = ambiguousStems.has(key) ? undefined : descriptionByStem.get(key);
  if (!description) continue;
  matchedStems.add(key);
  if (assets.length > 1) {
    duplicateStems.push(`${key} (${assets.length} Sanity assets)`);
    continue;
  }
  const [asset] = assets;
  if (asset.description?.trim() && !OVERWRITE) {
    skippedDescribed.push(asset.originalFilename);
    continue;
  }
  if (asset.description?.trim() === description) continue;
  patches.push({ id: asset._id, filename: asset.originalFilename, description });
}
const unmatchedRaster = [...descriptionByStem.keys()].filter((key) => !matchedStems.has(key));

console.log(`Mode: ${APPLY ? "apply" : "dry-run"} (${projectId}/${dataset}, Raster library "${RASTER_LIBRARY_ID}"${requestedLibraryId ? "" : ", most recently uploaded"})`);
console.log(`Raster assets: ${rasterAssets.length} (${descriptionByStem.size} described, ${undescribedInRaster} still undescribed, ${ambiguousStems.size} ambiguous names skipped)`);
console.log(`Sanity image assets: ${sanityAssets.length}`);
console.log(`To patch: ${patches.length}`);
if (patches.length) console.log(patches.map((patch) => `  - ${patch.filename}`).join("\n"));
console.log(`Matched but already described (kept): ${skippedDescribed.length}`);
console.log(`Duplicate Sanity filenames skipped: ${duplicateStems.length}`);
if (duplicateStems.length) console.log(duplicateStems.map((name) => `  - ${name}`).join("\n"));
console.log(`Raster assets with no Sanity match: ${unmatchedRaster.length}`);
if (unmatchedRaster.length) console.log(unmatchedRaster.map((name) => `  - ${name}`).join("\n"));

if (!APPLY) {
  console.log("Dry run. Re-run with --apply to write.");
  process.exit(0);
}

for (let index = 0; index < patches.length; index += TRANSACTION_SIZE) {
  const transaction = patches
    .slice(index, index + TRANSACTION_SIZE)
    .reduce(
      (current, { id, description }) => current.patch(id, (patch) => patch.set({ description })),
      sanity.transaction(),
    );
  await transaction.commit({ visibility: "sync" });
  console.log(`Patched ${Math.min(index + TRANSACTION_SIZE, patches.length)}/${patches.length}`);
}
