#!/usr/bin/env node

import { constants } from "node:fs";
import { copyFile, lstat, mkdir, readFile, realpath } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const approvedEnvPaths = ["frontend/.env.local", "studio/.env.local"];

function sourceArgument(argv) {
  if (argv.length === 0) return undefined;
  if (argv.length === 2 && argv[0] === "--source") return argv[1];
  throw new Error("Usage: pnpm setup:worktree [--source <primary-checkout>]");
}

async function primaryCheckout(explicitSource) {
  if (explicitSource) return realpath(path.resolve(explicitSource));
  const { stdout } = await execFileAsync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd: repoRoot },
  );
  const commonDirectory = await realpath(stdout.trim());
  if (path.basename(commonDirectory) !== ".git") {
    throw new Error(
      "Git's common directory does not identify one primary checkout. Pass --source explicitly.",
    );
  }
  return path.dirname(commonDirectory);
}

async function checkoutInfo(candidate, label) {
  const root = await realpath(candidate);
  const [{ stdout: topLevelOutput }, { stdout: commonDirectoryOutput }, packageSource] =
    await Promise.all([
      execFileAsync("git", ["rev-parse", "--show-toplevel"], { cwd: root }),
      execFileAsync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
        cwd: root,
      }),
      readFile(path.join(root, "package.json"), "utf8"),
    ]);
  const topLevel = await realpath(topLevelOutput.trim());
  if (topLevel !== root) throw new Error(`${label} is not a Git worktree root: ${root}`);
  const packageJson = JSON.parse(packageSource);
  if (packageJson.name !== "maplewood-year-round") {
    throw new Error(`${label} is not the Maplewood repository: ${root}`);
  }
  return {
    root,
    commonDirectory: await realpath(commonDirectoryOutput.trim()),
  };
}

export async function copyApprovedEnv({ sourceRoot, destinationRoot }) {
  const source = await realpath(sourceRoot);
  const destination = await realpath(destinationRoot);
  const plan = [];

  for (const relativePath of approvedEnvPaths) {
    const sourceFile = path.join(source, relativePath);
    const sourceStat = await lstat(sourceFile).catch((error) => {
      if (error.code === "ENOENT") {
        throw new Error(`Required source env file is missing: ${sourceFile}`);
      }
      throw error;
    });
    if (!sourceStat.isFile()) {
      throw new Error(`Required source env path is not a regular file: ${sourceFile}`);
    }
    plan.push({ sourceFile, destinationFile: path.join(destination, relativePath) });
  }

  for (const { sourceFile, destinationFile } of plan) {
    if (sourceFile === destinationFile) {
      console.log(`kept ${destinationFile} (primary checkout)`);
      continue;
    }
    await mkdir(path.dirname(destinationFile), { recursive: true });
    try {
      await copyFile(sourceFile, destinationFile, constants.COPYFILE_EXCL);
      console.log(`copied ${destinationFile}`);
    } catch (error) {
      if (error.code === "EEXIST") console.log(`kept ${destinationFile} (already exists)`);
      else throw error;
    }
  }
}

async function main() {
  const destination = await checkoutInfo(repoRoot, "Destination");
  const source = await checkoutInfo(
    await primaryCheckout(sourceArgument(process.argv.slice(2))),
    "Environment source",
  );
  if (source.commonDirectory !== destination.commonDirectory) {
    throw new Error("Environment source and destination are not worktrees of the same repository.");
  }
  console.log(`Environment source: ${source.root}`);
  await copyApprovedEnv({ sourceRoot: source.root, destinationRoot: destination.root });

  const install = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (install.error) throw install.error;
  if (install.status !== 0) process.exit(install.status ?? 1);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
