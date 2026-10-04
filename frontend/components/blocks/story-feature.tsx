import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceButtons,
  SourceCopy,
  SourceImage,
  SourcePoints,
} from "./maplewood-inner";

type StoryFeatureProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "storyFeature" }
> & { dataAttribute?: DataAttribute };

const plain = (value: StoryFeatureProps["title"]) =>
  (value ?? [])
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .join(" ")
    .trim();

/*
 * Image and text (Webflow layout10, layout203 and layout30): label, heading,
 * copy, up to four icon points and buttons beside a framed square photo.
 */
export default function StoryFeature({
  _key,
  background,
  buttons,
  dataAttribute,
  features,
  headingSize,
  image,
  imagePosition,
  richText,
  tagline,
  title,
}: StoryFeatureProps) {
  const heading = plain(title);
  const hasImage = Boolean(image?.asset?._id);
  if (!heading && !features?.length && !richText?.length) return null;
  const headingId = heading ? `story-feature-${stegaClean(_key)}-title` : undefined;
  const small = stegaClean(headingSize) === "small";

  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, sectionBackground(background, "white")].join(" ")}
    >
      <div
        className={[
          css.container,
          css.story,
          stegaClean(imagePosition) === "left" ? css.storyImageLeft : "",
          hasImage ? "" : css.storyTextOnly,
        ].join(" ")}
      >
        <div className={css.storyCopy}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          {heading ? (
            <h2
              className={small ? css.h4 : css.h2}
              data-sanity={dataAttribute?.("title")}
              id={headingId}
            >
              {heading}
            </h2>
          ) : null}
          <SourceCopy
            className={small ? css.storyTextSmall : css.storyText}
            dataSanity={dataAttribute?.("richText")}
            value={richText}
          />
          <SourcePoints dataAttribute={dataAttribute} points={features} />
          <div className={css.storyButtons}>
            <SourceButtons buttons={buttons} dataAttribute={dataAttribute} />
          </div>
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
