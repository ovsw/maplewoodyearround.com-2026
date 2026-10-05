import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import {
  type DataAttribute,
  innerCss as css,
  SectionTagline,
  SourceCopy,
} from "./maplewood-inner";
import about from "./maplewood-about.module.css";

type RichTextBlockProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "richTextBlock" }
> & { dataAttribute?: DataAttribute };

/** Text section: label, heading and copy in a centred reading column, or a policy document. */
export default function RichTextBlock({
  _key,
  align,
  background,
  dataAttribute,
  richText,
  tagline,
  title,
}: RichTextBlockProps) {
  if (!title && !richText?.length) return null;
  const headingId = title ? `rich-text-${stegaClean(_key)}-title` : undefined;
  const centered = stegaClean(align) === "center";
  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, css.sectionMedium, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={[css.narrow, centered ? css.richCenter : ""].join(" ")}>
        <SectionTagline dataAttribute={dataAttribute} tagline={tagline} />
        {title ? (
          <h2
            className={[centered ? css.h2 : css.h4, css.richTitle].join(" ")}
            data-sanity={dataAttribute?.("title")}
            id={headingId}
          >
            {title}
          </h2>
        ) : null}
        <SourceCopy
          // Without a section heading the copy is a document, such as a policy.
          className={title ? css.medium : about.document}
          dataSanity={dataAttribute?.("richText")}
          value={richText}
        />
      </div>
    </section>
  );
}
