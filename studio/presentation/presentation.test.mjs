import assert from "node:assert/strict";
import test from "node:test";
import {
  getDocumentSlug,
  getPresentationPath,
  isPresentationDocumentType,
  resolveCategoryPath,
  resolveContentPath,
} from "./routes.ts";
import { resolve } from "./resolve.ts";

test("does not treat an ordinary index slug as homepage identity", () => {
  assert.equal(resolveContentPath("index"), "/index");
});

test("normalizes leading and trailing slashes", () => {
  assert.equal(resolveContentPath("///method-process///"), "/method-process");
});

test("resolves a normal page slug to a canonical path", () => {
  assert.equal(getPresentationPath("page", "about"), "/about");
  assert.equal(
    getPresentationPath("page", "staff/available-positions"),
    "/staff/available-positions",
  );
});

test("resolves a normal post slug to a canonical path", () => {
  assert.equal(getPresentationPath("post", "first-post"), "/blog/first-post");
});

test("resolves a category slug under the blog category namespace", () => {
  assert.equal(
    getPresentationPath("category", "categories"),
    "/blog/category/categories",
  );
  assert.equal(resolveCategoryPath("/categories/"), "/blog/category/categories");
});

test("resolves the Blog Index singleton without an authored slug", () => {
  assert.equal(getPresentationPath("blogIndex"), "/blog");
});

test("missing and empty slugs disable Presentation navigation", () => {
  assert.equal(getPresentationPath("page", undefined), null);
  assert.equal(getPresentationPath("page", ""), null);
});

test("an existing draft is authoritative when resolving its slug", () => {
  assert.equal(
    getDocumentSlug({ slug: {} }, { slug: { current: "published-path" } }),
    undefined,
  );
  assert.equal(
    getDocumentSlug(undefined, { slug: { current: "published-path" } }),
    "published-path",
  );
});

test("unsupported document types do not expose the action", () => {
  assert.equal(isPresentationDocumentType("page"), true);
  assert.equal(isPresentationDocumentType("post"), true);
  assert.equal(isPresentationDocumentType("category"), true);
  assert.equal(isPresentationDocumentType("blogIndex"), true);
  assert.equal(isPresentationDocumentType("author"), false);
});

test("matches nested page paths when Presentation follows the preview", () => {
  assert.equal(resolve.mainDocuments.at(-1).route, "/:slug(.+)");
});
