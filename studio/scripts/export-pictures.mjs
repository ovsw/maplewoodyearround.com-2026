#!/usr/bin/env node
// Download every picture in the Maplewood dataset into one folder, named
// with its Sanity original file name, for upload to a Raster library. The
// Raster sync then matches each description to its picture by file name.
// Reads Sanity only.
//
// Usage, from studio/:
//   node --env-file=.env.local scripts/export-pictures.mjs <folder outside the repository>
//
// The Sanity CDN serves each picture re-encoded, so a file's size can differ
// from the size Sanity stores for the upload. A file already in the folder is
// kept, so a stopped run can continue. The run fails when two pictures share
// a Raster name or when the folder holds files that are not pictures in the
// dataset.

import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";
import { assertMdcProductionTarget } from "./assert-mdc-production-target.mjs";
import { isPicture, rasterName } from "./lib/pictures.mjs";
import { request } from "./webflow/source.mjs";

const repository = path.resolve(import.meta.dirname, "../..");

export async function main(args = process.argv.slice(2)) {
  if (args.length !== 1 || args[0].startsWith("--"))
    throw new Error("Usage: export-pictures.mjs <folder outside the repository>");
  const folder = path.resolve(args[0]);
  if (folder === repository || folder.startsWith(repository + path.sep))
    throw new Error("The export folder must be outside the repository");

  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    token: process.env.SANITY_AUTH_TOKEN,
    apiVersion: "2026-03-23",
    useCdn: false,
  });
  assertMdcProductionTarget(client.config());
  const pictures = (
    await client.fetch('*[_type == "sanity.imageAsset"]{_id, _type, originalFilename, url}')
  ).filter(isPicture);

  const byName = new Map();
  for (const picture of pictures) {
    if (!picture.originalFilename || picture.originalFilename.includes("/"))
      throw new Error(`${picture._id} has no usable file name: ${picture.originalFilename}`);
    const name = rasterName(picture.originalFilename);
    if (byName.has(name))
      throw new Error(`Two pictures share the Raster name "${name}": ${byName.get(name)._id}, ${picture._id}`);
    byName.set(name, picture);
  }

  await mkdir(folder, { recursive: true });
  let downloaded = 0;
  for (const picture of pictures) {
    const file = path.join(folder, picture.originalFilename);
    if ((await stat(file).catch(() => null))?.size) continue;
    const response = await request(picture.url);
    if (!response.ok) throw new Error(`${picture.url}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!response.headers.get("content-type")?.startsWith("image/") || !bytes.length)
      throw new Error(`${picture.url}: not an image`);
    // Written under a temporary name first, so a stopped run leaves no partial file.
    await writeFile(`${file}.part`, bytes);
    await rename(`${file}.part`, file);
    if (++downloaded % 25 === 0) console.log(`Downloaded ${downloaded}`);
  }

  const expected = new Set(pictures.map((picture) => picture.originalFilename));
  const files = await readdir(folder);
  const extra = files.filter((file) => !expected.has(file));
  if (extra.length) throw new Error(`The folder holds files that are not pictures in the dataset:\n${extra.join("\n")}`);
  if (files.length !== pictures.length)
    throw new Error(`The folder holds ${files.length} files for ${pictures.length} pictures`);
  console.log(`${files.length} files for ${pictures.length} pictures in ${folder} (${downloaded} downloaded now).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
