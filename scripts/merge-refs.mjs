#!/usr/bin/env node
// Merge one or more refs into the current branch and resolve the conflicts
// that parallel Page Builder work always produces:
//
// - generated files (studio/schema.json, frontend/sanity.types.ts) are taken
//   from either side and regenerated with `pnpm typegen`;
// - registration files that grow at page-builder-generator markers are merged
//   as a union (both sides' additions kept, in order), but only where the
//   conflict sits right above a marker. That is where the generator writes.
//
// Any other conflict, including one in the hand-written part of a
// registration file, stops the run with the merge left in progress so a human
// or agent can resolve it, commit, and run the script again for the remaining
// refs.
//
// Usage:
//   node scripts/merge-refs.mjs <ref> [<ref>...]
//   pnpm sync:main            # merge origin/main after fetching

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const GENERATED_FILES = ["studio/schema.json", "frontend/sanity.types.ts"];

export const UNION_FILES = [
  "studio/schema-types.ts",
  "studio/schemas/blocks/page-builder.ts",
  "frontend/sanity/queries/page-builder.ts",
  "frontend/components/blocks/index.tsx",
];

const TYPEGEN_INPUT_PREFIXES = ["studio/schemas/", "frontend/sanity/queries/"];

async function git(cwd, args, { allowFailure = false, raw = false } = {}) {
  const tidy = (text) => (raw ? text : text.trimEnd());
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 });
    return { ok: true, code: 0, stdout: tidy(stdout) };
  } catch (error) {
    if (allowFailure) {
      return {
        ok: false,
        code: typeof error.code === "number" ? error.code : 1,
        stdout: tidy(`${error.stdout ?? ""}`),
        stderr: `${error.stderr ?? ""}`,
      };
    }
    throw error;
  }
}

async function conflictedFiles(cwd) {
  const { stdout } = await git(cwd, ["diff", "--name-only", "--diff-filter=U"]);
  return stdout ? stdout.split("\n").filter(Boolean) : [];
}

async function stagePath(cwd, stage, file) {
  // Stage 1 is the merge base, 2 is ours, 3 is theirs. A side that lacks the
  // file (added on one side only) yields an empty string. Raw, so the file's
  // own trailing whitespace survives the round trip.
  const result = await git(cwd, ["show", `:${stage}:${file}`], { allowFailure: true, raw: true });
  return result.ok ? result.stdout : "";
}

const MARKER = "page-builder-generator:";

/**
 * Resolve the conflict blocks of a `git merge-file` result as a union (ours
 * then theirs), but only when every block ends right above a generator
 * marker line. Returns null when any block sits elsewhere: that conflict is
 * in hand-written code and needs a person.
 */
export function unionAtMarkers(conflicted) {
  const lines = conflicted.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("<<<<<<< ")) {
      out.push(lines[i]);
      continue;
    }
    const ours = [];
    const theirs = [];
    let side = ours;
    let j = i + 1;
    for (; j < lines.length && !lines[j].startsWith(">>>>>>> "); j++) {
      if (lines[j].startsWith("||||||| ")) side = null; // diff3 base part
      else if (lines[j] === "=======") side = theirs;
      else if (side) side.push(lines[j]);
    }
    if (j >= lines.length) return null;
    const next = lines[j + 1];
    if (next === undefined || !next.includes(MARKER)) return null;
    out.push(...ours, ...theirs);
    i = j;
  }
  return out.join("\n");
}

export async function unionMerge(cwd, file) {
  const [base, ours, theirs] = await Promise.all(
    [1, 2, 3].map((stage) => stagePath(cwd, stage, file)),
  );
  const temporary = await Promise.all(
    [ours, base, theirs].map(async (content, index) => {
      const target = path.join(cwd, `.merge-refs-${index}.tmp`);
      await writeFile(target, content, "utf8");
      return target;
    }),
  );
  let merged;
  try {
    // merge-file exits with the number of conflicts (at most 127); anything
    // above that is a real error, and its output is not a merge result.
    const result = await git(cwd, ["merge-file", "-p", ...temporary], { allowFailure: true, raw: true });
    if (result.code > 127) {
      throw new Error(`git merge-file failed on ${file}:\n${result.stderr}`);
    }
    merged = unionAtMarkers(result.stdout);
  } finally {
    await Promise.all(
      temporary.map((target) => execFileAsync("rm", ["-f", target])),
    );
  }
  if (merged === null) return false;
  await writeFile(path.join(cwd, file), merged, "utf8");
  await git(cwd, ["add", "--", file]);
  return true;
}

