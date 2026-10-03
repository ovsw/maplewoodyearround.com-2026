import { cn } from "@/lib/utils";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import FaqHubBrowser, { type FaqHubBrowserItem } from "./faq-hub-browser";
import styles from "./faq-hub.module.css";
import { faqAnswerComponents } from "./faq-item";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FaqHubProps = Extract<PageBlock, { _type: "faqHub" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * FAQ hub — every published question on one page.
 *
 * The header (eyebrow, headline with the script aside, intro) sits above a
 * search field, then a two-column grid: the category list in a sticky left
 * column and the grouped accordions on the right. Phones stack it: search,
 * a sideways-scrolling category row, then the groups. The same shell and
 * ink as the curated FAQ Section, so the two read as one family.
 *
 * Answers render here on the server; the browser below only filters and
 * groups them, so no rich-text renderer ships to the client.
 */

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function FaqHub({
  _key,
  background,
  dataAttribute,
  emptyState,
  eyebrow,
  faqs,
  searchPlaceholder,
  subtitle,
  title,
}: FaqHubProps) {
  if (!title?.length) return null;

  const cream = stegaClean(background) !== "green";
  const sectionKey = stegaClean(_key);
  const headingId = `faq-hub-${sectionKey}-title`;
  const answerComponents = faqAnswerComponents();

  const items: FaqHubBrowserItem[] = (faqs ?? []).flatMap((faq) => {
    const question = stegaClean(faq.title)?.trim();
    if (!question || !faq.title || !faq.category) return [];
    return [
      {
        _id: faq._id,
        category: faq.category,
        question,
        title: faq.title,
        answerText: stegaClean(faq.answerText) ?? "",
        answer: faq.answer?.length ? (
          <PortableText components={answerComponents} value={faq.answer} />
        ) : null,
      },
    ];
  });

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

  return (
    <section
      aria-labelledby={headingId}
      className={cn("scroll-mt-24 py-section", sectionThemeClass(background))}
      data-sanity={dataAttribute?.("background")}
      id={`faq-hub-${sectionKey}`}
    >
      <div className="container-content">
        <header className={cn("max-w-[40rem]", styles.reveal)}>
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

        <FaqHubBrowser
          cream={cream}
          emptyState={stegaClean(emptyState)?.trim() || "No question matches that search yet."}
          emptyStateDataSanity={dataAttribute?.("emptyState")}
          items={items}
          searchPlaceholder={stegaClean(searchPlaceholder)?.trim() || "Search every question"}
          sectionKey={sectionKey}
        />
      </div>
    </section>
  );
}
