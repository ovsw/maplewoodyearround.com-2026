import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import { getSafeLinkHref } from "@/lib/safe-href";
import {
  Breadcrumbs,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceImage,
} from "./maplewood-inner";
import programs from "./maplewood-programs.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ProgramCardsProps = Extract<PageBlock, { _type: "programCards" }> & {
  dataAttribute?: DataAttribute;
  itemDataAttribute?: (documentId: string, documentType: string, path: string) => string | undefined;
};

type Offering = NonNullable<ProgramCardsProps["items"]>[number];

const usableHref = (value?: string | null) => {
  const href = getSafeLinkHref(value);
  return href && href !== "#" ? href : null;
};

/*
 * Program offerings (Webflow summer-camp_programs and additional-programs).
 * Photo cards: on desktop the hovered or focused card widens and reveals its
 * text and link; phones always show them. Additional programs are centred
 * photo, heading and text columns.
 */
export default function ProgramCards({
  _key,
  background,
  breadcrumbs,
  dataAttribute,
  description,
  itemDataAttribute,
  items,
  listingGroup,
  tagline,
  title,
}: ProgramCardsProps) {
  const offerings = (items ?? []).filter((item) => stegaClean(item.title)?.trim());
  if (!title || !offerings.length) return null;
  const headingId = `program-cards-${stegaClean(_key)}-title`;
  const columns = stegaClean(listingGroup) === "additional";
  const edit = (item: Offering, path: string) => itemDataAttribute?.(item._id, "programOffering", path);
  // With breadcrumbs the section opens the page, so its heading is the page heading.
  const Heading = breadcrumbs?.length ? "h1" : "h2";
  const ItemHeading = breadcrumbs?.length ? "h2" : "h3";

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "cream")].join(" ")}
    >
      <div className={css.container}>
        <div className={columns ? [css.narrow, css.centerText].join(" ") : programs.intro}>
          <Breadcrumbs breadcrumbs={breadcrumbs} dataAttribute={dataAttribute} onLight />
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <Heading className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </Heading>
          {stegaClean(description)?.trim() ? (
            <p className={[css.medium, programs.description].join(" ")} data-sanity={dataAttribute?.("description")}>
              {description}
            </p>
          ) : null}
        </div>
        {columns ? (
          <ul className={programs.columns}>
            {offerings.map((item) => (
              <li className={programs.column} key={item._id}>
                <div className={[css.cardSmall, programs.columnImage].join(" ")} data-sanity={edit(item, "image")}>
                  <SourceImage image={item.image} sizes="(max-width: 767px) 90vw, 30vw" width={800} />
                </div>
                <ItemHeading className={css.h5} data-sanity={edit(item, "title")}>
                  {item.title}
                </ItemHeading>
                {item.description ? <p data-sanity={edit(item, "description")}>{item.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <ul className={programs.cards}>
            {offerings.map((item) => {
              const href = usableHref(item.destination?.href);
              const content = (
                <>
                  <div className={programs.cardImage} data-sanity={edit(item, "image")}>
                    <SourceImage image={item.image} sizes="(max-width: 991px) 90vw, 40vw" width={1000} />
                    <div className={programs.cardOverlay} />
                  </div>
                  <div className={programs.cardContent}>
                    {stegaClean(item.label)?.trim() ? (
                      <p className={programs.cardLabel} data-sanity={edit(item, "label")}>
                        {item.label}
                      </p>
                    ) : null}
                    <ItemHeading className={programs.cardTitle} data-sanity={edit(item, "title")}>
                      {item.title}
                    </ItemHeading>
                    <div className={programs.cardMore}>
                      <div className={programs.cardMoreInner}>
                        {item.description ? <p data-sanity={edit(item, "description")}>{item.description}</p> : null}
                        {href && stegaClean(item.linkLabel)?.trim() ? (
                          <span className={programs.cardLink} data-sanity={edit(item, "linkLabel")}>
                            {item.linkLabel}
                            <ChevronRight aria-hidden size={16} />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              );
              return (
                <li className={programs.card} key={item._id}>
                  {href ? (
                    <Link
                      className={programs.cardInner}
                      href={href}
                      rel={item.destination?.openInNewTab ? "noopener noreferrer" : undefined}
                      target={item.destination?.openInNewTab ? "_blank" : undefined}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={programs.cardInner}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
