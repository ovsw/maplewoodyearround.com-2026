import { NavigationIcon } from "@/components/header/navigation-icon";
import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import { cn } from "@/lib/utils";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import styles from "./benefit-cards.module.css";
import { sectionThemeClass } from "./section-theme";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type BenefitCardsProps = Extract<PageBlock, { _type: "benefitCards" }> & {
  dataAttribute?: (path: string) => string | undefined;
};

/*
 * Feature Grid — hairline-grid tiles (The Hairline Grid).
 *
 * 1px gaps over a translucent background draw the grid; tiles have no
 * radius or border of their own and never lift, they tint on hover. The
 * icon sits in a pill outline, coloured accent on the dark field and link colour
 * on cream, so amber stays reserved for the page's actions.
 */
type Field = { cream: boolean };

const headingComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => (
      <em className="font-accent not-italic text-emphasis">{children}</em>
    ),
  },
};

function bodyComponents({ cream }: Field): PortableTextComponents {
  return {
    ...simpleRichTextComponents,
    marks: {
      ...simpleRichTextComponents?.marks,
      customLink: createCustomLinkMarkRenderer(
        cream
          ? "font-medium text-prose-link underline decoration-prose-link/30 underline-offset-4 hover:text-prose-link-hover hover:decoration-prose-link-hover"
          : // On the Green field the link rests on the prose hover colour
            // (accent) and brightens to the foreground (foreground).
            "font-medium text-prose-link-hover underline decoration-prose-link-hover/40 underline-offset-4 hover:text-foreground hover:decoration-foreground",
      ),
    },
  };
}

function hasText(value?: string | null) {
  return Boolean(stegaClean(value)?.trim());
}

export function getBenefitCardColumnCount(cardCount: number) {
  if (cardCount >= 4 && cardCount !== 5 && cardCount !== 6) return 4;
  return cardCount >= 3 ? 3 : Math.max(cardCount, 1);
}

/**
 * Classes for the last tile so every grid row is full. A partial final row
 * would otherwise show the hairline background as an empty grey cell, which
 * reads as missing content rather than as part of the grid.
 */
export function getBenefitCardLastTileClass(cardCount: number) {
  const columnCount = getBenefitCardColumnCount(cardCount);
  if (columnCount < 2) return "";
  const classes: string[] = [];
  // Two columns from `sm`: an odd count leaves one empty cell.
  if (cardCount % 2 === 1) classes.push("sm:col-span-2");
  if (columnCount >= 3) {
    const remainder = cardCount % columnCount;
    const span = remainder === 0 ? 1 : columnCount - remainder + 1;
    const spanClass = {
      1: "lg:col-span-1",
      2: "lg:col-span-2",
      3: "lg:col-span-3",
      4: "lg:col-span-4",
    }[span];
    // Only needed when the `sm` span must be reset or widened at `lg`.
    if (spanClass && (span > 1 || classes.length)) classes.push(spanClass);
  }
  return classes.join(" ");
}

export default function BenefitCards({
  _key,
  cards,
  dataAttribute,
  eyebrow,
  intro,
  title,
  background,
}: BenefitCardsProps) {
  if (!title?.length || !cards?.length) return null;

  const cream = stegaClean(background) !== "green";
  const cleanKey = stegaClean(_key);
  const headingId = `benefit-cards-${cleanKey}-title`;
  const columnCount = getBenefitCardColumnCount(cards.length);
  const lastTileClass = getBenefitCardLastTileClass(cards.length);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-24 py-section",
        sectionThemeClass(background),
      )}
      id={`benefits-${cleanKey}`}
    >
      <div className="container-content">
        <header className={cn("max-w-3xl", styles.reveal)}>
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
          {hasText(intro) ? (
            <p
              className="mt-6 max-w-[38rem] text-pretty text-[17px] leading-[1.6] text-muted-foreground"
              data-sanity={dataAttribute?.("intro")}
            >
              {intro}
            </p>
          ) : null}
        </header>

        <ol
          className={cn(
            "mt-12 grid list-none gap-px overflow-hidden rounded-lg bg-foreground/15 p-0 lg:mt-16",
            columnCount >= 2 && "sm:grid-cols-2",
            columnCount === 3 && "lg:grid-cols-3",
            columnCount === 4 && "lg:grid-cols-4",
            styles.reveal,
          )}
          data-sanity={dataAttribute?.("cards")}
        >
          {cards.map((card, index) => {
            const cardPath = `cards[_key=="${card._key}"]`;
            // stegaClean both icon parts: in draft mode Sanity injects
            // invisible stega characters into every string, and the encoded
            // svg fails NavigationIcon's fail-closed markup check.
            const iconName = stegaClean(card.icon?.name)?.trim();
            const iconSvg = stegaClean(card.icon?.svg)?.trim() || null;

            return (
              <li
                className={cn(
                  // min-w-0 lets a card narrower than its longest word (an
                  // email address in a title) instead of widening the grid.
                  "flex h-full min-w-0 flex-col gap-5 p-7 transition-colors duration-300 lg:p-8",
                  cream
                    ? "card-cream hover:bg-foreground/5"
                    : "bg-fill-forest hover:bg-white/5",
                  index === cards.length - 1 && lastTileClass,
                )}
                key={card._key}
              >
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border [&_svg]:size-5",
                      cream
                        ? "border-foreground/18 text-link"
                        : "border-foreground/22 text-prose-link",
                    )}
                    data-sanity={dataAttribute?.(`${cardPath}.icon`)}
                  >
                    {iconName && iconSvg ? (
                      <NavigationIcon icon={{ name: iconName, svg: iconSvg }} />
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "text-label",
                      cream ? "text-muted-foreground" : "text-foreground/45",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                {hasText(card.title) ? (
                  <h3
                    className="font-display text-title text-foreground wrap-break-word"
                    data-sanity={dataAttribute?.(`${cardPath}.title`)}
                  >
                    {card.title}
                  </h3>
                ) : null}
                {card.body?.length ? (
                  <div
                    className="grid gap-3 text-pretty text-[15px] leading-[1.55] text-muted-foreground wrap-break-word"
                    data-sanity={dataAttribute?.(`${cardPath}.body`)}
                  >
                    <PortableText
                      components={bodyComponents({ cream })}
                      value={card.body}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
