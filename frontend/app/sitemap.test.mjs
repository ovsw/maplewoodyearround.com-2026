import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");

test("sitemap emits canonical posts and eligible category archives", () => {
  assert.match(source, /_type == "post"/);
  assert.match(source, /"\/blog\/" \+ array::join/);
  assert.match(source, /"category"/);
  assert.match(source, /"\/blog\/category\/" \+ array::join/);
  assert.match(source, /string::split\(slug\.current, "\/"\)/);
  assert.doesNotMatch(source, /slug\.current \+ "\/"/);
  assert.match(source, /isIndexableCategory\(/);
  assert.match(source, /publishedPostFilter/);
  assert.match(source, /_type == "category" => 0\.6/);
  assert.match(source, /_type == "category" => null/);
  assert.match(source, /delete sitemapEntry\.lastModified/);
});
