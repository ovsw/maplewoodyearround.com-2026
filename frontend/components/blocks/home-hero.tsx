import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import HomeHeroBackgroundVideo from "@/components/blocks/home-hero-background-video";
import { Button } from "@/components/ui/button";
import { NavigationIcon } from "@/components/header/navigation-icon";
import HomeHeroVideoLightbox from "@/components/blocks/home-hero-video-lightbox";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { getSafeLinkHref } from "@/lib/safe-href";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import type { ComponentProps } from "react";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type HomeHeroBlock = Extract<PageBlock, { _type: "homeHero" }>;

type HomeHeroProps = HomeHeroBlock & {
  dataAttribute?: (path: string) => string | undefined;
};

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;

export function resolveHomeHeroButtonVariant(
  variant: string | null | undefined,
  index: number,
): ButtonVariant {
  const cleanVariant = stegaClean(variant);

  if (
    cleanVariant === "default" ||
    cleanVariant === "secondary" ||
    cleanVariant === "outline" ||
    cleanVariant === "ghost" ||
    cleanVariant === "link"
  ) {
    return cleanVariant;
  }

  return index === 0 ? "outline" : "ghost";
}

/** Minimal rich text: bold/italic only, italic gets the accent (handwritten) style. */
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

/** Play glyph for the film button; the icon is fixed, not editor-picked. */
const playIcon = {
  name: "play",
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path></svg>',
};

