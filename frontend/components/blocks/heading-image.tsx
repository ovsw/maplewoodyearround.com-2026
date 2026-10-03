import Image from "next/image";
import RichTextContent from "@/components/rich-text-content";
import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type HeadingImageProps = Extract<PageBlock, { _type: "headingImage" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

export default function HeadingImage({
  _key,
  background,
  dataAttribute,
  image,
  richText,
  title,
}: HeadingImageProps) {
  const dimensions = image?.asset?.metadata?.dimensions;
  if (!stegaClean(title)?.trim() || !image?.asset?._id ||
      !dimensions?.width || !dimensions.height) return null;

  const crop = image.crop;
  const width = Math.max(1, Math.round(dimensions.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0))));
  const height = Math.max(1, Math.round(dimensions.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0))));
  const headingId = `heading-image-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className={`${sectionThemeClass(background)} py-section`}
      id={`heading-image-${stegaClean(_key)}`}
    >
      <div className="container-content">
        <h2
          className="text-center text-balance font-display text-headline"
          data-sanity={dataAttribute?.("title")}
          id={headingId}
        >
          {title}
        </h2>
        {richText?.length ? (
          <RichTextContent
            className="mx-auto mt-6 max-w-2xl text-center text-lg/relaxed text-current/75 [&_p]:text-balance [&_strong]:text-current"
            dataSanity={dataAttribute?.("richText")}
            value={richText}
          />
        ) : null}
        <div className="mt-10" data-sanity={dataAttribute?.("image")}>
          <Image
            alt={stegaClean(image.alt) ?? ""}
            className="block h-auto w-full rounded-lg"
            width={width}
            height={height}
            sizes="(min-width: 1432px) 1320px, (min-width: 1024px) calc(100vw - 112px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
            src={urlFor(image).width(2640).fit("max").url()}
          />
        </div>
      </div>
    </section>
  );
}
