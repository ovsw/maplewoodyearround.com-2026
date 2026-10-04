import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  Breadcrumbs,
  type DataAttribute,
  HighlightedHeading,
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
  highlightText,
  image,
  linksLabel,
  title,
}: InnerHeroProps) {
  const heading = plain(title);
  if (!heading) return null;
  const headingId = `inner-hero-${stegaClean(_key)}-title`;

  return (
    <header aria-labelledby={headingId} className={css.hero} data-sanity={dataAttribute?.("image")}>
      <div className={css.heroBackground}>
        <div className={css.heroImageWrap}>
          <div className={css.heroOverlay} />
          <SourceImage className={css.heroImage} image={image} priority sizes="100vw" width={1800} />
        </div>
      </div>
      <div className={css.heroContain}>
        {/* Without a photo the live page centres the text in a reading column. */}
        <div className={[css.heroInner, image?.asset ? "" : css.heroInnerNarrow].join(" ")}>
          <div className={css.heroContent}>
            <Breadcrumbs breadcrumbs={breadcrumbs} dataAttribute={dataAttribute} />
            {stegaClean(eyebrow)?.trim() ? (
              <p className={css.heroEyebrow} data-sanity={dataAttribute?.("eyebrow")}>
                {eyebrow}
              </p>
            ) : null}
            <h1 className={css.heroTitle} data-sanity={dataAttribute?.("title")} id={headingId}>
              <HighlightedHeading className={css.heroHighlight} highlight={highlightText} text={heading} />
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
