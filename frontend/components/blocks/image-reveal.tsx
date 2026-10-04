import { PortableText, type PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import { richTextContentComponents } from "@/components/rich-text-content";
import HomeScrollMotion from "./home-scroll-motion";
import {
  SectionActions,
  HighlightedTitle,
  SectionImage,
  type SectionProps,
} from "./maplewood-section";
import css from "./maplewood-home.module.css";
const revealTextComponents: PortableTextProps["components"] = {
  ...richTextContentComponents,
  marks: {
    ...richTextContentComponents?.marks,
    strong: ({ children, text }) => {
      const program = stegaClean(text);
      const className =
        program === "Summer Camp"
          ? css.summerBadge
          : program === "School Year"
            ? css.schoolBadge
            : undefined;
      return <strong className={className}>{children}</strong>;
    },
  },
};
export default function ImageReveal({
  title,
  highlightText,
  eyebrow,
  body,
  description,
  image,
  actions,
  dataAttribute,
}: SectionProps<"imageReveal">) {
  return (
    <section className={css.yearRound}>
      <HomeScrollMotion kind="reveal" className={css.reveal}>
        <div className={css.revealText}>
          {eyebrow ? (
            <p className={css.eyebrow} data-sanity={dataAttribute?.("eyebrow")}>
              {eyebrow}
            </p>
          ) : null}
          <h2 data-sanity={dataAttribute?.("title")}>
            <HighlightedTitle title={title} highlightText={highlightText} />
          </h2>
          <div
            className={css.body}
            data-sanity={dataAttribute?.(body?.length ? "body" : "description")}
          >
            {body?.length ? (
              <PortableText value={body} components={revealTextComponents} />
            ) : (
              <p>{description}</p>
            )}
          </div>
          <SectionActions actions={actions} dataAttribute={dataAttribute} />
        </div>
        <div
          className={css.revealImage}
          data-reveal-image
          data-sanity={dataAttribute?.("image")}
        >
          <SectionImage image={image} />
        </div>
      </HomeScrollMotion>
    </section>
  );
}
