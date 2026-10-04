import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
  iconProjection,
  taglineProjection,
} from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";
import { imageQuery } from "./shared/image";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const historyStoryQuery = groq`
  _type == "historyStory" => {
    anchorId,
    ${taglineProjection},
    features[]{
      _key, ${iconProjection}, accent, title,
      body[]{${simpleRichTextQuery}}
    },
    title,
    description,
image{${imageQuery}}, body[]{${richTextContentQuery}}, ${contentCardsProjection}, ${contentActionsProjection}
  }
`;
