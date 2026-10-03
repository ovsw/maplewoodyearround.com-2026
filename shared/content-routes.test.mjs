import assert from "node:assert/strict";
import test from "node:test";

import {
  categoryPath,
  isApplicationPath,
  isReservedPagePath,
  normalizePublicPath,
  pagePath,
  postPath,
} from "./content-routes.ts";

test("resolves every routed document type without an ending slash", () => {
  assert.equal(pagePath("/about/"), "/about");
  assert.equal(
    pagePath("/staff/available-positions/"),
    "/staff/available-positions",
  );
  assert.equal(postPath("/first-post/"), "/blog/first-post");
  assert.equal(categoryPath("/news/"), "/blog/category/news");
});

test("rejects missing and malformed routed slugs", () => {
  for (const slug of [undefined, "", "/", "Uppercase", "under_score", "two//segments", "two/Bad"]) {
    assert.equal(pagePath(slug), null, String(slug));
  }
  for (const slug of [undefined, "", "/", "two/segments", "Uppercase", "under_score"]) {
    assert.equal(postPath(slug), null, String(slug));
    assert.equal(categoryPath(slug), null, String(slug));
  }
});

test("normalizes safe internal paths and rejects unsafe values", () => {
  assert.equal(normalizePublicPath(" /old/path/ "), "/old/path");
  assert.equal(normalizePublicPath("https://example.com"), "");
  assert.equal(normalizePublicPath("/old?preview=true"), "");
  assert.equal(normalizePublicPath("/old#section"), "");
  assert.equal(normalizePublicPath("/bad\\path"), "");
});

test("recognizes application-owned routes", () => {
  for (const path of [
    "/",
    "/blog",
    "/blog/2",
    "/blog/category",
    "/blog/category/news/2",
    "/contact/thanks",
    "/api/draft-mode/enable",
    "/_next/static/file.js",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    assert.equal(isApplicationPath(path), true, path);
  }
  assert.equal(isApplicationPath("/about"), false);
  assert.equal(isApplicationPath("/blog/first-post"), false);
  assert.equal(isApplicationPath("/blog/category/news"), false);
});

test("reserves the blog namespace from editor-created pages", () => {
  assert.equal(isReservedPagePath("/blog/first-post"), true);
  assert.equal(isReservedPagePath("/staff/available-positions"), false);
});
