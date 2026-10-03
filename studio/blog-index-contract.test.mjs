import assert from "node:assert/strict";
import test from "node:test";

import {
  blocksField,
  blogIndexBlocksField,
  blogIndexPageBuilderBlockTypes,
  validateBlogIndexBlocks,
  homePageBlocksField,
  homePagePageBuilderBlockTypes,
  getPageBuilderPreviewImageUrl,
  pageBuilderBlockTypes,
} from "./schemas/blocks/page-builder.ts";
import {
  singletonDocumentActions,
  singletonDocumentTypes,
} from "./singletons.ts";

test("the shared blocks field exactly matches its authoritative inventory", () => {
  assert.deepEqual(
    blocksField.of.filter(({ hidden }) => !hidden).map(({ type }) => type),
    [...pageBuilderBlockTypes],
  );
  assert.equal(
    blocksField.of.some(({ hidden }) => hidden),
    false,
  );
  assert.equal(
    new Set(pageBuilderBlockTypes).size,
    pageBuilderBlockTypes.length,
  );
});

test("the homepage alone offers the homepage hero", () => {
  assert.deepEqual(
    homePageBlocksField.of
      .filter(({ hidden }) => !hidden)
      .map(({ type }) => type),
    [...homePagePageBuilderBlockTypes],
  );
  assert.equal(homePagePageBuilderBlockTypes.includes("homeHero"), true);
  assert.equal(pageBuilderBlockTypes.includes("homeHero"), false);
});

test("the blocks insert menu uses a list until site previews are supplied", () => {
  assert.deepEqual(
    blocksField.options.insertMenu.views.map(({ name }) => name),
    ["list"],
  );
  assert.equal(getPageBuilderPreviewImageUrl("featureCards"), undefined);
});

test("blogIndex uses the singleton configuration", () => {
  assert.deepEqual(
    blogIndexBlocksField.of
      .filter(({ hidden }) => !hidden)
      .map(({ type }) => type),
    [...blogIndexPageBuilderBlockTypes],
  );
  assert.equal(blogIndexPageBuilderBlockTypes.includes("innerHero"), true);
  assert.equal(blogIndexPageBuilderBlockTypes.includes("homeHero"), false);
  assert.equal(blogIndexPageBuilderBlockTypes.includes("faqHub"), false);
  assert.equal(singletonDocumentTypes.has("blogIndex"), true);
  assert.equal(singletonDocumentActions.has("duplicate"), false);
  assert.equal(singletonDocumentActions.has("delete"), false);
});

test("the blog index needs exactly one Latest Posts section", () => {
  const hero = { _type: "innerHero" };
  const listing = { _type: "latestArticles", background: "white" };
  assert.equal(validateBlogIndexBlocks([hero, listing]), true);
  assert.match(String(validateBlogIndexBlocks([hero])), /Latest Posts/);
  assert.match(
    String(validateBlogIndexBlocks([hero, listing, listing])),
    /Latest Posts/,
  );
  assert.match(
    String(validateBlogIndexBlocks([listing, hero])),
    /Hero section must be the first/,
  );
});
