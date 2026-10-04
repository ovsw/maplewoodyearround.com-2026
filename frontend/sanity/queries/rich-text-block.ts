import { groq } from "next-sanity";
import { taglineProjection } from "./shared/maplewood";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const richTextBlockQuery = groq`
  _type == "richTextBlock" => {
    anchorId,
    ${taglineProjection},
    align,
    title,
    richText[]{
      ${richTextContentQuery}
    }
  }
`;
