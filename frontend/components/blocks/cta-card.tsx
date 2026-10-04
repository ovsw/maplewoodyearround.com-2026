import { PortableText, type PortableTextProps } from "@portabletext/react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERY_RESULT } from "@/sanity.types";
import { createCustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";
import { type DataAttribute, innerCss as css, SourceButtons, SourceImage } from "./maplewood-inner";

type CtaBannerProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "ctaBanner" }
> & { dataAttribute?: DataAttribute };

const bodyComponents: PortableTextProps["components"] = {
  block: { normal: ({ children }) => <p>{children}</p> },
  marks: { customLink: createCustomLinkMarkRenderer(css.cardLink) },
};

/** Green call-to-action card with a photo (Webflow cta39). */
export default function CtaCard({ _key, background, body, buttons, dataAttribute, description, image, title }: CtaBannerProps) {
  if (!title) return null;
  const headingId = `cta-card-${stegaClean(_key)}-title`;
  return (
    <section
      aria-labelledby={headingId}
      className={[css.section, stegaClean(background) === "cream" ? css.cream : css.white].join(" ")}
    >
      <div className={[css.container, css.ctaCard].join(" ")}>
        <div className={css.ctaContent}>
          <h2 className={[css.h2, css.ctaTitle].join(" ")} data-sanity={dataAttribute?.("title")} id={headingId}>
            {title}
          </h2>
          {body?.length ? (
            <div className={[css.copy, css.medium].join(" ")} data-sanity={dataAttribute?.("body")}>
              <PortableText components={bodyComponents} value={body} />
            </div>
          ) : stegaClean(description)?.trim() ? (
            <p className={css.medium} data-sanity={dataAttribute?.("description")}>
              {description}
            </p>
          ) : null}
          <div className={css.ctaButtons}>
            <SourceButtons buttons={buttons} dataAttribute={dataAttribute} onDark />
          </div>
        </div>
        <div className={css.ctaImage} data-sanity={dataAttribute?.("image")}>
          <SourceImage image={image} />
        </div>
      </div>
    </section>
  );
}
