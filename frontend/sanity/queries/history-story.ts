import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
} from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { richTextContentQuery } from "./shared/rich-text-content";

// @sanity-typegen-ignore
export const historyStoryQuery = groq`
  _type == "historyStory" => {
    title,
    description,
image{${imageQuery}}, body[]{${richTextContentQuery}}, ${contentCardsProjection}, ${contentActionsProjection}
  }
`;