export default function HomeHero({
  _key,
  body,
  buttons,
  dataAttribute,
  disableVideo,
  filmButton,
  image,
  shortBody,
  stats,
  title,
  videoUrl,
}: HomeHeroProps) {
  if (!title?.length) return null;

  const headingId = `home-hero-${stegaClean(_key)}-title`;
  const cleanVideoUrl = disableVideo ? undefined : stegaClean(videoUrl)?.trim();
  const posterUrl =
    image?.asset?._id
      ? urlFor(image).width(1920).height(1080).fit("crop").url()
      : undefined;

  const ctaButtons = buttons?.slice(0, 2) ?? [];
  const buttonPath = (key: string) => `buttons[_key=="${key}"]`;
  const filmUrl = stegaClean(filmButton?.url)?.trim();
  const filmLabel = stegaClean(filmButton?.label)?.trim() || "Watch the film";

  return (
    <section
      aria-labelledby={headingId}
      className="relative flex min-h-dvh flex-col overflow-hidden field-green lg:min-h-[min(85svh,60rem)]"
      data-header-overlay
      id={`hero-${stegaClean(_key)}`}
    >
      {/* Media — poster block on phones, full-bleed backdrop on desktop */}
      <div className="relative h-[52dvh] shrink-0 lg:absolute lg:inset-0 lg:h-auto">
        {image?.asset?._id ? (
          <Image
            alt={stegaClean(image.alt) || ""}
            blurDataURL={image.asset.metadata?.lqip || undefined}
            className="object-cover"
            style={
              image.hotspot?.x != null && image.hotspot.y != null
                ? {
                    objectPosition: `${image.hotspot.x * 100}% ${image.hotspot.y * 100}%`,
                  }
                : undefined
            }
            data-sanity={dataAttribute?.("image")}
            fill
            placeholder={image.asset.metadata?.lqip ? "blur" : undefined}
            priority
            sizes="100vw"
            src={urlFor(image).width(1920).height(1080).fit("crop").url()}
          />
        ) : null}
        {cleanVideoUrl ? (
          <HomeHeroBackgroundVideo poster={posterUrl} src={cleanVideoUrl} />
        ) : null}

        {/* Gradient overlays: nav-legibility fade on phones, full wash on desktop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-fill-night/55 to-transparent to-40% lg:hidden"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-b from-black/50 via-black/10 to-black/70 lg:block"
        />

        {/* Film button sits on the poster on phones */}
        {filmUrl ? (
          <div
            className="absolute bottom-5 left-5 z-10 lg:hidden"
            data-sanity={dataAttribute?.("filmButton")}
          >
            <HomeHeroVideoLightbox
              buttonKey="film-button"
              glass
              href={filmUrl}
              icon={playIcon}
              label={filmLabel}
              size="default"
              variant="ghost"
            />
          </div>
        ) : null}
      </div>

      {/* Copy — solid plate below the poster on phones, overlay on desktop.
          On phones the bottom padding is the resolved `--section-pad-bottom`,
          so the CTA plate clears a tucked section below like any other
          section's last row. On desktop the hero stops short of the fold
          (85svh, capped at 60rem) so the next section shows and tells the
          visitor there is more; the stats bar sits flush at its bottom edge.
          The copy must not claim a full viewport of its own or the stats
          push the hero past the fold. */}
      <div className="relative z-10 flex flex-1 flex-col px-content-x pb-(--section-pad-bottom) pt-7 lg:justify-end lg:pt-32 lg:pb-10">
        {/* Title */}
        <h1
          className="mb-6 max-w-[65rem] font-display text-display-hero leading-[0.96] tracking-tight text-foreground max-lg:text-[2.875rem]"
          data-sanity={dataAttribute?.("title")}
          id={headingId}
        >
          <PortableText components={headingComponents} value={title} />
        </h1>

        {/* Body + CTAs row */}
        <div className="flex flex-1 flex-col gap-8 lg:flex-none lg:flex-row lg:items-end lg:gap-12">
          {/* Full body (desktop) */}
          {body?.length ? (
            <div
              className="hidden max-w-xl text-lg leading-relaxed text-white/85 lg:block"
              data-sanity={dataAttribute?.("body")}
            >
              <PortableText components={simpleRichTextComponents} value={body} />
            </div>
          ) : null}

          {/* Short body (mobile) */}
          {stegaClean(shortBody)?.trim() ? (
            <p
              className="max-w-md text-base leading-normal text-white/85 lg:hidden"
              data-sanity={dataAttribute?.("shortBody")}
            >
              {shortBody}
            </p>
          ) : body?.length ? (
            <div className="max-w-md text-base leading-normal text-white/85 lg:hidden">
              <PortableText components={simpleRichTextComponents} value={body} />
            </div>
          ) : null}

          {/* CTAs — desktop row: array order and CMS styles, film button last */}
          {ctaButtons.length || filmUrl ? (
            <div
              className="hidden lg:ml-auto lg:flex lg:flex-none lg:items-center lg:gap-4"
              data-sanity={dataAttribute?.("buttons")}
            >
              {ctaButtons.map((button, index) => {
                const href = getSafeLinkHref(button.href);
                const label = stegaClean(button.text) || "Learn more";
                const variant = resolveHomeHeroButtonVariant(
                  button.variant,
                  index,
                );
                const iconName = stegaClean(button.icon?.name)?.trim();
                const iconSvg = stegaClean(button.icon?.svg)?.trim();
                if (!href) return null;

                return (
                  <Button
                    asChild
                    key={button._key}
                    lift={false}
                    onDark
                    size="hero"
                    variant={variant}
                  >
                    <Link
                      data-sanity={dataAttribute?.(buttonPath(button._key))}
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
                      {iconName && iconSvg ? (
                        <NavigationIcon
                          icon={{ name: iconName, svg: iconSvg }}
                        />
                      ) : null}
                      {label}
                    </Link>
                  </Button>
                );
              })}
              {filmUrl ? (
                <div data-sanity={dataAttribute?.("filmButton")}>
                  <HomeHeroVideoLightbox
                    buttonKey="film-button"
                    href={filmUrl}
                    icon={playIcon}
                    label={filmLabel}
                    variant="ghost"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* CTAs — phone plate: the buttons side by side above the stats,
              order and style straight from the Studio array */}
          {ctaButtons.length ? (
            <div
              className="mt-auto flex w-full items-stretch gap-3 lg:hidden"
              data-sanity={dataAttribute?.("buttons")}
            >
              {ctaButtons.map((button, index) => {
                const href = getSafeLinkHref(button.href);
                const label = stegaClean(button.text) || "Learn more";
                const variant = resolveHomeHeroButtonVariant(
                  button.variant,
                  index,
                );
                const iconName = stegaClean(button.icon?.name)?.trim();
                const iconSvg = stegaClean(button.icon?.svg)?.trim();
                if (!href) return null;

                return (
                  <Button
                    asChild
                    className="min-w-0 flex-1 px-4"
                    key={button._key}
                    lift={false}
                    onDark
                    size="hero"
                    variant={variant}
                  >
                    <Link
                      data-sanity={dataAttribute?.(buttonPath(button._key))}
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
                      {iconName && iconSvg ? (
                        <NavigationIcon
                          icon={{ name: iconName, svg: iconSvg }}
                        />
                      ) : null}
                      {label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Stats bar — the hero's last row on desktop, sitting at its bottom
          edge with a 2rem margin. The resolved `--section-pad-bottom` minus
          the base rhythm is zero at an edge and the tuck overlap when a
          rounded section follows, so the row still clears a tucker. */}
      {stats?.length ? (
        <div
          className="relative z-10 grid grid-cols-2 border-t border-white/20 px-content-x md:flex md:gap-0 lg:pb-[calc(var(--section-pad-bottom)_-_var(--section-pad)_+_2rem)]"
          data-sanity={dataAttribute?.("stats")}
        >
          {stats.map((stat) => {
            const statPath = `stats[_key=="${stat._key}"]`;
            return (
              <div
                className="flex flex-col gap-1 py-4 pr-4 even:border-l even:border-white/20 even:pl-4 [&:nth-child(n+3)]:border-t [&:nth-child(n+3)]:border-white/20 md:flex-1 md:border-l md:border-white/20 md:py-5 md:pl-8 md:pr-0 md:first:border-l-0 md:first:pl-0 md:[&:nth-child(n+3)]:border-t-0"
                key={stat._key}
              >
                <span
                  className="font-display text-xl font-bold leading-none text-foreground"
                  data-sanity={dataAttribute?.(`${statPath}.value`)}
                >
                  {stat.value}
                </span>
                <span
                  className="text-[14px] leading-snug text-white/75"
                  data-sanity={dataAttribute?.(`${statPath}.label`)}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
