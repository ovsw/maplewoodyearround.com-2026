#!/usr/bin/env node

// Run shell commands at the same time and fail if any of them fails.
//
// `pnpm verify` uses this for checks that do not depend on each other. Each
// command's output is held back and printed in one block when it finishes, so
// logs from different commands never mix.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function runCommand(command, { cwd = process.cwd(), env = process.env } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, { cwd, env, shell: true, stdio: ["ignore", "pipe", "pipe"] });
    const chunks = [];
    child.stdout.on("data", (chunk) => chunks.push(chunk));
    child.stderr.on("data", (chunk) => chunks.push(chunk));
    child.on("error", (error) => chunks.push(Buffer.from(`${error.message}\n`)));
    child.on("close", (code, signal) => {
      resolve({ command, code: code ?? 1, signal, output: Buffer.concat(chunks).toString(), seconds: (Date.now() - started) / 1000 });
    });
  });
}

export async function runParallel(commands, { log = (text) => process.stdout.write(text), ...options } = {}) {
  const results = await Promise.all(
    commands.map((command) =>
      runCommand(command, options).then((result) => {
        const status = result.code === 0 ? "passed" : `failed (exit ${result.code})`;
        log(`\n=== ${command} ${status} in ${result.seconds.toFixed(1)}s\n${result.output}`);
        return result;
      }),
    ),
  );
  const failed = results.filter((result) => result.code !== 0);
  if (failed.length > 0) log(`\nFailed: ${failed.map((result) => result.command).join(", ")}\n`);
  return failed.length === 0;
}

async function main() {
  const commands = process.argv.slice(2);
  if (commands.length === 0) {
    console.error('Usage: node scripts/run-parallel.mjs "<command>" ["<command>" ...]');
    process.exit(2);
  }
  process.exitCode = (await runParallel(commands)) ? 0 : 1;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) main();
