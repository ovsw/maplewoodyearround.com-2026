import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { hashFiles, isFresh, isInput } from "./extract-schema.mjs";

test("generated Studio files are not schema inputs", () => {
  assert.equal(isInput("studio/schema.json"), false);
  assert.equal(isInput("studio/.sanity/runtime/app.js"), false);
  assert.equal(isInput("studio/dist/index.html"), false);
  assert.equal(isInput("studio/schemas/documents/page.ts"), true);
  assert.equal(isInput("shared/site.ts"), true);
  assert.equal(isInput("pnpm-lock.yaml"), true);
});

test("the input hash changes with file content, file names and deletions", () => {
  const root = mkdtempSync(path.join(tmpdir(), "extract-schema-"));
  writeFileSync(path.join(root, "a.ts"), "one");
  writeFileSync(path.join(root, "b.ts"), "two");
  const base = hashFiles(root, ["a.ts", "b.ts"]);
  assert.equal(hashFiles(root, ["b.ts", "a.ts"]), base);
  assert.notEqual(hashFiles(root, ["a.ts"]), base);
  writeFileSync(path.join(root, "b.ts"), "three");
  assert.notEqual(hashFiles(root, ["a.ts", "b.ts"]), base);
  assert.notEqual(hashFiles(root, ["a.ts", "missing.ts"]), hashFiles(root, ["a.ts"]));
});

test("the extract is skipped only when inputs and schema.json both match", () => {
  const stamp = { inputs: "in", schema: "out" };
  assert.equal(isFresh(stamp, "in", "out"), true);
  assert.equal(isFresh(stamp, "changed", "out"), false);
  assert.equal(isFresh(stamp, "in", "edited"), false);
  assert.equal(isFresh(stamp, "in", undefined), false);
  assert.equal(isFresh(stamp, undefined, "out"), false);
  assert.equal(isFresh(undefined, "in", "out"), false);
});
