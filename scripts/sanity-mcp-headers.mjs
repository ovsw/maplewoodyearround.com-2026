#!/usr/bin/env node

// headersHelper for the Sanity MCP server in .mcp.json. Prints the
// Authorization header built from SANITY_AUTH_TOKEN in studio/.env.local, so
// the MCP server uses the project's API token instead of OAuth and the token
// never enters git. Claude Code runs this from the project directory on each
// connection. A worktree without its own studio/.env.local falls back to the
// main checkout's copy.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mainCheckoutRoot() {
  try {
    const commonDir = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return path.dirname(commonDir);
  } catch {
    return null;
  }
}

function readToken(root) {
  if (!root) return null;
  const file = path.join(root, "studio", ".env.local");
  if (!existsSync(file)) return null;
  const token = parseEnv(readFileSync(file, "utf8")).SANITY_AUTH_TOKEN?.trim();
  return token || null;
}

const token = readToken(repoRoot) ?? readToken(mainCheckoutRoot());
if (!token) {
  console.error("sanity-mcp-headers: no SANITY_AUTH_TOKEN in studio/.env.local (here or in the main checkout).");
  process.exit(1);
}

process.stdout.write(JSON.stringify({ Authorization: `Bearer ${token}` }));
