import RichTextContent from "@/components/rich-text-content";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import type { PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { sectionThemeClass } from "./section-theme";

type RichTextBlockData = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "richTextBlock" }
>;

type RichTextBlockProps = RichTextBlockData & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function RichTextBlock({
  _key,
  background,
  dataAttribute,
  eyebrow,
  richText,
  title,
}: RichTextBlockProps) {
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const displayTitle = stegaClean(title)?.trim();
  const headingId = displayTitle
    ? `rich-text-${stegaClean(_key)}-title`
    : undefined;

  if (!(displayEyebrow || displayTitle || richText?.length)) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={`${sectionThemeClass(background)} py-section`}
    >
      <div className="container-content">
        <div className="mx-auto max-w-[70ch] text-base sm:text-lg">
          {displayEyebrow || displayTitle ? (
            <header className="mb-10">
              {displayEyebrow ? (
                <p
                  className="text-eyebrow mb-4 text-(--section-accent)"
                  data-sanity={dataAttribute?.("eyebrow")}
                >
                  {eyebrow}
                </p>
              ) : null}
              {displayTitle ? (
                <h2
                  className="text-headline font-display font-extrabold text-balance"
                  data-sanity={dataAttribute?.("title")}
                  id={headingId}
                >
                  {title}
                </h2>
              ) : null}
            </header>
          ) : null}
          {richText?.length ? (
            <RichTextContent
              className="text-inherit text-base leading-relaxed sm:text-lg [overflow-wrap:anywhere] [&_h2]:font-display [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:font-display [&_h3]:font-bold [&_h3]:leading-tight [&_h4]:font-display [&_h4]:font-bold [&_h5]:font-display [&_h6]:font-display [&_strong]:text-current [&_blockquote]:text-current [&_a:not(.no-underline)]:text-(--section-accent) [&_a:not(.no-underline)]:decoration-current [&_a:not(.no-underline)]:decoration-1 [&_a:not(.no-underline):hover]:decoration-2"
              dataSanity={dataAttribute?.("richText")}
              value={richText as PortableTextProps["value"]}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
