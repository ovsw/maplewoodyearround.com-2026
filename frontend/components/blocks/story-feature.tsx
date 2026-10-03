import { Button } from "@/components/ui/button";
import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { Check } from "lucide-react";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./story-feature.module.css";
import { sectionThemeClass } from "./section-theme";

type StoryFeatureBlock = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "storyFeature" }
>;

type StoryFeatureProps = StoryFeatureBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

/*
 * Story feature — one photo, one story, one or two actions.
 *
 * A closing or mid-page section: the photo bleeds from the viewport's left
 * edge to the container midline and pins to the viewport, one screen tall,
 * while longer copy scrolls past it; the
 * eyebrow, heading, narrative, "at a glance" checklist and buttons sit in the
 * right half (grid in story-feature.module.css). When this section follows
 * another story feature with a photo, the dispatcher marks the wrapper
 * `data-mirror` and the module flips the two halves; the component itself
 * knows nothing about its neighbours. Default field is Forest
 * Floor (the site's default dark field); `useCreamBackground` swaps to Birch
 * Bark so the block can alternate with its neighbours (The Dusk Alternation
 * Rule). Phones stack: photo first at 4:3, then the copy.
 */

/** The field utility on the section root re-points the job tokens, so only
 *  the recipes whose alpha differs between the two grounds stay here. */
const fields = {
  dark: {
    chipTitle: "text-foreground/60",
    link: "text-link decoration-link/40 hover:text-link-hover hover:decoration-link-hover",
    media: "bg-fill-night",
    onDark: true,
  },
  cream: {
    chipTitle: "text-muted-foreground",
    link: "text-link decoration-link/30 hover:text-link-hover hover:decoration-link-hover",
    media: "bg-foreground/10",
    onDark: false,
  },
} as const;

type Field = (typeof fields)[keyof typeof fields];

const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent not-italic text-emphasis">{children}</em>
    ),
  },
};

function richTextComponents(field: Field): Partial<PortableTextComponents> {
  return {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      blockquote: ({ children }) => (
        <blockquote className="my-2 border-l-2 border-mark pl-5 font-display text-title text-foreground sm:text-[26px]">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="list-disc space-y-2 pl-6 marker:text-mark">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="list-decimal space-y-2 pl-6 marker:font-mono marker:text-[14px]">
          {children}
        </ol>
      ),
    },
    marks: {
      strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      em: ({ children }) => <em>{children}</em>,
      customLink: createCustomLinkMarkRenderer(
        cn("font-medium underline underline-offset-4", field.link),
      ),
    },
  };
}

function getButtonVariant(variant?: string | null): ButtonVariant {
  const cleanVariant = stegaClean(variant);
  return cleanVariant === "secondary" || cleanVariant === "outline"
    ? "outline"
    : "primary";
}

function StoryButtons({
  buttons,
  dataAttribute,
  field,
}: Readonly<Pick<StoryFeatureProps, "buttons" | "dataAttribute"> & { field: Field }>) {
  const links = (buttons ?? []).flatMap((button, index) => {
    const href = getSafeLinkHref(button.href);
    const label = stegaClean(button.text)?.trim();
    if (!href || !label) return [];
    return [{ ...button, href, label, key: button._key || `${href}-${index}` }];
  });

  if (!links.length) return null;

  return (
    <div
      className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      data-sanity={dataAttribute?.("buttons")}
    >
      {links.slice(0, 2).map((button) => (
        <Button
          asChild
          key={button.key}
          onDark={field.onDark}
          variant={getButtonVariant(button.variant)}
        >
          <Link
            data-sanity={dataAttribute?.(`buttons[_key=="${button._key}"]`)}
            href={button.href}
            rel={stegaClean(button.openInNewTab) ? "noopener noreferrer" : undefined}
            target={stegaClean(button.openInNewTab) ? "_blank" : undefined}
          >
            {button.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function KeyDetails({
  dataAttribute,
  details,
  field,
}: Readonly<{
  dataAttribute?: StoryFeatureProps["dataAttribute"];
  details?: StoryFeatureProps["keyDetails"];
  field: Field;
}>) {
  const title = stegaClean(details?.title)?.trim();
  const items = (details?.items ?? [])
    .map((item, index) => ({ index, value: stegaClean(item)?.trim() }))
    .filter((item): item is { index: number; value: string } => Boolean(item.value))
    .slice(0, 8);

  if (!items.length) return null;

  return (
    <div>
      {title ? (
        <p
          className={cn("mb-3 text-label", field.chipTitle)}
          data-sanity={dataAttribute?.("keyDetails.title")}
        >
          {title}
        </p>
      ) : null}
      <ul
        className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0"
        data-sanity={dataAttribute?.("keyDetails.items")}
      >
        {items.map((item) => (
          <li
            className="inline-flex items-center gap-1.5 text-[15px] leading-[1.45] text-soft-foreground"
            data-sanity={dataAttribute?.(`keyDetails.items[${item.index}]`)}
            key={`${item.value}-${item.index}`}
          >
            <Check
              aria-hidden="true"
              className="size-4 shrink-0 text-link"
              strokeWidth={2.5}
            />
            {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StoryFeature({
  _key,
  buttons,
  dataAttribute,
  eyebrow,
  image,
  keyDetails,
  richText,
  title,
  background,
}: StoryFeatureProps) {
  if (!title?.length) return null;

  const field = stegaClean(background) === "green" ? fields.dark : fields.cream;
  const displayEyebrow = stegaClean(eyebrow)?.trim();
  const sectionKey = stegaClean(_key);
  const headingId = `story-feature-${sectionKey}-title`;
  const hasImage = Boolean(image?.asset?._id);

  return (
    <section
      aria-labelledby={headingId}
      className={sectionThemeClass(background)}
      id={`story-feature-${sectionKey}`}
    >
      <div className={styles.grid}>
        {hasImage ? (
          <figure
            className={cn(styles.photo, "m-0 min-w-0")}
            data-sanity={dataAttribute?.("image")}
          >
            <div className={styles.stage}>
              <div className={cn(styles.frame, field.media)}>
                <Image
                alt={stegaClean(image?.alt)?.trim() || ""}
                blurDataURL={image?.asset?.metadata?.lqip || undefined}
                className="object-cover"
                fill
                placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                sizes="(min-width: 1024px) 60vw, 100vw"
                src={urlFor(image!).width(1400).height(1600).url()}
                />
              </div>
            </div>
          </figure>
        ) : null}

        <div
          className={cn(
            styles.copy,
            !hasImage && styles.copyWithoutPhoto,
            "flex min-w-0 max-w-[38rem] flex-col gap-7",
          )}
        >
          <header>
            {displayEyebrow ? (
              <p
                className="mb-5 text-eyebrow text-link"
                data-sanity={dataAttribute?.("eyebrow")}
              >
                {displayEyebrow}
              </p>
            ) : null}
            <h2
              className="text-balance font-display text-headline"
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              <PortableText components={headingComponents} value={title} />
            </h2>
          </header>

          {richText?.length ? (
            <div
              className="flex flex-col gap-4 text-pretty text-[17px] leading-[1.6] text-muted-foreground"
              data-sanity={dataAttribute?.("richText")}
            >
              <PortableText components={richTextComponents(field)} value={richText} />
            </div>
          ) : null}

          <KeyDetails dataAttribute={dataAttribute} details={keyDetails} field={field} />
          <StoryButtons buttons={buttons} dataAttribute={dataAttribute} field={field} />
        </div>
      </div>
    </section>
  );
}
