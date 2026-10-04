import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { stegaClean } from "next-sanity";
import { getSafeLinkHref } from "@/lib/safe-href";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  SourceButtons,
  SourceImage,
} from "./maplewood-inner";

type InnerHeroProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "innerHero" }
> & { dataAttribute?: DataAttribute };

const plain = (value: InnerHeroProps["title"]) =>
  (value ?? [])
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .join(" ")
    .trim();

/*
 * Inner page header (Webflow header50): breadcrumbs, display heading,
 * introduction and the page's section links or buttons on the green field,
 * with the photo fading in from the right.
 */
export default function InnerHero({
  _key,
  body,
  breadcrumbs,
  buttons,
  dataAttribute,
  eyebrow,
  image,
  linksLabel,
  title,
}: InnerHeroProps) {
  const heading = plain(title);
  if (!heading) return null;
  const headingId = `inner-hero-${stegaClean(_key)}-title`;
  const crumbs = (breadcrumbs ?? []).filter((crumb) => stegaClean(crumb.label)?.trim());

  return (
    <header aria-labelledby={headingId} className={css.hero} data-sanity={dataAttribute?.("image")}>
      <div className={css.heroBackground}>
        <div className={css.heroImageWrap}>
          <div className={css.heroOverlay} />
          <SourceImage className={css.heroImage} image={image} priority sizes="100vw" width={1800} />
        </div>
      </div>
      <div className={css.heroContain}>
        <div className={css.heroInner}>
          <div className={css.heroContent}>
            {crumbs.length ? (
              <nav aria-label="Breadcrumb" data-sanity={dataAttribute?.("breadcrumbs")}>
                <ol className={css.breadcrumbs}>
                  {crumbs.map((crumb) => {
                    const href = getSafeLinkHref(crumb.destination?.href);
                    const program = stegaClean(crumb.program);
                    const label = (
                      <span
                        className={
                          program === "schoolYear"
                            ? css.badgeSchool
                            : program === "summerCamp"
                              ? css.badgeSummer
                              : undefined
                        }
                      >
                        {crumb.label}
                      </span>
                    );
                    return (
                      <li key={crumb._key}>
                        {href && href !== "#" ? <Link href={href}>{label}</Link> : label}
                        <ChevronRight aria-hidden size={16} />
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : null}
            {stegaClean(eyebrow)?.trim() ? (
              <p className={css.heroEyebrow} data-sanity={dataAttribute?.("eyebrow")}>
                {eyebrow}
              </p>
            ) : null}
            <h1 className={css.heroTitle} data-sanity={dataAttribute?.("title")} id={headingId}>
              {heading}
            </h1>
            {stegaClean(body)?.trim() ? (
              <p className={css.heroBody} data-sanity={dataAttribute?.("body")}>
                {body}
              </p>
            ) : null}
            {buttons?.length ? (
              <div className={css.heroLinks}>
                {stegaClean(linksLabel)?.trim() ? (
                  <span className={css.heroLinksLabel} data-sanity={dataAttribute?.("linksLabel")}>
                    {linksLabel}
                  </span>
                ) : null}
                <SourceButtons buttons={buttons} dataAttribute={dataAttribute} onDark />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
