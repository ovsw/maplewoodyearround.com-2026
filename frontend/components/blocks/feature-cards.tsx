import { getSafeLinkHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import styles from "./feature-cards.module.css";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type FeatureCardsProps = Extract<PageBlock, { _type: "featureCards" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

/** The field utility on the section root re-points the job tokens, so only
 *  the recipes that differ between the two grounds stay here: secondary text
 *  alphas and the card fill pair. */
const fields = {
  dark: {
    description: "text-foreground/70",
    groupDescription: "text-foreground/65",
    card: "bg-fill-forest hover:bg-fill-panel",
    cardText: "text-foreground/65",
  },
  cream: {
    description: "text-muted-foreground",
    groupDescription: "text-muted-foreground",
    card: "card-cream hover:bg-fill-bright",
    cardText: "text-muted-foreground",
  },
} as const;

function headingComponents(): PortableTextComponents {
  return {
    block: { normal: ({ children }) => <>{children}</> },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => (
        <em className="font-accent not-italic text-emphasis">
          {children}
        </em>
      ),
    },
  };
}

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export function getFeatureCardImageUrl(
  image: Parameters<typeof urlFor>[0],
) {
  return urlFor(image).width(1600).height(900).fit("crop").url();
}

export function getFeatureCardColumnCount(
  cardCount: number,
  singleRowUpToFour = true,
) {
  if (cardCount === 4 && singleRowUpToFour) return 4;
  return cardCount === 3 || cardCount === 5 || cardCount === 6 ? 3 : 2;
}

export default function FeatureCards({
  _key,
  dataAttribute,
  description,
  eyebrow,
  groups,
  title,
  background,
}: FeatureCardsProps) {
  if (!title?.length || !groups?.length) return null;

  const field = stegaClean(background) === "green" ? fields.dark : fields.cream;
  const headingId = `feature-cards-${stegaClean(_key)}`;
  const renderableGroups = groups.flatMap((group) => {
    if (!hasText(group.heading)) return [];

    const cards = (group.cards ?? []).flatMap((card) => {
      const href = getSafeLinkHref(card.link?.href);
      const imageAlt = stegaClean(card.image?.alt)?.trim();
      const linkText = stegaClean(card.link?.text)?.trim();
      const title = stegaClean(card.title)?.trim();
      const text = stegaClean(card.text)?.trim();

      if (
        !card.image?.asset?._id ||
        !imageAlt ||
        !title ||
        !text ||
        !href ||
        !linkText
      ) {
        return [];
      }

      return [{ card, href }];
    });

    return cards.length >= 2 ? [{ cards, group }] : [];
  });

  if (!renderableGroups.length) return null;

  const numberedGroups = renderableGroups.map(
    ({ cards, group }, groupIndex) => ({
      cards,
      group,
      startNumber: renderableGroups
        .slice(0, groupIndex)
        .reduce((total, precedingGroup) => total + precedingGroup.cards.length, 0),
    }),
  );

  return (
    <section
      aria-labelledby={headingId}
      className={cn("py-section", sectionThemeClass(background))}
      id={`features-${stegaClean(_key)}`}
    >
      <div className="container-content">
        <header className={cn("mb-14 max-w-3xl", styles.reveal)}>
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
            <PortableText components={headingComponents()} value={title} />
          </h2>

          {hasText(description) ? (
            <p
              className={cn(
                "mt-5 max-w-xl text-pretty text-lg/relaxed",
                field.description,
              )}
              data-sanity={dataAttribute?.("description")}
            >
              {description}
            </p>
          ) : null}
        </header>

        <div className="grid gap-16">
          {numberedGroups.map(({ cards, group, startNumber }) => {
            const groupPath = `groups[_key=="${group._key}"]`;

            const columnCount = getFeatureCardColumnCount(
              cards.length,
              stegaClean(group.singleRowUpToFour) !== false,
            );

            return (
              <section
                aria-labelledby={`${headingId}-${group._key}`}
                className={styles.reveal}
                data-sanity={dataAttribute?.(
                  `${groupPath}.singleRowUpToFour`,
                )}
                key={group._key}
              >
                <header className="mb-6 max-w-2xl">
                  <h3
                    className="font-display text-3xl font-extrabold tracking-tight"
                    data-sanity={dataAttribute?.(`${groupPath}.heading`)}
                    id={`${headingId}-${group._key}`}
                  >
                    {group.heading}
                  </h3>
                  {hasText(group.description) ? (
                    <p
                      className={cn(
                        "mt-2 text-pretty text-base/relaxed",
                        field.groupDescription,
                      )}
                      data-sanity={dataAttribute?.(`${groupPath}.description`)}
                    >
                      {group.description}
                    </p>
                  ) : null}
                </header>

                <ol
                  className={cn(
                    "grid list-none gap-px overflow-hidden rounded-lg bg-foreground/15 p-0 md:grid-cols-2",
                    columnCount === 3 && "lg:grid-cols-3",
                    columnCount === 4 && "lg:grid-cols-4",
                  )}
                  data-sanity={dataAttribute?.(`${groupPath}.cards`)}
                >
                  {cards.map(({ card, href }, cardIndex) => {
                    const cardPath = `${groupPath}.cards[_key=="${card._key}"]`;
                    const number = String(startNumber + cardIndex + 1).padStart(
                      2,
                      "0",
                    );

                    return (
                      <li
                        className={cn(
                          "group/card flex min-w-0 flex-col transition-colors duration-300",
                          field.card,
                        )}
                        key={card._key}
                      >
                        <div
                          className="relative aspect-video overflow-hidden bg-fill-panel on-dark"
                          data-sanity={dataAttribute?.(`${cardPath}.image`)}
                        >
                          {card.image?.asset?._id ? (
                            <Image
                              alt={stegaClean(card.image.alt) || ""}
                              blurDataURL={
                                card.image.asset.metadata?.lqip || undefined
                              }
                              className="object-cover saturate-90 transition-[scale,filter] duration-300 group-hover/card:scale-[1.03] group-hover/card:saturate-100 motion-reduce:transition-none"
                              fill
                              placeholder={
                                card.image.asset.metadata?.lqip
                                  ? "blur"
                                  : undefined
                              }
                              sizes={
                                columnCount === 4
                                  ? "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                                  : columnCount === 3
                                  ? "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                  : "(min-width: 768px) 50vw, 100vw"
                              }
                              src={getFeatureCardImageUrl(card.image)}
                            />
                          ) : null}
                          {/* The number is a chip mark, so it sits on a soft
                              dark gradient at the image edge rather than
                              inside a glass capsule (The Pill Is a Button Rule). */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-fill-night/70 to-transparent"
                          />
                          <span
                            aria-hidden="true"
                            className="absolute left-6 top-5 font-mono text-[14px] leading-snug font-medium tracking-[0.01em] text-foreground transition-colors duration-300 group-hover/card:text-link"
                          >
                            {number}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-6">
                          <h4
                            className="font-display text-2xl font-extrabold tracking-tight"
                            data-sanity={dataAttribute?.(`${cardPath}.title`)}
                          >
                            {card.title}
                          </h4>
                          <p
                            className={cn(
                              "mt-3 text-pretty text-base/relaxed",
                              field.cardText,
                            )}
                            data-sanity={dataAttribute?.(`${cardPath}.text`)}
                          >
                            {card.text}
                          </p>
                          <Link
                            className={cn(
                              "focus-ring mt-5 inline-flex w-fit items-center gap-2 font-semibold text-prose-link underline-offset-4 decoration-current/40 group-hover/card:underline hover:text-prose-link-hover",
                            )}
                            data-sanity={dataAttribute?.(`${cardPath}.link`)}
                            href={href}
                            rel={
                              stegaClean(card.link?.openInNewTab)
                                ? "noopener noreferrer"
                                : undefined
                            }
                            target={
                              stegaClean(card.link?.openInNewTab)
                                ? "_blank"
                                : undefined
                            }
                          >
                            <span
                              data-sanity={dataAttribute?.(
                                `${cardPath}.link.text`,
                              )}
                            >
                              {card.link?.text}
                            </span>
                            <ArrowRight
                              aria-hidden="true"
                              className="size-4 transition-transform duration-200 group-hover/card:translate-x-1 motion-reduce:transition-none"
                            />
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
