#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { desiredSanityOrigins } from "./worktree-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runSanity(arguments_) {
  return spawnSync("pnpm", ["--dir", "studio", "exec", "sanity", ...arguments_], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });
}

async function existingOrigins(projectId, token) {
  const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/cors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to list CORS origins (${response.status} ${response.statusText}).`);
  }
  const entries = await response.json();
  return new Map(
    entries
      .filter((entry) => !entry.deletedAt)
      .map((entry) => [entry.origin, Boolean(entry.allowCredentials)]),
  );
}

function addOrigin(projectId, entry) {
  const add = runSanity([
    "cors",
    "add",
    entry.origin,
    "--project-id",
    projectId,
    entry.credentials ? "--credentials" : "--no-credentials",
  ]);
  if (add.error) throw add.error;
  if (add.status !== 0) process.exit(add.status ?? 1);
}

function deleteOrigin(projectId, origin) {
  const remove = runSanity(["cors", "delete", origin, "--project-id", projectId]);
  if (remove.error) throw remove.error;
  if (remove.status !== 0) process.exit(remove.status ?? 1);
}

async function main() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
  if (!projectId) throw new Error("Missing SANITY_STUDIO_PROJECT_ID in studio/.env.local.");
  const token = process.env.SANITY_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error(
      `Missing SANITY_AUTH_TOKEN in studio/.env.local. Create a project token at https://www.sanity.io/manage/project/${projectId}/api#tokens and add it there.`,
    );
  }

  const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL?.trim();
  if (!previewUrl) {
    throw new Error("Missing SANITY_STUDIO_PREVIEW_URL in studio/.env.production.");
  }
  const productionOrigin = new URL(previewUrl).origin;
  const desired = desiredSanityOrigins({ productionOrigin });
  console.log(`Sanity project: ${projectId}`);
  console.log("Desired origins (credentials enabled for Website and Studio):");
  for (const entry of desired) {
    console.log(`  ${entry.origin}  credentials=${entry.credentials ? "yes" : "no"}`);
  }

  const existing = await existingOrigins(projectId, token);
  for (const [origin, credentials] of existing) {
    console.log(`  ${origin}  credentials=${credentials ? "yes" : "no"}`);
  }

  for (const entry of desired) {
    if (!existing.has(entry.origin)) {
      addOrigin(projectId, entry);
      continue;
    }
    if (existing.get(entry.origin) === entry.credentials) {
      console.log(`kept ${entry.origin}`);
      continue;
    }
    // The CLI cannot update credentials in place, so replace the origin.
    console.log(`fixing credentials for ${entry.origin}`);
    deleteOrigin(projectId, entry.origin);
    addOrigin(projectId, entry);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
