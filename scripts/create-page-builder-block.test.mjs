import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const registrations = [
  "studio/schemas/blocks/page-builder.ts", "studio/schema-types.ts",
  "frontend/sanity/queries/page-builder.ts", "frontend/components/blocks/index.tsx",
];
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "block-generator-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of ["scripts/create-page-builder-block.mjs", ...registrations]) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    copyFileSync(new URL(`../${file}`, import.meta.url), path.join(root, file));
  }
  execFileSync("git", ["init", "--quiet", root]);
  return root;
}
function run(root, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "scripts/create-page-builder-block.mjs"), ...args], { cwd: root });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => stdout += chunk);
    child.stderr.on("data", (chunk) => stderr += chunk);
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("keeps equals signs in inline titles and preview paths", async (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, "preview=one.jpg"), "image-fixture");
  const result = await run(root, ["sampleBlock", "--title=Rock=Roll", "--preview=preview=one.jpg"]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(readFileSync(path.join(root, "studio/schemas/blocks/sample-block.ts"), "utf8"), /title: "Rock=Roll"/);
  assert.equal(readFileSync(path.join(root, "studio/static/images/preview/sampleBlock.jpg"), "utf8"), "image-fixture");
});

test("rejects reserved generated bindings without changing registrations", async (t) => {
  const root = fixture(t);
  const before = registrations.map((file) => readFileSync(path.join(root, file), "utf8"));
  for (const name of ["default", "class", "await", "interface", "eval"]) {
    const result = await run(root, [name]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /reserved identifier/);
    assert.equal(existsSync(path.join(root, `studio/schemas/blocks/${name}.ts`)), false);
  }
  assert.deepEqual(registrations.map((file) => readFileSync(path.join(root, file), "utf8")), before);
});

test("concurrent generators never lose successful registrations", async (t) => {
  const root = fixture(t);
  const names = ["firstBlock", "secondBlock", "thirdBlock", "fourthBlock"];
  const results = await Promise.all(names.map((name) => run(root, [name])));
  assert.ok(results.some((result) => result.code === 0));
  for (let i = 0; i < results.length; i++) {
    if (results[i].code !== 0) {
      assert.match(results[i].stderr, /Another block generator holds/);
      assert.equal((await run(root, [names[i]])).code, 0);
    }
  }
  for (const file of registrations) {
    const source = readFileSync(path.join(root, file), "utf8");
    for (const name of names) assert.ok(source.includes(name), `${file} lost ${name}`);
  }
  assert.equal(existsSync(path.join(root, ".git/page-builder-generator.lock")), false);
});

test("a held registration lock blocks generation before any files change", async (t) => {
  const root = fixture(t);
  const before = registrations.map((file) => readFileSync(path.join(root, file), "utf8"));
  const lock = path.join(root, ".git/page-builder-generator.lock");
  mkdirSync(lock);
  const result = await run(root, ["lockedBlock"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Another block generator holds/);
  assert.equal(existsSync(lock), true);
  assert.equal(existsSync(path.join(root, "studio/schemas/blocks/locked-block.ts")), false);
  assert.deepEqual(registrations.map((file) => readFileSync(path.join(root, file), "utf8")), before);
});
