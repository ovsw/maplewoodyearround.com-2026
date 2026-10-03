import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { GENERATED_FILES, UNION_FILES, mergeRef, unionAtMarkers } from "./merge-refs.mjs";

const execFileAsync = promisify(execFile);

async function git(cwd, ...args) {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout.trim();
}

async function write(cwd, file, content) {
  await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
  await writeFile(path.join(cwd, file), content, "utf8");
}

const REGISTRY = UNION_FILES[0];
const SCHEMA = GENERATED_FILES[0];
const TYPES = GENERATED_FILES[1];

async function repoWithTwoBranches() {
  const cwd = await mkdtemp(path.join(tmpdir(), "merge-refs-test-"));
  await git(cwd, "init", "--quiet", "-b", "main");
  await git(cwd, "config", "user.email", "test@example.com");
  await git(cwd, "config", "user.name", "Test");
  await write(cwd, REGISTRY, "import a from './a';\n// page-builder-generator:block-imports\nexport const label = 'base';\n");
  await write(cwd, SCHEMA, '{"types":["a"]}\n');
  await write(cwd, TYPES, "export type A = 1;\n");
  await write(cwd, "studio/schemas/blocks/a.ts", "export default 'a';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "base");

  await git(cwd, "checkout", "--quiet", "-b", "page-b");
  await write(cwd, REGISTRY, "import a from './a';\nimport b from './b';\n// page-builder-generator:block-imports\nexport const label = 'base';\n");
  await write(cwd, SCHEMA, '{"types":["a","b"]}\n');
  await write(cwd, TYPES, "export type A = 1;\nexport type B = 2;\n");
  await write(cwd, "studio/schemas/blocks/b.ts", "export default 'b';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "add b");

  await git(cwd, "checkout", "--quiet", "main");
  await git(cwd, "checkout", "--quiet", "-b", "page-c");
  await write(cwd, REGISTRY, "import a from './a';\nimport c from './c';\n// page-builder-generator:block-imports\nexport const label = 'base';\n");
  await write(cwd, SCHEMA, '{"types":["a","c"]}\n');
  await write(cwd, TYPES, "export type A = 1;\nexport type C = 3;\n");
  await write(cwd, "studio/schemas/blocks/c.ts", "export default 'c';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "add c");
  return cwd;
}

async function fakeTypegen(cwd) {
  // Stand-in for `pnpm typegen`: derive the generated files from the schema
  // sources present after the merge.
  const { readdir } = await import("node:fs/promises");
  const blocks = (await readdir(path.join(cwd, "studio/schemas/blocks"))).sort();
  const names = blocks.map((file) => file.replace(/\.ts$/, ""));
  await write(cwd, SCHEMA, `${JSON.stringify({ types: names })}\n`);
  await write(cwd, TYPES, names.map((name) => `export type ${name.toUpperCase()} = '${name}';`).join("\n") + "\n");
}

test("generated files regenerate and marker registrations union-merge", async () => {
  const cwd = await repoWithTwoBranches();
  const report = await mergeRef({ cwd, ref: "page-b", typegen: fakeTypegen });

  assert.equal(report.merged, true);
  assert.deepEqual(report.unresolved, []);
  assert.deepEqual(report.union, [REGISTRY]);
  assert.equal(report.regenerated, true);

  const registry = await readFile(path.join(cwd, REGISTRY), "utf8");
  assert.equal(
    registry,
    "import a from './a';\nimport c from './c';\nimport b from './b';\n// page-builder-generator:block-imports\nexport const label = 'base';\n",
  );
  assert.equal(await readFile(path.join(cwd, SCHEMA), "utf8"), '{"types":["a","b","c"]}\n');
  assert.equal(await git(cwd, "status", "--porcelain"), "");
  assert.match(await git(cwd, "log", "-1", "--format=%s"), /regenerate Sanity types after merging page-b/);
});

test("a conflict outside the known files stops with the merge in progress", async () => {
  const cwd = await repoWithTwoBranches();
  await write(cwd, "frontend/components/blocks/story.tsx", "export const story = 'c';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "story on c");
  await git(cwd, "checkout", "--quiet", "page-b");
  await write(cwd, "frontend/components/blocks/story.tsx", "export const story = 'b';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "story on b");
  await git(cwd, "checkout", "--quiet", "page-c");

  const report = await mergeRef({ cwd, ref: "page-b", typegen: fakeTypegen });

  assert.equal(report.merged, false);
  assert.deepEqual(report.unresolved, ["frontend/components/blocks/story.tsx"]);
  const unmerged = await git(cwd, "diff", "--name-only", "--diff-filter=U");
  assert.ok(unmerged.includes("story.tsx"), "merge is left in progress for a human");
});

test("a conflict in the hand-written part of a registration file stays unresolved", async () => {
  const cwd = await repoWithTwoBranches();
  // page-c (current) and page-b both add an import at the marker, and both
  // rewrite the hand-written line below it in different ways.
  await write(cwd, REGISTRY, "import a from './a';\nimport c from './c';\n// page-builder-generator:block-imports\nexport const label = 'c';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "label on c");
  await git(cwd, "checkout", "--quiet", "page-b");
  await write(cwd, REGISTRY, "import a from './a';\nimport b from './b';\n// page-builder-generator:block-imports\nexport const label = 'b';\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "label on b");
  await git(cwd, "checkout", "--quiet", "page-c");

  const report = await mergeRef({ cwd, ref: "page-b", typegen: fakeTypegen });

  assert.equal(report.merged, false);
  assert.deepEqual(report.union, []);
  assert.deepEqual(report.unresolved, [REGISTRY]);
  const unmerged = await git(cwd, "diff", "--name-only", "--diff-filter=U");
  assert.ok(unmerged.includes(REGISTRY), "merge is left in progress, nothing committed");
  const registry = await readFile(path.join(cwd, REGISTRY), "utf8");
  assert.match(registry, /<<<<<<< /, "git's conflict markers are still in the file");
});

test("unionAtMarkers keeps both sides only above a marker", () => {
  const atMarker = "<<<<<<< ours\nimport c;\n=======\nimport b;\n>>>>>>> theirs\n// page-builder-generator:x\n";
  assert.equal(unionAtMarkers(atMarker), "import c;\nimport b;\n// page-builder-generator:x\n");
  const elsewhere = "// page-builder-generator:x\n<<<<<<< ours\nc\n=======\nb\n>>>>>>> theirs\n";
  assert.equal(unionAtMarkers(elsewhere), null);
  const diff3 = "<<<<<<< ours\nc\n||||||| base\n=======\nb\n>>>>>>> theirs\n// page-builder-generator:x\n";
  assert.equal(unionAtMarkers(diff3), "c\nb\n// page-builder-generator:x\n");
});

test("a clean merge that touches schema sources still regenerates types", async () => {
  const cwd = await repoWithTwoBranches();
  await git(cwd, "checkout", "--quiet", "main");
  await git(cwd, "checkout", "--quiet", "-b", "content-only");
  await write(cwd, "docs/note.md", "hello\n");
  await git(cwd, "add", ".");
  await git(cwd, "commit", "--quiet", "-m", "note");

  const report = await mergeRef({ cwd, ref: "page-b", typegen: fakeTypegen });

  assert.equal(report.merged, true);
  assert.deepEqual(report.union, []);
  assert.equal(report.regenerated, true);
  assert.equal(await readFile(path.join(cwd, SCHEMA), "utf8"), '{"types":["a","b"]}\n');
});
