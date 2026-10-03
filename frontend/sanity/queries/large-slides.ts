import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { minimalRichTextQuery } from "./shared/minimal-rich-text";

// @sanity-typegen-ignore
export const largeSlidesQuery = groq`
  _type == "largeSlides" => {
    eyebrow,
    title[]{
      ${minimalRichTextQuery}
    },
    intro,
    "slides": array::compact(slides[]{
      _key,
      label,
      time,
      text,
      image {
        ${imageQuery}
      }
    })
  }
`;
