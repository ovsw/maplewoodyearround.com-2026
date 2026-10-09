#!/usr/bin/env node
// Run one migration from scripts/migrations/ on the Maplewood dataset.
// Read docs/agents/sanity-cli.md first.
//
// Usage:
//   pnpm migrate <migration>                  # dry run: prints the plan, writes nothing
//   pnpm migrate <migration> --apply          # backup, then write
//   pnpm migrate <migration> --apply --backup-dir <dir>
//
// Backups go to /storage/backups/maplewood unless --backup-dir is given.
// They must stay outside the repository.

import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";
import { backupDataset, verifyTarget } from "./lib/dataset-safety.mjs";
import { runMigration } from "./lib/migration.mjs";

const studioDirectory = path.resolve(import.meta.dirname, "..");
const usage = "Usage: pnpm migrate <migration> [--apply] [--backup-dir <dir>]";

export function argumentsFor(args) {
  const options = { apply: false, backupDir: "/storage/backups/maplewood" };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--apply") options.apply = true;
    else if (argument === "--backup-dir") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(usage);
      options.backupDir = path.resolve(args[++index]);
    } else if (!argument.startsWith("--") && !options.name) options.name = argument;
    else throw new Error(usage);
  }
  if (!options.name || !/^[a-z0-9-]+$/.test(options.name)) throw new Error(usage);
  return options;
}

export async function main(args = process.argv.slice(2)) {
  const options = argumentsFor(args);
  const { default: migration } = await import(
    pathToFileURL(path.join(studioDirectory, "scripts/migrations", `${options.name}.mjs`)).href
  );
  const client = createClient({
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
    token: process.env.SANITY_AUTH_TOKEN,
    apiVersion: "2026-03-23",
    useCdn: false,
  });
  await runMigration({
    migration,
    client,
    apply: options.apply,
    verifyTarget,
    backup: () =>
      backupDataset({
        studioDirectory,
        token: process.env.SANITY_AUTH_TOKEN,
        root: options.backupDir,
        label: `before-${options.name}`,
      }),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
