import { PortableText } from "@portabletext/react";
import { Star } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import type { SectionProps } from "./maplewood-section";
import { stegaClean } from "next-sanity";
import css from "./maplewood-home.module.css";
import programs from "./maplewood-programs.module.css";
type Props = SectionProps<"quoteWall"> & {
  testimonialDataAttribute?: (id: string, path: string) => string | undefined;
};
export default function QuoteWall({
  anchorId,
  eyebrow,
  heading,
  subtitle,
  description,
  backgroundImage,
  testimonials,
  dataAttribute,
  testimonialDataAttribute,
}: Props) {
  const cards =
    testimonials?.flatMap((item) =>
      item.document?.body?.length ? [item.document] : [],
    ) ?? [];
  if (!cards.length) return null;
  return (
    <section
      className={css.testimonials}
      // A source anchor is set on the section's wrapper instead.
      id={stegaClean(anchorId) ? undefined : "testimonials"}
      // Only the home wall shortens its list on tablets and phones; inner
      // pages (which carry a source anchor) show every testimonial, as live.
      data-full-list={stegaClean(anchorId) ? "" : undefined}
      style={
        backgroundImage?.asset
          ? {
              backgroundImage: `linear-gradient(180deg, #00660199, #006601), url("${urlFor(backgroundImage).width(1920).url()}")`,
            }
          : undefined
      }
    >
      <div className={css.container}>
        <h2 data-sanity={dataAttribute?.("heading")}>
          {stegaClean(eyebrow)?.trim() ? (
            <span className={programs.quoteHighlight} data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </span>
          ) : null}
          <PortableText
            value={heading || []}
            components={{
              block: { normal: ({ children }) => <>{children}</> },
            }}
          />
        </h2>
        {stegaClean(subtitle)?.trim() ? (
          <p className={programs.quoteSubtitle} data-sanity={dataAttribute?.("subtitle")}>
            {subtitle}
          </p>
        ) : null}
        <div className={css.quoteGrid}>
          {cards.map((card) => (
            <figure
              key={card._id}
              className={css.quote}
              data-sanity={testimonialDataAttribute?.(card._id, "body")}
            >
              <div
                className={css.stars}
                role="img"
                aria-label={`${card.rating || 5} out of 5 stars`}
              >
                {Array.from({ length: card.rating || 5 }, (_, i) => (
                  <Star key={i} size={24} fill="currentColor" aria-hidden />
                ))}
              </div>
              <blockquote>
                <PortableText
                  value={card.body || []}
                  components={simpleRichTextComponents}
                />
              </blockquote>
              <figcaption>
                {card.pluralParents ? "Parents" : "Parent"}
                {card.program
                  ? `, ${card.program === "schoolYear" ? "School Year" : "Summer Camp"}`
                  : null}
              </figcaption>
            </figure>
          ))}
        </div>
        {description && stegaClean(description).includes("\n") ? (
          // Closing lines: a large first line, then smaller ones.
          <div className={programs.quoteClosing} data-sanity={dataAttribute?.("description")}>
            {stegaClean(description)
              .split("\n")
              .filter((line) => line.trim())
              .map((line, index) => (
                <p key={index}>{line}</p>
              ))}
          </div>
        ) : description ? (
          <p
            className={css.quoteClosing}
            data-sanity={dataAttribute?.("description")}
          >
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
