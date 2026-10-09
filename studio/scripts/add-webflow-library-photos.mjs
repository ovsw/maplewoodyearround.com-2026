#!/usr/bin/env node
// Issue #61: add the photos in the Webflow asset library that never reached
// Sanity, because no page or record used them. The Webflow importer does not
// run again; this script uploads only these photos, from the Webflow CDN,
// with the same Webflow source metadata the importer used.
//
// Logos, icons, favicons, placeholders, SVGs, videos and PDFs are skipped.
// A photo is in Sanity when a Sanity asset's file name or source URL holds
// its Webflow asset ID, or when an asset has the same content. Sanity keeps
// one asset per content and would rename that asset on upload, so a photo
// with the same content is listed and not uploaded.
//
// Usage, from studio/:
//   node --env-file=.env.local scripts/add-webflow-library-photos.mjs --snapshot <private source snapshot>
//   node --env-file=.env.local scripts/add-webflow-library-photos.mjs --snapshot <file> --apply
//
// The dry run writes the list of photos and skipped files to --list (default
// /storage/work/mdc-assets/missing-in-sanity.json). --apply checks the
// target, makes a verified raw backup in --backup-dir (default
// /storage/backups/maplewood), then uploads.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";
import { assertMdcProductionTarget } from "./assert-mdc-production-target.mjs";
import { backupDataset, verifyTarget } from "./lib/dataset-safety.mjs";
import { request } from "./webflow/source.mjs";
import { savePrivate } from "./webflow/write.mjs";

const studioDirectory = path.resolve(import.meta.dirname, "..");
const usage =
  "Usage: add-webflow-library-photos.mjs --snapshot <file> [--list <file>] [--apply] [--backup-dir <dir>]";
const WEBFLOW_S3 = "https://s3.amazonaws.com/webflow-prod-assets/";
const WEBFLOW_CDN = "https://cdn.prod.website-files.com/";

export function argumentsFor(args) {
  const options = {
    apply: false,
    list: "/storage/work/mdc-assets/missing-in-sanity.json",
    backupDir: "/storage/backups/maplewood",
  };
  const names = { "--snapshot": "snapshot", "--list": "list", "--backup-dir": "backupDir" };
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--apply") options.apply = true;
    else if (names[args[index]] && args[index + 1] && !args[index + 1].startsWith("--"))
      options[names[args[index]]] = path.resolve(args[++index]);
    else throw new Error(usage);
  }
  if (!options.snapshot) throw new Error(usage);
  return options;
}

/** Why a library file is not a photo for the editors, or "" when it is one. */
function skipReason(asset) {
  if (!asset.contentType?.startsWith("image/")) return asset.contentType ?? "unknown type";
  if (asset.contentType === "image/svg+xml") return "svg";
  return /logo|icon|favicon|placeholder/i.exec(asset.originalFileName)?.[0].toLowerCase() ?? "";
}

/** The library photos Sanity lacks, and the missing files that are skipped. */
export function missingLibraryPhotos(libraryAssets, sanityAssets) {
  const known = new Set(
    sanityAssets.flatMap((asset) =>
      `${asset.originalFilename ?? ""} ${asset.source?.url ?? ""}`.match(/[0-9a-f]{24}/gi) ?? [],
    ),
  );
  const missing = libraryAssets.filter((asset) => !known.has(asset.id));
  const entry = (asset) => ({
    id: asset.id,
    filename: asset.originalFileName,
    contentType: asset.contentType,
    url: new URL(asset.hostedUrl.replace(WEBFLOW_S3, WEBFLOW_CDN)).href,
  });
  return {
    photos: missing.filter((asset) => !skipReason(asset)).map(entry),
    skipped: missing.filter(skipReason).map((asset) => ({ ...entry(asset), reason: skipReason(asset) })),
  };
}

export async function main(args = process.argv.slice(2)) {
  const options = argumentsFor(args);
  const snapshot = JSON.parse(await readFile(options.snapshot, "utf8"));
  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    token: process.env.SANITY_AUTH_TOKEN,
    apiVersion: "2026-03-23",
    useCdn: false,
  });
  assertMdcProductionTarget(client.config());

  const stored = await client.fetch(
    '*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]{originalFilename, source, sha1hash}',
  );
  const { photos, skipped } = missingLibraryPhotos(snapshot.assets, stored);
  const byContent = new Map(stored.map((asset) => [asset.sha1hash, asset.originalFilename]));
  const downloads = new Map();
  for (const photo of photos) {
    const response = await request(photo.url);
    if (!response.ok) throw new Error(`${photo.url}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const sameContent = byContent.get(createHash("sha1").update(bytes).digest("hex"));
    if (sameContent) photo.sameContentAs = sameContent;
    else downloads.set(photo, { bytes, contentType: response.headers.get("content-type")?.split(";")[0] });
  }
  const alreadyStored = photos.filter((photo) => photo.sameContentAs);
  await savePrivate(options.list, { snapshot: options.snapshot, createdAt: new Date().toISOString(), photos, skipped });
  console.log(`Webflow library: ${snapshot.assets.length} files. Not in Sanity by Webflow ID: ${photos.length + skipped.length}.`);
  console.log(`Skipped ${skipped.length}:`);
  for (const file of skipped) console.log(`  ${file.reason}: ${file.filename}`);
  console.log(`Already in Sanity with the same content ${alreadyStored.length}:`);
  for (const photo of alreadyStored) console.log(`  ${photo.filename} = ${photo.sameContentAs}`);
  console.log(`Photos to add ${downloads.size}:`);
  for (const photo of downloads.keys()) console.log(`  ${photo.filename}`);
  console.log(`List written to ${options.list}`);
  if (!options.apply) {
    console.log("Dry run: nothing was written.");
    return;
  }
  if (!downloads.size) return;

  console.log(`Target: ${JSON.stringify(await verifyTarget(client))}`);
  const backup = await backupDataset({
    studioDirectory,
    token: process.env.SANITY_AUTH_TOKEN,
    root: options.backupDir,
    label: "before-webflow-library-photos",
  });
  console.log(`Verified backup: ${backup}`);
  // The importer's upload: the file name from the URL and the Webflow source.
  for (const [photo, { bytes, contentType }] of downloads)
    await client.assets.upload("image", bytes, {
      filename: photo.filename,
      contentType,
      source: { name: "Webflow", id: photo.url, url: photo.url },
    });
  console.log(`Uploaded ${downloads.size} photos.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
