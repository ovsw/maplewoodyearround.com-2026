import { Accordion } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import styles from "./faq-accordion.module.css";
import { FaqAccordionItem, faqAnswerComponents, faqRuleClass } from "./faq-item";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FaqAccordionProps = Extract<PageBlock, { _type: "faqAccordion" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * FAQ accordion — intro beside the questions.
 *
 * Desktop: 0.4fr sidebar (eyebrow, headline with the script aside, intro)
 * and a 1fr accordion. Phones: intro, then accordion. A follow-up prompt
 * belongs in a CTA nudge section after this one, not inside it.
 * Cream field by default (trust content lives on cream); the dark field is
 * for pages where the section before it is already cream.
 */

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function FaqAccordion({
  _key,
  dataAttribute,
  eyebrow,
  faqs,
  subtitle,
  title,
  background,
}: FaqAccordionProps) {
  const visibleFaqs =
    faqs?.filter((faq) => stegaClean(faq.title)?.trim()) ?? [];
  if (!title?.length || !visibleFaqs.length) return null;

  const cream = stegaClean(background) !== "green";
  const sectionKey = stegaClean(_key);
  const headingId = `faq-accordion-${sectionKey}-title`;
  const defaultValue = visibleFaqs[0]?._key || visibleFaqs[0]?._id || undefined;

  const headingComponents: PortableTextComponents = {
    block: { normal: ({ children }) => <>{children}</> },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => (
        <em
          className="font-accent not-italic text-emphasis"
        >
          {children}
        </em>
      ),
    },
  };

  const answerComponents = faqAnswerComponents();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-24 py-section",
        sectionThemeClass(background),
      )}
      data-sanity={dataAttribute?.("background")}
      id={`faq-${sectionKey}`}
    >
      <div className="container-content">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-10 xl:gap-x-24">
          <header className={cn("max-w-[30rem]", styles.reveal)}>
            {hasText(eyebrow) ? (
              <p
                className="mb-5 text-eyebrow text-link"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              className="text-balance font-display text-headline"
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              <PortableText components={headingComponents} value={title} />
            </h2>
            {hasText(subtitle) ? (
              <p
                className="mt-6 text-pretty text-[17px] leading-[1.6] text-muted-foreground"
                data-sanity={dataAttribute?.("subtitle")}
              >
                {subtitle}
              </p>
            ) : null}
          </header>

          <Accordion
            className={cn("w-full border-t", faqRuleClass(cream), styles.reveal)}
            collapsible
            data-sanity={dataAttribute?.("faqs")}
            defaultValue={defaultValue}
            type="single"
          >
            {visibleFaqs.map((faq) => {
              const value = faq._key || faq._id;

              return (
                <FaqAccordionItem
                  cream={cream}
                  key={value}
                  question={faq.title}
                  value={value}
                >
                  {faq.answer?.length ? (
                    <PortableText components={answerComponents} value={faq.answer} />
                  ) : null}
                </FaqAccordionItem>
              );
            })}
          </Accordion>

        </div>
      </div>
    </section>
  );
}
