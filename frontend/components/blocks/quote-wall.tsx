import { sectionThemeClass } from "./section-theme";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  PortableText,
  toPlainText,
  type PortableTextComponents,
} from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import QuoteWallDialog from "./quote-wall-dialog";
import QuoteWallList from "./quote-wall-list";
import styles from "./quote-wall.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type QuoteWallBlock = Extract<PageBlock, { _type: "quoteWall" }>;
type TestimonialReference = NonNullable<QuoteWallBlock["testimonials"]>[number];
type TestimonialDocument = NonNullable<TestimonialReference["document"]>;

type QuoteWallProps = QuoteWallBlock & {
  dataAttribute?: (path: string) => string | undefined;
  testimonialDataAttribute?: (
    documentId: string,
    path: string,
  ) => string | undefined;
};

/**
 * Progressive disclosure, two levels.
 *
 * A quote longer than this many characters is clamped to a few lines on its
 * card, with a link that opens the whole quote in a dialog. Expanding in place
 * would re-pack the column layout under the reader's eyes.
 */
export const LONG_QUOTE_CHARS = 320;

/** Cards shown before the first "Show more": three rows of three on desktop. */
export const INITIAL_CARDS = 9;

/** Cards each press of "Show more" reveals. */
export const MORE_CARDS = 9;

/** Heading rich text: italic gets the handwritten accent. */
const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent text-[var(--section-accent)] not-italic">{children}</em>
    ),
  },
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

/** Up to two initials from the name, for the avatar fallback. */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toUpperCase() ?? "")
    .join("");
}

/** Round portrait, or the person's initials when there is no photo. */
function TestimonialAvatar({
  image,
  name,
}: Readonly<{ image: TestimonialDocument["image"]; name: string }>) {
  const hasImage = Boolean(image?.asset?._id);
  return (
    <span aria-hidden={hasImage ? undefined : "true"} className={cn("card-panel", styles.avatar)}>
      {hasImage && image ? (
        <Image
          alt={stegaClean(image.alt) || ""}
          blurDataURL={image.asset?.metadata?.lqip || undefined}
          className="object-cover"
          fill
          placeholder={image.asset?.metadata?.lqip ? "blur" : undefined}
          sizes="44px"
          src={urlFor(image).width(96).height(96).url()}
        />
      ) : (
        <span className={styles.avatarFallback}>{initials(name)}</span>
      )}
    </span>
  );
}

function QuoteCard({
  clamped,
  referenceDataAttribute,
  testimonial,
  testimonialDataAttribute,
}: Readonly<{
  /** Shorten the quote and offer the full text in a dialog. */
  clamped: boolean;
  referenceDataAttribute?: string;
  testimonial: TestimonialDocument;
  testimonialDataAttribute?: QuoteWallProps["testimonialDataAttribute"];
}>) {
  const role = stegaClean(testimonial.title)?.trim();
  const origin = stegaClean(testimonial.origin)?.trim();
  const name = stegaClean(testimonial.name) ?? "";

  return (
    <figure className={cn("card-cream", styles.card)} data-sanity={referenceDataAttribute}>
      <span aria-hidden="true" className={styles.quoteMark}>
        &ldquo;
      </span>
      <blockquote
        className={styles.quoteBody}
        data-clamped={clamped ? "" : undefined}
        data-sanity={testimonialDataAttribute?.(testimonial._id, "body")}
      >
        <PortableText
          components={simpleRichTextComponents}
          value={testimonial.body ?? []}
        />
      </blockquote>
      {clamped ? (
        <QuoteWallDialog label="Read the full quote" name={name}>
          <QuoteCard clamped={false} testimonial={testimonial} />
        </QuoteWallDialog>
      ) : null}
      <figcaption className={styles.attribution}>
        <span
          className={styles.avatarSlot}
          data-sanity={testimonialDataAttribute?.(testimonial._id, "image")}
        >
          <TestimonialAvatar image={testimonial.image} name={name} />
        </span>
        <span className={styles.who}>
          <span
            className={styles.name}
            data-sanity={testimonialDataAttribute?.(testimonial._id, "name")}
          >
            {testimonial.name}
          </span>
          {role || origin ? (
            <span className={styles.meta}>
              {role ? (
                <span data-sanity={testimonialDataAttribute?.(testimonial._id, "title")}>
                  {testimonial.title}
                </span>
              ) : null}
              {role && origin ? <span aria-hidden="true"> · </span> : null}
              {origin ? (
                <span data-sanity={testimonialDataAttribute?.(testimonial._id, "origin")}>
                  {testimonial.origin}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Every selected quote as a card in a wall of columns, for pages that are
 * about the quotes rather than pages that borrow a few. Long quotes are
 * clamped with a "Read the full quote" dialog, and the wall shows the first
 * nine cards with a "Show more" button for the rest.
 */
export default function QuoteWall({
  _key,
  background,
  dataAttribute,
  eyebrow,
  heading,
  testimonialDataAttribute,
  testimonials,
}: QuoteWallProps) {
  const cards = (testimonials ?? []).flatMap((reference, index) => {
    const document = reference.document;
    if (!document || !hasText(document.name) || !document.body?.length) {
      return [];
    }
    const text = stegaClean(toPlainText(document.body)).trim();
    if (!text) return [];

    const path = reference._key
      ? `testimonials[_key=="${reference._key}"]`
      : `testimonials[${index}]`;

    return [
      {
        clamped: text.length > LONG_QUOTE_CHARS,
        document,
        key: reference._key ?? document._id,
        path,
      },
    ];
  });

  if (!heading?.length || !cards.length) return null;

  const theme = stegaClean(background);
  const headingId = `quote-wall-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("py-section", sectionThemeClass(theme))}
      data-theme={theme ?? "white"}
      id={`quote-wall-${stegaClean(_key)}`}
    >
      <div className="container-content grid gap-12 lg:gap-16">
        <header>
          <div className="grid max-w-3xl gap-5">
            {hasText(eyebrow) ? (
              <p
                className="text-eyebrow text-[var(--section-accent)]"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              className="text-balance font-display text-headline"
              data-sanity={dataAttribute?.("heading")}
              id={headingId}
            >
              <PortableText components={headingComponents} value={heading} />
            </h2>
          </div>
        </header>

        <QuoteWallList
          dataSanity={dataAttribute?.("testimonials")}
          initialCount={INITIAL_CARDS}
          items={cards.map(({ clamped, document, key, path }) => ({
            key,
            node: (
              <QuoteCard
                clamped={clamped}
                referenceDataAttribute={dataAttribute?.(path)}
                testimonial={document}
                testimonialDataAttribute={testimonialDataAttribute}
              />
            ),
          }))}
          onDark={theme === "green"}
          step={MORE_CARDS}
        />
      </div>
    </section>
  );
}
