import { groq } from "next-sanity";
import {
  contentActionsProjection,
  iconProjection,
  taglineProjection,
} from "./shared/maplewood";
import { simpleRichTextQuery } from "./shared/simple-rich-text";

// @sanity-typegen-ignore
export const pricingCardsQuery = groq`
  _type == "pricingCards" => {
    anchorId,
    ${taglineProjection},
    title,
    description,
    intro[]{${simpleRichTextQuery}},
    checklists[]{_key, title, ${iconProjection}, accent, items[]{${simpleRichTextQuery}}},
    checklistNote[]{${simpleRichTextQuery}},
    plans[]{_key, ${iconProjection}, accent, title, price, details[]{${simpleRichTextQuery}}, ${contentActionsProjection}}
  }
`;
