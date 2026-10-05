import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  accentClass,
  Breadcrumbs,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceCopy,
  SourceIcon,
  visibleActions,
} from "./maplewood-inner";
import styles from "./icon-cards.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type IconCardsProps = Extract<PageBlock, { _type: "iconCards" }> & {
  dataAttribute?: DataAttribute;
};

/*
 * A heading beside its introduction, then a row of icon cards with a link
 * (Webflow layout248 and layout311, such as the School Year programs).
 */
export default function IconCards({
  _key,
  background,
  breadcrumbs,
  cards,
  dataAttribute,
  intro,
  tagline,
  title,
}: IconCardsProps) {
  const items = (cards ?? []).filter((card) => stegaClean(card.title)?.trim());
  if (!title || !items.length) return null;
  const headingId = `icon-cards-${stegaClean(_key)}-title`;
  // With breadcrumbs the section opens the page, so its heading is the page heading.
  const Heading = breadcrumbs?.length ? "h1" : "h2";
  const CardHeading = breadcrumbs?.length ? "h2" : "h3";

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
    >
      <div className={css.container}>
        <div className={styles.intro}>
          <div>
            <Breadcrumbs breadcrumbs={breadcrumbs} dataAttribute={dataAttribute} onLight />
            <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
            <Heading className={[css.h2, styles.title].join(" ")} data-sanity={dataAttribute?.("title")} id={headingId}>
              {title}
            </Heading>
          </div>
          <SourceCopy className={css.medium} dataSanity={dataAttribute?.("intro")} value={intro} />
        </div>
        <ul className={styles.cards}>
          {items.map((card) => {
            const path = `cards[_key=="${card._key}"]`;
            const [link] = visibleActions(card.link ? [{ _key: card._key, ...card.link }] : []);
            return (
              <li className={[styles.card, accentClass(card.accent)].join(" ")} data-sanity={dataAttribute?.(path)} key={card._key}>
                <SourceIcon dataSanity={dataAttribute?.(`${path}.icon`)} icon={card.icon} />
                <div className={styles.text}>
                  <CardHeading className={css.h6}>{card.title}</CardHeading>
                  {stegaClean(card.label)?.trim() ? <p className={styles.label}>{card.label}</p> : null}
                  {card.body?.length ? (
                    <div className={[css.copy, styles.body].join(" ")}>
                      <PortableText components={simpleRichTextComponents} value={card.body} />
                    </div>
                  ) : null}
                  {link ? (
                    <Link
                      className={styles.link}
                      data-sanity={dataAttribute?.(`${path}.link`)}
                      href={link.href}
                      rel={stegaClean(link.destination?.openInNewTab) ? "noopener noreferrer" : undefined}
                      target={stegaClean(link.destination?.openInNewTab) ? "_blank" : undefined}
                    >
                      {link.label}
                      <ChevronRight aria-hidden size={16} />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
