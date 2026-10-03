import { faqBlockTypes } from "../blocks/page-builder.ts";

function isFaqBlock(block: unknown) {
  return (
    typeof block === "object" &&
    block !== null &&
    "_type" in block &&
    typeof block._type === "string" &&
    faqBlockTypes.has(block._type)
  );
}

/** Hub and curated FAQ sections count together: one FAQ-type section per page. */
export function singleFaqBlock(blocks: readonly unknown[] | undefined) {
  const faqBlockCount = blocks?.filter(isFaqBlock).length ?? 0;

  return faqBlockCount <= 1 || "Only one FAQ section per page.";
}
