import { stegaClean } from "next-sanity";
import type { HOME_PAGE_QUERY_RESULT, PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceActions,
  SourceCopy,
  SourceImage,
  SourcePoints,
} from "./maplewood-inner";
import programs from "./maplewood-programs.module.css";

type PageBlock =
  | NonNullable<NonNullable<HOME_PAGE_QUERY_RESULT>["blocks"]>[number]
  | NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];

type ElectiveCardsProps = Extract<PageBlock, { _type: "electiveCards" }> & {
  dataAttribute?: DataAttribute;
};

/*
 * Club Day electives (Webflow summer-camp_club-day-electives): label,
 * heading, lead sentence, text and coloured points beside a white-framed
 * photo on the green field.
 */
export default function ElectiveCards({
  _key,
  actions,
  background,
  content,
  dataAttribute,
  description,
  features,
  image,
  tagline,
  title,
}: ElectiveCardsProps) {
  if (!title) return null;
  const headingId = `elective-cards-${stegaClean(_key)}-title`;
  const hasImage = Boolean(image?.asset?._id);

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "green")].join(" ")}
    >
      <div className={[css.container, css.story, hasImage ? "" : css.storyTextOnly].join(" ")}>
        <div className={css.storyCopy}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <h2 className={css.h2} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          {stegaClean(description)?.trim() ? (
            <p className={programs.lead} data-sanity={dataAttribute?.("description")}>
              {description}
            </p>
          ) : null}
          <SourceCopy className={css.storyText} dataSanity={dataAttribute?.("content")} value={content} />
          <SourcePoints dataAttribute={dataAttribute} points={features} />
          <SourceActions actions={actions} dataAttribute={dataAttribute} />
        </div>
        {hasImage ? (
          <div
            className={[css.storyMedia, css.card, programs.whiteCard].join(" ")}
            data-sanity={dataAttribute?.("image")}
          >
            <SourceImage image={image} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