function touchesTypegenInputs(files) {
  return files.some(
    (file) =>
      GENERATED_FILES.includes(file) ||
      TYPEGEN_INPUT_PREFIXES.some((prefix) => file.startsWith(prefix)),
  );
}

async function changedFilesBetween(cwd, from, to) {
  const { stdout } = await git(cwd, ["diff", "--name-only", from, to]);
  return stdout ? stdout.split("\n").filter(Boolean) : [];
}

async function regenerateTypes(cwd, typegen, reason) {
  await typegen(cwd);
  const { stdout } = await git(cwd, ["status", "--porcelain", "--", ...GENERATED_FILES]);
  if (!stdout) return false;
  await git(cwd, ["add", "--", ...GENERATED_FILES]);
  await git(cwd, [
    "commit",
    "--quiet",
    "-m",
    `chore(types): regenerate Sanity types after merging ${reason}`,
  ]);
  return true;
}

export async function mergeRef({ cwd, ref, typegen, log = () => {} }) {
  const before = (await git(cwd, ["rev-parse", "HEAD"])).stdout;
  const merge = await git(cwd, ["merge", "--no-edit", ref], { allowFailure: true });
  const report = { ref, merged: false, union: [], regenerated: false, unresolved: [] };

  if (!merge.ok) {
    const conflicts = await conflictedFiles(cwd);
    if (conflicts.length === 0) {
      throw new Error(`git merge ${ref} failed without conflicts:\n${merge.stderr}`);
    }
    report.unresolved = conflicts.filter(
      (file) => !GENERATED_FILES.includes(file) && !UNION_FILES.includes(file),
    );
    if (report.unresolved.length > 0) {
      log(`Merge of ${ref} needs a hand: ${report.unresolved.join(", ")}`);
      return report;
    }
    for (const file of conflicts) {
      if (GENERATED_FILES.includes(file)) {
        await git(cwd, ["checkout", "--theirs", "--", file]);
        await git(cwd, ["add", "--", file]);
      } else if (await unionMerge(cwd, file)) {
        report.union.push(file);
      } else {
        report.unresolved.push(file);
      }
    }
    if (report.unresolved.length > 0) {
      log(
        `Merge of ${ref} needs a hand: ${report.unresolved.join(", ")} (conflict outside a generator marker)`,
      );
      return report;
    }
    await git(cwd, ["commit", "--quiet", "--no-edit"]);
  }
  report.merged = true;

  const after = (await git(cwd, ["rev-parse", "HEAD"])).stdout;
  if (after !== before) {
    const changed = await changedFilesBetween(cwd, before, after);
    if (touchesTypegenInputs(changed) || report.union.length > 0) {
      report.regenerated = await regenerateTypes(cwd, typegen, ref);
    }
  }
  log(
    `Merged ${ref}` +
      (report.union.length ? `; union-merged ${report.union.join(", ")}` : "") +
      (report.regenerated ? "; regenerated Sanity types" : ""),
  );
  return report;
}

async function runTypegen(cwd) {
  await execFileAsync("pnpm", ["typegen"], { cwd, maxBuffer: 64 * 1024 * 1024 });
}

async function main() {
  const refs = process.argv.slice(2);
  if (refs.length === 0) {
    console.error("Usage: node scripts/merge-refs.mjs <ref> [<ref>...]");
    process.exit(1);
  }
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dirty = (await git(cwd, ["status", "--porcelain", "--untracked-files=no"])).stdout;
  if (dirty) {
    console.error("Commit or discard local changes before merging.");
    process.exit(1);
  }
  if (refs.some((ref) => ref.startsWith("origin/"))) {
    await git(cwd, ["fetch", "--quiet", "origin"]);
  }
  for (const ref of refs) {
    const report = await mergeRef({ cwd, ref, typegen: runTypegen, log: console.log });
    if (report.unresolved.length > 0) {
      console.error(
        "Resolve the files above, `git add` them, `git commit`, then run this script again for the remaining refs.",
      );
      process.exit(2);
    }
    if (report.union.length > 0) {
      console.log(
        `Review the union-merged registrations in ${report.union.join(", ")} (typecheck catches duplicates).`,
      );
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
