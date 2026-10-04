import { groq } from "next-sanity";
import {
  contentActionsProjection,
  contentCardsProjection,
  iconProjection,
  taglineProjection,
} from "./shared/maplewood";
import { imageQuery } from "./shared/image";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const electiveCardsQuery = groq`
  _type == "electiveCards" => {
    anchorId,
    ${taglineProjection},
    title,
    description,
    content[]{${simpleRichTextQuery}},
    features[]{
      _key, ${iconProjection}, accent, title,
      body[]{${simpleRichTextQuery}}
    },
    image{${imageQuery}},
${contentCardsProjection}, ${contentActionsProjection}
  }
`;
