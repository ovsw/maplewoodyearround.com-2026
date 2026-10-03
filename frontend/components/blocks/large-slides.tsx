import LargeSlidesTrack from "@/components/blocks/large-slides-track";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import styles from "./large-slides.module.css";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type LargeSlidesProps = Extract<PageBlock, { _type: "largeSlides" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * Large slides — one pinned photo, many slides.
 *
 * The header (eyebrow, heading, intro) sits in the content container. Below
 * it, on desktop, the photo bleeds from the viewport's left edge to the
 * container midline and pins one screen tall while the slides scroll past in
 * the right half; the photo crossfades to the slide nearest the middle of the
 * screen. Each slide's copy is the Big Image List text column: number, big
 * time, label, one line. Phones stack each slide as photo then copy, with no
 * pinning.
 *
 * This server component resolves the data (image URLs, click-to-edit
 * attributes) into plain strings; large-slides-track.tsx owns the slide
 * markup and the scroll tracking on the client.
 */

const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent text-emphasis not-italic">{children}</em>
    ),
  },
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function LargeSlides({
  _key,
  background,
  dataAttribute,
  eyebrow,
  intro,
  slides,
  title,
}: LargeSlidesProps) {
  const renderableSlides = (slides ?? []).filter(
    (slide) =>
      slide?._key &&
      hasText(slide.label) &&
      hasText(slide.text),
  );
  if (!title?.length || renderableSlides.length < 2) return null;

  const sectionId = `large-slides-${stegaClean(_key)}`;
  const headingId = `${sectionId}-title`;

  const trackSlides = renderableSlides.map((slide, index) => {
    const slidePath = `slides[_key=="${slide._key}"]`;
    const key = stegaClean(slide._key) ?? String(index);
    const image = slide.image;
    const hasImage = Boolean(image?.asset?._id);
    const hotspot = image?.hotspot;

    return {
      key,
      labelId: `${sectionId}-${key}-label`,
      textId: `${sectionId}-${key}-text`,
      number: String(index + 1).padStart(2, "0"),
      time: stegaClean(slide.time) ?? "",
      label: slide.label ?? "",
      text: slide.text ?? "",
      image: hasImage
        ? {
            alt: stegaClean(image?.alt)?.trim() ?? "",
            lqip: image?.asset?.metadata?.lqip || undefined,
            /*
             * The pinned frame is taller than most camp photos, so the source
             * keeps its own aspect at full width and the browser crops around
             * the hotspot; asking Sanity for a portrait crop would upscale a
             * narrow slice. The stacked phone photo is 3:2 like the Big Image
             * List row.
             */
            pinnedSrc: urlFor(image!).width(1600).url(),
            stackedSrc: urlFor(image!).width(1242).height(828).url(),
            objectPosition:
              hotspot?.x != null && hotspot.y != null
                ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
                : undefined,
          }
        : null,
      sanity: {
        image: dataAttribute?.(`${slidePath}.image`),
        label: dataAttribute?.(`${slidePath}.label`),
        text: dataAttribute?.(`${slidePath}.text`),
        time: dataAttribute?.(`${slidePath}.time`),
      },
    };
  });

  return (
    <section
      aria-labelledby={headingId}
      className={sectionThemeClass(background)}
      id={sectionId}
    >
      <header className={cn("container-content", styles.header)}>
        <div>
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
        </div>
        {hasText(intro) ? (
          <p
            className="max-w-[38rem] text-pretty text-[17px] leading-[1.6] text-current/75 lg:mb-1.5"
            data-sanity={dataAttribute?.("intro")}
          >
            {intro}
          </p>
        ) : null}
      </header>
      <LargeSlidesTrack
        dataSanity={dataAttribute?.("slides")}
        slides={trackSlides}
      />
    </section>
  );
}
