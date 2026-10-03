import assert from "node:assert/strict";
import test from "node:test";

import { singleFaqBlock } from "./single-faq-block.ts";

test("allows no FAQ sections", () => {
  assert.equal(singleFaqBlock([]), true);
});

test("allows one FAQ section", () => {
  assert.equal(singleFaqBlock([{ _type: "faqAccordion" }]), true);
});

test("rejects two FAQ sections", () => {
  assert.equal(
    singleFaqBlock([
      { _type: "faqAccordion" },
      { _type: "richTextBlock" },
      { _type: "faqAccordion" },
    ]),
    "Only one FAQ section per page.",
  );
});

test("allows one FAQ hub", () => {
  assert.equal(singleFaqBlock([{ _type: "faqHub" }]), true);
});

test("counts a hub and a curated FAQ section together", () => {
  assert.equal(
    singleFaqBlock([{ _type: "faqHub" }, { _type: "faqAccordion" }]),
    "Only one FAQ section per page.",
  );
});
