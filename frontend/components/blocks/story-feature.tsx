import { PortableText } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { simpleRichTextComponents } from "@/components/simple-rich-text";
import {
  accentClass,
  type DataAttribute,
  innerCss as css,
  sectionBackground,
  SectionTagline,
  SourceButtons,
  SourceCopy,
  SourceIcon,
  SourceImage,
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
  if (!heading) return null;
  const headingId = `story-feature-${stegaClean(_key)}-title`;
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
        ].join(" ")}
      >
        <div className={css.storyCopy}>
          <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
          <h2
            className={small ? css.h4 : css.h2}
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            {heading}
          </h2>
          <SourceCopy
            className={small ? css.storyTextSmall : css.storyText}
            dataSanity={dataAttribute?.("richText")}
            value={richText}
          />
          {features?.length ? (
            <div className={css.points}>
              {features.map((feature) => (
                <div
                  className={[css.point, accentClass(feature.accent)].join(" ")}
                  data-sanity={dataAttribute?.(`features[_key=="${feature._key}"]`)}
                  key={feature._key}
                >
                  <SourceIcon
                    dataSanity={dataAttribute?.(`features[_key=="${feature._key}"].icon`)}
                    icon={feature.icon}
                  />
                  <h3 className={css.h6}>{feature.title}</h3>
                  {feature.body?.length ? (
                    <div className={css.copy}>
                      <PortableText components={simpleRichTextComponents} value={feature.body} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div className={css.storyButtons}>
            <SourceButtons buttons={buttons} dataAttribute={dataAttribute} />
          </div>
        </div>
        <div className={[css.storyMedia, css.card].join(" ")} data-sanity={dataAttribute?.("image")}>
          <SourceImage image={image} />
        </div>
      </div>
    </section>
  );
}
