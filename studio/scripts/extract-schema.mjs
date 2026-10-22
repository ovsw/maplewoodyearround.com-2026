// Run `sanity schema extract` only when the files it reads have changed.
//
// The extract loads the whole Studio, with every plugin, and takes about 16
// seconds even when nothing changed. This script hashes the files the schema
// can read (Studio and `shared/` sources, Studio env files, the lockfile) and
// keeps `schema.json` when that hash and `schema.json` itself both match the
// last successful extract. The stamp lives in `node_modules/.cache`, so a new
// checkout or CI run always extracts. Set SCHEMA_EXTRACT_FORCE=1 to extract.
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const studioDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(studioDir, "..");
const schemaPath = path.join(studioDir, "schema.json");
const stampPath = path.join(studioDir, "node_modules", ".cache", "schema-extract.json");

// Paths under the inputs that the extract writes or that only builds touch.
const GENERATED = [/^studio\/schema\.json$/, /^studio\/\.sanity\//, /^studio\/dist\//];

export function isInput(file) {
  return !GENERATED.some((pattern) => pattern.test(file));
}

export function hashFiles(root, files) {
  const hash = createHash("sha256");
  for (const file of [...new Set(files)].sort()) {
    const full = path.join(root, file);
    hash.update(`${file}\0`);
    hash.update(existsSync(full) ? readFileSync(full) : "\0missing");
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function isFresh(stamp, inputs, schema) {
  return Boolean(stamp && inputs && schema && stamp.inputs === inputs && stamp.schema === schema);
}

function listInputs() {
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", "studio", "shared", "pnpm-lock.yaml"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  const files = listed.split("\0").filter(Boolean).filter(isInput);
  // Git ignores env files, but the Studio config reads them.
  for (const name of readdirSync(studioDir)) if (name.startsWith(".env")) files.push(`studio/${name}`);
  return files;
}

function hashOf(file) {
  return existsSync(file) ? createHash("sha256").update(readFileSync(file)).digest("hex") : undefined;
}

function readStamp() {
  try {
    return JSON.parse(readFileSync(stampPath, "utf8"));
  } catch {
    return undefined;
  }
}

function main() {
  let inputs;
  try {
    inputs = hashFiles(repoRoot, listInputs());
  } catch {
    inputs = undefined; // Without git, always extract.
  }
  if (process.env.SCHEMA_EXTRACT_FORCE !== "1" && isFresh(readStamp(), inputs, hashOf(schemaPath))) {
    console.log("Schema inputs unchanged since the last extract; kept schema.json.");
    return;
  }
  rmSync(schemaPath, { force: true });
  rmSync(stampPath, { force: true });
  const result = spawnSync("sanity", ["schema", "extract"], { cwd: studioDir, stdio: "inherit" });
  if (result.status !== 0 || !existsSync(schemaPath)) process.exit(result.status || 1);
  if (!inputs) return;
  mkdirSync(path.dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, `${JSON.stringify({ inputs, schema: hashOf(schemaPath) })}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) main();
