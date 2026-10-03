import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { minimalRichTextQuery } from "./shared/minimal-rich-text";

// @sanity-typegen-ignore
export const bigImageListQuery = groq`
  _type == "bigImageList" => {
    eyebrow,
    title[]{
      ${minimalRichTextQuery}
    },
    intro,
    "stops": array::compact(stops[]{
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
