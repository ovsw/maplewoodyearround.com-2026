import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { resolveHomeHeroButtonVariant } from "@/components/blocks/home-hero";
import { Button } from "@/components/ui/button";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type InnerHeroBlock = Extract<PageBlock, { _type: "innerHero" }>;

type InnerHeroProps = InnerHeroBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * Inner Hero — the pared-down home hero for interior pages.
 *
 * Desktop: the photo fills the section, the nav sits over it
 * (data-header-overlay), copy is left-aligned at the bottom, and the facts run
 * along the bottom under a hairline. The bottom padding is the resolved
 * `--section-pad-bottom`, which already clears a tucked section below. Phones: the photo is a poster block,
 * the copy sits on a solid pine plate under it, and the facts become a 2x2
 * hairline grid. No video, no film button.
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

export default function InnerHero({
  _key,
  body,
  buttons,
  dataAttribute,
  eyebrow,
  facts,
  image,
  title,
}: InnerHeroProps) {
  if (!title?.length) return null;

  const cleanKey = stegaClean(_key);
  const headingId = `inner-hero-${cleanKey}-title`;
  const ctaButtons = buttons?.slice(0, 2) ?? [];
  const factList = facts?.slice(0, 4) ?? [];
  const hasImage = Boolean(image?.asset?._id);

  return (
    <section
      aria-labelledby={headingId}
      className="relative flex flex-col overflow-hidden field-night lg:block lg:min-h-[min(88svh,52rem)]"
      data-header-overlay={hasImage ? "" : undefined}
      // Empty space in the hero focuses the background image: the copy fields
      // below carry their own data-sanity, so clicks resolve to the nearest
      // ancestor and only fall back to the image where no field sits.
      data-sanity={dataAttribute?.("image")}
      id={`inner-hero-${cleanKey}`}
    >
      {/* Photo: poster block on phones, full-bleed backdrop on desktop */}
      <div className="relative aspect-[4/3] shrink-0 sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
        {hasImage && image ? (
          <Image
            alt={stegaClean(image.alt) || ""}
            blurDataURL={image.asset?.metadata?.lqip || undefined}
            className="object-cover"
            fill
            placeholder={image.asset?.metadata?.lqip ? "blur" : undefined}
            priority
            sizes="100vw"
            src={urlFor(image).width(2000).height(1200).fit("crop").url()}
            style={
              image.hotspot?.x != null && image.hotspot.y != null
                ? {
                    objectPosition: `${image.hotspot.x * 100}% ${image.hotspot.y * 100}%`,
                  }
                : undefined
            }
          />
        ) : null}

        {/* Nav-legibility fade at the top on phones; full pine wash on desktop
            so the left text column keeps its contrast floor */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-fill-night/60 via-transparent to-fill-night/70 lg:hidden"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden lg:block lg:bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-fill-night)_90%,transparent)_0%,color-mix(in_oklab,var(--color-fill-night)_55%,transparent)_45%,color-mix(in_oklab,var(--color-fill-night)_12%,transparent)_100%)]"
        />
        {/* Header band on desktop: the side wash thins out to 12% at the
            right edge, which is where the call action and Enroll sit. The
            see-through header (data-header-overlay) relies on the hero for its
            contrast floor, so this band carries the top of the photo down to
            the night fill at about 60% across the header row, then fades before
            the copy. The home hero has the same band in its top wash. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 hidden h-56 lg:block lg:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-fill-night)_82%,transparent)_0%,color-mix(in_oklab,var(--color-fill-night)_45%,transparent)_45%,color-mix(in_oklab,var(--color-fill-night)_0%,transparent)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden h-1/2 lg:block lg:bg-[linear-gradient(0deg,color-mix(in_oklab,var(--color-fill-night)_92%,transparent)_0%,color-mix(in_oklab,var(--color-fill-night)_0%,transparent)_100%)]"
        />
      </div>

      {/* Copy: solid plate under the poster on phones, overlay on desktop */}
      <div className="container-content relative z-10 flex flex-col pb-(--section-pad-bottom) pt-8 lg:min-h-[min(88svh,52rem)] lg:justify-end lg:pt-40">
        <div className="lg:pb-12">
          {stegaClean(eyebrow)?.trim() ? (
            <p
              className="text-eyebrow mb-5 animate-hero-rise text-link motion-reduce:animate-none"
              data-sanity={dataAttribute?.("eyebrow")}
            >
              {eyebrow}
            </p>
          ) : null}

          <h1
            className="text-display-page max-w-[46rem] animate-hero-rise text-balance font-display font-extrabold text-foreground [animation-delay:90ms] motion-reduce:animate-none"
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            <PortableText components={headingComponents} value={title} />
          </h1>

          {stegaClean(body)?.trim() ? (
            <p
              className="mt-6 max-w-xl animate-hero-rise text-base leading-relaxed text-foreground/80 [animation-delay:180ms] motion-reduce:animate-none lg:text-lg"
              data-sanity={dataAttribute?.("body")}
            >
              {body}
            </p>
          ) : null}

          {ctaButtons.length ? (
            <div
              className="mt-8 flex flex-wrap animate-hero-rise gap-3 [animation-delay:260ms] motion-reduce:animate-none sm:gap-4"
              data-sanity={dataAttribute?.("buttons")}
            >
              {ctaButtons.map((button, index) => {
                const href = getSafeLinkHref(button.href);
                const label = stegaClean(button.text)?.trim();
                if (!href || !label) return null;
                return (
                  <Button
                    asChild
                    key={button._key}
                    lift={false}
                    onDark
                    variant={resolveHomeHeroButtonVariant(button.variant, index)}
                  >
                    <Link
                      data-sanity={dataAttribute?.(
                        `buttons[_key=="${button._key}"]`,
                      )}
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
                      {label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Facts: 2x2 hairline grid on phones, one row along the bottom edge
            on desktop. Hairlines are cream at reduced alpha, never a grey. */}
        {factList.length ? (
          <dl
            className="mt-10 grid grid-cols-2 border-t border-foreground/20 lg:mt-0 lg:flex"
            data-sanity={dataAttribute?.("facts")}
          >
            {factList.map((fact) => {
              const factPath = `facts[_key=="${fact._key}"]`;
              return (
                <div
                  className="flex flex-col gap-1.5 py-4 pr-4 even:border-l even:border-foreground/20 even:pl-4 [&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-foreground/20 lg:flex-1 lg:border-l lg:border-foreground/20 lg:py-6 lg:pl-8 lg:pr-0 lg:first:border-l-0 lg:first:pl-0 lg:[&:nth-child(n+3)]:border-t-0"
                  key={fact._key}
                >
                  {/* dt/dd keep source order for assistive tech; the value
                      is shown above its label with flex order */}
                  <dt
                    className="order-2 text-[14px] leading-snug text-foreground/75"
                    data-sanity={dataAttribute?.(`${factPath}.label`)}
                  >
                    {fact.label}
                  </dt>
                  <dd
                    className="order-1 font-display text-2xl font-bold leading-none tracking-tight text-foreground lg:text-[1.75rem]"
                    data-sanity={dataAttribute?.(`${factPath}.value`)}
                  >
                    {fact.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
