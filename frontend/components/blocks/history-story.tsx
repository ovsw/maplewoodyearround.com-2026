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

type HistoryStoryProps = Extract<PageBlock, { _type: "historyStory" }> & {
  dataAttribute?: DataAttribute;
};

/*
 * Camp history (Webflow summer-camp_history): label, heading, story and
 * points beside a framed historical photo.
 */
export default function HistoryStory({
  _key,
  actions,
  background,
  body,
  dataAttribute,
  features,
  image,
  tagline,
  title,
}: HistoryStoryProps) {
  if (!title) return null;
  const headingId = `history-story-${stegaClean(_key)}-title`;
  const hasImage = Boolean(image?.asset?._id);

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "white")].join(" ")}
    >
      <div className={[css.container, css.story, hasImage ? "" : css.storyTextOnly].join(" ")}>
        <div className={css.storyCopy}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <h2 className={[css.h2, programs.h3].join(" ")} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          <SourceCopy className={css.storyText} dataSanity={dataAttribute?.("body")} value={body} />
          <SourcePoints dataAttribute={dataAttribute} points={features} />
          <SourceActions actions={actions} dataAttribute={dataAttribute} />
        </div>
        {hasImage ? (
          <div className={[css.storyMedia, css.card].join(" ")} data-sanity={dataAttribute?.("image")}>
            <SourceImage image={image} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
