import { groq } from "next-sanity";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const richTextBlockQuery = groq`
  _type == "richTextBlock" => {
    eyebrow,
    title,
    richText[]{
      ${richTextContentQuery}
    }
  }
`;
