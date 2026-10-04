import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { faqAnswerComponents } from "./faq-item";
import { type DataAttribute, innerCss as css, sectionBackground, SourceActions } from "./maplewood-inner";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FaqAccordionProps = Extract<PageBlock, { _type: "faqAccordion" }> & {
  dataAttribute?: DataAttribute;
};

const plain = (value: FaqAccordionProps["title"]) =>
  (value ?? [])
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .join(" ")
    .trim();

/*
 * FAQ (Webflow faq3): heading, introduction and buttons beside the selected
 * questions. Every question starts closed, as on the live site.
 */
export default function FaqAccordion({
  _key,
  actions,
  background,
  dataAttribute,
  faqs,
  subtitle,
  title,
}: FaqAccordionProps) {
  const visibleFaqs = faqs?.filter((faq) => stegaClean(faq.title)?.trim()) ?? [];
  const heading = plain(title);
  if (!heading || !visibleFaqs.length) return null;
  const headingId = `faq-accordion-${stegaClean(_key)}-title`;
  const answerComponents = faqAnswerComponents();

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
    >
      <div className={[css.container, css.faq].join(" ")}>
        <div className={css.faqIntro}>
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {heading}
          </h2>
          {stegaClean(subtitle)?.trim() ? (
            <p className={css.medium} data-sanity={dataAttribute?.("subtitle")}>
              {subtitle}
            </p>
          ) : null}
          <SourceActions actions={actions} allOutline dataAttribute={dataAttribute} />
        </div>
        <Accordion className={css.faqList} collapsible type="single">
          {visibleFaqs.map((faq) => (
            <AccordionItem className={css.faqItem} key={faq._key} value={faq._key}>
              <AccordionTrigger className={css.faqQuestion}>{faq.title}</AccordionTrigger>
              <AccordionContent className={css.faqAnswer}>
                {faq.answer?.length ? (
                  <PortableText components={answerComponents} value={faq.answer} />
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
