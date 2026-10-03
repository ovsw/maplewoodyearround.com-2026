import assert from "node:assert/strict";
import test from "node:test";

import { validateBlocks } from "./page-builder.ts";

test("allows one Team Members section and preserves its stable team anchor", () => {
  assert.equal(validateBlocks([{ _type: "teamMembers" }]), true);
});

test("rejects multiple Team Members sections", () => {
  assert.equal(
    validateBlocks([
      { _type: "teamMembers" },
      { _type: "richTextBlock" },
      { _type: "teamMembers" },
    ]),
    "Add no more than one Team Members section",
  );
});

test("counts the inner hero as a hero: one per page, first position", () => {
  assert.equal(
    validateBlocks([{ _type: "innerHero" }, { _type: "richTextBlock" }]),
    true,
  );
  assert.equal(
    validateBlocks([{ _type: "richTextBlock" }, { _type: "innerHero" }]),
    "The Hero section must be the first section",
  );
  assert.equal(
    validateBlocks([{ _type: "innerHero" }, { _type: "hero" }]),
    "Add no more than one Hero section",
  );
});
