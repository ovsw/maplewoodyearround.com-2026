// The checks every write to the Maplewood dataset runs first: the target is
// the Maplewood project and dataset, and a verified backup exists.

import { spawnSync } from "node:child_process";
import { chmod, mkdir } from "node:fs/promises";
import path from "node:path";
import { assertMdcProductionTarget } from "../assert-mdc-production-target.mjs";

export async function verifyTarget(client) {
  assertMdcProductionTarget(client.config());
  const project = await client.projects.getById("193h5qm1");
  if (project.displayName !== "maplewoodyearround.com-2026")
    throw new Error("The target project name does not match Maplewood");
  const datasets = await client.datasets.list();
  if (!datasets.some((dataset) => dataset.name === "production"))
    throw new Error("Maplewood production dataset is missing");
  return { projectId: project.id, name: project.displayName, dataset: "production" };
}

/**
 * Export the production dataset as a raw backup to a timestamped file in
 * `root`, and check it with `gzip -t`. A raw export holds every document,
 * with its image and file references, but not the asset files: they stay in
 * Sanity. (`--no-assets` would strip the references.) Throws, before any
 * write, when a step fails or when `root` is inside the repository.
 */
export async function backupDataset({ studioDirectory, token, root, label, run = spawnSync }) {
  const repository = path.resolve(studioDirectory, "..");
  const target = path.resolve(root);
  if (target === repository || target.startsWith(repository + path.sep))
    throw new Error("Dataset backups must stay outside the repository");
  await mkdir(target, { recursive: true, mode: 0o700 });
  const filename = path.join(target, `${new Date().toISOString().replaceAll(":", "-")}-${label}.tar.gz`);
  const env = { ...process.env, SANITY_AUTH_TOKEN: token };
  const exported = run("pnpm", ["exec", "sanity", "dataset", "export", "production", filename, "--raw"], {
    cwd: studioDirectory,
    env,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (exported.status !== 0) throw new Error("Dataset backup failed; no writes were made");
  const verified = run("gzip", ["-t", filename], { encoding: "utf8" });
  if (verified.status !== 0) throw new Error("Dataset backup gzip verification failed; no writes were made");
  await chmod(filename, 0o600);
  return filename;
}
