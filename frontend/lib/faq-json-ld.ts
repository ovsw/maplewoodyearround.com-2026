import { toPlainText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type {
  HOME_PAGE_QUERY_RESULT,
  PAGE_QUERY_RESULT,
} from "@/sanity.types";

type PageBuilderBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FaqAccordionBlock = Extract<
  PageBuilderBlock,
  { _type: "faqAccordion" }
>;

type FaqHubBlock = Extract<PageBuilderBlock, { _type: "faqHub" }>;

export type FaqJsonLdBlock =
  | Pick<FaqAccordionBlock, "_type" | "faqs">
  | Pick<FaqHubBlock, "_type" | "faqs">
  | Pick<Exclude<PageBuilderBlock, FaqAccordionBlock | FaqHubBlock>, "_type">;

export type FaqPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
};

export function createFaqPageJsonLd(
  blocks: readonly FaqJsonLdBlock[],
): FaqPageJsonLd | null {
  const seenFaqIds = new Set<string>();
  const mainEntity: FaqPageJsonLd["mainEntity"] = [];

  for (const block of blocks) {
    // The curated section and the hub both list FAQs; a question that
    // appears in each still enters the FAQPage once.
    if (block._type !== "faqAccordion" && block._type !== "faqHub") continue;

    for (const faq of block.faqs ?? []) {
      if (seenFaqIds.has(faq._id)) continue;

      const name = stegaClean(faq.title)?.trim();
      const text = stegaClean(toPlainText(faq.answer ?? [])).trim();
      if (!name || !text) continue;

      seenFaqIds.add(faq._id);
      mainEntity.push({
        "@type": "Question",
        name,
        acceptedAnswer: {
          "@type": "Answer",
          text,
        },
      });
    }
  }

  if (mainEntity.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

export function serializeFaqPageJsonLd(value: FaqPageJsonLd) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
