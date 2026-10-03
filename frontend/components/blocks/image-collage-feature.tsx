import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { sectionThemeClass } from "./section-theme";
import styles from "./image-collage-feature.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ImageCollageFeatureProps = Extract<
  PageBlock,
  { _type: "imageCollageFeature" }
> & {
  dataAttribute?: (path: string) => string | undefined;
};

type CollageImage = NonNullable<ImageCollageFeatureProps["primaryImage"]>;

export function getHotspotPosition(image: CollageImage) {
  if (image.hotspot?.x == null || image.hotspot.y == null) return undefined;

  const crop = image.crop;
  const visibleWidth = 1 - (crop?.left ?? 0) - (crop?.right ?? 0);
  const visibleHeight = 1 - (crop?.top ?? 0) - (crop?.bottom ?? 0);

  if (visibleWidth <= 0 || visibleHeight <= 0) return undefined;

  const x = ((image.hotspot.x - (crop?.left ?? 0)) / visibleWidth) * 100;
  const y = ((image.hotspot.y - (crop?.top ?? 0)) / visibleHeight) * 100;
  const clamp = (value: number) =>
    Number(Math.min(100, Math.max(0, value)).toFixed(4));

  return `${clamp(x)}% ${clamp(y)}%`;
}

const headingComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <>{children}</>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent not-italic text-emphasis">{children}</em>
    ),
  },
};

export default function ImageCollageFeature({
  _key,
  background,
  body,
  cta,
  dataAttribute,
  eyebrow,
  points,
  primaryImage,
  secondaryImage,
  title,
}: ImageCollageFeatureProps) {
  if (!title?.length || !points?.length) return null;

  const cleanEyebrow = stegaClean(eyebrow)?.trim();
  const cleanBody = stegaClean(body)?.trim();
  const ctaHref = getSafeLinkHref(cta?.href);
  const ctaText = stegaClean(cta?.text)?.trim();
  const headingId = `image-collage-feature-${stegaClean(_key)}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("py-section", sectionThemeClass(background))}
      id={`image-collage-${stegaClean(_key)}`}
    >
      <div className="container-content grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-20">
        <div className={styles.reveal}>
          {cleanEyebrow ? (
            <p
              className="mb-5 text-eyebrow text-link"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {cleanEyebrow}
            </p>
          ) : null}

          <h2
            className="max-w-2xl text-balance font-display text-headline"
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            <PortableText components={headingComponents} value={title ?? []} />
          </h2>

          {cleanBody ? (
            <p
            className="mt-6 max-w-xl text-pretty text-lg/relaxed text-current/75"
              data-sanity={dataAttribute?.("body")}
            >
              {cleanBody}
            </p>
          ) : null}

          <ul
            className="mt-8 grid max-w-xl list-none gap-4 p-0"
            data-sanity={dataAttribute?.("points")}
          >
            {points.map((point) => {
              const pointPath = `points[_key=="${point._key}"]`;
              const pointTitle = stegaClean(point.title)?.trim();
              const pointBody = stegaClean(point.body)?.trim();

              if (!pointTitle || !pointBody) return null;

              return (
                <li className="flex items-baseline gap-4" key={point._key}>
                  <span
                    aria-hidden="true"
                    className="relative top-px size-2.5 shrink-0 rotate-45 rounded-xs bg-mark"
                  />
                  <p className="text-base/relaxed text-current">
                    <strong className="mb-1 block" data-sanity={dataAttribute?.(`${pointPath}.title`)}>
                      {pointTitle}
                    </strong>
                    <span data-sanity={dataAttribute?.(`${pointPath}.body`)}>
                      {pointBody}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>

          {ctaHref && ctaText ? (
            <div className="mt-8 w-fit" data-sanity={dataAttribute?.("cta")}>
              <Button
                asChild
                    className="text-link hover:opacity-80"
                variant="link"
              >
                <Link
                  data-sanity={dataAttribute?.("cta.url")}
                  href={ctaHref}
                  rel={
                    stegaClean(cta?.openInNewTab)
                      ? "noopener noreferrer"
                      : undefined
                  }
                  target={stegaClean(cta?.openInNewTab) ? "_blank" : undefined}
                >
                  <span data-sanity={dataAttribute?.("cta.text")}>
                    {ctaText}
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="relative min-h-[28rem] sm:min-h-[34rem] lg:min-h-[40rem]">
          {primaryImage?.asset?._id ? (
            <div
              className="absolute right-0 top-0 h-[78%] w-[86%] overflow-hidden rounded-xl shadow-media-rest"
              data-sanity={dataAttribute?.("primaryImage")}
            >
              <div
                className={cn(
                  "absolute -inset-y-[8%] inset-x-0",
                  styles.parallax,
                )}
              >
                <Image
                  alt={stegaClean(primaryImage.alt) || ""}
                  blurDataURL={primaryImage.asset.metadata?.lqip || undefined}
                  className="object-cover"
                  fill
                  placeholder={
                    primaryImage.asset.metadata?.lqip ? "blur" : undefined
                  }
                  sizes="(min-width: 1024px) 48vw, 100vw"
                  src={urlFor(primaryImage).width(1400).url()}
                  style={{ objectPosition: getHotspotPosition(primaryImage) }}
                />
              </div>
            </div>
          ) : null}

          {secondaryImage?.asset?._id ? (
            <div
              className={cn(
                "absolute bottom-0 left-0 h-[42%] w-[46%] -rotate-3 overflow-hidden rounded-lg border-[0.625rem] border-fill-cream shadow-card-rest-cream",
                styles.secondaryReveal,
              )}
              data-sanity={dataAttribute?.("secondaryImage")}
            >
              <Image
                alt={stegaClean(secondaryImage.alt) || ""}
                blurDataURL={secondaryImage.asset.metadata?.lqip || undefined}
                className="object-cover"
                fill
                placeholder={
                  secondaryImage.asset.metadata?.lqip ? "blur" : undefined
                }
                sizes="(min-width: 1024px) 22vw, 46vw"
                src={urlFor(secondaryImage).width(800).url()}
                style={{ objectPosition: getHotspotPosition(secondaryImage) }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
