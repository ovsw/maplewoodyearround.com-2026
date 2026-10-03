import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { resolveHomeHeroButtonVariant } from "@/components/blocks/home-hero";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type HeroBlock = Extract<PageBlock, { _type: "hero" }>;

type HeroProps = HeroBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * Page Header — the opening section of every interior page.
 *
 * Two background modes share one pine fade that keeps the left text column
 * on near-solid dark: without a photo the fade sits over the forest-glow
 * radial; with a photo the glow is replaced by the image. Below lg the fade
 * rotates to bottom-up so stacked text keeps its contrast floor.
 */

/** Heading rich text: italic gets the handwritten amber accent. */
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

const PINE_FADE_DESKTOP =
  "lg:bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-fill-night)_97%,transparent)_0%,color-mix(in_oklab,var(--color-fill-night)_67%,transparent)_48%,color-mix(in_oklab,var(--color-fill-night)_18%,transparent)_100%)]";
const PINE_FADE_STACKED =
  "bg-[linear-gradient(0deg,color-mix(in_oklab,var(--color-fill-night)_96%,transparent)_0%,color-mix(in_oklab,var(--color-fill-night)_82%,transparent)_45%,color-mix(in_oklab,var(--color-fill-night)_42%,transparent)_100%)]";
const FOREST_GLOW =
  "bg-[radial-gradient(circle_at_78%_32%,#738955_0%,#738955_8%,#314625_38%,#17230f_70%)]";

export default function Hero({
  _key,
  body,
  buttons,
  dataAttribute,
  eyebrow,
  image,
  title,
}: HeroProps) {
  if (!title?.length) return null;

  const titleId = `hero-${stegaClean(_key)}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="relative overflow-hidden field-night"
    >
      {/* Background: photo or forest glow */}
      {image?.asset?._id ? (
        <Image
          alt={stegaClean(image.alt) || ""}
          blurDataURL={image.asset.metadata?.lqip || undefined}
          className="object-cover"
          data-sanity={dataAttribute?.("image")}
          fill
          placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
          priority
          sizes="100vw"
          src={urlFor(image).width(2000).height(1200).fit("crop").url()}
        />
      ) : (
        <div aria-hidden="true" className={`absolute inset-0 ${FOREST_GLOW}`} />
      )}

      {/* Pine fade keeps the text column readable */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${PINE_FADE_STACKED} ${PINE_FADE_DESKTOP}`}
      />

      <div className="container-content relative z-10 flex min-h-[clamp(24rem,50svh,40rem)] flex-col justify-end pb-(--section-pad-bottom) pt-28">
        {stegaClean(eyebrow)?.trim() ? (
          <p
            className="text-eyebrow mb-5 animate-hero-rise text-link motion-reduce:animate-none"
            data-sanity={dataAttribute?.("eyebrow")}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className="text-display-page max-w-[44rem] animate-hero-rise text-balance font-display font-extrabold text-foreground [animation-delay:90ms] motion-reduce:animate-none"
          data-sanity={dataAttribute?.("title")}
          id={titleId}
        >
          <PortableText components={headingComponents} value={title} />
        </h1>

        {body?.length ? (
          <div
            className="mt-6 max-w-xl animate-hero-rise text-base leading-relaxed text-foreground/75 [animation-delay:180ms] motion-reduce:animate-none"
            data-sanity={dataAttribute?.("body")}
          >
            <PortableText components={simpleRichTextComponents} value={body} />
          </div>
        ) : null}

        {buttons?.length ? (
          <div
            className="mt-8 flex flex-wrap animate-hero-rise gap-4 [animation-delay:260ms] motion-reduce:animate-none"
            data-sanity={dataAttribute?.("buttons")}
          >
            {buttons.slice(0, 2).map((button, index) => {
              const href = getSafeLinkHref(button.href);
              if (!href || !button.text) return null;
              return (
                <Button
                  asChild
                  key={button._key}
                  lift={false}
                  onDark
                  variant={resolveHomeHeroButtonVariant(button.variant, index)}
                >
                  <Link
                    href={href}
                    rel={
                      stegaClean(button.openInNewTab)
                        ? "noopener noreferrer"
                        : undefined
                    }
                    target={
                      stegaClean(button.openInNewTab) ? "_blank" : undefined
                    }
                  >
                    {button.text}
                  </Link>
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
