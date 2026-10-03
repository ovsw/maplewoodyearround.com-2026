import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./robots.ts", import.meta.url), "utf8");

test("robots is indexable only in production", () => {
  assert.match(source, /NEXT_PUBLIC_SITE_ENV === "production"/);
  assert.match(source, /isProduction \? \{ allow: "\/" \} : \{ disallow: "\/" \}/);
});
