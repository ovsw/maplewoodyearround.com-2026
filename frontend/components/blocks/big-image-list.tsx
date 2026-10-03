import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  PortableText,
  toPlainText,
  type PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import { stegaClean } from "next-sanity";
import styles from "./big-image-list.module.css";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BigImageListProps = Extract<PageBlock, { _type: "bigImageList" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent text-primary not-italic">{children}</em>
    ),
  },
};

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export default function BigImageList({
  _key,
  background,
  dataAttribute,
  eyebrow,
  intro,
  stops,
  title,
}: BigImageListProps) {
  const renderableStops = (stops ?? []).filter(
    (stop) =>
      stop?._key &&
      hasText(stop.label) &&
      hasText(stop.time) &&
      hasText(stop.text),
  );
  if (!title?.length || renderableStops.length < 2) return null;

  const sectionId = `big-image-list-${stegaClean(_key)}`;
  const sectionTitle = stegaClean(toPlainText(title)).replace(/\s+/g, " ").trim();
  const sectionLabel = sectionTitle
    ? `Schedule list: ${sectionTitle}`
    : "Schedule list";

  return (
    <section
      aria-label={sectionLabel}
      className={cn(sectionThemeClass(background), "py-section")}
      id={sectionId}
    >
      <div className="container-content">
        <header className={styles.header}>
          <div>
            {hasText(eyebrow) ? (
              <p
                className="mb-5 text-eyebrow text-primary"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {eyebrow}
              </p>
            ) : null}
            <h2
              className="text-balance font-display text-headline"
              data-sanity={dataAttribute?.("title")}
            >
              <PortableText components={headingComponents} value={title} />
            </h2>
          </div>
          {hasText(intro) ? (
            <p
              className="max-w-[38rem] text-pretty text-[17px] leading-[1.6] text-current/80 lg:mb-1.5"
              data-sanity={dataAttribute?.("intro")}
            >
              {intro}
            </p>
          ) : null}
        </header>
        <ol
          role="list"
          aria-label="Stops, in order"
          className="mt-14 list-none border-t border-current/20 p-0"
          data-sanity={dataAttribute?.("stops")}
        >
          {renderableStops.map((stop, index) => {
            const stopPath = `stops[_key=="${stop._key}"]`;
            const labelId = `${sectionId}-${stegaClean(stop._key)}-label`;
            const textId = `${sectionId}-${stegaClean(stop._key)}-text`;
            const time = stegaClean(stop.time) ?? "";
            // Keep the written time intact; only style a trailing am/pm separately.
            const suffix = time.match(/\s*[ap]m\s*$/i)?.[0];
            const number = String(index + 1).padStart(2, "0");
            return (
              <li
                key={stop._key}
                aria-labelledby={labelId}
                aria-describedby={textId}
                className={cn(
                  "border-b border-current/20",
                  styles.row,
                  styles.reveal,
                )}
              >
                <div className="min-w-0">
                  <p className="mb-3.5 text-step-number text-current/70">
                    {number}
                  </p>
                  <p
                    className={styles.time}
                    data-sanity={dataAttribute?.(`${stopPath}.time`)}
                  >
                    {suffix ? (
                      <>
                        {time.slice(0, -suffix.length)}
                        <small>{suffix}</small>
                      </>
                    ) : (
                      time
                    )}
                  </p>
                  <h3
                    className="max-w-[30rem] font-display text-[30px] leading-[1.1] font-bold tracking-[-0.01em] wrap-break-word"
                    data-sanity={dataAttribute?.(`${stopPath}.label`)}
                    id={labelId}
                  >
                    {stop.label}
                  </h3>
                  <p
                    className="mt-2.5 max-w-[30rem] text-pretty text-[15px] leading-[1.55] text-current/80 wrap-break-word"
                    data-sanity={dataAttribute?.(`${stopPath}.text`)}
                    id={textId}
                  >
                    {stop.text}
                  </p>
                </div>
                <figure
                  className="relative aspect-[3/2] w-full overflow-hidden rounded-md bg-fill-panel shadow-media-rest"
                  data-sanity={dataAttribute?.(`${stopPath}.image`)}
                >
                  {stop.image?.asset?._id ? (
                    <Image
                      alt={stegaClean(stop.image.alt)?.trim() ?? ""}
                      blurDataURL={stop.image.asset.metadata?.lqip || undefined}
                      className="object-cover"
                      fill
                      placeholder={
                        stop.image.asset.metadata?.lqip ? "blur" : undefined
                      }
                      sizes="(min-width: 1320px) 620px, (min-width: 1024px) 50vw, 100vw"
                      src={urlFor(stop.image).width(1242).height(828).url()}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center font-display text-6xl text-fill-panel-foreground/20"
                    >
                      {number}
                    </span>
                  )}
                </figure>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
