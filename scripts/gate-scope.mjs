#!/usr/bin/env node

// Decides whether a pull request needs the code half of the release gate.
//
// The GitHub workflow pipes the pull request's changed files into this script,
// one per line as `filename<TAB>previous_filename` (the second field is empty
// unless the file was renamed). When every path, including the old path of a
// renamed file, is documentation, the heavy jobs (typegen, types, lint, tests,
// builds, smoke) are skipped and the "Release gate" check passes on its own.
// Anything else runs the full gate, and so does an empty or incomplete list.

import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOCUMENTATION_PATTERNS = [
  /^docs\//,
  /\.md$/,
  /^\.claude\//,
  /^\.codex\//,
];

export function isDocsOnly(files) {
  const names = files.map((file) => file.trim()).filter(Boolean);
  if (names.length === 0) return false;
  return names.every(
    (name) =>
      !name.split("/").includes("..") &&
      DOCUMENTATION_PATTERNS.some((pattern) => pattern.test(name)),
  );
}

export function parseChangedFiles(input) {
  const entries = [];
  for (const line of input.split("\n")) {
    const [filename = "", previousFilename = ""] = line
      .split("\t")
      .map((field) => field.trim());
    if (!filename) continue;
    entries.push(
      previousFilename ? { filename, previousFilename } : { filename },
    );
  }
  return entries;
}

// `expectedCount` is the pull request's own changed-file count. The files
// endpoint stops at 3,000 entries, so a shorter list means files are missing.
export function decide(entries, expectedCount = entries.length) {
  if (entries.length === 0) {
    return { code: true, message: "No changed files were listed; running the code gate." };
  }
  if (!Number.isInteger(expectedCount) || expectedCount !== entries.length) {
    return {
      code: true,
      message: `The file list has ${entries.length} entries but the pull request reports ${expectedCount}; running the code gate.`,
    };
  }
  const paths = entries.flatMap((entry) =>
    entry.previousFilename ? [entry.filename, entry.previousFilename] : [entry.filename],
  );
  if (isDocsOnly(paths)) {
    return {
      code: false,
      message: `${entries.length} changed file(s) are documentation only; skipping the code gate.`,
    };
  }
  return {
    code: true,
    message: `${entries.length} changed file(s) include code; running the code gate.`,
  };
}

async function readStandardInput() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const entries = parseChangedFiles(await readStandardInput());
  const expected = process.env.EXPECTED_FILES?.trim();
  const { code, message } = decide(
    entries,
    expected === undefined || expected === "" ? entries.length : Number(expected),
  );
  console.log(message);

  const output = `code=${code}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  } else {
    process.stdout.write(output);
  }
}
