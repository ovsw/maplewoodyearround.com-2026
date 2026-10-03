import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./blog-post-settings.ts", import.meta.url), "utf8");

test("blog post settings never fall back to the retired Site Settings sidebar", () => {
  assert.doesNotMatch(source, /_type == "settings"/);
  assert.doesNotMatch(source, /blogPostSidebar\./);
});
